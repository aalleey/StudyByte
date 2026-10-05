import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { useAdminDashboardStats } from '../../features/dashboard';

const STAT_LABELS: { key: keyof NonNullable<ReturnType<typeof useAdminDashboardStats>['data']>; label: string }[] = [
  { key: 'totalStudents', label: 'Students' },
  { key: 'totalClasses', label: 'Classes' },
  { key: 'totalSubjects', label: 'Subjects' },
  { key: 'totalChapters', label: 'Chapters' },
  { key: 'totalQuestions', label: 'Questions' },
];

export function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Admin dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Platform-wide content and user statistics.</p>
      </div>

      {isLoading && <Spinner label="Loading stats..." />}
      {isError && <ErrorState message="Could not load dashboard stats." onRetry={() => void refetch()} />}

      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {STAT_LABELS.map(({ key, label }) => (
            <Card key={key}>
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{data[key]}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
