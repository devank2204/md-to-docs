import { useState } from "react";
import { useStore } from "@/store";
import { Button } from "./Controls";
export function RenameTitle({
  id,
  compact = false,
}: {
  id?: string;
  compact?: boolean;
}) {
  const active = useStore((s) => s.activeDocumentId);
  const doc = useStore((s) => s.documents.find((d) => d.id === (id || active)));
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  if (!doc) return null;
  return editing ? (
    <input
      aria-label="Document name"
      className="ux-rename-input"
      autoFocus
      value={value}
      maxLength={100}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          useStore.getState().renameDocument(doc.id, value);
          setEditing(false);
        }
        if (e.key === "Escape") setEditing(false);
      }}
    />
  ) : (
    <Button
      className={`ux-rename ${compact ? "ux-rename-compact" : ""}`}
      title={`Rename ${doc.title}`}
      aria-label={`Rename ${doc.title}`}
      onClick={() => {
        setValue(doc.title);
        setEditing(true);
      }}
    >
      {!compact && <span className="ux-rename-label">{doc.title}</span>}
      <span className="ux-rename-pencil" aria-hidden="true">✎</span>
    </Button>
  );
}
