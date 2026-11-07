import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { deviceStorageHealth } from '@/utils/deviceStorage';
import type {
  DocumentTheme,
  DocumentDiagnostic,
} from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { useStore } from '@/store';
import { DocumentPreview } from './DocumentPreview';
import { MobileExportBar } from './MobileExportBar';
import { HomeIntroduction } from './HomeIntroduction';
import { BrandWordmark } from './BrandWordmark';
import { MobileWorkspaceSheets } from './MobileWorkspaceSheets';
import type { MobileSheet } from '@/utils/mobileDestinations';
import { useDocumentExport } from '@/hooks/useDocumentExport';
import { DOCUMENT_TEMPLATES } from '@/data/templates';
import { analytics, getDocLengthBucket } from '@/utils/analytics';
import type { ExportTarget, Signature } from '@/utils/exportHelpers';

// A conservative browser input budget, not a promise about device performance.
export const MAX_IMPORT_BYTES = 1_000_000;
interface Props {
  markdown: string;
  onInput: (value: string) => void;
  destination: DestinationType;
  onDestinationChange: (value: DestinationType) => void;
  activeTheme: DocumentTheme;
  documentSignature: Signature;
  isCompiling: boolean;
  diagnostics: DocumentDiagnostic[];
  compilationError: boolean;
}

export function MobileWorkspace(props: Props) {
  const {
    markdown,
    onInput,
    destination,
    onDestinationChange,
    activeTheme,
    documentSignature,
    isCompiling,
    diagnostics,
    compilationError,
  } = props;
  const store = useStore();
  const storageAvailable = useSyncExternalStore(
    deviceStorageHealth.subscribe,
    deviceStorageHealth.getSnapshot,
    () => true,
  );
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [sheet, setSheet] = useState<MobileSheet | null>(null);
  const [pageLayout, setPageLayout] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const { htmlOutput, setHtmlOutput } = store;
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const hasContent = !!markdown.trim();
  const title =
    store.documents.find((doc) => doc.id === store.activeDocumentId)?.title ||
    'Untitled document';
  const target: ExportTarget =
    htmlOutput && destination === 'clipboard' ? 'html' : destination;
  const output = useDocumentExport(
    {
      markdown,
      destination: target,
      theme: activeTheme,
      signature: documentSignature,
      title,
    },
    store.activeDocumentId,
  );
  const warnings = diagnostics.filter(
    (d) => d.severity === 'warning' || d.severity === 'error',
  );

  useEffect(() => {
    const viewport = window.visualViewport;
    let baseline = viewport?.height || window.innerHeight;
    const update = () => {
      const focused = document.activeElement === editor.current;
      const height = viewport?.height || window.innerHeight;
      if (!focused) baseline = Math.max(height, baseline);
      const open = focused && baseline - height > 140;
      setKeyboardOpen(open);
      // Size to the visible viewport only while editing with a soft keyboard.
      document.documentElement.style.setProperty(
        '--mobile-height',
        open ? `${height}px` : '100dvh',
      );
    };
    const rotate = () => {
      baseline = viewport?.height || window.innerHeight;
      update();
    };
    viewport?.addEventListener('resize', update);
    window.addEventListener('focusin', update);
    window.addEventListener('focusout', update);
    window.addEventListener('orientationchange', rotate);
    return () => {
      viewport?.removeEventListener('resize', update);
      window.removeEventListener('focusin', update);
      window.removeEventListener('focusout', update);
      window.removeEventListener('orientationchange', rotate);
      document.documentElement.style.removeProperty('--mobile-height');
    };
  }, []);

  const switchTab = (next: 'edit' | 'preview') => {
    if (next === 'preview') {
      editor.current?.blur();
      analytics.track('mobile_preview', { destination: target });
    }
    setTab(next);
  };
  const receiveInput = (value: string, action: 'paste' | 'drop' | 'sample') => {
    analytics.track('editor_action', {
      action,
      docLengthBucket: getDocLengthBucket(value.length),
    });
    if (hasContent) {
      setPendingImport(value);
      setSheet('import');
    } else {
      onInput(value);
      setInputMessage('');
      setTab('edit');
    }
  };
  const paste = async () => {
    const sourceId = store.activeDocumentId;
    try {
      const text = await navigator.clipboard.readText();
      if (useStore.getState().activeDocumentId !== sourceId) {
        setInputMessage(
          'Document changed while reading the clipboard. Tap Paste again.',
        );
        return;
      }
      if (!text.trim()) {
        setInputMessage(
          'Your clipboard has no text. Paste Markdown or choose a file.',
        );
        return;
      }
      if (new Blob([text]).size > MAX_IMPORT_BYTES) {
        setInputMessage(
          'Use a document smaller than 1 MB. Your current text is unchanged.',
        );
        return;
      }
      if (useStore.getState().markdown.trim()) {
        setPendingImport(text);
        setSheet('import');
      } else receiveInput(text, 'paste');
    } catch {
      setInputMessage('Touch and hold in the text box, then tap Paste.');
      editor.current?.focus();
    }
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setInputMessage('Choose a .md, .markdown, or .txt file.');
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setInputMessage(
        'Choose a file smaller than 1 MB. Your current text is unchanged.',
      );
      return;
    }
    const sourceId = store.activeDocumentId;
    try {
      const text = await file.text();
      if (useStore.getState().activeDocumentId !== sourceId) {
        setInputMessage(
          'Document changed while opening the file. Choose it again.',
        );
        return;
      }
      if (text.includes('\0')) {
        setInputMessage(
          'This file is not a text document. Choose a Markdown or text file.',
        );
        return;
      }
      if (!text.trim()) {
        setInputMessage('This file is empty. Choose another file.');
        return;
      }
      // Always recheck current content after asynchronous file reading.
      if (useStore.getState().markdown.trim()) {
        setPendingImport(text);
        setSheet('import');
      } else receiveInput(text, 'drop');
    } catch {
      setInputMessage(
        'Could not open this file. Your text is safe. Please try again.',
      );
    }
  };
  const chooseTarget = (value: ExportTarget) => {
    setHtmlOutput(value === 'html');
    analytics.track('destination_change', { from: target, to: value });
    onDestinationChange(value === 'html' ? 'clipboard' : value);
    setSheet(null);
  };
  const print = () => {
    // The preview is always mounted, even when the editor tab is selected.
    switchTab('preview');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.print();
      }),
    );
    analytics.track('document_delivery', {
      destination: 'pdf',
      result: 'print_opened',
    });
  };
  return (
    <div className={`mobile-workspace ${keyboardOpen ? 'keyboard-open' : ''}`}>
      <header className="mobile-header" data-print-hide>
        <a href="/" aria-label="mdtodocs home" className="mobile-brand">
          <BrandWordmark />
        </a>
        <button
          type="button"
          className="mobile-menu"
          onClick={() => setSheet('documents')}
          aria-label="Open documents"
          aria-haspopup="dialog"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            folder_open
          </span>
          <span>Documents</span>
        </button>
      </header>
      <div className="mobile-document-row" data-print-hide>
        <span className="truncate">
          {hasContent ? title : 'Your next document'}
        </span>
        <button
          type="button"
          aria-label="Document options"
          onClick={() => {
            setSheet('options');
          }}
        >
          •••
        </button>
      </div>
      <div
        className="mobile-tabs"
        role="tablist"
        aria-label="Document view"
        data-print-hide
      >
        {(['edit', 'preview'] as const).map((value) => (
          <button
            type="button"
            key={value}
            role="tab"
            id={`mobile-${value}-tab`}
            aria-selected={tab === value}
            aria-controls={`mobile-${value}-panel`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => switchTab(value)}
            onKeyDown={(event) => {
              if (
                ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === 'Home'
                    ? 'edit'
                    : event.key === 'End'
                      ? 'preview'
                      : tab === 'edit'
                        ? 'preview'
                        : 'edit';
                switchTab(next);
                document.getElementById(`mobile-${next}-tab`)?.focus();
              }
            }}
          >
            {value === 'edit' ? 'Edit Markdown' : 'Preview'}
            {value === 'preview' && hasContent && <span className="tab-dot" />}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id="mobile-edit-panel"
        aria-labelledby="mobile-edit-tab"
        hidden={tab !== 'edit'}
        className="mobile-edit-panel"
        data-print-hide
      >
        {!hasContent && (
          <div className="mobile-intro">
            <HomeIntroduction />
          </div>
        )}
        <div className="mobile-input-actions">
          <button type="button" onClick={paste}>
            <span className="material-symbols-outlined" aria-hidden="true">
              content_paste
            </span>
            Paste text
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}>
            <span className="material-symbols-outlined" aria-hidden="true">
              upload_file
            </span>
            Choose file
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".md,.markdown,.txt,text/plain,text/markdown"
          hidden
          aria-label="Import Markdown file"
          onChange={(e) => {
            void importFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {inputMessage && (
          <p role="status" className="mobile-input-message">
            {inputMessage}
          </p>
        )}
        <label className="sr-only" htmlFor="mobile-markdown">
          Markdown text
        </label>
        <textarea
          ref={editor}
          id="mobile-markdown"
          value={markdown}
          onChange={(e) => onInput(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text');
            if (
              new Blob([
                markdown.slice(0, e.currentTarget.selectionStart),
                pasted,
                markdown.slice(e.currentTarget.selectionEnd),
              ]).size > MAX_IMPORT_BYTES
            ) {
              e.preventDefault();
              setInputMessage(
                'Paste a smaller document (under 1 MB). Your text is unchanged.',
              );
            }
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={
            '# A good place to start\n\nPaste or type your Markdown here…'
          }
        />
        <div className="mobile-editor-meta">
          {hasContent ? (
            <span>
              {markdown.trim().split(/\s+/).length.toLocaleString()} words ·
              {storageAvailable ? 'Saved on this device' : 'Not saved'}
            </span>
          ) : (
            <button
              type="button"
              onClick={() =>
                receiveInput(DOCUMENT_TEMPLATES[0].content, 'sample')
              }
            >
              Try an example <span aria-hidden="true">→</span>
            </button>
          )}
          <button type="button" onClick={() => switchTab('preview')}>
            Preview <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
      <section
        role="tabpanel"
        id="mobile-preview-panel"
        aria-labelledby="mobile-preview-tab"
        hidden={tab !== 'preview'}
        className={`mobile-preview-panel ${pageLayout ? 'page-layout' : ''}`}
      >
        <div className="mobile-preview-tools" data-print-hide>
          <span>{hasContent ? 'Your document' : 'Nothing to preview yet'}</span>
          <button
            type="button"
            aria-pressed={pageLayout}
            onClick={() => setPageLayout(!pageLayout)}
          >
            {pageLayout ? 'Reading view' : 'Page layout'}
          </button>
        </div>
        <DocumentPreview
          markdown={markdown}
          destination={destination}
          isCompiling={isCompiling}
          documentSignature={documentSignature}
          readingLayout={!pageLayout}
        />
      </section>
      {!storageAvailable && (
        <p className="mobile-storage-warning" role="alert" data-print-hide>
          Browser storage is unavailable or full. Keep this tab open and
          download your document to save it.
        </p>
      )}
      <MobileExportBar
        target={target}
        hasContent={hasContent}
        compilationError={compilationError}
        isCompiling={isCompiling}
        warningsCount={warnings.length}
        output={output}
        setSheet={setSheet}
        print={print}
        chooseTarget={chooseTarget}
      />
      {sheet && (
        <MobileWorkspaceSheets
          key={sheet}
          sheet={sheet}
          setSheet={setSheet}
          target={target}
          chooseTarget={chooseTarget}
          setTab={setTab}
          pendingImport={pendingImport}
          setPendingImport={setPendingImport}
          onInput={onInput}
          warnings={warnings}
          compilationError={compilationError}
          isCompiling={isCompiling}
        />
      )}
    </div>
  );
}
