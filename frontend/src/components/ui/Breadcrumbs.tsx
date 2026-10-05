import { Fragment } from 'react';
import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) => (
          <Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && <span aria-hidden="true">/</span>}
            <li>
              {item.to ? (
                <Link to={item.to} className="hover:text-brand-600 hover:underline dark:hover:text-brand-400">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
