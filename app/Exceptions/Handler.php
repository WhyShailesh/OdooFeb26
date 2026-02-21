<?php

namespace App\Exceptions;

use App\Exceptions\DriverAvailabilityException;
use App\Exceptions\TripDispatchException;
use App\Exceptions\VehicleStatusException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Map domain exceptions to HTTP responses with safe messages (SYSTEM_SPEC §5.3).
     */
    public function render($request, Throwable $e): ?Response
    {
        if ($e instanceof TripDispatchException || $e instanceof VehicleStatusException || $e instanceof DriverAvailabilityException) {
            $message = $e->getMessage();
            $code = $e instanceof TripDispatchException ? 422 : 403;

            if ($request->expectsJson()) {
                return response()->json(['message' => $message], $code);
            }

            return redirect()->back()->with('error', $message)->setStatusCode($code);
        }

        return parent::render($request, $e);
    }
}
