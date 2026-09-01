<?php

namespace App\Services\Order;

use App\Models\Order;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\DummyPrintConnector;
use Mike42\Escpos\Printer;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

class KitchenPrinterService
{
    /**
     * Print unprinted order batches to the kitchen printer.
     */
    public function printOrder(Order $order): bool
    {
        // 1. Check if auto-print is enabled in DB
        if (Setting::getValue('kitchen_printer', 'auto_print', '0') !== '1') {
            Log::info("KitchenPrinter: Auto-print is disabled in settings.");
            return false;
        }

        // 2. Fetch unprinted batches
        $batches = $order->batches()->where('is_printed', false)->with('items.menu')->get();
        if ($batches->isEmpty()) {
            return true; 
        }

        try {
            $connector = $this->getConnector();
            if (!$connector) {
                Log::warning("KitchenPrinter: No valid printer connector found.");
                return false;
            }

            $printer = new Printer($connector);

            foreach ($batches as $batch) {
                // Initialize
                $printer->initialize();
                
                // Header: Order ID & Table
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH | Printer::MODE_DOUBLE_HEIGHT);
                $printer->text("ORDER #{$order->id}\n");
                $printer->selectPrintMode(); // Reset
                
                // Add Batch Status Label
                if ($batch->type === 'ADDITION') {
                    $printer->setReverseColors(true);
                    $printer->text(" *** ADDITIONAL ORDER *** \n");
                    $printer->setReverseColors(false);
                }

                if ($order->table) {
                    $printer->text("MEJA: {$order->table->name}\n");
                } else {
                    $printer->text("TAKE AWAY\n");
                }
                
                $printer->text("Batch: #{$batch->batch_number} | " . now()->format('H:i') . "\n");
                $printer->text("--------------------------------\n");

                // Items in this batch
                $printer->setJustification(Printer::JUSTIFY_LEFT);
                foreach ($batch->items as $item) {
                    $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT);
                    $printer->text("{$item->qty}x {$item->menu?->name}\n");
                    $printer->selectPrintMode(); // Reset
                    
                    if ($item->notes) {
                        $printer->text("  * NOTE: {$item->notes}\n");
                    }
                    $printer->text("--------------------------------\n");
                }

                // Footer & Cut per batch
                $printer->feed(3);
                $printer->cut();
                
                // Mark as printed
                $batch->update(['is_printed' => true]);
            }

            $printer->close();
            Log::info("KitchenPrinter: Order #{$order->id} batches printed.");
            return true;

        } catch (\Exception $e) {
            Log::error("KitchenPrinter Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Resolve the print connector based on database configuration.
     */
    private function getConnector()
    {
        $type = Setting::getValue('kitchen_printer', 'type', 'dummy');
        
        switch ($type) {
            case 'network':
                $ip = Setting::getValue('kitchen_printer', 'ip_address', '127.0.0.1');
                $port = Setting::getValue('kitchen_printer', 'port', 9100);
                return new NetworkPrintConnector($ip, $port);
            
            case 'windows':
                $name = Setting::getValue('kitchen_printer', 'device_name', 'POS-58');
                return new WindowsPrintConnector($name);

            case 'file':
                $path = Setting::getValue('kitchen_printer', 'path', '/dev/usb/lp0');
                return new FilePrintConnector($path);
                
            case 'dummy':
            default:
                return new DummyPrintConnector();
        }
    }
}
