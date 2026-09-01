<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use App\Services\Inventory\InventoryEngineService;
use App\Services\Inventory\RecipeEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;

class ReserveStockListener implements ShouldQueue
{
    protected $inventoryService;
    protected $recipeService;

    public function __construct(InventoryEngineService $inventoryService, RecipeEngineService $recipeService)
    {
        $this->inventoryService = $inventoryService;
        $this->recipeService = $recipeService;
    }

    public function handle(OrderCreated $event): void
    {
        $order = $event->order;

        foreach ($order->items as $item) {
            $modifierIds = $item->modifiers->pluck('id')->toArray();
            $requirements = $this->recipeService->explodeMenu($item->menu_id, $item->qty, $modifierIds);

            foreach ($requirements as $materialId => $data) {
                $material = $data['material'];
                $totalQty = $data['total_qty'];

                if ($material->track_inventory) {
                    $this->inventoryService->reserveStock($material, $totalQty, $order);
                }
            }
        }
    }
}
