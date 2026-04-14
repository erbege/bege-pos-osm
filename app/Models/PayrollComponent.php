<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollComponent extends Model
{
    protected $guarded = [];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    // ─── Relationships ───

    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    // ─── Scopes ───

    public function scopeEarnings($query)
    {
        return $query->where('component_type', 'earning');
    }

    public function scopeDeductions($query)
    {
        return $query->where('component_type', 'deduction');
    }
}
