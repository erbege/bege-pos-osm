<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Events\PurchaseReceived;
use App\Events\PayrollApproved;
use App\Events\PayrollPaid;
use App\Events\StockAdjusted;
use App\Events\InventoryConsumed;
use App\Events\ManualEntryRecorded;
use App\Services\Accounting\AccountingService;
use Illuminate\Events\Dispatcher;

class AccountingSubscriber
{
    protected $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Handle OrderPaid events.
     */
    public function handleOrderPaid(OrderPaid $event)
    {
        $order = $event->order;
        
        $tax = $order->tax_amount ?? 0;
        $serviceCharge = $order->service_charge_amount ?? 0;
        $totalPaid = $order->total_amount;
        
        // Balanced formula: total_paid = food_total + beverage_total + tax + service
        // For simplicity, we put everything remaining in food_total if beverage not split
        $foodTotal = $totalPaid - $tax - $serviceCharge;

        $data = [
            'total_paid' => $totalPaid,
            'food_total' => $foodTotal,
            'beverage_total' => 0,
            'tax_total' => $tax,
            'service_charge_total' => $serviceCharge,
        ];
        
        $this->accountingService->generateFromEvent('POS_ORDER_PAID', $data, $order, $order->branch_id);
    }

    /**
     * Handle PurchaseReceived events.
     */
    public function handlePurchaseReceived(PurchaseReceived $event)
    {
        $po = $event->purchaseOrder;
        $data = [
            'total_amount' => $po->total_amount,
        ];
        
        $this->accountingService->generateFromEvent('PURCHASE_RECEIVED', $data, $po, $po->branch_id);
    }

    /**
     * Handle PayrollApproved events.
     */
    public function handlePayrollApproved(PayrollApproved $event)
    {
        $payroll = $event->payroll;
        $data = [
            'total_payroll' => $payroll->net_salary,
        ];
        
        $this->accountingService->generateFromEvent('PAYROLL_APPROVED', $data, $payroll, $payroll->employee->branch_id);
    }

    /**
     * Handle PayrollPaid events.
     */
    public function handlePayrollPaid(PayrollPaid $event)
    {
        $payroll = $event->payroll;
        $data = [
            'total_payroll' => $payroll->net_salary,
        ];
        
        $this->accountingService->generateFromEvent('PAYROLL_PAID', $data, $payroll, $payroll->employee->branch_id);
    }

    /**
     * Handle StockAdjusted events.
     */
    public function handleStockAdjusted(StockAdjusted $event)
    {
        $data = [
            'variance_amount' => abs($event->amount),
        ];
        
        // We'll use reference from event
        $this->accountingService->generateFromEvent('STOCK_ADJUSTMENT', $data, $event->reference, $event->branchId);
    }

    /**
     * Handle InventoryConsumed events.
     */
    public function handleInventoryConsumed(InventoryConsumed $event)
    {
        $data = [
            'cogs_amount' => $event->amount,
        ];
        
        // Need to add INVENTORY_CONSUMED template to COA/Seeder
        $this->accountingService->generateFromEvent('INVENTORY_CONSUMED', $data, $event->reference, $event->branchId);
    }

    /**
     * Handle ManualEntryRecorded events.
     */
    public function handleManualEntry(ManualEntryRecorded $event)
    {
        $eventName = $event->type === 'income' ? 'MANUAL_INCOME' : 'MANUAL_EXPENSE';
        $data = [
            'amount' => $event->amount,
            'description' => $event->description,
        ];
        
        $this->accountingService->generateFromEvent($eventName, $data, $event->reference, $event->branchId);
    }

    /**
     * Register the listeners for the subscriber.
     *
     * @param  \Illuminate\Events\Dispatcher  $events
     * @return void
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            OrderPaid::class => 'handleOrderPaid',
            PurchaseReceived::class => 'handlePurchaseReceived',
            PayrollApproved::class => 'handlePayrollApproved',
            PayrollPaid::class => 'handlePayrollPaid',
            StockAdjusted::class => 'handleStockAdjusted',
            InventoryConsumed::class => 'handleInventoryConsumed',
            ManualEntryRecorded::class => 'handleManualEntry',
        ];
    }
}
