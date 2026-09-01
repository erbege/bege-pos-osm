<?php

namespace App\DTO;

class AttendanceSummaryDTO
{
    public function __construct(
        public int $totalDays = 0,
        public int $presentDays = 0,
        public int $lateDays = 0,
        public int $absentDays = 0,
        public int $sickDays = 0,
        public int $leaveDays = 0,
        public int $permitDays = 0,
        public float $totalWorkHours = 0,
        public float $totalLateMinutes = 0,
        public float $totalOvertimeMinutes = 0,
        public float $onTimeRate = 0,
    ) {
    }

    public static function fromAttendances(\Illuminate\Support\Collection $attendances): self
    {
        $total = $attendances->count();
        $present = $attendances->where('is_absent', false)->count();
        $late = $attendances->where('status', 'late')->where('is_absent', false)->count();
        $absent = $attendances->where('is_absent', true)->count();
        $sick = $attendances->where('absence_type', 'sick')->count();
        $leave = $attendances->where('absence_type', 'leave')->count();
        $permit = $attendances->where('absence_type', 'permit')->count();
        $hours = $attendances->sum('work_hours');
        $lateMins = $attendances->sum('late_minutes');
        $onTimeRate = $present > 0 ? round((($present - $late) / $present) * 100, 1) : 0;

        return new self(
            totalDays: $total,
            presentDays: $present,
            lateDays: $late,
            absentDays: $absent,
            sickDays: $sick,
            leaveDays: $leave,
            permitDays: $permit,
            totalWorkHours: round($hours, 2),
            totalLateMinutes: $lateMins,
            onTimeRate: $onTimeRate,
        );
    }

    public function toArray(): array
    {
        return [
            'total_days' => $this->totalDays,
            'present_days' => $this->presentDays,
            'late_days' => $this->lateDays,
            'absent_days' => $this->absentDays,
            'sick_days' => $this->sickDays,
            'leave_days' => $this->leaveDays,
            'permit_days' => $this->permitDays,
            'total_work_hours' => $this->totalWorkHours,
            'total_late_minutes' => $this->totalLateMinutes,
            'total_overtime_minutes' => $this->totalOvertimeMinutes,
            'on_time_rate' => $this->onTimeRate,
        ];
    }
}
