<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$app_name = request()->segment(1) ?? '';

// Authentication routes
require __DIR__ . '/auth.php';

// General routes
require __DIR__ . '/general.php';

// Ticketing routes
require __DIR__ . '/ticketing.php';

// Project management routes
require __DIR__ . '/project.php';

// Task management routes
require __DIR__ . '/task.php';
Route::get("/demo", [DemoController::class, 'index'])->name('demo');
// In routes/api.php

Route::fallback(function () {
    // For Inertia requests, just redirect back to the same URL
    return redirect()->to(request()->fullUrl());
})->name('404');
