import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { THEMES } from '@mdtodocs/compiler-core';

export interface AppState {
  markdown: string;
  destination: DestinationType;
  themeId: keyof typeof THEMES;
  baseFontSize: number;
  
  setMarkdown: (markdown: string) => void;
  setDestination: (destination: DestinationType) => void;
  setThemeId: (themeId: keyof typeof THEMES) => void;
  setBaseFontSize: (size: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      markdown: '',
      destination: 'google-docs',
      themeId: 'default',
      baseFontSize: THEMES['default'].typography.baseFontSizePt,
      
      setMarkdown: (markdown) => set({ markdown }),
      setDestination: (destination) => set({ destination }),
      setThemeId: (themeId) => set({ themeId }),
      setBaseFontSize: (baseFontSize) => set({ baseFontSize }),
    }),
    {
      name: 'md-to-docs-storage',
      partialize: (state) => ({
        markdown: state.markdown,
        destination: state.destination,
        themeId: state.themeId,
        baseFontSize: state.baseFontSize
      })
    }
  )
);
