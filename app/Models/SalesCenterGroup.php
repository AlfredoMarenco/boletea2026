<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesCenterGroup extends Model
{
    protected $fillable = ['name', 'description'];

    public function salesCenters()
    {
        return $this->belongsToMany(SalesCenter::class, 'sales_center_group_sales_center');
    }

    public function externalEvents()
    {
        return $this->belongsToMany(ExternalEvent::class, 'external_event_sales_center_group');
    }
}
