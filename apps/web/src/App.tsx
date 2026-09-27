import { useEffect } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Workspace } from '@/components/Workspace';
import { Header } from '@/components/Header';
import { THEMES } from '@mdtodocs/compiler-core';
import type { DocumentTheme } from '@mdtodocs/compiler-core';
import { useStore } from '@/store';

export type AppState = 'EMPTY' | 'WORKSPACE';

function App() {
  const markdown = useStore(state => state.markdown);
  const destination = useStore(state => state.destination);
  const themeId = useStore(state => state.themeId);
  const baseFontSize = useStore(state => state.baseFontSize);
  
  const setMarkdown = useStore(state => state.setMarkdown);
  const setDestination = useStore(state => state.setDestination);
  const setThemeId = useStore(state => state.setThemeId);
  const setBaseFontSize = useStore(state => state.setBaseFontSize);

  const appState: AppState = markdown.trim().length > 0 ? 'WORKSPACE' : 'EMPTY';

  const activeTheme: DocumentTheme = {
    ...THEMES[themeId],
    typography: { ...THEMES[themeId].typography, baseFontSizePt: baseFontSize },
  };

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
          />
        )}
      </main>
    </div>
  );
}

export default App;
