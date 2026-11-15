import { useState } from "react";
import { useStore } from "@/store";
export function RenameTitle({
  id,
  compact: _compact,
}: {
  id?: string;
  compact?: boolean;
}) {
  const active = useStore((s) => s.activeDocumentId);
  const doc = useStore((s) => s.documents.find((d) => d.id === (id || active)));
  if (!doc) return null;
  return <DocumentName key={doc.id} id={doc.id} title={doc.title} />;
}
function DocumentName({ id, title }: { id: string; title: string }) {
  const [draft, setDraft] = useState({ title, value: title });
  const [focused, setFocused] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  if (!focused && !dirty && draft.title !== title)
    setDraft({ title, value: title });
  const value = draft.value;
  const setValue = (value: string) => setDraft({ title, value });
  const save = () => {
    const normalized = value.trim();
    if (normalized) useStore.getState().renameDocument(id, normalized);
    setValue(normalized || title);
    setFocused(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };
  return (
    <form
      className="document-name"
      onClick={e=>{if(e.target===e.currentTarget)e.currentTarget.querySelector("input")?.focus()}}
      onSubmit={(e) => {
        e.preventDefault();
        save();
        (e.currentTarget.querySelector("input") as HTMLInputElement)?.blur();
      }}
    >
      <input
        aria-label="Document name"
        value={value}
        maxLength={100}
        onFocus={() => {
          setFocused(true);
          setSaved(false);
        }}
        onChange={(e) => {
          setValue(e.target.value);
          setDirty(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setValue(title);
            setDirty(false);
            setFocused(false);
            e.currentTarget.blur();
          }
        }}
        onBlur={() => setFocused(false)}
      />
      <button
        type="submit"
        aria-label="Save document name"
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          check
        </span>
      </button>
      <span aria-live="polite" className="sr-only">
        {saved ? "Document name saved." : ""}
      </span>
    </form>
  );
}
