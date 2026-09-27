/**
 * @fileoverview Line diff for the publish confirmation dialog.
 */

export interface DiffEntry {
  kind: 'same' | 'added' | 'removed';
  text: string;
}

export type DiffRow = DiffEntry | { kind: 'gap'; count: number };

/** Above this many cells the LCS table is skipped and the changed block is shown as replace-all. */
const MAX_LCS_CELLS = 2_000_000;

function diffMiddle(a: string[], b: string[]): DiffEntry[] {
  const n = a.length;
  const m = b.length;
  if (n * m > MAX_LCS_CELLS) {
    return [
      ...a.map((text): DiffEntry => ({ kind: 'removed', text })),
      ...b.map((text): DiffEntry => ({ kind: 'added', text })),
    ];
  }
  // lcs[i * (m + 1) + j] = length of the LCS of a[i..] and b[j..]
  const lcs = new Uint32Array((n + 1) * (m + 1));
  const at = (i: number, j: number): number => lcs[i * (m + 1) + j] ?? 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * (m + 1) + j] =
        a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const out: DiffEntry[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] ?? '' });
      i++;
      j++;
    } else if (at(i + 1, j) >= at(i, j + 1)) {
      out.push({ kind: 'removed', text: a[i++] ?? '' });
    } else {
      out.push({ kind: 'added', text: b[j++] ?? '' });
    }
  }
  while (i < n) out.push({ kind: 'removed', text: a[i++] ?? '' });
  while (j < m) out.push({ kind: 'added', text: b[j++] ?? '' });
  return out;
}

export function lineDiff(before: string, after: string): DiffEntry[] {
  const a = before.split('\n');
  const b = after.split('\n');
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const same = (text: string): DiffEntry => ({ kind: 'same', text });
  return [
    ...a.slice(0, start).map(same),
    ...diffMiddle(a.slice(start, endA), b.slice(start, endB)),
    ...a.slice(endA).map(same),
  ];
}

/** Keeps changed lines plus `context` unchanged lines around them; the rest become gaps. */
export function withContext(entries: readonly DiffEntry[], context = 2): DiffRow[] {
  const keep = entries.map((entry) => entry.kind !== 'same');
  entries.forEach((entry, index) => {
    if (entry.kind === 'same') return;
    for (
      let k = Math.max(0, index - context);
      k <= Math.min(entries.length - 1, index + context);
      k++
    ) {
      keep[k] = true;
    }
  });
  const rows: DiffRow[] = [];
  let hidden = 0;
  entries.forEach((entry, index) => {
    if (keep[index]) {
      if (hidden > 0) rows.push({ kind: 'gap', count: hidden });
      hidden = 0;
      rows.push(entry);
    } else {
      hidden++;
    }
  });
  if (hidden > 0) rows.push({ kind: 'gap', count: hidden });
  return rows;
}
