import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, TableColumn } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';
import { subjectFormSchema, SubjectFormValues } from '../../schemas/content.schemas';
import { useClasses } from '../../features/classes';
import {
  useCreateSubject,
  useDeleteSubject,
  usePublishSubject,
  useSubjects,
  useUpdateSubject,
} from '../../features/subjects';
import type { SubjectEntity } from '../../types/content';

export function AdminSubjectsPage() {
  const { data: classes } = useClasses();
  const [classFilter, setClassFilter] = useState<string>('');

  const { data: subjects, isLoading, isError, refetch } = useSubjects(classFilter || undefined);
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();
  const publishMutation = usePublishSubject();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectEntity | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<SubjectEntity | null>(null);

  const classOptions = useMemo(() => (classes ?? []).map((c) => ({ value: c.id, label: c.title })), [classes]);
  const classNameById = useMemo(() => new Map((classes ?? []).map((c) => [c.id, c.title])), [classes]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({ resolver: zodResolver(subjectFormSchema) });

  function openCreate() {
    setEditing(null);
    reset({ classId: classFilter || classOptions[0]?.value || '', title: '', slug: '', order: 0 });
    setModalOpen(true);
  }

  function openEdit(subject: SubjectEntity) {
    setEditing(subject);
    reset({ classId: subject.classId, title: subject.title, slug: subject.slug, order: subject.order });
    setModalOpen(true);
  }

  async function onSubmit(values: SubjectFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
        showToast('Subject updated', 'success');
      } else {
        await createMutation.mutateAsync(values);
        showToast('Subject created', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save subject'), 'error');
    }
  }

  async function handleTogglePublish(subject: SubjectEntity) {
    if (subject.isPublished) {
      setUnpublishTarget(subject);
      return;
    }
    try {
      await publishMutation.mutateAsync({ id: subject.id, isPublished: true });
      showToast('Subject published', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  async function confirmUnpublish() {
    if (!unpublishTarget) return;
    try {
      await publishMutation.mutateAsync({ id: unpublishTarget.id, isPublished: false });
      showToast('Subject unpublished', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setUnpublishTarget(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('Subject deleted', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns: TableColumn<SubjectEntity>[] = [
    { header: 'Title', accessor: (row) => row.title },
    { header: 'Class', accessor: (row) => classNameById.get(row.classId) ?? '-' },
    { header: 'Slug', accessor: (row) => <code className="text-xs">{row.slug}</code> },
    { header: 'Chapters', accessor: (row) => row._count?.chapters ?? '-' },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.isPublished ? 'success' : 'neutral'}>{row.isPublished ? 'Published' : 'Draft'}</Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void handleTogglePublish(row)}>
            {row.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const noClasses = classOptions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Subjects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Belong to a class.</p>
        </div>
        <Button onClick={openCreate} disabled={noClasses}>
          Create subject
        </Button>
      </div>

      {!noClasses && (
        <div className="max-w-xs">
          <Select
            label="Filter by class"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            options={[{ value: '', label: 'All classes' }, ...classOptions]}
          />
        </div>
      )}

      {noClasses && (
        <EmptyState title="No classes yet" description="Create a class first before adding subjects." />
      )}

      {isLoading && <Spinner label="Loading subjects..." />}
      {isError && <ErrorState message="Could not load subjects." onRetry={() => void refetch()} />}
      {!noClasses && subjects && subjects.length === 0 && (
        <EmptyState
          title="No subjects yet"
          description="Create your first subject."
          action={<Button onClick={openCreate}>Create subject</Button>}
        />
      )}
      {subjects && subjects.length > 0 && <Table columns={columns} rows={subjects} rowKey={(row) => row.id} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit subject' : 'Create subject'}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Select label="Class" options={classOptions} error={errors.classId?.message} {...register('classId')} />
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Input label="Slug" hint="Lowercase letters, numbers, hyphens" error={errors.slug?.message} {...register('slug')} />
          <Input label="Order" type="number" error={errors.order?.message} {...register('order')} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete subject"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also delete its chapters and questions.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!unpublishTarget}
        title="Unpublish subject"
        message={`"${unpublishTarget?.title}" will no longer be visible to students. Continue?`}
        confirmLabel="Unpublish"
        isLoading={publishMutation.isPending}
        onConfirm={() => void confirmUnpublish()}
        onCancel={() => setUnpublishTarget(null)}
      />
    </div>
  );
}
