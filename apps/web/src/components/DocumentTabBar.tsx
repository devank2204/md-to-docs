import { useState } from 'react';
import { useStore } from '../store';

export function DocumentTabBar() {
  const documents = useStore((s) => s.documents);
  const activeDocumentId = useStore((s) => s.activeDocumentId);
  const snapshots = useStore((s) => s.snapshots);
  const switchDocument = useStore((s) => s.switchDocument);
  const createDocument = useStore((s) => s.createDocument);
  const duplicateDocument = useStore((s) => s.duplicateDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const renameDocument = useStore((s) => s.renameDocument);
  const setIsHistoryModalOpen = useStore((s) => s.setIsHistoryModalOpen);
  const createSnapshot = useStore((s) => s.createSnapshot);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [snapshotToast, setSnapshotToast] = useState(false);

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      renameDocument(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDownRename = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleQuickSnapshot = () => {
    createSnapshot('Manual Checkpoint');
    setSnapshotToast(true);
    setTimeout(() => setSnapshotToast(false), 2000);
  };

  const activeDocSnapshots = snapshots.filter((s) => s.docId === activeDocumentId);

  return (
    <div
      data-print-hide
      className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-low px-3 py-1 text-xs select-none"
    >
      {/* Horizontal Tabs List */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-[calc(100%-200px)]">
        {documents.map((doc) => {
          const isActive = doc.id === activeDocumentId;
          const isEditing = editingId === doc.id;

          return (
            <div
              key={doc.id}
              onClick={() => !isEditing && switchDocument(doc.id)}
              onDoubleClick={() => handleStartRename(doc.id, doc.title)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all border shrink-0 max-w-[200px] ${
                isActive
                  ? 'bg-surface-container-high text-primary border-primary/30 shadow-sm'
                  : 'bg-surface-container-low/70 text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-transparent'
              }`}
              title={doc.title}
            >
              <span className="material-symbols-outlined text-[15px] shrink-0">
                {isActive ? 'description' : 'draft'}
              </span>

              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleSaveRename(doc.id)}
                  onKeyDown={(e) => handleKeyDownRename(e, doc.id)}
                  className="bg-surface-container border border-primary rounded px-1 py-0.5 text-xs text-on-surface focus:outline-none w-28"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate max-w-[120px] font-sans text-xs">
                  {doc.title || 'Untitled'}
                </span>
              )}

              {/* Tab Actions */}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Close document "${doc.title}"?`)) {
                      deleteDocument(doc.id);
                    }
                  }}
                  className="p-0.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors"
                  title="Close document"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* New Document Button */}
        <button
          type="button"
          onClick={() => createDocument('', 'Untitled Document')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
          title="Create New Document (Ctrl+Alt+N)"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span className="hidden sm:inline text-[11px] font-medium">New Doc</span>
        </button>
      </div>

      {/* Right side history & snapshot controls */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        {/* Quick Save Checkpoint */}
        <button
          type="button"
          onClick={handleQuickSnapshot}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Save point-in-time snapshot of current document"
        >
          <span className="material-symbols-outlined text-[15px]">bookmark_add</span>
          <span className="hidden lg:inline">{snapshotToast ? 'Saved!' : 'Snapshot'}</span>
        </button>

        {/* History Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsHistoryModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-outline-variant/60 bg-surface-container hover:bg-surface-container-highest text-on-surface transition-colors"
          title="Browse Document History & Snapshots"
        >
          <span className="material-symbols-outlined text-[15px]">history</span>
          <span className="hidden sm:inline">History</span>
          {activeDocSnapshots.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
              {activeDocSnapshots.length}
            </span>
          )}
        </button>

        {/* Duplicate Current Doc */}
        <button
          type="button"
          onClick={() => duplicateDocument(activeDocumentId)}
          className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Duplicate current document as a copy"
        >
          <span className="material-symbols-outlined text-[16px]">content_copy</span>
        </button>
      </div>
    </div>
  );
}
