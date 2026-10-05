import { ReactNode } from 'react';

type Variant = 'success' | 'neutral' | 'warning' | 'danger' | 'info';

const variantClasses: Record<Variant, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  info: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
};

export function Badge({ variant = 'neutral', children }: { variant?: Variant; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
