<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;
use Inertia\Inertia;

class BranchController extends Controller
{
    /**
     * Display a listing of the branches.
     */
    public function index()
    {
        return Inertia::render('Admin/Branches/Index', [
            'branches' => Branch::all()
        ]);
    }

    /**
     * Store a newly created branch in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        Branch::create($validated);

        return back()->with('success', 'Branch created successfully.');
    }

    /**
     * Update the specified branch in storage.
     */
    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $branch->update($validated);

        return back()->with('success', 'Branch updated successfully.');
    }

    /**
     * Remove the specified branch from storage.
     */
    public function destroy(Branch $branch)
    {
        // Simple safety check: don't delete the last branch
        if (Branch::count() <= 1) {
            return back()->with('error', 'Cannot delete the only remaining branch.');
        }

        $branch->delete();

        return back()->with('success', 'Branch deleted successfully.');
    }

    /**
     * Switch the active branch in the session for Admin/Owner.
     */
    public function switchBranch(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id'
        ]);

        // Guard against non-admins trying to switch branches
        if (!$request->user()->hasRole('owner') && !$request->user()->hasRole('admin')) {
            return back()->with('error', 'Unauthorized to switch branches.');
        }

        session(['active_branch_id' => $request->branch_id]);

        return back()->with('success', 'Switched to branch: ' . Branch::find($request->branch_id)->name);
    }
}
