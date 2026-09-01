<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationPolicy extends Model
{
    protected $fillable = [
        'branch_id',
        'hours_before_full_refund',
        'hours_before_partial_refund',
        'partial_refund_percentage',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
