<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Renames
            if (Schema::hasColumn('reservations', 'pax')) {
                $table->renameColumn('pax', 'guest_count');
            }
            if (Schema::hasColumn('reservations', 'reservation_time')) {
                $table->renameColumn('reservation_time', 'start_time');
            }

            // Missing Columns from the robust design
            if (!Schema::hasColumn('reservations', 'uuid')) {
                $table->uuid('uuid')->after('id')->nullable()->unique();
            }
            if (!Schema::hasColumn('reservations', 'reservation_number')) {
                $table->string('reservation_number')->after('uuid')->nullable()->unique();
            }
            if (!Schema::hasColumn('reservations', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('branch_id');
            }
            if (!Schema::hasColumn('reservations', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }
            if (!Schema::hasColumn('reservations', 'room_id')) {
                $table->foreignId('room_id')->nullable()->after('end_time');
            }
            if (!Schema::hasColumn('reservations', 'table_combination_json')) {
                $table->json('table_combination_json')->nullable()->after('room_id');
            }
            if (!Schema::hasColumn('reservations', 'payment_status')) {
                $table->string('payment_status')->default('unpaid')->after('status');
            }
            if (!Schema::hasColumn('reservations', 'dp_amount')) {
                $table->decimal('dp_amount', 15, 2)->default(0)->after('payment_status');
            }
            if (!Schema::hasColumn('reservations', 'total_estimated_amount')) {
                $table->decimal('total_estimated_amount', 15, 2)->default(0)->after('dp_amount');
            }
            if (!Schema::hasColumn('reservations', 'order_id')) {
                $table->foreignId('order_id')->nullable()->after('total_estimated_amount');
            }
            if (!Schema::hasColumn('reservations', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('order_id');
            }
            if (!Schema::hasColumn('reservations', 'checked_in_at')) {
                $table->timestamp('checked_in_at')->nullable()->after('expires_at');
            }
            if (!Schema::hasColumn('reservations', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('checked_in_at');
            }
            if (!Schema::hasColumn('reservations', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('completed_at');
            }
            if (!Schema::hasColumn('reservations', 'no_show_at')) {
                $table->timestamp('no_show_at')->nullable()->after('cancelled_at');
            }
            if (!Schema::hasColumn('reservations', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('no_show_at');
            }
            if (!Schema::hasColumn('reservations', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->after('created_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            //
        });
    }
};
