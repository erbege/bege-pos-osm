<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Services\Inventory\InventoryEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;

class FulfillStockReservationListener implements ShouldQueue
{
    protected $inventoryService;

    public function __construct(InventoryEngineService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function handle(OrderPaid $event): void
    {
        $this->inventoryService->fulfillReservation($event->order);
    }
}
