<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Material;
use App\Models\StockMovement;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Purchases', [
            'suppliers' => Supplier::latest()->get(),
            'materials' => Material::all(),
            'purchases' => StockMovement::where('type', 'in')
                ->with('material')
                ->latest()
                ->take(50)
                ->get(),
        ]);
    }

    public function storeSupplier(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        Supplier::create($data);
        return redirect()->back()->with('success', 'Supplier added.');
    }

    public function storePurchase(Request $request)
    {
        $data = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'quantity' => 'required|numeric|min:0.01',
            'cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($data) {
            $material = Material::findOrFail($data['material_id']);
            $conversionFactor = $material->conversion_factor ?? 1;
            $baseQty = $data['quantity'] * $conversionFactor;

            // Stock in (stored in base units)
            StockMovement::create([
                'material_id' => $data['material_id'],
                'type' => 'in',
                'qty' => $baseQty,
                'notes' => $data['notes'] ?? 'Purchase',
            ]);

            // Increment current stock in base units
            $material->increment('stock', $baseQty);

            // Record expense
            Transaction::create([
                'type' => 'expense',
                'amount' => $data['cost'],
                'description' => 'Purchase: ' . $material->name,
                'date' => now(),
                'branch_id' => $material->branch_id,
            ]);
        });

        return redirect()->back()->with('success', 'Purchase recorded & stock updated.');
    }
}
