<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Table as DiningTable;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TableController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();
        $rooms = Room::with([
            'tables.reservations' => function ($q) use ($today) {
                $q->where('reservation_date', $today)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->orderBy('start_time');
            }
        ])->get();
        return Inertia::render('Admin/Tables', ['rooms' => $rooms]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'name' => 'required|string|max:100',
            'capacity' => 'required|integer|min:1',
            'shape' => 'nullable|in:square,circle,ellipse,rectangle',
            'orientation' => 'nullable|integer|min:0|max:360',
            'width' => 'nullable|integer|min:30|max:300',
            'height' => 'nullable|integer|min:30|max:300',
        ]);

        $data['shape'] = $data['shape'] ?? 'rectangle';
        $data['orientation'] = $data['orientation'] ?? 0;

        DiningTable::create($data);
        return redirect()->back()->with('success', 'Table added.');
    }

    public function update(Request $request, DiningTable $table)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'capacity' => 'required|integer|min:1',
            'status' => 'required|in:available,occupied',
            'shape' => 'nullable|in:square,circle,ellipse,rectangle',
            'orientation' => 'nullable|integer|min:0|max:360',
            'width' => 'nullable|integer|min:30|max:300',
            'height' => 'nullable|integer|min:30|max:300',
        ]);

        $oldStatus = $table->status;
        $table->update($data);

        if ($oldStatus !== $table->status) {
            event(new \App\Events\TableStatusUpdated($table));
        }

        return redirect()->back()->with('success', 'Table updated.');
    }

    /**
     * Bulk update positions from drag-and-drop layout
     */
    public function updatePositions(Request $request)
    {
        $items = $request->validate([
            'positions' => 'required|array',
            'positions.*.id' => 'required|exists:tables,id',
            'positions.*.pos_x' => 'required|integer|min:0',
            'positions.*.pos_y' => 'required|integer|min:0',
            'positions.*.width' => 'nullable|integer|min:30|max:300',
            'positions.*.height' => 'nullable|integer|min:30|max:300',
        ]);

        foreach ($items['positions'] as $pos) {
            $updateData = [
                'pos_x' => $pos['pos_x'],
                'pos_y' => $pos['pos_y'],
            ];
            if (isset($pos['width']))
                $updateData['width'] = $pos['width'];
            if (isset($pos['height']))
                $updateData['height'] = $pos['height'];
            DiningTable::where('id', $pos['id'])->update($updateData);
        }

        return redirect()->back()->with('success', 'Layout saved.');
    }

    /**
     * Release a table — set status back to available
     */
    public function release(DiningTable $table)
    {
        $table->update(['status' => 'available']);
        
        // Broadcast for real-time update
        event(new \App\Events\TableStatusUpdated($table));

        return redirect()->back()->with('success', "Table \"{$table->name}\" released.");
    }

    public function destroy(DiningTable $table)
    {
        $table->delete();
        return redirect()->back()->with('success', 'Table deleted.');
    }
}
