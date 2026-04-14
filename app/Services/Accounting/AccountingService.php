<?php

namespace App\Services\Accounting;

use App\Models\Account;
use App\Models\Journal;
use App\Models\JournalEntry;
use App\Models\Ledger;
use App\Models\JournalTemplate;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;

class AccountingService
{
    /**
     * Generate a journal entry based on an event and its data.
     * 
     * @param string $eventName
     * @param array $data
     * @param Model|null $reference
     * @param int|null $branchId
     * @return Journal
     */
    public function generateFromEvent(string $eventName, array $data, ?Model $reference = null, ?int $branchId = null): Journal
    {
        return DB::transaction(function () use ($eventName, $data, $reference, $branchId) {
            $template = JournalTemplate::where('event_name', $eventName)->where('is_active', true)->first();

            if (!$template) {
                throw new \Exception("Journal template not found for event: {$eventName}");
            }

            $journal = Journal::create([
                'journal_no' => $this->generateJournalNo(),
                'journal_date' => now(),
                'reference_type' => $reference ? get_class($reference) : null,
                'reference_id' => $reference ? $reference->id : null,
                'branch_id' => $branchId,
                'status' => 'posted',
                'created_by' => auth()->id(),
            ]);

            $totalDebit = 0;
            $totalCredit = 0;

            foreach ($template->lines as $line) {
                $amount = $data[$line->amount_source] ?? 0;
                
                if ($amount == 0) continue;

                $account = Account::where('code', $line->account_code)->first();
                if (!$account) {
                    throw new \Exception("Account not found with code: {$line->account_code}");
                }

                $debit = $line->entry_type === 'debit' ? $amount : 0;
                $credit = $line->entry_type === 'credit' ? $amount : 0;

                $totalDebit += $debit;
                $totalCredit += $credit;

                $entry = JournalEntry::create([
                    'journal_id' => $journal->id,
                    'account_id' => $account->id,
                    'debit' => $debit,
                    'credit' => $credit,
                    'description' => $data['description'] ?? "Auto generated from {$eventName}",
                    'branch_id' => $branchId,
                ]);

                $this->postToLedger($entry);
            }

            if (abs($totalDebit - $totalCredit) > 0.01) {
                throw new \Exception("Unbalanced journal for event {$eventName}: Debit ({$totalDebit}) != Credit ({$totalCredit})");
            }

            return $journal;
        });
    }

    /**
     * Post a journal entry to the ledger.
     * 
     * @param JournalEntry $entry
     */
    public function postToLedger(JournalEntry $entry): void
    {
        $lastLedger = Ledger::where('account_id', $entry->account_id)
            ->where('branch_id', $entry->branch_id)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $previousBalance = $lastLedger ? $lastLedger->balance : 0;
        
        $account = $entry->account;
        $currentBalance = $previousBalance;

        // Balance calculation based on account type
        // Assets/Expenses: Debit increases, Credit decreases
        // Liabilities/Equity/Revenue: Credit increases, Debit decreases
        if (in_array($account->type, ['asset', 'expense'])) {
            $currentBalance += $entry->debit - $entry->credit;
        } else {
            $currentBalance += $entry->credit - $entry->debit;
        }

        Ledger::create([
            'account_id' => $entry->account_id,
            'journal_entry_id' => $entry->id,
            'date' => $entry->journal->journal_date,
            'debit' => $entry->debit,
            'credit' => $entry->credit,
            'balance' => $currentBalance,
            'branch_id' => $entry->branch_id,
        ]);
    }

    /**
     * Generate a unique journal number.
     */
    private function generateJournalNo(): string
    {
        $date = now()->format('Ymd');
        $count = Journal::whereDate('created_at', now()->toDateString())->count() + 1;
        return "JRN-{$date}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
