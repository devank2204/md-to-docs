import { useState, useRef, useEffect } from 'react';
import type { AppState } from '@/App';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { WorkspaceSheet } from './WorkspaceSheet';
import { MobileExportBar } from './MobileExportBar';
import { useDocumentExport } from '@/hooks/useDocumentExport';
import { useStore } from '@/store';
import { getCommandShortcut } from '@/utils/platform';
import { AppAppearance } from './AppAppearance';
import { DirectDelivery } from './DirectDelivery';
import { RenameTitle } from './RenameTitle';
import { ToolsLinks } from './SiteFooter';
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
  const isReviewMode = useStore(state => state.isReviewMode);
  const setIsReviewMode = useStore(state => state.setIsReviewMode);
  const activeDocumentId = useStore(state => state.activeDocumentId);
  const documents = useStore(state => state.documents);

  const resetWorkspaceToHome = useStore(state => state.resetWorkspaceToHome);
  const setIsAboutModalOpen = useStore(state => state.setIsAboutModalOpen);
  const isSidebarOpen = useStore(state => state.isSidebarOpen);
  const toggleSidebar = useStore(state => state.toggleSidebar);
  const diagnostics = useStore(state => state.diagnostics);
  const diagnosticsKey = useStore(state => state.diagnosticsKey);
  const diagnosticsFailed = useStore(state => state.diagnosticsFailed);
  const isChecking = diagnosticsKey !== JSON.stringify([activeDocumentId, markdown, destination, activeTheme]);

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
  const isHtmlRoute = useStore(state => state.htmlOutput);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  const target = isHtmlRoute && destination === 'clipboard' ? 'html' : destination;
  const output = useDocumentExport({ markdown, destination: target, theme: activeTheme,
    signature: documentSignature, title: activeDocTitle }, activeDocumentId);
  useEffect(() => {
    const open = (event: Event) => {
      if(event.type==='mdtodocs:delivery-options'){setDeliveryOpen(true);return}
      const requested = (event as CustomEvent).detail || 'pdf';
      useStore.getState().setHtmlOutput(requested === 'html');
      onDestinationChange(requested === 'html' ? 'clipboard' : requested);
      setDeliveryOpen(true);
    };
    window.addEventListener('mdtodocs:delivery-options', open);
    return () => {
      window.removeEventListener('mdtodocs:delivery-options', open);
    };
  }, [onDestinationChange]);

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

                  <ToolsLinks />
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

            {appState === 'WORKSPACE' && <div className="xl:hidden"><RenameTitle compact /></div>}
            {appState === 'WORKSPACE' && (
              <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-outline-variant/40 text-xs text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-[15px] text-outline">description</span>
                <span className="min-w-0 text-on-surface font-sans" title={activeDocTitle}>
                  <RenameTitle />
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {appState === 'EMPTY' && <AppAppearance />}
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

          <AppAppearance />
          <DirectDelivery />
          {deliveryOpen && (
            <WorkspaceSheet placement="export" title="Deliver your document" onClose={() => setDeliveryOpen(false)}>
              <p className="sheet-description">{activeDocTitle} · Uses your latest text when you prepare. No account needed.</p>
              <div className="sheet-options"><label>Save as<select aria-label="Save as" id="desktop-delivery-target" value={target} onChange={event => { const value = event.target.value; useStore.getState().setHtmlOutput(value === 'html'); onDestinationChange((value === 'html' ? 'clipboard' : value) as DestinationType); }}><option value="word">Word document</option><option value="pdf">PDF</option><option value="google-docs">Google Docs</option><option value="html">HTML</option><option value="clipboard">Formatted text</option></select></label></div>
              <MobileExportBar hideDestination target={target} hasContent={!!markdown.trim()} compilationError={!isChecking && diagnosticsFailed}
                isCompiling={isChecking} warningsCount={diagnostics.filter(note => note.severity === 'warning' || note.severity === 'error').length}
                output={output} setSheet={(sheet) => { if (sheet === 'destination') document.getElementById('desktop-delivery-target')?.focus(); else { setDeliveryOpen(false); window.dispatchEvent(new CustomEvent('mdtodocs:review')); } }}
                chooseTarget={(value) => { useStore.getState().setHtmlOutput(value === 'html'); onDestinationChange(value === 'html' ? 'clipboard' : value); }} />
            </WorkspaceSheet>
          )}

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
