<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bank;
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
        $banks = Bank::orderBy('code')->get();

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'events' => $events,
            'banners' => $banners,
            'postback_urls' => $postback_urls,
            'banks' => $banks,
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
            // World Cup settings
            'world_cup_theme_enabled' => 'boolean',
            'world_cup_score_mode' => 'nullable|in:auto,manual',
            'world_cup_match_opponent' => 'nullable|string|max:255',
            'world_cup_match_status' => 'nullable|in:countdown,live,finished',
            'world_cup_match_datetime' => 'nullable|string',
            'world_cup_mexico_score' => 'nullable|integer|min:0',
            'world_cup_opponent_score' => 'nullable|integer|min:0',
            'simulate_mexico_goal' => 'boolean',
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

        if ($request->hasFile('refund_ticket_sample_image')) {
            $request->validate(['refund_ticket_sample_image' => 'image|max:10240']);
            $oldImage = SiteSetting::where('key', 'refund_ticket_sample_image')->first();
            if ($oldImage && $oldImage->value && strpos($oldImage->value, '/storage/') === 0) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $oldImage->value));
            }

            $path = $request->file('refund_ticket_sample_image')->store('refunds', 'public');

            SiteSetting::updateOrCreate(
                ['key' => 'refund_ticket_sample_image'],
                ['value' => '/storage/'.$path]
            );
        }

        // World Cup Settings update
        if ($request->has('world_cup_theme_enabled')) {
            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_theme_enabled'],
                ['value' => $request->boolean('world_cup_theme_enabled') ? '1' : '0']
            );
        }

        if ($request->has('world_cup_score_mode')) {
            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_score_mode'],
                ['value' => $validated['world_cup_score_mode']]
            );
        }

        if ($request->has('world_cup_match_opponent')) {
            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_match_opponent'],
                ['value' => $validated['world_cup_match_opponent'] ?? '']
            );
        }

        if ($request->has('world_cup_match_datetime')) {
            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_match_datetime'],
                ['value' => $validated['world_cup_match_datetime'] ?? '']
            );
        }

        if ($request->has('world_cup_match_status')) {
            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_match_status'],
                ['value' => $validated['world_cup_match_status']]
            );
        }

        if ($request->has('world_cup_mexico_score')) {
            $newScore = (int) $validated['world_cup_mexico_score'];
            $oldScoreVal = SiteSetting::where('key', 'world_cup_mexico_score')->first()?->value ?? '0';
            $oldScore = (int) $oldScoreVal;

            if ($newScore > $oldScore) {
                SiteSetting::updateOrCreate(
                    ['key' => 'world_cup_last_goal_time'],
                    ['value' => (string) now()->timestamp]
                );
            }

            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_mexico_score'],
                ['value' => (string) $newScore]
            );
        }

        if ($request->has('world_cup_opponent_score')) {
            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_opponent_score'],
                ['value' => (string) $validated['world_cup_opponent_score']]
            );
        }

        // Goal simulation trigger
        if ($request->boolean('simulate_mexico_goal')) {
            $currentScoreVal = SiteSetting::where('key', 'world_cup_mexico_score')->first()?->value ?? '0';
            $newScore = (int) $currentScoreVal + 1;

            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_last_goal_time'],
                ['value' => (string) now()->timestamp]
            );

            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_mexico_score'],
                ['value' => (string) $newScore]
            );
        }

        // Clear World Cup cache when settings are modified
        \Illuminate\Support\Facades\Cache::forget('world_cup_api_status');

        return redirect()->back()->with('success', 'Configuración actualizada correctamente.');
    }

    public function toggleBank(Bank $bank)
    {
        $bank->update([
            'enabled' => ! $bank->enabled,
        ]);

        return redirect()->back()->with('success', 'Estatus del banco actualizado correctamente.');
    }
}
