<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Staff\StaffDashboardController;
use App\Http\Controllers\Staff\StaffAttendanceController;
use App\Http\Controllers\Staff\StaffPayslipController;
use App\Http\Controllers\Staff\StaffScheduleController;
use App\Http\Controllers\Admin\EmployeeAllowanceController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentCallbackController;
use App\Http\Controllers\Admin\BranchController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\MaterialController;
use App\Http\Controllers\Admin\StockTransferController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\IncomeController;
use App\Http\Controllers\Admin\PerformanceReviewController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\PurchaseOrderController;
use App\Http\Controllers\Admin\InventoryLedgerController;

Route::get('/', function () {
    return redirect()->route('customer.menu');
});

/**
 * CUSTOMER ZONE (Public frontend)
 */
Route::get('/menu', [App\Http\Controllers\CustomerController::class, 'index'])->name('customer.menu');
Route::get('/select-table', [App\Http\Controllers\CustomerController::class, 'selectTable'])->name('customer.select_table');
Route::post('/set-active-table', [App\Http\Controllers\CustomerController::class, 'setActiveTable'])->name('customer.set_active_table');
Route::get('/cart', function () {
    return Inertia::render('Customer/Cart');
})->name('customer.cart');
Route::get('/checkout', function () {
    return Inertia::render('Customer/Checkout');
})->name('customer.checkout');
Route::post('/checkout', [App\Http\Controllers\CustomerController::class, 'checkout'])->name('customer.checkout.process');
Route::get('/payment/{order}', function () {
    return Inertia::render('Customer/Payment');
})->name('customer.payment');

Route::get('/order-status/{order}', function (\App\Models\Order $order) {
    $order->load(['items.menu', 'table']);
    return Inertia::render('Customer/OrderStatus', ['order' => $order]);
})->name('customer.order_status');

Route::get('/reservations', function () {
    return Inertia::render('Reservation/BookingHub');
})->name('reservations.index');

/**
 * QRIS WEBHOOKS
 */
Route::post('/payment/callback/{provider?}', [PaymentCallbackController::class, 'handleWebhook'])
    ->middleware([\App\Http\Middleware\VerifyWebhookSignature::class, 'throttle:payment'])
    ->name('payment.callback');
Route::get('/payment/simulate', [PaymentCallbackController::class, 'simulate'])->name('payment.simulate');

/**
 * PROTECTED ZONES (Requires Login)
 */
Route::middleware(['auth', 'verified'])->group(function () {

    // CASHIER PANEL
    Route::middleware(['role:Admin|owner|cashier'])->group(function () {
        Route::get('/cashier', [POSController::class, 'index'])->name('pos.index');
        Route::post('/pos/checkout', [POSController::class, 'checkout'])->name('pos.checkout');
        Route::post('/pos/switch-shift', [POSController::class, 'switchShift'])->name('pos.switch_shift');
        Route::post('/pos/tables/{table}/release', [\App\Http\Controllers\Admin\TableController::class, 'release'])->name('pos.tables.release');
        Route::post('/pos/reservations/{reservation}/check-in', [POSController::class, 'checkIn'])->name('pos.reservations.check-in');

        // POS — INCOMING SELF-ORDERS (Accessible by Cashier)
        Route::get('/admin/pos/pending-orders', [App\Http\Controllers\Pos\PosOrderController::class, 'pendingOrders'])->name('admin.pos.pending_orders');
        Route::patch('/admin/pos/orders/{order}/confirm-payment', [App\Http\Controllers\Pos\PosOrderController::class, 'confirmPayment'])->name('admin.pos.confirm_payment');
        Route::post('/admin/pos/orders/{order}/cancel', [App\Http\Controllers\Pos\PosOrderController::class, 'cancel'])->name('admin.pos.orders.cancel');
        Route::get('/admin/pos/orders/{order}/print', [App\Http\Controllers\Pos\PosOrderController::class, 'printThermal'])->name('admin.pos.print_thermal');
    });

    // KITCHEN PANEL
    Route::middleware(['role:Admin|owner|kitchen'])->group(function () {
        Route::get('/kitchen', [KitchenController::class, 'index'])->name('kitchen.index');
        Route::put('/kitchen/orders/{order}/status', [KitchenController::class, 'updateOrderStatus'])->name('kitchen.update_order_status');
        Route::put('/kitchen/orders/{order}/items/{item}', [KitchenController::class, 'updateItemStatus'])->name('kitchen.update_item');

        // Kitchen Inventory (Mobile Optimized)
        Route::get('/kitchen/inventory', [KitchenController::class, 'inventory'])->name('kitchen.inventory.index');
        Route::post('/kitchen/inventory/{material}/update', [KitchenController::class, 'updateStock'])->name('kitchen.inventory.update');
    });

    // STAFF / EMPLOYEE SELF-SERVICE (Mobile-Ready)
    Route::middleware(['auth'])->prefix('staff')->name('staff.')->group(function () {
        Route::get('/dashboard', [StaffDashboardController::class, 'index'])->name('dashboard');

        // Attendance
        Route::get('/attendance', [StaffAttendanceController::class, 'index'])->name('attendance');
        Route::post('/attendance/clock-in', [StaffAttendanceController::class, 'clockIn'])->name('attendance.clock-in');
        Route::post('/attendance/clock-out', [StaffAttendanceController::class, 'clockOut'])->name('attendance.clock-out');
        Route::post('/attendance/correction', [StaffAttendanceController::class, 'requestCorrection'])->name('attendance.correction');

        // Schedule & Swap
        Route::get('/schedule', [StaffScheduleController::class, 'index'])->name('schedule');
        Route::post('/schedule/swap', [StaffScheduleController::class, 'requestSwap'])->name('schedule.swap');
        Route::post('/schedule/leave', [StaffScheduleController::class, 'requestLeave'])->name('schedule.leave');

        // Payslips
        Route::get('/payslips', [StaffPayslipController::class, 'index'])->name('payslips');
        Route::get('/payslips/{payroll}', [StaffPayslipController::class, 'show'])->name('payslips.show');
        Route::get('/payslips/{payroll}/pdf', [StaffPayslipController::class, 'downloadPdf'])->name('payslips.pdf');

        // Legacy (keep for backward compat)
        Route::get('/my-shifts', [\App\Http\Controllers\EmployeeShiftController::class, 'index'])->name('shift-swap.index');
        Route::post('/my-shifts/swap', [\App\Http\Controllers\EmployeeShiftController::class, 'storeSwap'])->name('shift-swap.store');
    });

    // ADMIN PANEL
    Route::middleware(['role:Admin|owner'])->prefix('admin')->name('admin.')->group(function () {
        Route::post('/branches/switch', [BranchController::class, 'switchBranch'])->name('branches.switch');
        Route::resource('branches', BranchController::class);
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // INVENTORY DASHBOARD
        Route::get('/inventory/dashboard', [\App\Http\Controllers\Admin\StockDashboardController::class, 'index'])->name('inventory.dashboard');

        Route::resource('menus', MenuController::class);
        Route::post('menus/{menu}/recipes', [MenuController::class, 'syncRecipes'])->name('menus.recipes.sync');
        Route::get('menus/{menu}/recipe-details', [MenuController::class, 'recipeDetails'])->name('menus.recipe-details');
        Route::get('menus/{menu}/check-availability', [MenuController::class, 'checkAvailability'])->name('menus.check-availability');
        Route::resource('categories', CategoryController::class);

        // VOUCHER & DISCOUNTS
        Route::resource('discounts', \App\Http\Controllers\Admin\DiscountController::class);
        Route::patch('discounts/{discount}/toggle-status', [\App\Http\Controllers\Admin\DiscountController::class, 'toggleStatus'])->name('discounts.toggle-status');

        Route::resource('materials', MaterialController::class);
        Route::post('materials/{material}/adjust', [MaterialController::class, 'adjust'])->name('materials.adjust');
        Route::resource('stock-transfers', StockTransferController::class)->parameters(['stock-transfers' => 'transfer']);

        // STOCK OPNAME
        Route::get('/stock-opname', [\App\Http\Controllers\Admin\StockOpnameController::class, 'index'])->name('stock-opname.index');
        Route::post('/stock-opname', [\App\Http\Controllers\Admin\StockOpnameController::class, 'store'])->name('stock-opname.store');
        Route::get('/stock-opname/{session}', [\App\Http\Controllers\Admin\StockOpnameController::class, 'show'])->name('stock-opname.show');
        Route::patch('/stock-opname/{session}/items', [\App\Http\Controllers\Admin\StockOpnameController::class, 'updateItems'])->name('stock-opname.items.update');
        Route::post('/stock-opname/{session}/submit', [\App\Http\Controllers\Admin\StockOpnameController::class, 'submitForReview'])->name('stock-opname.submit');
        Route::post('/stock-opname/{session}/approve', [\App\Http\Controllers\Admin\StockOpnameController::class, 'approve'])->name('stock-opname.approve');
        Route::post('/stock-opname/{session}/cancel', [\App\Http\Controllers\Admin\StockOpnameController::class, 'cancel'])->name('stock-opname.cancel');
        Route::post('/stock-opname/{session}/restart', [\App\Http\Controllers\Admin\StockOpnameController::class, 'restartCounting'])->name('stock-opname.restart');

        // INVENTORY LEDGER (New System)
        Route::get('/inventory/ledger', [InventoryLedgerController::class, 'index'])->name('inventory.ledger');
        Route::get('/inventory/ledger/export', [InventoryLedgerController::class, 'export'])->name('inventory.ledger.export');
        Route::get('/inventory/materials/{material}/history', [InventoryLedgerController::class, 'materialHistory'])->name('inventory.material-history');

        // PRODUCTION & WASTE
        Route::get('/production', [\App\Http\Controllers\Admin\ProductionController::class, 'index'])->name('production.index');
        Route::get('/production/recipe/{material}', [\App\Http\Controllers\Admin\ProductionController::class, 'getRecipe'])->name('production.get-recipe');
        Route::post('/production', [\App\Http\Controllers\Admin\ProductionController::class, 'store'])->name('production.store');
        Route::get('/wastage', [\App\Http\Controllers\Admin\WasteController::class, 'index'])->name('wastage.index');
        Route::post('/wastage', [\App\Http\Controllers\Admin\WasteController::class, 'store'])->name('wastage.store');

        // PURCHASES & SUPPLIERS
        Route::get('/purchases', [\App\Http\Controllers\Admin\PurchaseController::class, 'index'])->name('purchases');
        Route::post('/purchases/supplier', [\App\Http\Controllers\Admin\PurchaseController::class, 'storeSupplier'])->name('purchases.supplier.store');
        Route::post('/purchases', [\App\Http\Controllers\Admin\PurchaseController::class, 'storePurchase'])->name('purchases.store');
        Route::resource('/suppliers', \App\Http\Controllers\Admin\SupplierController::class)->names('suppliers');

        // REPLENISHMENT & PURCHASE ORDERS (New System)
        Route::get('/purchase-analytics', [PurchaseOrderController::class, 'analytics'])->name('purchase-planning.analytics');
        Route::get('/purchase-planning', [PurchaseOrderController::class, 'index'])->name('purchase-planning.index');
        Route::get('/purchase-planning/forecast/{material}', [PurchaseOrderController::class, 'getForecast'])->name('purchase-planning.forecast');
        Route::post('/purchase-planning/generate', [PurchaseOrderController::class, 'generateDraft'])->name('purchase-planning.generate');
        Route::prefix('purchase-orders')->name('purchase-orders.')->group(function () {
            Route::post('/quick', [PurchaseOrderController::class, 'quickStore'])->name('quick');
            Route::get('/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('show');
            Route::patch('/{purchaseOrder}/status', [PurchaseOrderController::class, 'updateStatus'])->name('status');
            Route::get('/{purchaseOrder}/download', [PurchaseOrderController::class, 'downloadPDF'])->name('download');
            Route::post('/{purchaseOrder}/email', [PurchaseOrderController::class, 'emailToSupplier'])->name('email');
        });

        // TABLES
        Route::get('/tables', [\App\Http\Controllers\Admin\TableController::class, 'index'])->name('tables');
        Route::post('/tables', [\App\Http\Controllers\Admin\TableController::class, 'store'])->name('tables.store');
        Route::put('/tables/{table}', [\App\Http\Controllers\Admin\TableController::class, 'update'])->name('tables.update');
        Route::post('/tables/positions', [\App\Http\Controllers\Admin\TableController::class, 'updatePositions'])->name('tables.positions');
        Route::post('/tables/{table}/release', [\App\Http\Controllers\Admin\TableController::class, 'release'])->name('tables.release');
        Route::delete('/tables/{table}', [\App\Http\Controllers\Admin\TableController::class, 'destroy'])->name('tables.destroy');

        // WASTE & KITCHEN PERFORMANCE
        Route::get('/waste-analytics', [\App\Http\Controllers\Admin\WasteController::class, 'analytics'])->name('waste-analytics.index');
        Route::resource('/wastage', \App\Http\Controllers\Admin\WasteController::class)->names('wastage');

        // EMPLOYEES
        Route::get('/employees', [\App\Http\Controllers\Admin\EmployeeController::class, 'index'])->name('employees');
        Route::post('/employees', [\App\Http\Controllers\Admin\EmployeeController::class, 'store'])->name('employees.store');
        Route::put('/employees/{employee}', [\App\Http\Controllers\Admin\EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{employee}/photo', [\App\Http\Controllers\Admin\EmployeeController::class, 'deletePhoto'])->name('employees.photo.delete');
        Route::delete('/employees/{employee}', [\App\Http\Controllers\Admin\EmployeeController::class, 'destroy'])->name('employees.destroy');

        // ATTENDANCE
        Route::get('/attendance', [\App\Http\Controllers\Admin\AttendanceController::class, 'index'])->name('attendance');
        Route::post('/attendance/check-in', [\App\Http\Controllers\Admin\AttendanceController::class, 'checkIn'])->name('attendance.checkin');
        Route::post('/attendance/check-out', [\App\Http\Controllers\Admin\AttendanceController::class, 'checkOut'])->name('attendance.checkout');
        Route::post('/attendance/mark-absent', [\App\Http\Controllers\Admin\AttendanceController::class, 'markAbsent'])->name('attendance.mark-absent');
        Route::get('/attendance/calendar', [\App\Http\Controllers\Admin\AttendanceController::class, 'calendarView'])->name('attendance.calendar');

        // EMPLOYEE ALLOWANCES (Tunjangan)
        Route::resource('employee-allowances', EmployeeAllowanceController::class)->parameters(['employee-allowances' => 'employeeAllowance']);

        // ATTENDANCE CORRECTIONS (Koreksi Absen)
        Route::get('/attendance-corrections', [\App\Http\Controllers\Admin\AttendanceCorrectionController::class, 'index'])->name('attendance-corrections');
        Route::post('/attendance-corrections', [\App\Http\Controllers\Admin\AttendanceCorrectionController::class, 'store'])->name('attendance-corrections.store');
        Route::post('/attendance-corrections/{correction}/approve', [\App\Http\Controllers\Admin\AttendanceCorrectionController::class, 'approve'])->name('attendance-corrections.approve');
        Route::post('/attendance-corrections/{correction}/reject', [\App\Http\Controllers\Admin\AttendanceCorrectionController::class, 'reject'])->name('attendance-corrections.reject');

        // ATTENDANCE SETTINGS (Geofencing, Grace Time)
        Route::get('/attendance-settings', [\App\Http\Controllers\Admin\AttendanceSettingController::class, 'index'])->name('attendance-settings');
        Route::post('/attendance-settings', [\App\Http\Controllers\Admin\AttendanceSettingController::class, 'store'])->name('attendance-settings.store');
        Route::delete('/attendance-settings/{attendanceSetting}', [\App\Http\Controllers\Admin\AttendanceSettingController::class, 'destroy'])->name('attendance-settings.destroy');

        // PAYROLL
        Route::get('/payroll', [\App\Http\Controllers\Admin\PayrollController::class, 'index'])->name('payroll');
        Route::post('/payroll/preview', [\App\Http\Controllers\Admin\PayrollController::class, 'preview'])->name('payroll.preview');
        Route::post('/payroll/generate', [\App\Http\Controllers\Admin\PayrollController::class, 'generate'])->name('payroll.generate');
        Route::post('/payroll/bulk-generate', [\App\Http\Controllers\Admin\PayrollController::class, 'bulkGenerate'])->name('payroll.bulk-generate');
        Route::post('/payroll/{payroll}/approve', [\App\Http\Controllers\Admin\PayrollController::class, 'approve'])->name('payroll.approve');
        Route::post('/payroll/{payroll}/pay', [\App\Http\Controllers\Admin\PayrollController::class, 'markPaid'])->name('payroll.pay');
        Route::get('/payroll/{payroll}/slip', [\App\Http\Controllers\Admin\PayrollController::class, 'exportSlip'])->name('payroll.slip');

        // CASH ADVANCES (Kasbon)
        Route::get('/cash-advances', [\App\Http\Controllers\Admin\CashAdvanceController::class, 'index'])->name('cash-advances');

        // PERFORMANCE REVIEWS
        Route::resource('performance-reviews', PerformanceReviewController::class)
            ->except(['create', 'show', 'edit']);
        Route::post('/cash-advances', [\App\Http\Controllers\Admin\CashAdvanceController::class, 'store'])->name('cash-advances.store');
        Route::post('/cash-advances/{cashAdvance}/approve', [\App\Http\Controllers\Admin\CashAdvanceController::class, 'approve'])->name('cash-advances.approve');
        Route::post('/cash-advances/{cashAdvance}/reject', [\App\Http\Controllers\Admin\CashAdvanceController::class, 'reject'])->name('cash-advances.reject');
        Route::post('/cash-advances/{cashAdvance}/repay', [\App\Http\Controllers\Admin\CashAdvanceController::class, 'repay'])->name('cash-advances.repay');

        // SHIFTS
        Route::get('/shifts', [\App\Http\Controllers\Admin\ShiftController::class, 'index'])->name('shifts');
        Route::post('/shifts', [\App\Http\Controllers\Admin\ShiftController::class, 'store'])->name('shifts.store');
        Route::put('/shifts/{shift}', [\App\Http\Controllers\Admin\ShiftController::class, 'update'])->name('shifts.update');
        Route::delete('/shifts/{shift}', [\App\Http\Controllers\Admin\ShiftController::class, 'destroy'])->name('shifts.destroy');

        // SHIFT MANAGEMENT (Scheduling & Swaps)
        Route::get('/shift-management', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'index'])->name('shift-management.index');
        Route::post('/shift-management/schedule', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'storeSchedule'])->name('shift-management.schedule.store');
        Route::post('/shift-management/schedule/generate', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'generate'])->name('shift-management.schedule.generate');
        Route::delete('/shift-management/schedule/{schedule}', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'destroySchedule'])->name('shift-management.schedule.destroy');
        Route::post('/shift-management/swap', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'requestSwap'])->name('shift-management.swap.request');
        Route::post('/shift-management/swap/{swap}/accept', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'acceptSwapByRecipient'])->name('shift-management.swap.accept');
        Route::post('/shift-management/swap/{swap}/reject-recipient', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'rejectSwapByRecipient'])->name('shift-management.swap.reject-recipient');
        Route::post('/shift-management/swap/{swap}/approve', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'approveSwap'])->name('shift-management.swap.approve');
        Route::post('/shift-management/swap/{swap}/reject', [\App\Http\Controllers\Admin\ShiftManagementController::class, 'rejectSwap'])->name('shift-management.swap.reject');

        // LEAVE REQUESTS (Cuti/Izin/Sakit)
        Route::get('/leave-requests', [\App\Http\Controllers\Admin\LeaveRequestController::class, 'index'])->name('leave-requests');
        Route::post('/leave-requests', [\App\Http\Controllers\Admin\LeaveRequestController::class, 'store'])->name('leave-requests.store');
        Route::post('/leave-requests/{leaveRequest}/approve', [\App\Http\Controllers\Admin\LeaveRequestController::class, 'approve'])->name('leave-requests.approve');
        Route::post('/leave-requests/{leaveRequest}/reject', [\App\Http\Controllers\Admin\LeaveRequestController::class, 'reject'])->name('leave-requests.reject');

        // OVERTIME REQUESTS (Lembur)
        Route::get('/overtime-requests', [\App\Http\Controllers\Admin\OvertimeRequestController::class, 'index'])->name('overtime-requests');
        Route::post('/overtime-requests', [\App\Http\Controllers\Admin\OvertimeRequestController::class, 'store'])->name('overtime-requests.store');
        Route::post('/overtime-requests/{overtimeRequest}/approve', [\App\Http\Controllers\Admin\OvertimeRequestController::class, 'approve'])->name('overtime-requests.approve');
        Route::post('/overtime-requests/{overtimeRequest}/reject', [\App\Http\Controllers\Admin\OvertimeRequestController::class, 'reject'])->name('overtime-requests.reject');

        // CUSTOMERS
        Route::resource('customers', \App\Http\Controllers\Admin\CustomerController::class);

        // ORDERS
        Route::patch('orders/bulk-update', [App\Http\Controllers\Admin\OrderController::class, 'bulkUpdateStatus'])->name('orders.bulk_update');
        Route::delete('orders/bulk-destroy', [App\Http\Controllers\Admin\OrderController::class, 'bulkDestroy'])->name('orders.bulk_destroy');
        Route::resource('orders', App\Http\Controllers\Admin\OrderController::class);
        Route::patch('orders/{order}/status', [App\Http\Controllers\Admin\OrderController::class, 'updateStatus'])->name('orders.update_status');
        Route::patch('orders/{order}/confirm-payment', [App\Http\Controllers\Admin\OrderController::class, 'confirmPayment'])->name('orders.confirm_payment');
        // The destroy route is already covered by Route::resource, but if a custom name is desired, it can be overridden like this:
        // Route::delete('orders/{order}', [App\Http\Controllers\Admin\OrderController::class, 'destroy'])->name('admin.orders.destroy');


        // FINANCE
        Route::get('/finance', [\App\Http\Controllers\Admin\FinanceController::class, 'index'])->name('finance');
        Route::get('/finance/coa', [\App\Http\Controllers\Admin\FinanceController::class, 'coa'])->name('finance.coa');
        Route::get('/finance/periods', [\App\Http\Controllers\Admin\FinanceController::class, 'periods'])->name('finance.periods');
        Route::post('/finance/periods', [\App\Http\Controllers\Admin\FinanceController::class, 'storePeriod'])->name('finance.periods.store');
        Route::post('/finance/periods/{period}/close', [\App\Http\Controllers\Admin\FinanceController::class, 'closePeriod'])->name('finance.periods.close');

        // EXPENSES (Pengeluaran Operasional)
        Route::resource('expenses', ExpenseController::class);

        // INCOMES (Pemasukan Manual)
        Route::resource('incomes', IncomeController::class);

        // FINANCIAL LEDGER (Buku Besar)
        Route::get('/reports/ledger', [\App\Http\Controllers\Admin\FinancialLedgerController::class, 'index'])->name('reports.ledger');
        Route::get('/reports/ledger/export', [\App\Http\Controllers\Admin\FinancialLedgerController::class, 'export'])->name('reports.ledger.export');
        Route::get('/reports/journals/{journal}', [\App\Http\Controllers\Admin\FinancialLedgerController::class, 'showJournal'])->name('reports.journals.show');

        // TABLES
        Route::get('/tables', [\App\Http\Controllers\Admin\TableController::class, 'index'])->name('tables');
        Route::post('/tables', [\App\Http\Controllers\Admin\TableController::class, 'store'])->name('tables.store');
        Route::put('/tables/{table}', [\App\Http\Controllers\Admin\TableController::class, 'update'])->name('tables.update');
        Route::delete('/tables/{table}', [\App\Http\Controllers\Admin\TableController::class, 'destroy'])->name('tables.destroy');

        // ROOMS (For table layouts)
        Route::post('/rooms', [\App\Http\Controllers\Admin\RoomController::class, 'store'])->name('rooms.store');
        Route::put('/rooms/{room}', [\App\Http\Controllers\Admin\RoomController::class, 'update'])->name('rooms.update');
        Route::delete('/rooms/{room}', [\App\Http\Controllers\Admin\RoomController::class, 'destroy'])->name('rooms.destroy');

        // RESERVATIONS
        Route::resource('reservations', \App\Http\Controllers\Admin\ReservationController::class);

        // SETTINGS (Owner Only)
        Route::middleware(['role:owner'])->group(function () {
            Route::get('/settings', [SettingController::class, 'index'])->name('settings');
            Route::put('/settings', [SettingController::class, 'update'])->name('settings.update');
        });
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
