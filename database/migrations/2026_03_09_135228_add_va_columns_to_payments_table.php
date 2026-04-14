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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('gateway'); // QRIS, BANK_TRANSFER, CASH, etc
            $table->string('payment_channel')->nullable()->after('payment_method'); // BCA_VA, MANDIRI_VA, etc
            $table->string('virtual_account')->nullable()->after('reference_id');
            $table->timestamp('expired_at')->nullable()->after('virtual_account');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_channel', 'virtual_account', 'expired_at']);
        });
    }
};
