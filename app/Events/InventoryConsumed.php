<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Database\Eloquent\Model;

class InventoryConsumed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $amount;
    public $reference;
    public $branchId;
    public $notes;

    /**
     * Create a new event instance.
     */
    public function __construct(float $amount, ?Model $reference = null, ?int $branchId = null, ?string $notes = null)
    {
        $this->amount = $amount;
        $this->reference = $reference;
        $this->branchId = $branchId;
        $this->notes = $notes;
    }
}
