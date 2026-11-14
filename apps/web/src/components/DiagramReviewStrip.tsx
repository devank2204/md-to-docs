import { useEffect, useMemo, useState } from "react";
import { findMermaidBlocks } from "@mdtodocs/compiler-core";
import { renderMermaid } from "@mdtodocs/asset-pipeline";
import { useStore } from "@/store";
import { Button } from "./Controls";
const seen = new Set<string>();
const checked = new Map<string, Promise<boolean>>();
export function DiagramReviewStrip() {
  const source = useStore((s) => s.markdown);
  const id = useStore((s) => s.activeDocumentId);
  const blocks = useMemo(() => findMermaidBlocks(source), [source]);
  const [failures, setFailures] = useState<{
    docId: string;
    codes: string[];
  }>({ docId: "", codes: [] });
  const [attention, setAttention] = useState(false);
  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      Promise.all(
        blocks.map((b) => {
          let check = checked.get(b.code);
          if (!check) {
            check = renderMermaid(b.code, { repair: false }).then(
              (r) => !r.success,
            );
            checked.set(b.code, check);
            if (checked.size > 100)
              checked.delete(checked.keys().next().value!);
          }
          return check.then((failed) => ({ b, failed }));
        }),
      )
        .then((rows) => {
          if (!active) return;
          const issues = rows.filter((r) => r.failed);
          const fingerprint = JSON.stringify([id, issues.map((r) => r.b.code)]);
          setFailures({
            docId: id,
            codes: issues.map((r) => r.b.code),
          });
          setAttention(issues.length > 0 && !seen.has(fingerprint));
          if (issues.length) seen.add(fingerprint);
        })
        .catch(() => {});
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [blocks, id, source]);
  const starts = blocks
    .filter((b) => failures.codes.includes(b.code))
    .map((b) => b.start);
  if (failures.docId !== id || !starts.length) return null;
  return (
    <div
      className={`ux-warning ${attention ? "ux-attention" : ""}`}
      data-print-hide
    >
      <span>
        {starts.length} diagram
        {starts.length === 1 ? "" : "s"}{" "}
        {starts.length === 1 ? "needs" : "need"} review
      </span>
      <Button
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("mdtodocs:mermaid-review", {
              detail: {
                sourceStart: starts[0],
                issueStarts: starts,
              },
            }),
          )
        }
      >
        Review fixes
      </Button>
    </div>
  );
}
