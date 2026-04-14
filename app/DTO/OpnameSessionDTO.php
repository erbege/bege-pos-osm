<?php

namespace App\DTO;

/**
 * Data Transfer Object for Stock Opname Session creation.
 */
class OpnameSessionDTO
{
    public function __construct(
        public readonly int $branchId,
        public readonly ?string $scope = null, // 'all', 'category', 'warehouse', 'specific'
        public readonly ?array $categoryIds = null,
        public readonly ?int $warehouseId = null,
        public readonly ?array $materialIds = null,
        public readonly ?string $notes = null,
        public readonly ?bool $blindCount = false,
        public readonly ?\DateTimeImmutable $scheduledAt = null,
    ) {}

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            branchId: $data['branch_id'],
            scope: $data['scope'] ?? 'all',
            categoryIds: $data['category_ids'] ?? null,
            warehouseId: $data['warehouse_id'] ?? null,
            materialIds: $data['material_ids'] ?? null,
            notes: $data['notes'] ?? null,
            blindCount: $data['blind_count'] ?? false,
            scheduledAt: isset($data['scheduled_at']) 
                ? new \DateTimeImmutable($data['scheduled_at']) 
                : null,
        );
    }

    /**
     * Create DTO for full stock opname.
     */
    public static function fullOpname(
        int $branchId,
        ?string $notes = null,
        ?bool $blindCount = false,
    ): self {
        return new self(
            branchId: $branchId,
            scope: 'all',
            notes: $notes,
            blindCount: $blindCount,
        );
    }

    /**
     * Create DTO for category-based opname.
     */
    public static function categoryOpname(
        int $branchId,
        array $categoryIds,
        ?string $notes = null,
        ?bool $blindCount = false,
    ): self {
        return new self(
            branchId: $branchId,
            scope: 'category',
            categoryIds: $categoryIds,
            notes: $notes,
            blindCount: $blindCount,
        );
    }

    /**
     * Create DTO for specific materials opname.
     */
    public static function specificOpname(
        int $branchId,
        array $materialIds,
        ?string $notes = null,
        ?bool $blindCount = false,
    ): self {
        return new self(
            branchId: $branchId,
            scope: 'specific',
            materialIds: $materialIds,
            notes: $notes,
            blindCount: $blindCount,
        );
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'branch_id' => $this->branchId,
            'scope' => $this->scope,
            'category_ids' => $this->categoryIds,
            'warehouse_id' => $this->warehouseId,
            'material_ids' => $this->materialIds,
            'notes' => $this->notes,
            'blind_count' => $this->blindCount,
            'scheduled_at' => $this->scheduledAt?->format('Y-m-d H:i:s'),
        ];
    }
}
