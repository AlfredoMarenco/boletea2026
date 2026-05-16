<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExternalEvent;
use App\Models\WelcomeBanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class WelcomeBannerController extends Controller
{
    public function index()
    {
        $banners = WelcomeBanner::with('event')->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Banners/Index', [
            'banners' => $banners,
        ]);
    }

    public function create()
    {
        // Select events that are published and upcoming
        $events = ExternalEvent::where('status', 'published')
            ->orderBy('start_date', 'asc')
            ->select('id', 'title', 'start_date', 'image_path')
            ->get();

        return Inertia::render('Admin/Banners/Create', [
            'events' => $events,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'type' => 'required|in:manual,event',
            'image_file' => 'nullable|image|max:10240', // File upload
            'external_link' => 'nullable|string',
            'external_event_id' => 'nullable|exists:external_events,id',
            'is_active' => 'boolean',
        ]);

        $banner = new WelcomeBanner;
        $banner->title = $validated['title'] ?? null;
        $banner->is_active = $validated['is_active'] ?? true;

        if ($validated['type'] === 'manual') {
            $banner->external_link = $validated['external_link'] ?? null;
            $banner->external_event_id = null;

            if ($request->hasFile('image_file')) {
                $path = $request->file('image_file')->store('banners', 'public');
                $banner->image_path = '/storage/'.$path;
            } else {
                return back()->withErrors(['image_file' => 'La imagen es requerida para banners manuales.']);
            }
        } else {
            $banner->external_event_id = $validated['external_event_id'] ?? null;
            $banner->image_path = null;
            $banner->external_link = null;

            if (! $banner->external_event_id) {
                return back()->withErrors(['external_event_id' => 'Debes seleccionar un evento.']);
            }
        }

        $banner->save();

        return redirect()->route('admin.settings.index')->with('success', 'Banner creado exitosamente.');
    }

    public function edit(WelcomeBanner $banner)
    {
        // Not used as we do it in modal
    }

    public function update(Request $request, WelcomeBanner $banner)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'type' => 'required|in:manual,event',
            'image_file' => 'nullable|image|max:10240',
            'external_link' => 'nullable|string',
            'external_event_id' => 'nullable|exists:external_events,id',
            'is_active' => 'boolean',
        ]);

        $banner->title = $validated['title'] ?? null;
        $banner->is_active = $validated['is_active'] ?? true;

        if ($validated['type'] === 'manual') {
            $banner->external_link = $validated['external_link'] ?? null;
            $banner->external_event_id = null;

            if ($request->hasFile('image_file')) {
                // Delete old image if it exists and was stored locally
                if ($banner->image_path && strpos($banner->image_path, '/storage/') === 0) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $banner->image_path));
                }

                $path = $request->file('image_file')->store('banners', 'public');
                $banner->image_path = '/storage/'.$path;
            } elseif (! $banner->image_path && ! $request->hasFile('image_file')) {
                return back()->withErrors(['image_file' => 'La imagen es requerida para banners manuales.']);
            }
        } else {
            $banner->external_event_id = $validated['external_event_id'] ?? null;

            // Si cambia a evento, borramos la imagen manual que existía si la había
            if ($banner->image_path && strpos($banner->image_path, '/storage/') === 0) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $banner->image_path));
            }
            $banner->image_path = null;
            $banner->external_link = null;

            if (! $banner->external_event_id) {
                return back()->withErrors(['external_event_id' => 'Debes seleccionar un evento.']);
            }
        }

        $banner->save();

        return redirect()->route('admin.settings.index')->with('success', 'Banner actualizado exitosamente.');
    }

    public function destroy(WelcomeBanner $banner)
    {
        if ($banner->image_path && strpos($banner->image_path, '/storage/') === 0) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $banner->image_path));
        }
        $banner->delete();

        return redirect()->route('admin.settings.index')->with('success', 'Banner eliminado exitosamente.');
    }
}
