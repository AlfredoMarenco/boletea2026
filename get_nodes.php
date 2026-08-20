<?php

use App\Models\Event;
use App\Models\SeatInventory;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$event = Event::first();
$eventMap = $event->eventMaps->first();

$inventories = SeatInventory::where('event_map_id', $eventMap->id)->get()->keyBy('seat_uuid');
echo 'Inventories count for eventMap '.$eventMap->id.': '.$inventories->count()."\n";
if ($inventories->count() > 0) {
    echo 'First key: '.$inventories->keys()->first()."\n";
}
