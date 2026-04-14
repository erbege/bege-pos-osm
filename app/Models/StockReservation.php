<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockReservation extends Model
{
    protected $guarded = [];

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }
}
