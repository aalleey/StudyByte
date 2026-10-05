import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = '', ...props },
  ref,
) {
  const textareaId = id ?? props.name;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={textareaId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={!!error}
        aria-describedby={errorId}
        rows={8}
        className={`rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-slate-100 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
