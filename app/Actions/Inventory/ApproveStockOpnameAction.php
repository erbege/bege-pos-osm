<?php

namespace App\Actions\Inventory;

use App\Models\StockOpnameSession;
use App\Models\StockOpnameItem;
use App\Models\StockMovement;
use App\Models\Material;
use App\Services\Inventory\InventoryEngineService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Action to approve a stock opname session and apply inventory adjustments.
 * 
 * This action handles:
 * - Variance calculation
 * - Threshold validation
 * - Inventory adjustment creation
 * - Audit logging
 */
class ApproveStockOpnameAction
{
    public function __construct(
        private InventoryEngineService $inventoryEngine,
    ) {}

    /**
     * Execute the action.
     * 
     * @throws \Exception If session is not in review status
     */
    public function execute(StockOpnameSession $session, int $approverId): StockOpnameSession
    {
        if ($session->status !== 'review') {
            throw new \Exception("Only sessions in 'review' status can be approved. Current status: {$session->status}");
        }

        return DB::transaction(function () use ($session, $approverId) {
            $adjustments = [];
            $totalVarianceValue = 0;

            // Process each item and calculate adjustments
            foreach ($session->items as $item) {
                if ($item->counted_qty === null) {
                    continue; // Skip items not yet counted
                }

                $variance = $item->counted_qty - $item->system_qty;

                if ($variance != 0) {
                    // Calculate variance value for reporting
                    $varianceValue = $variance * $item->material->avg_cost;
                    $totalVarianceValue += $varianceValue;

                    // Create stock movement for adjustment
                    $movement = $this->createAdjustmentMovement(
                        $item,
                        $variance,
                        $session
                    );

                    $adjustments[] = [
                        'material_id' => $item->material_id,
                        'material_name' => $item->material->name,
                        'system_qty' => $item->system_qty,
                        'counted_qty' => $item->counted_qty,
                        'variance' => $variance,
                        'variance_value' => $varianceValue,
                        'movement_id' => $movement->id,
                    ];

                    Log::info("Stock Opname Adjustment: {$item->material->name}", [
                        'session_id' => $session->id,
                        'variance' => $variance,
                        'variance_value' => $varianceValue,
                    ]);
                }
            }

            // Update session status
            $session->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $approverId,
                'completed_at' => now(),
                'notes' => $this->appendApprovalNotes($session->notes, $totalVarianceValue),
            ]);

            // Log approval event
            Log::info("Stock Opname Session Approved", [
                'session_id' => $session->id,
                'approver_id' => $approverId,
                'total_variance_value' => $totalVarianceValue,
                'adjustments_count' => count($adjustments),
            ]);

            // Dispatch event for listeners (if needed)
            // event(new StockOpnameApproved($session, $adjustments));

            return $session->fresh();
        });
    }

    /**
     * Create stock movement for adjustment.
     */
    private function createAdjustmentMovement(
        StockOpnameItem $item,
        float $variance,
        StockOpnameSession $session
    ): StockMovement {
        return $this->inventoryEngine->moveStock(
            $item->material,
            $variance,
            'adjustment',
            "Stock Opname Adjustment - Session #{$session->id} - {$item->material->name}",
            $session,
            $item->material->avg_cost
        );
    }

    /**
     * Append approval notes with variance summary.
     */
    private function appendApprovalNotes(?string $notes, float $totalVarianceValue): string
    {
        $summary = sprintf(
            "[Approved] Net Variance Value: %s %s",
            $totalVarianceValue >= 0 ? '+' : '',
            number_format($totalVarianceValue, 2)
        );

        return $notes ? "{$notes} | {$summary}" : $summary;
    }

    /**
     * Get variance analysis for a session.
     */
    public function getVarianceAnalysis(StockOpnameSession $session): array
    {
        $items = $session->items->filter(fn($item) => $item->counted_qty !== null);

        $analysis = [
            'total_items' => $session->items->count(),
            'counted_items' => $items->count(),
            'items_with_variance' => 0,
            'positive_variance' => 0,
            'negative_variance' => 0,
            'total_variance_value' => 0,
            'largest_positive' => null,
            'largest_negative' => null,
            'variance_items' => [],
        ];

        foreach ($items as $item) {
            $variance = $item->counted_qty - $item->system_qty;
            $varianceValue = $variance * $item->material->avg_cost;

            if ($variance != 0) {
                $analysis['items_with_variance']++;
                $analysis['total_variance_value'] += $varianceValue;

                $varianceItem = [
                    'material_id' => $item->material_id,
                    'material_name' => $item->material->name,
                    'system_qty' => $item->system_qty,
                    'counted_qty' => $item->counted_qty,
                    'variance' => $variance,
                    'variance_value' => $varianceValue,
                    'variance_percentage' => $item->system_qty > 0 
                        ? ($variance / $item->system_qty) * 100 
                        : 0,
                ];

                $analysis['variance_items'][] = $varianceItem;

                if ($variance > 0) {
                    $analysis['positive_variance']++;
                    if (!$analysis['largest_positive'] || $variance > $analysis['largest_positive']['variance']) {
                        $analysis['largest_positive'] = $varianceItem;
                    }
                } else {
                    $analysis['negative_variance']++;
                    if (!$analysis['largest_negative'] || $variance < $analysis['largest_negative']['variance']) {
                        $analysis['largest_negative'] = $varianceItem;
                    }
                }
            }
        }

        $analysis['variance_percentage'] = $analysis['total_variance_value'] != 0
            ? ($analysis['total_variance_value'] / $session->items->sum(fn($i) => $i->system_qty * $i->material->avg_cost)) * 100
            : 0;

        return $analysis;
    }
}
