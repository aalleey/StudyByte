import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, id, className = '', ...props },
  ref,
) {
  const selectId = id ?? props.name;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-slate-100 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
