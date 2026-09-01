<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('group')->index();       // e.g. 'payment_gateway', 'whatsapp_gateway'
            $table->string('key');                   // e.g. 'api_key', 'secret_key', 'endpoint'
            $table->text('value')->nullable();       // encrypted if is_secret = true
            $table->boolean('is_secret')->default(false);
            $table->timestamps();

            $table->unique(['group', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
