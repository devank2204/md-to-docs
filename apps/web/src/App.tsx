import { structuredData } from './routes/metadata';
import { LandingContext } from './routes/LandingContext';
import { HomeIntroduction } from './components/HomeIntroduction';
import { LandingPageContent } from './components/LandingPageContent';
import { useEffect, useState, useMemo } from 'react';
import { useAppAppearance } from '@/hooks/useAppAppearance';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { EmptyState } from '@/components/EmptyState';
import { Workspace } from '@/components/Workspace';
import { Header } from '@/components/Header';
import { CommandPalette } from '@/components/CommandPalette';
import { TemplateGalleryModal } from '@/components/TemplateGalleryModal';
import { ReconciliationModal } from '@/components/ReconciliationModal';
import { DocumentHistoryModal } from '@/components/DocumentHistoryModal';
import { BookmarkPrompt } from '@/components/BookmarkPrompt';
import { AboutModal } from '@/components/AboutModal';
import { THEMES } from '@mdtodocs/compiler-core';
import type { DocumentTheme } from '@mdtodocs/compiler-core';
import { useStore } from '@/store';
import { getRouteSpec } from '@/routes/landingData';
import type { LandingRoutePath } from '@/routes/landingData';
import { MermaidUtilityView } from '@/components/MermaidUtilityView';
import { analytics, getDocLengthBucket } from '@/utils/analytics';

export type AppState = 'EMPTY' | 'WORKSPACE';

function App() {
  useAppAppearance();
  const isMobile = useMobileLayout();
  const markdown = useStore(state => state.markdown);
  const currentView = useStore(state => state.currentView);
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
  const setIsCommandPaletteOpen = useStore(state => state.setIsCommandPaletteOpen);
  const setIsTemplateGalleryOpen = useStore(state => state.setIsTemplateGalleryOpen);
  const setIsReconciliationModalOpen = useStore(state => state.setIsReconciliationModalOpen);
  const setIsHistoryModalOpen = useStore(state => state.setIsHistoryModalOpen);
  const createDocument = useStore(state => state.createDocument);
  const toggleSidebar = useStore(state => state.toggleSidebar);
  const setIsInspectorOpen = useStore(state => state.setIsInspectorOpen);
  const setIsFidelityPanelOpen = useStore(state => state.setIsFidelityPanelOpen);
  const setIsSuggestModalOpen = useStore(state => state.setIsSuggestModalOpen);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    }
    return '/';
  });

  const appState: AppState = currentView === 'landing' ? 'EMPTY' : 'WORKSPACE';

  const activeTheme: DocumentTheme = useMemo(() => ({
    ...THEMES[themeId],
    typography: { ...THEMES[themeId].typography, baseFontSizePt: baseFontSize },
  }), [themeId, baseFontSize]);

  const handleNavigateRoute = (path: LandingRoutePath) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path === '/' ? '/' : `${path}/`);
      setCurrentPath(path);
      const spec = getRouteSpec(path);
      if (spec && path !== '/') {
        setDestination(spec.destination);
        useStore.getState().setHtmlOutput(spec.path === '/markdown-to-html');
        if (!markdown.trim()) {
          document.title = spec.title;
        }
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = (window.location.pathname.toLowerCase().replace(/\/$/, '') || '/') as LandingRoutePath;
      setCurrentPath(path);
      const spec = getRouteSpec(path);
      if (spec && path !== '/') {
        setDestination(spec.destination);
        useStore.getState().setHtmlOutput(spec.path === '/markdown-to-html');
        if (!markdown.trim()) {
          document.title = spec.title;
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [markdown, setDestination]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createDocument('', 'Untitled Document');
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (target?.tagName !== 'INPUT') {
          e.preventDefault();
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, createDocument, toggleSidebar]);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const editing = e.target instanceof Element && e.target.closest('input, textarea, [contenteditable]');
      if (!isMobile && !e.defaultPrevented && !editing && appState === 'EMPTY') {
        const text = e.clipboardData?.getData('text');
        if (text) {
          setMarkdown(text);
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [appState, setMarkdown, isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const spec = getRouteSpec(pathname);
    if (spec && pathname !== '/' && !useStore.getState().markdown.trim()) {
      setDestination(spec.destination);
      useStore.getState().setHtmlOutput(spec.path === '/markdown-to-html');
      if (!useStore.getState().markdown.trim()) {
        document.title = spec.title;
      }
    }
  }, [setDestination]);

  const routeSpec = getRouteSpec(currentPath);
  useEffect(() => {
    if (!routeSpec) return;
    document.title = routeSpec.title;
    const set = (selector: string, attribute: string, value: string) => {
      document.querySelector(selector)?.setAttribute(attribute, value);
    };
    set('meta[name="description"]', 'content', routeSpec.description);
    set('link[rel="canonical"]', 'href', routeSpec.canonical);
    for (const prefix of ['og', 'twitter']) {
      for (const [key, value] of Object.entries({ title: routeSpec.title, description: routeSpec.description, url: routeSpec.canonical })) {
        set(`meta[${prefix === 'og' ? 'property' : 'name'}="${prefix}:${key}"]`, 'content', value);
      }
    }
    const schema = document.querySelector('script[type="application/ld+json"]');
    if (schema) schema.textContent = JSON.stringify(structuredData(routeSpec));
  }, [routeSpec]);

  useEffect(() => {
    analytics.track('page_view', {
      path: currentPath,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
  }, [currentPath]);

  const handleInput = (newMarkdown: string) => {
    analytics.track('editor_action', {
      action: newMarkdown.trim() ? 'type' : 'clear',
      docLengthBucket: getDocLengthBucket(newMarkdown.length),
    });
    setMarkdown(newMarkdown);
  };

  return (
    <LandingContext.Provider value={routeSpec || getRouteSpec('/')!}><div className={`${isMobile ? 'mobile-app' : 'min-h-screen'} flex flex-col bg-surface text-on-surface`}>
      {(!isMobile || currentPath.startsWith('/mermaid-')) && <Header
        appState={appState}
        markdown={markdown}
        destination={destination}
        onDestinationChange={setDestination}
        activeTheme={activeTheme}
        documentSignature={documentSignature}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />}
      <main className={`flex-1 flex flex-col relative ${isMobile && !currentPath.startsWith('/mermaid-') ? 'mobile-main' : 'mt-12'}`}>
        {(!routeSpec) ? <section className="p-10"><h1>Page Not Found (404)</h1><a href="/">Return to MDToDocs</a></section> : null}
        {routeSpec && currentPath !== '/' && appState !== 'EMPTY' && !currentPath.startsWith('/mermaid-') && <HomeIntroduction />}
        {!routeSpec ? null : currentPath === '/mermaid-to-svg' || currentPath === '/mermaid-to-png' ? (
          <MermaidUtilityView
            currentPath={currentPath}
            onNavigateRoute={handleNavigateRoute}
            onOpenInStudio={(importedMarkdown) => {
              setMarkdown(importedMarkdown);
              handleNavigateRoute('/');
            }}
          />
        ) : !isMobile && appState === 'EMPTY' ? (
          <EmptyState onInput={handleInput} />
        ) : (
          <Workspace
            isMobile={isMobile}
            markdown={markdown}
            onInput={handleInput}
            destination={destination}
            onDestinationChange={setDestination}
            activeTheme={activeTheme}
            documentSignature={documentSignature}
          />
        )}
        {routeSpec && !currentPath.startsWith('/mermaid-') && <LandingPageContent spec={routeSpec} onNavigateRoute={handleNavigateRoute} />}
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

      <AboutModal />

      {!isMobile && <BookmarkPrompt />}
    </div></LandingContext.Provider>
  );
}

export default App;
