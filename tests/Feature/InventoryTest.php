<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Material;
use App\Models\Recipe;
use App\Models\Menu;
use App\Models\Category;
use App\Models\User;
use App\Models\StockMovement;
use App\Models\ProductionOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    protected $user;
    protected $branch;
    protected $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

        // Create roles
        Role::create(['name' => 'Admin']);
        Role::create(['name' => 'owner']);

        $this->branch = Branch::create(['name' => 'Test Branch']);
        $this->category = Category::create(['name' => 'General', 'branch_id' => $this->branch->id]);
        
        $this->user = User::factory()->create([
            'branch_id' => $this->branch->id,
        ]);
        $this->user->assignRole('Admin');
    }

    /** @test */
    public function it_can_access_stock_dashboard()
    {
        $material = Material::create([
            'branch_id' => $this->branch->id,
            'name' => 'Raw Material 1',
            'type' => 'raw_material',
            'track_inventory' => true,
            'stock' => 10,
            'min_stock' => 5,
            'unit' => 'kg',
            'avg_cost' => 1000,
            'last_purchase_price' => 1000
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('admin.inventory.dashboard'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Inventory/StockDashboard')
                ->has('metrics')
                ->where('metrics.total_items', 1)
                ->where('metrics.low_stock', 0)
            );
    }

    /** @test */
    public function it_can_fetch_recipe_for_production()
    {
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
        $this->withoutExceptionHandling();
        $producedItem = Material::create([
            'branch_id' => $this->branch->id,
            'name' => 'Finished Good',
            'type' => 'finished',
            'track_inventory' => true,
            'stock' => 0,
            'min_stock' => 0,
            'unit' => 'pcs',
            'avg_cost' => 0
        ]);

        // In this system, RecipeEngineService looks up Menu by name or material ID sometimes
        // But the recipes table definitely needs menu_id
        $menu = Menu::create([
            'branch_id' => $this->branch->id,
            'category_id' => $this->category->id,
            'name' => 'Finished Good',
            'price' => 10000
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('admin.production.get-recipe', $producedItem->id));

        $response->assertStatus(200)
            ->assertJsonStructure(['recipe', 'max_possible']);
    }

    /** @test */
    public function it_can_record_production_and_deduct_ingredients()
    {
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
        $this->withoutExceptionHandling();
        // 1. Create Raw Material (Ingredient)
        $ingredient = Material::create([
            'branch_id' => $this->branch->id,
            'name' => 'Flour',
            'type' => 'raw_material',
            'track_inventory' => true,
            'stock' => 10, // 10kg
            'min_stock' => 1,
            'unit' => 'kg',
            'avg_cost' => 10000
        ]);

        // 2. Create Finished Good Material
        $finishedGood = Material::create([
            'branch_id' => $this->branch->id,
            'name' => 'Bread',
            'type' => 'finished',
            'track_inventory' => true,
            'stock' => 0,
            'min_stock' => 0,
            'unit' => 'pcs',
            'avg_cost' => 0
        ]);

        // 3. Create Menu (to satisfy foreign key in recipes table)
        $menu = Menu::create([
            'branch_id' => $this->branch->id,
            'category_id' => $this->category->id,
            'name' => 'Bread',
            'price' => 15000
        ]);

        // 4. Create Recipe (1 Bread needs 0.5kg Flour)
        Recipe::create([
            'menu_id' => $menu->id,
            'material_id' => $ingredient->id,
            'qty' => 0.5,
            'yield_qty' => 1
        ]);

        // 5. Record Production of 10 Bread
        $response = $this->actingAs($this->user)
            ->post(route('admin.production.store'), [
                'material_id' => $finishedGood->id,
                'qty' => 10,
                'notes' => 'Test production batch'
            ]);

        $response->assertRedirect();
        
        // 6. Verify Stocks
        // Bread: 0 + 10 = 10
        $this->assertEquals(10, $finishedGood->fresh()->stock);
        // Flour: 10 - (10 * 0.5) = 5
        $this->assertEquals(5, $ingredient->fresh()->stock);

        // 7. Verify Movements
        $this->assertDatabaseHas('stock_movements', [
            'material_id' => $finishedGood->id,
            'qty' => 10,
            'type' => 'in'
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'material_id' => $ingredient->id,
            'qty' => -5,
            'type' => 'out'
        ]);
    }
}
