<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reservation_menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_id')->constrained()->restrictOnDelete();

            $table->integer('quantity');
            $table->decimal('price_snapshot', 15, 2);

            $table->time('scheduled_serve_time')->nullable();

            $table->enum('status', [
                'scheduled',
                'preparing',
                'ready',
                'served',
                'cancelled'
            ])->default('scheduled');

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_menus');
    }
};
