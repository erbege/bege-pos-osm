<?php

namespace App\DTO;

/**
 * Data Transfer Object for Stock Movement operations.
 * Encapsulates all data needed for inventory movements.
 */
class StockMovementDTO
{
    public function __construct(
        public readonly int $materialId,
        public readonly float $qty,
        public readonly string $type,
        public readonly ?string $notes = null,
        public readonly ?string $referenceType = null,
        public readonly ?int $referenceId = null,
        public readonly float $cost = 0,
        public readonly ?int $branchId = null,
        public readonly ?array $metadata = null,
    ) {}

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            materialId: $data['material_id'],
            qty: (float) $data['qty'],
            type: $data['type'],
            notes: $data['notes'] ?? null,
            referenceType: $data['reference_type'] ?? null,
            referenceId: $data['reference_id'] ?? null,
            cost: (float) ($data['cost'] ?? 0),
            branchId: $data['branch_id'] ?? null,
            metadata: $data['metadata'] ?? null,
        );
    }

    /**
     * Create DTO for stock-in movement.
     */
    public static function stockIn(
        int $materialId,
        float $qty,
        float $cost = 0,
        ?string $notes = null,
        $reference = null,
        ?int $branchId = null,
    ): self {
        return new self(
            materialId: $materialId,
            qty: abs($qty),
            type: 'in',
            notes: $notes,
            referenceType: $reference ? get_class($reference) : null,
            referenceId: $reference ? $reference->id : null,
            cost: $cost,
            branchId: $branchId,
        );
    }

    /**
     * Create DTO for stock-out movement.
     */
    public static function stockOut(
        int $materialId,
        float $qty,
        ?string $notes = null,
        $reference = null,
        ?int $branchId = null,
    ): self {
        return new self(
            materialId: $materialId,
            qty: -abs($qty),
            type: 'out',
            notes: $notes,
            referenceType: $reference ? get_class($reference) : null,
            referenceId: $reference ? $reference->id : null,
            branchId: $branchId,
        );
    }

    /**
     * Create DTO for adjustment movement.
     */
    public static function adjustment(
        int $materialId,
        float $qty,
        ?string $notes = null,
        $reference = null,
        ?int $branchId = null,
    ): self {
        return new self(
            materialId: $materialId,
            qty: $qty,
            type: 'adjustment',
            notes: $notes,
            referenceType: $reference ? get_class($reference) : null,
            referenceId: $reference ? $reference->id : null,
            branchId: $branchId,
        );
    }

    /**
     * Create DTO for waste movement.
     */
    public static function waste(
        int $materialId,
        float $qty,
        ?string $notes = null,
        ?int $branchId = null,
    ): self {
        return new self(
            materialId: $materialId,
            qty: -abs($qty),
            type: 'waste',
            notes: $notes,
            branchId: $branchId,
        );
    }

    /**
     * Create DTO for transfer-out movement.
     */
    public static function transferOut(
        int $materialId,
        float $qty,
        ?string $notes = null,
        $reference = null,
        ?int $branchId = null,
    ): self {
        return new self(
            materialId: $materialId,
            qty: -abs($qty),
            type: 'out',
            notes: $notes ?? "Transfer out",
            referenceType: $reference ? get_class($reference) : null,
            referenceId: $reference ? $reference->id : null,
            branchId: $branchId,
        );
    }

    /**
     * Create DTO for transfer-in movement.
     */
    public static function transferIn(
        int $materialId,
        float $qty,
        ?string $notes = null,
        $reference = null,
        ?int $branchId = null,
    ): self {
        return new self(
            materialId: $materialId,
            qty: abs($qty),
            type: 'in',
            notes: $notes ?? "Transfer in",
            referenceType: $reference ? get_class($reference) : null,
            referenceId: $reference ? $reference->id : null,
            branchId: $branchId,
        );
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'material_id' => $this->materialId,
            'qty' => $this->qty,
            'type' => $this->type,
            'notes' => $this->notes,
            'reference_type' => $this->referenceType,
            'reference_id' => $this->referenceId,
            'cost' => $this->cost,
            'branch_id' => $this->branchId,
            'metadata' => $this->metadata,
        ];
    }

    /**
     * Get the absolute quantity.
     */
    public function getAbsoluteQty(): float
    {
        return abs($this->qty);
    }

    /**
     * Check if this is an incoming movement.
     */
    public function isIncoming(): bool
    {
        return in_array($this->type, ['in', 'adjustment']) && $this->qty > 0;
    }

    /**
     * Check if this is an outgoing movement.
     */
    public function isOutgoing(): bool
    {
        return in_array($this->type, ['out', 'waste', 'adjustment']) && $this->qty < 0;
    }
}
