import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Workspace } from '@/components/Workspace';
import { Header } from '@/components/Header';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { THEMES } from '@mdtodocs/compiler-core';
import type { DocumentTheme } from '@mdtodocs/compiler-core';

export type AppState = 'EMPTY' | 'WORKSPACE';

function App() {
  const [appState, setAppState] = useState<AppState>('EMPTY');
  const [markdown, setMarkdown] = useState<string>('');
  const [destination, setDestination] = useState<DestinationType>('google-docs');
  const [themeId, setThemeId] = useState<keyof typeof THEMES>('default');
  const [baseFontSize, setBaseFontSize] = useState<number>(THEMES['default'].typography.baseFontSizePt);

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
          setAppState('WORKSPACE');
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [appState]);

  const handleInput = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
    if (newMarkdown.trim().length > 0 && appState === 'EMPTY') {
      setAppState('WORKSPACE');
    } else if (newMarkdown.trim().length === 0 && appState === 'WORKSPACE') {
      setAppState('EMPTY');
    }
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
