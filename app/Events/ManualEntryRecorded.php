<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Database\Eloquent\Model;

class ManualEntryRecorded
{
    use Dispatchable, SerializesModels;

    public $type; // income or expense
    public $amount;
    public $reference;
    public $branchId;
    public $description;

    public function __construct(string $type, float $amount, ?Model $reference = null, ?int $branchId = null, ?string $description = null)
    {
        $this->type = $type;
        $this->amount = $amount;
        $this->reference = $reference;
        $this->branchId = $branchId;
        $this->description = $description;
    }
}
