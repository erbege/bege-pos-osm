<?php

namespace App\Services\HR;

use App\Models\Attendance;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use App\Models\Shift;
use Carbon\Carbon;

class AttendanceService
{
    /**
     * Record check-in for an employee.
     */
    public function checkIn(Employee $employee, int $shiftId, ?array $gps = null, string $source = 'web'): Attendance
    {
        $branchId = $employee->branch_id;
        $settings = AttendanceSetting::where('branch_id', $branchId)->first();
        $shift = Shift::findOrFail($shiftId);

        // Prevent duplicate check-in
        $existing = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', today())
            ->first();

        if ($existing) {
            throw new \RuntimeException('Karyawan sudah check-in hari ini.');
        }

        // Validate geofence if GPS provided and settings exist
        if ($gps && $settings) {
            if (!$this->validateGeofence($gps['lat'] ?? null, $gps['lng'] ?? null, $settings)) {
                throw new \RuntimeException('Lokasi di luar jangkauan area kerja.');
            }
        }

        $checkInTime = now();
        $shiftStartTime = Carbon::createFromFormat('H:i:s', $shift->start_time);

        $lateMinutes = 0;
        $status = 'present';

        if ($checkInTime->format('H:i:s') > $shift->start_time) {
            $diff = $shiftStartTime->diffInMinutes($checkInTime, false);
            if ($diff > ($settings->grace_time_minutes ?? 0)) {
                $lateMinutes = $diff;
                $status = 'late';
            }
        }

        return Attendance::create([
            'employee_id' => $employee->id,
            'shift_id' => $shiftId,
            'branch_id' => $branchId,
            'date' => today(),
            'check_in' => $checkInTime->format('H:i:s'),
            'check_in_lat' => $gps['lat'] ?? null,
            'check_in_lng' => $gps['lng'] ?? null,
            'late_minutes' => $lateMinutes,
            'status' => $status,
            'source' => $source,
        ]);
    }

    /**
     * Record check-out for an employee.
     */
    public function checkOut(Employee $employee, ?array $gps = null): Attendance
    {
        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', today())
            ->whereNull('check_out')
            ->first();

        if (!$attendance) {
            throw new \RuntimeException('Tidak ditemukan check-in aktif.');
        }

        $checkOutTime = now();
        $checkInTime = Carbon::createFromFormat('H:i:s', $attendance->check_in);
        $workHours = round($checkInTime->diffInMinutes($checkOutTime) / 60, 2);

        // Subtract break duration if shift is set
        if ($attendance->shift) {
            $breakHours = ($attendance->shift->break_duration_minutes ?? 0) / 60;
            $workHours = max(0, $workHours - $breakHours);
        }

        $attendance->update([
            'check_out' => $checkOutTime->format('H:i:s'),
            'check_out_lat' => $gps['lat'] ?? null,
            'check_out_lng' => $gps['lng'] ?? null,
            'work_hours' => round($workHours, 2),
        ]);

        return $attendance->fresh();
    }

    /**
     * Mark an employee as absent for a specific date.
     */
    public function markAbsent(Employee $employee, string $absenceType, string $date, ?string $notes = null): Attendance
    {
        $branchId = $employee->branch_id;

        return Attendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date' => $date,
            ],
            [
                'branch_id' => $branchId,
                'is_absent' => true,
                'absence_type' => $absenceType,
                'status' => 'absent',
                'notes' => $notes,
                'source' => 'manual',
            ]
        );
    }

    /**
     * Validate GPS coordinates against geofence settings.
     */
    public function validateGeofence(?float $lat, ?float $lng, AttendanceSetting $settings): bool
    {
        if (!$lat || !$lng || !$settings->latitude || !$settings->longitude) {
            return true; // No geofence configured, allow
        }

        $distance = $this->haversineDistance(
            $lat,
            $lng,
            (float) $settings->latitude,
            (float) $settings->longitude
        );

        return $distance <= ($settings->radius_meters ?? 200);
    }

    /**
     * Get monthly report for an employee.
     */
    public function getMonthlyReport(int $employeeId, int $month, int $year): array
    {
        $attendances = Attendance::where('employee_id', $employeeId)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->with('shift')
            ->orderBy('date')
            ->get();

        $summary = \App\DTO\AttendanceSummaryDTO::fromAttendances($attendances);

        return [
            'attendances' => $attendances,
            'summary' => $summary->toArray(),
        ];
    }

    /**
     * Calculate haversine distance between two GPS points (in meters).
     */
    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
