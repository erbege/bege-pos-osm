<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Models\Material;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Exports\InventoryLedgerExport;
use Maatwebsite\Excel\Facades\Excel;

class InventoryLedgerController extends Controller
{
    /**
     * Display inventory ledger (stock movements).
     */
    public function index(Request $request)
    {
        $query = StockMovement::with(['material', 'creator', 'reference'])
            ->latest();

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        } elseif (auth()->user()->branch_id) {
            $query->where('branch_id', auth()->user()->branch_id);
        }

        // Filter by material
        if ($request->filled('material_id')) {
            $query->where('material_id', $request->material_id);
        }

        // Filter by movement type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Filter by reference type
        if ($request->filled('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        $movements = $query->paginate(20)->withQueryString();

        // Summary statistics
        $summary = $this->calculateSummary($query);

        return Inertia::render('Admin/Inventory/Ledger', [
            'movements' => $movements,
            'materials' => Material::where('track_inventory', true)
                ->select('id', 'name', 'sku')
                ->get(),
            'branches' => Branch::all(),
            'summary' => $summary,
            'filters' => [
                'branch_id' => $request->branch_id,
                'material_id' => $request->material_id,
                'type' => $request->type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'reference_type' => $request->reference_type,
            ],
        ]);
    }

    /**
     * Calculate summary statistics.
     */
    private function calculateSummary($query): array
    {
        $movements = $query->clone();
        
        $totalIncoming = $movements->clone()->incoming()->sum('qty');
        $totalOutgoing = abs($movements->clone()->outgoing()->sum('qty'));
        $totalIncomingValue = $movements->clone()->incoming()->sum(\Illuminate\Support\Facades\DB::raw('qty * cost'));
        $totalOutgoingValue = abs($movements->clone()->outgoing()->sum(\Illuminate\Support\Facades\DB::raw('qty * cost')));
        $netMovement = $totalIncoming - $totalOutgoing;
        $netValue = $totalIncomingValue - $totalOutgoingValue;

        return [
            'total_movements' => $movements->count(),
            'total_incoming' => round($totalIncoming, 2),
            'total_outgoing' => round($totalOutgoing, 2),
            'net_movement' => round($netMovement, 2),
            'total_incoming_value' => round($totalIncomingValue, 2),
            'total_outgoing_value' => round($totalOutgoingValue, 2),
            'net_value' => round($netValue, 2),
        ];
    }

    /**
     * Display material stock history.
     */
    public function materialHistory(int $materialId)
    {
        $material = Material::findOrFail($materialId);
        
        $movements = StockMovement::with(['creator', 'reference'])
            ->where('material_id', $materialId)
            ->latest()
            ->paginate(50);

        // Calculate running balance
        $runningBalance = 0;
        $movementsData = $movements->map(function ($movement) use (&$runningBalance) {
            $runningBalance += $movement->qty;
            return [
                ...$movement->toArray(),
                'running_balance' => $runningBalance,
            ];
        });

        return Inertia::render('Admin/Inventory/MaterialHistory', [
            'material' => $material,
            'movements' => [
                ...$movements->toArray(),
                'data' => $movementsData,
            ],
        ]);
    }

    /**
     * Export ledger to Excel.
     */
    public function export(Request $request)
    {
        $query = StockMovement::with(['material', 'creator', 'reference'])
            ->latest();

        // Apply same filters as index
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        } elseif (auth()->user()->branch_id) {
            $query->where('branch_id', auth()->user()->branch_id);
        }

        if ($request->filled('material_id')) {
            $query->where('material_id', $request->material_id);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        if ($request->filled('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        $movements = $query->get();
        $filename = 'inventory_ledger_' . now()->format('Y-m-d_His') . '.xlsx';

        return Excel::download(new InventoryLedgerExport($movements), $filename);
    }
}
