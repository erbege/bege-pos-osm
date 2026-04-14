<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    protected $guarded = [];

    protected $casts = [
        'qty' => 'decimal:2',
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }
}
