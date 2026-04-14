<?php

namespace App\Services\HR;

use App\DTO\AttendanceSummaryDTO;
use App\Models\Attendance;
use App\Models\AttendanceSetting;
use App\Models\CashAdvance;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\OvertimeRequest;
use App\Models\Payroll;
use App\Models\PayrollComponent;
use App\Models\PerformanceReview;
use Illuminate\Support\Facades\DB;

class PayrollEngineService
{
    /**
     * Generate payroll for an employee for a given period.
     *
     * @param Employee $employee
     * @param int $month
     * @param int $year
     * @param array $extras  [overtime, deduction, bonus, cash_advance_deduction, notes]
     * @return Payroll
     */
    public function generate(Employee $employee, int $month, int $year, array $extras = []): Payroll
    {
        // Prevent duplicate
        $existing = Payroll::where('employee_id', $employee->id)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        if ($existing) {
            throw new \RuntimeException('Payroll sudah dibuat untuk periode ini.');
        }

        $branchId = $employee->branch_id;
        $settings = AttendanceSetting::where('branch_id', $branchId)->first();

        // 1. Attendance summary
        $summary = $this->getAttendanceSummary($employee->id, $month, $year);

        // 2. Calculate base pay based on pay_type
        $payType = $employee->pay_type ?? 'salary_and_hourly';
        $baseSalaryAmount = (float) $employee->base_salary;
        $hourlyRate = (float) $employee->hourly_rate;
        $totalHours = $summary->totalWorkHours;

        $basePay = match ($payType) {
            'salary_and_hourly' => $baseSalaryAmount + ($totalHours * $hourlyRate),
            'salary_only' => $baseSalaryAmount,
            'hourly_only' => $totalHours * $hourlyRate,
            default => $baseSalaryAmount + ($totalHours * $hourlyRate),
        };

        // 3. Late penalty
        $latePenaltyTotal = $this->calculateLatePenalty($summary->totalLateMinutes, $settings);

        // 4. Overtime pay
        $overtimePay = (float) ($extras['overtime'] ?? 0);

        // 5. Performance bonus
        $bonusPerformance = 0;
        $review = PerformanceReview::where('employee_id', $employee->id)
            ->where('month', $month)
            ->where('year', $year)
            ->first();
        if ($review) {
            $bonusPerformance = (float) $review->bonus_amount;
        }

        // 6. Allowances
        $allowanceTotal = $this->calculateAllowances($employee, $summary);

        // 7. Manual bonus
        $manualBonus = (float) ($extras['bonus'] ?? 0);
        $bonusTotal = $manualBonus + $bonusPerformance;

        // 8. Cash advance deduction (auto-calculated, but editable)
        $cashAdvanceDeduction = (float) ($extras['cash_advance_deduction']
            ?? $this->getCashAdvanceDeduction($employee));

        // 9. Manual deduction
        $manualDeduction = (float) ($extras['deduction'] ?? 0);

        // 10. Net calculation
        $grossPay = $basePay + $overtimePay + $allowanceTotal + $bonusTotal;
        $totalDeduction = $latePenaltyTotal + $cashAdvanceDeduction + $manualDeduction;
        $netSalary = $grossPay - $totalDeduction;

        // Period dates
        $periodStart = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $periodEnd = $periodStart->copy()->endOfMonth();

        return DB::transaction(function () use ($employee, $month, $year, $payType, $baseSalaryAmount, $hourlyRate, $totalHours, $basePay, $overtimePay, $latePenaltyTotal, $bonusPerformance, $allowanceTotal, $bonusTotal, $cashAdvanceDeduction, $manualDeduction, $netSalary, $periodStart, $periodEnd, $extras, $summary, $manualBonus) {
            $payroll = Payroll::create([
                'employee_id' => $employee->id,
                'month' => $month,
                'year' => $year,
                'pay_type' => $payType,
                'base_salary_amount' => $baseSalaryAmount,
                'hourly_rate' => $hourlyRate,
                'total_hours' => $totalHours,
                'base_salary' => $basePay,
                'overtime' => $overtimePay,
                'bonus_performance' => $bonusPerformance,
                'allowance_total' => $allowanceTotal,
                'bonus_total' => $bonusTotal,
                'late_penalty_total' => $latePenaltyTotal,
                'cash_advance_deduction' => $cashAdvanceDeduction,
                'deduction' => $manualDeduction,
                'net_salary' => $netSalary,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'status' => 'draft',
                'notes' => $extras['notes'] ?? null,
            ]);

            // Create line items for audit trail
            $this->createComponents($payroll, $employee, $summary, [
                'base_pay' => $basePay,
                'overtime' => $overtimePay,
                'allowance_total' => $allowanceTotal,
                'bonus_performance' => $bonusPerformance,
                'manual_bonus' => $manualBonus,
                'late_penalty' => $latePenaltyTotal,
                'cash_advance' => $cashAdvanceDeduction,
                'manual_deduction' => $manualDeduction,
            ]);

            // Update cash advance repaid amount (if auto-deduction > 0)
            if ($cashAdvanceDeduction > 0) {
                $this->applyCashAdvanceRepayment($employee, $cashAdvanceDeduction);
            }

            return $payroll;
        });
    }

    /**
     * Preview payroll calculation without saving.
     */
    public function preview(Employee $employee, int $month, int $year, array $extras = []): array
    {
        $branchId = $employee->branch_id;
        $settings = AttendanceSetting::where('branch_id', $branchId)->first();
        $summary = $this->getAttendanceSummary($employee->id, $month, $year);

        $payType = $employee->pay_type ?? 'salary_and_hourly';
        $baseSalaryAmount = (float) $employee->base_salary;
        $hourlyRate = (float) $employee->hourly_rate;
        $totalHours = $summary->totalWorkHours;

        $basePay = match ($payType) {
            'salary_and_hourly' => $baseSalaryAmount + ($totalHours * $hourlyRate),
            'salary_only' => $baseSalaryAmount,
            'hourly_only' => $totalHours * $hourlyRate,
            default => $baseSalaryAmount + ($totalHours * $hourlyRate),
        };

        $latePenaltyTotal = $this->calculateLatePenalty($summary->totalLateMinutes, $settings);
        $overtimePay = (float) ($extras['overtime'] ?? 0);

        $bonusPerformance = 0;
        $review = PerformanceReview::where('employee_id', $employee->id)
            ->where('month', $month)->where('year', $year)->first();
        if ($review) {
            $bonusPerformance = (float) $review->bonus_amount;
        }

        $allowanceTotal = $this->calculateAllowances($employee, $summary);
        $manualBonus = (float) ($extras['bonus'] ?? 0);
        $bonusTotal = $manualBonus + $bonusPerformance;
        $cashAdvanceDeduction = (float) ($extras['cash_advance_deduction']
            ?? $this->getCashAdvanceDeduction($employee));
        $manualDeduction = (float) ($extras['deduction'] ?? 0);

        $grossPay = $basePay + $overtimePay + $allowanceTotal + $bonusTotal;
        $totalDeduction = $latePenaltyTotal + $cashAdvanceDeduction + $manualDeduction;
        $netSalary = $grossPay - $totalDeduction;

        return [
            'employee' => $employee,
            'pay_type' => $payType,
            'pay_type_label' => $employee->pay_type_label,
            'base_salary_amount' => $baseSalaryAmount,
            'hourly_rate' => $hourlyRate,
            'total_hours' => $totalHours,
            'base_pay' => round($basePay, 2),
            'overtime' => $overtimePay,
            'bonus_performance' => $bonusPerformance,
            'allowance_total' => $allowanceTotal,
            'bonus_total' => $bonusTotal,
            'late_penalty_total' => $latePenaltyTotal,
            'cash_advance_deduction' => $cashAdvanceDeduction,
            'manual_deduction' => $manualDeduction,
            'gross_pay' => round($grossPay, 2),
            'total_deduction' => round($totalDeduction, 2),
            'net_salary' => round($netSalary, 2),
            'attendance_summary' => $summary->toArray(),
            'allowances' => $employee->allowances()->active()->get(),
            'outstanding_kasbon' => $employee->outstanding_cash_advance,
        ];
    }

    /**
     * Calculate late penalty total.
     */
    public function calculateLatePenalty(float $totalLateMinutes, ?AttendanceSetting $settings): float
    {
        if (!$settings)
            return 0;
        return round($totalLateMinutes * ($settings->late_penalty_per_minute ?? 0), 2);
    }

    /**
     * Calculate allowances based on type (fixed / per_day / per_attendance).
     */
    public function calculateAllowances(Employee $employee, AttendanceSummaryDTO $summary): float
    {
        $allowances = $employee->allowances()->active()->get();
        $total = 0;

        foreach ($allowances as $allowance) {
            $total += match ($allowance->type) {
                'fixed' => (float) $allowance->amount,
                'per_day' => (float) $allowance->amount * $summary->presentDays,
                'per_attendance' => (float) $allowance->amount * $summary->presentDays,
                default => (float) $allowance->amount,
            };
        }

        return round($total, 2);
    }

    /**
     * Get suggested cash advance deduction (total outstanding / remaining installments).
     */
    public function getCashAdvanceDeduction(Employee $employee): float
    {
        $outstanding = CashAdvance::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereColumn('repaid_amount', '<', 'amount')
            ->get();

        $totalDeduction = 0;

        foreach ($outstanding as $advance) {
            $remaining = (float) $advance->amount - (float) $advance->repaid_amount;
            // Default: deduct remaining in one installment or use installment_amount if set
            $installment = $advance->installment_amount ?? $remaining;
            $totalDeduction += min($installment, $remaining);
        }

        return round($totalDeduction, 2);
    }

    /**
     * Get attendance summary DTO.
     */
    public function getAttendanceSummary(int $employeeId, int $month, int $year): AttendanceSummaryDTO
    {
        $attendances = Attendance::where('employee_id', $employeeId)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        return AttendanceSummaryDTO::fromAttendances($attendances);
    }

    /**
     * Create payroll component line items for transparency.
     */
    private function createComponents(Payroll $payroll, Employee $employee, AttendanceSummaryDTO $summary, array $amounts): void
    {
        $components = [];

        // Earnings
        if ($amounts['base_pay'] > 0) {
            $label = match ($employee->pay_type) {
                'salary_only' => 'Gaji Pokok',
                'hourly_only' => "Upah Jam ({$summary->totalWorkHours} jam × Rp " . number_format($employee->hourly_rate) . ")",
                'salary_and_hourly' => "Gaji Pokok + Upah Jam ({$summary->totalWorkHours} jam)",
                default => 'Gaji Pokok',
            };
            $components[] = ['component_type' => 'earning', 'name' => $label, 'amount' => $amounts['base_pay']];
        }

        if ($amounts['overtime'] > 0) {
            $components[] = ['component_type' => 'earning', 'name' => 'Lembur', 'amount' => $amounts['overtime']];
        }

        if ($amounts['allowance_total'] > 0) {
            $components[] = ['component_type' => 'earning', 'name' => 'Tunjangan', 'amount' => $amounts['allowance_total']];
        }

        if ($amounts['bonus_performance'] > 0) {
            $components[] = ['component_type' => 'earning', 'name' => 'Bonus Kinerja', 'amount' => $amounts['bonus_performance']];
        }

        if ($amounts['manual_bonus'] > 0) {
            $components[] = ['component_type' => 'earning', 'name' => 'Bonus Manual', 'amount' => $amounts['manual_bonus']];
        }

        // Deductions
        if ($amounts['late_penalty'] > 0) {
            $components[] = ['component_type' => 'deduction', 'name' => "Denda Keterlambatan ({$summary->totalLateMinutes} menit)", 'amount' => $amounts['late_penalty']];
        }

        if ($amounts['cash_advance'] > 0) {
            $components[] = ['component_type' => 'deduction', 'name' => 'Cicilan Kasbon', 'amount' => $amounts['cash_advance']];
        }

        if ($amounts['manual_deduction'] > 0) {
            $components[] = ['component_type' => 'deduction', 'name' => 'Potongan Lain', 'amount' => $amounts['manual_deduction']];
        }

        foreach ($components as $comp) {
            PayrollComponent::create(array_merge($comp, ['payroll_id' => $payroll->id]));
        }
    }

    /**
     * Apply cash advance repayment when payroll is generated.
     */
    private function applyCashAdvanceRepayment(Employee $employee, float $totalDeduction): void
    {
        $advances = CashAdvance::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereColumn('repaid_amount', '<', 'amount')
            ->orderBy('created_at')
            ->get();

        $remaining = $totalDeduction;

        foreach ($advances as $advance) {
            if ($remaining <= 0)
                break;

            $debt = (float) $advance->amount - (float) $advance->repaid_amount;
            $payment = min($remaining, $debt);

            $advance->update([
                'repaid_amount' => (float) $advance->repaid_amount + $payment,
            ]);

            $remaining -= $payment;
        }
    }
}
