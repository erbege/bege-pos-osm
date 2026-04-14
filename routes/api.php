<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // PUBLIC SETTINGS
    Route::get('/settings', 'App\Http\Controllers\Api\SettingsController@index');

    // INTERNAL TOOLS (Shared between POS and Mobile)
    Route::post('/discounts/validate', 'App\Http\Controllers\Api\DiscountController@validateCode');
    Route::post('/tables/layout', 'App\Http\Controllers\Api\TableController@updateLayout');

    // 1. AUTH (Staff)
    Route::prefix('auth')->group(function () {
        Route::post('/login', 'App\Http\Controllers\Api\AuthController@login')->middleware('throttle:login');
        Route::post('/logout', 'App\Http\Controllers\Api\AuthController@logout')->middleware('auth:sanctum');
        Route::get('/me', 'App\Http\Controllers\Api\AuthController@me')->middleware('auth:sanctum');
    });

    // CUSTOMER AUTH
    Route::prefix('customer')->group(function () {
        Route::post('/register', 'App\Http\Controllers\Api\Customer\CustomerAuthController@register');
        Route::post('/login', 'App\Http\Controllers\Api\Customer\CustomerAuthController@login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', 'App\Http\Controllers\Api\Customer\CustomerAuthController@logout');
            Route::get('/profile', 'App\Http\Controllers\Api\Customer\CustomerProfileController@profile');
            Route::put('/profile', 'App\Http\Controllers\Api\Customer\CustomerProfileController@updateProfile');
            Route::get('/orders', 'App\Http\Controllers\Api\Customer\CustomerProfileController@orders');
            
            Route::prefix('addresses')->group(function () {
                Route::post('/', 'App\Http\Controllers\Api\Customer\CustomerProfileController@addAddress');
                Route::put('/{address}', 'App\Http\Controllers\Api\Customer\CustomerProfileController@updateAddress');
                Route::delete('/{address}', 'App\Http\Controllers\Api\Customer\CustomerProfileController@deleteAddress');
            });
        });
    });

    // 2. MENU (Customer)
    Route::prefix('menus')->group(function () {
        Route::get('/categories', 'App\Http\Controllers\Api\MenuController@categories');
        Route::get('/', 'App\Http\Controllers\Api\MenuController@index');
        Route::get('/{id}', 'App\Http\Controllers\Api\MenuController@show');
    });

    // 3. TABLE
    Route::prefix('tables')->group(function () {
        Route::get('/available', 'App\Http\Controllers\Api\TableController@available');
        Route::get('/{id}', 'App\Http\Controllers\Api\TableController@show');
    });

    // RESERVATION (Public to allow guest bookings)
    Route::prefix('reservations')->group(function () {
        Route::post('/check-availability', 'App\Http\Controllers\Api\ReservationController@checkAvailability');
        Route::post('/', 'App\Http\Controllers\Api\ReservationController@store');
    });

    // 4. PUBLIC ORDER CREATION & TRACKING
    Route::prefix('orders')->group(function () {
        Route::post('/', 'App\Http\Controllers\Api\OrderController@store');
        Route::get('/{order}', 'App\Http\Controllers\Api\OrderController@show');
        Route::get('/status/{order}', 'App\Http\Controllers\Api\OrderController@status');
        // Generating QR for guest order payment
        Route::post('/{order}/generate-qr', 'App\Http\Controllers\Api\PaymentController@generateQr');
    });

    // CUSTOMER ROUTES (Requires Auth)
    Route::middleware('auth:sanctum')->group(function () {

        // 4. AUTHENTICATED ORDER MANAGEMENT
        Route::prefix('orders')->group(function () {
            Route::post('/{order}/items', 'App\Http\Controllers\Api\OrderController@addItem');
            Route::delete('/items/{id}', 'App\Http\Controllers\Api\OrderController@removeItem');
            Route::post('/{order}/checkout', 'App\Http\Controllers\Api\OrderController@checkout');
        });

        // 5. PAYMENT
        Route::prefix('payments')->group(function () {
            Route::post('/callback', 'App\Http\Controllers\Api\PaymentController@callback')->middleware('throttle:payment');
        });

        // 14. REALTIME STATUS
        Route::get('/realtime/order/{order}', 'App\Http\Controllers\Api\OrderController@realtimeStatus');

        // 11. PWA OFFLINE SYNC
        Route::post('/sync/orders', 'App\Http\Controllers\Api\SyncController@syncOrders')->middleware('throttle:sync');
    });

    // STAFF ROUTES (Requires Auth + Role)
    Route::middleware('auth:sanctum')->group(function () {

        // 6. KITCHEN
        Route::middleware('role:Admin|Kitchen')->prefix('kitchen')->group(function () {
            Route::get('/orders', 'App\Http\Controllers\Api\KitchenController@orders');
            Route::post('/{order}/start', 'App\Http\Controllers\Api\KitchenController@startCooking');
            Route::post('/{order}/ready', 'App\Http\Controllers\Api\KitchenController@markReady');
        });

        // 7. CASHIER
        Route::middleware('role:Admin|Cashier')->prefix('cashier')->group(function () {
            Route::get('/orders', 'App\Http\Controllers\Api\CashierController@orders');
            Route::post('/{order}/pay-cash', 'App\Http\Controllers\Api\CashierController@payCash');
        });

        // 10. EMPLOYEE & HR (Staff Dashboard)
        Route::prefix('employee')->group(function () {
            Route::get('/profile', 'App\Http\Controllers\Api\EmployeeController@profile');
            Route::post('/leave', 'App\Http\Controllers\Api\EmployeeController@leaveRequest');
            Route::post('/overtime', 'App\Http\Controllers\Api\EmployeeController@overtimeRequest');
            Route::post('/correction', 'App\Http\Controllers\Api\EmployeeController@correctionRequest');
        });

        // 11. ATTENDANCE
        Route::prefix('attendance')->group(function () {
            Route::get('/today', 'App\Http\Controllers\Api\AttendanceController@today');
            Route::get('/history', 'App\Http\Controllers\Api\AttendanceController@history');
            Route::get('/settings', 'App\Http\Controllers\Api\AttendanceController@settings');
            Route::post('/check-in', 'App\Http\Controllers\Api\AttendanceController@checkIn');
            Route::post('/check-out', 'App\Http\Controllers\Api\AttendanceController@checkOut');
        });

        // 12. PAYROLL
        Route::prefix('payroll')->group(function () {
            Route::get('/', 'App\Http\Controllers\Api\PayrollController@index');
            Route::get('/{id}', 'App\Http\Controllers\Api\PayrollController@show');
        });

        // 14. SHIFTS & SCHEDULES
        Route::prefix('shifts')->group(function () {
            Route::get('/', 'App\Http\Controllers\Api\ShiftController@index');
            Route::get('/history', 'App\Http\Controllers\Api\ShiftController@history');
            Route::post('/swap', 'App\Http\Controllers\Api\ShiftController@swapRequest');
        });

        // ADMIN SPECIFIC MODULES
        Route::middleware('role:Admin')->group(function () {

            // 8. INVENTORY
            Route::prefix('materials')->group(function () {
                Route::post('/adjust', 'App\Http\Controllers\Api\InventoryController@adjust');
                Route::get('/', 'App\Http\Controllers\Api\InventoryController@index');
                Route::get('/active-opname', 'App\Http\Controllers\Api\InventoryController@activeOpname');
                Route::post('/start-opname', 'App\Http\Controllers\Api\InventoryController@startOpname');
                Route::post('/update-count/{itemId}', 'App\Http\Controllers\Api\InventoryController@updateCount');
                Route::post('/submit-opname/{sessionId}', 'App\Http\Controllers\Api\InventoryController@submitOpname');
                Route::get('/low-stock', 'App\Http\Controllers\Api\InventoryController@lowStock');
            });

            // 9. PURCHASE
            Route::prefix('purchases')->group(function () {
                Route::post('/', 'App\Http\Controllers\Api\PurchaseController@store');
                Route::get('/', 'App\Http\Controllers\Api\PurchaseController@index');
            });

            // 13. FINANCE
            Route::prefix('finance')->group(function () {
                Route::get('/income', 'App\Http\Controllers\Api\FinanceController@income');
                Route::get('/expense', 'App\Http\Controllers\Api\FinanceController@expense');
                Route::get('/summary', 'App\Http\Controllers\Api\FinanceController@summary');
            });

            Route::prefix('admin')->group(function() {
                 Route::get('/employees', 'App\Http\Controllers\Api\EmployeeController@index');
                 Route::get('/finance/summary', 'App\Http\Controllers\Api\FinanceController@summary');
            });
        });
    });

    Route::fallback(function () {
        return response()->json(['message' => 'API Endpoint Not Found'], 404);
    });
});
