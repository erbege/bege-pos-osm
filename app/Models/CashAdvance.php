<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashAdvance extends Model
{
    protected $guarded = [];

    protected $casts = [
        'amount' => 'decimal:2',
        'repaid_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'due_date' => 'date',
    ];

    // ─── Relationships ───

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ─── Accessors ───

    public function getRemainingAttribute()
    {
        return max(0, $this->amount - $this->repaid_amount);
    }

    public function getIsFullyRepaidAttribute()
    {
        return $this->repaid_amount >= $this->amount;
    }

    // ─── Scopes ───

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeOutstanding($query)
    {
        return $query->where('status', 'approved')
            ->whereColumn('repaid_amount', '<', 'amount');
    }
}
