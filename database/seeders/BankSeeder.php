<?php

namespace Database\Seeders;

use App\Models\Bank;
use Illuminate\Database\Seeder;

class BankSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $banks = [
            ['code' => '002', 'name' => 'BANAMEX'],
            ['code' => '012', 'name' => 'BBVA'],
            ['code' => '014', 'name' => 'SANTANDER'],
            ['code' => '021', 'name' => 'HSBC'],
            ['code' => '030', 'name' => 'BAJIO'],
            ['code' => '036', 'name' => 'INBURSA'],
            ['code' => '044', 'name' => 'SCOTIABANK'],
            ['code' => '072', 'name' => 'BANORTE'],
            ['code' => '127', 'name' => 'BANCO AZTECA'],
            ['code' => '137', 'name' => 'BANCOPPEL'],
            ['code' => '058', 'name' => 'BANREGIO'],
            ['code' => '062', 'name' => 'AFIRME'],
            ['code' => '112', 'name' => 'BANJERCITO'],
            ['code' => '136', 'name' => 'INTERCAM'],
            ['code' => '143', 'name' => 'MULTIVA'],
            ['code' => '110', 'name' => 'BANCO DEL BIENESTAR'],
            ['code' => '042', 'name' => 'MIFEL'],
            ['code' => '059', 'name' => 'BANCO VE POR MAS'],
            ['code' => '138', 'name' => 'ABC CAPITAL'],
            ['code' => '140', 'name' => 'CONSUBANCO'],
            ['code' => '148', 'name' => 'BANCREA'],
            ['code' => '156', 'name' => 'BANCO REGIONAL DE MONTERREY'],
            ['code' => '166', 'name' => 'BANCO INMOBILIARIO MEXICANO'],
            ['code' => '168', 'name' => 'HIPOTECARIA FEDERAL'],
            ['code' => '655', 'name' => 'FONDO OPCIONES'],
            ['code' => '702', 'name' => 'INDEVAL'],
        ];

        foreach ($banks as $bank) {
            Bank::updateOrCreate(['code' => $bank['code']], ['name' => $bank['name'], 'enabled' => true]);
        }
    }
}
