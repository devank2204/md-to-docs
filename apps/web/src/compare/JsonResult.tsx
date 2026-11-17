import { Button } from "../components/Controls";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  compareJSON,
  changesFromDelta,
  jsonError,
  type Change,
  type JSONScrollPair,
} from "./model";
export type JSONReviewStatus = {
  a: string;
  b: string;
  count: number;
  ready: boolean;
  changes?: Change[];
  scrollPairs?: JSONScrollPair[];
  error?: string;
  errors?: [string | undefined, string | undefined];
};
export default function JsonResult({
  a,
  b,
  selected,
  onSelect,
  nav,
  onStatus,
}: {
  a: string;
  b: string;
  selected: number;
  onSelect: (index: number) => void;
  nav: React.MutableRefObject<((next: boolean) => void) | null>;
  onStatus: (status: JSONReviewStatus) => void;
}) {
  const [result, setResult] = useState<JSONReviewStatus>();
  const callbacks = useRef({ onStatus, onSelect });
  callbacks.current = { onStatus, onSelect };
  useEffect(() => {
    const timer = setTimeout(() => {
      let next: JSONReviewStatus;
      const errors: [string | undefined, string | undefined] = [
        !a.trim() || a.length > 200000 ? undefined : jsonError(a),
        !b.trim() || b.length > 200000 ? undefined : jsonError(b),
      ];
      try {
        if (a.length > 200000 || b.length > 200000)
          throw new Error(
            "Payload exceeds the 200,000 character comparison limit.",
          );
        if (errors.some(Boolean))
          throw new Error(
            errors
              .map((error, i) =>
                error ? `${i ? "Updated" : "Original"}: ${error}` : "",
              )
              .filter(Boolean)
              .join("\n"),
          );
        if (!a.trim() || !b.trim())
          next = { a, b, count: 0, ready: false, errors };
        else {
          const { delta, left, scrollPairs } = compareJSON(a, b);
          const changes = changesFromDelta(delta, left);
          next = {
            a,
            b,
            count: changes.length,
            changes,
            scrollPairs,
            ready: true,
            errors,
          };
        }
      } catch (error) {
        next = {
          a,
          b,
          count: 0,
          ready: false,
          error: (error as Error).message,
          errors,
        };
      }
      setResult(next);
      callbacks.current.onStatus(next);
      callbacks.current.onSelect(-1);
    }, 200);
    return () => clearTimeout(timer);
  }, [a, b]);
  const current = result?.a === a && result?.b === b;
  const ready = current && result.ready;
  const changes = ready ? (result.changes ?? []) : [];
  const move = (next: boolean) => {
    if (!changes.length) return;
    onSelect(
      selected < 0
        ? next
          ? 0
          : changes.length - 1
        : (selected + (next ? 1 : -1) + changes.length) % changes.length,
    );
  };
  useEffect(() => {
    nav.current = move;
    return () => {
      nav.current = null;
    };
  });
  const label =
    !a.trim() || !b.trim()
      ? "Add JSON on both sides to begin"
      : !current
        ? "Comparing JSON…"
        : result.error
          ? "Comparison unavailable"
          : !changes.length
            ? "JSON values match"
            : `${changes.length} ${changes.length === 1 ? "change" : "changes"}`;
  return (
    <div className="json-inline-controls">
      <span className="json-inline-status" role="status">
        {label}
      </span>
      {changes.length > 0 && (
        <span className="json-counts">
          {["Added", "Removed", "Modified"].map((type) => {
            const count = changes.filter(
              (change) => change.type === type,
            ).length;
            return count ? (
              <span key={type}>
                {count} {type.toLowerCase()}
              </span>
            ) : null;
          })}
        </span>
      )}
      <nav aria-label="JSON change navigation">
        <span className="json-change-position">
          {selected >= 0 && changes[selected]
            ? `${selected + 1} of ${changes.length}`
            : ""}
        </span>
        <Button
          aria-label="Previous change"
          title="Previous change (Shift+F7)"
          disabled={!changes.length}
          onClick={() => move(false)}
        >
          <ChevronLeft size={14} /> Previous
        </Button>
        <Button
          aria-label="Next change"
          title="Next change (F7)"
          disabled={!changes.length}
          onClick={() => move(true)}
        >
          Next <ChevronRight size={14} />
        </Button>
      </nav>
      <label className="json-jump-label">
        <span className="sr-only">Jump to JSON change</span>
        <select
          aria-label="Jump to JSON change"
          disabled={!changes.length}
          value={changes[selected] ? selected : -1}
          onChange={(event) => onSelect(Number(event.target.value))}
        >
          <option value={-1} disabled>
            Jump to changed field…
          </option>
          {changes.map((change, index) => (
            <option key={index} value={index}>
              {change.type === "Added"
                ? "+"
                : change.type === "Removed"
                  ? "−"
                  : "~"}{" "}
              {change.path}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
