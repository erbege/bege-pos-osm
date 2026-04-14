<?php

namespace App\Services\Inventory;

use App\Models\Menu;
use App\Models\Material;
use App\Models\Recipe;
use App\Models\ModifierIngredient;
use App\DTO\RecipeExplosionDTO;

class RecipeEngineService
{
    /**
     * Recursively explode a menu item into its base raw materials.
     */
    public function explodeMenu(int $menuId, float $orderQty = 1, array $modifierIds = []): RecipeExplosionDTO
    {
        $requirements = [];
        $this->resolveRequirements($menuId, $orderQty, $requirements);

        // Process modifiers
        foreach ($modifierIds as $modifierId) {
            $this->resolveModifierRequirements($modifierId, $orderQty, $requirements);
        }

        return RecipeExplosionDTO::fromRequirements($menuId, $orderQty, $requirements);
    }

    /**
     * Get recipe details with cost calculation for a menu item.
     */
    public function getRecipeDetails(int $menuId): array
    {
        $menu = Menu::with(['recipes.material'])->findOrFail($menuId);
        $recipes = $menu->recipes;

        $ingredients = [];
        $totalCost = 0;
        $totalCostDetails = [];

        foreach ($recipes as $recipe) {
            $material = $recipe->material;
            $qty = $recipe->qty;
            $cost = $material->avg_cost;
            $lineTotal = $qty * $cost;

            $ingredients[] = [
                'id' => $recipe->id,
                'material_id' => $material->id,
                'material_name' => $material->name,
                'material_sku' => $material->sku,
                'qty' => $qty,
                'unit' => $material->unit,
                'cost_per_unit' => $cost,
                'line_total' => $lineTotal,
                'available_stock' => $material->stock,
                'is_sufficient' => $material->stock >= $qty,
            ];

            $totalCost += $lineTotal;

            $totalCostDetails[] = [
                'material' => $material->name,
                'calculation' => "{$qty} × {$cost}",
                'subtotal' => $lineTotal,
            ];
        }

        return [
            'menu' => [
                'id' => $menu->id,
                'name' => $menu->name,
                'price' => $menu->price,
                'yield_qty' => $recipes->first()?->yield_qty ?? 1,
                'yield_unit' => $recipes->first()?->yield_unit ?? 'portion',
            ],
            'ingredients' => $ingredients,
            'total_cost' => $totalCost,
            'total_cost_details' => $totalCostDetails,
            'food_cost_percentage' => $menu->price > 0 ? ($totalCost / $menu->price) * 100 : 0,
            'profit_margin' => $menu->price > 0 ? $menu->price - $totalCost : 0,
            'has_insufficient_stock' => collect($ingredients)->contains(fn($i) => !$i['is_sufficient']),
        ];
    }

    /**
     * Calculate recipe cost for semi-finished materials.
     */
    public function calculateMaterialCost(Material $material): float
    {
        if ($material->type === 'raw_material') {
            return $material->avg_cost;
        }

        // For semi-finished/finished materials, calculate from recipe
        $recipes = Recipe::with('material')->where('menu_id', $material->id)->get();
        
        if ($recipes->isEmpty()) {
            return $material->avg_cost;
        }

        $totalCost = 0;
        foreach ($recipes as $recipe) {
            $ingredientCost = $this->calculateMaterialCost($recipe->material);
            $totalCost += $ingredientCost * $recipe->qty;
        }

        // Divide by yield quantity if specified
        $yieldQty = $recipes->first()->yield_qty ?? 1;
        return $totalCost / $yieldQty;
    }

    /**
     * Check ingredient availability for a menu item.
     */
    public function checkAvailability(int $menuId, float $qty = 1): array
    {
        $explosion = $this->explodeMenu($menuId, $qty);
        
        $availability = [];
        $allAvailable = true;

        foreach ($explosion->getIngredients() as $ingredient) {
            $isAvailable = $ingredient['material']->stock >= $ingredient['total_qty'];
            
            if (!$isAvailable) {
                $allAvailable = false;
            }

            $availability[] = [
                'material_id' => $ingredient['material']->id,
                'material_name' => $ingredient['material']->name,
                'required' => $ingredient['total_qty'],
                'available' => $ingredient['material']->stock,
                'is_available' => $isAvailable,
                'shortage' => $isAvailable ? 0 : $ingredient['total_qty'] - $ingredient['material']->stock,
                'unit' => $ingredient['unit'],
            ];
        }

        return [
            'menu_id' => $menuId,
            'quantity' => $qty,
            'all_available' => $allAvailable,
            'ingredients' => $availability,
        ];
    }

    /**
     * Resolve requirements for a modifier.
     */
    private function resolveModifierRequirements(int $modifierId, float $qty, array &$requirements): void
    {
        $modifierIngredients = ModifierIngredient::with('material')
            ->where('modifier_id', $modifierId)
            ->get();

        foreach ($modifierIngredients as $ingredient) {
            $neededQty = $ingredient->qty * $qty;
            $material = $ingredient->material;

            if ($material->conversion_factor > 0) {
                $neededQty = $neededQty / $material->conversion_factor;
            }

            if (!isset($requirements[$material->id])) {
                $requirements[$material->id] = [
                    'material' => $material,
                    'total_qty' => 0,
                    'unit' => $material->unit,
                    'cost' => $material->avg_cost,
                ];
            }
            $requirements[$material->id]['total_qty'] += $neededQty;
        }
    }

    /**
     * Recursive helper to resolve materials.
     */
    private function resolveRequirements(int $menuId, float $qty, array &$requirements): void
    {
        $recipes = Recipe::with('material')->where('menu_id', $menuId)->get();

        foreach ($recipes as $recipe) {
            $neededQty = ($recipe->qty / max($recipe->yield_qty, 1)) * $qty;
            $material = $recipe->material;

            // Apply unit conversion if factor is defined
            if ($material->conversion_factor > 0) {
                $neededQty = $neededQty / $material->conversion_factor;
            }

            if ($material->type === 'raw_material' || empty($material->recipes)) {
                // Base material
                if (!isset($requirements[$material->id])) {
                    $requirements[$material->id] = [
                        'material' => $material,
                        'total_qty' => 0,
                        'unit' => $material->unit,
                        'cost' => $material->avg_cost,
                    ];
                }
                $requirements[$material->id]['total_qty'] += $neededQty;
            } else {
                // Semi-finished / Nested recipe
                $nestedMenu = Menu::where('name', $material->name)->first();
                if ($nestedMenu) {
                    $this->resolveRequirements($nestedMenu->id, $neededQty, $requirements);
                } else {
                    // Fallback to treating it as raw material
                    if (!isset($requirements[$material->id])) {
                        $requirements[$material->id] = [
                            'material' => $material,
                            'total_qty' => 0,
                            'unit' => $material->unit,
                            'cost' => $material->avg_cost,
                        ];
                    }
                    $requirements[$material->id]['total_qty'] += $neededQty;
                }
            }
        }
    }
}
