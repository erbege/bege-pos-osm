<?php

namespace App\Services\Inventory;

use App\Models\Material;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Support\Facades\DB;

class ReplenishmentService
{
    /**
     * Get items that are below their minimum stock level.
     */
    public function getLowStockItems(int $branchId)
    {
        return Material::where('branch_id', $branchId)
            ->where('track_inventory', true)
            ->whereRaw('stock <= min_stock')
            ->get();
    }

    /**
     * Calculate Average Daily Consumption (ADC) for a material over a specified window.
     */
    public function getAverageDailyConsumption(int $materialId, int $days = 30): float
    {
        $totalConsumed = \App\Models\StockMovement::where('material_id', $materialId)
            ->where('type', 'out')
            ->where('created_at', '>=', now()->subDays($days))
            ->sum(DB::raw('ABS(qty)'));

        return round($totalConsumed / $days, 4);
    }

    /**
     * Calculate comprehensive health metrics for a material.
     */
    public function getHealthMetrics($material)
    {
        $adc = $this->getAverageDailyConsumption($material->id);
        $dos = $adc > 0 ? round($material->stock / $adc, 1) : 999; // Days of Stock

        return [
            'adc' => $adc,
            'days_of_stock' => $dos,
            'is_low' => $material->stock <= $material->min_stock,
            'suggested_qty' => $this->calculateSuggestedQty($material, $adc),
            'safety_stock' => $this->calculateSafetyStock($material, $adc),
        ];
    }

    /**
     * Calculate Daily Consumption Trend for the last 30 days.
     */
    public function getConsumptionTrend(int $materialId, int $days = 30): array
    {
        return \App\Models\StockMovement::where('material_id', $materialId)
            ->where('type', 'out')
            ->where('created_at', '>=', now()->subDays($days))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(ABS(qty)) as daily_qty')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    /**
     * Predict future stock-out date based on ADC.
     */
    public function getForecast(int $materialId): array
    {
        $material = Material::findOrFail($materialId);
        $adc = $this->getAverageDailyConsumption($materialId);
        $history = $this->getConsumptionTrend($materialId);
        
        $forecast = [];
        $tempStock = $material->stock;
        
        for ($i = 1; $i <= 7; $i++) {
            $date = now()->addDays($i)->format('Y-m-d');
            $tempStock = max(0, $tempStock - $adc);
            $forecast[] = [
                'date' => $date,
                'projected_stock' => round($tempStock, 2),
                'is_below_min' => $tempStock <= $material->min_stock
            ];
        }

        return [
            'material_id' => $materialId,
            'material_name' => $material->name,
            'current_stock' => $material->stock,
            'min_stock' => $material->min_stock,
            'adc' => $adc,
            'history' => $history,
            'forecast' => $forecast,
            'stock_out_days' => $adc > 0 ? floor($material->stock / $adc) : 999,
            'suggested_reorder' => $this->calculateSuggestedQty($material, $adc)
        ];
    }

    /**
     * Calculate safety stock using a simple formula: (Max Daily * Max Lead Time) - (Avg Daily * Avg Lead Time)
     * Simplified: ADC * Lead Time Buffer (e.g., 20% buffer)
     */
    private function calculateSafetyStock($material, float $adc): float
    {
        $leadTime = $material->lead_time_days ?: 3; // Default 3 days
        return round($adc * $leadTime * 1.2, 2); // 20% safety factor
    }

    /**
     * Calculate suggested purchase quantity.
     */
    public function calculateSuggestedQty($material, float $adc = 0)
    {
        if ($adc <= 0) {
            $adc = $this->getAverageDailyConsumption($material->id);
        }

        $safetyStock = $this->calculateSafetyStock($material, $adc);
        $reorderPoint = $material->min_stock + $safetyStock;

        if ($material->stock > $reorderPoint) {
            return 0;
        }

        if ($material->max_stock > 0) {
            return max(0, $material->max_stock - $material->stock);
        }

        // Suggested: (ADC * 14 days) + safety stock - current stock
        $targetStock = ($adc * 14) + $safetyStock;
        return max(0, round($targetStock - $material->stock, 2));
    }

    /**
     * Generate a draft Purchase Order for all low stock items in a branch.
     */
    public function generateDraftPO(int $branchId, ?int $supplierId = null)
    {
        $lowStockItems = $this->getLowStockItems($branchId);

        if ($lowStockItems->isEmpty()) {
            return null;
        }

        return DB::transaction(function () use ($branchId, $supplierId, $lowStockItems) {
            $po = PurchaseOrder::create([
                'branch_id' => $branchId,
                'supplier_id' => $supplierId,
                'status' => 'draft',
                'created_by' => auth()->id(),
                'total_amount' => 0,
            ]);

            $totalAmount = 0;

            foreach ($lowStockItems as $material) {
                $qty = $this->calculateSuggestedQty($material);

                if ($qty <= 0)
                    continue;

                $unitCost = $material->avg_cost ?: 0;
                $subtotal = $qty * $unitCost;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'material_id' => $material->id,
                    'qty' => $qty,
                    'unit_cost' => $unitCost,
                    'subtotal' => $subtotal,
                ]);

                $totalAmount += $subtotal;
            }

            $po->update(['total_amount' => $totalAmount]);

            return $po;
        });
    }
}
