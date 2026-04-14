<?php

namespace App\Models;

use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use BelongsToBranch;

    protected $guarded = [];

    protected $casts = [
        'date' => 'date',
        'work_hours' => 'decimal:2',
        'check_in_lat' => 'decimal:7',
        'check_in_lng' => 'decimal:7',
        'check_out_lat' => 'decimal:7',
        'check_out_lng' => 'decimal:7',
        'is_absent' => 'boolean',
    ];

    // ─── Relationships ───

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    // ─── Scopes ───

    public function scopePresent($query)
    {
        return $query->where('is_absent', false);
    }

    public function scopeAbsent($query)
    {
        return $query->where('is_absent', true);
    }

    public function scopeLate($query)
    {
        return $query->where('status', 'late');
    }

    public function scopeOnTime($query)
    {
        return $query->where('status', 'present')->where('is_absent', false);
    }

    // ─── Accessors ───

    public function getCheckInLocationAttribute(): ?array
    {
        if ($this->check_in_lat && $this->check_in_lng) {
            return ['lat' => (float) $this->check_in_lat, 'lng' => (float) $this->check_in_lng];
        }
        return null;
    }

    public function getCheckOutLocationAttribute(): ?array
    {
        if ($this->check_out_lat && $this->check_out_lng) {
            return ['lat' => (float) $this->check_out_lat, 'lng' => (float) $this->check_out_lng];
        }
        return null;
    }

    public function getStatusLabelAttribute(): string
    {
        if ($this->is_absent) {
            return match ($this->absence_type) {
                'sick' => 'Sakit',
                'permit' => 'Izin',
                'leave' => 'Cuti',
                'alpha' => 'Alpha',
                default => 'Absent',
            };
        }
        return match ($this->status) {
            'present' => 'Hadir',
            'late' => 'Terlambat',
            default => $this->status,
        };
    }
}
