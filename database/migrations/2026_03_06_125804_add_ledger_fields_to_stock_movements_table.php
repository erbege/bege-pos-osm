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
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->string('reference_type')->nullable()->after('supplier_id');
            $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');
            $table->decimal('cost', 15, 2)->default(0)->after('qty');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn(['reference_type', 'reference_id', 'cost']);
        });
    }
};
