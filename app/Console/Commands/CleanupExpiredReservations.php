<?php

namespace App\Console\Commands;

use App\Models\SeatInventory;
use Illuminate\Console\Command;

class CleanupExpiredReservations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reservations:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired temporary seat reservations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando limpieza de reservaciones expiradas...');

        $expiredCount = SeatInventory::where('status', 'reserved')
            ->where('reserved_expires_at', '<', now())
            ->update([
                'status' => 'available',
                'reserved_expires_at' => null,
                'session_id' => null,
            ]);

        $this->info("Se liberaron {$expiredCount} asientos con reservaciones expiradas.");
    }
}
