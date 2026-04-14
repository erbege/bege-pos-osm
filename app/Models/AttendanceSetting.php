<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSetting extends Model
{
    protected $fillable = ['branch_id', 'grace_time_minutes', 'late_penalty_per_minute', 'latitude', 'longitude', 'radius_meters'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
