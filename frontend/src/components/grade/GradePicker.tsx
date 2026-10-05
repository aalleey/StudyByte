import { useState } from 'react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { useClasses } from '../../features/classes';
import { useUpdateMyClass } from '../../features/auth/useUpdateMyClass';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';

interface GradePickerProps {
  /** Label for the confirm button, e.g. "Continue" on the gate, "Save grade" in the modal. */
  confirmLabel?: string;
  /** Called once the grade has been saved and the auth state updated. */
  onSaved?: () => void;
  /** Optional secondary action (the modal uses it for "Cancel"). */
  secondaryAction?: { label: string; onClick: () => void };
}

/**
 * The published-class picker shared by the first-login grade gate and the
 * "Change grade" modal: selectable cards backed by radio inputs, with the
 * loading / empty / error states every list in this app is expected to have.
 */
export function GradePicker({ confirmLabel = 'Continue', onSaved, secondaryAction }: GradePickerProps) {
  const { user } = useAuth();
  const { data: classes, isLoading, isError, refetch } = useClasses();
  const updateMutation = useUpdateMyClass();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState(user?.classId ?? '');

  async function handleConfirm() {
    if (!selectedId) return;
    try {
      await updateMutation.mutateAsync(selectedId);
      showToast('Grade updated', 'success');
      onSaved?.();
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save your grade'), 'error');
    }
  }

  if (isLoading) {
    return <Spinner label="Loading grades..." />;
  }

  if (isError) {
    return <ErrorState message="Could not load the list of grades." onRetry={() => void refetch()} />;
  }

  if (!classes || classes.length === 0) {
    return (
      <EmptyState
        title="No grades available yet"
        description="No classes have been published. Please check back soon."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Choose your grade</legend>
        {classes.map((cls) => {
          const isSelected = selectedId === cls.id;
          return (
            <label
              key={cls.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                isSelected
                  ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30'
                  : 'border-slate-200 bg-white hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700'
              }`}
            >
              <input
                type="radio"
                name="grade"
                value={cls.id}
                checked={isSelected}
                onChange={() => setSelectedId(cls.id)}
                className="h-4 w-4 shrink-0 accent-brand-600"
              />
              <span className="flex flex-col">
                <span className="font-medium text-slate-900 dark:text-slate-100">{cls.title}</span>
                {user?.classId === cls.id && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Your current grade</span>
                )}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-wrap justify-end gap-2">
        {secondaryAction && (
          <Button type="button" variant="secondary" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        <Button type="button" disabled={!selectedId} isLoading={updateMutation.isPending} onClick={() => void handleConfirm()}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
