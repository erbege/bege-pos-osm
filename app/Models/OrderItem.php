<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'menu_id',
        'qty',
        'price',
        'subtotal',
        'status', // Added status tracking per item
        'notes',
        'preparing_at',
        'ready_at',
        'served_at'
    ];

    public function modifiers()
    {
        return $this->belongsToMany(Modifier::class, 'order_item_modifier')
            ->withPivot('price')
            ->withTimestamps();
    }

    protected $casts = [
        'preparing_at' => 'datetime',
        'ready_at' => 'datetime',
        'served_at' => 'datetime',
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function batch()
    {
        return $this->belongsTo(OrderBatch::class, 'order_batch_id');
    }
}
