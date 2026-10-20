import { useState } from 'react';
import { useStore } from '../store';
import type { DocumentSnapshot } from '@mdtodocs/renderers';

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentHistoryModal(props: DocumentHistoryModalProps) {
  if (!props.isOpen) return null;
  return <DocumentHistoryModalContent {...props} />;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DocumentHistoryModalContent({ onClose }: DocumentHistoryModalProps) {

  const snapshots = useStore((s) => s.snapshots);
  const activeDocumentId = useStore((s) => s.activeDocumentId);
  const documents = useStore((s) => s.documents);
  const createSnapshot = useStore((s) => s.createSnapshot);
  const restoreSnapshot = useStore((s) => s.restoreSnapshot);
  const deleteSnapshot = useStore((s) => s.deleteSnapshot);

  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  const [filterScope, setFilterScope] = useState<'current' | 'all'>('current');
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  const displayedSnapshots = snapshots.filter((s) =>
    filterScope === 'current' ? s.docId === activeDocumentId : true
  );

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    createSnapshot(newSnapshotLabel.trim() || 'Manual Checkpoint');
    setNewSnapshotLabel('');
    setRestoreFeedback('Snapshot created successfully!');
    setTimeout(() => setRestoreFeedback(null), 2500);
  };

  const handleRestore = (snap: DocumentSnapshot) => {
    if (
      confirm(
        `Restore document to snapshot "${snap.label}" from ${new Date(
          snap.timestamp
        ).toLocaleTimeString()}? (A safety backup of your current draft will be saved automatically)`
      )
    ) {
      restoreSnapshot(snap.id);
      setRestoreFeedback(`Document restored to "${snap.label}"!`);
      setTimeout(() => {
        setRestoreFeedback(null);
        onClose();
      }, 1200);
    }
  };

  const handleCopyContent = async (snap: DocumentSnapshot) => {
    try {
      await navigator.clipboard.writeText(snap.content);
      setCopiedId(snap.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy snapshot content', err);
    }
  };

  return (

    <div
      data-print-hide
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-high border border-outline-variant/60 rounded-2xl shadow-2xl max-w-3xl w-full p-6 text-on-surface overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg text-on-surface tracking-tight">
                Document History & Version Snapshots
              </h2>
              <p className="text-xs text-on-surface-variant">
                Active Document:{' '}
                <span className="text-primary font-medium">
                  {activeDoc?.title || 'Untitled Document'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1.5 rounded-lg transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Snapshot Creation Bar */}
        <form
          onSubmit={handleCreateSnapshot}
          className="flex items-center gap-2 py-3 border-b border-outline-variant/40"
        >
          <input
            type="text"
            value={newSnapshotLabel}
            onChange={(e) => setNewSnapshotLabel(e.target.value)}
            placeholder="Snapshot label (e.g. Pre-Review Draft, Sprint Final)..."
            className="flex-1 bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
            <span>Capture Snapshot</span>
          </button>
        </form>

        {/* Filter scope bar */}
        <div className="flex items-center justify-between py-2.5 border-b border-outline-variant/40 text-xs">
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/50">
            <button
              onClick={() => setFilterScope('current')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterScope === 'current'
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Current Document ({snapshots.filter((s) => s.docId === activeDocumentId).length})
            </button>
            <button
              onClick={() => setFilterScope('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterScope === 'all'
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Snapshots ({snapshots.length})
            </button>
          </div>

          {restoreFeedback && (
            <div className="text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              <span>{restoreFeedback}</span>
            </div>
          )}
        </div>

        {/* Snapshots Timeline List */}
        <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-3 pr-1">
          {displayedSnapshots.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-outline text-[40px] mb-2">
                history_toggle_off
              </span>
              <p className="text-sm font-medium">No snapshots recorded yet</p>
              <p className="text-xs text-outline mt-1">
                Click &quot;Capture Snapshot&quot; above to save a point-in-time version before major revisions.
              </p>
            </div>
          ) : (
            displayedSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="bg-surface-container-low border border-outline-variant/50 hover:border-primary/40 rounded-xl p-3.5 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      bookmark
                    </span>
                    <span className="font-semibold text-xs text-on-surface">{snap.label}</span>
                    <span className="text-[11px] text-outline">
                      • {formatRelativeTime(snap.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {snap.wordCount} words • {snap.lineCount} lines
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyContent(snap)}
                      className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors ml-1"
                      title="Copy snapshot Markdown"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedId === snap.id ? 'check' : 'content_copy'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSnapshot(snap.id)}
                      className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                      title="Delete snapshot"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRestore(snap)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-on-primary text-xs font-semibold transition-all ml-1"
                      title="Restore document to this snapshot"
                    >
                      <span className="material-symbols-outlined text-[14px]">restore</span>
                      <span>Restore</span>
                    </button>
                  </div>
                </div>

                {/* Excerpt preview */}
                <div className="text-[11px] font-mono text-on-surface-variant bg-surface-container/60 border border-outline-variant/30 rounded-lg p-2 max-h-16 overflow-hidden line-clamp-2 select-text">
                  {snap.content.slice(0, 220)}...
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-outline-variant/40 pt-3 mt-1">
          <span className="text-[11px] text-outline">
            Snapshots are saved locally and automatically before restores and template loads.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3.5 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
