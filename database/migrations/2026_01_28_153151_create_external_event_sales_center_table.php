<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('external_event_sales_center', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_event_id')->constrained()->onDelete('cascade');
            $table->foreignId('sales_center_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // Migrate Data
        $events = \App\Models\ExternalEvent::all();
        foreach ($events as $event) {
            if (!empty($event->sales_centers)) {
                $idsToAttach = [];
                foreach ($event->sales_centers as $item) {
                    if (is_numeric($item)) {
                        // It's an existing ID
                        $idsToAttach[] = $item;
                    } elseif (is_string($item)) {
                        // It's a legacy string, create a Sales Center for it if it doesn't match a known name? 
                        // Or just create it to be safe. We'll check if exists by name to avoid duplicates.
                        $center = \App\Models\SalesCenter::firstOrCreate(
                            ['name' => $item],
                            ['is_active' => true, 'address' => 'Dirección pendiente']
                        );
                        $idsToAttach[] = $center->id;
                    }
                }

                if (!empty($idsToAttach)) {
                    // We need to use DB facade or a raw insert because the relationship doesn't exist yet on the model
                    // actually we can just insert into the pivot table directly
                    foreach (array_unique($idsToAttach) as $scId) {
                        DB::table('external_event_sales_center')->insert([
                            'external_event_id' => $event->id,
                            'sales_center_id' => $scId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }

        Schema::table('external_events', function (Blueprint $table) {
            $table->dropColumn('sales_centers');
        });
    }

    public function down(): void
    {
        Schema::table('external_events', function (Blueprint $table) {
            $table->json('sales_centers')->nullable();
        });

        Schema::dropIfExists('external_event_sales_center');
    }
};
