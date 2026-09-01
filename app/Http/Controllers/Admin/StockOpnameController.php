<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\StockOpnameSession;
use App\Models\StockOpnameItem;
use App\Models\Material;
use App\Http\Requests\Inventory\StoreStockOpnameRequest;
use App\Http\Requests\Inventory\UpdateStockOpnameItemRequest;
use App\Http\Requests\Inventory\ApproveStockOpnameRequest;
use App\Actions\Inventory\CreateStockOpnameSessionAction;
use App\Actions\Inventory\ApproveStockOpnameAction;
use App\DTO\OpnameSessionDTO;
use Inertia\Inertia;

class StockOpnameController extends Controller
{
    public function __construct(
        private CreateStockOpnameSessionAction $createSessionAction,
        private ApproveStockOpnameAction $approveAction,
    ) {}

    /**
     * Display stock opname sessions list.
     */
    public function index()
    {
        $sessions = StockOpnameSession::with(['creator', 'approver'])
            ->withCount('items')
            ->latest()
            ->get();

        return Inertia::render('Admin/Inventory/StockOpname', [
            'sessions' => $sessions,
            'materials' => Material::where('track_inventory', true)
                ->select('id', 'name', 'sku', 'track_inventory')
                ->get(),
        ]);
    }

    /**
     * Create a new stock opname session.
     */
    public function store(StoreStockOpnameRequest $request)
    {
        $dto = OpnameSessionDTO::fromArray([
            'branch_id' => auth()->user()->branch_id ?? 1,
            'scope' => $request->input('scope', 'all'),
            'category_ids' => $request->input('category_ids'),
            'warehouse_id' => $request->input('warehouse_id'),
            'material_ids' => $request->input('material_ids'),
            'notes' => $request->input('notes'),
            'blind_count' => $request->input('blind_count', false),
            'scheduled_at' => $request->input('scheduled_at'),
        ]);

        $session = $this->createSessionAction->execute($dto, auth()->id());

        return back()->with('success', 'Stock Opname session created successfully.');
    }

    /**
     * Show stock opname session details.
     */
    public function show(StockOpnameSession $session)
    {
        $session->load(['items.material', 'creator', 'approver']);

        // Calculate variance analysis for review/approved sessions
        $varianceAnalysis = null;
        if (in_array($session->status, ['review', 'approved', 'cancelled'])) {
            $varianceAnalysis = $this->approveAction->getVarianceAnalysis($session);
        }

        return Inertia::render('Admin/Inventory/StockOpnameDetail', [
            'session' => $session,
            'varianceAnalysis' => $varianceAnalysis,
        ]);
    }

    /**
     * Update counted quantities for multiple items.
     */
    public function updateItems(Request $request, StockOpnameSession $session)
    {
        if (!in_array($session->status, ['draft', 'counting'])) {
            return back()->with('error', 'Cannot update counts: session is already submitted.');
        }

        $itemsData = collect($request->input('items', []))->keyBy('id');
        $itemIds = $itemsData->keys();

        $items = $session->items()->whereIn('id', $itemIds)->get();

        foreach ($items as $item) {
            $data = $itemsData->get($item->id);
            if (isset($data['counted_qty']) && $data['counted_qty'] !== '') {
                $variance = $data['counted_qty'] - $item->system_qty;
                $item->update([
                    'counted_qty' => $data['counted_qty'],
                    'variance' => $variance,
                    'notes' => $data['notes'] ?? null,
                    'status' => 'reviewed',
                    'counted_at' => now(),
                    'counted_by' => auth()->id(),
                ]);
            }
        }

        return back()->with('success', 'Counts updated successfully.');
    }

    /**
     * Update counted quantity for an item.
     */
    public function updateItem(UpdateStockOpnameItemRequest $request, StockOpnameItem $item)
    {
        // Check if session is still in draft/counting status
        if (!in_array($item->session->status, ['draft', 'counting'])) {
            return back()->with('error', 'Cannot update counts: session is already submitted.');
        }

        $variance = $request->counted_qty - $item->system_qty;

        $item->update([
            'counted_qty' => $request->counted_qty,
            'variance' => $variance,
            'notes' => $request->notes,
            'status' => 'reviewed',
            'counted_at' => now(),
            'counted_by' => auth()->id(),
        ]);

        return back()->with('success', 'Item count updated successfully.');
    }

    /**
     * Submit session for review.
     */
    public function submitForReview(StockOpnameSession $session)
    {
        if (!in_array($session->status, ['draft', 'counting'])) {
            return back()->with('error', 'Session cannot be submitted from current status.');
        }

        // Check if all items are counted
        $uncountedItems = $session->items()->whereNull('counted_qty')->count();
        if ($uncountedItems > 0) {
            return back()->with('warning', "Please count all items before submitting. {$uncountedItems} items remaining.");
        }

        $session->update([
            'status' => 'review',
            'submitted_at' => now(),
            'submitted_by' => auth()->id(),
        ]);

        return back()->with('success', 'Session submitted for review successfully.');
    }

    /**
     * Approve stock opname session and apply adjustments.
     */
    public function approve(ApproveStockOpnameRequest $request, StockOpnameSession $session)
    {
        try {
            $this->approveAction->execute($session, auth()->id());
            return back()->with('success', 'Stock Opname approved and inventory adjusted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel a stock opname session.
     */
    public function cancel(StockOpnameSession $session)
    {
        if (!in_array($session->status, ['draft', 'counting'])) {
            return back()->with('error', 'Cannot cancel session from current status.');
        }

        $session->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_by' => auth()->id(),
        ]);

        return back()->with('success', 'Stock Opname session cancelled.');
    }

    /**
     * Restart counting for a session.
     */
    public function restartCounting(StockOpnameSession $session)
    {
        if ($session->status !== 'review') {
            return back()->with('error', 'Can only restart sessions in review status.');
        }

        $session->update([
            'status' => 'counting',
            'submitted_at' => null,
            'submitted_by' => null,
        ]);

        return back()->with('success', 'Session reopened for counting.');
    }
}
