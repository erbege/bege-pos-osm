<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tambahkan kolom room_id secara nullable dulu
        Schema::table('tables', function (Blueprint $table) {
            $table->unsignedBigInteger('room_id')->nullable()->after('branch_id');
        });

        // 2. Buat Default Room untuk setiap Branch yang ada
        $branches = DB::table('branches')->get();
        foreach ($branches as $branch) {
            $roomId = DB::table('rooms')->insertGetId([
                'branch_id' => $branch->id,
                'name' => 'Main Area',
                'description' => 'Default Room',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign semua tabel yang berada di cabang ini ke room default
            DB::table('tables')->where('branch_id', $branch->id)->update(['room_id' => $roomId]);
        }

        // 3. Tambahkan foreign key constraint dan jadikan non-nullable (atau gunakan cascade null jika mau)
        Schema::table('tables', function (Blueprint $table) {
            // Karena kita sudah isi data, kita bisa asumsikan tabel punya foreign key dan onDelete cascade
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropForeign(['room_id']);
            $table->dropColumn('room_id');
        });
    }
};
