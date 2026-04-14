<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->decimal('qty_reserved', 10, 2)->default(0)->after('stock');
            $table->decimal('avg_cost', 15, 2)->default(0)->after('qty_reserved');
        });

        Schema::create('stock_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('material_id')->constrained()->onDelete('cascade');
            $table->string('reference_type'); // e.g., App\Models\Order
            $table->unsignedBigInteger('reference_id');
            $table->decimal('qty', 10, 2);
            $table->string('status')->default('reserved'); // reserved, released, deducted
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reservations');
        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn(['qty_reserved', 'avg_cost']);
        });
    }
};
