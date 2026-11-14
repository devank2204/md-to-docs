import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { safetyVersions } from "@/utils/safetyBackup";
import { VersionDiff } from "./VersionDiff";
import { WorkspaceSheet } from "./WorkspaceSheet";
import { Button, Toggle } from "./Controls";
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
    <WorkspaceSheet title="Version history" onClose={onClose}>
      <form
        className="flex flex-wrap gap-2 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          const ok = useStore
            .getState()
            .createSnapshot(label.trim() || undefined);
          if (ok) setLabel("");
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
        <Button type="submit">Save version</Button>
      </form>
      <Toggle selected={all} onClick={() => setAll(!all)}>
        Include other documents and recovery copies
      </Toggle>
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
        <div className="flex flex-wrap gap-2 pt-3">
          <Button
            onClick={() => {
              if (
                !confirm(
                  "Restore this version? Your current document must be saved as a recoverable copy first.",
                )
              )
                return;
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
        </div>
      )}
    </WorkspaceSheet>
  );
}
