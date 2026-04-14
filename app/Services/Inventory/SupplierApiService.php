<?php

namespace App\Services\Inventory;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service to integrate with external supplier APIs for real-time pricing and availability.
 * Uses a driver-based pattern to support multiple suppliers.
 */
class SupplierApiService
{
    /**
     * Fetch real-time price for a specific SKU from a supplier.
     */
    public function getRealTimePrice(string $supplierCode, string $sku): ?float
    {
        try {
            // Logic to switch between drivers based on supplierCode
            return match ($supplierCode) {
                'SUP-GLOBAL' => $this->fetchFromGlobalMarket($sku),
                'SUP-LOCAL' => $this->fetchFromLocalVendor($sku),
                default => null
            };
        } catch (\Exception $e) {
            Log::error("Supplier API Error [{$supplierCode}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Mock implementation for a Global Market API.
     */
    private function fetchFromGlobalMarket(string $sku): float
    {
        // In a real scenario:
        // $response = Http::withToken(config('services.supplier.key'))
        //     ->get("https://api.supplier.com/v1/products/{$sku}/price");
        // return $response->json('price');

        // MOCK DATA: Return a random price close to common values
        return (float) rand(5000, 150000);
    }

    /**
     * Mock implementation for a Local Vendor API.
     */
    private function fetchFromLocalVendor(string $sku): float
    {
        return (float) rand(4000, 140000);
    }

    /**
     * Sync all material prices with external APIs.
     */
    public function syncPrices(): int
    {
        $materials = \App\Models\Material::whereNotNull('sku')->get();
        $updatedCount = 0;

        foreach ($materials as $material) {
            // Find preferred supplier for this material or use a default
            $price = $this->getRealTimePrice('SUP-GLOBAL', $material->sku);
            
            if ($price && $price != $material->last_purchase_price) {
                $material->update(['last_purchase_price' => $price]);
                $updatedCount++;
            }
        }

        return $updatedCount;
    }
}
