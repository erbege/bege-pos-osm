<?php

namespace App\Services\HR;

use App\DTO\AttendanceSummaryDTO;
use App\Models\Attendance;
use App\Models\Employee;

class PerformanceScoreService
{
    /**
     * Calculate attendance-based KPI for an employee.
     *
     * @return array{attendance_rate: float, on_time_rate: float, total_hours: float, rating: float, recommended_bonus: float, grade: string}
     */
    public function calculateKPI(Employee $employee, int $month, int $year): array
    {
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        $summary = AttendanceSummaryDTO::fromAttendances($attendances);

        // Working days in month (approximate, excluding weekends)
        $daysInMonth = \Carbon\Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $workingDays = $this->getWorkingDays($year, $month);

        // Attendance rate = present / expected working days
        $attendanceRate = $workingDays > 0
            ? round(($summary->presentDays / $workingDays) * 100, 1) : 0;

        // On-time rate = on-time / present
        $onTimeRate = $summary->onTimeRate;

        // Rating (1-5 scale)
        $compositeScore = ($attendanceRate * 0.6) + ($onTimeRate * 0.4);
        $rating = round(min(5, max(1, ($compositeScore / 100) * 5)), 1);

        // Grade
        $grade = match (true) {
            $rating >= 4.5 => 'A',
            $rating >= 3.5 => 'B',
            $rating >= 2.5 => 'C',
            $rating >= 1.5 => 'D',
            default => 'E',
        };

        // Recommended bonus (based on grade and base salary)
        $bonusMultiplier = match ($grade) {
            'A' => 0.10,
            'B' => 0.05,
            'C' => 0.02,
            default => 0,
        };
        $recommendedBonus = round(((float) $employee->base_salary) * $bonusMultiplier, 2);

        return [
            'attendance_rate' => $attendanceRate,
            'on_time_rate' => $onTimeRate,
            'total_hours' => $summary->totalWorkHours,
            'present_days' => $summary->presentDays,
            'late_days' => $summary->lateDays,
            'absent_days' => $summary->absentDays,
            'working_days' => $workingDays,
            'late_minutes' => $summary->totalLateMinutes,
            'rating' => $rating,
            'grade' => $grade,
            'recommended_bonus' => $recommendedBonus,
        ];
    }

    /**
     * Calculate KPI trends for the last N months.
     */
    public function getTrend(Employee $employee, int $months = 6): array
    {
        $trend = [];
        $now = \Carbon\Carbon::now();

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);
            $kpi = $this->calculateKPI($employee, $date->month, $date->year);

            $trend[] = [
                'month' => $date->format('M Y'),
                'month_num' => $date->month,
                'year' => $date->year,
                'rating' => $kpi['rating'],
                'grade' => $kpi['grade'],
                'attendance_rate' => $kpi['attendance_rate'],
                'on_time_rate' => $kpi['on_time_rate'],
            ];
        }

        return $trend;
    }

    /**
     * Get approximate working days (Mon-Sat) in a month.
     */
    private function getWorkingDays(int $year, int $month): int
    {
        $start = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $days = 0;

        while ($start->lte($end)) {
            if ($start->dayOfWeek !== \Carbon\Carbon::SUNDAY) {
                $days++;
            }
            $start->addDay();
        }

        return $days;
    }
}
