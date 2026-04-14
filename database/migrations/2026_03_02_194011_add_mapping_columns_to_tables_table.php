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
        Schema::table('tables', function (Blueprint $table) {
            $table->string('shape')->default('rectangle')->after('status')->comment('rectangle, round');
            $table->integer('pos_x')->default(0)->after('shape');
            $table->integer('pos_y')->default(0)->after('pos_x');
            $table->integer('width')->default(100)->after('pos_y');
            $table->integer('height')->default(100)->after('width');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn(['shape', 'pos_x', 'pos_y', 'width', 'height']);
        });
    }
};
