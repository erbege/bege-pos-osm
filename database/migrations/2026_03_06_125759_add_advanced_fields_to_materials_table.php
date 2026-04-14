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
        Schema::table('materials', function (Blueprint $table) {
            $table->string('sku')->nullable()->unique()->after('name');
            $table->string('type')->default('raw_material')->after('sku'); // raw_material, semi_finished, finished
            $table->boolean('track_inventory')->default(true)->after('conversion_factor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn(['sku', 'type', 'track_inventory']);
        });
    }
};
