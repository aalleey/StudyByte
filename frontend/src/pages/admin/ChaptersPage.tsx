import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { chapterFormSchema, ChapterFormValues } from '../../schemas/content.schemas';
import { useSubjects } from '../../features/subjects';
import {
  useChapters,
  useCreateChapter,
  useDeleteChapter,
  usePublishChapter,
  useUpdateChapter,
} from '../../features/chapters';
import type { ChapterEntity } from '../../types/content';

export function AdminChaptersPage() {
  const navigate = useNavigate();
  const { data: subjects } = useSubjects();
  const [subjectFilter, setSubjectFilter] = useState<string>('');

  const { data: chapters, isLoading, isError, refetch } = useChapters(subjectFilter || undefined);
  const createMutation = useCreateChapter();
  const updateMutation = useUpdateChapter();
  const deleteMutation = useDeleteChapter();
  const publishMutation = usePublishChapter();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChapterEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChapterEntity | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<ChapterEntity | null>(null);

  const subjectOptions = useMemo(() => (subjects ?? []).map((s) => ({ value: s.id, label: s.title })), [subjects]);
  const subjectNameById = useMemo(() => new Map((subjects ?? []).map((s) => [s.id, s.title])), [subjects]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChapterFormValues>({ resolver: zodResolver(chapterFormSchema) });

  function openCreate() {
    setEditing(null);
    reset({ subjectId: subjectFilter || subjectOptions[0]?.value || '', title: '', slug: '', order: 0 });
    setModalOpen(true);
  }

  function openEdit(chapter: ChapterEntity) {
    setEditing(chapter);
    reset({ subjectId: chapter.subjectId, title: chapter.title, slug: chapter.slug, order: chapter.order });
    setModalOpen(true);
  }

  async function onSubmit(values: ChapterFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
        showToast('Chapter updated', 'success');
      } else {
        await createMutation.mutateAsync(values);
        showToast('Chapter created', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save chapter'), 'error');
    }
  }

  async function handleTogglePublish(chapter: ChapterEntity) {
    if (chapter.isPublished) {
      setUnpublishTarget(chapter);
      return;
    }
    try {
      await publishMutation.mutateAsync({ id: chapter.id, isPublished: true });
      showToast('Chapter published', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  async function confirmUnpublish() {
    if (!unpublishTarget) return;
    try {
      await publishMutation.mutateAsync({ id: unpublishTarget.id, isPublished: false });
      showToast('Chapter unpublished', 'success');
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
      showToast('Chapter deleted', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns: TableColumn<ChapterEntity>[] = [
    { header: 'Title', accessor: (row) => row.title },
    { header: 'Subject', accessor: (row) => subjectNameById.get(row.subjectId) ?? '-' },
    { header: 'Slug', accessor: (row) => <code className="text-xs">{row.slug}</code> },
    { header: 'Questions', accessor: (row) => row._count?.questions ?? '-' },
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/admin/questions?chapterId=${row.id}&create=1`)}
          >
            + Question
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

  const noSubjects = subjectOptions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Chapters</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Belong to a subject.</p>
        </div>
        <Button onClick={openCreate} disabled={noSubjects}>
          Create chapter
        </Button>
      </div>

      {!noSubjects && (
        <div className="max-w-xs">
          <Select
            label="Filter by subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={[{ value: '', label: 'All subjects' }, ...subjectOptions]}
          />
        </div>
      )}

      {noSubjects && (
        <EmptyState title="No subjects yet" description="Create a subject first before adding chapters." />
      )}

      {isLoading && <Spinner label="Loading chapters..." />}
      {isError && <ErrorState message="Could not load chapters." onRetry={() => void refetch()} />}
      {!noSubjects && chapters && chapters.length === 0 && (
        <EmptyState
          title="No chapters yet"
          description="Create your first chapter."
          action={<Button onClick={openCreate}>Create chapter</Button>}
        />
      )}
      {chapters && chapters.length > 0 && <Table columns={columns} rows={chapters} rowKey={(row) => row.id} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit chapter' : 'Create chapter'}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Select label="Subject" options={subjectOptions} error={errors.subjectId?.message} {...register('subjectId')} />
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
        title="Delete chapter"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also delete its questions.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!unpublishTarget}
        title="Unpublish chapter"
        message={`"${unpublishTarget?.title}" will no longer be visible to students. Continue?`}
        confirmLabel="Unpublish"
        isLoading={publishMutation.isPending}
        onConfirm={() => void confirmUnpublish()}
        onCancel={() => setUnpublishTarget(null)}
      />
    </div>
  );
}
