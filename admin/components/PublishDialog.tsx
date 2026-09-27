/**
 * @fileoverview Confirmation dialog before publishing: shows what changed and takes a note.
 */

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { lineDiff, withContext } from '../lineDiff';

interface PublishDialogProps {
  before: string;
  after: string;
  isBusy: boolean;
  onConfirm: (message: string) => void;
  onCancel: () => void;
}

const ROW_STYLES = {
  added: 'bg-emerald-50 text-emerald-900',
  removed: 'bg-red-50 text-red-900 line-through decoration-red-300',
  same: 'text-stone-500',
} as const;

const ROW_MARKS = { added: '+', removed: '−', same: ' ' } as const;

const PublishDialog = memo(({ before, after, isBusy, onConfirm, onCancel }: PublishDialogProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const entries = useMemo(() => lineDiff(before, after), [before, after]);
  const rows = useMemo(() => withContext(entries), [entries]);
  const added = entries.filter((entry) => entry.kind === 'added').length;
  const removed = entries.filter((entry) => entry.kind === 'removed').length;

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isBusy, onCancel]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      onConfirm(message);
    },
    [message, onConfirm]
  );

  const handleMessageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value),
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-title"
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
      >
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 id="publish-title" className="text-lg font-semibold text-ink">
            Publish résumé
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {added} line{added === 1 ? '' : 's'} added, {removed} removed. After publishing, the PDF
            is rebuilt and the website updates in a few minutes.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-stone-50 font-mono text-xs">
          {rows.map((row, index) =>
            row.kind === 'gap' ? (
              <div key={index} className="px-3 py-0.5 text-stone-400">
                ⋯ {row.count} unchanged line{row.count === 1 ? '' : 's'}
              </div>
            ) : (
              <div key={index} className={`whitespace-pre-wrap px-3 ${ROW_STYLES[row.kind]}`}>
                {ROW_MARKS[row.kind]} {row.text}
              </div>
            )
          )}
        </div>

        <div className="border-t border-stone-200 px-5 py-4">
          <label htmlFor="publish-message" className="block text-sm font-medium text-ink">
            What changed? (optional)
          </label>
          <input
            ref={inputRef}
            id="publish-message"
            type="text"
            maxLength={72}
            value={message}
            onChange={handleMessageChange}
            placeholder="e.g. updated summary"
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm focus-ring"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="rounded border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100 disabled:opacity-50 focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="rounded bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 focus-ring"
            >
              {isBusy ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
});

PublishDialog.displayName = 'PublishDialog';

export default PublishDialog;
