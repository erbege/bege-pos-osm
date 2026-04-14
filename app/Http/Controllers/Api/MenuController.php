<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => \App\Models\Menu::where('is_available', true)->with('category')->get()->map(function ($menu) {
                if ($menu->image) {
                    $menu->image_url = asset('storage/' . $menu->image);
                }
                return $menu;
            })
        ]);
    }

    public function categories()
    {
        return response()->json([
            'data' => \App\Models\Category::all()
        ]);
    }

    public function show($id)
    {
        $menu = \App\Models\Menu::where('is_available', true)->with('category')->findOrFail($id);
        return response()->json([
            'data' => $menu
        ]);
    }
}
