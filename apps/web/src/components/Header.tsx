
import type { AppState } from '@/App';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { SegmentedControl } from '@/components/interior/segmented-control';
import { LoadingButton } from '@/components/interior/loading-button';
import { useStore } from '@/store';

import { exportDocx, copyFormattedDoc, printPdf } from '@/utils/exportHelpers';

interface HeaderProps {
  appState: AppState;
  markdown: string;
  destination: DestinationType;
  onDestinationChange: (dest: DestinationType) => void;
  activeTheme: any;
  documentSignature: { enabled: boolean; placement: 'every-page' | 'last-page' };
  onOpenCommandPalette?: () => void;
}

export function Header({
  appState,
  markdown,
  destination,
  onDestinationChange,
  activeTheme,
  documentSignature,
  onOpenCommandPalette,
}: HeaderProps) {
  const compiledDoc = useStore(state => state.compiledDoc);
  const isReviewMode = useStore(state => state.isReviewMode);
  const setIsReviewMode = useStore(state => state.setIsReviewMode);
  const activeDocumentId = useStore(state => state.activeDocumentId);
  const documents = useStore(state => state.documents);

  const activeDocTitle =
    documents.find(d => d.id === activeDocumentId)?.title || 'Untitled Document';


  const handleDownloadDocx = async () => {
    await exportDocx(markdown, compiledDoc, activeTheme, documentSignature);
  };

  const handleCopyFormatted = async () => {
    await copyFormattedDoc(markdown, compiledDoc, destination, activeTheme, documentSignature);
  };

  const handlePrintPdf = () => {
    printPdf();
  };

  const primaryAction = async () => {
    switch (destination) {
      case 'google-docs':
      case 'clipboard':
        return await handleCopyFormatted();
      case 'word':
        return await handleDownloadDocx();
      case 'pdf':
        handlePrintPdf();
        return Promise.resolve();
    }
  };

  const primaryLabel = () => {
    switch (destination) {
      case 'google-docs': return 'Copy for Google Docs';
      case 'clipboard': return 'Copy formatted';
      case 'word': return 'Download .docx';
      case 'pdf': return 'Export PDF';
    }
  };

  const primaryIcon = () => {
    switch (destination) {
      case 'google-docs':
      case 'clipboard':
        return 'content_copy';
      case 'word': return 'download';
      case 'pdf': return 'picture_as_pdf';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-space-md gap-space-md border-t border-outline-variant/30">
      <div className="flex items-center gap-space-md">
        <a href="/" className="flex items-center gap-space-xs group transition-transform duration-700 hover:-translate-y-[1px]">
          <div className="flex items-center gap-space-sm">
            <img src="/mark.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div className="flex items-baseline gap-space-xxs mt-0.5">
              <span className="font-code-lg text-code-lg font-semibold tracking-tighter text-on-surface">mdtodocs</span>
              <span className="font-code-sm text-code-sm text-outline font-normal">.com</span>
            </div>
          </div>
        </a>

        {appState === 'WORKSPACE' && (
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-outline-variant/40 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[15px] text-outline">description</span>
            <span className="truncate max-w-[180px] text-on-surface font-sans" title={activeDocTitle}>
              {activeDocTitle}
            </span>
          </div>
        )}
      </div>


      {appState === 'WORKSPACE' && (
        <div className="flex items-center gap-space-md">
          {/* Command Palette Accelerator Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-code-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/50 transition-colors"
            title="Open Command Palette (Cmd+K / Ctrl+K)"
          >
            <span className="material-symbols-outlined text-[15px]">search</span>
            <span className="hidden md:inline">Commands</span>
            <kbd className="px-1 py-0.2 rounded bg-surface-container text-[10px] text-outline border border-outline-variant/60 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Templates Gallery Trigger */}
          <button
            type="button"
            onClick={() => useStore.getState().setIsTemplateGalleryOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-code-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/50 transition-colors"
            title="Browse Executive Document Templates Gallery"
          >
            <span className="material-symbols-outlined text-[15px]">collections_bookmark</span>
            <span className="hidden lg:inline">Templates</span>
          </button>

          {/* Reconcile Word Comments & Edits Trigger */}
          <button
            type="button"
            onClick={() => useStore.getState().setIsReconciliationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-code-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/50 transition-colors"
            title="Reconcile Word comments, track changes, and review notes"
          >
            <span className="material-symbols-outlined text-[15px]">sync_alt</span>
            <span className="hidden lg:inline">Reconcile</span>
          </button>


          {/* Destination Selector */}
          <SegmentedControl
            options={[
              { value: 'google-docs', label: 'Google Docs' },
              { value: 'word', label: 'Word' },
              { value: 'pdf', label: 'PDF' },
              { value: 'clipboard', label: 'Copy' },
            ]}
            label="Destination"
            value={destination}
            onValueChange={(val) => onDestinationChange(val as DestinationType)}
          />

          {/* Primary Action */}
          <LoadingButton
            onAction={primaryAction}
            successLabel="✓ Copied!"
            pendingLabel={destination === 'word' ? 'Compiling...' : 'Copying...'}
            idleIcon={<span className="material-symbols-outlined text-[16px]">{primaryIcon()}</span>}
          >
            {primaryLabel() ?? 'Export'}
          </LoadingButton>

          {/* Review Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsReviewMode(!isReviewMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isReviewMode
                ? 'bg-primary text-on-primary shadow-sm hover:bg-primary/90'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/60'
            }`}
            title={isReviewMode ? 'Return to split editor view' : 'Switch to distraction-free stakeholder review mode'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isReviewMode ? 'edit_note' : 'visibility'}
            </span>
            <span className="hidden sm:inline">{isReviewMode ? 'Exit Review' : 'Review Mode'}</span>
          </button>
        </div>
      )}
    </header>
  );
}
