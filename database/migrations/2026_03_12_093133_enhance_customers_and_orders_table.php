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
            if (!Schema::hasColumn('customers', 'password')) {
                $table->string('password')->nullable()->after('email');
            }
            if (!Schema::hasColumn('customers', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('address');
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }
            if (!Schema::hasColumn('customers', 'fcm_token')) {
                $table->text('fcm_token')->nullable()->after('password');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'customer_id')) {
                $table->unsignedBigInteger('customer_id')->nullable()->after('branch_id');
                $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            }
            if (!Schema::hasColumn('orders', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('delivery_address');
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }
        });

        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->string('label')->default('Home'); // Home, Office, etc.
            $table->string('recipient_name');
            $table->string('recipient_phone');
            $table->text('address');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
        
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['customer_id', 'latitude', 'longitude']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['password', 'latitude', 'longitude', 'fcm_token']);
        });
    }
};
