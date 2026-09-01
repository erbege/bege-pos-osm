<?php

namespace App\Actions\Inventory;

use App\Models\StockOpnameSession;
use App\Models\StockOpnameItem;
use App\Models\Material;
use App\DTO\OpnameSessionDTO;
use Illuminate\Support\Facades\DB;

/**
 * Action to create a stock opname session with snapshot.
 * 
 * This action handles:
 * - Session creation
 * - Material selection based on scope
 * - System stock snapshot
 * - Blind count configuration
 */
class CreateStockOpnameSessionAction
{
    /**
     * Execute the action.
     */
    public function execute(OpnameSessionDTO $dto, int $createdBy): StockOpnameSession
    {
        return DB::transaction(function () use ($dto, $createdBy) {
            // Create session
            $session = StockOpnameSession::create([
                'branch_id' => $dto->branchId,
                'warehouse_id' => $dto->warehouseId,
                'scope' => $dto->scope,
                'status' => 'draft',
                'blind_count' => $dto->blindCount,
                'started_at' => now(),
                'scheduled_at' => $dto->scheduledAt,
                'notes' => $dto->notes,
                'created_by' => $createdBy,
            ]);

            // Get materials based on scope
            $materials = $this->getMaterialsForOpname($dto);

            // Create session items with snapshot
            foreach ($materials as $material) {
                StockOpnameItem::create([
                    'session_id' => $session->id,
                    'material_id' => $material->id,
                    'system_qty' => $material->stock, // SNAPSHOT of current stock
                    'system_qty_snapshot' => $material->stock,
                    'status' => 'pending',
                    'blind_count' => $dto->blindCount,
                ]);
            }

            return $session->fresh();
        });
    }

    /**
     * Get materials based on opname scope.
     */
    private function getMaterialsForOpname(OpnameSessionDTO $dto): \Illuminate\Database\Eloquent\Collection
    {
        $query = Material::query()
            ->where('track_inventory', true)
            ->where('branch_id', $dto->branchId);

        return match ($dto->scope) {
            'category' => $query
                ->whereIn('category_id', $dto->categoryIds ?? [])
                ->get(),

            'specific' => $query
                ->whereIn('id', $dto->materialIds ?? [])
                ->get(),

            'warehouse' => $query
                ->where('warehouse_id', $dto->warehouseId)
                ->get(),

            default => $query->get(), // 'all'
        };
    }

    /**
     * Create a quick session for all materials.
     */
    public function quickCreate(int $branchId, ?string $notes = null, bool $blindCount = false): StockOpnameSession
    {
        $dto = OpnameSessionDTO::fullOpname($branchId, $notes, $blindCount);
        return $this->execute($dto, auth()->id());
    }

    /**
     * Create a session for specific materials.
     */
    public function createForMaterials(
        int $branchId,
        array $materialIds,
        ?string $notes = null,
        bool $blindCount = false
    ): StockOpnameSession {
        $dto = OpnameSessionDTO::specificOpname($branchId, $materialIds, $notes, $blindCount);
        return $this->execute($dto, auth()->id());
    }

    /**
     * Create a session for specific categories.
     */
    public function createForCategories(
        int $branchId,
        array $categoryIds,
        ?string $notes = null,
        bool $blindCount = false
    ): StockOpnameSession {
        $dto = OpnameSessionDTO::categoryOpname($branchId, $categoryIds, $notes, $blindCount);
        return $this->execute($dto, auth()->id());
    }
}
