<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
    <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5; margin: 2rem; }
        a { color: #2563eb; }
    </style>
</head>
<body>
    <h1>{{ config('app.name') }}</h1>
    <p><a href="{{ route('login') }}">Login</a> | <a href="{{ route('register') }}">Register</a></p>
</body>
</html>
