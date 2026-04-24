<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\SiteSetting;

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
