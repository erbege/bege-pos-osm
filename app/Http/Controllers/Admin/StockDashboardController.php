<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\StockMovement;
use App\Models\Branch;
use App\Models\StockOpnameSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StockDashboardController extends Controller
{
    public function index(Request $request)
    {
        $branchId = $request->branch_id ?? auth()->user()->branch_id;
        $isOwner = auth()->user()->hasRole('owner') || auth()->user()->hasRole('Admin');

        // Scoped query for materials
        $materialQuery = Material::where('track_inventory', true);
        if ($branchId) {
            $materialQuery->where('branch_id', $branchId);
        }

        // 1. Key Metrics
        $totalItems = $materialQuery->count();
        $lowStockCount = (clone $materialQuery)->whereRaw('stock <= min_stock')->count();
        $outOfStockCount = (clone $materialQuery)->where('stock', '<=', 0)->count();
        $totalInventoryValue = (clone $materialQuery)->selectRaw('SUM(stock * last_purchase_price) as total_value')->value('total_value') ?? 0;

        // 2. Movement Trends (Last 7 Days)
        $sevenDaysAgo = Carbon::now()->subDays(6)->startOfDay();
        
        $movements = StockMovement::where('created_at', '>=', $sevenDaysAgo);
        if ($branchId) {
            $movements->where('branch_id', $branchId);
        }

        $movementTrends = $movements->select(
            DB::raw('DATE(created_at) as date'),
            DB::raw("SUM(CASE WHEN qty > 0 THEN qty ELSE 0 END) as incoming"),
            DB::raw("SUM(CASE WHEN qty < 0 THEN ABS(qty) ELSE 0 END) as outgoing")
        )
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        // 3. Top Movements (Items with highest activity)
        $topMovedItems = StockMovement::with('material')
            ->select('material_id', DB::raw('SUM(ABS(qty)) as total_qty'))
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->groupBy('material_id')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get()
            ->map(fn($m) => [
                'name' => $m->material->name ?? 'Unknown',
                'qty' => round($m->total_qty, 2),
                'unit' => $m->material->unit ?? ''
            ]);

        // 4. Low Stock Alerts (Detail)
        $lowStockItems = (clone $materialQuery)
            ->whereRaw('stock <= min_stock')
            ->orderByRaw('stock / min_stock ASC')
            ->limit(10)
            ->get();

        // 5. Recent Opname Variance Analysis
        $recentOpnames = StockOpnameSession::with(['branch'])
            ->where('status', 'approved')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'date' => $s->approved_at?->format('Y-m-d') ?? $s->updated_at->format('Y-m-d'),
                'branch' => $s->branch->name ?? 'N/A',
                'variance_value' => round($s->total_variance_value ?? 0, 2),
                'items_count' => $s->items_count ?? 0
            ]);

        return Inertia::render('Admin/Inventory/StockDashboard', [
            'metrics' => [
                'total_items' => $totalItems,
                'low_stock' => $lowStockCount,
                'out_of_stock' => $outOfStockCount,
                'total_value' => round($totalInventoryValue, 2),
            ],
            'trends' => $movementTrends,
            'topItems' => $topMovedItems,
            'lowStockItems' => $lowStockItems,
            'recentOpnames' => $recentOpnames,
            'branches' => $isOwner ? Branch::all() : [],
            'filters' => [
                'branch_id' => $branchId,
            ],
            'isOwner' => $isOwner
        ]);
    }
}
