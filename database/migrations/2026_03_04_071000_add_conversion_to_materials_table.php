<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Unit Conversion System:
     *   - `unit` (existing): base/recipe unit (ml, gram, pcs) — used in recipes & stock tracking
     *   - `purchase_unit`: bulk unit used for procurement (Botol, Karung, Pack)
     *   - `conversion_factor`: how many base units in 1 purchase unit (e.g., 1 Botol = 300 ml → factor = 300)
     *
     * Example: Sirup Ceri 300ml x 12 Botol
     *   unit = ml, purchase_unit = Botol, conversion_factor = 300
     *   Purchase 12 Botol → stock += 12 * 300 = 3600 ml
     *   Recipe needs 30 ml → stock -= 30 ml per order
     */
    public function up(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->string('purchase_unit')->nullable()->after('unit');
            $table->decimal('conversion_factor', 10, 2)->default(1)->after('purchase_unit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn(['purchase_unit', 'conversion_factor']);
        });
    }
};
