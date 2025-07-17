<?php

use App\Http\Controllers\TicketingController;
use Illuminate\Support\Facades\Route;





//Ticket Routes
Route::get('/tickets', [TicketingController::class, 'showTicketForm'])->name('tickets');
Route::post('/add-ticket', [TicketingController::class, 'saveTicket']);

Route::get('/tickets/{hash}', [TicketingController::class, 'show'])->name('tickets.show');
Route::put('/tickets/update-status/{hash}', [TicketingController::class, 'updateStatus'])->name('tickets.updateStatus');
Route::get('/tickets-table', [TicketingController::class, 'showTable'])->name('tickets-table');
