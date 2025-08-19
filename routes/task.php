<?php

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix($app_name)->group(function () {
    Route::get('/tasks/dashboard', [TaskController::class, 'dailyTasks'])->name('tasks.dashboard');
    Route::get('/tasks/create', [TaskController::class, 'showTaskForm'])->name('tasks.create');
    Route::post('/tasks', [TaskController::class, 'createTask'])->name('tasks.store');
    Route::put('/tasks/{taskId}', [TaskController::class, 'updateTask'])->name('tasks.update');
    Route::get('/tasks/{taskId}', [TaskController::class, 'show'])->name('tasks.show');
    Route::get('/tasks/reports/weekly', [TaskController::class, 'weeklyReport'])->name('tasks.weekly');
    Route::delete('/tasks/{taskId}', [TaskController::class, 'deleteTask'])->name('tasks.delete');
});
