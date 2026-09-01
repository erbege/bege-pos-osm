<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('reservation_number')->unique();

            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();

            $table->string('customer_name');
            $table->string('customer_phone');

            $table->integer('guest_count');

            $table->date('reservation_date');
            $table->time('start_time');
            $table->time('end_time')->nullable();

            $table->foreignId('room_id')->nullable()->constrained()->nullOnDelete();

            $table->json('table_combination_json')->nullable();

            $table->enum('status', [
                'draft',
                'pending_payment',
                'pending', // Adding pending to be safe, state machine uses it
                'confirmed',
                'preparing',
                'ready',
                'checked_in',
                'completed',
                'cancelled',
                'rejected', // State machine uses it
                'no_show'
            ])->default('draft');

            $table->enum('payment_status', [
                'unpaid',
                'partial',
                'paid',
                'refunded',
                'failed' // Sync uses it
            ])->default('unpaid');

            $table->decimal('dp_amount', 15, 2)->default(0);
            $table->decimal('total_estimated_amount', 15, 2)->default(0);

            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();

            $table->timestamp('expires_at')->nullable()->index(); // Auto expire
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('no_show_at')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'reservation_date']);
            $table->index('status');
            $table->index(['status', 'expires_at']); // Optimized query index
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
