<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Material;
use App\Models\Category;
use App\Models\Supplier;
use Inertia\Inertia;

class MaterialController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Materials', [
            'materials' => Material::with('category')->get(),
            'categories' => Category::all(),
            'suppliers' => Supplier::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:materials,sku',
            'category_id' => 'nullable|exists:categories,id',
            'type' => 'required|string|in:raw_material,semi_finished,finished',
            'track_inventory' => 'nullable|boolean',
            'unit' => 'required|string|max:50',
            'purchase_unit' => 'nullable|string|max:50',
            'conversion_factor' => 'nullable|numeric|min:0.01',
            'stock' => 'nullable|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'lead_time_days' => 'nullable|integer|min:0',
        ]);

        if (empty($validated['sku'])) {
            $validated['sku'] = 'MAT-' . strtoupper(str_replace('.', '', uniqid()));
        }

        if (!isset($validated['track_inventory'])) $validated['track_inventory'] = true;
        if (!isset($validated['stock'])) $validated['stock'] = 0;

        Material::create($validated);

        return back()->with('success', 'Material created successfully.');
    }

    public function update(Request $request, Material $material)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:materials,sku,' . $material->id,
            'category_id' => 'nullable|exists:categories,id',
            'type' => 'required|string|in:raw_material,semi_finished,finished',
            'track_inventory' => 'nullable|boolean',
            'unit' => 'required|string|max:50',
            'purchase_unit' => 'nullable|string|max:50',
            'conversion_factor' => 'nullable|numeric|min:0.01',
            'stock' => 'nullable|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'lead_time_days' => 'nullable|integer|min:0',
        ]);

        if (empty($validated['sku'])) {
            $validated['sku'] = 'MAT-' . strtoupper(str_replace('.', '', uniqid()));
        }

        if (isset($validated['track_inventory'])) {
            $validated['track_inventory'] = (bool)$validated['track_inventory'];
        }

        $material->update($validated);

        return back()->with('success', 'Material updated successfully.');
    }

    public function destroy(Material $material)
    {
        $material->delete();

        return back()->with('success', 'Material deleted successfully.');
    }

    public function adjust(Request $request, Material $material)
    {
        $validated = $request->validate([
            'qty' => 'required|numeric',
            'type' => 'required|in:adjustment,waste',
            'notes' => 'nullable|string',
        ]);

        $inventory = app(\App\Services\Inventory\InventoryEngineService::class);
        $inventory->moveStock($material, $validated['qty'], $validated['type'], $validated['notes']);

        return back()->with('success', 'Stock adjusted successfully.');
    }
}
