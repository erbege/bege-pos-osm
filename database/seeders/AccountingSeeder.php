<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;
use App\Models\JournalTemplate;
use App\Models\JournalTemplateLine;

class AccountingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Chart of Accounts
        $coa = [
            // ASSETS
            ['code' => '1000', 'name' => 'Cash', 'type' => 'asset'],
            ['code' => '1100', 'name' => 'Bank', 'type' => 'asset'],
            ['code' => '1200', 'name' => 'Accounts Receivable', 'type' => 'asset'],
            ['code' => '1300', 'name' => 'Inventory', 'type' => 'asset'],
            
            // LIABILITIES
            ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'liability'],
            ['code' => '2100', 'name' => 'Tax Payable', 'type' => 'liability'],
            ['code' => '2200', 'name' => 'Unearned Revenue', 'type' => 'liability'], // DP
            ['code' => '2300', 'name' => 'Payroll Payable', 'type' => 'liability'],
            
            // EQUITY
            ['code' => '3000', 'name' => 'Owner Capital', 'type' => 'equity'],
            ['code' => '3100', 'name' => 'Retained Earnings', 'type' => 'equity'],
            
            // REVENUE
            ['code' => '4000', 'name' => 'Food Sales', 'type' => 'revenue'],
            ['code' => '4100', 'name' => 'Beverage Sales', 'type' => 'revenue'],
            ['code' => '4200', 'name' => 'Other Income', 'type' => 'revenue'],
            ['code' => '4300', 'name' => 'Service Charge Revenue', 'type' => 'revenue'],
            
            // EXPENSE
            ['code' => '5000', 'name' => 'COGS Food', 'type' => 'expense'],
            ['code' => '5100', 'name' => 'COGS Beverage', 'type' => 'expense'],
            ['code' => '5200', 'name' => 'Salary Expense', 'type' => 'expense'],
            ['code' => '5300', 'name' => 'Rent Expense', 'type' => 'expense'],
            ['code' => '5400', 'name' => 'Utilities Expense', 'type' => 'expense'],
            ['code' => '5500', 'name' => 'Marketing Expense', 'type' => 'expense'],
            ['code' => '5900', 'name' => 'Inventory Gain/Loss', 'type' => 'expense'],
        ];

        foreach ($coa as $item) {
            Account::updateOrCreate(['code' => $item['code']], $item);
        }

        // 2. Journal Templates
        
        // POS_ORDER_PAID
        $template = JournalTemplate::updateOrCreate(
            ['event_name' => 'POS_ORDER_PAID'],
            ['description' => 'Automatic journal for paid POS orders']
        );
        
        $template->lines()->delete();
        $template->lines()->createMany([
            ['account_code' => '1000', 'entry_type' => 'debit', 'amount_source' => 'total_paid'],
            ['account_code' => '4000', 'entry_type' => 'credit', 'amount_source' => 'food_total'],
            ['account_code' => '4100', 'entry_type' => 'credit', 'amount_source' => 'beverage_total'],
            ['account_code' => '2100', 'entry_type' => 'credit', 'amount_source' => 'tax_total'],
            ['account_code' => '4300', 'entry_type' => 'credit', 'amount_source' => 'service_charge_total'],
        ]);

        // PURCHASE_RECEIVED
        $template = JournalTemplate::updateOrCreate(
            ['event_name' => 'PURCHASE_RECEIVED'],
            ['description' => 'Automatic journal for received purchase orders']
        );
        $template->lines()->delete();
        $template->lines()->createMany([
            ['account_code' => '1300', 'entry_type' => 'debit', 'amount_source' => 'total_amount'],
            ['account_code' => '2000', 'entry_type' => 'credit', 'amount_source' => 'total_amount'],
        ]);

        // PAYROLL_APPROVED (Accrual)
        $template = JournalTemplate::updateOrCreate(
            ['event_name' => 'PAYROLL_APPROVED'],
            ['description' => 'Automatic journal for approved payroll (Accrual)']
        );
        $template->lines()->delete();
        $template->lines()->createMany([
            ['account_code' => '5200', 'entry_type' => 'debit', 'amount_source' => 'total_payroll'],
            ['account_code' => '2300', 'entry_type' => 'credit', 'amount_source' => 'total_payroll'],
        ]);

        // PAYROLL_PAID (Cash out)
        $template = JournalTemplate::updateOrCreate(
            ['event_name' => 'PAYROLL_PAID'],
            ['description' => 'Automatic journal for paid payroll (Cash out)']
        );
        $template->lines()->delete();
        $template->lines()->createMany([
            ['account_code' => '2300', 'entry_type' => 'debit', 'amount_source' => 'total_payroll'],
            ['account_code' => '1100', 'entry_type' => 'credit', 'amount_source' => 'total_payroll'], // Bank
        ]);
        
        // STOCK_ADJUSTMENT
        $template = JournalTemplate::updateOrCreate(
            ['event_name' => 'STOCK_ADJUSTMENT'],
            ['description' => 'Automatic journal for stock adjustment (opname)']
        );
        $template->lines()->delete();
        $template->lines()->createMany([
            ['account_code' => '5900', 'entry_type' => 'debit', 'amount_source' => 'variance_amount'], // Could be gain or loss, logic needed in engine
            ['account_code' => '1300', 'entry_type' => 'credit', 'amount_source' => 'variance_amount'],
        ]);

        // INVENTORY_CONSUMED (COGS)
        $template = JournalTemplate::updateOrCreate(
            ['event_name' => 'INVENTORY_CONSUMED'],
            ['description' => 'Automatic journal for inventory consumption (COGS)']
        );
        $template->lines()->delete();
        $template->lines()->createMany([
            ['account_code' => '5000', 'entry_type' => 'debit', 'amount_source' => 'cogs_amount'],
            ['account_code' => '1300', 'entry_type' => 'credit', 'amount_source' => 'cogs_amount'],
        ]);

        // MANUAL_INCOME
        $template = JournalTemplate::updateOrCreate(
            ['event_name' => 'MANUAL_INCOME'],
            ['description' => 'Automatic journal for manual income entry']
        );
        $template->lines()->delete();
        $template->lines()->createMany([
            ['account_code' => '1000', 'entry_type' => 'debit', 'amount_source' => 'amount'],
            ['account_code' => '4200', 'entry_type' => 'credit', 'amount_source' => 'amount'], // Other Income
        ]);

        // MANUAL_EXPENSE
        $template = JournalTemplate::updateOrCreate(
            ['event_name' => 'MANUAL_EXPENSE'],
            ['description' => 'Automatic journal for manual expense entry']
        );
        $template->lines()->delete();
        $template->lines()->createMany([
            ['account_code' => '5400', 'entry_type' => 'debit', 'amount_source' => 'amount'], // Utilities or Misc
            ['account_code' => '1000', 'entry_type' => 'credit', 'amount_source' => 'amount'],
        ]);
    }
}
