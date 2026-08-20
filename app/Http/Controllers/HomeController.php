<?php

namespace App\Http\Controllers;

use App\Helpers\DistanceCalculator;
use App\Models\Category;
use App\Models\Event;
use App\Models\ExternalEvent;
use App\Models\SiteSetting;
use App\Models\Venue;
use App\Models\WelcomeBanner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        // 1. Base Query for External Events
        $baseExternalQuery = ExternalEvent::with(['venue', 'categories', 'state', 'cityLocation'])
            ->where('status', 'published')
            ->whereDoesntHave('parentEvents')
            ->where(function ($q) {
                $q->where(function ($sq) {
                    $sq->whereNull('end_date')
                        ->where('start_date', '>=', now()->startOfDay());
                })->orWhere('end_date', '>=', now()->startOfDay());
            });

        // 2. Base Query for Local Events
        $baseLocalQuery = Event::with(['venue'])
            ->where('status', 'published')
            ->where('start_date', '>=', now()->startOfDay());

        // --- Fetch & Map Carousel Events ---
        $externalCarousel = (clone $baseExternalQuery)
            ->orderByDesc('is_featured')
            ->orderBy('start_date', 'asc')
            ->take(15)
            ->get();

        $localCarousel = (clone $baseLocalQuery)
            ->orderBy('start_date', 'asc')
            ->take(10)
            ->get();

        $carouselEvents = $externalCarousel->map(fn ($e) => $this->mapEvent($e, false))
            ->merge($localCarousel->map(fn ($e) => $this->mapEvent($e, true)))
            ->sortBy(function ($e) {
                return [
                    ! ($e['is_featured'] ?? false),
                    $e['start_date'],
                ];
            })
            ->take(15)
            ->values();

        $settings = SiteSetting::all()->pluck('value', 'key');
        $showFeatured = ($settings['show_featured_events'] ?? '1') === '1';
        $showNearby = ($settings['show_nearby_events'] ?? '1') === '1';

        // --- Fetch & Map Featured Events ---
        $featuredEvents = collect();
        if ($showFeatured) {
            $featuredExternal = (clone $baseExternalQuery)
                ->where('is_featured', true)
                ->orderBy('start_date', 'asc')
                ->get();

            // Local events don't have is_featured column, but we could mark all published ones or default to none
            $featuredEvents = $featuredExternal->map(fn ($e) => $this->mapEvent($e, false))->values();
        }

        // --- Main Grid (Filtered Events) ---
        $queryExt = clone $baseExternalQuery;
        $queryLoc = clone $baseLocalQuery;

        // Apply Filters for Search
        if ($request->filled('search')) {
            $term = $request->search;
            $queryExt->where('title', 'like', '%'.$term.'%');
            $queryLoc->where('name', 'like', '%'.$term.'%');
        }
        if ($request->filled('city')) {
            $city = $request->city;
            $queryExt->where('city', $city);
            // Local events check if venue address matches city
            $queryLoc->whereHas('venue', function ($q) use ($city) {
                $q->where('address', 'like', '%'.$city.'%');
            });
        }
        if ($request->filled('venue_id')) {
            $venueId = $request->venue_id;
            $queryExt->where('venue_id', $venueId);
            $queryLoc->where('venue_id', $venueId);
        }
        if ($request->filled('category') && $request->category !== 'all') {
            $cat = $request->category;
            $queryExt->whereHas('categories', function ($q) use ($cat) {
                $q->where('name', $cat);
            });
            // Local events category check (local events don't strictly have categories relation in schema yet)
            $queryLoc->whereRaw('0 = 1'); // don't match any for now
        }
        if ($request->filled('date_start') && $request->filled('date_end')) {
            $start = $request->date_start;
            $end = $request->date_end;
            $queryExt->where(function ($q) use ($start, $end) {
                $q->where(function ($sq) use ($start, $end) {
                    $sq->whereNotNull('end_date')
                        ->where('start_date', '<=', $end)
                        ->where('end_date', '>=', $start);
                })->orWhere(function ($sq) use ($start, $end) {
                    $sq->whereNull('end_date')
                        ->whereBetween('start_date', [$start, $end]);
                });
            });

            $queryLoc->whereBetween('start_date', [$start, $end]);
        }

        $allExternal = $queryExt->orderBy('start_date', 'asc')->get();
        $allLocal = $queryLoc->orderBy('start_date', 'asc')->get();

        $allEvents = $allExternal->map(fn ($e) => $this->mapEvent($e, false))
            ->merge($allLocal->map(fn ($e) => $this->mapEvent($e, true)))
            ->sortBy('start_date')
            ->values();

        // --- Fetch & Map Nearby Events ---
        $nearbyEvents = collect();
        $userLocation = session('user_location');

        $hasFilters = $request->filled('search') ||
            $request->filled('city') ||
            $request->filled('venue_id') ||
            ($request->filled('category') && $request->category !== 'all') ||
            ($request->filled('date_start') && $request->filled('date_end'));

        if ($showNearby && ! $hasFilters && $userLocation) {
            $userLat = $userLocation['lat'] ?? null;
            $userLng = $userLocation['lng'] ?? null;

            if ($userLat && $userLng) {
                $potentialExternal = (clone $baseExternalQuery)->get();
                $potentialLocal = (clone $baseLocalQuery)->get();

                $potentialNearby = $potentialExternal->map(fn ($e) => $this->mapEvent($e, false))
                    ->merge($potentialLocal->map(fn ($e) => $this->mapEvent($e, true)));

                // Calculate distances for all potential events
                $eventsWithDistance = $potentialNearby->map(function ($event) use ($userLat, $userLng) {
                    $lat = $event['venue']['latitude'] ?? null;
                    $lng = $event['venue']['longitude'] ?? null;

                    if ($lat && $lng) {
                        $distance = DistanceCalculator::haversine($userLat, $userLng, $lat, $lng);
                        $event['distance_km'] = round($distance, 1);

                        return $event;
                    }

                    return null;
                })->filter()->sortBy('distance_km')->values();

                // First priority: Events strictly within 40km
                $strictNearby = $eventsWithDistance->filter(function ($event) {
                    return $event['distance_km'] <= 40;
                });

                if ($strictNearby->count() < 4) {
                    $nearbyEvents = $eventsWithDistance->take(4);
                } else {
                    $nearbyEvents = $strictNearby->take(4);
                }
            }
        }

        // Options for filters
        $cities = ExternalEvent::where('status', 'published')->distinct()->pluck('city')->filter()->values();
        $venues = Venue::whereNotNull('latitude')->whereNotNull('longitude')->select('id', 'name')->get();
        $categories = Category::has('externalEvents')->pluck('name');

        $showFloatingBanner = ($settings['show_floating_banner'] ?? '1') === '1';

        // 4. Random Banner (From WelcomeBanner model)
        $bannerEvent = null;
        if ($showFloatingBanner) {
            $bannerEvent = WelcomeBanner::with('event')
                ->where('is_active', true)
                ->inRandomOrder()
                ->first();

            if ($bannerEvent) {
                $bannerEvent->append(['resolved_image', 'resolved_link', 'resolved_title']);
            }
        }

        return Inertia::render('Welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'events' => $allEvents,
            'nearbyEvents' => $nearbyEvents,
            'featuredEvents' => $featuredEvents,
            'carouselEvents' => $carouselEvents,
            'bannerEvent' => $bannerEvent,
            'showFeatured' => $showFeatured,
            'showNearby' => $showNearby,
            'filters' => $request->all(['search', 'city', 'venue_id', 'category', 'date_start', 'date_end']),
            'options' => [
                'cities' => $cities,
                'venues' => $venues,
                'categories' => $categories,
            ],
        ])->withViewData([
            'meta' => [
                'title' => 'Inicio - Boletea',
                'description' => 'Descubre los mejores conciertos, festivales y obras de teatro en tu ciudad con Boletea. Compra tus boletos de forma segura y vive la experiencia.',
                'image' => asset('logo.ico'),
                'url' => route('home'),
            ],
        ]);
    }

    /**
     * Map events (external or local) to a unified shape.
     */
    private function mapEvent($event, bool $isLocal = false): array
    {
        if ($isLocal) {
            return [
                'id' => $event->id,
                'title' => $event->name,
                'slug' => $event->slug,
                'description' => $event->description,
                'start_date' => $event->start_date ? $event->start_date->toIso8601String() : null,
                'end_date' => $event->end_date ? $event->end_date->toIso8601String() : null,
                'image_path' => $event->image_path ? asset('storage/'.$event->image_path) : null,
                'status' => $event->status,
                'venue' => $event->venue ? [
                    'id' => $event->venue->id,
                    'name' => $event->venue->name,
                    'address' => $event->venue->address,
                    'latitude' => $event->venue->latitude,
                    'longitude' => $event->venue->longitude,
                ] : null,
                'categories' => [],
                'is_local_event' => true,
                'redirect_external' => false,
                'is_featured' => false,
            ];
        }

        return [
            'id' => $event->id,
            'title' => $event->title,
            'slug' => $event->slug,
            'description' => $event->description,
            'start_date' => $event->start_date ? $event->start_date->toIso8601String() : null,
            'end_date' => $event->end_date ? $event->end_date->toIso8601String() : null,
            'image_path' => $event->image_path ? asset($event->image_path) : null,
            'status' => $event->status,
            'venue' => $event->venue ? [
                'id' => $event->venue->id,
                'name' => $event->venue->name,
                'address' => $event->venue->address,
                'latitude' => $event->venue->latitude,
                'longitude' => $event->venue->longitude,
            ] : null,
            'categories' => $event->categories ? $event->categories->map(fn ($c) => ['name' => $c->name])->toArray() : [],
            'is_local_event' => false,
            'redirect_external' => (bool) $event->redirect_external,
            'performance_url' => $event->performance_url,
            'is_featured' => (bool) $event->is_featured,
        ];
    }
}
