<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employee_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('shift_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->string('role_note')->nullable(); // e.g., "Barista", "Waiter"
            $table->timestamps();

            $table->unique(['employee_id', 'date']);
        });

        Schema::create('shift_swaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('recipient_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('requester_schedule_id')->constrained('employee_schedules')->onDelete('cascade');
            $table->foreignId('recipient_schedule_id')->constrained('employee_schedules')->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('reason')->nullable();
            $table->timestamps();
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->after('name');
            $table->enum('status', ['in_duty', 'off_duty', 'on_leave', 'inactive'])->default('off_duty')->after('photo_path');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_swaps');
        Schema::dropIfExists('employee_schedules');
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['photo_path', 'status']);
        });
    }
};
