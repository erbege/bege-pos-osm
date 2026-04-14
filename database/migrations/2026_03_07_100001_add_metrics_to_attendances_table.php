<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->integer('late_minutes')->default(0)->after('status');
            $table->decimal('work_hours', 5, 2)->default(0)->after('late_minutes');
            $table->foreignId('shift_id')->nullable()->constrained()->onDelete('set null')->after('employee_id');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn(['late_minutes', 'work_hours', 'shift_id']);
        });
    }
};
