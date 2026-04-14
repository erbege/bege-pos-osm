<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Material;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Position;
use App\Models\Recipe;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Shift;
use App\Models\Supplier;
use App\Models\Table;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RealisticDummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = \Faker\Factory::create('id_ID');

        $branch = Branch::first();
        if (! $branch) {
            $this->call(BranchSeeder::class);
            $branch = Branch::first();
        }
        $branchId = $branch->id;

        $user = User::whereHas('roles', fn ($q) => $q->where('name', 'owner'))->first();
        if (! $user) {
            $this->call(RolePermissionSeeder::class);
            $user = User::whereHas('roles', fn ($q) => $q->where('name', 'owner'))->first();
        }

        DB::transaction(function () use ($faker, $branchId, $user) {
            // 1. Suppliers
            $suppliers = [];
            for ($i = 0; $i < 5; $i++) {
                $suppliers[] = Supplier::create([
                    'name' => $faker->company,
                    'contact' => $faker->phoneNumber,
                    'email' => $faker->companyEmail,
                    'address' => $faker->address,
                    'payment_terms' => 'Net 30',
                ]);
            }

            // 2. Materials (Raw)
            $materialsData = [
                ['name' => 'Beras Premium', 'unit' => 'kg', 'sku' => 'MAT-001', 'type' => 'raw_material', 'min_stock' => 50, 'stock' => 100],
                ['name' => 'Telur Ayam', 'unit' => 'kg', 'sku' => 'MAT-002', 'type' => 'raw_material', 'min_stock' => 10, 'stock' => 20],
                ['name' => 'Daging Ayam Fillet', 'unit' => 'kg', 'sku' => 'MAT-003', 'type' => 'raw_material', 'min_stock' => 20, 'stock' => 40],
                ['name' => 'Minyak Goreng', 'unit' => 'liter', 'sku' => 'MAT-004', 'type' => 'raw_material', 'min_stock' => 10, 'stock' => 25],
                ['name' => 'Bawang Merah', 'unit' => 'kg', 'sku' => 'MAT-005', 'type' => 'raw_material', 'min_stock' => 5, 'stock' => 10],
                ['name' => 'Bawang Putih', 'unit' => 'kg', 'sku' => 'MAT-006', 'type' => 'raw_material', 'min_stock' => 5, 'stock' => 10],
                ['name' => 'Teh Celup', 'unit' => 'box', 'sku' => 'MAT-007', 'type' => 'raw_material', 'min_stock' => 5, 'stock' => 15],
                ['name' => 'Gula Pasir', 'unit' => 'kg', 'sku' => 'MAT-008', 'type' => 'raw_material', 'min_stock' => 10, 'stock' => 30],
                ['name' => 'Biji Kopi Arabika', 'unit' => 'kg', 'sku' => 'MAT-009', 'type' => 'raw_material', 'min_stock' => 5, 'stock' => 12],
                ['name' => 'Susu UHT', 'unit' => 'liter', 'sku' => 'MAT-010', 'type' => 'raw_material', 'min_stock' => 12, 'stock' => 24],
            ];

            foreach ($materialsData as $m) {
                $material = Material::updateOrCreate(['sku' => $m['sku']], array_merge($m, ['branch_id' => $branchId]));

                // Add initial stock movement
                \App\Models\StockMovement::create([
                    'material_id' => $material->id,
                    'branch_id' => $branchId,
                    'type' => 'in',
                    'qty' => $m['stock'],
                    'cost' => rand(5000, 20000),
                    'notes' => 'Initial Stock Seed',
                    'created_at' => Carbon::now()->subDays(35),
                ]);

                // Add some purchase movements
                for ($j = 0; $j < 3; $j++) {
                    $purchaseQty = rand(10, 50);
                    $purchaseDate = Carbon::now()->subDays(rand(1, 30));
                    \App\Models\StockMovement::create([
                        'material_id' => $material->id,
                        'branch_id' => $branchId,
                        'supplier_id' => $suppliers[array_rand($suppliers)]->id,
                        'type' => 'in',
                        'qty' => $purchaseQty,
                        'cost' => rand(5000, 20000),
                        'notes' => 'Weekly Purchase',
                        'created_at' => $purchaseDate,
                    ]);
                    $material->increment('stock', $purchaseQty);
                }
            }

            // 3. Recipes for existing menus
            $menus = Menu::all();
            $materialModels = Material::all();

            foreach ($menus as $menu) {
                // Assign 1-3 materials to each menu
                $randomMaterials = $materialModels->random(min(3, $materialModels->count()));
                foreach ($randomMaterials as $mat) {
                    Recipe::updateOrCreate(
                        ['menu_id' => $menu->id, 'material_id' => $mat->id],
                        [
                            'qty' => $faker->randomFloat(2, 0.05, 0.5),
                            'yield_qty' => 1,
                            'yield_unit' => 'portion',
                        ]
                    );
                }
            }

            // 4. More Rooms & Tables
            $vipRoom = Room::firstOrCreate(['name' => 'VIP Room', 'branch_id' => $branchId], ['description' => 'Exclusive Area']);
            $outdoor = Room::firstOrCreate(['name' => 'Outdoor Terrace', 'branch_id' => $branchId], ['description' => 'Smoking Area']);

            $additionalTables = [
                ['name' => 'V1', 'capacity' => 4, 'room_id' => $vipRoom->id, 'pos_x' => 100, 'pos_y' => 100],
                ['name' => 'V2', 'capacity' => 4, 'room_id' => $vipRoom->id, 'pos_x' => 250, 'pos_y' => 100],
                ['name' => 'O1', 'capacity' => 2, 'room_id' => $outdoor->id, 'pos_x' => 100, 'pos_y' => 100],
                ['name' => 'O2', 'capacity' => 2, 'room_id' => $outdoor->id, 'pos_x' => 200, 'pos_y' => 100],
            ];

            foreach ($additionalTables as $t) {
                Table::updateOrCreate(
                    ['name' => $t['name'], 'branch_id' => $branchId],
                    array_merge($t, [
                        'status' => 'available',
                        'shape' => 'rectangle',
                        'width' => 80,
                        'height' => 80,
                    ])
                );
            }

            // 5. More Employees & Shifts
            $positions = Position::all();
            if ($positions->isEmpty()) {
                $this->call(PositionSeeder::class);
                $positions = Position::all();
            }

            $morningShift = Shift::firstOrCreate(['name' => 'Morning Shift', 'branch_id' => $branchId], ['start_time' => '08:00:00', 'end_time' => '16:00:00']);
            $eveningShift = Shift::firstOrCreate(['name' => 'Evening Shift', 'branch_id' => $branchId], ['start_time' => '16:00:00', 'end_time' => '00:00:00']);

            for ($i = 0; $i < 10; $i++) {
                $empName = $faker->name;
                $empEmail = Str::slug($empName).'@example.com';

                $empUser = User::firstOrCreate(['email' => $empEmail], [
                    'name' => $empName,
                    'password' => bcrypt('password'),
                    'branch_id' => $branchId,
                ]);
                $empUser->syncRoles('cashier');

                $employee = Employee::updateOrCreate(['user_id' => $empUser->id], [
                    'name' => $empName,
                    'branch_id' => $branchId,
                    'nip' => 'EMP'.str_pad($i + 10, 3, '0', STR_PAD_LEFT).rand(100, 999),
                    'phone' => $faker->phoneNumber,
                    'address' => $faker->address,
                    'join_date' => Carbon::now()->subMonths(rand(1, 24)),
                    'employment_status' => 'contract',
                    'base_salary' => rand(3000000, 5000000),
                    'hourly_rate' => rand(15000, 25000),
                    'status' => 'off_duty',
                    'position_id' => $positions->random()->id,
                ]);

                // 6. Schedule & Attendance for last 7 days
                for ($d = 0; $d < 7; $d++) {
                    $date = Carbon::today()->subDays($d);
                    if ($date->isWeekend() && rand(0, 1)) {
                        continue;
                    } // Random day off

                    $shift = rand(0, 1) ? $morningShift : $eveningShift;

                    EmployeeSchedule::updateOrCreate(
                        ['employee_id' => $employee->id, 'date' => $date->toDateString()],
                        ['shift_id' => $shift->id, 'branch_id' => $branchId, 'role_note' => $positions->random()->name]
                    );

                    Attendance::updateOrCreate(
                        ['employee_id' => $employee->id, 'date' => $date->toDateString()],
                        [
                            'check_in' => $shift->start_time,
                            'check_out' => $shift->end_time,
                            'status' => 'present',
                            'branch_id' => $branchId,
                        ]
                    );
                }
            }

            // 7. Orders & Payments history (30 days)
            $tables = Table::all();
            for ($i = 0; $i < 100; $i++) {
                $orderDate = Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 12));
                $randomTable = $tables->random();

                $order = Order::create([
                    'branch_id' => $branchId,
                    'user_id' => $user->id,
                    'table_id' => $randomTable->id,
                    'status' => 'Completed',
                    'payment_method' => rand(0, 1) ? 'Cash' : 'QRIS',
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);

                $total = 0;
                $orderMenus = $menus->random(rand(1, min(4, $menus->count())));
                foreach ($orderMenus as $menu) {
                    $qty = rand(1, 3);
                    $subtotal = $menu->price * $qty;
                    OrderItem::create([
                        'order_id' => $order->id,
                        'menu_id' => $menu->id,
                        'qty' => $qty,
                        'price' => $menu->price,
                        'subtotal' => $subtotal,
                        'created_at' => $orderDate,
                        'updated_at' => $orderDate,
                    ]);
                    $total += $subtotal;
                }

                $order->update(['total_amount' => $total, 'subtotal' => $total]);

                Payment::create([
                    'branch_id' => $branchId,
                    'order_id' => $order->id,
                    'amount' => $total,
                    'gateway' => $order->payment_method,
                    'status' => 'success',
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);

                \App\Models\Transaction::create([
                    'branch_id' => $branchId,
                    'type' => 'income',
                    'amount' => $total,
                    'description' => 'POS Order #'.$order->id.' - '.$order->payment_method,
                    'date' => $orderDate->toDateString(),
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            }

            // 8. Finance Transactions (Income & Expenses)
            for ($i = 0; $i < 20; $i++) {
                $date = Carbon::now()->subDays(rand(0, 30));

                Income::create([
                    'category' => 'Catering Service',
                    'amount' => rand(500000, 2000000),
                    'description' => 'Catering order #'.($i + 100),
                    'date' => $date->toDateString(),
                    'user_id' => $user->id,
                    'branch_id' => $branchId,
                ]);

                Expense::create([
                    'category' => 'Utility',
                    'amount' => rand(100000, 500000),
                    'description' => 'Monthly utility bill '.($i + 1),
                    'date' => $date->toDateString(),
                    'user_id' => $user->id,
                    'branch_id' => $branchId,
                ]);
            }

            // 9. Reservations
            for ($i = 0; $i < 10; $i++) {
                $resDate = Carbon::today()->addDays(rand(-2, 7));
                Reservation::create([
                    'uuid' => Str::uuid(),
                    'reservation_number' => 'RES-'.strtoupper(Str::random(6)),
                    'branch_id' => $branchId,
                    'customer_name' => $faker->name,
                    'customer_phone' => $faker->phoneNumber,
                    'guest_count' => rand(2, 8),
                    'reservation_date' => $resDate->toDateString(),
                    'start_time' => '19:00:00',
                    'end_time' => '21:00:00',
                    'status' => $resDate->isPast() ? 'completed' : 'confirmed',
                    'payment_status' => 'paid',
                    'dp_amount' => 50000,
                    'created_by' => $user->id,
                    'room_id' => $vipRoom->id,
                ]);
            }
        });
    }
}
