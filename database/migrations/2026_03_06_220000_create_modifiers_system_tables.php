<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('modifiers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('modifier_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modifier_id')->constrained()->onDelete('cascade');
            $table->foreignId('material_id')->constrained()->onDelete('cascade');
            $table->decimal('qty', 10, 2);
            $table->timestamps();
        });

        // Pivot table to link menu items with their allowed modifiers
        Schema::create('menu_modifier', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained()->onDelete('cascade');
            $table->foreignId('modifier_id')->constrained()->onDelete('cascade');
        });

        // To link order items with their selected modifiers
        Schema::create('order_item_modifier', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('modifier_id')->constrained()->onDelete('cascade');
            $table->decimal('price', 15, 2); // Snapshot price at order time
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_modifier');
        Schema::dropIfExists('menu_modifier');
        Schema::dropIfExists('modifier_ingredients');
        Schema::dropIfExists('modifiers');
    }
};
