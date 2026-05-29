<?php

use App\Models\SeatingMap;
use App\Models\Venue;
use Illuminate\Support\Str;

$venue = Venue::first() ?: Venue::create(['name' => 'Estadio Central', 'address' => 'Av. Principal 123']);

SeatingMap::where('name', 'Estadio de Béisbol Profesional')->delete();

$map = SeatingMap::create([
    'name' => 'Estadio de Béisbol Profesional',
    'venue_id' => $venue->id,
    'layout_json' => [
        'config' => [
            'width' => 10000,
            'height' => 10000,
            'defaultSpacing' => 30,
            'defaultRadius' => 9,
            'bgImageUrl' => '/storage/seating_maps/baseball_stadium.png',
            'bgScale' => 5,
            'bgOpacity' => 0.5,
            'categories' => [
                ['id' => 'cat-diamond', 'name' => 'Diamond Club', 'color' => '#dc2626'], // Red 600
                ['id' => 'cat-field', 'name' => 'Field Level', 'color' => '#2563eb'],   // Blue 600
                ['id' => 'cat-loge', 'name' => 'Loge Level', 'color' => '#059669'],    // Green 600
                ['id' => 'cat-reserve', 'name' => 'Reserve Level', 'color' => '#d97706'], // Amber 600
                ['id' => 'cat-outfield', 'name' => 'Pavilion', 'color' => '#7c3aed'],    // Violet 600
                ['id' => 'cat-standing', 'name' => 'General Admission', 'color' => '#4b5563'], // Gray 600
            ]
        ],
        'nodes' => []
    ]
]);

$nodes = [];

// Helper to generate a complex section with multiple rows
function generateComplexSection(&$nodes, $sectionName, $catId, $color, $centerX, $centerY, $startRadius, $rowCount, $seatsPerRow, $startAngle, $endAngle, $startRowLabel = 'A') {
    $rowSpacing = 45;
    $seatSpacing = 30;
    
    for ($r = 0; $r < $rowCount; $r++) {
        $radius = $startRadius + ($r * $rowSpacing);
        $rowUuid = Str::uuid()->toString();
        $rowLabel = getRowLabel($r, 'ABC', $startRowLabel);
        
        for ($s = 0; $s < $seatsPerRow; $s++) {
            $angle = $startAngle + ($endAngle - $startAngle) * ($s / ($seatsPerRow - 1));
            $x = $centerX + cos($angle) * $radius;
            $y = $centerY + sin($angle) * $radius;
            
            $nodes[] = [
                'id' => 'seat-' . Str::uuid()->toString(),
                'type' => 'seat',
                'x' => $x,
                'y' => $y,
                'radius' => 9,
                'fill' => $color,
                'section' => $sectionName,
                'row' => $rowLabel,
                'number' => $s + 1,
                'category_id' => $catId,
                'row_uuid' => $rowUuid,
                'permanent_uuid' => Str::uuid()->toString(),
            ];
        }
    }
}

// Helper for row labels (simplified version of the one in JS)
function getRowLabel($index, $type, $start) {
    if ($type === '123') return (string)($start + $index);
    $startVal = ord($start);
    return chr($startVal + $index);
}

// Center of the field (Home plate focus)
$homeX = 5000;
$homeY = 7000;

// --- 1. DIAMOND CLUB (Behind home plate, very close) ---
// Small sections right at the center
for ($sec = 1; $sec <= 3; $sec++) {
    $angleStart = deg2rad(225 + ($sec - 1) * 30);
    $angleEnd = deg2rad(225 + $sec * 30);
    generateComplexSection($nodes, "Diamond $sec", 'cat-diamond', '#dc2626', $homeX, $homeY, 300, 8, 15, $angleStart, $angleEnd, '1');
}

// --- 2. FIELD LEVEL (Main seating around the diamond) ---
// Left Field (Third Base side)
for ($sec = 10; $sec <= 15; $sec++) {
    $angleStart = deg2rad(150 + ($sec - 10) * 12);
    $angleEnd = deg2rad(150 + ($sec - 9) * 12);
    generateComplexSection($nodes, "Field $sec", 'cat-field', '#2563eb', $homeX, $homeY, 700, 15, 20, $angleStart, $angleEnd, 'A');
}
// Right Field (First Base side)
for ($sec = 16; $sec <= 21; $sec++) {
    $angleStart = deg2rad(318 + ($sec - 16) * 12);
    $angleEnd = deg2rad(318 + ($sec - 15) * 12);
    generateComplexSection($nodes, "Field $sec", 'cat-field', '#2563eb', $homeX, $homeY, 700, 15, 20, $angleStart, $angleEnd, 'A');
}

// --- 3. LOGE LEVEL (Middle tier) ---
for ($sec = 101; $sec <= 110; $sec++) {
    $angleStart = deg2rad(150 + ($sec - 101) * 24);
    $angleEnd = deg2rad(150 + ($sec - 100) * 24);
    generateComplexSection($nodes, "Loge $sec", 'cat-loge', '#059669', $homeX, $homeY, 1500, 12, 25, $angleStart, $angleEnd, 'A');
}

// --- 4. RESERVE LEVEL (Upper tier) ---
for ($sec = 201; $sec <= 215; $sec++) {
    $angleStart = deg2rad(140 + ($sec - 201) * 18);
    $angleEnd = deg2rad(140 + ($sec - 200) * 18);
    generateComplexSection($nodes, "Reserve $sec", 'cat-reserve', '#d97706', $homeX, $homeY, 2200, 10, 30, $angleStart, $angleEnd, 'A');
}

// --- 5. OUTFIELD PAVILIONS ---
// Left Pavilion
generateComplexSection($nodes, "Left Pavilion", 'cat-outfield', '#7c3aed', $homeX, $homeY, 3500, 20, 80, deg2rad(100), deg2rad(140), '1');
// Right Pavilion
generateComplexSection($nodes, "Right Pavilion", 'cat-outfield', '#7c3aed', $homeX, $homeY, 3500, 20, 80, deg2rad(40), deg2rad(80), '1');

// --- 6. GENERAL ADMISSION / PICNIC AREA ---
$nodes[] = [
    'id' => 'ga-center-field',
    'type' => 'standing',
    'x' => $homeX - 1000,
    'y' => $homeY - 5000,
    'width' => 2000,
    'height' => 600,
    'name' => 'Center Field Plaza',
    'capacity' => 1500,
    'fill' => 'rgba(75, 85, 99, 0.2)',
    'category_id' => 'cat-standing',
    'showTitle' => true
];

// --- 7. VIP TABLES (Terrace) ---
for ($t = 1; $t <= 8; $t++) {
    $tableUuid = Str::uuid()->toString();
    $tx = $homeX - 1500 + ($t * 300);
    $ty = $homeY - 1200;
    
    $nodes[] = [
        'id' => 'table-' . $tableUuid,
        'type' => 'table_shape',
        'table_uuid' => $tableUuid,
        'x' => $tx,
        'y' => $ty,
        'shape' => 'circle',
        'radius' => 50,
        'name' => "VIP Terrace $t",
        'fill' => '#dc2626',
        'section' => 'VIP Terrace',
        'category_id' => 'cat-diamond'
    ];
    
    for ($s = 0; $s < 8; $s++) {
        $angle = (pi() * 2 * $s) / 8;
        $nodes[] = [
            'id' => 'seat-' . Str::uuid()->toString(),
            'type' => 'seat',
            'x' => $tx + cos($angle) * 85,
            'y' => $ty + sin($angle) * 85,
            'radius' => 9,
            'fill' => '#dc2626',
            'section' => 'VIP Terrace',
            'row' => "T$t",
            'number' => $s + 1,
            'table_uuid' => $tableUuid,
            'category_id' => 'cat-diamond',
            'permanent_uuid' => Str::uuid()->toString(),
        ];
    }
}

// --- 8. SECTION CONTAINERS (For visual grouping) ---
$nodes[] = [
    'id' => 'cont-diamond',
    'type' => 'section_container',
    'x' => $homeX - 800,
    'y' => $homeY - 400,
    'width' => 1600,
    'height' => 500,
    'name' => 'Diamond Club Zone',
    'fill' => 'rgba(220, 38, 38, 0.05)',
    'stroke' => '#dc2626',
    'strokeWidth' => 2,
    'category_id' => 'cat-diamond',
    'points' => [
        0, 0,
        1600, 0,
        1400, 500,
        200, 500
    ]
];

$map->layout_json = [
    'config' => $map->layout_json['config'],
    'nodes' => $nodes
];
$map->save();

echo "Estadio 'Excelente' creado. Total nodos: " . count($nodes) . "\n";
echo "ID: " . $map->id . "\n";
