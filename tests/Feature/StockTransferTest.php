<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Material;
use App\Models\User;
use App\Models\StockTransfer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StockTransferTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    protected $admin;
    protected $branchA;
    protected $branchB;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'Admin']);
        Role::create(['name' => 'owner']);

        $this->branchA = Branch::create(['name' => 'Branch A']);
        $this->branchB = Branch::create(['name' => 'Branch B']);

        $this->admin = User::factory()->create(['branch_id' => $this->branchA->id]);
        $this->admin->assignRole('Admin');
    }

    /** @test */
    public function it_can_process_full_transfer_workflow()
    {
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
        $this->withoutExceptionHandling();
        // 1. Setup Material in Branch A
        $materialA = Material::create([
            'branch_id' => $this->branchA->id,
            'name' => 'Coffee Beans',
            'type' => 'raw_material',
            'stock' => 100,
            'unit' => 'kg',
            'avg_cost' => 50000,
            'track_inventory' => true
        ]);

        // 2. Initiate Transfer (Branch A -> Branch B)
        $response = $this->actingAs($this->admin)
            ->post(route('admin.stock-transfers.store'), [
                'type' => 'transfer',
                'target_branch_id' => $this->branchB->id,
                'material_id' => $materialA->id,
                'quantity' => 20,
                'notes' => 'Sending beans to B'
            ]);

        $response->assertRedirect();
        $transfer = StockTransfer::first();
        $this->assertEquals('pending', $transfer->status);
        $this->assertEquals(100, $materialA->fresh()->stock); // Stock not moved yet

        // 3. Approve (Reserves Stock)
        $this->actingAs($this->admin)
            ->patch(route('admin.stock-transfers.update', $transfer->id), ['action' => 'approve']);
        
        $transfer->refresh();
        $this->assertEquals('approved', $transfer->status);
        $this->assertEquals(100, $materialA->fresh()->stock);
        $this->assertEquals(20, $materialA->fresh()->qty_reserved);

        // 4. Ship (Deducts Stock from A)
        $this->actingAs($this->admin)
            ->patch(route('admin.stock-transfers.update', $transfer->id), ['action' => 'ship']);
        
        $transfer->refresh();
        $this->assertEquals('shipped', $transfer->status);
        $this->assertEquals(80, $materialA->fresh()->stock);
        $this->assertEquals(0, $materialA->fresh()->qty_reserved);

        // 5. Receive (Adds Stock to B)
        // Login as someone from Branch B to simulate destination receipt
        $userB = User::factory()->create(['branch_id' => $this->branchB->id]);
        $userB->assignRole('Admin');

        $this->actingAs($userB)
            ->patch(route('admin.stock-transfers.update', $transfer->id), ['action' => 'receive']);
        
        $transfer->refresh();
        $this->assertEquals('completed', $transfer->status);
        
        // Find material in Branch B
        $materialB = Material::withoutGlobalScopes()
            ->where('branch_id', $this->branchB->id)
            ->where('name', 'Coffee Beans')
            ->first();
        
        $this->assertNotNull($materialB);
        $this->assertEquals(20, $materialB->stock);
    }
}
