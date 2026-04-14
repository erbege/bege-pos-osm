<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Jobs\SyncOfflineJob;

class SyncController extends Controller
{
    /**
     * Accepts a bulk payload of offline orders from the PWA LocalStorage
     * and dispatches each order as a separate queued job for fault isolation.
     */
    public function syncOrders(Request $request)
    {
        $payload = $request->validate([
            'orders' => 'required|array',
            'orders.*.offline_uuid' => 'required|string',
            'orders.*.table_id' => 'nullable|exists:tables,id',
            'orders.*.payment_method' => 'required|string',
            'orders.*.items' => 'required|array|min:1',
            'orders.*.items.*.id' => 'required|exists:menus,id',
            'orders.*.items.*.qty' => 'required|integer|min:1',
        ]);

        $dispatched = [];

        foreach ($payload['orders'] as $offlineOrderData) {
            SyncOfflineJob::dispatch($offlineOrderData);
            $dispatched[] = $offlineOrderData['offline_uuid'];
        }

        Log::info('SyncController: dispatched ' . count($dispatched) . ' offline orders to sync queue');

        return response()->json([
            'message' => 'Sync jobs dispatched',
            'dispatched_uuids' => $dispatched,
            'count' => count($dispatched),
        ]);
    }
}
