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
        Schema::table('customers', function (Blueprint $table) {
            // Add user_id to link with users table
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->onDelete('cascade');
            
            // Drop columns that are now managed by the users table
            if (Schema::hasColumn('customers', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('customers', 'password')) {
                $table->dropColumn('password');
            }
            if (Schema::hasColumn('customers', 'fcm_token')) {
                $table->dropColumn('fcm_token');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
            
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->text('fcm_token')->nullable();
        });
    }
};
