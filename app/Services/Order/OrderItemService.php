<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\Menu;

class OrderItemService
{
    public function addItem(Order $order, $menuId, $qty, $note = null, array $modifierIds = [], $batchId = null)
    {
        $menu = Menu::findOrFail($menuId);
        return $this->processItem($order, $menu, $qty, $note, $modifierIds, $batchId);
    }

    public function addItemsBulk(Order $order, array $items, $batchId = null)
    {
        $menuIds = collect($items)->pluck('id')->unique();
        $menus = Menu::whereIn('id', $menuIds)->get()->keyBy('id');

        $allModifierIds = collect($items)->pluck('modifier_ids')->flatten()->unique()->filter();
        $allModifiers = $allModifierIds->isNotEmpty() 
            ? \App\Models\Modifier::whereIn('id', $allModifierIds)->get()->keyBy('id')
            : collect();

        $createdItems = [];
        foreach ($items as $itemData) {
            $menu = $menus->get($itemData['id']);
            if (!$menu) continue;

            $itemModifierIds = $itemData['modifier_ids'] ?? [];
            $itemModifiers = collect($itemModifierIds)->map(fn($id) => $allModifiers->get($id))->filter();
            $modifiersPrice = $itemModifiers->sum('price');

            $price = $menu->price + $modifiersPrice;
            $subtotal = $price * $itemData['qty'];

            $item = $order->items()->create([
                'menu_id' => $menu->id,
                'order_batch_id' => $batchId,
                'qty' => $itemData['qty'],
                'price' => $price,
                'subtotal' => $subtotal,
                'notes' => $itemData['notes'] ?? null,
            ]);

            if ($itemModifiers->isNotEmpty()) {
                foreach ($itemModifiers as $modifier) {
                    $item->modifiers()->attach($modifier->id, [
                        'price' => $modifier->price,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            $createdItems[] = $item;
        }

        return $createdItems;
    }

    protected function processItem(Order $order, Menu $menu, $qty, $note = null, array $modifierIds = [], $batchId = null)
    {
        $modifiers = \App\Models\Modifier::whereIn('id', $modifierIds)->get();
        $modifiersPrice = $modifiers->sum('price');

        $price = $menu->price + $modifiersPrice;
        $subtotal = $price * $qty;

        $item = $order->items()->create([
            'menu_id' => $menu->id,
            'order_batch_id' => $batchId,
            'qty' => $qty,
            'price' => $price,
            'subtotal' => $subtotal,
            'notes' => $note,
        ]);

        if (!empty($modifierIds)) {
            foreach ($modifiers as $modifier) {
                $item->modifiers()->attach($modifier->id, [
                    'price' => $modifier->price,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return $item;
    }

    /**
     * Sync items for an order (Delete old, add new)
     * Refactored to support BATCHING for addons.
     */
    public function syncItems(Order $order, array $items)
    {
        // 1. Load existing items to compare
        $existingItems = $order->items()->get();
        $newBatchItems = [];

        // 2. Identify what's actually NEW or ADDED quantity
        foreach ($items as $itemData) {
            $existing = $existingItems->first(function($ei) use ($itemData) {
                // Same menu and same notes = same line
                return $ei->menu_id == $itemData['id'] && $ei->notes == ($itemData['notes'] ?? null);
            });

            if ($existing) {
                $diffQty = $itemData['qty'] - $existing->qty;
                if ($diffQty > 0) {
                    // This is an ADDON to existing line
                    $newBatchItems[] = array_merge($itemData, ['qty' => $diffQty]);
                    $existing->update(['qty' => $itemData['qty']]);
                }
            } else {
                // Truly NEW item line
                $newBatchItems[] = $itemData;
            }
        }

        // 3. If there are new items, create a BATCH
        if (!empty($newBatchItems)) {
            $latestBatchNum = $order->batches()->max('batch_number') ?? 0;
            $batch = $order->batches()->create([
                'batch_number' => $latestBatchNum + 1,
                'type' => $latestBatchNum === 0 ? 'NEW' : 'ADDITION',
                'is_printed' => false
            ]);

            $this->addItemsBulk($order, $newBatchItems, $batch->id);
        }

        // 4. Update stock reservations
        app(\App\Services\Inventory\InventoryEngineService::class)->releaseStock($order);
        app(\App\Services\Inventory\InventoryEngineService::class)->reserveStock($order);
    }
}
