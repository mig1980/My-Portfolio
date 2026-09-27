/**
 * @fileoverview Live list of template-contract problems (clicking one jumps to its line), plus
 * warnings for shared career facts that no longer match the website and the AI assistant.
 */

import { memo, useCallback } from 'react';

interface ValidationPanelProps {
  errors: readonly string[];
  warnings: readonly string[];
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

const ValidationPanel = memo(({ errors, warnings, isChecking, onJump }: ValidationPanelProps) => {
  if (isChecking) {
    return <p className="px-3 py-2 text-xs text-stone-500">Checking…</p>;
  }
  if (errors.length === 0 && warnings.length === 0) {
    return <p className="px-3 py-2 text-xs text-emerald-700">No problems found.</p>;
  }
  return (
    <div className="max-h-40 overflow-y-auto text-xs">
      {errors.length > 0 && (
        <div role="alert" className="bg-red-50 text-red-800">
          <p className="px-3 pt-2 font-semibold">
            {errors.length} problem{errors.length === 1 ? '' : 's'} to fix before publishing:
          </p>
          <ul className="py-1">
            {errors.map((error, index) => (
              <ValidationItem key={`${index}-${error}`} error={error} onJump={onJump} />
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && <FactWarnings warnings={warnings} />}
    </div>
  );
});

ValidationPanel.displayName = 'ValidationPanel';

/** Shared-fact mismatches: publishing is allowed, but the site's automatic checks will fail. */
export const FactWarnings = memo(({ warnings }: { warnings: readonly string[] }) => (
  <div role="status" className="bg-amber-50 px-3 py-2 text-xs text-amber-900">
    <p className="font-semibold">
      {warnings.length === 1 ? 'A shared fact differs' : 'Shared facts differ'} from the website and
      the AI assistant:
    </p>
    <ul className="mt-1 list-disc pl-5">
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
    <p className="mt-1">
      You can still publish, but the site&apos;s automatic checks will fail until the website and
      the AI assistant are updated to match (ask Copilot).
    </p>
  </div>
));

FactWarnings.displayName = 'FactWarnings';

export default ValidationPanel;
