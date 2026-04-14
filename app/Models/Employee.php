<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;

class Employee extends Model
{
    use BelongsToBranch;
    protected $guarded = [];

    protected $casts = [
        'join_date' => 'date',
        'end_date' => 'date',
        'birth_date' => 'date',
        'base_salary' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
    ];

    // ─── Relationships ───

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }

    public function cashAdvances()
    {
        return $this->hasMany(CashAdvance::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function overtimeRequests()
    {
        return $this->hasMany(OvertimeRequest::class);
    }

    public function attendanceCorrections()
    {
        return $this->hasMany(AttendanceCorrection::class);
    }

    public function performanceReviews()
    {
        return $this->hasMany(PerformanceReview::class);
    }

    public function schedules()
    {
        return $this->hasMany(EmployeeSchedule::class);
    }

    public function allowances()
    {
        return $this->hasMany(EmployeeAllowance::class);
    }

    public function shiftSwapRequests()
    {
        return $this->hasMany(ShiftSwap::class, 'requester_id');
    }

    public function shiftSwapReceived()
    {
        return $this->hasMany(ShiftSwap::class, 'recipient_id');
    }

    // ─── Scopes ───

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['inactive']);
    }

    // ─── Accessors ───

    public function getPayTypeLabelAttribute(): string
    {
        return match ($this->pay_type) {
            'salary_and_hourly' => 'Gaji Pokok + Per Jam',
            'salary_only' => 'Gaji Pokok',
            'hourly_only' => 'Per Jam',
            default => $this->pay_type ?? '-',
        };
    }

    public function getActiveAllowanceTotalAttribute(): float
    {
        return (float) $this->allowances()->active()->sum('amount');
    }

    public function getOutstandingCashAdvanceAttribute(): float
    {
        return (float) $this->cashAdvances()
            ->where('status', 'approved')
            ->whereColumn('repaid_amount', '<', 'amount')
            ->selectRaw('SUM(amount - repaid_amount) as total')
            ->value('total') ?? 0;
    }
}
