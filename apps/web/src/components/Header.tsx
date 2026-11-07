import { useState, useRef, useEffect } from 'react';
import type { AppState } from '@/App';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { SegmentedControl } from '@/components/interior/segmented-control';
import { LoadingButton } from '@/components/interior/loading-button';
import { useStore } from '@/store';
import { exportDocx, copyFormattedDoc, printPdf, downloadHtml } from '@/utils/exportHelpers';
import { getCommandShortcut } from '@/utils/platform';
import { analytics } from '@/utils/analytics';
import { BrandWordmark } from './BrandWordmark';

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

  const resetWorkspaceToHome = useStore(state => state.resetWorkspaceToHome);
  const setIsAboutModalOpen = useStore(state => state.setIsAboutModalOpen);
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const toggleSidebar = useStore(state => state.toggleSidebar);
  const diagnostics = useStore(state => state.diagnostics);

  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [isEyeBlinking, setIsEyeBlinking] = useState(false);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLogoMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setIsLogoMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isLogoMenuOpen]);

  const activeDocTitle =
    documents.find(d => d.id === activeDocumentId)?.title || 'Untitled Document';
  const recordSuccessfulExport = useStore(state => state.recordSuccessfulExport);

  const handleDownloadDocx = async () => {
    const startTime = Date.now();
    const hasWarnings = diagnostics.some(d => d.severity === 'warning');
    analytics.track('export_attempt', { destination: 'word', format: 'docx', hasWarnings });
    try {
      const success = await exportDocx(markdown, compiledDoc, activeTheme, documentSignature);
      if (success) {
        recordSuccessfulExport();
        analytics.trackExportCompleted('word', 'docx', Date.now() - startTime);
      } else {
        analytics.track('export_failure', { destination: 'word', format: 'docx', errorType: 'export_failed' });
      }
      return success;
    } catch {
      analytics.track('export_failure', { destination: 'word', format: 'docx', errorType: 'export_failed' });
      return false;
    }
  };

  const handleCopyFormatted = async () => {
    const startTime = Date.now();
    const hasWarnings = diagnostics.some(d => d.severity === 'warning');
    analytics.track('export_attempt', { destination, format: 'clipboard_html', hasWarnings });
    try {
      const success = await copyFormattedDoc(markdown, compiledDoc, destination, activeTheme, documentSignature);
      if (success) {
        recordSuccessfulExport();
        analytics.trackExportCompleted(destination, 'clipboard_html', Date.now() - startTime);
      } else {
        analytics.track('export_failure', { destination, format: 'clipboard_html', errorType: 'copy_failed' });
      }
      return success;
    } catch {
      analytics.track('export_failure', { destination, format: 'clipboard_html', errorType: 'export_failed' });
      return false;
    }
  };

  const handleDownloadHtml = async () => {
    const startTime = Date.now();
    const hasWarnings = diagnostics.some(d => d.severity === 'warning');
    analytics.track('export_attempt', { destination: 'html', format: 'html', hasWarnings });
    try {
      const success = await downloadHtml(markdown, compiledDoc, activeTheme, activeDocTitle);
      if (success) {
        recordSuccessfulExport();
        analytics.trackExportCompleted('html', 'html', Date.now() - startTime);
      } else {
        analytics.track('export_failure', { destination: 'html', format: 'html', errorType: 'html_failed' });
      }
      return success;
    } catch {
      analytics.track('export_failure', { destination: 'html', format: 'html', errorType: 'export_failed' });
      return false;
    }
  };

  const handlePrintPdf = () => {
    const hasWarnings = diagnostics.some(d => d.severity === 'warning');
    analytics.track('export_attempt', { destination: 'pdf', format: 'pdf', hasWarnings });
    printPdf();
    // Browser print does not tell us whether a PDF was saved.
    analytics.track('document_delivery', { destination: 'pdf', result: 'print_opened' });
  };

  const isHtmlRoute = useStore(state => state.htmlOutput);

  const primaryAction = async () => {
    if (isHtmlRoute && destination === 'clipboard') {
      return await handleDownloadHtml();
    }
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
    if (isHtmlRoute && destination === 'clipboard') {
      return 'Download .html';
    }
    switch (destination) {
      case 'google-docs': return 'Copy for Google Docs';
      case 'clipboard': return 'Copy formatted';
      case 'word': return 'Download .docx';
      case 'pdf': return 'Print / Save as PDF';
    }
  };

  const primaryIcon = () => {
    if (isHtmlRoute && destination === 'clipboard') {
      return 'code';
    }
    switch (destination) {
      case 'google-docs':
      case 'clipboard':
        return 'content_copy';
      case 'word': return 'download';
      case 'pdf': return 'picture_as_pdf';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-space-md gap-space-md border-b border-outline-variant/30">
      <div className="flex items-center gap-space-md">
        {/* Left: Brand or Back to Editor navigation */}
        {appState === 'WORKSPACE' && isReviewMode ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsReviewMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/60 hover:bg-surface-container-high text-xs font-medium text-on-surface transition-colors shadow-2xs cursor-pointer"
              title="Return to editor"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Editor</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-outline-variant/40 text-xs text-on-surface-variant">
              <span className="font-semibold text-on-surface truncate max-w-[200px]" title={activeDocTitle}>
                {activeDocTitle}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-space-md">
            <div className="relative" ref={logoMenuRef}>
              <button
                type="button"
                onClick={() => setIsLogoMenuOpen(!isLogoMenuOpen)}
                className="flex items-center gap-space-xs group rounded-lg px-1.5 py-1 hover:bg-surface-container transition-all cursor-pointer"
                title="mdtodocs menu"
                aria-expanded={isLogoMenuOpen}
                aria-haspopup="true"
              >
                <div className="flex items-center gap-space-sm">
                  <BrandWordmark />
                  <span
                    className="material-symbols-outlined text-[15px] text-outline group-hover:text-on-surface transition-transform duration-200"
                    style={{ transform: isLogoMenuOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    expand_more
                  </span>
                </div>
              </button>

              {/* Glassmorphic Logo Dropdown */}
              {isLogoMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-surface/95 dark:bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/60 shadow-xl p-1.5 z-50 text-xs text-on-surface animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-outline-variant/30 mb-1">
                    <div className="font-semibold text-on-surface text-[13px]">mdtodocs</div>
                    <div className="text-[11px] text-outline mt-0.5">Markdown to Google Docs, Word &amp; PDF</div>
                    {appState === 'WORKSPACE' && (
                      <div className="text-[10px] text-primary font-mono mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        <span>Active Document Session</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLogoMenuOpen(false);
                      resetWorkspaceToHome();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container text-left transition-colors cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-[17px] text-secondary group-hover:text-primary">home</span>
                    <div>
                      <div className="font-medium">Back to Home Page</div>
                      <div className="text-[10px] text-outline">Reset view &amp; start fresh</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLogoMenuOpen(false);
                      setIsAboutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container text-left transition-colors cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-[17px] text-secondary group-hover:text-primary">info</span>
                    <div>
                      <div className="font-medium">About mdtodocs</div>
                      <div className="text-[10px] text-outline">Capabilities &amp; author info</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLogoMenuOpen(false);
                      onOpenCommandPalette?.();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container text-left transition-colors cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-[17px] text-secondary group-hover:text-primary">search</span>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <div className="font-medium">Command Palette</div>
                        <div className="text-[10px] text-outline">All shortcuts &amp; tools</div>
                      </div>
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-[10px] font-mono text-outline">
                        {getCommandShortcut()}
                      </kbd>
                    </div>
                  </button>

                  <div className="my-1 border-t border-outline-variant/30" />
                </div>
              )}
            </div>

            {appState === 'WORKSPACE' && (
              <button
                type="button"
                onClick={toggleSidebar}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isSidebarOpen
                    ? 'text-primary bg-primary/10 border border-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/30'
                }`}
                title={isSidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
              >
                <span className="material-symbols-outlined text-[17px]">
                  {isSidebarOpen ? 'dock_to_left' : 'view_sidebar'}
                </span>
              </button>
            )}

            {appState === 'WORKSPACE' && (
              <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-outline-variant/40 text-xs text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-[15px] text-outline">description</span>
                <span className="truncate max-w-[180px] text-on-surface font-sans" title={activeDocTitle}>
                  {activeDocTitle}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {appState === 'WORKSPACE' && (
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Commands Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-code-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors border border-outline-variant/30 cursor-pointer"
            title="Open Command Palette (Cmd+K / Ctrl+K)"
          >
            <span className="material-symbols-outlined text-[15px]">search</span>
            <span className="hidden xl:inline">Commands</span>
            <kbd className="px-1 py-0.2 rounded bg-surface-container-high text-[10px] text-outline font-mono">
              {getCommandShortcut()}
            </kbd>
          </button>

          {/* Suggest Edit Trigger (shown in Reading View) */}
          {isReviewMode && (
            <button
              type="button"
              onClick={() => useStore.getState().setIsSuggestModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors border border-outline-variant/30 cursor-pointer"
              title="Suggest an edit or feedback"
            >
              <span className="material-symbols-outlined text-[15px]">rate_review</span>
              <span className="hidden sm:inline">Suggest Edit</span>
            </button>
          )}

          {/* Destination Selector */}
          <SegmentedControl
            options={[
              { value: 'google-docs', label: 'Google Docs', shortLabel: 'Docs' },
              { value: 'word', label: 'Word', shortLabel: 'Word' },
              { value: 'pdf', label: 'PDF', shortLabel: 'PDF' },
              { value: 'clipboard', label: 'Copy', shortLabel: 'Copy' },
            ]}
            label="Destination"
            value={destination}
            onValueChange={(val) => {
              analytics.track('destination_change', { from: destination, to: val });
              useStore.getState().setHtmlOutput(false);
              onDestinationChange(val as DestinationType);
            }}
          />

          {/* Primary Action Button */}
          <LoadingButton
            onAction={primaryAction}
            destination={destination}
            successLabel={destination === 'word' || (isHtmlRoute && destination === 'clipboard') ? 'Download started' : destination === 'pdf' ? 'Print opened' : 'Copied!'}
            pendingLabel={destination === 'word' ? 'Compiling...' : destination === 'pdf' ? 'Preparing...' : 'Copying...'}
            idleIcon={<span className="material-symbols-outlined text-[16px]">{primaryIcon()}</span>}
            className="min-w-fit px-2.5 sm:px-3 sm:min-w-[145px]"
          >
            <span className="hidden sm:inline">{primaryLabel() ?? 'Export'}</span>
            <span className="inline sm:hidden">
              {destination === 'google-docs' ? 'Copy Docs' : destination === 'word' ? 'Export' : destination === 'pdf' ? 'Print' : 'Copy'}
            </span>
          </LoadingButton>

          {/* Reading View Button with Eye Blink Micro-Interaction */}
          {!isReviewMode && (
            <button
              type="button"
              onClick={() => {
                setIsEyeBlinking(true);
                setTimeout(() => {
                  setIsReviewMode(true);
                  setIsEyeBlinking(false);
                }, 220);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-outline-variant/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all active:scale-95 cursor-pointer group"
              title="Switch to clean reading view"
            >
              <span
                className={`material-symbols-outlined text-[16px] transition-all duration-200 ${
                  isEyeBlinking ? 'scale-y-[0.05] text-primary -translate-y-0.5' : 'group-hover:scale-115'
                }`}
              >
                visibility
              </span>
              <span className="hidden xl:inline">Reading View</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
