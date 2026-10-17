import { useEffect } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Workspace } from '@/components/Workspace';
import { Header } from '@/components/Header';
import { CommandPalette } from '@/components/CommandPalette';
import { TemplateGalleryModal } from '@/components/TemplateGalleryModal';
import { ReconciliationModal } from '@/components/ReconciliationModal';
import { DocumentHistoryModal } from '@/components/DocumentHistoryModal';
import { THEMES } from '@mdtodocs/compiler-core';
import type { DocumentTheme } from '@mdtodocs/compiler-core';
import { useStore } from '@/store';

export type AppState = 'EMPTY' | 'WORKSPACE';

function App() {
  const markdown = useStore(state => state.markdown);
  const destination = useStore(state => state.destination);
  const themeId = useStore(state => state.themeId);
  const baseFontSize = useStore(state => state.baseFontSize);
  const documentSignature = useStore(state => state.documentSignature);
  const isCommandPaletteOpen = useStore(state => state.isCommandPaletteOpen);
  const isTemplateGalleryOpen = useStore(state => state.isTemplateGalleryOpen);
  const isReconciliationModalOpen = useStore(state => state.isReconciliationModalOpen);
  const isHistoryModalOpen = useStore(state => state.isHistoryModalOpen);
  
  const setMarkdown = useStore(state => state.setMarkdown);
  const setDestination = useStore(state => state.setDestination);
  const setThemeId = useStore(state => state.setThemeId);
  const setBaseFontSize = useStore(state => state.setBaseFontSize);
  const setDocumentSignature = useStore(state => state.setDocumentSignature);
  const setIsCommandPaletteOpen = useStore(state => state.setIsCommandPaletteOpen);
  const setIsTemplateGalleryOpen = useStore(state => state.setIsTemplateGalleryOpen);
  const setIsReconciliationModalOpen = useStore(state => state.setIsReconciliationModalOpen);
  const setIsHistoryModalOpen = useStore(state => state.setIsHistoryModalOpen);
  const createDocument = useStore(state => state.createDocument);
  const setIsInspectorOpen = useStore(state => state.setIsInspectorOpen);
  const setIsFidelityPanelOpen = useStore(state => state.setIsFidelityPanelOpen);
  const setIsSuggestModalOpen = useStore(state => state.setIsSuggestModalOpen);

  const appState: AppState = markdown.trim().length > 0 ? 'WORKSPACE' : 'EMPTY';

  const activeTheme: DocumentTheme = {
    ...THEMES[themeId],
    typography: { ...THEMES[themeId].typography, baseFontSizePt: baseFontSize },
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createDocument('', 'Untitled Document');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, createDocument]);


  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (appState === 'EMPTY') {
        const text = e.clipboardData?.getData('text');
        if (text) {
          setMarkdown(text);
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [appState, setMarkdown]);

  useEffect(() => {
    if (!markdown.trim()) {
      document.title = 'mdtodocs: Markdown to Documents';
      return;
    }
    const match = markdown.match(/^#\s+(.+)$/m);
    if (match && match[1]?.trim()) {
      document.title = `${match[1].trim()} | mdtodocs`;
    } else {
      document.title = 'mdtodocs: Markdown to Documents';
    }
  }, [markdown]);

  const handleInput = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header
        appState={appState}
        markdown={markdown}
        destination={destination}
        onDestinationChange={setDestination}
        activeTheme={activeTheme}
        documentSignature={documentSignature}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      <main className="flex-1 flex flex-col mt-12 relative">
        {appState === 'EMPTY' ? (
          <EmptyState onInput={handleInput} />
        ) : (
          <Workspace
            markdown={markdown}
            onInput={handleInput}
            destination={destination}
            onDestinationChange={setDestination}
            themeId={themeId}
            onThemeIdChange={setThemeId}
            baseFontSize={baseFontSize}
            onBaseFontSizeChange={setBaseFontSize}
            activeTheme={activeTheme}
            documentSignature={documentSignature}
            onDocumentSignatureChange={setDocumentSignature}
          />
        )}
      </main>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenFidelityPanel={() => setIsFidelityPanelOpen(true)}
        onOpenSuggestModal={() => setIsSuggestModalOpen(true)}
        activeTheme={activeTheme}
      />

      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSelectTemplate={setMarkdown}
        currentMarkdownLength={markdown.length}
      />

      <ReconciliationModal
        isOpen={isReconciliationModalOpen}
        onClose={() => setIsReconciliationModalOpen(false)}
      />

      <DocumentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}

export default App;
