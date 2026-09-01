<?php

namespace App\Services\Inventory;

use App\Models\Material;
use App\Models\StockMovement;
use App\Models\StockOpnameSession;
use App\Models\StockOpnameItem;
use App\Models\StockReservation;
use App\Models\StockTransfer;
use Illuminate\Support\Facades\DB;

class InventoryEngineService
{
    /**
     * General stock movement.
     */
    public function moveStock(Material $material, float $qty, string $type, ?string $notes = null, $reference = null, float $cost = 0, ?string $batchNumber = null, ?string $expiryDate = null, ?string $reason = null)
    {
        return DB::transaction(function () use ($material, $qty, $type, $notes, $reference, $cost, $batchNumber, $expiryDate, $reason) {
            // Update physical stock and handle Average Costing for increments
            if ($type === 'in' || ($type === 'adjustment' && $qty > 0)) {
                $currentStock = $material->stock;
                $currentAvgCost = $material->avg_cost;
                $newQty = abs($qty);

                // AVG COST FORMULA: ((current_qty * avg_cost) + (new_qty * purchase_cost)) / (current_qty + new_qty)
                if ($cost > 0) {
                    $totalValueBefore = $currentStock * $currentAvgCost;
                    $newValue = $newQty * $cost;
                    $totalQtyAfter = $currentStock + $newQty;

                    if ($totalQtyAfter > 0) {
                        $material->avg_cost = ($totalValueBefore + $newValue) / $totalQtyAfter;
                    }
                }

                $material->increment('stock', $newQty);
            } elseif ($type === 'out' || ($type === 'adjustment' && $qty < 0) || $type === 'waste') {
                $material->decrement('stock', abs($qty));
            }

            // Trigger low stock alert if needed
            if ($material->track_inventory && $material->stock <= $material->min_stock) {
                event(new \App\Events\LowStockAlert($material));
            }

            // Create ledger entry
            return StockMovement::create([
                'material_id' => $material->id,
                'type' => $type,
                'reason' => $reason,
                'qty' => $qty,
                'cost' => $cost > 0 ? $cost : $material->avg_cost, // Use current avg cost if no specific cost provided
                'batch_number' => $batchNumber,
                'expiry_date' => $expiryDate,
                'notes' => $notes,
                'reference_type' => $reference ? get_class($reference) : null,
                'reference_id' => $reference ? $reference->id : null,
            ]);
        });
    }

    /**
     * Reserve stock for a pending order or process.
     */
    public function reserveStock(Material $material, float $qty, $reference)
    {
        return DB::transaction(function () use ($material, $qty, $reference) {
            $material->increment('qty_reserved', $qty);

            return \App\Models\StockReservation::create([
                'branch_id' => $material->branch_id,
                'material_id' => $material->id,
                'reference_type' => get_class($reference),
                'reference_id' => $reference->id,
                'qty' => $qty,
                'status' => 'reserved',
            ]);
        });
    }

    /**
     * Release reserved stock (e.g., order cancelled).
     */
    public function releaseStock($reference)
    {
        return DB::transaction(function () use ($reference) {
            $reservations = StockReservation::where('reference_type', get_class($reference))
                ->where('reference_id', $reference->id)
                ->where('status', 'reserved')
                ->get();

            foreach ($reservations as $res) {
                /** @var StockReservation $res */
                $res->material->decrement('qty_reserved', $res->qty);
                $res->update(['status' => 'released']);
            }
        });
    }

    /**
     * Convert reservation to actual deduction (e.g., order paid/completed).
     */
    public function fulfillReservation($reference)
    {
        return DB::transaction(function () use ($reference) {
            $reservations = StockReservation::where('reference_type', get_class($reference))
                ->where('reference_id', $reference->id)
                ->where('status', 'reserved')
                ->get();

            foreach ($reservations as $res) {
                /** @var StockReservation $res */
                // 1. Release from reserved pool
                $res->material->decrement('qty_reserved', $res->qty);

                // 2. Actually deduct from stock
                $this->moveStock(
                    $res->material,
                    -$res->qty,
                    'out',
                    "Fulfilling reservation for " . class_basename($reference) . " #{$reference->id}",
                    $reference
                );

                $res->update(['status' => 'deducted']);
            }
        });
    }

    /**
     * Step 1 of Transfer: Reserve stock in source branch.
     */
    public function reserveTransfer(StockTransfer $transfer)
    {
        $material = Material::withoutGlobalScopes()->findOrFail($transfer->material_id);
        if ($material->stock < $transfer->quantity) {
            throw new \Exception("Insufficient stock in source branch.");
        }
        return $this->reserveStock($material, $transfer->quantity, $transfer);
    }

    /**
     * Step 2 of Transfer: Mark as Shipped (Stock leaves source branch).
     */
    public function shipTransfer(StockTransfer $transfer)
    {
        return DB::transaction(function () use ($transfer) {
            $this->fulfillReservation($transfer);
            $transfer->update([
                'status' => 'shipped',
                'shipped_at' => now(),
                'shipped_by' => auth()->id(),
            ]);
        });
    }

    /**
     * Step 3 of Transfer: Mark as Received (Stock arrives at destination branch).
     */
    public function receiveTransfer(StockTransfer $transfer)
    {
        return DB::transaction(function () use ($transfer) {
            $sourceMaterial = Material::withoutGlobalScopes()->findOrFail($transfer->material_id);
            
            // Find or create target material in destination branch
            $targetMaterial = Material::withoutGlobalScopes()
                ->where('branch_id', $transfer->to_branch_id)
                ->where('name', $sourceMaterial->name)
                ->first();

            if (!$targetMaterial) {
                $targetMaterial = $sourceMaterial->replicate();
                $targetMaterial->branch_id = $transfer->to_branch_id;
                $targetMaterial->stock = 0;
                $targetMaterial->qty_reserved = 0;
                $targetMaterial->save();
            }

            $this->moveStock(
                $targetMaterial,
                $transfer->quantity,
                'in',
                "Transfer from Branch #{$transfer->from_branch_id} (Ref: TRF#{$transfer->id})",
                $transfer,
                $sourceMaterial->avg_cost
            );

            $transfer->update([
                'status' => 'completed',
                'received_at' => now(),
                'received_by' => auth()->id(),
            ]);
        });
    }

    /**
     * Legacy transferStock method - kept for backward compatibility if needed, 
     * but recommended to use the 3-step workflow.
     */
    public function transferStock(StockTransfer $transfer)
    {
        return DB::transaction(function () use ($transfer) {
            $this->reserveTransfer($transfer);
            $this->shipTransfer($transfer);
            $this->receiveTransfer($transfer);
            return true;
        });
    }

    /**
     * Start a stock opname session (Snapshot).
     */
    public function createOpnameSession(int $branchId, ?string $notes = null, array $materialIds = [])
    {
        return DB::transaction(function () use ($branchId, $notes, $materialIds) {
            $session = StockOpnameSession::create([
                'branch_id' => $branchId,
                'status' => 'draft',
                'started_at' => now(),
                'notes' => $notes,
                'created_by' => auth()->id(),
            ]);

            // If no materialIds provided, take all that track inventory
            $materials = empty($materialIds)
                ? Material::where('track_inventory', true)->get()
                : Material::whereIn('id', $materialIds)->get();

            foreach ($materials as $material) {
                StockOpnameItem::create([
                    'session_id' => $session->id,
                    'material_id' => $material->id,
                    'system_qty' => $material->stock, // SNAPSHOT
                    'status' => 'pending',
                ]);
            }

            return $session;
        });
    }

    /**
     * Approve opname session and apply adjustments.
     */
    public function approveOpname(StockOpnameSession $session)
    {
        if ($session->status !== 'review') {
            throw new \Exception("Only sessions in 'review' status can be approved.");
        }

        return DB::transaction(function () use ($session) {
            $totalVarianceValue = 0;

            foreach ($session->items as $item) {
                if ($item->counted_qty !== null) {
                    $variance = $item->counted_qty - $item->system_qty;

                    if ($variance != 0) {
                        $movement = $this->moveStock(
                            $item->material,
                            $variance,
                            'adjustment',
                            "Stock Opname Adjustment - Session #{$session->id}",
                            $session
                        );

                        if ($movement) {
                            $totalVarianceValue += $movement->qty * $movement->cost;
                        }
                    }
                }
            }

            if ($totalVarianceValue != 0) {
                event(new \App\Events\StockAdjusted($totalVarianceValue, $session, $session->branch_id));
            }

            $session->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => auth()->id(),
                'completed_at' => now(),
            ]);

            return $session;
        });
    }

    /**
     * Record inventory waste.
     */
    public function recordWaste(Material $material, float $qty, ?string $notes = null, ?string $reason = null)
    {
        return $this->moveStock($material, -$qty, 'waste', $notes, null, 0, null, null, $reason);
    }

    /**
     * Process production: deduct ingredients and add finished/semi-finished goods.
     */
    public function produceItem(Material $material, float $qty, ?string $notes = null)
    {
        return DB::transaction(function () use ($material, $qty, $notes) {
            $recipeEngine = app(RecipeEngineService::class);
            
            // Find the menu that corresponds to this material
            $menu = \App\Models\Menu::where('name', $material->name)->first();
            
            if (!$menu) {
                // If no recipe/menu found, we just add the stock of the material
                return $this->moveStock(
                    $material,
                    $qty,
                    'in',
                    $notes ?: "Production output (no recipe)"
                );
            }

            $explosion = $recipeEngine->explodeMenu($menu->id, $qty);

            foreach ($explosion->getIngredients() as $ingredient) {
                $neededQty = $ingredient['total_qty'];
                
                $this->moveStock(
                    $ingredient['material'],
                    -$neededQty,
                    'out',
                    "Production usage for {$qty} {$material->name}",
                    $material
                );
            }

            // Mark production as finished
            return $this->moveStock(
                $material,
                $qty,
                'in',
                $notes ?: "Production output"
            );
        });
    }
}
