import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 py-10 text-center dark:border-red-900/50 dark:bg-red-950/30">
      <p className="text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
