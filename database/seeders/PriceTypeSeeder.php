<?php

namespace Database\Seeders;

use App\Models\PriceType;
use Illuminate\Database\Seeder;

class PriceTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'REG', 'name' => 'Precio Regular', 'description' => 'Precio regular de venta'],
            ['code' => 'Cortesia', 'name' => 'Cortesía', 'description' => 'Boleto cortesía a $0.00'],
            ['code' => 'Desc30', 'name' => 'Descuento 30%', 'description' => '30% de descuento especial'],
            ['code' => '2x1', 'name' => 'Promoción 2x1', 'description' => 'Promoción 2 por 1'],
            ['code' => 'Paq_Familia', 'name' => 'Paquete Familiar', 'description' => 'Paquete especial de boletos'],
        ];

        foreach ($types as $type) {
            PriceType::firstOrCreate(['code' => $type['code']], $type);
        }
    }
}
