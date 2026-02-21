<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Image;
use Inertia\Inertia;

class ImageController extends Controller
{
    public function index(Request $request)
    {
        // Return all images available to pick from the library
        $images = Image::latest()->get();
        
        if ($request->wantsJson()) {
            return response()->json($images);
        }

        return Inertia::render('Admin/Images/Index', [
            'images' => $images
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // 10MB limit
        ]);

        $path = $request->file('image')->store('library', 'public');
        $url = '/storage/' . $path;

        // Create a standalone image for the library if it is not immediately attached
        // or attach it to something using polymorphic relation
        $image = Image::create([
            'url' => $url,
            'imageable_id' => $request->imageable_id, // Can be null if it's just in the gallery
            'imageable_type' => $request->imageable_type,
        ]);

        return response()->json(['image' => $image], 201);
    }

    public function destroy(Image $image)
    {
        // Option to delete an image
        if (\Storage::disk('public')->exists(str_replace('/storage/', '', $image->url))) {
            \Storage::disk('public')->delete(str_replace('/storage/', '', $image->url));
        }
        $image->delete();
        return response()->json(['message' => 'Eliminado']);
    }
}
