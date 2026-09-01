<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\StockMovement;
use App\Services\Inventory\InventoryEngineService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WasteController extends Controller
{
    protected $inventory;

    public function __construct(InventoryEngineService $inventory)
    {
        $this->inventory = $inventory;
    }

    public function index()
    {
        return Inertia::render('Admin/Inventory/Wastage', [
            'wastages' => StockMovement::with(['material', 'creator'])
                ->where('type', 'waste')
                ->latest()
                ->get(),
            'materials' => Material::where('track_inventory', true)->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'material_id' => 'required|exists:materials,id',
            'qty' => 'required|numeric|min:0.01',
            'reason' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        $material = Material::findOrFail($request->material_id);
        $this->inventory->recordWaste($material, $request->qty, $request->notes, $request->reason);

        return back()->with('success', 'Waste recorded successfully.');
    }

    public function analytics()
    {
        $branchId = auth()->user()->branch_id;
        $analysisService = app(\App\Services\Inventory\WasteAnalysisService::class);

        // 1. Weekly Trend (Last 7 days)
        $weeklyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $loss = StockMovement::where('type', 'waste')
                ->where('branch_id', $branchId)
                ->whereDate('created_at', $date->toDateString())
                ->get()
                ->sum(fn($m) => abs($m->qty) * $m->cost);
            
            $weeklyTrend[] = [
                'name' => $date->isoFormat('ddd'),
                'loss' => (float) $loss
            ];
        }

        // 2. Top Wasted Materials (Last 30 days)
        $topWasted = StockMovement::where('type', 'waste')
            ->where('branch_id', $branchId)
            ->where('created_at', '>=', now()->subDays(30))
            ->with('material')
            ->select('material_id', DB::raw('SUM(ABS(qty)) as total_qty'), DB::raw('SUM(ABS(qty) * cost) as total_value'), DB::raw('COUNT(*) as count'))
            ->groupBy('material_id')
            ->orderByDesc('total_value')
            ->limit(5)
            ->get()
            ->map(fn($m) => [
                'name' => $m->material->name ?? 'Unknown',
                'unit' => $m->material->unit ?? '',
                'count' => $m->count,
                'total_qty' => (float) $m->total_qty,
                'total_value' => (float) $m->total_value,
            ]);

        // 3. Stats Summary
        $totalLossMonth = StockMovement::where('type', 'waste')
            ->where('branch_id', $branchId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->get()
            ->sum(fn($m) => abs($m->qty) * $m->cost);

        $totalPurchasedMonth = StockMovement::where('type', 'in')
            ->where('branch_id', $branchId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->get()
            ->sum(fn($m) => abs($m->qty) * $m->cost);

        $wastePercentage = $totalPurchasedMonth > 0 
            ? round(($totalLossMonth / $totalPurchasedMonth) * 100, 1) 
            : 0;

        $stats = [
            'total_loss_value' => (float) $totalLossMonth,
            'waste_percentage' => $wastePercentage,
        ];

        // 4. Reason Distribution
        $reasonStats = StockMovement::where('type', 'waste')
            ->where('branch_id', $branchId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->select('reason', DB::raw('COUNT(*) as count'))
            ->groupBy('reason')
            ->get();

        $totalWasteCount = $reasonStats->sum('count');
        $reasonDist = $reasonStats->map(fn($rs) => [
            'name' => match($rs->reason) {
                'expired' => 'Kedaluwarsa',
                'damaged' => 'Rusak',
                'spillage' => 'Tumpah',
                'theft' => 'Kehilangan',
                default => ucfirst($rs->reason ?: 'Lainnya'),
            },
            'value' => $totalWasteCount > 0 ? round(($rs->count / $totalWasteCount) * 100) : 0
        ])->toArray();

        if (empty($reasonDist)) {
            $reasonDist = [['name' => 'Belum ada data', 'value' => 100]];
        }

        return Inertia::render('Admin/Inventory/WasteAnalytics', [
            'stats' => $stats,
            'topWasted' => $topWasted,
            'weeklyTrend' => $weeklyTrend,
            'reasonDist' => $reasonDist,
            'recommendations' => $analysisService->getRecommendations($branchId)
        ]);
    }
}
