import { useRef, useState } from 'react';
import { Clipboard, Ellipsis, FileDown, FileText, Image, Plus, SquarePen, Workflow } from 'lucide-react';
import { Menu } from './Controls';
import { useStore } from '../store';
import type { LandingRoutePath } from '@/routes/landingData';

export function WorkspaceSidebar({ onNavigateRoute }: { onNavigateRoute: (path: LandingRoutePath) => void }) {
  const documents = useStore((s) => s.documents);
  const activeDocumentId = useStore((s) => s.activeDocumentId);
  const switchDocument = useStore((s) => s.switchDocument);
  const createDocument = useStore((s) => s.createDocument);
  const duplicateDocument = useStore((s) => s.duplicateDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const renameDocument = useStore((s) => s.renameDocument);
  const setIsHistoryModalOpen = useStore((s) => s.setIsHistoryModalOpen);
  const setIsAboutModalOpen = useStore((s) => s.setIsAboutModalOpen);
  const isSidebarOpen = useStore((s) => s.isSidebarOpen);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const renameCancelled = useRef(false);

  const startRename = (id: string, title: string) => {
    renameCancelled.current = false;
    setEditingId(id);
    setEditingTitle(title);
  };
  const saveRename = (id: string) => {
    if (!renameCancelled.current && editingTitle.trim()) renameDocument(id, editingTitle.trim());
    setEditingId(null);
  };
  const navigate: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigateRoute(event.currentTarget.dataset.route as LandingRoutePath);
    if (event.currentTarget.dataset.editor === 'markdown') {
      requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('[data-editor-pane] textarea')?.focus());
    }
  };
  if (!isSidebarOpen) return null;

  return (
    <aside className="workspace-sidebar" aria-label="Documents and tools" data-print-hide>
      <div className="workspace-sidebar-scroll">
        <section aria-labelledby="sidebar-documents-heading">
          <div className="workspace-sidebar-heading">
            <h2 id="sidebar-documents-heading">Documents</h2>
            <button type="button" className="workspace-sidebar-icon" aria-label="Create New Document" title="Create New Document" onClick={() => createDocument('', 'Untitled Document')}><Plus aria-hidden="true" /></button>
          </div>
          <div className="workspace-sidebar-documents">
            {documents.map((doc) => (
              <div key={doc.id} className="workspace-sidebar-document" data-active={doc.id === activeDocumentId}>
                {editingId === doc.id ? (
                  <div className="workspace-sidebar-rename">
                    <FileText aria-hidden="true" />
                    <input autoFocus aria-label="Document name" value={editingTitle}
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onBlur={() => saveRename(doc.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') { event.preventDefault(); saveRename(doc.id); }
                        if (event.key === 'Escape') { event.preventDefault(); renameCancelled.current = true; setEditingId(null); }
                      }} />
                  </div>
                ) : (
                  <button type="button" className="workspace-sidebar-document-select" aria-pressed={doc.id === activeDocumentId} title={doc.title || 'Untitled'} onClick={() => switchDocument(doc.id)} onDoubleClick={() => startRename(doc.id, doc.title)}>
                    <FileText aria-hidden="true" /><span>{doc.title || 'Untitled'}</span>
                  </button>
                )}
                <Menu label={<Ellipsis aria-hidden="true" />} accessibleLabel={`More actions for ${doc.title || 'Untitled'}`}>
                  <button type="button" onClick={() => startRename(doc.id, doc.title)}>Rename</button>
                  <button type="button" onClick={() => duplicateDocument(doc.id)}>Duplicate</button>
                  <button type="button" onClick={() => { switchDocument(doc.id); setIsHistoryModalOpen(true); }}>Version history</button>
                  <button type="button" disabled={documents.length <= 1} onClick={() => deleteDocument(doc.id)}>Close document</button>
                </Menu>
              </div>
            ))}
          </div>
        </section>
        <div className="workspace-sidebar-divider" />
        <section aria-labelledby="sidebar-tools-heading">
          <h2 id="sidebar-tools-heading" className="workspace-sidebar-heading">Tools</h2>
          <nav className="workspace-sidebar-tools" aria-label="Compare tools"><h3>Compare</h3><a href="/text-compare/"><SquarePen aria-hidden="true"/><span>Text Compare</span></a><a href="/json-compare/"><FileText aria-hidden="true"/><span>JSON Compare</span></a></nav>
          <nav className="workspace-sidebar-tools" aria-label="Document tools">
            <h3>Documents</h3>
            <a href="/markdown-to-word/" data-route="/markdown-to-word" onClick={navigate}><FileDown aria-hidden="true" /><span>Markdown to Word</span></a>
            <a href="/markdown-to-google-docs/" data-route="/markdown-to-google-docs" onClick={navigate}><Clipboard aria-hidden="true" /><span>Markdown to Google Docs</span></a>
            <a href="/" data-route="/" data-editor="markdown" onClick={navigate}><SquarePen aria-hidden="true" /><span>Markdown editor</span></a>
          </nav>
          <nav className="workspace-sidebar-tools" aria-label="Diagram tools">
            <h3>Diagrams</h3>
            <a href="/mermaid-to-svg/" data-route="/mermaid-to-svg" onClick={navigate}><Workflow aria-hidden="true" /><span>Mermaid editor</span></a>
            <a href="/mermaid-to-png/" data-route="/mermaid-to-png" onClick={navigate}><Image aria-hidden="true" /><span>Mermaid to SVG / PNG</span></a>
          </nav>
        </section>
        <nav className="workspace-sidebar-footer" aria-label="Supporting links">
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("mdtodocs:support", {detail:"privacy"}))}>Privacy</button><span aria-hidden="true">·</span>
          <button type="button" onClick={() => setIsAboutModalOpen(true)}>About</button><span aria-hidden="true">·</span>
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("mdtodocs:support", {detail:"feedback"}))}>Feedback</button>
        </nav>
      </div>
    </aside>
  );
}
