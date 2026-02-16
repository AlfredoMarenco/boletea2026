<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\State;
use App\Models\City;

class StatesAndCitiesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mexicoData = [
            ['name' => 'Aguascalientes', 'cities' => ['Aguascalientes', 'Jesús María']],
            ['name' => 'Baja California', 'cities' => ['Tijuana', 'Mexicali', 'Ensenada', 'Rosarito', 'Tecate']],
            ['name' => 'Baja California Sur', 'cities' => ['La Paz', 'Cabo San Lucas', 'San José del Cabo']],
            ['name' => 'Campeche', 'cities' => ['Campeche', 'Ciudad del Carmen']],
            ['name' => 'Chiapas', 'cities' => ['Tuxtla Gutiérrez', 'Tapachula', 'San Cristóbal de las Casas']],
            ['name' => 'Chihuahua', 'cities' => ['Chihuahua', 'Ciudad Juárez', 'Cuauhtémoc', 'Delicias']],
            ['name' => 'Ciudad de México', 'cities' => ['Ciudad de México']],
            ['name' => 'Coahuila', 'cities' => ['Saltillo', 'Torreón', 'Monclova', 'Piedras Negras']],
            ['name' => 'Colima', 'cities' => ['Colima', 'Manzanillo', 'Villa de Álvarez']],
            ['name' => 'Durango', 'cities' => ['Durango', 'Gómez Palacio', 'Lerdo']],
            ['name' => 'Guanajuato', 'cities' => ['León', 'Irapuato', 'Celaya', 'Guanajuato']],
            ['name' => 'Guerrero', 'cities' => ['Acapulco', 'Chilpancingo', 'Iguala']],
            ['name' => 'Hidalgo', 'cities' => ['Pachuca', 'Tulancingo', 'Tula']],
            ['name' => 'Jalisco', 'cities' => ['Guadalajara', 'Zapopan', 'Puerto Vallarta', 'Tlaquepaque', 'Tonalá']],
            ['name' => 'Estado de México', 'cities' => ['Toluca', 'Naucalpan', 'Ecatepec', 'Nezahualcóyotl', 'Tlalnepantla']],
            ['name' => 'Michoacán', 'cities' => ['Morelia', 'Uruapan', 'Zamora']],
            ['name' => 'Morelos', 'cities' => ['Cuernavaca', 'Jiutepec', 'Cuautla']],
            ['name' => 'Nayarit', 'cities' => ['Tepic', 'Nuevo Vallarta']],
            ['name' => 'Nuevo León', 'cities' => ['Monterrey', 'San Pedro Garza García', 'San Nicolás de los Garza', 'Guadalupe', 'Apodaca']],
            ['name' => 'Oaxaca', 'cities' => ['Oaxaca de Juárez', 'Salina Cruz', 'Puerto Escondido']],
            ['name' => 'Puebla', 'cities' => ['Puebla', 'Tehuacán', 'Cholula']],
            ['name' => 'Querétaro', 'cities' => ['Querétaro', 'San Juan del Río']],
            ['name' => 'Quintana Roo', 'cities' => ['Cancún', 'Playa del Carmen', 'Chetumal', 'Tulum']],
            ['name' => 'San Luis Potosí', 'cities' => ['San Luis Potosí', 'Ciudad Valles', 'Matehuala']],
            ['name' => 'Sinaloa', 'cities' => ['Culiacán', 'Mazatlán', 'Los Mochis']],
            ['name' => 'Sonora', 'cities' => ['Hermosillo', 'Ciudad Obregón', 'Nogales']],
            ['name' => 'Tabasco', 'cities' => ['Villahermosa', 'Cárdenas']],
            ['name' => 'Tamaulipas', 'cities' => ['Tampico', 'Reynosa', 'Matamoros', 'Nuevo Laredo', 'Ciudad Victoria']],
            ['name' => 'Tlaxcala', 'cities' => ['Tlaxcala', 'Apizaco']],
            ['name' => 'Veracruz', 'cities' => ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Poza Rica', 'Boca del Río', 'Córdoba', 'Orizaba']],
            ['name' => 'Yucatán', 'cities' => ['Mérida', 'Valladolid', 'Tizimín']],
            ['name' => 'Zacatecas', 'cities' => ['Zacatecas', 'Fresnillo', 'Guadalupe']],
        ];

        foreach ($mexicoData as $stateData) {
            $state = State::firstOrCreate(['name' => $stateData['name']]);

            foreach ($stateData['cities'] as $cityName) {
                City::firstOrCreate([
                    'name' => $cityName,
                    'state_id' => $state->id
                ]);
            }
        }
    }
}
