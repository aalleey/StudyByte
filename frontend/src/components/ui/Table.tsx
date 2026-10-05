import { ReactNode } from 'react';

export interface TableColumn<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

export function Table<T>({ columns, rows, rowKey }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 align-middle text-slate-700 dark:text-slate-200 ${col.className ?? ''}`}>
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
