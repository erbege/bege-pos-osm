<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\TableAvailabilityEngine;
use Carbon\Carbon;

class TableController extends Controller
{
    public function available(Request $request, TableAvailabilityEngine $engine)
    {
        $request->validate([
            'pax' => 'required|integer|min:1',
            'date' => 'required|string',
        ]);

        $date = Carbon::parse($request->date)->format('Y-m-d');
        $time = Carbon::parse($request->date)->format('H:i:s');
        
        $options = $engine->getSuggestedOptions($request->pax, $date, $time);

        $data = $options->map(function($opt) {
            return [
                'id' => $opt['type'] === 'single' ? $opt['tables'][0]->id : 'combo-' . $opt['name'],
                'name' => $opt['name'],
                'capacity' => $opt['total_capacity'],
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function updateLayout(Request $request)
    {
        $request->validate([
            'tables' => 'required|array',
            'tables.*.id' => 'required|exists:tables,id',
            'tables.*.pos_x' => 'required|numeric',
            'tables.*.pos_y' => 'required|numeric',
        ]);

        foreach ($request->tables as $tableData) {
            \App\Models\Table::where('id', $tableData['id'])->update([
                'pos_x' => $tableData['pos_x'],
                'pos_y' => $tableData['pos_y'],
            ]);
        }

        return response()->json(['message' => 'Layout updated successfully']);
    }
}
