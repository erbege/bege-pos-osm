<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;
use App\Traits\Auditable;

class Order extends Model
{
    use BelongsToBranch, Auditable;
    protected $guarded = [];
    protected $auditExclude = ['updated_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function batches()
    {
        return $this->hasMany(OrderBatch::class);
    }

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function discount()
    {
        return $this->belongsTo(Discount::class);
    }
}
