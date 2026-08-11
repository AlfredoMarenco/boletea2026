<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$event = App\Models\Event::first();
$eventMap = $event->eventMaps->first();

$inventories = App\Models\SeatInventory::where('event_map_id', $eventMap->id)->get()->keyBy('seat_uuid');
echo "Inventories count for eventMap " . $eventMap->id . ": " . $inventories->count() . "\n";
if ($inventories->count() > 0) {
    echo "First key: " . $inventories->keys()->first() . "\n";
}
