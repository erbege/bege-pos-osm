<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftSwap extends Model
{
    protected $fillable = [
        'requester_id',
        'recipient_id',
        'requester_schedule_id',
        'recipient_schedule_id',
        'status',
        'approved_by',
        'reason'
    ];

    public function requester()
    {
        return $this->belongsTo(Employee::class, 'requester_id');
    }

    public function recipient()
    {
        return $this->belongsTo(Employee::class, 'recipient_id');
    }

    public function requesterSchedule()
    {
        return $this->belongsTo(EmployeeSchedule::class, 'requester_schedule_id');
    }

    public function recipientSchedule()
    {
        return $this->belongsTo(EmployeeSchedule::class, 'recipient_schedule_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
