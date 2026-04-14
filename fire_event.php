<?php

// fire_event.php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Grab the first order
$order = \App\Models\Order::first();

if (!$order) {
    echo "No orders found to simulate!\n";
    exit;
}

echo "Simulating progression for Order #" . $order->order_number . " (ID: " . $order->id . ")\n";

// Change status
$order->status = 'Preparing';
$order->save();

// Dispatch event
event(new \App\Events\OrderStatusUpdated($order));

echo "Event dispatch complete on channel: orders." . $order->id . "!\n";
