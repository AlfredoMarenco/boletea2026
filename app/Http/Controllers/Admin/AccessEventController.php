<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessEvent;
use App\Models\ExternalEvent;
use App\Models\AccessCode;
use App\Models\AccessDevice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AccessEventController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $query = AccessEvent::with('externalEvent');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $events = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Admin/Access/Events/Index', [
            'events' => $events,
            'filters' => [
                'search' => $search,
            ]
        ]);
    }

    public function create()
    {
        $externalEvents = ExternalEvent::orderBy('title')->get(['id', 'title']);
        
        return Inertia::render('Admin/Access/Events/Create', [
            'externalEvents' => $externalEvents,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'external_event_id' => 'nullable|exists:external_events,id',
            'date' => 'nullable|date',
            'description' => 'nullable|string',
            'postback_url' => 'nullable|url',
            'status' => 'required|in:active,inactive',
        ]);

        AccessEvent::create($validated);

        return redirect()->route('admin.access.events.index')->with('success', 'Base de acceso creada correctamente.');
    }

    public function edit(AccessEvent $event)
    {
        $externalEvents = ExternalEvent::orderBy('title')->get(['id', 'title']);
        
        return Inertia::render('Admin/Access/Events/Edit', [
            'event' => $event,
            'externalEvents' => $externalEvents,
        ]);
    }

    public function update(Request $request, AccessEvent $event)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'external_event_id' => 'nullable|exists:external_events,id',
            'date' => 'nullable|date',
            'description' => 'nullable|string',
            'postback_url' => 'nullable|url',
            'status' => 'required|in:active,inactive',
        ]);

        $event->update($validated);

        return redirect()->route('admin.access.events.index')->with('success', 'Base de acceso actualizada.');
    }

    public function destroy(AccessEvent $event)
    {
        $event->delete();
        return redirect()->route('admin.access.events.index')->with('success', 'Base de acceso eliminada.');
    }

    public function codes(AccessEvent $event, Request $request)
    {
        $search = $request->input('search');
        $query = $event->codes();

        if ($search) {
            $query->where('code', 'like', "%{$search}%");
        }

        $codes = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/Access/Events/Codes', [
            'event' => $event,
            'codes' => $codes,
            'filters' => ['search' => $search]
        ]);
    }

    public function stats(AccessEvent $event)
    {
        $stats = [
            'total' => $event->codes()->count(),
            'used' => $event->codes()->where('status', 'used')->count(),
            'pending' => $event->codes()->where('status', 'pending')->count(),
            'logs_count' => $event->logs()->count(),
            'recent_logs' => $event->logs()->with(['code', 'device'])->latest()->limit(10)->get(),
        ];

        return Inertia::render('Admin/Access/Events/Stats', [
            'event' => $event,
            'stats' => $stats,
        ]);
    }

    public function storeCode(Request $request, AccessEvent $event)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'owner' => 'nullable|string|max:255',
            'details' => 'nullable|string|max:255',
            'row' => 'nullable|string|max:50',
            'seat' => 'nullable|string|max:50',
        ]);

        $event->codes()->create([
            'code' => $validated['code'],
            'type' => $validated['type'],
            'status' => 'pending',
            'metadata' => [
                'owner' => $validated['owner'] ?? '',
                'details' => $validated['details'] ?? '',
                'row' => $validated['row'] ?? '',
                'seat' => $validated['seat'] ?? '',
                'manual_entry' => true,
                'created_at' => now()->toDateTimeString(),
            ]
        ]);

        return redirect()->back()->with('success', 'Código añadido correctamente a la base.');
    }

    public function import(Request $request, AccessEvent $event)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        
        $handle = fopen($path, 'r');
        
        $count = 0;
        $batch = [];
        
        while (($row = fgetcsv($handle)) !== false) {
            if (empty($row[0])) continue;
            if (str_contains($row[0], 'Codigo') || str_contains($row[0], 'Código')) continue;

            $batch[] = [
                'access_event_id' => $event->id,
                'code' => $row[0],
                'type' => $row[3] ?? 'General',
                'metadata' => json_encode([
                    'owner' => mb_convert_encoding($row[1] ?? '', 'UTF-8', 'auto'),
                    'details' => mb_convert_encoding($row[2] ?? '', 'UTF-8', 'auto'),
                    'row' => mb_convert_encoding($row[4] ?? '', 'UTF-8', 'auto'),
                    'seat' => mb_convert_encoding($row[5] ?? '', 'UTF-8', 'auto'),
                    'price' => mb_convert_encoding($row[6] ?? '', 'UTF-8', 'auto'),
                    'order_id' => mb_convert_encoding($row[7] ?? '', 'UTF-8', 'auto'),
                    'source' => mb_convert_encoding($row[8] ?? '', 'UTF-8', 'auto'),
                    'external_event_id' => mb_convert_encoding($row[9] ?? '', 'UTF-8', 'auto'),
                ], JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE),
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            $count++;
            
            if (count($batch) >= 500) {
                AccessCode::insert($batch);
                $batch = [];
            }
        }
        
        if (!empty($batch)) {
            AccessCode::insert($batch);
        }
        
        fclose($handle);
        
        return redirect()->back()->with('success', "Se han importado {$count} códigos correctamente siguiendo la estructura de Boletea.");
    }

    public function logs(AccessEvent $event)
    {
        $logs = $event->logs()
            ->with(['device', 'code'])
            ->orderBy('scanned_at', 'desc')
            ->paginate(100);

        return Inertia::render('Admin/Access/Events/Logs', [
            'event' => $event,
            'logs' => $logs,
        ]);
    }

    public function postbackLogs(AccessEvent $event)
    {
        $logs = \App\Models\AccessPostbackLog::where('access_event_id', $event->id)
            ->orderBy('scanned_at', 'desc')
            ->paginate(100);

        return Inertia::render('Admin/Access/Events/PostbackLogs', [
            'event' => $event,
            'logs' => $logs,
        ]);
    }

    public function devices(AccessEvent $event)
    {
        $sections = DB::table('access_codes')
            ->where('access_event_id', $event->id)
            ->whereNotNull('metadata')
            ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.details')) as section")
            ->distinct()
            ->pluck('section')
            ->filter(fn($val) => !is_null($val) && $val !== '' && $val !== 'null')
            ->values();

        $devices = AccessDevice::orderBy('name')->get();

        $assignments = $event->devices()->get()->mapWithKeys(function ($device) {
            $allowed = $device->configuration->allowed_sections;
            return [$device->id => $allowed ? json_decode($allowed, true) : []];
        });

        return Inertia::render('Admin/Access/Events/Devices', [
            'event' => $event,
            'sections' => $sections,
            'devices' => $devices,
            'assignments' => $assignments,
        ]);
    }

    public function assignDevice(Request $request, AccessEvent $event)
    {
        $request->validate([
            'device_id' => 'required|exists:access_devices,id',
            'sections' => 'nullable|array',
        ]);

        $sections = $request->sections;

        if (empty($sections)) {
            $event->devices()->syncWithoutDetaching([
                $request->device_id => ['allowed_sections' => null]
            ]);
        } else {
            $event->devices()->syncWithoutDetaching([
                $request->device_id => ['allowed_sections' => json_encode($sections)]
            ]);
        }

        return redirect()->back()->with('success', 'Configuración de puertas actualizada.');
    }
    public function clearCodes(AccessEvent $event)
    {
        $event->codes()->delete();
        
        return back()->with('success', 'Base de datos de códigos vaciada correctamente. Los reportes de escaneo se han conservado.');
    }

    public function updateCodeStatus(AccessEvent $event, AccessCode $code, Request $request)
    {
        $request->validate([
            'status' => 'required|in:pending,used,cancelled'
        ]);

        $code->update(['status' => $request->status]);

        return back()->with('success', 'Estado del código actualizado.');
    }

    public function deleteCode(AccessEvent $event, AccessCode $code)
    {
        $code->delete();

        return back()->with('success', 'Código eliminado correctamente.');
    }
}
