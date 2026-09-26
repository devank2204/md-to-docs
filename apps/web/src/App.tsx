import { useState, useEffect } from 'react';
import { EmptyState } from './components/EmptyState';
import { Workspace } from './components/Workspace';
import { Header } from './components/Header';
import type { DestinationType } from '@mdtodocs/capability-graph';

export type AppState = 'EMPTY' | 'WORKSPACE';

function App() {
  const [appState, setAppState] = useState<AppState>('EMPTY');
  const [markdown, setMarkdown] = useState<string>('');
  const [destination, setDestination] = useState<DestinationType>('google-docs');

  // Handle global paste to transition to workspace if empty
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
          />
        )}
      </main>
    </div>
  );
}

export default App;
