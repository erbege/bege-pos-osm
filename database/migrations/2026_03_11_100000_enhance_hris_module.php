<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ─── Enhance Employees ─────────────────────────────────────
        Schema::table('employees', function (Blueprint $table) {
            $table->string('pay_type')->default('salary_and_hourly')->after('hourly_rate');
            // salary_and_hourly | salary_only | hourly_only
            $table->string('gender')->nullable()->after('name');
            $table->date('birth_date')->nullable()->after('gender');
            $table->string('emergency_contact_name')->nullable()->after('bank_account_number');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            $table->string('tax_id')->nullable()->after('emergency_contact_phone'); // NPWP
            $table->string('bpjs_kes')->nullable()->after('tax_id');
            $table->string('bpjs_tk')->nullable()->after('bpjs_kes');
            $table->date('end_date')->nullable()->after('join_date'); // contract end
            $table->text('notes')->nullable()->after('bpjs_tk');
        });

        // ─── Enhance Payrolls ──────────────────────────────────────
        Schema::table('payrolls', function (Blueprint $table) {
            $table->string('pay_type')->default('salary_and_hourly')->after('hourly_rate');
            $table->decimal('base_salary_amount', 15, 2)->default(0)->after('pay_type');
            // actual base salary from employee profile (snapshot)
            $table->decimal('cash_advance_deduction', 15, 2)->default(0)->after('late_penalty_total');
            $table->decimal('allowance_total', 15, 2)->default(0)->after('bonus_performance');
            $table->decimal('bonus_total', 15, 2)->default(0)->after('allowance_total');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('status');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->timestamp('paid_at')->nullable()->after('approved_at');
            $table->date('period_start')->nullable()->after('year');
            $table->date('period_end')->nullable()->after('period_start');
            $table->text('notes')->nullable()->after('paid_at');
        });

        // ─── Enhance Attendances ───────────────────────────────────
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('source')->default('manual')->after('status');
            // manual | web | mobile | api
            $table->decimal('check_in_lat', 10, 7)->nullable()->after('check_in');
            $table->decimal('check_in_lng', 10, 7)->nullable()->after('check_in_lat');
            $table->decimal('check_out_lat', 10, 7)->nullable()->after('check_out');
            $table->decimal('check_out_lng', 10, 7)->nullable()->after('check_out_lat');
            $table->text('notes')->nullable()->after('source');
            $table->boolean('is_absent')->default(false)->after('notes');
            $table->string('absence_type')->nullable()->after('is_absent');
            // alpha | sick | permit | leave
        });

        // ─── Enhance Shifts ────────────────────────────────────────
        Schema::table('shifts', function (Blueprint $table) {
            $table->integer('break_duration_minutes')->default(0)->after('end_time');
            $table->string('color')->nullable()->after('break_duration_minutes');
            $table->decimal('overtime_rate_multiplier', 4, 2)->default(1.5)->after('color');
        });

        // ─── Employee Allowances ───────────────────────────────────
        Schema::create('employee_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g. "Transport", "Meal", "Position Allowance"
            $table->string('type')->default('fixed'); // fixed | per_day | per_attendance
            $table->decimal('amount', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->date('effective_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });

        // ─── Payroll Components (Line Items) ───────────────────────
        Schema::create('payroll_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_id')->constrained()->cascadeOnDelete();
            $table->string('component_type'); // earning | deduction
            $table->string('name');
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_components');
        Schema::dropIfExists('employee_allowances');

        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn(['break_duration_minutes', 'color', 'overtime_rate_multiplier']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'source',
                'check_in_lat',
                'check_in_lng',
                'check_out_lat',
                'check_out_lng',
                'notes',
                'is_absent',
                'absence_type',
            ]);
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'pay_type',
                'base_salary_amount',
                'cash_advance_deduction',
                'allowance_total',
                'bonus_total',
                'approved_by',
                'approved_at',
                'paid_at',
                'period_start',
                'period_end',
                'notes',
            ]);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'pay_type',
                'gender',
                'birth_date',
                'emergency_contact_name',
                'emergency_contact_phone',
                'tax_id',
                'bpjs_kes',
                'bpjs_tk',
                'end_date',
                'notes',
            ]);
        });
    }
};
