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
            $table->boolean('is_dp_required')->default(false)->after('payment_status');
            $table->decimal('dp_percentage', 5, 2)->default(0)->after('is_dp_required');
            $table->decimal('final_total_amount', 15, 2)->default(0)->after('total_estimated_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['is_dp_required', 'dp_percentage', 'final_total_amount']);
        });
    }
};
