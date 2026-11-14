import { useState } from 'react';
import { THEMES } from '@mdtodocs/compiler-core/src/theme';
import type { DocumentDiagnostic } from '@mdtodocs/compiler-core';
import { useStore } from '@/store';
import { LinkedReview } from './LinkedReview';
import { WorkspaceSheet } from './WorkspaceSheet';
import { mobileDestinations } from '@/utils/mobileDestinations';
import type { MobileSheet } from '@/utils/mobileDestinations';
import type { ExportTarget, Signature } from '@/utils/exportHelpers';

interface Props {
  onImport: () => void;
  pageLayout: boolean;
  setPageLayout: (value: boolean) => void;
  sheet: MobileSheet;
  setSheet: (sheet: MobileSheet | null) => void;
  target: ExportTarget;
  chooseTarget: (target: ExportTarget) => void;
  setTab: (tab: 'edit' | 'preview') => void;
  pendingImport: string | null;
  setPendingImport: (value: string | null) => void;
  onInput: (value: string) => void;
  warnings: DocumentDiagnostic[];
  compilationError: boolean;
  isCompiling: boolean;
}
export function MobileWorkspaceSheets({
  onImport, pageLayout, setPageLayout,
  sheet,
  setSheet,
  target,
  chooseTarget,
  setTab,
  pendingImport,
  setPendingImport,
  onInput,
  warnings,
  compilationError,
  isCompiling,
}: Props) {
  const store = useStore();
  const documentSignature = store.documentSignature;
  const [renaming, setRenaming] = useState(
    store.documents.find((doc) => doc.id === store.activeDocumentId)?.title ||
      'Untitled document',
  );
  return (
    <WorkspaceSheet
      key={sheet}
      title={
        {
          documents: 'Your documents',
          destination: 'Save as',
          options: 'Document options',
          notes: 'Formatting notes',
          import: 'Bring in this text',
          history: 'Document history',
        }[sheet]
      }
      onClose={() => setSheet(null)}
    >
      {sheet === 'destination' && (
        <div className="sheet-list">
          {mobileDestinations.map((item) => (
            <button
              type="button"
              key={item.value}
              aria-pressed={target === item.value}
              onClick={() => chooseTarget(item.value)}
            >
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
              <span aria-hidden="true">
                {target === item.value ? '✓' : '→'}
              </span>
            </button>
          ))}
        </div>
      )}
      {sheet === 'documents' && (
        <>
          <p className="sheet-description">
            Saved in this browser on this device.
          </p>
          <div className="sheet-list">
            {store.documents.map((doc) => (
              <button
                type="button"
                key={doc.id}
                aria-current={
                  doc.id === store.activeDocumentId ? 'true' : undefined
                }
                onClick={() => {
                  store.switchDocument(doc.id);
                  setTab('edit');
                  setSheet(null);
                }}
              >
                <span className="truncate">{doc.title}</span>
                <span aria-hidden="true">
                  {doc.id === store.activeDocumentId ? '✓' : '→'}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                store.createDocument();
                setTab('edit');
                setSheet(null);
              }}
            >
              ＋ New document
            </button>
          </div>
          <button type="button" className="mobile-secondary" onClick={onImport}>Import Markdown file</button>
          <p className="sheet-description">
            Up to five documents. At capacity, choose one to replace; a recoverable version is saved first.
          </p>
        </>
      )}
      {sheet === 'options' && (
        <div className="sheet-options">
          <button type="button" className="mobile-secondary" aria-pressed={pageLayout} onClick={() => setPageLayout(!pageLayout)}>{pageLayout ? 'Use reading view' : 'Use page layout'}</button>

          <label>
            Document name
            <input
              value={renaming}
              onChange={(e) => setRenaming(e.target.value)}
              maxLength={100}
            />
          </label>
          <button
            className="mobile-secondary"
            type="button"
            onClick={() => {
              store.renameDocument(store.activeDocumentId, renaming);
              setSheet(null);
            }}
          >
            Save name
          </button>
          <label>
            Document style
            <select
              value={store.themeId}
              onChange={(e) =>
                store.setThemeId(e.target.value as keyof typeof THEMES)
              }
            >
              {Object.keys(THEMES).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Text size
            <select
              value={store.baseFontSize}
              onChange={(e) => store.setBaseFontSize(Number(e.target.value))}
            >
              {[10, 11, 12, 14, 16, 18].map((size) => (
                <option key={size} value={size}>
                  {size} pt
                </option>
              ))}
            </select>
          </label>
          <label className="signature-option">
            <span>Include document signature</span>
            <input
              type="checkbox"
              checked={documentSignature.enabled}
              onChange={(e) =>
                store.setDocumentSignature({
                  ...documentSignature,
                  enabled: e.target.checked,
                })
              }
            />
          </label>
          {documentSignature.enabled && (
            <label>
              Signature placement
              <select
                value={documentSignature.placement}
                onChange={(e) =>
                  store.setDocumentSignature({
                    ...documentSignature,
                    placement: e.target.value as Signature['placement'],
                  })
                }
              >
                <option value="last-page">Last page</option>
                <option value="every-page">Every page</option>
              </select>
            </label>
          )}
          <div className="sheet-list">
            <button
              type="button"
              onClick={() => {
                store.createSnapshot();
                setSheet(null); store.setIsHistoryModalOpen(true);
              }}
            >
              Save a version
            </button>
            <button type="button" onClick={() => {setSheet(null);store.setIsHistoryModalOpen(true)}}>
              Version history
            </button>
            {store.markdown.trim() && <button type="button" onClick={() => {
              if(!store.createSnapshot('Before clearing text'))return;
              onInput('');
              setTab('edit');
              setSheet(null);
            }}>Clear all text</button>}
            <a href="/mermaid-to-svg/">
              Mermaid diagram tools <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      )}
      {sheet === 'notes' && (
        <LinkedReview notes={warnings} pending={isCompiling || compilationError} onNavigate={(view) => { setTab(view); setSheet(null); }} />
      )}
      {sheet === 'import' && (
        <div className="sheet-options">
          <p>Your current document is saved. Where should the new text go?</p>
          <button
            className="mobile-primary"
            type="button"
            onClick={() => {
              store.createDocument(pendingImport || '');
              setPendingImport(null);
              setTab('edit');
              setSheet(null);
            }}
          >
            Open as new document
          </button>
          <button
            className="mobile-secondary"
            type="button"
            onClick={() => {
              store.createSnapshot('Before replacing text');
              onInput(pendingImport || '');
              setPendingImport(null);
              setTab('edit');
              setSheet(null);
            }}
          >
            Replace current text
          </button>
        </div>
      )}
      {sheet === 'history' && (
        <div className="sheet-list">
          {store.snapshots
            .filter((snap) => snap.docId === store.activeDocumentId)
            .map((snap) => (
              <button
                type="button"
                key={snap.id}
                onClick={() => {
                  store.restoreSnapshot(snap.id);
                  setTab('edit');
                  setSheet(null);
                }}
              >
                <span>
                  <strong>{snap.label}</strong>
                  <small>{new Date(snap.timestamp).toLocaleString()}</small>
                </span>
                <span>Restore</span>
              </button>
            ))}
          {!store.snapshots.some(
            (snap) => snap.docId === store.activeDocumentId,
          ) && (
            <p className="sheet-description">
              No saved versions yet. Use “Save a version” in document options.
            </p>
          )}
        </div>
      )}
    </WorkspaceSheet>
  );
}
