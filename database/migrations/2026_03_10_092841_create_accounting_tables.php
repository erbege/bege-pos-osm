<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Chart of Accounts (COA)
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
            $table->foreignId('parent_id')->nullable()->constrained('accounts')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Journal Templates (for auto mapping)
        Schema::create('journal_templates', function (Blueprint $table) {
            $table->id();
            $table->string('event_name')->unique(); // e.g., POS_ORDER_PAID
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Journal Template Lines
        Schema::create('journal_template_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('journal_templates')->onDelete('cascade');
            $table->string('account_code'); // We'll link to account code
            $table->enum('entry_type', ['debit', 'credit']);
            $table->string('amount_source'); // e.g., total_paid, food_total, tax_total
            $table->timestamps();
        });

        // 4. Journals (Header)
        Schema::create('journals', function (Blueprint $table) {
            $table->id();
            $table->string('journal_no')->unique();
            $table->date('journal_date');
            $table->string('reference_type')->nullable(); // e.g., App\Models\Order
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches');
            $table->enum('status', ['draft', 'posted', 'void'])->default('posted');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            
            $table->index(['reference_type', 'reference_id']);
        });

        // 5. Journal Entries (Detail)
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_id')->constrained('journals')->onDelete('cascade');
            $table->foreignId('account_id')->constrained('accounts');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('description')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches');
            $table->timestamps();
        });

        // 6. Ledger (Denormalized for performance)
        Schema::create('ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->onDelete('cascade');
            $table->date('date');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0);
            $table->foreignId('branch_id')->nullable()->constrained('branches');
            $table->timestamps();
            
            $table->index(['account_id', 'date']);
            $table->index(['branch_id', 'date']);
        });

        // 7. Financial Periods
        Schema::create('financial_periods', function (Blueprint $table) {
            $table->id();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_periods');
        Schema::dropIfExists('ledgers');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('journals');
        Schema::dropIfExists('journal_template_lines');
        Schema::dropIfExists('journal_templates');
        Schema::dropIfExists('accounts');
    }
};
