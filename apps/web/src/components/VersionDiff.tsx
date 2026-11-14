import { useEffect, useState } from "react";
import { diffLines, diffWordsWithSpace } from "diff";
import type { ReactNode } from "react";
function RowGroup({
  rows,
  render,
  unchanged,
}: {
  rows: Row[];
  render: (r: Row, i: number) => ReactNode;
  unchanged: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(200);
  const content = (
    <>
      {rows.slice(0, limit).map(render)}
      {limit < rows.length && (
        <button className="ux-button" onClick={() => setLimit((n) => n + 200)}>
          Show next {Math.min(200, rows.length - limit)} lines
        </button>
      )}
    </>
  );
  return unchanged ? (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Show {rows.length} unchanged lines</summary>
      {open && content}
    </details>
  ) : (
    <>{content}</>
  );
}
interface Row {
  kind: "added" | "removed" | "same";
  text: string;
  old?: number;
  next?: number;
  words?: { value: string; changed: boolean }[];
}
// jsdiff's async callback and time limit bound pathological comparisons without blocking editing.
export function VersionDiff({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const [result, setResult] = useState<{ key: string; rows: Row[] } | null>(
    null,
  );
  const [error, setError] = useState("");
  const key = JSON.stringify([before, after]);
  useEffect(() => {
    let active = true;
    diffLines(before, after, {
      timeout: 800,
      callback: (parts) => {
        if (!active) return;
        if (!parts) {
          setError(key);
          return;
        }
        let old = 1,
          next = 1;
        const rows: Row[] = [];
        const highlightDeadline = performance.now() + 40;
        for (let pi = 0; pi < parts.length; pi++) {
          const part = parts[pi];
          const lines = part.value.replace(/\n$/, "").split("\n");
          const adjacent = parts[pi + (part.removed ? 1 : -1)];
          const paired = part.removed
            ? adjacent?.added
            : part.added && adjacent?.removed;
          const peers = paired
            ? adjacent!.value.replace(/\n$/, "").split("\n")
            : [];
          lines.forEach((text, i) => {
            const words =
              peers[i] !== undefined &&
              performance.now() < highlightDeadline &&
              text.length < 2000 &&
              peers[i].length < 2000
                ? diffWordsWithSpace(
                    part.removed ? text : peers[i],
                    part.removed ? peers[i] : text,
                    { timeout: 20 },
                  )
                    ?.filter((w) => (part.removed ? !w.added : !w.removed))
                    .map((w) => ({
                      value: w.value,
                      changed: !!(w.added || w.removed),
                    }))
                : undefined;
            rows.push({
              kind: part.added ? "added" : part.removed ? "removed" : "same",
              text,
              old: part.added ? undefined : old++,
              next: part.removed ? undefined : next++,
              words,
            });
          });
        }
        setResult({ key, rows });
      },
    });
    return () => {
      active = false;
    };
  }, [before, after, key]);
  if (error === key)
    return (
      <p role="status">
        This comparison is too complex to display within the time limit. Source
        and saved versions remain available.
      </p>
    );
  if (result?.key !== key) return <p role="status">Comparing versions…</p>;
  const rows = result.rows;
  const groups: Row[][] = [];
  for (const row of rows) {
    const group = groups.at(-1);
    if (group && group[0].kind === row.kind) group.push(row);
    else groups.push([row]);
  }
  const render = (row: Row, i: number) => (
    <div key={i} className={`ux-diff-row ${row.kind}`}>
      <span>
        {row.old ?? "–"} {row.next ?? "–"}{" "}
        {row.kind === "added" ? "+" : row.kind === "removed" ? "−" : " "}
      </span>
      <code>
        {row.words
          ? row.words.map((w, j) =>
              w.changed ? <mark key={j}>{w.value}</mark> : w.value,
            )
          : row.text || " "}
      </code>
    </div>
  );
  return (
    <div className="ux-diff font-mono">
      <p className="py-2">
        Saved → Current · +{rows.filter((r) => r.kind === "added").length} / −
        {rows.filter((r) => r.kind === "removed").length} lines
      </p>
      {groups.map((group, i) => (
        <RowGroup
          key={i}
          rows={group}
          render={render}
          unchanged={group[0].kind === "same" && group.length > 12}
        />
      ))}{" "}
    </div>
  );
}
