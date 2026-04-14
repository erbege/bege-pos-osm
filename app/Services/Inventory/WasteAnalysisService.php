<?php

namespace App\Services\Inventory;

use App\Models\StockMovement;
use App\Models\Material;
use Illuminate\Support\Facades\DB;

class WasteAnalysisService
{
    /**
     * Generate smart recommendations to reduce wastage.
     */
    public function getRecommendations(int $branchId, int $days = 30): array
    {
        $recommendations = [];

        // 1. Analyze high frequency wastage (Small but frequent)
        $frequentWaste = StockMovement::where('type', 'waste')
            ->where('branch_id', $branchId)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('material_id', DB::raw('COUNT(*) as frequency'), DB::raw('SUM(ABS(qty)) as total_qty'))
            ->groupBy('material_id')
            ->having('frequency', '>', 3)
            ->with('material')
            ->get();

        foreach ($frequentWaste as $item) {
            $recommendations[] = [
                'type' => 'process_improvement',
                'priority' => 'medium',
                'title' => "Optimize Handling for {$item->material->name}",
                'description' => "This item was reported as waste {$item->frequency} times in the last {$days} days. Review storage conditions or handling procedures.",
                'potential_saving' => $item->total_qty * $item->material->avg_cost
            ];
        }

        // 2. Analyze high value wastage (Large financial impact)
        $highValueWaste = StockMovement::where('type', 'waste')
            ->where('branch_id', $branchId)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('material_id', DB::raw('SUM(ABS(qty) * cost) as total_loss'))
            ->groupBy('material_id')
            ->orderByDesc('total_loss')
            ->limit(3)
            ->with('material')
            ->get();

        foreach ($highValueWaste as $item) {
            if ($item->total_loss > 50000) { // Threshold for high value
                $recommendations[] = [
                    'type' => 'financial_impact',
                    'priority' => 'high',
                    'title' => "Reduce Batch size for {$item->material->name}",
                    'description' => "High value loss detected (Rp " . number_format($item->total_loss) . "). Consider producing in smaller batches to avoid spoilage.",
                    'potential_saving' => $item->total_loss * 0.5 // Hypothetical 50% reduction
                ];
            }
        }

        // 3. Analyze wastage vs Usage (Efficiency ratio)
        // Get total usage (out type)
        $usage = StockMovement::where('type', 'out')
            ->where('branch_id', $branchId)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('material_id', DB::raw('SUM(ABS(qty)) as total_used'))
            ->groupBy('material_id')
            ->get()
            ->keyBy('material_id');

        $wasteRatios = StockMovement::where('type', 'waste')
            ->where('branch_id', $branchId)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('material_id', DB::raw('SUM(ABS(qty)) as total_waste'))
            ->groupBy('material_id')
            ->with('material')
            ->get();

        foreach ($wasteRatios as $item) {
            $used = $usage[$item->material_id]->total_used ?? 0;
            if ($used > 0) {
                $ratio = ($item->total_waste / ($used + $item->total_waste)) * 100;
                if ($ratio > 15) { // More than 15% waste is critical
                    $recommendations[] = [
                        'type' => 'efficiency',
                        'priority' => 'high',
                        'title' => "Critical Waste Ratio: {$item->material->name}",
                        'description' => "Wastage rate is " . round($ratio, 1) . "% of total usage. Immediate review of preparation and storage required.",
                        'potential_saving' => $item->total_waste * $item->material->avg_cost
                    ];
                }
            }
        }

        return collect($recommendations)->sortByDesc(function($r) {
            return $r['priority'] === 'high' ? 2 : 1;
        })->values()->toArray();
    }
}
