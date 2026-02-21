<?php

namespace App\Http\Middleware;

use App\Enums\RoleName;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return redirect()->route('login');
        }

        $roleNames = array_map(fn (string $r) => RoleName::tryFrom($r), $roles);
        $roleNames = array_filter($roleNames);

        $userRole = $request->user()->role?->name;

        if (!$userRole || !in_array($userRole, $roleNames, true)) {
            abort(403, 'Unauthorized for this action.');
        }

        return $next($request);
    }
}
