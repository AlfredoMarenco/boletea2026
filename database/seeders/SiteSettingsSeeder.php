<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SiteSetting::updateOrCreate(['key' => 'show_featured_events'], ['value' => '1']);
        SiteSetting::updateOrCreate(['key' => 'show_nearby_events'], ['value' => '1']);
    }
}
