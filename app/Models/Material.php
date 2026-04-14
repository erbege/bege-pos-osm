<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;
use App\Traits\Auditable;

class Material extends Model
{
    use BelongsToBranch, Auditable;
    protected $guarded = [];
    protected $appends = ['item_name', 'current_stock'];

    public function getItemNameAttribute() { return $this->name; }
    public function getCurrentStockAttribute() { return $this->stock; }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    public function movements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function opnameItems()
    {
        return $this->hasMany(StockOpnameItem::class);
    }
}
