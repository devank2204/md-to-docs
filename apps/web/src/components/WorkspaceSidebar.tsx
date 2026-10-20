import { useState } from 'react';
import { useStore } from '../store';

export function WorkspaceSidebar() {
  const documents = useStore((s) => s.documents);
  const activeDocumentId = useStore((s) => s.activeDocumentId);
  const snapshots = useStore((s) => s.snapshots);
  const switchDocument = useStore((s) => s.switchDocument);
  const createDocument = useStore((s) => s.createDocument);
  const duplicateDocument = useStore((s) => s.duplicateDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const renameDocument = useStore((s) => s.renameDocument);
  const setIsHistoryModalOpen = useStore((s) => s.setIsHistoryModalOpen);
  const setIsInspectorOpen = useStore((s) => s.setIsInspectorOpen);
  const themeId = useStore((s) => s.themeId);
  const setThemeId = useStore((s) => s.setThemeId);

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const activeDocSnapshots = snapshots.filter((s) => s.docId === activeDocumentId);

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

  const handleCreateNewDoc = () => {
    createDocument('', 'Untitled Document');
    if (!isDrawerOpen) setIsDrawerOpen(true);
  };

  const handleToggleTheme = () => {
    setThemeId(themeId === 'dark' ? 'default' : 'dark');
  };

  return (
    <aside
      data-print-hide
      className="flex h-full select-none shrink-0 z-20 border-r border-outline-variant/30 bg-surface-container-low transition-all duration-200"
    >
      {/* 1. VS Code-Style Activity Rail */}
      <div className="w-11 bg-surface-container-low flex flex-col items-center py-2 justify-between border-r border-outline-variant/20 shrink-0">
        {/* Top actions */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {/* File Explorer Toggle */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isDrawerOpen
                ? 'bg-surface text-primary shadow-xs border border-outline-variant/40'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
            title={isDrawerOpen ? 'Collapse Files (Ctrl+B)' : 'Expand Files (Ctrl+B)'}
          >
            <span className="material-symbols-outlined text-[17px]">description</span>
            {documents.length > 1 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center font-mono">
                {documents.length}
              </span>
            )}
          </button>

          {/* New Document Button */}
          <button
            type="button"
            onClick={handleCreateNewDoc}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="New Document (Alt+N)"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
          </button>

          <div className="w-5 h-px bg-outline-variant/30 my-0.5" />

          {/* History / Snapshots Trigger */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Document History & Snapshots"
          >
            <span className="material-symbols-outlined text-[17px]">history</span>
            {activeDocSnapshots.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center font-mono">
                {activeDocSnapshots.length}
              </span>
            )}
          </button>

          {/* Details / Inspector Trigger */}
          <button
            type="button"
            onClick={() => setIsInspectorOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Document Inspector & Fidelity Report"
          >
            <span className="material-symbols-outlined text-[17px]">info</span>
          </button>
        </div>

        {/* Bottom actions: Theme Toggle */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          <button
            type="button"
            onClick={handleToggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title={themeId === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {themeId === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Vertical File Drawer */}
      {isDrawerOpen && (
        <div className="w-52 bg-surface-container-low flex flex-col h-full overflow-hidden text-xs">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/20 shrink-0">
            <span className="font-code-sm text-[10px] uppercase font-semibold text-outline tracking-wider flex items-center gap-1">
              Documents
              <span className="text-outline/70">({documents.length})</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCreateNewDoc}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Create New Document"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
              </button>
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {documents.map((doc) => {
              const isActive = doc.id === activeDocumentId;
              const isEditing = editingId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => !isEditing && switchDocument(doc.id)}
                  onDoubleClick={() => handleStartRename(doc.id, doc.title)}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                    isActive
                      ? 'bg-surface text-primary border border-primary/20 shadow-xs font-medium'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 border border-transparent'
                  }`}
                  title={`${doc.title} (Double-click to rename)`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span
                      className={`material-symbols-outlined text-[15px] shrink-0 ${
                        isActive ? 'text-primary' : 'text-outline'
                      }`}
                    >
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
                        className="bg-surface-container border border-primary rounded px-1 py-0.5 text-xs text-on-surface focus:outline-none w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate font-sans text-xs">{doc.title || 'Untitled'}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateDocument(doc.id);
                      }}
                      className="p-0.5 rounded hover:bg-surface-container-highest text-outline hover:text-on-surface transition-colors cursor-pointer"
                      title="Duplicate this document"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (documents.length <= 1) return;
                        deleteDocument(doc.id);
                      }}
                      disabled={documents.length <= 1}
                      className="p-0.5 rounded hover:bg-surface-container-highest text-outline hover:text-error transition-colors disabled:hidden cursor-pointer"
                      title="Close document"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer Footer Tip */}
          <div className="px-3 py-1.5 border-t border-outline-variant/20 text-[10px] text-outline font-mono text-center shrink-0">
            Double-click to rename
          </div>
        </div>
      )}
    </aside>
  );
}
