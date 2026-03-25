<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\SiteSetting;

class SiteSettingController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::all()->pluck('value', 'key');
        
        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'show_featured_events' => 'boolean',
            'show_nearby_events' => 'boolean',
        ]);

        SiteSetting::updateOrCreate(
            ['key' => 'show_featured_events'],
            ['value' => $request->boolean('show_featured_events') ? '1' : '0']
        );

        SiteSetting::updateOrCreate(
            ['key' => 'show_nearby_events'],
            ['value' => $request->boolean('show_nearby_events') ? '1' : '0']
        );

        return redirect()->back()->with('success', 'Configuración actualizada correctamente.');
    }
}
