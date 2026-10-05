import { useToast } from '../../context/ToastContext';
import type { ToastVariant } from '../../context/ToastContext';

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-800 text-white',
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-xs flex-col gap-2" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm shadow-lg transition-colors ${variantClasses[toast.variant]}`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
