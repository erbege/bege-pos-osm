<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\StockTransfer;
use App\Models\Material;
use App\Models\Branch;
use App\Services\Inventory\InventoryEngineService;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isOwner = $user->hasRole('owner') || $user->hasRole('Admin');
        $activeBranchId = session('active_branch_id') ?: $user->branch_id;

        $query = StockTransfer::with(['fromBranch', 'toBranch', 'material', 'requester', 'approver', 'shipper', 'receiver', 'rejecter'])
            ->withoutGlobalScopes(); // Transfers cross branch boundaries

        if (!$isOwner) {
            // Staff can only see transfers involving their active branch
            $query->where(function ($q) use ($activeBranchId) {
                $q->where('from_branch_id', $activeBranchId)
                    ->orWhere('to_branch_id', $activeBranchId);
            });
        }

        return Inertia::render('Admin/StockTransfers/Index', [
            'transfers' => $query->latest()->paginate(15),
            'branches' => Branch::all(),
            'myMaterials' => Material::all(), // Scoped to current branch
            'activeBranchId' => (int) $activeBranchId
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        $activeBranchId = session('active_branch_id') ?: $user->branch_id;

        return Inertia::render('Admin/StockTransfers/Create', [
            'branches' => Branch::where('id', '!=', $activeBranchId)->get(),
            'materials' => Material::all(), // Scoped to active branch
            'activeBranchId' => (int) $activeBranchId
        ]);
    }

    public function show($transfer)
    {
        if (!$transfer instanceof StockTransfer) {
            $transfer = StockTransfer::withoutGlobalScopes()
                ->with(['fromBranch', 'toBranch', 'material', 'requester', 'approver', 'shipper', 'receiver', 'rejecter'])
                ->findOrFail($transfer);
        }

        $user = auth()->user();
        $activeBranchId = session('active_branch_id') ?: $user->branch_id;

        return Inertia::render('Admin/StockTransfers/Show', [
            'transfer' => $transfer,
            'activeBranchId' => (int) $activeBranchId
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:transfer,request',
            'target_branch_id' => 'required|exists:branches,id',
            'material_id' => 'required|exists:materials,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        $user = auth()->user();
        $activeBranchId = session('active_branch_id') ?: $user->branch_id;

        if ($validated['target_branch_id'] == $activeBranchId) {
            return back()->with('error', 'Source and destination branches must be different.');
        }

        $material = Material::findOrFail($validated['material_id']);

        // Logical Source and Destination
        if ($validated['type'] === 'transfer') {
            // Push: ACTIVE -> TARGET
            $fromBranchId = $activeBranchId;
            $toBranchId = $validated['target_branch_id'];
            $sourceMaterialId = $material->id;

            // Ensure sender has enough stock (for Transfers)
            if ($material->stock < $validated['quantity']) {
                return back()->with('error', 'Insufficient stock for transfer.');
            }
        } else {
            // Pull (Request): TARGET -> ACTIVE
            $fromBranchId = $validated['target_branch_id'];
            $toBranchId = $activeBranchId;

            // Find equivalent material in target branch
            $sourceMaterial = Material::withoutGlobalScopes()
                ->where('branch_id', $fromBranchId)
                ->where('name', $material->name)
                ->first();

            if (!$sourceMaterial) {
                return back()->with('error', "Material '{$material->name}' not found in the target branch.");
            }

            $sourceMaterialId = $sourceMaterial->id;
        }

        StockTransfer::create([
            'from_branch_id' => $fromBranchId,
            'to_branch_id' => $toBranchId,
            'material_id' => $sourceMaterialId,
            'quantity' => $validated['quantity'],
            'status' => 'pending',
            'requested_by' => auth()->id(),
            'notes' => $validated['notes'],
        ]);

        return back()->with('success', 'Stock transfer ' . ($validated['type'] === 'request' ? 'request submitted.' : 'initiated.'));
    }

    public function update(Request $request, $transfer)
    {
        if (!$transfer instanceof StockTransfer) {
            $transfer = StockTransfer::withoutGlobalScopes()->findOrFail($transfer);
        }

        \Illuminate\Support\Facades\Log::info('Transfer Update Action', [
            'id' => $transfer->id,
            'status' => $transfer->status,
            'action' => $request->action
        ]);

        $request->validate([
            'action' => 'required|in:approve,reject,ship,receive',
        ]);

        $inventory = app(InventoryEngineService::class);
        $user = auth()->user();

        try {
            switch ($request->action) {
                case 'approve':
                    if ($transfer->status !== 'pending') throw new \Exception("Transfer is already processed.");
                    DB::transaction(function () use ($transfer, $inventory) {
                        $inventory->reserveTransfer($transfer);
                        $transfer->update([
                            'status' => 'approved',
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                        ]);
                    });
                    return back()->with('success', 'Transfer approved and stock reserved.');

                case 'reject':
                    if (!in_array($transfer->status, ['pending', 'approved'])) throw new \Exception("Cannot reject transfer in current state.");
                    DB::transaction(function () use ($transfer, $inventory) {
                        if ($transfer->status === 'approved') {
                            $inventory->releaseStock($transfer);
                        }
                        $transfer->update([
                            'status' => 'rejected',
                            'rejected_by' => auth()->id(),
                            'rejected_at' => now(),
                        ]);
                    });
                    return back()->with('success', 'Transfer rejected.');

                case 'ship':
                    if ($transfer->status !== 'approved') throw new \Exception("Transfer must be approved before shipping.");
                    $inventory->shipTransfer($transfer);
                    return back()->with('success', 'Stock has been marked as in-transit.');

                case 'receive':
                    if ($transfer->status !== 'shipped') throw new \Exception("Transfer must be shipped before receiving.");
                    $inventory->receiveTransfer($transfer);
                    return back()->with('success', 'Stock received and updated in destination branch.');
            }
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back();
    }

    public function destroy(StockTransfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            return back()->with('error', 'Only pending transfers can be deleted.');
        }

        if ($transfer->requested_by !== auth()->id() && !auth()->user()->hasRole('Admin')) {
            return back()->with('error', 'Unauthorized.');
        }

        $transfer->delete();
        return back()->with('success', 'Transfer request deleted.');
    }
}
