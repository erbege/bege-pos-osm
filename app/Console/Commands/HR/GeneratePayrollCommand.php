<?php

namespace App\Console\Commands\HR;

use App\Models\Attendance;
use App\Models\CashAdvance;
use App\Models\Employee;
use App\Models\Payroll;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GeneratePayrollCommand extends Command
{
    protected $signature = 'hr:generate-payroll {--month= : Month (1-12)} {--year= : Year (e.g. 2026)}';

    protected $description = 'Auto-generate payroll for all employees for a given period';

    public function handle(): int
    {
        $month = (int) ($this->option('month') ?? Carbon::now()->format('n'));
        $year = (int) ($this->option('year') ?? Carbon::now()->format('Y'));

        $this->info("Generating payroll for period: {$month}/{$year}...");

        $employees = Employee::all();
        $generatedCount = 0;
        $skippedCount = 0;

        try {
            DB::transaction(function () use ($employees, $month, $year, &$generatedCount, &$skippedCount) {
                foreach ($employees as $employee) {
                    // Skip if payroll already exists for this employee + period
                    $exists = Payroll::where('employee_id', $employee->id)
                        ->where('month', $month)
                        ->where('year', $year)
                        ->exists();

                    if ($exists) {
                        $skippedCount++;
                        continue;
                    }

                    // Count attendance days (status = present or late counts as worked)
                    $totalPresent = Attendance::where('employee_id', $employee->id)
                        ->whereMonth('date', $month)
                        ->whereYear('date', $year)
                        ->whereIn('status', ['present', 'late'])
                        ->count();

                    // Calculate deductions from unpaid cash advances
                    $cashAdvanceDeduction = CashAdvance::where('employee_id', $employee->id)
                        ->where('status', 'approved')
                        ->sum('amount');

                    $baseSalary = $employee->base_salary;
                    $overtime = 0; // Can be enhanced later with overtime tracking
                    $deduction = $cashAdvanceDeduction;
                    $netSalary = max(0, $baseSalary + $overtime - $deduction);

                    Payroll::create([
                        'employee_id' => $employee->id,
                        'month' => $month,
                        'year' => $year,
                        'base_salary' => $baseSalary,
                        'overtime' => $overtime,
                        'deduction' => $deduction,
                        'net_salary' => $netSalary,
                        'status' => 'draft',
                    ]);

                    $generatedCount++;
                }
            });

            $message = "Payroll generated: {$generatedCount} created, {$skippedCount} skipped (already exist).";
            $this->info($message);
            Log::info("Payroll Auto-Generate [{$month}/{$year}]: {$message}");

        } catch (\Exception $e) {
            $this->error('Failed: ' . $e->getMessage());
            Log::error("Payroll Auto-Generate FAILED: " . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
