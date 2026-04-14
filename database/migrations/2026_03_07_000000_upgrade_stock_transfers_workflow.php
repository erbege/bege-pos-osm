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
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->timestamp('approved_at')->nullable()->after('status');
            $table->timestamp('shipped_at')->nullable()->after('approved_at');
            $table->timestamp('received_at')->nullable()->after('shipped_at');
            $table->timestamp('rejected_at')->nullable()->after('received_at');
            $table->foreignId('rejected_by')->nullable()->constrained('users')->onDelete('set null')->after('approved_by');
            $table->foreignId('shipped_by')->nullable()->constrained('users')->onDelete('set null')->after('rejected_by');
            $table->foreignId('received_by')->nullable()->constrained('users')->onDelete('set null')->after('shipped_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropForeign(['rejected_by']);
            $table->dropForeign(['shipped_by']);
            $table->dropForeign(['received_by']);
            $table->dropColumn(['approved_at', 'shipped_at', 'received_at', 'rejected_at', 'rejected_by', 'shipped_by', 'received_by']);
        });
    }
};
