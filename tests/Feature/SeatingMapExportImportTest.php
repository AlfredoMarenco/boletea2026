<?php

use App\Models\SeatingMap;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Http\UploadedFile;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->venue = Venue::create([
        'name' => 'Recinto de Pruebas',
        'address' => 'Av. Principal 123',
        'capacity' => 5000,
    ]);
});

test('un administrador puede exportar un mapa de asientos a un archivo JSON', function () {
    $seatingMap = SeatingMap::create([
        'name' => 'Mapa Concierto Local',
        'venue_id' => $this->venue->id,
        'layout_json' => [
            'config' => [
                'width' => 1200,
                'height' => 800,
                'categories' => [
                    ['id' => 'cat-1', 'name' => 'VIP', 'color' => '#ff0000'],
                ],
            ],
            'nodes' => [
                ['id' => 'seat-1', 'type' => 'seat', 'x' => 100, 'y' => 100],
            ],
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get(route('admin.seating-maps.export', $seatingMap->id));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/json');
});

test('un administrador puede importar un mapa de asientos desde un JSON empaquetado', function () {
    $exportPayload = [
        'version' => '1.0',
        'exported_at' => now()->toIso8601String(),
        'map_info' => ['name' => 'Mapa Importado Test'],
        'layout_json' => [
            'config' => [
                'width' => 1200,
                'height' => 800,
                'categories' => [
                    ['id' => 'cat-1', 'name' => 'VIP', 'color' => '#ff0000'],
                ],
            ],
            'nodes' => [
                ['id' => 'seat-1', 'type' => 'seat', 'x' => 150, 'y' => 200],
            ],
        ],
    ];

    $file = UploadedFile::fake()->createWithContent(
        'mapa-test.json',
        json_encode($exportPayload)
    );

    $response = $this->actingAs($this->user)
        ->post(route('admin.seating-maps.import'), [
            'name' => 'Mapa Estadio Servidor',
            'venue_id' => $this->venue->id,
            'map_file' => $file,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('seating_maps', [
        'name' => 'Mapa Estadio Servidor',
        'venue_id' => $this->venue->id,
    ]);
});
