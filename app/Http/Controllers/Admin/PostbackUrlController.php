<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PostbackUrl;
use Illuminate\Http\Request;

class PostbackUrlController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:255',
            'is_active' => 'boolean',
        ]);

        PostbackUrl::create($validated);

        return redirect()->back()->with('success', 'URL de Postback creada correctamente.');
    }

    public function update(Request $request, PostbackUrl $postbackUrl)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:255',
            'is_active' => 'boolean',
        ]);

        $postbackUrl->update($validated);

        return redirect()->back()->with('success', 'URL de Postback actualizada correctamente.');
    }

    public function destroy(PostbackUrl $postbackUrl)
    {
        $postbackUrl->delete();

        return redirect()->back()->with('success', 'URL de Postback eliminada correctamente.');
    }
}
