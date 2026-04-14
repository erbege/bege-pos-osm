<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Menu;
use App\Models\Category;
use App\Models\Material;
use App\Models\Recipe;
use App\Services\Inventory\RecipeEngineService;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class MenuController extends Controller
{
    public function __construct(
        private RecipeEngineService $recipeEngine,
    ) {}

    public function index()
    {
        return Inertia::render('Admin/Menus', [
            'menus' => Menu::with(['category', 'recipes.material'])->get(),
            'categories' => Category::all(),
            'materials' => Material::orderBy('name')->get(['id', 'name', 'unit']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'processing_category' => 'required|in:ready_to_serve,quick_prep,made_to_order',
            'is_available' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('menus', 'public');
        }

        Menu::create($validated);

        return back()->with('success', 'Menu item created successfully.');
    }

    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'processing_category' => 'required|in:ready_to_serve,quick_prep,made_to_order',
            'is_available' => 'boolean',
            'delete_existing_image' => 'nullable|boolean',
        ]);

        // Convert is_available explicitly in case FormData converts to string "true"/"false"
        if (isset($validated['is_available'])) {
            $validated['is_available'] = filter_var($validated['is_available'], FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->boolean('delete_existing_image')) {
            if ($menu->image) {
                Storage::disk('public')->delete($menu->image);
            }
            $validated['image'] = null; // Explicitly delete from database
        } elseif ($request->hasFile('image')) {
            if ($menu->image) {
                Storage::disk('public')->delete($menu->image);
            }
            $validated['image'] = $request->file('image')->store('menus', 'public');
        } else {
            // Prevent the database image from being overwritten with NULL if no new image is provided
            unset($validated['image']);
        }

        unset($validated['delete_existing_image']); // Don't try to save this to the db

        $menu->update($validated);

        return back()->with('success', 'Menu item updated successfully.');
    }

    public function destroy(Menu $menu)
    {
        if ($menu->image) {
            Storage::disk('public')->delete($menu->image);
        }

        $menu->delete();

        return back()->with('success', 'Menu item deleted successfully.');
    }

    /**
     * Sync recipes (ingredients) for a menu item.
     */
    public function syncRecipes(Request $request, Menu $menu)
    {
        $data = $request->validate([
            'recipes' => 'present|array',
            'recipes.*.material_id' => 'required|exists:materials,id',
            'recipes.*.qty' => 'required|numeric|min:0.01',
        ]);

        // Delete existing recipes and recreate
        $menu->recipes()->delete();

        foreach ($data['recipes'] as $recipe) {
            Recipe::create([
                'menu_id' => $menu->id,
                'material_id' => $recipe['material_id'],
                'qty' => $recipe['qty'],
            ]);
        }

        return back()->with('success', "Recipe for {$menu->name} updated ({$menu->recipes()->count()} ingredients).");
    }

    /**
     * Get recipe details with cost calculation.
     */
    public function recipeDetails(Menu $menu)
    {
        $details = $this->recipeEngine->getRecipeDetails($menu->id);
        return response()->json($details);
    }

    /**
     * Check ingredient availability.
     */
    public function checkAvailability(Menu $menu, Request $request)
    {
        $qty = $request->input('qty', 1);
        $availability = $this->recipeEngine->checkAvailability($menu->id, $qty);
        return response()->json($availability);
    }
}
