<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;

class Income extends Model
{
    use BelongsToBranch;
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
