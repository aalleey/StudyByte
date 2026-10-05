import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, TableColumn } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';
import { questionFormSchema, QuestionFormSchemaValues } from '../../schemas/assessment.schemas';
import { useChapters } from '../../features/chapters';
import {
  useCreateQuestion,
  useDeleteQuestion,
  useImportQuestionsCsv,
  usePublishQuestion,
  useQuestions,
  useUpdateQuestion,
} from '../../features/questions';
import type { CsvImportResult, QuestionEntity, QuestionFilters } from '../../types/questions';

const CSV_TEMPLATE = `type,text,option1,option2,option3,option4,correctOption,correctAnswerText,explanation
MCQ,What does RAM stand for?,Random Access Memory,Read Access Memory,Run Access Memory,,1,,RAM stands for Random Access Memory.
TRUE_FALSE,A compiler translates source code into machine code.,,,,,true,,Compilers translate high-level code into machine code.
FILL_BLANK,A ____ is used to repeat a block of code multiple times.,,,,,,loop,A loop repeats a block of code.
SHORT_ANSWER,Explain what a variable is in programming.,,,,,,,A variable stores a value that can change during program execution.
LONG_ANSWER,Describe the differences between RAM and ROM.,,,,,,,RAM is volatile and used for temporary storage; ROM is non-volatile and stores firmware.
`;

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'question-import-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const TYPE_OPTIONS = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
];

const TYPE_BADGE_LABEL: Record<string, string> = {
  MCQ: 'MCQ',
  TRUE_FALSE: 'True/False',
  FILL_BLANK: 'Fill Blank',
  SHORT_ANSWER: 'Short Answer',
  LONG_ANSWER: 'Long Answer',
};

function emptyForm(chapterId: string, type: QuestionFormSchemaValues['type'] = 'MCQ'): QuestionFormSchemaValues {
  return {
    chapterId,
    type,
    text: '',
    explanation: '',
    correctAnswerText: '',
    options:
      type === 'MCQ'
        ? [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
          ]
        : type === 'TRUE_FALSE'
          ? [
              { text: 'True', isCorrect: false },
              { text: 'False', isCorrect: true },
            ]
          : [],
  };
}

export function AdminQuestionsPage() {
  const { data: chapters } = useChapters();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [chapterFilter, setChapterFilter] = useState(() => searchParams.get('chapterId') ?? '');
  const [typeFilter, setTypeFilter] = useState('');

  const filters: QuestionFilters = useMemo(
    () => ({
      page,
      pageSize: 10,
      chapterId: chapterFilter || undefined,
      type: (typeFilter || undefined) as QuestionFilters['type'],
    }),
    [page, chapterFilter, typeFilter],
  );

  const { data, isLoading, isError, refetch } = useQuestions(filters);
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();
  const publishMutation = usePublishQuestion();
  const importMutation = useImportQuestionsCsv();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestionEntity | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<QuestionEntity | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importChapterId, setImportChapterId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPublish, setImportPublish] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);

  const chapterOptions = useMemo(() => (chapters ?? []).map((t) => ({ value: t.id, label: t.title })), [chapters]);
  const chapterNameById = useMemo(() => new Map((chapters ?? []).map((t) => [t.id, t.title])), [chapters]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormSchemaValues>({ resolver: zodResolver(questionFormSchema) });

  const watchedType = watch('type');
  const watchedOptions = watch('options') ?? [];

  const handledQuickCreate = useRef(false);
  useEffect(() => {
    if (handledQuickCreate.current) return;
    const chapterIdParam = searchParams.get('chapterId');
    const shouldCreate = searchParams.get('create') === '1';
    if (shouldCreate && chapterIdParam) {
      handledQuickCreate.current = true;
      setEditing(null);
      reset(emptyForm(chapterIdParam, 'SHORT_ANSWER'));
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (watchedType === 'TRUE_FALSE') {
      const hasTrueFalseShape =
        watchedOptions.length === 2 && watchedOptions[0]?.text === 'True' && watchedOptions[1]?.text === 'False';
      if (!hasTrueFalseShape) {
        setValue('options', [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedType]);

  function openCreate() {
    setEditing(null);
    reset(emptyForm(chapterFilter || chapterOptions[0]?.value || ''));
    setModalOpen(true);
  }

  function openImport() {
    setImportChapterId(chapterFilter || chapterOptions[0]?.value || '');
    setImportFile(null);
    setImportPublish(false);
    setImportResult(null);
    setImportModalOpen(true);
  }

  async function submitImport() {
    if (!importChapterId || !importFile) return;
    try {
      const result = await importMutation.mutateAsync({
        chapterId: importChapterId,
        file: importFile,
        publish: importPublish,
      });
      setImportResult(result);
      if (result.failed.length === 0) {
        showToast(`Imported ${result.created} question(s)`, 'success');
      } else {
        showToast(`Imported ${result.created} of ${result.totalRows} - ${result.failed.length} row(s) failed`, 'error');
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not import CSV'), 'error');
    }
  }

  function openEdit(question: QuestionEntity) {
    setEditing(question);
    reset({
      chapterId: question.chapterId,
      type: question.type,
      text: question.text,
      explanation: question.explanation ?? '',
      correctAnswerText: question.correctAnswerText ?? '',
      options: question.options.length > 0 ? question.options.map((o) => ({ text: o.text, isCorrect: !!o.isCorrect })) : [],
    });
    setModalOpen(true);
  }

  async function onSubmit(values: QuestionFormSchemaValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
        showToast('Question updated', 'success');
      } else {
        await createMutation.mutateAsync(values);
        showToast('Question created', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save question'), 'error');
    }
  }

  async function handleTogglePublish(question: QuestionEntity) {
    if (question.isPublished) {
      setUnpublishTarget(question);
      return;
    }
    try {
      await publishMutation.mutateAsync({ id: question.id, isPublished: true });
      showToast('Question published', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  async function confirmUnpublish() {
    if (!unpublishTarget) return;
    try {
      await publishMutation.mutateAsync({ id: unpublishTarget.id, isPublished: false });
      showToast('Question unpublished', 'success');
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
      showToast('Question deleted', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  function addOption() {
    setValue('options', [...(watchedOptions ?? []), { text: '', isCorrect: false }]);
  }

  function removeOption(index: number) {
    setValue(
      'options',
      watchedOptions.filter((_, i) => i !== index),
    );
  }

  function updateOptionText(index: number, text: string) {
    const next = [...watchedOptions];
    next[index] = { ...next[index], text };
    setValue('options', next);
  }

  function setCorrectOption(index: number) {
    setValue(
      'options',
      watchedOptions.map((o, i) => ({ ...o, isCorrect: i === index })),
    );
  }

  const columns: TableColumn<QuestionEntity>[] = [
    { header: 'Text', accessor: (row) => <span className="line-clamp-2 max-w-xs">{row.text}</span> },
    { header: 'Chapter', accessor: (row) => chapterNameById.get(row.chapterId) ?? '-' },
    {
      header: 'Type',
      accessor: (row) => <Badge variant="info">{TYPE_BADGE_LABEL[row.type] ?? row.type}</Badge>,
    },
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

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Questions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">The question bank behind the Notes page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openImport} disabled={chapterOptions.length === 0}>
            Import CSV
          </Button>
          <Button onClick={openCreate} disabled={chapterOptions.length === 0}>
            Create question
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Chapter"
          value={chapterFilter}
          onChange={(e) => {
            setChapterFilter(e.target.value);
            setPage(1);
          }}
          options={[{ value: '', label: 'All chapters' }, ...chapterOptions]}
        />
        <Select
          label="Type"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          options={[{ value: '', label: 'All types' }, ...TYPE_OPTIONS]}
        />
      </div>

      {isLoading && <Spinner label="Loading questions..." />}
      {isError && <ErrorState message="Could not load questions." onRetry={() => void refetch()} />}
      {data && items.length === 0 && (
        <EmptyState title="No questions found" description="Try adjusting the filters, or create a new question." />
      )}

      {items.length > 0 && (
        <>
          <Table columns={columns} rows={items} rowKey={(row) => row.id} />
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Page {data?.page} of {totalPages} ({data?.total} total)
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit question' : 'Create question'}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Select label="Chapter" options={chapterOptions} error={errors.chapterId?.message} {...register('chapterId')} />
          <Select label="Type" options={TYPE_OPTIONS} error={errors.type?.message} {...register('type')} />
          <Textarea label="Question text" error={errors.text?.message} {...register('text')} />
          <Textarea label="Explanation (optional)" error={errors.explanation?.message} {...register('explanation')} />

          {(watchedType === 'MCQ' || watchedType === 'TRUE_FALSE') && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Options</p>
              {watchedOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={opt.isCorrect}
                    onChange={() => setCorrectOption(idx)}
                    aria-label={`Mark option ${idx + 1} correct`}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    disabled={watchedType === 'TRUE_FALSE'}
                    onChange={(e) => updateOptionText(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  {watchedType === 'MCQ' && watchedOptions.length > 2 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(idx)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {watchedType === 'MCQ' && (
                <Button type="button" variant="secondary" size="sm" onClick={addOption}>
                  Add option
                </Button>
              )}
              {errors.options && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.options.message as string}</p>
              )}
            </div>
          )}

          {watchedType === 'FILL_BLANK' && (
            <Input
              label="Correct answer"
              error={errors.correctAnswerText?.message}
              {...register('correctAnswerText')}
            />
          )}

          {(watchedType === 'SHORT_ANSWER' || watchedType === 'LONG_ANSWER') && (
            <div className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
              This is an exercise question - students type a free-text answer instead of picking an option. It
              isn&apos;t auto-graded; use the explanation field above as the model answer for manual review.
            </div>
          )}

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

      <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import questions from CSV">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Bulk-add MCQ, True/False, Fill-in-the-Blank, Short Answer and Long Answer questions to one chapter at once.
            Not sure of the format?{' '}
            <button type="button" className="font-medium text-brand-600 hover:underline dark:text-brand-400" onClick={downloadCsvTemplate}>
              Download a template
            </button>
            .
          </p>

          <Select
            label="Chapter"
            options={chapterOptions}
            value={importChapterId}
            onChange={(e) => setImportChapterId(e.target.value)}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">CSV file</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:text-slate-300 dark:file:bg-brand-900/40 dark:file:text-brand-300"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={importPublish}
              onChange={(e) => setImportPublish(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Publish imported questions immediately
          </label>

          {importResult && (
            <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-medium text-slate-800 dark:text-slate-100">
                Imported <span className="text-emerald-600 dark:text-emerald-400">{importResult.created}</span> of{' '}
                {importResult.totalRows} row(s)
              </p>
              {importResult.failed.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-900/20">
                  {importResult.failed.map((f) => (
                    <p key={f.row} className="text-xs text-red-700 dark:text-red-300">
                      Row {f.row}: {f.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setImportModalOpen(false)}>
              {importResult ? 'Done' : 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={() => void submitImport()}
              disabled={!importChapterId || !importFile}
              isLoading={importMutation.isPending}
            >
              Import
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete question"
        message="Are you sure you want to delete this question?"
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!unpublishTarget}
        title="Unpublish question"
        message="This question will no longer be visible to students. Continue?"
        confirmLabel="Unpublish"
        isLoading={publishMutation.isPending}
        onConfirm={() => void confirmUnpublish()}
        onCancel={() => setUnpublishTarget(null)}
      />
    </div>
  );
}
