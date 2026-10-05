export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500 dark:text-slate-400">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
