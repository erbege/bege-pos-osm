<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = [
        'branch_id',
        'name',
        'start_time',
        'end_time',
        'is_active',
        'break_duration_minutes',
        'color',
        'overtime_rate_multiplier',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'break_duration_minutes' => 'integer',
        'overtime_rate_multiplier' => 'decimal:2',
    ];

    // ─── Relationships ───

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function schedules()
    {
        return $this->hasMany(EmployeeSchedule::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    // ─── Accessors ───

    public function getEffectiveHoursAttribute(): float
    {
        $start = \Carbon\Carbon::createFromFormat('H:i:s', $this->start_time);
        $end = \Carbon\Carbon::createFromFormat('H:i:s', $this->end_time);

        // Handle overnight shifts
        if ($end->lt($start)) {
            $end->addDay();
        }

        $totalMinutes = $start->diffInMinutes($end);
        $effectiveMinutes = $totalMinutes - ($this->break_duration_minutes ?? 0);

        return round($effectiveMinutes / 60, 2);
    }
}
