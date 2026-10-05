import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { useChapters } from '../../features/chapters';
import { useNotes } from '../../features/notes';
import { useAuth } from '../../context/AuthContext';
import type { NoteEntity, NoteFilters } from '../../types/notes';

const PAGE_SIZE = 10;

const TYPE_LABEL: Record<string, string> = {
  SHORT_ANSWER: 'Short Answer',
  LONG_ANSWER: 'Long Answer',
};

interface NoteCardProps {
  note: NoteEntity;
  chapterTitle: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function NoteCard({ note, chapterTitle, isExpanded, onToggle }: NoteCardProps) {
  const answerId = `note-answer-${note.id}`;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{TYPE_LABEL[note.type] ?? note.type}</Badge>
        </div>
        <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">{note.text}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{chapterTitle}</p>
      </div>

      <div>
        <Button
          size="sm"
          variant="secondary"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={answerId}
        >
          {isExpanded ? 'Hide answer' : 'Show answer'}
        </Button>
      </div>

      {isExpanded && (
        <div
          id={answerId}
          className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50"
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Model answer
          </p>
          {note.explanation ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {note.explanation}
            </p>
          ) : (
            <p className="text-sm italic text-slate-500 dark:text-slate-400">
              No model answer has been added for this question yet.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Notes: the exercise questions (short/long answer) of the student's grade,
 * each with its model answer behind a toggle so the set can be used for
 * self-testing or read straight through.
 */
export function StudentNotesPage() {
  const { user } = useAuth();
  const { data: chapters } = useChapters();

  const [page, setPage] = useState(1);
  const [chapterFilter, setChapterFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Any filter change puts the reader back on page 1.
  useEffect(() => {
    setPage(1);
  }, [chapterFilter, debouncedSearch]);

  const filters: NoteFilters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      chapterId: chapterFilter || undefined,
      q: debouncedSearch.trim() || undefined,
    }),
    [page, chapterFilter, debouncedSearch],
  );

  const { data, isLoading, isError, refetch, isFetching } = useNotes(filters);

  const chapterOptions = useMemo(() => (chapters ?? []).map((c) => ({ value: c.id, label: c.title })), [chapters]);
  const chapterTitleById = useMemo(
    () => new Map((chapters ?? []).map((c) => [c.id, c.title])),
    [chapters],
  );

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const allExpanded = items.length > 0 && items.every((n) => expandedIds.includes(n.id));

  function toggleNote(id: string) {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Notes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Exercise questions and their model answers
          {user?.class?.title ? ` for ${user.class.title}` : ''}. Pick a chapter, then reveal each answer when you
          are ready.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Chapter"
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
          options={[{ value: '', label: 'All chapters' }, ...chapterOptions]}
        />
        <Input
          label="Search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search question text..."
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data?.total} note{data?.total === 1 ? '' : 's'}
            {isFetching ? ' - updating...' : ''}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setExpandedIds(allExpanded ? [] : items.map((n) => n.id))}
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </Button>
        </div>
      )}

      {isLoading && <Spinner label="Loading notes..." />}
      {isError && <ErrorState message="Could not load notes." onRetry={() => void refetch()} />}
      {data && items.length === 0 && (
        <EmptyState
          title="No notes for this chapter yet"
          description="Try another chapter, clear the filters, or check back once more exercise questions have been published."
        />
      )}

      {items.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
            {items.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                chapterTitle={chapterTitleById.get(note.chapterId) ?? note.chapter.title}
                isExpanded={expandedIds.includes(note.id)}
                onToggle={() => toggleNote(note.id)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>
              Page {data?.page} of {totalPages} ({data?.total} total)
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
