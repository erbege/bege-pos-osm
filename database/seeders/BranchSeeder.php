<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Branch;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Branch::create([
            'name' => 'Main Branch',
            'address' => 'Jl. Sudirman No. 1, Jakarta',
            'phone' => '021-123456',
            'is_active' => true,
        ]);

        Branch::create([
            'name' => 'Downtown Cafe',
            'address' => 'Jl. Thamrin No. 5, Jakarta',
            'phone' => '021-654321',
            'is_active' => true,
        ]);
    }
}
