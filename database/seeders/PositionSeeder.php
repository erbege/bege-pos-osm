<?php

namespace Database\Seeders;

use App\Models\Position;
use Illuminate\Database\Seeder;

class PositionSeeder extends Seeder
{
    public function run(): void
    {
        $positions = [
            ['name' => 'Manager', 'description' => 'Store Manager'],
            ['name' => 'Supervisor', 'description' => 'Shift Supervisor'],
            ['name' => 'Barista', 'description' => 'Coffee Specialist'],
            ['name' => 'Cook', 'description' => 'Kitchen Staff'],
            ['name' => 'Waiter/Waitress', 'description' => 'Service Staff'],
            ['name' => 'Cashier', 'description' => 'Front-end Staff'],
            ['name' => 'Cleaner', 'description' => 'Maintenance Staff'],
        ];

        foreach ($positions as $position) {
            Position::updateOrCreate(['name' => $position['name']], $position);
        }
    }
}
