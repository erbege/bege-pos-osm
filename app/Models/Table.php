<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;

class Table extends Model
{
    use BelongsToBranch;
    protected $guarded = [];

    public function reservations()
    {
        return $this->belongsToMany(Reservation::class, 'reservation_tables');
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function activeOrder()
    {
        return $this->hasOne(Order::class)->whereIn('status', ['Draft', 'Pending Payment']);
    }
}
