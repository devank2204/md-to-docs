import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { safetyVersions } from "@/utils/safetyBackup";
import { VersionDiff } from "./VersionDiff";
import { WorkspaceSheet } from "./WorkspaceSheet";
import { Button } from "./Controls";
export function DocumentHistoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return isOpen ? <History onClose={onClose} /> : null;
}
function History({ onClose }: { onClose: () => void }) {
  const [saveOpen, setSaveOpen] = useState(false);
  const documents = useStore((s) => s.documents);
  const snapshots = useStore((s) => s.snapshots);
  const id = useStore((s) => s.activeDocumentId);
  const markdown = useStore((s) => s.markdown);
  const [all, setAll] = useState(false);
  const [label, setLabel] = useState("");
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const versions = useMemo(() => {
    const merged = new Map(
      [...safetyVersions(), ...snapshots].map((s) => [s.id, s]),
    );
    return [...merged.values()]
      .filter((s) => all || s.docId === id)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [snapshots, id, all]);
  const version = versions.find((s) => s.id === selected) || versions[0];
  return (
    <WorkspaceSheet
      title="Version history"
      className="history-sheet"
      onClose={onClose}
    >
      <p className="history-document">
        {documents.find((d) => d.id === id)?.title}
      </p>
      <div className="history-toolbar">
        <div
          className="history-scope"
          role="tablist"
          aria-label="Version scope"
        >
          <button role="tab" aria-selected={!all} onClick={() => setAll(false)}>
            This document
          </button>
          <button role="tab" aria-selected={all} onClick={() => setAll(true)}>
            All documents
          </button>
        </div>
        <div className="history-save">
          <Button
            onClick={() => setSaveOpen(!saveOpen)}
            aria-expanded={saveOpen}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              add
            </span>
            Save version
          </Button>
          {saveOpen && (
            <form
              className="history-save-form"
              onSubmit={(e) => {
                e.preventDefault();
                const ok = useStore
                  .getState()
                  .createSnapshot(label.trim() || undefined);
                if (ok) {
                  setLabel("");
                  setSaveOpen(false);
                }
                setMessage(
                  ok
                    ? "Version saved."
                    : "Could not save this version. Your document is unchanged.",
                );
              }}
            >
              <input
                aria-label="Version name (optional)"
                placeholder="Version name (optional)"
                className="min-w-0 bg-transparent border rounded px-2"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Button type="submit">Save</Button>
            </form>
          )}
        </div>
      </div>
      <p role="status">{message}</p>
      <div className="ux-version-browser">
        <div className="ux-version-list" aria-label="Saved versions">
          {versions.length ? (
            versions.map((s) => (
              <Button
                state={s.id === version?.id ? "selected" : "idle"}
                key={s.id}
                onClick={() => setSelected(s.id)}
              >
                <strong>{s.label}</strong>
                <br />
                <time dateTime={new Date(s.timestamp).toISOString()}>
                  {new Date(s.timestamp).toLocaleString()}
                </time>
                <br />
                {all ? s.docTitle : ""}
              </Button>
            ))
          ) : (
            <p>No saved versions yet.</p>
          )}
        </div>
        {version ? (
          <VersionDiff before={version.content} after={markdown} />
        ) : (
          <p>Save a version before revising your document.</p>
        )}
      </div>
      {version && (
        <div className="ux-history-actions">
          <Button
            onClick={() =>
              navigator.clipboard
                .writeText(version.content)
                .then(() => setMessage("Saved Markdown copied."))
                .catch(() =>
                  setMessage("Copy unavailable. Your version is unchanged."),
                )
            }
          >
            Copy saved Markdown
          </Button>
          <Button
            className="history-restore"
            onClick={() => {
              if (
                !confirm(
                  "Restore this version? Your current document must be saved as a recoverable copy first.",
                )
              )
                return;
              setSelected(version.id);
              const ok = useStore.getState().restoreSnapshot(version.id);
              setMessage(
                ok
                  ? "Version restored. The previous document is in recovery history."
                  : "Could not save a recovery copy. Nothing was changed.",
              );
            }}
          >
            Restore this version
          </Button>
        </div>
      )}
    </WorkspaceSheet>
  );
}
