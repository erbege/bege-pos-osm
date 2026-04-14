<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    /**
     * Show the settings page with grouped settings.
     */
    public function index()
    {
        $settings = Setting::all()->groupBy('group')->map(function ($group) {
            return $group->mapWithKeys(function ($setting) {
                return [
                    $setting->key => [
                        'value' => $setting->is_secret ? $this->maskValue($setting->value) : $setting->value,
                        'raw' => $setting->value,
                        'is_secret' => $setting->is_secret,
                    ]
                ];
            });
        });

        // Add Attendance Settings for the current active branch
        $branchId = session('active_branch_id');
        $attSettings = \App\Models\AttendanceSetting::where('branch_id', $branchId)->first();
        
        // Add Attendance Settings for the current active branch
        $branchId = session('active_branch_id');
        $attSettings = \App\Models\AttendanceSetting::where('branch_id', $branchId)->first();
        
        $settings->put('attendance', [
            'radius_meters' => ['value' => $attSettings->radius_meters ?? 100, 'is_secret' => false],
            'grace_time_minutes' => ['value' => $attSettings->grace_time_minutes ?? 0, 'is_secret' => false],
            'latitude' => ['value' => $attSettings->latitude ?? '', 'is_secret' => false],
            'longitude' => ['value' => $attSettings->longitude ?? '', 'is_secret' => false],
        ]);

        return Inertia::render('Admin/Settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * Save all settings from the form.
     */
    public function update(Request $request)
    {
        $groups = $request->input('settings', []);

        foreach ($groups as $group => $fields) {
            if ($group === 'attendance') {
                $branchId = session('active_branch_id');
                \App\Models\AttendanceSetting::updateOrCreate(
                    ['branch_id' => $branchId],
                    [
                        'radius_meters' => $fields['radius_meters']['value'] ?? 100,
                        'grace_time_minutes' => $fields['grace_time_minutes']['value'] ?? 0,
                        'latitude' => $fields['latitude']['value'] ?? null,
                        'longitude' => $fields['longitude']['value'] ?? null,
                    ]
                );
                continue;
            }

            foreach ($fields as $key => $fieldData) {
                $value = $fieldData['value'] ?? '';
                $isSecret = $fieldData['is_secret'] ?? false;

                // Skip masked values (user didn't change the secret)
                if ($isSecret && $this->isMasked($value)) {
                    continue;
                }

                Setting::setValue($group, $key, $value, $isSecret);
            }
        }

        return redirect()->back()->with('success', 'Settings saved successfully.');
    }

    private function maskValue(?string $value): string
    {
        if (!$value || strlen($value) <= 4) {
            return '••••••••';
        }
        return '••••••••' . substr($value, -4);
    }

    private function isMasked(string $value): bool
    {
        return str_starts_with($value, '••••');
    }
}
