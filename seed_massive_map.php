<?php
use App\Models\Venue;
use App\Models\SeatingMap;
use Illuminate\Support\Str;

$venueId = Venue::first()?->id ?? 1;

$nodes = [];
$categories = [
    ["id" => "cat-1", "name" => "VIP", "color" => "#fbbf24"],
    ["id" => "cat-2", "name" => "Platea Oro", "color" => "#60a5fa"],
    ["id" => "cat-3", "name" => "Platea Plata", "color" => "#a78bfa"],
    ["id" => "cat-4", "name" => "Admision General", "color" => "#34d399"],
];

// 1. ADMISIÓN GENERAL (Standing)
$nodes[] = [
    "id" => "standing-" . Str::uuid()->toString(),
    "type" => "standing",
    "x" => 1500,
    "y" => 100,
    "width" => 800,
    "height" => 600,
    "name" => "Cancha General",
    "capacity" => 1500,
    "category_id" => "cat-4",
    "fill" => "rgba(52, 211, 153, 0.2)",
    "stroke" => "#34d399",
    "strokeWidth" => 2,
    "showTitle" => true,
    "titlePosition" => "center",
];

// 2. SECCIONES NUMERADAS
$yOffset = 100;
for ($s = 1; $s <= 8; $s++) {
    $xOffset = ($s % 2 == 0) ? 100 : 800;
    if ($s % 2 != 0 && $s > 1) {
        $yOffset += 450;
    }
    
    $sectionName = "Seccion " . $s;
    $isVip = $s <= 2;
    $categoryId = $isVip ? "cat-1" : ($s <= 6 ? "cat-2" : "cat-3");
    $color = $isVip ? "#fbbf24" : ($s <= 6 ? "#60a5fa" : "#a78bfa");
    
    $blockUuid = Str::uuid()->toString();

    $nodes[] = [
        "id" => "section-" . Str::uuid()->toString(),
        "type" => "section_container",
        "x" => $xOffset - 50,
        "y" => $yOffset - 50,
        "points" => [0, 0, 600, 0, 600, 400, 0, 400],
        "name" => $sectionName,
        "category_id" => $categoryId,
        "fill" => "rgba(255,255,255,0.05)",
        "stroke" => $color,
        "strokeWidth" => 2,
    ];

    // 15 Rows per section
    for ($r = 1; $r <= 12; $r++) {
        $rowUuid = Str::uuid()->toString();
        $rowLabel = chr(64 + $r);

        // 20 Seats per row
        for ($seat = 1; $seat <= 20; $seat++) {
            $nodes[] = [
                "id" => "seat-" . Str::uuid()->toString(),
                "type" => "seat",
                "x" => $xOffset + ($seat * 25),
                "y" => $yOffset + ($r * 25),
                "radius" => 9,
                "fill" => $color,
                "section" => $sectionName,
                "row" => $rowLabel,
                "number" => $seat,
                "row_uuid" => $rowUuid,
                "block_uuid" => $blockUuid,
                "permanent_uuid" => Str::uuid()->toString(),
            ];
        }
    }
}

// 3. MESAS VIP
$tableCenters = [
    ["x" => 1600, "y" => 800],
    ["x" => 1800, "y" => 800],
    ["x" => 2000, "y" => 800],
    ["x" => 2200, "y" => 800],
];

foreach ($tableCenters as $i => $pos) {
    $tableUuid = Str::uuid()->toString();
    $tableName = "Mesa VIP " . ($i + 1);
    $tableRadius = 50;
    
    $nodes[] = [
        "id" => "table-" . $tableUuid,
        "type" => "table_shape",
        "shape" => "circle",
        "x" => $pos["x"],
        "y" => $pos["y"],
        "radius" => $tableRadius,
        "width" => $tableRadius * 2,
        "height" => $tableRadius * 2,
        "fill" => "rgba(255, 255, 255, 0.8)",
        "stroke" => "#fbbf24",
        "name" => $tableName,
        "table_uuid" => $tableUuid,
        "section" => "Zona VIP Mesas",
    ];

    $seatsCount = 10;
    $seatRadius = 9;
    for ($s = 0; $s < $seatsCount; $s++) {
        $angle = (pi() * 2 * $s) / $seatsCount;
        $distance = $tableRadius + $seatRadius + 5; 
        $nodes[] = [
            "id" => "seat-" . Str::uuid()->toString(),
            "type" => "seat",
            "x" => $pos["x"] + cos($angle) * $distance,
            "y" => $pos["y"] + sin($angle) * $distance,
            "radius" => $seatRadius,
            "fill" => "#fbbf24",
            "section" => "Zona VIP Mesas",
            "row" => $tableName,
            "number" => $s + 1,
            "table_uuid" => $tableUuid,
            "permanent_uuid" => Str::uuid()->toString(),
        ];
    }
}

$layout = [
    "nodes" => $nodes,
    "config" => [
        "categories" => $categories,
        "bgImageUrl" => null,
        "defaultRadius" => 9,
        "defaultSpacing" => 25
    ]
];

$map = SeatingMap::create([
    "venue_id" => $venueId,
    "name" => "Arena Real (Test de Rendimiento Realista)",
    "layout_json" => $layout,
    "is_active" => true,
]);

echo "Mapa realista creado con ID: " . $map->id . " y " . count($nodes) . " nodos.\n";

