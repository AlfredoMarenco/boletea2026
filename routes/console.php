<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('events:sync', function (\App\Services\EventImportService $service) {
    $this->info('Iniciando sincronización de eventos...');

    try {
        $count = $service->importEvents();
        $this->info("Sincronización completada. Eventos procesados: {$count}");
    } catch (\Exception $e) {
        $this->error("Error durante la sincronización: " . $e->getMessage());
    }
})->purpose('Sincronizar eventos desde la API externa');

use Illuminate\Support\Facades\Schedule;

Schedule::command('events:sync')->hourly();
