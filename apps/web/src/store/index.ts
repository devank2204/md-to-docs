import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { THEMES } from '@mdtodocs/compiler-core';

import type { Root } from 'mdast';

export interface AppState {
  markdown: string;
  destination: DestinationType;
  themeId: keyof typeof THEMES;
  baseFontSize: number;
  documentSignature: {
    enabled: boolean;
    placement: 'every-page' | 'last-page';
  };
  compiledDoc: Root | null;
  isCompiling: boolean;
  isReviewMode: boolean;
  
  setMarkdown: (markdown: string) => void;
  setDestination: (destination: DestinationType) => void;
  setThemeId: (themeId: keyof typeof THEMES) => void;
  setBaseFontSize: (size: number) => void;
  setDocumentSignature: (signature: { enabled: boolean; placement: 'every-page' | 'last-page' }) => void;
  setCompiledDoc: (doc: Root | null) => void;
  setIsCompiling: (isCompiling: boolean) => void;
  setIsReviewMode: (isReviewMode: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      markdown: '',
      destination: 'google-docs',
      themeId: 'default',
      baseFontSize: THEMES['default'].typography.baseFontSizePt,
      documentSignature: {
        enabled: false,
        placement: 'last-page'
      },
      compiledDoc: null,
      isCompiling: false,
      isReviewMode: typeof window !== 'undefined' && (
        new URLSearchParams(window.location.search).get('mode') === 'review' ||
        new URLSearchParams(window.location.search).get('view') === 'review'
      ),
      
      setMarkdown: (markdown) => set({ markdown }),
      setDestination: (destination) => set({ destination }),
      setThemeId: (themeId) => set({ themeId }),
      setBaseFontSize: (baseFontSize) => set({ baseFontSize }),
      setDocumentSignature: (documentSignature) => set({ documentSignature }),
      setCompiledDoc: (compiledDoc) => set({ compiledDoc }),
      setIsCompiling: (isCompiling) => set({ isCompiling }),
      setIsReviewMode: (isReviewMode) => {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (isReviewMode) {
            url.searchParams.set('mode', 'review');
          } else {
            url.searchParams.delete('mode');
            url.searchParams.delete('view');
          }
          window.history.replaceState({}, '', url.toString());
        }
        set({ isReviewMode });
      },
    }),
    {
      name: 'md-to-docs-storage',
      partialize: (state) => ({
        markdown: state.markdown,
        destination: state.destination,
        themeId: state.themeId,
        baseFontSize: state.baseFontSize,
        documentSignature: state.documentSignature
      })
    }
  )
);

