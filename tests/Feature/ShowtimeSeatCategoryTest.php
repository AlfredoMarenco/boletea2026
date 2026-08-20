<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventShowtime;
use App\Models\SeatingMap;
use App\Models\SeatInventory;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShowtimeSeatCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_update_seat_category_for_showtime(): void
    {
        $user = User::factory()->create();
        $event = Event::create([
            'name' => 'Concierto Test',
            'slug' => 'concierto-test',
        ]);
        $venue = Venue::create([
            'name' => 'Recinto Test',
            'city' => 'Ciudad',
        ]);
        $map = SeatingMap::create([
            'venue_id' => $venue->id,
            'name' => 'Mapa Test',
            'layout_json' => [],
        ]);
        $showtime = EventShowtime::create([
            'event_id' => $event->id,
            'seating_map_id' => $map->id,
            'name' => 'Función 1',
            'date_time' => now(),
        ]);

        // Crear inventario inicial
        SeatInventory::create([
            'event_showtime_id' => $showtime->id,
            'seat_uuid' => 'seat-101',
            'status' => 'available',
            'price' => 100,
            'category' => 'General',
            'section' => 'General',
        ]);

        $response = $this->actingAs($user)->post(
            route('admin.local-events.showtimes.seats.category', [$event->id, $showtime->id]),
            [
                'seat_uuids' => ['seat-101'],
                'category' => 'VIP',
            ]
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('seat_inventories', [
            'event_showtime_id' => $showtime->id,
            'seat_uuid' => 'seat-101',
            'category' => 'VIP',
            'section' => 'VIP',
        ]);
    }
}
