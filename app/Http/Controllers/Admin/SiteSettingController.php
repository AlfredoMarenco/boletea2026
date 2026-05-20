<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExternalEvent;
use App\Models\SiteSetting;
use App\Models\WelcomeBanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SiteSettingController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::all()->pluck('value', 'key');

        $events = ExternalEvent::where('status', 'published')
            ->whereDate('start_date', '>=', now()->toDateString())
            ->orderBy('start_date', 'asc')
            ->select('id', 'title', 'start_date')
            ->get();

        $banners = WelcomeBanner::with('event')->orderBy('created_at', 'desc')->get();
        // Option append resolved to the whole collection
        $banners->each->append(['resolved_image', 'resolved_link', 'resolved_title']);

        $postback_urls = \App\Models\PostbackUrl::orderBy('name')->get();

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'events' => $events,
            'banners' => $banners,
            'postback_urls' => $postback_urls,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'show_featured_events' => 'boolean',
            'show_nearby_events' => 'boolean',
            'show_floating_banner' => 'boolean',
            'floating_banner_type' => 'nullable|in:manual,event',
            'floating_banner_link' => 'nullable|string',
            'floating_banner_event_id' => 'nullable|exists:external_events,id',
        ]);

        SiteSetting::updateOrCreate(
            ['key' => 'show_featured_events'],
            ['value' => $request->boolean('show_featured_events') ? '1' : '0']
        );

        SiteSetting::updateOrCreate(
            ['key' => 'show_nearby_events'],
            ['value' => $request->boolean('show_nearby_events') ? '1' : '0']
        );

        SiteSetting::updateOrCreate(
            ['key' => 'show_floating_banner'],
            ['value' => $request->boolean('show_floating_banner') ? '1' : '0']
        );

        if ($request->has('floating_banner_type')) {
            SiteSetting::updateOrCreate(
                ['key' => 'floating_banner_type'],
                ['value' => $validated['floating_banner_type']]
            );
        }

        if ($request->has('floating_banner_link')) {
            SiteSetting::updateOrCreate(
                ['key' => 'floating_banner_link'],
                ['value' => $validated['floating_banner_link']]
            );
        }

        if ($request->has('floating_banner_event_id')) {
            SiteSetting::updateOrCreate(
                ['key' => 'floating_banner_event_id'],
                ['value' => $validated['floating_banner_event_id']]
            );
        }

        if ($request->hasFile('floating_banner_image')) {
            $request->validate(['floating_banner_image' => 'image|max:10240']);
            $oldImage = SiteSetting::where('key', 'floating_banner_image')->first();
            if ($oldImage && $oldImage->value && strpos($oldImage->value, '/storage/') === 0) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $oldImage->value));
            }

            $path = $request->file('floating_banner_image')->store('banners', 'public');

            SiteSetting::updateOrCreate(
                ['key' => 'floating_banner_image'],
                ['value' => '/storage/'.$path]
            );
        }

        return redirect()->back()->with('success', 'Configuración actualizada correctamente.');
    }
}
