import { Button } from "../components/Controls";
import { useEffect, useState } from "react";
import { compareJSON, changesFromDelta, jsonError, type Change } from "./model";
export default function JsonResult({
  a,
  b,
  copy,
}: {
  a: string;
  b: string;
  copy: (value: string) => Promise<void>;
}) {
  const [result, setResult] = useState<{
    changes: Change[];
    error?: string;
    left?: unknown;
    right?: unknown;
  }>({ changes: [] });
  const [pending, setPending] = useState(true);
  const [selected, setSelected] = useState<string>();
  useEffect(() => {
    setPending(true);
    const timer = setTimeout(() => {
      try {
        if (a.length > 200_000 || b.length > 200_000)
          throw new Error("Payload exceeds the structural comparison limit.");
        const errors = [jsonError(a), jsonError(b)];
        if (errors.some(Boolean))
          throw new Error(
            errors
              .map((e, i) => (e ? `${i ? "Updated" : "Original"}: ${e}` : ""))
              .filter(Boolean)
              .join("\n"),
          );
        const { delta, left, right } = compareJSON(a, b);
        setResult({ changes: changesFromDelta(delta), left, right });
      } catch (error) {
        setResult({ changes: [], error: (error as Error).message });
      }
      setPending(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [a, b]);
  if (pending) return <p role="status">Comparing…</p>;
  if (result.error)
    return (
      <p role="alert" style={{ whiteSpace: "pre-wrap" }}>
        {result.error}
      </p>
    );
  return (
    <section aria-label="JSON changes">
      <p role="status">
        {result.changes.length}{" "}
        {result.changes.length === 1 ? "change" : "changes"}
      </p>
      {result.changes.map((change, index) => (
        <div className="json-change" key={index}>
          <Button
            className="font-code-sm text-code-sm"
            onClick={() =>
              setSelected(selected === change.path ? undefined : change.path)
            }
          >
            {change.type} <code>{change.path}</code>
          </Button>
          <Button
            className="font-code-sm text-code-sm"
            aria-label={`Copy path ${change.path}`}
            onClick={() => void copy(change.path)}
          >
            Copy path
          </Button>
          <pre className="font-code-md text-code-md">
            {change.old === undefined
              ? "(missing)"
              : JSON.stringify(change.old, null, 2)}{" "}
            →{" "}
            {change.next === undefined
              ? "(missing)"
              : JSON.stringify(change.next, null, 2)}
          </pre>
          {selected === change.path && (
            <details open>
              <summary>Payload context</summary>
              <pre className="font-code-md text-code-md">
                Original: {JSON.stringify(result.left, null, 2)}
                {"\n"}Updated: {JSON.stringify(result.right, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </section>
  );
}
