import { useState, useRef, useEffect } from 'react';
import type { AppState } from '@/App';
import type { DestinationType } from '@mdtodocs/capability-graph';
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
                      <div className="text-[10px] text-outline">Return to the converter</div>
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
                      <div className="font-medium flex items-center gap-1">About <BrandWordmark /></div>
                      <div className="text-[10px] text-outline">Capabilities &amp; author info</div>
                    </div>
                  </button>

                  {appState === 'EMPTY' && <ToolsLinks />}
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
              <div className="header-document-name flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-[15px] text-outline">description</span>
                <span className="min-w-0 flex-1 text-on-surface font-sans">
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
          {/* Reading View Button with Eye Blink Micro-Interaction */}
          {!isReviewMode && (
            <button
              type="button"
              onClick={() => {
                if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setIsReviewMode(true); return; }
                setIsEyeBlinking(true);
                setTimeout(() => {
                  setIsReviewMode(true);
                  setIsEyeBlinking(false);
                }, 220);
              }}
              className="ux-button reading-control text-xs font-medium"
              title="Switch to clean reading view"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${isEyeBlinking ? 'reading-wink' : ''}`}
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
