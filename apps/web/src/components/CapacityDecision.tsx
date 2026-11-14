import { useState } from "react";
import { useStore } from "@/store";
import { WorkspaceSheet } from "./WorkspaceSheet";
import { Button } from "./Controls";
export function CapacityDecision() {
  const pending = useStore((s) => s.pendingDocument);
  const docs = useStore((s) => s.documents);
  const [error, setError] = useState("");
  if (!pending) return null;
  return (
    <WorkspaceSheet
      title="Choose a document to replace"
      onClose={() => {
        useStore.getState().resolveCapacity();
        setError("");
      }}
    >
      <p className="sheet-description">
        Five documents are already open. Choose one to replace with{" "}
        {pending.title}. Its current source will be saved in recoverable history
        first.
      </p>
      {docs.map((d) => (
        <Button
          key={d.id}
          onClick={() => {
            if (!useStore.getState().resolveCapacity(d.id))
              setError(
                "Could not save a recovery copy. Nothing was replaced. Free browser storage or cancel.",
              );
          }}
        >
          Replace {d.title}
        </Button>
      ))}
      {error && <p role="alert">{error}</p>}
      <Button onClick={() => useStore.getState().resolveCapacity()}>
        Cancel
      </Button>
    </WorkspaceSheet>
  );
}
