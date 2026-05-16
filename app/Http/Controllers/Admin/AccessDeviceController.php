<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessDevice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class AccessDeviceController extends Controller
{
    public function index()
    {
        $devices = AccessDevice::orderBy('name')->paginate(10);

        return Inertia::render('Admin/Access/Devices/Index', [
            'devices' => $devices,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Access/Devices/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'device_identifier' => 'required|string|unique:access_devices,device_identifier',
        ]);

        // Generate a random token for the device
        $validated['api_token'] = Str::random(60);
        $validated['status'] = 'active';

        AccessDevice::create($validated);

        return redirect()->route('admin.access.devices.index')->with('success', 'Dispositivo registrado correctamente.');
    }

    public function edit(AccessDevice $device)
    {
        return Inertia::render('Admin/Access/Devices/Edit', [
            'device' => $device,
        ]);
    }

    public function update(Request $request, AccessDevice $device)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'device_identifier' => 'required|string|unique:access_devices,device_identifier,' . $device->id,
            'status' => 'required|in:active,inactive',
        ]);

        $device->update($validated);

        return redirect()->route('admin.access.devices.index')->with('success', 'Dispositivo actualizado.');
    }

    public function toggle(AccessDevice $device)
    {
        $device->update([
            'status' => $device->status === 'active' ? 'inactive' : 'active'
        ]);

        return redirect()->back()->with('success', 'Estado del dispositivo actualizado.');
    }

    public function destroy(AccessDevice $device)
    {
        $device->delete();

        return redirect()->route('admin.access.devices.index')->with('success', 'Dispositivo eliminado.');
    }

    public function uploadApk(Request $request)
    {
        $request->validate([
            'apk' => 'required|file|mimetypes:application/vnd.android.package-archive',
        ]);

        $file = $request->file('apk');
        $path = storage_path('app/public/scanner');

        if (!file_exists($path)) {
            mkdir($path, 0755, true);
        }

        // Overwrite the existing file to always keep just one version
        $file->move($path, 'boleteaccessos.apk');

        return redirect()->back()->with('success', 'Aplicación actualizada correctamente.');
    }
}
