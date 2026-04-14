<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reservation_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->cascadeOnDelete();

            $table->string('payment_reference')->unique();
            $table->string('payment_method');

            $table->enum('payment_type', [
                'dp',
                'full',
                'settlement',
                'refund'
            ]);

            $table->decimal('amount', 15, 2);

            $table->string('gateway_reference')->nullable();
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])
                ->default('pending');

            $table->timestamp('paid_at')->nullable();

            $table->foreignId('created_by')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_payments');
    }
};
