<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;

class Room extends Model
{
    use BelongsToBranch;

    protected $guarded = [];

    public function tables()
    {
        return $this->hasMany(Table::class);
    }
}
