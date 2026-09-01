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
        if (!Schema::hasColumn('stock_transfers', 'creator_branch_id')) {
            Schema::table('stock_transfers', function (Blueprint $table) {
                $table->foreignId('creator_branch_id')->nullable()->constrained('branches')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropForeign(['creator_branch_id']);
            $table->dropColumn('creator_branch_id');
        });
    }
};
