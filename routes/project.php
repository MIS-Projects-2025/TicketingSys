<?php

use App\Http\Controllers\ProjectListController;
use App\Http\Controllers\ProjectManagementController;
use App\Http\Controllers\TicketingController;
use Illuminate\Support\Facades\Route;

Route::prefix($app_name)->group(function () {
    Route::get('/', [ProjectManagementController::class, 'index'])->name('dashboard');
    Route::get('/projectTracker', [ProjectManagementController::class, 'Manage'])->name('project.tracker');

    // Project List Routes
    Route::get('/projectList', [ProjectListController::class, 'projectList'])->name('project.list');
    Route::post('/projectList', [ProjectListController::class, 'store'])->name('project.store');
    Route::delete('/projectList/{id}', [ProjectListController::class, 'destroy'])->name('project.destroy');
});
