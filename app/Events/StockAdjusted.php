<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Database\Eloquent\Model;

class StockAdjusted
{
    use Dispatchable, SerializesModels;

    public $amount;
    public $reference;
    public $branchId;

    public function __construct(float $amount, ?Model $reference = null, ?int $branchId = null)
    {
        $this->amount = $amount;
        $this->reference = $reference;
        $this->branchId = $branchId;
    }
}
