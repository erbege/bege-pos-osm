<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shift_swaps', function (Blueprint $table) {
            $table->enum('status', ['waiting_recipient', 'pending', 'approved', 'rejected', 'rejected_by_recipient'])
                ->default('waiting_recipient')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('shift_swaps', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])
                ->default('pending')
                ->change();
        });
    }
};
