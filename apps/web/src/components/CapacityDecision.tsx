import { useState } from "react";
import { useStore } from "@/store";
import { WorkspaceSheet } from "./WorkspaceSheet";
import { Button } from "./Controls";
export function CapacityDecision() {
  const pending = useStore((s) => s.pendingDocument);
  const docs = useStore((s) => s.documents);
  const capacity = useStore((s) => s.documentCapacity);
  const [error, setError] = useState("");
  if (!pending) return null;
  return (
    <WorkspaceSheet
      title="Make room for this document"
      onClose={() => {
        useStore.getState().resolveCapacity();
        setError("");
      }}
    >
      <p className="sheet-description">
        You have {docs.length} documents open. Remove one to open “
        {pending.title}”, or open it anyway and increase your limit to{" "}
        {Math.max(capacity, docs.length + 1)}. A recovery copy is saved before
        removal.
      </p>
      <ul className="capacity-list">
        {docs.map((doc) => (
          <li key={doc.id}>
            <span title={doc.title}>{doc.title}</span>
            <Button
              onClick={() => {
                if (!useStore.getState().resolveCapacity(doc.id))
                  setError(
                    "Could not save a recovery copy. Nothing was removed. Free browser storage or cancel.",
                  );
              }}
              aria-label={`Remove ${doc.title}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}
      <div className="capacity-actions">
        <Button onClick={() => useStore.getState().resolveCapacity()}>
          Cancel import
        </Button>
        <Button
          onClick={() => {
            useStore.getState().openPendingAnyway();
            setError("");
          }}
        >
          Open anyway
        </Button>
      </div>
    </WorkspaceSheet>
  );
}
