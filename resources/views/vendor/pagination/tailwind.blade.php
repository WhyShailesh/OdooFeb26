@if ($paginator->hasPages())
<nav role="navigation" class="flex items-center justify-between gap-2">
    <div class="flex gap-1">
        @if ($paginator->onFirstPage())
        <span class="px-3 py-1 rounded border border-slate-200 text-slate-400 cursor-not-allowed">Previous</span>
        @else
        <a href="{{ $paginator->previousPageUrl() }}" class="px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100">Previous</a>
        @endif
        @if ($paginator->hasMorePages())
        <a href="{{ $paginator->nextPageUrl() }}" class="px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100">Next</a>
        @else
        <span class="px-3 py-1 rounded border border-slate-200 text-slate-400 cursor-not-allowed">Next</span>
        @endif
    </div>
    <p class="text-sm text-slate-600">
        Showing {{ $paginator->firstItem() ?? 0 }} to {{ $paginator->lastItem() ?? 0 }} of {{ $paginator->total() }} results
    </p>
</nav>
@endif
