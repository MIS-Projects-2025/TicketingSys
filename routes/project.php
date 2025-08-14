<?php

use App\Http\Controllers\ProjectManagementController;
use App\Http\Controllers\TicketingController;
use Illuminate\Support\Facades\Route;




Route::prefix($app_name)->group(function () {
    Route::get('/', [ProjectManagementController::class, 'index'])->name('dashboard');
    Route::get('/projectTracker', [ProjectManagementController::class, 'Manage'])->name('project.tracker');
});
