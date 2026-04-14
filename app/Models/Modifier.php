<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modifier extends Model
{
    protected $guarded = [];

    public function ingredients()
    {
        return $this->hasMany(ModifierIngredient::class);
    }

    public function menus()
    {
        return $this->belongsToMany(Menu::class, 'menu_modifier');
    }
}
