<?php

namespace App\Services;

use App\Models\ExternalEvent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Venue;

class EventImportService
{
    /**
     * Import events from the external API (Mocking for now).
     *
     * @return array
     */
    public function importEvents()
    {
        $url = 'https://boletea.com.mx/UpcomingEventPerformanceJSON.asp';
        Log::info("Starting sync from $url");

        try {
            $response = Http::get($url);

            if ($response->failed()) {
                Log::error('Failed to fetch events from Boletea API', ['status' => $response->status()]);
                return ['success' => false, 'count' => 0, 'message' => 'Error al conectar con la API de Boletea. Status: ' . $response->status()];
            }

            $body = $response->body();
            // Remove BOM
            $body = trim($body, "\xEF\xBB\xBF");
            // Fix trailing commas
            $body = preg_replace('/,\s*\]/', ']', $body);
            $body = preg_replace('/,\s*\}/', '}', $body); // Also fix objects just in case

            $data = json_decode($body, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON Decode Error: ' . json_last_error_msg());
                // Try converting encoding as last resort
                $body = mb_convert_encoding($body, 'UTF-8', 'ISO-8859-1');
                $data = json_decode($body, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    return ['success' => false, 'count' => 0, 'message' => 'Error decodificando JSON: ' . json_last_error_msg()];
                }
            }

            $count = 0;

            $groupedEvents = [];

            foreach ($data as $item) {
                if (!isset($item['Event']) || empty($item['Event'])) {
                    continue;
                }

                $eventData = $item['Event'][0];
                $eventId = $eventData['EventID'] ?? null;

                if (!$eventId)
                    continue;

                if (!isset($groupedEvents[$eventId])) {
                    $groupedEvents[$eventId] = [
                        'meta' => $eventData,
                        'performances' => []
                    ];
                }
                $groupedEvents[$eventId]['performances'][] = $eventData;
            }

            $count = 0;

            foreach ($groupedEvents as $eventId => $group) {
                $eventData = $group['meta'];
                $performances = $group['performances'];

                // Find earliest start date and latest end date across all performances
                $startDate = null;
                $endDate = null;
                $earliest = null;
                $latest = null;

                foreach ($performances as $perf) {
                    if (!empty($perf['PerformanceDateTime'])) {
                        try {
                            $dt = \Carbon\Carbon::createFromFormat('n/j/Y g:i:s A', $perf['PerformanceDateTime']);
                            if ($earliest === null || $dt->lt($earliest)) {
                                $earliest = clone $dt;
                                $startDate = $earliest->format('Y-m-d H:i:s');
                            }
                            // Fallback for latest if EndDateTime is missing
                            if (empty($perf['PerformanceEndDateTime'])) {
                                if ($latest === null || $dt->gt($latest)) {
                                    $latest = clone $dt;
                                    $endDate = $latest->format('Y-m-d H:i:s');
                                }
                            }
                        } catch (\Exception $e) {
                            // ignore
                        }
                    }

                    if (!empty($perf['PerformanceEndDateTime'])) {
                        try {
                            $dtEnd = \Carbon\Carbon::createFromFormat('n/j/Y g:i:s A', $perf['PerformanceEndDateTime']);
                            if ($latest === null || $dtEnd->gt($latest)) {
                                $latest = clone $dtEnd;
                                $endDate = $latest->format('Y-m-d H:i:s');
                            }
                        } catch (\Exception $e) {
                            // ignore
                        }
                    }
                }

                // Sync Venue
                $venueName = $eventData['VenueName'] ?? null;
                $venueId = null;
                if (!empty($venueName)) {
                    $venue = \App\Models\Venue::firstOrCreate(
                    ['name' => $venueName],
                    [
                        // 'city' => $eventData['VenueCity'] ?? null,  // Removed as per user request
                        // 'state' => $eventData['VenueStateProvince'] ?? null, // Removed as per user request
                        'external_id' => $eventData['VenueId'] ?? null,
                    ]
                    );
                    $venueId = $venue->id;
                }

                $externalEvent = ExternalEvent::firstOrNew(['external_id' => $eventId]);

                // Always update system/logistics fields
                $externalEvent->venue_id = $venueId;
                $externalEvent->raw_data = $performances;

                // Sync API Image if local image is empty (fallback)
                if (empty($externalEvent->image_path) && isset($eventData['EventImage']) && !empty($eventData['EventImage'])) {
                    $externalEvent->image_path = $eventData['EventImage'];
                }

                // Always sync dates so multi-function events stay visible until their last performance
                $externalEvent->start_date = $startDate;
                $externalEvent->end_date = $endDate;

                // Only update content fields if new (preserve manual edits)
                if (!$externalEvent->exists) {
                    $externalEvent->title = $eventData['EventName'] ?? $eventData['PerformanceName'] ?? 'No Title';
                    $externalEvent->description = !empty($eventData['EventDescription']) ? $eventData['EventDescription'] : ($eventData['PerformanceDescription'] ?? '');
                    $externalEvent->city = $eventData['VenueCity'] ?? $eventData['VenueStateProvince'] ?? '';
                    $externalEvent->sales_centers = ['Boletea', $eventData['VenueName'] ?? 'Taquilla'];
                    $externalEvent->status = $eventData['PerformanceStatus'] ?? 'draft';
                    $externalEvent->performance_url = $eventData['PerformanceURL'] ?? null;
                }

                $externalEvent->save();

                // Sync Category
                $categoryName = $eventData['EventCategory'] ?? null;
                if (!empty($categoryName)) {
                    $category = \App\Models\Category::firstOrCreate(
                    ['name' => $categoryName],
                    ['slug' => Str::slug($categoryName)]
                    );

                    // Sync the relationship (using syncWithoutDetaching to avoid duplicates if run multiple times)
                    $externalEvent->categories()->syncWithoutDetaching([$category->id]);
                }
                $count++;
            }

            return ['success' => true, 'count' => $count, 'message' => "Se han sincronizado $count eventos."];
        }
        catch (\Exception $e) {
            Log::error('Error importing events: ' . $e->getMessage());
            return ['success' => false, 'count' => 0, 'message' => 'Error durante la importación: ' . $e->getMessage()];
        }
    }
}