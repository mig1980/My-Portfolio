/**
 * @fileoverview Live list of template-contract problems; clicking one jumps to its line.
 */

import { memo, useCallback } from 'react';

interface ValidationPanelProps {
  errors: readonly string[];
  isChecking: boolean;
  onJump: (line: number) => void;
}

const LINE_PREFIX = /^Line (\d+): /;

const ValidationItem = memo(
  ({ error, onJump }: { error: string; onJump: (line: number) => void }) => {
    const line = Number(LINE_PREFIX.exec(error)?.[1] ?? 0);
    const handleClick = useCallback(() => onJump(line), [line, onJump]);
    if (!line) return <li className="px-3 py-1">{error}</li>;
    return (
      <li>
        <button
          type="button"
          onClick={handleClick}
          className="w-full px-3 py-1 text-left hover:bg-red-100 focus-ring-inset"
        >
          {error}
        </button>
      </li>
    );
  }
);

ValidationItem.displayName = 'ValidationItem';

const ValidationPanel = memo(({ errors, isChecking, onJump }: ValidationPanelProps) => {
  if (isChecking) {
    return <p className="px-3 py-2 text-xs text-stone-500">Checking…</p>;
  }
  if (errors.length === 0) {
    return <p className="px-3 py-2 text-xs text-emerald-700">No problems found.</p>;
  }
  return (
    <div role="alert" className="max-h-40 overflow-y-auto bg-red-50 text-xs text-red-800">
      <p className="px-3 pt-2 font-semibold">
        {errors.length} problem{errors.length === 1 ? '' : 's'} to fix before publishing:
      </p>
      <ul className="py-1">
        {errors.map((error, index) => (
          <ValidationItem key={`${index}-${error}`} error={error} onJump={onJump} />
        ))}
      </ul>
    </div>
  );
});

ValidationPanel.displayName = 'ValidationPanel';

export default ValidationPanel;
