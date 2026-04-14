<?php

namespace App\DTO;

use App\Models\Material;

/**
 * Data Transfer Object for Recipe Explosion results.
 * Represents the calculated ingredient requirements for a menu item.
 */
class RecipeExplosionDTO
{
    /**
     * @param array<int, array{material: Material, total_qty: float, unit: string, cost: float}> $ingredients
     */
    public function __construct(
        public readonly int $menuId,
        public readonly float $quantity,
        public readonly array $ingredients,
        public readonly float $totalCost = 0,
        public readonly ?string $yieldUnit = null,
    ) {}

    /**
     * Create DTO from calculated requirements.
     */
    public static function fromRequirements(
        int $menuId,
        float $quantity,
        array $ingredients,
        ?string $yieldUnit = null,
    ): self {
        $totalCost = array_reduce($ingredients, function ($carry, $item) {
            return $carry + ($item['total_qty'] * $item['cost']);
        }, 0);

        return new self(
            menuId: $menuId,
            quantity: $quantity,
            ingredients: $ingredients,
            totalCost: $totalCost,
            yieldUnit: $yieldUnit,
        );
    }

    /**
     * Get ingredient requirements as a simple array (material_id => qty).
     */
    public function getMaterialQuantities(): array
    {
        return array_map(fn($item) => $item['total_qty'], $this->ingredients);
    }

    /**
     * Get ingredient requirements with material objects.
     */
    public function getIngredients(): array
    {
        return $this->ingredients;
    }

    /**
     * Get total cost of all ingredients.
     */
    public function getTotalCost(): float
    {
        return $this->totalCost;
    }

    /**
     * Get cost per unit (if yield unit is specified).
     */
    public function getCostPerUnit(): float
    {
        if (!$this->yieldUnit || $this->quantity <= 0) {
            return 0;
        }

        return $this->totalCost / $this->quantity;
    }

    /**
     * Check if any ingredient has insufficient stock.
     */
    public function hasInsufficientStock(): bool
    {
        foreach ($this->ingredients as $ingredient) {
            if ($ingredient['material']->stock < $ingredient['total_qty']) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get list of materials with insufficient stock.
     */
    public function getInsufficientMaterials(): array
    {
        $insufficient = [];

        foreach ($this->ingredients as $ingredient) {
            if ($ingredient['material']->stock < $ingredient['total_qty']) {
                $insufficient[] = [
                    'material' => $ingredient['material'],
                    'required' => $ingredient['total_qty'],
                    'available' => $ingredient['material']->stock,
                    'shortage' => $ingredient['total_qty'] - $ingredient['material']->stock,
                ];
            }
        }

        return $insufficient;
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'menu_id' => $this->menuId,
            'quantity' => $this->quantity,
            'yield_unit' => $this->yieldUnit,
            'total_cost' => $this->totalCost,
            'cost_per_unit' => $this->getCostPerUnit(),
            'has_insufficient_stock' => $this->hasInsufficientStock(),
            'ingredients' => array_map(fn($item) => [
                'material_id' => $item['material']->id,
                'name' => $item['material']->name,
                'sku' => $item['material']->sku,
                'total_qty' => $item['total_qty'],
                'unit' => $item['unit'],
                'cost' => $item['cost'],
                'available_stock' => $item['material']->stock,
                'is_sufficient' => $item['material']->stock >= $item['total_qty'],
            ], $this->ingredients),
        ];
    }
}
