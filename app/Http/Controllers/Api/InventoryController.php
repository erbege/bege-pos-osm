<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\StockOpnameSession;
use App\Models\StockOpnameItem;
use Illuminate\Http\Request;
use App\Actions\Inventory\CreateStockOpnameSessionAction;

class InventoryController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Material::where('track_inventory', true)->get()
        ]);
    }

    public function activeOpname()
    {
        $session = StockOpnameSession::with(['items.material'])
            ->whereIn('status', ['draft', 'in_progress'])
            ->latest()
            ->first();

        return response()->json([
            'data' => $session
        ]);
    }

    public function startOpname(Request $request, CreateStockOpnameSessionAction $action)
    {
        $session = $action->quickCreate(
            auth()->user()->branch_id ?? 1,
            $request->notes,
            $request->blind_count ?? false
        );

        return response()->json([
            'message' => 'Opname session started',
            'data' => $session->load('items.material')
        ]);
    }

    public function updateCount(Request $request, $itemId)
    {
        $request->validate([
            'actual_qty' => 'required|numeric|min:0',
        ]);

        $item = StockOpnameItem::findOrFail($itemId);
        $item->update([
            'actual_qty' => $request->actual_qty,
            'counted_at' => now(),
            'counted_by' => auth()->id(),
            'status' => 'counted'
        ]);

        return response()->json([
            'message' => 'Stock count updated',
            'data' => $item
        ]);
    }

    public function submitOpname($sessionId)
    {
        $session = StockOpnameSession::findOrFail($sessionId);
        $session->update([
            'status' => 'pending_approval',
            'completed_at' => now()
        ]);

        return response()->json([
            'message' => 'Opname session submitted for approval',
            'data' => $session
        ]);
    }

    public function adjust(Request $request)
    {
        $request->validate([
            'material_id' => 'required|exists:materials,id',
            'adjustment' => 'required|numeric',
            'type' => 'nullable|string',
            'reason' => 'nullable|string',
        ]);

        $material = Material::findOrFail($request->material_id);

        $material->movements()->create([
            'branch_id' => auth()->user()->branch_id ?? 1,
            'qty' => $request->adjustment,
            'type' => $request->type ?? 'adjustment',
            'reason' => $request->reason ?? 'Manual adjustment from mobile app',
            'created_by' => auth()->id(),
        ]);

        $material->increment('stock', $request->adjustment);

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'data' => $material->fresh()
        ]);
    }
}
