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
        // Check if columns already exist before adding
        if (!Schema::hasColumn('stock_opname_sessions', 'scope')) {
            Schema::table('stock_opname_sessions', function (Blueprint $table) {
                $table->string('scope')->default('all')->after('branch_id');
            });
        }

        if (!Schema::hasColumn('stock_opname_sessions', 'blind_count')) {
            Schema::table('stock_opname_sessions', function (Blueprint $table) {
                $table->boolean('blind_count')->default(false)->after('status');
            });
        }

        if (!Schema::hasColumn('stock_opname_sessions', 'submitted_at')) {
            Schema::table('stock_opname_sessions', function (Blueprint $table) {
                $table->timestamp('submitted_at')->nullable()->after('completed_at');
                $table->unsignedBigInteger('submitted_by')->nullable()->after('submitted_at');
                $table->foreign('submitted_by')->references('id')->on('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('stock_opname_sessions', 'cancelled_at')) {
            Schema::table('stock_opname_sessions', function (Blueprint $table) {
                $table->timestamp('cancelled_at')->nullable()->after('approved_at');
                $table->unsignedBigInteger('cancelled_by')->nullable()->after('cancelled_at');
                $table->foreign('cancelled_by')->references('id')->on('users')->nullOnDelete();
            });
        }

        // Stock opname items
        if (!Schema::hasColumn('stock_opname_items', 'system_qty_snapshot')) {
            Schema::table('stock_opname_items', function (Blueprint $table) {
                $table->decimal('system_qty_snapshot', 10, 4)->nullable()->after('system_qty');
                $table->boolean('blind_count')->default(false)->after('variance');
            });
        }

        if (!Schema::hasColumn('stock_opname_items', 'counted_at')) {
            Schema::table('stock_opname_items', function (Blueprint $table) {
                $table->timestamp('counted_at')->nullable()->after('status');
                $table->unsignedBigInteger('counted_by')->nullable()->after('counted_at');
                $table->timestamp('reviewed_at')->nullable()->after('counted_by');
                $table->unsignedBigInteger('reviewed_by')->nullable()->after('reviewed_at');
                
                $table->foreign('counted_by')->references('id')->on('users')->nullOnDelete();
                $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_opname_sessions', function (Blueprint $table) {
            $table->dropForeign(['submitted_by', 'cancelled_by']);
            $table->dropColumn(['scope', 'blind_count', 'submitted_at', 'submitted_by', 'cancelled_at', 'cancelled_by']);
        });

        Schema::table('stock_opname_items', function (Blueprint $table) {
            $table->dropForeign(['counted_by', 'reviewed_by']);
            $table->dropColumn(['system_qty_snapshot', 'blind_count', 'counted_at', 'counted_by', 'reviewed_at', 'reviewed_by']);
        });
    }
};
