<?php

use App\Http\Controllers\TicketingController;
use Illuminate\Support\Facades\Route;





//Ticket Routes
Route::get('/tickets', [TicketingController::class, 'showTicketForm']);
Route::post('/add-ticket', [TicketingController::class, 'saveTicket']);

Route::get('/tickets/{hash}', [TicketingController::class, 'show']);
