<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;
use App\Traits\Auditable;

class Payment extends Model
{
    use BelongsToBranch, Auditable;
    protected $guarded = [];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
