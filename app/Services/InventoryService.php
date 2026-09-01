<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Recipe;
use App\Models\StockMovement;
use App\Models\Material;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Deduct materials based on the recipes of ordered items.
     *
     * @param Order $order
     * @return void
     */
    public function deductStockForOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                // Find recipes for this menu item
                $recipes = Recipe::where('menu_id', $item->menu_id)->get();

                foreach ($recipes as $recipe) {
                    $totalQtyNeeded = $recipe->qty * $item->qty;

                    $material = Material::find($recipe->material_id);
                    if ($material) {
                        $material->decrement('stock', $totalQtyNeeded);

                        // Log movement
                        StockMovement::create([
                            'material_id' => $material->id,
                            'type' => 'out',
                            'qty' => $totalQtyNeeded,
                            'notes' => 'Auto-deducted for Order #' . $order->id,
                        ]);
                    }
                }
            }
        });
    }

    /**
     * Add stock from supplier purchase
     *
     * @param Material $material
     * @param float $qty
     * @param int|null $supplierId
     * @param string $notes
     * @return void
     */
    public function addStock(Material $material, float $qty, ?int $supplierId = null, string $notes = 'Manual restock'): void
    {
        DB::transaction(function () use ($material, $qty, $supplierId, $notes) {
            $material->increment('stock', $qty);

            StockMovement::create([
                'material_id' => $material->id,
                'supplier_id' => $supplierId,
                'type' => 'in',
                'qty' => $qty,
                'notes' => $notes,
            ]);
        });
    }
}
