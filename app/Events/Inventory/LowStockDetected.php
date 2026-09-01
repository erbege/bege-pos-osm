<?php

namespace App\Events\Inventory;

use App\Models\Material;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when material stock falls below minimum threshold.
 */
class LowStockDetected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Material $material,
        public float $currentStock,
        public float $minStock,
        public float $suggestedQty,
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [];
    }

    /**
     * Get the severity level based on stock deficit.
     */
    public function getSeverityLevel(): string
    {
        $deficitPercentage = $this->minStock > 0
            ? (($this->minStock - $this->currentStock) / $this->minStock) * 100
            : 0;

        return match (true) {
            $deficitPercentage >= 50 => 'critical',
            $deficitPercentage >= 25 => 'high',
            $deficitPercentage >= 10 => 'medium',
            default => 'low',
        };
    }
}
