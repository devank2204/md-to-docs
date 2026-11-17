import { Button } from "../components/Controls";
import {
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Braces,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { compareJSON, changesFromDelta, jsonError, type Change } from "./model";
function display(value: unknown) {
  return value === undefined ? "Not present" : JSON.stringify(value, null, 2);
}
// Context lookup only; all comparison and change classification belongs to jsondiffpatch.
function parentContext(root: unknown, segments: (string | number)[]) {
  let value = root;
  for (const key of segments.slice(0, -1)) {
    if (
      value === null ||
      typeof value !== "object" ||
      !Object.hasOwn(value, key)
    )
      return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
type Result = {
  a: string;
  b: string;
  changes: Change[];
  error?: string;
  left?: unknown;
  right?: unknown;
};
export default function JsonResult({
  a,
  b,
  copy,
}: {
  a: string;
  b: string;
  copy: (value: string) => Promise<void>;
}) {
  const [result, setResult] = useState<Result>();
  const [selected, setSelected] = useState(-1);
  const rows = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!a.trim() || !b.trim()) {
          setResult({ a, b, changes: [] });
          return;
        }
        if (a.length > 200000 || b.length > 200000)
          throw new Error(
            "Payload exceeds the 200,000 character comparison limit.",
          );
        const errors = [jsonError(a), jsonError(b)];
        if (errors.some(Boolean))
          throw new Error(
            errors
              .map((error, index) =>
                error ? `${index ? "Updated" : "Original"}: ${error}` : "",
              )
              .filter(Boolean)
              .join("\n"),
          );
        const { delta, left, right } = compareJSON(a, b);
        setResult({ a, b, changes: changesFromDelta(delta), left, right });
        setSelected(-1);
      } catch (error) {
        setResult({ a, b, changes: [], error: (error as Error).message });
        setSelected(-1);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [a, b]);
  const pending = !result || result.a !== a || result.b !== b;
  if (!a.trim() || !b.trim())
    return (
      <section className="json-empty" aria-label="JSON changes">
        <Braces size={22} aria-hidden="true" />
        <div>
          <p>
            Add{" "}
            {a.trim()
              ? "Updated JSON"
              : b.trim()
                ? "Original JSON"
                : "JSON on both sides"}{" "}
            to begin
          </p>
          <p className="font-code-sm text-code-sm">
            Changes appear here as you type. Key order and formatting are
            ignored.
          </p>
        </div>
      </section>
    );
  if (pending)
    return (
      <section className="json-empty" role="status">
        Comparing JSON…
      </section>
    );
  if (result.error)
    return (
      <section className="json-error" role="alert">
        <strong>Check your JSON</strong>
        <p>{result.error}</p>
        <p className="font-code-sm text-code-sm">
          Both inputs are preserved. Correct the syntax above to compare.
        </p>
      </section>
    );
  const changes = result.changes;
  const move = (direction: number) => {
    const index = (selected + direction + changes.length) % changes.length;
    setSelected(index);
    requestAnimationFrame(() => {
      rows.current[index]?.scrollIntoView({
        block: "nearest",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      rows.current[index]
        ?.querySelector<HTMLButtonElement>(".json-path")
        ?.focus({ preventScroll: true });
    });
  };
  return (
    <section className="json-results" aria-label="JSON changes">
      <header className="json-result-toolbar">
        <div>
          <strong role="status">
            {changes.length} {changes.length === 1 ? "change" : "changes"}
          </strong>
          {changes.length > 0 && (
            <span className="json-counts font-code-sm text-code-sm">
              {["Added", "Removed", "Modified"].map((type) => {
                const count = changes.filter(
                  (change) => change.type === type,
                ).length;
                return count ? (
                  <span key={type} data-kind={type.toLowerCase()}>
                    {count} {type.toLowerCase()}
                  </span>
                ) : null;
              })}
            </span>
          )}
        </div>
        {changes.length > 0 && (
          <nav
            aria-label="JSON change navigation"
            className="font-code-sm text-code-sm"
          >
            <span>
              {selected < 0
                ? "Select a change"
                : `${selected + 1} of ${changes.length}`}
            </span>
            <Button
              aria-label="Previous change"
              onClick={() => move(selected < 0 ? changes.length : -1)}
            >
              <ChevronLeft size={14} /> Previous
            </Button>
            <Button aria-label="Next change" onClick={() => move(1)}>
              Next <ChevronRight size={14} />
            </Button>
          </nav>
        )}
      </header>
      {!changes.length ? (
        <div className="json-equal">
          <Check size={20} aria-hidden="true" />
          <div>
            <strong>JSON values match</strong>
            <p>Object key order and formatting are ignored.</p>
          </div>
        </div>
      ) : (
        <>
          <div
            className="json-table-heading font-code-sm text-code-sm"
            aria-hidden="true"
          >
            <span>Change</span>
            <span>JSON path</span>
            <span>Original value</span>
            <span>Updated value</span>
            <span />
          </div>
          {changes.map((change, index) => (
            <article
              className="json-change"
              data-kind={change.type.toLowerCase()}
              data-selected={selected === index}
              key={index}
              ref={(element) => {
                rows.current[index] = element;
              }}
            >
              <div className="json-change-row">
                <span className="json-kind font-code-sm text-code-sm">
                  {change.type === "Added"
                    ? "+"
                    : change.type === "Removed"
                      ? "−"
                      : "~"}{" "}
                  {change.type}
                </span>
                <Button
                  className="json-path font-code-md text-code-md"
                  aria-expanded={selected === index}
                  onClick={() => setSelected(selected === index ? -1 : index)}
                >
                  <code>{change.path}</code>
                  <ChevronDown size={12} aria-hidden="true" />
                </Button>
                <div className="json-old">
                  <span className="json-mobile-value-label font-code-sm text-code-sm">
                    Original
                  </span>
                  <pre className="font-code-md text-code-md">
                    {display(change.old)}
                  </pre>
                </div>
                <div className="json-new">
                  <span className="json-mobile-value-label font-code-sm text-code-sm">
                    Updated
                  </span>
                  <pre className="font-code-md text-code-md">
                    {display(change.next)}
                  </pre>
                </div>
                <Button
                  className="json-copy"
                  title="Copy JSON path"
                  aria-label={`Copy path ${change.path}`}
                  onClick={() => void copy(change.path)}
                >
                  <Copy size={14} aria-hidden="true" />
                </Button>
              </div>
              {selected === index && (
                <div className="json-context">
                  <p className="font-code-sm text-code-sm">
                    {change.segments.length
                      ? "Parent payload context"
                      : "Root payload context"}{" "}
                    · Array indices follow the displayed JSON path.
                  </p>
                  <div>
                    <section>
                      <h3 className="font-code-sm text-code-sm">Original</h3>
                      <pre className="font-code-md text-code-md">
                        {display(parentContext(result.left, change.segments))}
                      </pre>
                    </section>
                    <section>
                      <h3 className="font-code-sm text-code-sm">Updated</h3>
                      <pre className="font-code-md text-code-md">
                        {display(parentContext(result.right, change.segments))}
                      </pre>
                    </section>
                  </div>
                </div>
              )}
            </article>
          ))}
        </>
      )}
    </section>
  );
}
