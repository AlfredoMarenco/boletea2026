<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\AccessDevice;
use App\Models\AccessDeviceGroup;
use App\Models\AccessEvent;
use App\Models\AccessPostbackLog;
use App\Models\ExternalEvent;
use App\Models\PostbackUrl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

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
            ],
        ]);
    }

    public function create()
    {
        $externalEvents = ExternalEvent::orderBy('title')->get(['id', 'title']);
        $postback_urls = PostbackUrl::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Access/Events/Create', [
            'externalEvents' => $externalEvents,
            'postbackUrls' => $postback_urls,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'external_event_id' => 'nullable|exists:external_events,id',
            'date' => 'nullable|date',
            'description' => 'nullable|string',
            'postback_url_id' => 'nullable|exists:postback_urls,id',
            'status' => 'required|in:active,inactive',
        ]);

        AccessEvent::create($validated);

        return redirect()->route('admin.access.events.index')->with('success', 'Base de acceso creada correctamente.');
    }

    public function edit(AccessEvent $event)
    {
        $externalEvents = ExternalEvent::orderBy('title')->get(['id', 'title']);
        $postback_urls = PostbackUrl::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Access/Events/Edit', [
            'event' => $event,
            'externalEvents' => $externalEvents,
            'postbackUrls' => $postback_urls,
        ]);
    }

    public function update(Request $request, AccessEvent $event)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'external_event_id' => 'nullable|exists:external_events,id',
            'date' => 'nullable|date',
            'description' => 'nullable|string',
            'postback_url_id' => 'nullable|exists:postback_urls,id',
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
        $status = $request->input('status');
        $type = $request->input('type');
        $sortBy = $request->input('sort_by', 'id');
        $sortOrder = $request->input('sort_order', 'desc');

        // Prevent SQL injection by validating sort field
        $allowedSorts = ['id', 'code', 'type', 'status', 'scanned_at'];
        if (! in_array($sortBy, $allowedSorts)) {
            $sortBy = 'id';
        }

        $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';

        $query = $event->codes();

        if ($search) {
            $query->where('code', 'like', "%{$search}%");
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($type) {
            $query->where('type', $type);
        }

        $query->orderBy($sortBy, $sortOrder);

        $codes = $query->paginate(50)->withQueryString();

        // Retrieve distinct code types for filtering in frontend
        $types = $event->codes()
            ->distinct()
            ->whereNotNull('type')
            ->where('type', '!=', '')
            ->pluck('type')
            ->values();

        return Inertia::render('Admin/Access/Events/Codes', [
            'event' => $event,
            'codes' => $codes,
            'types' => $types,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'type' => $type,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
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
            'code' => [
                'required',
                'string',
                'max:255',
                Rule::unique('access_codes', 'code')->where('access_event_id', $event->id),
            ],
            'type' => 'required|string|max:255',
            'owner' => 'nullable|string|max:255',
            'details' => 'nullable|string|max:255',
            'row' => 'nullable|string|max:50',
            'seat' => 'nullable|string|max:50',
        ], [
            'code.unique' => 'Este código ya existe en esta base de acceso.',
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
            ],
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

        $totalInserted = 0;
        $totalRows = 0;
        $batch = [];
        $existingInFile = [];

        while (($row = fgetcsv($handle)) !== false) {
            if (empty($row[0])) {
                continue;
            }
            if (str_contains($row[0], 'Codigo') || str_contains($row[0], 'Código')) {
                continue;
            }

            $totalRows++;
            $code = $row[0];

            // Skip if duplicate in the same file
            if (isset($existingInFile[$code])) {
                continue;
            }
            $existingInFile[$code] = true;

            $batch[] = [
                'access_event_id' => $event->id,
                'code' => $code,
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

            if (count($batch) >= 500) {
                $totalInserted += DB::table('access_codes')->insertOrIgnore($batch);
                $batch = [];
            }
        }

        if (! empty($batch)) {
            $totalInserted += DB::table('access_codes')->insertOrIgnore($batch);
        }

        fclose($handle);

        $skipped = $totalRows - $totalInserted;
        $message = "Se han procesado {$totalRows} registros: {$totalInserted} nuevos importados";
        if ($skipped > 0) {
            $message .= " y {$skipped} omitidos por ser duplicados.";
        } else {
            $message .= ' correctamente.';
        }

        return redirect()->back()->with('success', $message);
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
        $logs = AccessPostbackLog::where('access_event_id', $event->id)
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
            ->filter(fn ($val) => ! is_null($val) && $val !== '' && $val !== 'null')
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        $allDevices = AccessDevice::orderBy('name')->get();
        $groups = $event->groups()->orderBy('name')->get()->map(function ($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'allowed_sections' => $group->allowed_sections ?? [],
            ];
        });

        $assignedDevices = DB::table('access_device_event')
            ->where('access_event_id', $event->id)
            ->get()
            ->keyBy('access_device_id');

        $devices = $allDevices->map(function ($device) use ($assignedDevices) {
            $pivot = $assignedDevices->get($device->id);

            return [
                'id' => $device->id,
                'name' => $device->name,
                'device_identifier' => $device->device_identifier,
                'access_device_group_id' => $pivot ? $pivot->access_device_group_id : null,
                'allowed_sections' => $pivot && $pivot->allowed_sections ? json_decode($pivot->allowed_sections, true) : [],
            ];
        });

        return Inertia::render('Admin/Access/Events/Devices', [
            'event' => $event,
            'sections' => $sections,
            'devices' => $devices,
            'groups' => $groups,
        ]);
    }

    public function assignDevice(Request $request, AccessEvent $event)
    {
        $request->validate([
            'device_id' => 'required|exists:access_devices,id',
            'sections' => 'nullable|array',
        ]);

        $sections = $request->sections;

        DB::table('access_device_event')->updateOrInsert(
            ['access_event_id' => $event->id, 'access_device_id' => $request->device_id],
            [
                'allowed_sections' => empty($sections) ? null : json_encode($sections),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return redirect()->back()->with('success', 'Configuración de puertas actualizada.');
    }

    public function storeGroup(Request $request, AccessEvent $event)
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('access_device_groups')->where('access_event_id', $event->id),
            ],
            'description' => 'nullable|string|max:255',
        ]);

        $event->groups()->create([
            'name' => $request->name,
            'description' => $request->description,
            'allowed_sections' => [],
        ]);

        return redirect()->back()->with('success', 'Grupo creado correctamente.');
    }

    public function updateGroupSections(Request $request, AccessEvent $event, AccessDeviceGroup $group)
    {
        abort_if($group->access_event_id !== $event->id, 403);

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('access_device_groups')->where('access_event_id', $event->id)->ignore($group->id),
            ],
            'description' => 'nullable|string|max:255',
            'allowed_sections' => 'nullable|array',
        ]);

        $group->update([
            'name' => $request->name,
            'description' => $request->description,
            'allowed_sections' => $request->allowed_sections ?? [],
        ]);

        // Propagate to all devices in the group
        DB::table('access_device_event')
            ->where('access_event_id', $event->id)
            ->where('access_device_group_id', $group->id)
            ->update([
                'allowed_sections' => empty($request->allowed_sections) ? null : json_encode($request->allowed_sections),
                'updated_at' => now(),
            ]);

        return redirect()->back()->with('success', 'Grupo y dispositivos actualizados correctamente.');
    }

    public function destroyGroup(AccessEvent $event, AccessDeviceGroup $group)
    {
        abort_if($group->access_event_id !== $event->id, 403);

        $group->delete();

        return redirect()->back()->with('success', 'Grupo eliminado correctamente.');
    }

    public function moveDeviceToGroup(Request $request, AccessEvent $event)
    {
        $request->validate([
            'device_id' => 'required|exists:access_devices,id',
            'group_id' => 'nullable|exists:access_device_groups,id',
        ]);

        if ($request->group_id) {
            $group = AccessDeviceGroup::findOrFail($request->group_id);
            abort_if($group->access_event_id !== $event->id, 403);

            DB::table('access_device_event')->updateOrInsert(
                ['access_event_id' => $event->id, 'access_device_id' => $request->device_id],
                [
                    'access_device_group_id' => $group->id,
                    'allowed_sections' => empty($group->allowed_sections) ? null : json_encode($group->allowed_sections),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        } else {
            DB::table('access_device_event')
                ->where('access_event_id', $event->id)
                ->where('access_device_id', $request->device_id)
                ->update([
                    'access_device_group_id' => null,
                    'updated_at' => now(),
                ]);
        }

        return redirect()->back()->with('success', 'Dispositivo movido correctamente.');
    }

    public function clearCodes(AccessEvent $event)
    {
        $event->codes()->delete();

        return back()->with('success', 'Base de datos de códigos vaciada correctamente. Los reportes de escaneo se han conservado.');
    }

    public function updateCodeStatus(AccessEvent $event, AccessCode $code, Request $request)
    {
        $request->validate([
            'status' => 'required|in:pending,used,cancelled',
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
