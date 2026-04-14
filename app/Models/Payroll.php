<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    protected $guarded = [];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'base_salary_amount' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'total_hours' => 'decimal:2',
        'overtime' => 'decimal:2',
        'deduction' => 'decimal:2',
        'late_penalty_total' => 'decimal:2',
        'cash_advance_deduction' => 'decimal:2',
        'allowance_total' => 'decimal:2',
        'bonus_total' => 'decimal:2',
        'bonus_performance' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'period_start' => 'date',
        'period_end' => 'date',
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

    public function components()
    {
        return $this->hasMany(PayrollComponent::class);
    }

    // ─── Scopes ───

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    // ─── Accessors ───

    public function getGrossPayAttribute(): float
    {
        return (float) ($this->base_salary + $this->overtime + $this->allowance_total + $this->bonus_total + $this->bonus_performance);
    }

    public function getTotalDeductionAttribute(): float
    {
        return (float) ($this->deduction + $this->late_penalty_total + $this->cash_advance_deduction);
    }

    public function getPayTypeLabelAttribute(): string
    {
        return match ($this->pay_type) {
            'salary_and_hourly' => 'Gaji Pokok + Per Jam',
            'salary_only' => 'Gaji Pokok',
            'hourly_only' => 'Per Jam',
            default => $this->pay_type ?? '-',
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'draft' => 'Draft',
            'approved' => 'Disetujui',
            'paid' => 'Dibayar',
            default => $this->status,
        };
    }
}
