<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\Inventory\ReplenishmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Material;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    protected $replenishmentService;

    public function __construct(ReplenishmentService $replenishmentService)
    {
        $this->replenishmentService = $replenishmentService;
    }

    public function index()
    {
        $branchId = auth()->user()->branch_id;

        if (!$branchId) {
            // Fallback for users without branch (e.g. newly created admin)
            $branchId = \App\Models\Branch::first()?->id;
        }

        $materials = $this->replenishmentService->getLowStockItems($branchId)
            ->map(function ($material) {
                $metrics = $this->replenishmentService->getHealthMetrics($material);
                $materialArray = $material->toArray();
                return array_merge($materialArray, [
                    'avg_daily_consumption' => $metrics['avg_daily_consumption'] ?? 0,
                    'days_remaining' => $metrics['days_to_depletion'] ?? 0,
                ]);
            });

        return Inertia::render('Admin/Inventory/PurchasePlanning', [
            'materials' => $materials,
            'recentPOs' => PurchaseOrder::with(['supplier', 'creator'])
                ->where('branch_id', $branchId)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get(),
            'branches' => \App\Models\Branch::all(),
            'suppliers' => \App\Models\Supplier::all(),
        ]);
    }

    public function getForecast($material)
    {
        if (!$material instanceof Material) {
            $material = Material::findOrFail($material);
        }
        return response()->json($this->replenishmentService->getForecast($material->id));
    }

    public function generateDraft(Request $request)
    {
        $branchId = auth()->user()->branch_id;
        $po = $this->replenishmentService->generateDraftPO($branchId, $request->supplier_id);

        if (!$po) {
            return back()->with('error', 'No low stock items found to reorder.');
        }

        return back()->with('success', "Draft Purchase Order #{$po->po_number} generated!");
    }

    public function show($purchaseOrder)
    {
        if (!$purchaseOrder instanceof PurchaseOrder) {
            $purchaseOrder = PurchaseOrder::findOrFail($purchaseOrder);
        }
        return Inertia::render('Admin/Inventory/PODetail', [
            'purchaseOrder' => $purchaseOrder->load(['items.material', 'supplier', 'creator']),
        ]);
    }

    public function updateStatus(Request $request, PurchaseOrder $purchaseOrder)
    {
        $request->validate([
            'status' => 'required|string',
            'items_data' => 'nullable|array',
            'items_data.*.item_id' => 'required_with:items_data|exists:purchase_order_items,id',
            'items_data.*.batch_number' => 'nullable|string',
            'items_data.*.expiry_date' => 'nullable|date',
        ]);

        $purchaseOrder->update(['status' => $request->status]);

        if ($request->status === 'received') {
            $purchaseOrder->update(['received_at' => now()]);

            // Map request data by item ID for quick lookup
            $itemsData = collect($request->items_data)->keyBy('item_id');

            // Logic to add to inventory
            $inventoryService = app(\App\Services\Inventory\InventoryEngineService::class);
            foreach ($purchaseOrder->items as $item) {
                $itemExtra = $itemsData->get($item->id);

                $inventoryService->moveStock(
                    $item->material,
                    $item->qty,
                    'in',
                    "Purchase Order #{$purchaseOrder->po_number}",
                    $purchaseOrder,
                    $item->unit_cost,
                    $itemExtra['batch_number'] ?? null,
                    $itemExtra['expiry_date'] ?? null
                );
            }

            // Trigger Accounting Event
            event(new \App\Events\PurchaseReceived($purchaseOrder));
        }

        return back()->with('success', "Purchase Order updated to {$request->status}");
    }

    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'quantity' => 'required|numeric|min:0.01',
            'cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $branchId = auth()->user()->branch_id;

        return DB::transaction(function () use ($validated, $branchId) {
            $material = Material::findOrFail($validated['material_id']);
            $unitCost = $validated['cost'] / $validated['quantity'];

            // 1. Create PO
            $po = PurchaseOrder::create([
                'branch_id' => $branchId,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'status' => 'received',
                'created_by' => auth()->id(),
                'total_amount' => $validated['cost'],
                'received_at' => now(),
            ]);

            // 2. Create PO Item
            $po->items()->create([
                'material_id' => $validated['material_id'],
                'qty' => $validated['quantity'],
                'unit_cost' => $unitCost,
                'subtotal' => $validated['cost'],
            ]);

            // 3. Update Inventory
            $inventoryService = app(\App\Services\Inventory\InventoryEngineService::class);
            $inventoryService->moveStock(
                $material,
                $validated['quantity'],
                'in',
                "Quick Purchase (PO #{$po->po_number})",
                $po,
                $unitCost
            );

            // Trigger Accounting Event
            event(new \App\Events\PurchaseReceived($po));

            return back()->with('success', "Quick purchase recorded under PO #{$po->po_number}");
        });
    }

    public function analytics()
    {
        $branchId = auth()->user()->branch_id;

        // 1. Monthly Spending (Last 6 months)
        $spendingTrends = \App\Models\Transaction::where('type', 'expense')
            ->where('branch_id', $branchId)
            ->where('description', 'like', 'Purchase Order%')
            ->select(
                DB::raw('DATE_FORMAT(date, "%Y-%m") as month'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(6)
            ->get();

        // 2. Top Materials by Cost (Last 30 days)
        $topMaterials = \App\Models\PurchaseOrderItem::whereHas('purchaseOrder', function ($q) use ($branchId) {
            $q->where('branch_id', $branchId)->where('status', 'received');
        })
            ->with('material')
            ->select('material_id', DB::raw('SUM(subtotal) as total_spend'), DB::raw('SUM(qty) as total_qty'))
            ->groupBy('material_id')
            ->orderByDesc('total_spend')
            ->limit(5)
            ->get();

        // 3. Supplier Performance
        $supplierStats = \App\Models\Supplier::withCount([
            'purchaseOrders' => function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)->where('status', 'received');
            }
        ])
        ->leftJoin('purchase_orders', function($join) use ($branchId) {
            $join->on('suppliers.id', '=', 'purchase_orders.supplier_id')
                 ->where('purchase_orders.branch_id', '=', $branchId)
                 ->where('purchase_orders.status', '=', 'received');
        })
        ->select('suppliers.id', 'suppliers.name', DB::raw('SUM(purchase_orders.total_amount) as total_spend'))
        ->groupBy('suppliers.id', 'suppliers.name')
        ->orderByDesc('total_spend')
        ->get()
        ->map(fn($s) => [
            'name' => $s->name,
            'order_count' => $s->purchase_orders_count ?? 0,
            'total_spend' => (float) ($s->total_spend ?? 0)
        ]);

        return Inertia::render('Admin/Inventory/PurchaseAnalytics', [
            'spendingTrends' => $spendingTrends,
            'topMaterials' => $topMaterials,
            'supplierStats' => $supplierStats,
        ]);
    }

    public function downloadPDF(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'branch', 'items.material', 'creator']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.purchase-order', [
            'po' => $purchaseOrder
        ]);

        return $pdf->download("PO-{$purchaseOrder->po_number}.pdf");
    }

    public function emailToSupplier(PurchaseOrder $purchaseOrder)
    {
        if (!$purchaseOrder->supplier || !$purchaseOrder->supplier->email) {
            return back()->with('error', 'Supplier does not have an email address.');
        }

        $purchaseOrder->load(['supplier', 'branch', 'items.material', 'creator']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.purchase-order', [
            'po' => $purchaseOrder
        ]);

        \Illuminate\Support\Facades\Mail::to($purchaseOrder->supplier->email)
            ->send(new \App\Mail\PurchaseOrderMail($purchaseOrder, $pdf->output()));

        return back()->with('success', "Purchase Order emailed to {$purchaseOrder->supplier->email}");
    }
}
