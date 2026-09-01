<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Order;
use App\Models\StockMovement;

class DeductStockJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public $order;

    /**
     * Create a new job instance.
     */
    public function __construct(Order $order)
    {
        // Load relationships needed internally by the job if not loaded
        $this->order = $order->loadMissing('items.menu.recipes');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $recipeEngine = app(\App\Services\Inventory\RecipeEngineService::class);
        $inventoryEngine = app(\App\Services\Inventory\InventoryEngineService::class);

        $totalCogs = 0;

        foreach ($this->order->items as $item) {
            $requirements = $recipeEngine->explodeMenu($item->menu_id, $item->qty);

            foreach ($requirements as $req) {
                $movement = $inventoryEngine->moveStock(
                    $req['material'],
                    -$req['total_qty'], // negative for deduction
                    'out',
                    "Order deduction #{$this->order->id}",
                    $this->order
                );

                if ($movement) {
                    $totalCogs += abs($movement->qty) * $movement->cost;
                }
            }
        }

        if ($totalCogs > 0) {
            event(new \App\Events\InventoryConsumed($totalCogs, $this->order, $this->order->branch_id, "Order COGS #{$this->order->id}"));
        }
    }
}
