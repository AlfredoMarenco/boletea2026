<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeatingMap;
use App\Models\Venue;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SeatingMapController extends Controller
{
    public function index()
    {
        $seatingMaps = SeatingMap::with('venue')
            ->select('id', 'name', 'venue_id', 'is_active', 'created_at', 'updated_at')
            ->latest()
            ->get();

        $venues = Venue::select('id', 'name')->get();

        return Inertia::render('Admin/SeatingMaps/Index', [
            'seatingMaps' => $seatingMaps,
            'venues' => $venues,
        ]);
    }

    public function create()
    {
        $venues = Venue::all();

        return Inertia::render('Admin/SeatingMaps/Create', [
            'venues' => $venues,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'venue_id' => 'required|exists:venues,id',
        ]);

        $seatingMap = SeatingMap::create([
            'name' => $validated['name'],
            'venue_id' => $validated['venue_id'],
            'layout_json' => [
                'nodes' => [],
                'config' => [
                    'width' => 1200,
                    'height' => 800,
                    'gridSize' => 20,
                ],
            ],
        ]);

        return redirect()->route('admin.seating-maps.edit', $seatingMap->id);
    }

    public function edit(SeatingMap $seatingMap)
    {
        $seatingMap->load('venue');

        if (isset($seatingMap->layout_json['nodes'])) {
            $firstSeat = collect($seatingMap->layout_json['nodes'])->firstWhere('type', 'seat');
            if ($firstSeat) {
                $x = $firstSeat['x'] ?? 'N/A';
                $y = $firstSeat['y'] ?? 'N/A';
                \Log::debug("[BACKEND EDIT LOAD] SeatingMapController edit called for ID {$seatingMap->id}. First seat ID: {$firstSeat['id']}, x: {$x}, y: {$y}");
            }
        }

        return Inertia::render('Admin/SeatingMaps/Builder', [
            'seatingMap' => $seatingMap,
        ]);
    }

    public function update(Request $request, SeatingMap $seatingMap)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'layout_json' => 'sometimes|required|array',
        ]);

        if (isset($validated['layout_json']['nodes'])) {
            $firstSeat = collect($validated['layout_json']['nodes'])->firstWhere('type', 'seat');
            if ($firstSeat) {
                $x = $firstSeat['x'] ?? 'N/A';
                $y = $firstSeat['y'] ?? 'N/A';
                \Log::debug("[BACKEND UPDATE] SeatingMapController update called for ID {$seatingMap->id}. First seat ID: {$firstSeat['id']}, x: {$x}, y: {$y}");
            }
        }

        $seatingMap->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Map updated successfully']);
        }

        return back();
    }

    public function destroy(SeatingMap $seatingMap)
    {
        $seatingMap->delete();

        return redirect()->route('admin.seating-maps.index');
    }

    public function export(SeatingMap $seatingMap)
    {
        $layout = $seatingMap->layout_json ?? ['nodes' => [], 'config' => []];

        // Convertir imagen local a Base64 si existe bgImageUrl y no está ya en Base64
        if (! empty($layout['config']['bgImageUrl']) && empty($layout['config']['bgImageData'])) {
            $url = $layout['config']['bgImageUrl'];
            $relativeStoragePath = str_replace('/storage/', '', parse_url($url, PHP_URL_PATH));
            if (\Storage::disk('public')->exists($relativeStoragePath)) {
                $fullPath = \Storage::disk('public')->path($relativeStoragePath);
                $mime = mime_content_type($fullPath) ?: 'image/png';
                $base64 = 'data:'.$mime.';base64,'.base64_encode(file_get_content($fullPath));
                $layout['config']['bgImageData'] = $base64;
            }
        }

        $exportData = [
            'version' => '1.0',
            'exported_at' => now()->toIso8601String(),
            'map_info' => [
                'name' => $seatingMap->name,
            ],
            'layout_json' => $layout,
        ];

        $fileName = \Str::slug($seatingMap->name ?: 'mapa').'-seating-map.json';

        return response()->streamDownload(function () use ($exportData) {
            echo json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, $fileName, [
            'Content-Type' => 'application/json',
        ]);
    }

    public function import(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'venue_id' => 'required|exists:venues,id',
            'map_file' => 'required|file|mimes:json,txt',
        ]);

        $content = file_get_contents($request->file('map_file')->getRealPath());
        $data = json_decode($content, true);

        if (! $data || ! is_array($data) || ! isset($data['layout_json'])) {
            return back()->withErrors(['map_file' => 'El archivo JSON proporcionado no tiene una estructura de mapa válida.']);
        }

        $layoutJson = $data['layout_json'];

        // Si viene imagen en Base64, guardarla en el servidor remoto
        if (! empty($layoutJson['config']['bgImageData'])) {
            try {
                $base64Data = $layoutJson['config']['bgImageData'];
                if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                    $dataStr = substr($base64Data, strpos($base64Data, ',') + 1);
                    $ext = strtolower($type[1]);
                    if (! in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
                        $ext = 'png';
                    }
                    $imageData = base64_decode($dataStr);
                    if ($imageData !== false) {
                        $fileName = 'imported_map_bg_'.\Str::random(12).'.'.$ext;
                        $path = 'seating_maps/'.$fileName;
                        \Storage::disk('public')->put($path, $imageData);
                        $layoutJson['config']['bgImageUrl'] = \Storage::disk('public')->url($path);
                    }
                }
            } catch (\Exception $e) {
                \Log::error('Error guardando imagen de fondo de mapa importado: '.$e->getMessage());
            }
        }

        $seatingMap = SeatingMap::create([
            'name' => $validated['name'],
            'venue_id' => $validated['venue_id'],
            'layout_json' => $layoutJson,
            'is_active' => true,
        ]);

        return redirect()->route('admin.seating-maps.edit', $seatingMap->id)
            ->with('success', 'Mapa importado exitosamente.');
    }
}
