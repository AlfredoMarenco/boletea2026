<?php

namespace App\Services;

use App\Models\ExternalEvent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EventImportService
{
    /**
     * Import events from the external API (Mocking for now).
     *
     * @return int Count of events imported/updated
     */
    public function importEvents()
    {
        $url = 'https://boletea.com.mx/UpcomingEventPerformanceJSON.asp';
        Log::info("Starting sync from $url");

        try {
            $response = Http::get($url);

            if ($response->failed()) {
                Log::error('Failed to fetch events from Boletea API', ['status' => $response->status()]);
                return 0;
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
                    return 0;
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

                if (!$eventId) continue;

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

                // Sort performances by date to find the earliest start date if needed, 
                // or just use the meta one. But strictly speaking, an Event might just span dates.

                // Parse Date (use the first one or earliest)
                $startDate = null;
                if (!empty($eventData['PerformanceDateTime'])) {
                    try {
                        $startDate = \Carbon\Carbon::createFromFormat('n/j/Y g:i:s A', $eventData['PerformanceDateTime'])->format('Y-m-d H:i:s');
                    } catch (\Exception $e) {
                        // ignore
                    }
                }

                ExternalEvent::firstOrCreate(
                    ['external_id' => $eventId],
                    [
                        'title' => $eventData['EventName'] ?? $eventData['PerformanceName'] ?? 'No Title',
                        'description' => !empty($eventData['EventDescription']) ? $eventData['EventDescription'] : ($eventData['PerformanceDescription'] ?? ''),
                        'city' => $eventData['VenueCity'] ?? $eventData['VenueStateProvince'] ?? '',
                        'category' => $eventData['EventCategory'] ?? 'General',
                        'image_path' => isset($eventData['EventImage']) ? preg_replace('/N\d+X\d+/', 'N500X400', $eventData['EventImage']) : '',
                        'start_date' => $startDate,
                        'sales_centers' => ['Boletea', $eventData['VenueName'] ?? 'Taquilla'],
                        'status' => $eventData['PerformanceStatus'] ?? 'draft',
                        'raw_data' => $performances, // Store all performances here
                    ]
                );
                $count++;
            }

            return $count;
        } catch (\Exception $e) {
            Log::error('Error importing events: ' . $e->getMessage());
            return 0;
        }
    }
}
