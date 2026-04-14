<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Menu;
use App\Models\Table;

class PosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branchId = \App\Models\Branch::first()->id;

        $food = Category::create(['name' => 'Food', 'branch_id' => $branchId]);
        $drinks = Category::create(['name' => 'Drinks', 'branch_id' => $branchId]);
        $desserts = Category::create(['name' => 'Desserts', 'branch_id' => $branchId]);

        Menu::create(['category_id' => $food->id, 'name' => 'Nasi Goreng Spesial', 'price' => 25000, 'description' => 'Nasi goreng dengan telur dan ayam', 'image' => 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=400&h=300', 'branch_id' => $branchId]);
        Menu::create(['category_id' => $food->id, 'name' => 'Mie Goreng Seafood', 'price' => 30000, 'description' => 'Mie goreng with shrimp and squid', 'image' => 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400&h=300', 'branch_id' => $branchId]);
        Menu::create(['category_id' => $food->id, 'name' => 'Sate Ayam Madura', 'price' => 20000, 'description' => '10 skewers chicken satay', 'image' => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400&h=300', 'branch_id' => $branchId]);

        Menu::create(['category_id' => $drinks->id, 'name' => 'Es Teh Manis', 'price' => 5000, 'description' => 'Iced sweet tea', 'image' => null, 'branch_id' => $branchId]);
        Menu::create(['category_id' => $drinks->id, 'name' => 'Kopi Kenangan Mantan', 'price' => 18000, 'description' => 'Palm sugar milk coffee', 'image' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400&h=300', 'branch_id' => $branchId]);
        Menu::create(['category_id' => $drinks->id, 'name' => 'Jus Alpukat', 'price' => 15000, 'description' => 'Fresh avocado juice', 'image' => 'https://images.unsplash.com/photo-1605807646983-377bc5a7644e?auto=format&fit=crop&q=80&w=400&h=300', 'branch_id' => $branchId]);

        Menu::create(['category_id' => $desserts->id, 'name' => 'Pancake Durian', 'price' => 25000, 'description' => 'Original durian pancake', 'image' => null, 'branch_id' => $branchId]);
        Menu::create(['category_id' => $desserts->id, 'name' => 'Es Krim Coklat', 'price' => 12000, 'description' => '2 scoops chocolate ice cream', 'image' => 'https://images.unsplash.com/photo-1563805042-7684c8e9e533?auto=format&fit=crop&q=80&w=400&h=300', 'branch_id' => $branchId]);

        // Seeding tables
        $tables = [
            // Top row
            ['name' => 'T1', 'capacity' => 2, 'pos_x' => 100, 'pos_y' => 100, 'shape' => 'round', 'width' => 80, 'height' => 80],
            ['name' => 'T2', 'capacity' => 2, 'pos_x' => 250, 'pos_y' => 100, 'shape' => 'round', 'width' => 80, 'height' => 80],
            ['name' => 'T3', 'capacity' => 2, 'pos_x' => 400, 'pos_y' => 100, 'shape' => 'round', 'width' => 80, 'height' => 80],
            // Middle row (large tables)
            ['name' => 'F1', 'capacity' => 6, 'pos_x' => 100, 'pos_y' => 250, 'shape' => 'rectangle', 'width' => 120, 'height' => 80],
            ['name' => 'F2', 'capacity' => 6, 'pos_x' => 300, 'pos_y' => 250, 'shape' => 'rectangle', 'width' => 120, 'height' => 80],
            ['name' => 'F3', 'capacity' => 6, 'pos_x' => 500, 'pos_y' => 250, 'shape' => 'rectangle', 'width' => 120, 'height' => 80],
            // Bottom row
            ['name' => 'B1', 'capacity' => 4, 'pos_x' => 100, 'pos_y' => 400, 'shape' => 'rectangle', 'width' => 100, 'height' => 100],
            ['name' => 'B2', 'capacity' => 4, 'pos_x' => 250, 'pos_y' => 400, 'shape' => 'rectangle', 'width' => 100, 'height' => 100],
            ['name' => 'B3', 'capacity' => 4, 'pos_x' => 400, 'pos_y' => 400, 'shape' => 'rectangle', 'width' => 100, 'height' => 100],
        ];

        foreach ($tables as $t) {
            Table::create([
                'name' => $t['name'],
                'capacity' => $t['capacity'],
                'status' => 'available',
                'pos_x' => $t['pos_x'],
                'pos_y' => $t['pos_y'],
                'shape' => $t['shape'],
                'width' => $t['width'],
                'height' => $t['height'],
                'branch_id' => $branchId
            ]);
        }

        // Seeding Customers
        \App\Models\Customer::create(['name' => 'John Doe', 'email' => 'john@example.com', 'phone' => '08123456789', 'branch_id' => $branchId, 'points' => 100]);
        \App\Models\Customer::create(['name' => 'Jane Smith', 'email' => 'jane@example.com', 'phone' => '08987654321', 'branch_id' => $branchId, 'points' => 50]);
        \App\Models\Customer::create(['name' => 'Michael Corleone', 'email' => 'michael@godfather.com', 'phone' => '08777777777', 'branch_id' => $branchId, 'points' => 500]);
    }
}
