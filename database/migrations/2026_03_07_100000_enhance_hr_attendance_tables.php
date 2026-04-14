<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('nip')->nullable()->unique()->after('id');
            $table->string('address')->nullable()->after('phone');
            $table->date('join_date')->nullable()->after('address');
            $table->string('employment_status')->default('contract')->after('join_date'); // permanent, contract, intern
            $table->string('bank_name')->nullable()->after('employment_status');
            $table->string('bank_account_name')->nullable()->after('bank_name');
            $table->string('bank_account_number')->nullable()->after('bank_account_name');
            $table->decimal('hourly_rate', 15, 2)->default(0)->after('base_salary');
        });

        Schema::table('attendance_settings', function (Blueprint $table) {
            $table->decimal('late_penalty_per_minute', 15, 2)->default(0)->after('grace_time_minutes');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('total_hours', 8, 2)->default(0)->after('year');
            $table->decimal('hourly_rate', 15, 2)->default(0)->after('total_hours');
            $table->decimal('late_penalty_total', 15, 2)->default(0)->after('deduction');
            $table->decimal('bonus_performance', 15, 2)->default(0)->after('overtime');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['nip', 'address', 'join_date', 'employment_status', 'bank_name', 'bank_account_name', 'bank_account_number', 'hourly_rate']);
        });

        Schema::table('attendance_settings', function (Blueprint $table) {
            $table->dropColumn('late_penalty_per_minute');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn(['total_hours', 'hourly_rate', 'late_penalty_total', 'bonus_performance']);
        });
    }
};
