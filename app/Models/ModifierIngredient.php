<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModifierIngredient extends Model
{
    protected $guarded = [];

    public function modifier()
    {
        return $this->belongsTo(Modifier::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }
}
