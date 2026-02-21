<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title><?php echo e(__('Dashboard')); ?> — <?php echo e(config('app.name')); ?></title>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/app.js']); ?>
    <style>body { font-family: ui-sans-serif, system-ui, sans-serif; }</style>
</head>
<body class="min-h-screen bg-gray-100">
    <?php $user = $user ?? auth()->user(); ?>
    <header class="bg-white shadow">
        <div class="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 class="text-xl font-semibold text-gray-800"><?php echo e($user?->role?->name?->label() ?? __('Dashboard')); ?></h1>
            <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600"><?php echo e($user?->name); ?></span>
                <form method="POST" action="<?php echo e(route('logout')); ?>" class="inline">
                    <?php echo csrf_field(); ?>
                    <button type="submit" class="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"><?php echo e(__('Log out')); ?></button>
                </form>
            </div>
        </div>
    </header>

    <main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <p class="mb-6 text-sm text-gray-600"><?php echo e(__('Manages fleet, vehicles, maintenance, fuel, and overall operations.')); ?></p>
        <div class="rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm space-y-4">
            
            <p class="text-gray-700"><span class="font-medium"><?php echo e(__('Active Fleet')); ?>:</span> —</p>
            <p class="text-gray-700"><span class="font-medium"><?php echo e(__('Maintenance Alerts')); ?>:</span> —</p>
            <p class="text-gray-700"><span class="font-medium"><?php echo e(__('Utilization Rate')); ?>:</span> —</p>
            <p class="text-gray-700"><span class="font-medium"><?php echo e(__('Pending Trips')); ?>:</span> —</p>
        </div>
    </main>
</body>
</html>
<?php /**PATH D:\XAMPP\htdocs\fleetflow\resources\views/dashboard/manager.blade.php ENDPATH**/ ?>