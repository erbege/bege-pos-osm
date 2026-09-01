<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToBranch;

class EmployeeSchedule extends Model
{
    use BelongsToBranch;
    protected $fillable = ['employee_id', 'shift_id', 'branch_id', 'date', 'role_note'];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
