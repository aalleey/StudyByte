import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, TableColumn } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';
import { classFormSchema, ClassFormValues } from '../../schemas/content.schemas';
import { useClasses, useCreateClass, useDeleteClass, usePublishClass, useUpdateClass } from '../../features/classes';
import type { ClassEntity } from '../../types/content';

export function AdminClassesPage() {
  const { data: classes, isLoading, isError, refetch } = useClasses();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();
  const publishMutation = usePublishClass();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassEntity | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<ClassEntity | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassFormValues>({ resolver: zodResolver(classFormSchema) });

  function openCreate() {
    setEditing(null);
    reset({ title: '', slug: '', order: 0 });
    setModalOpen(true);
  }

  function openEdit(cls: ClassEntity) {
    setEditing(cls);
    reset({ title: cls.title, slug: cls.slug, order: cls.order });
    setModalOpen(true);
  }

  async function onSubmit(values: ClassFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
        showToast('Class updated', 'success');
      } else {
        await createMutation.mutateAsync(values);
        showToast('Class created', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save class'), 'error');
    }
  }

  async function handleTogglePublish(cls: ClassEntity) {
    if (cls.isPublished) {
      setUnpublishTarget(cls);
      return;
    }
    try {
      await publishMutation.mutateAsync({ id: cls.id, isPublished: true });
      showToast('Class published', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  async function confirmUnpublish() {
    if (!unpublishTarget) return;
    try {
      await publishMutation.mutateAsync({ id: unpublishTarget.id, isPublished: false });
      showToast('Class unpublished', 'success');
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
      showToast('Class deleted', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns: TableColumn<ClassEntity>[] = [
    { header: 'Title', accessor: (row) => row.title },
    { header: 'Slug', accessor: (row) => <code className="text-xs">{row.slug}</code> },
    { header: 'Order', accessor: (row) => row.order },
    { header: 'Subjects', accessor: (row) => row._count?.subjects ?? '-' },
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Classes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Top level of the content hierarchy.</p>
        </div>
        <Button onClick={openCreate}>Create class</Button>
      </div>

      {isLoading && <Spinner label="Loading classes..." />}
      {isError && <ErrorState message="Could not load classes." onRetry={() => void refetch()} />}
      {classes && classes.length === 0 && (
        <EmptyState
          title="No classes yet"
          description="Create your first class to start building the content hierarchy."
          action={<Button onClick={openCreate}>Create class</Button>}
        />
      )}
      {classes && classes.length > 0 && <Table columns={columns} rows={classes} rowKey={(row) => row.id} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit class' : 'Create class'}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
        title="Delete class"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also delete all of its subjects, chapters and questions.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!unpublishTarget}
        title="Unpublish class"
        message={`"${unpublishTarget?.title}" will no longer be visible to students. Continue?`}
        confirmLabel="Unpublish"
        isLoading={publishMutation.isPending}
        onConfirm={() => void confirmUnpublish()}
        onCancel={() => setUnpublishTarget(null)}
      />
    </div>
  );
}
