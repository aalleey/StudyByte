import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={errorId ?? hintId}
        className={`rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-slate-100 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        } ${className}`}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
