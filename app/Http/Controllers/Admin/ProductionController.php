<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductionOrder;
use App\Models\Material;
use App\Services\Inventory\InventoryEngineService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductionController extends Controller
{
    protected $inventory;

    public function __construct(InventoryEngineService $inventory)
    {
        $this->inventory = $inventory;
    }

    public function index()
    {
        return Inertia::render('Admin/Inventory/Production', [
            'productions' => ProductionOrder::with(['material', 'creator', 'completer'])
                ->latest()
                ->get(),
            'materials' => Material::where('type', '!=', 'raw_material')->get()
        ]);
    }

    public function getRecipe(Request $request, $material)
    {
        if (!$material instanceof Material) {
            $material = Material::findOrFail($material);
        }

        $qty = $request->query('qty', 1);
        $recipeEngine = app(\App\Services\Inventory\RecipeEngineService::class);
        
        // Find the menu that corresponds to this material
        $menu = \App\Models\Menu::where('name', $material->name)->first();
        
        if (!$menu) {
            return response()->json([
                'total_estimated_cost' => 0,
                'can_produce' => false,
                'ingredients' => [],
                'error' => 'No recipe found for this item.'
            ]);
        }

        $availability = $recipeEngine->checkAvailability($menu->id, $qty);
        
        // We also need cost info, checkAvailability doesn't provide it directly in the same format
        // Let's use getRecipeDetails for cost and mapping
        $details = $recipeEngine->getRecipeDetails($menu->id);
        
        $ingredients = [];
        $totalCost = 0;

        $materialIds = collect($availability['ingredients'])->pluck('material_id');
        $materials = Material::whereIn('id', $materialIds)->get()->keyBy('id');

        foreach ($availability['ingredients'] as $ing) {
            $material = $materials->get($ing['material_id']);
            $cost = $material ? $material->avg_cost : 0;
            
            $ingredients[] = [
                'id' => $ing['material_id'],
                'name' => $ing['material_name'],
                'required' => $ing['required'],
                'unit' => $ing['unit'],
                'stock' => $ing['available'],
                'cost' => $cost
            ];
            
            $totalCost += ($cost * $ing['required']);
        }

        return response()->json([
            'total_estimated_cost' => $totalCost,
            'can_produce' => $availability['all_available'],
            'ingredients' => $ingredients,
            'max_possible' => 0, // Not strictly needed by the current JSX but good to have
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'material_id' => 'required|exists:materials,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        $material = Material::findOrFail($request->material_id);

        // Process production immediately for now (can be simplified if we want a separate approval step)
        $this->inventory->produceItem($material, $request->quantity, $request->notes);

        ProductionOrder::create([
            'branch_id' => auth()->user()->branch_id,
            'material_id' => $request->material_id,
            'qty' => $request->quantity,
            'status' => 'completed',
            'notes' => $request->notes,
            'created_by' => auth()->id(),
            'completed_by' => auth()->id(),
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Production recorded successfully and stock updated.');
    }
}
