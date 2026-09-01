<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Menu;
use App\Models\Category;
use App\Models\Table;
use App\Models\Order;
use App\Models\OrderItem;

class POSCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_checkout_an_order()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $category = Category::create(['name' => 'Food']);
        $menu1 = Menu::create(['name' => 'Burger', 'price' => 50000, 'category_id' => $category->id, 'is_available' => true]);
        $menu2 = Menu::create(['name' => 'Fries', 'price' => 20000, 'category_id' => $category->id, 'is_available' => true]);

        $table = Table::create(['name' => 'Table 1', 'capacity' => 2, 'status' => 'available']);

        $response = $this->post(route('pos.checkout'), [
            'items' => [
                ['id' => $menu1->id, 'qty' => 2], // 100,000
                ['id' => $menu2->id, 'qty' => 1], // 20,000
            ],
            'table_id' => $table->id,
            'payment_method' => 'Cash',
        ]);

        $response->assertRedirect(route('pos.index'));
        $response->assertSessionHas('success');

        // Assert Order
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'table_id' => $table->id,
            'total_amount' => 120000,
            'status' => 'Paid',
        ]);

        $order = Order::first();

        // Assert Payment was created
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'amount' => 120000,
            'gateway' => 'Cash',
            'status' => 'success',
        ]);

        // Assert Order Items
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'menu_id' => $menu1->id,
            'qty' => 2,
            'price' => 50000,
            'subtotal' => 100000,
        ]);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'menu_id' => $menu2->id,
            'qty' => 1,
            'price' => 20000,
            'subtotal' => 20000,
        ]);

        // Assert Table status was updated
        $this->assertDatabaseHas('tables', [
            'id' => $table->id,
            'status' => 'occupied',
        ]);
    }

    public function test_user_can_checkout_with_qris()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $category = Category::create(['name' => 'Food']);
        $menu = Menu::create(['name' => 'Burger', 'price' => 50000, 'category_id' => $category->id, 'is_available' => true]);
        $table = Table::create(['name' => 'Table 1', 'capacity' => 2, 'status' => 'available']);

        $response = $this->postJson(route('pos.checkout'), [
            'items' => [
                ['id' => $menu->id, 'qty' => 1]
            ],
            'table_id' => $table->id,
            'payment_method' => 'QRIS',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'qr_url']);

        // Order is still pending because QRIS is async
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'status' => 'Pending Payment',
            'total_amount' => 50000
        ]);

        $order = Order::latest()->first();

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'gateway' => 'QRIS',
            'status' => 'pending'
        ]);
    }

    public function test_checkout_fails_with_invalid_data()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('pos.checkout'), [
            'items' => [], // Empty cart
            'payment_method' => 'Cash',
        ]);

        $response->assertSessionHasErrors(['items']);
    }
}
