<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_channel')->default('POS')->after('status')->comment('POS, TABLE, ONLINE, MARKETPLACE, DELIVERY');
            $table->string('order_type')->default('DINE_IN')->after('order_channel')->comment('DINE_IN, TAKEAWAY, DELIVERY');
            $table->string('payment_status')->default('UNPAID')->after('order_type')->comment('UNPAID, PAID, FAILED, REFUNDED');
            $table->string('fulfillment_status')->default('PENDING')->after('payment_status')->comment('PENDING, PREPARING, READY, DRIVER_ASSIGNED, PICKED_UP, DELIVERED');
            $table->text('delivery_address')->nullable()->after('fulfillment_status');
            $table->decimal('delivery_fee', 15, 2)->default(0)->after('delivery_address');
            $table->string('driver_name')->nullable()->after('delivery_fee');
            $table->text('delivery_notes')->nullable()->after('driver_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'order_channel',
                'order_type',
                'payment_status',
                'fulfillment_status',
                'delivery_address',
                'delivery_fee',
                'driver_name',
                'delivery_notes'
            ]);
        });
    }
};
