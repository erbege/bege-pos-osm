<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Room;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class RoomController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'floor_plan_image' => 'nullable|image|max:5120', // max 5MB
        ]);

        if ($request->hasFile('floor_plan_image')) {
            $data['floor_plan_image'] = $request->file('floor_plan_image')->store('floor_plans', 'public');
        }

        $data['branch_id'] = Auth::user()->branch_id;
        Room::create($data);

        return back()->with('success', 'Room created successfully.');
    }

    public function update(Request $request, Room $room)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'floor_plan_image' => 'nullable|image|max:5120',
            'remove_floor_plan' => 'nullable|boolean',
        ]);

        // Handle image removal
        if ($request->boolean('remove_floor_plan') && $room->floor_plan_image) {
            Storage::disk('public')->delete($room->floor_plan_image);
            $data['floor_plan_image'] = null;
        }

        // Handle new image upload
        if ($request->hasFile('floor_plan_image')) {
            // Delete old image if exists
            if ($room->floor_plan_image) {
                Storage::disk('public')->delete($room->floor_plan_image);
            }
            $data['floor_plan_image'] = $request->file('floor_plan_image')->store('floor_plans', 'public');
        }

        unset($data['remove_floor_plan']);
        $room->update($data);

        return back()->with('success', 'Room updated successfully.');
    }

    public function destroy(Room $room)
    {
        if ($room->floor_plan_image) {
            Storage::disk('public')->delete($room->floor_plan_image);
        }
        $room->delete();
        return back()->with('success', 'Room deleted successfully.');
    }
}
