import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { THEMES } from '@mdtodocs/compiler-core';
import type { Root } from 'mdast';
import {
  extractDocumentTitle,
  createDocumentItem,
  duplicateDocumentItem,
  createDocumentSnapshot,
  restoreDocumentSnapshot,
  type DocumentItem,
  type DocumentSnapshot,
} from '@mdtodocs/renderers';

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
  isCommandPaletteOpen: boolean;
  isInspectorOpen: boolean;
  isFidelityPanelOpen: boolean;
  isSuggestModalOpen: boolean;
  isTemplateGalleryOpen: boolean;
  isReconciliationModalOpen: boolean;
  isHistoryModalOpen: boolean;

  // Multi-Document Workspace & History
  documents: DocumentItem[];
  activeDocumentId: string;
  snapshots: DocumentSnapshot[];

  setMarkdown: (markdown: string) => void;
  setDestination: (destination: DestinationType) => void;
  setThemeId: (themeId: keyof typeof THEMES) => void;
  setBaseFontSize: (size: number) => void;
  setDocumentSignature: (signature: { enabled: boolean; placement: 'every-page' | 'last-page' }) => void;
  setCompiledDoc: (doc: Root | null) => void;
  setIsCompiling: (isCompiling: boolean) => void;
  setIsReviewMode: (isReviewMode: boolean) => void;
  setIsCommandPaletteOpen: (isCommandPaletteOpen: boolean) => void;
  setIsInspectorOpen: (isInspectorOpen: boolean) => void;
  setIsFidelityPanelOpen: (isFidelityPanelOpen: boolean) => void;
  setIsSuggestModalOpen: (isSuggestModalOpen: boolean) => void;
  setIsTemplateGalleryOpen: (isTemplateGalleryOpen: boolean) => void;
  setIsReconciliationModalOpen: (isReconciliationModalOpen: boolean) => void;
  setIsHistoryModalOpen: (isHistoryModalOpen: boolean) => void;

  createDocument: (initialMarkdown?: string, customTitle?: string) => string;
  switchDocument: (id: string) => void;
  renameDocument: (id: string, newTitle: string) => void;
  duplicateDocument: (id: string) => string;
  deleteDocument: (id: string) => void;
  createSnapshot: (label?: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      markdown: '',
      destination: 'google-docs',
      themeId: 'default',
      baseFontSize: THEMES['default'].typography.baseFontSizePt,
      documentSignature: {
        enabled: false,
        placement: 'last-page',
      },
      compiledDoc: null,
      isCompiling: false,
      isReviewMode:
        typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('mode') === 'review' ||
          new URLSearchParams(window.location.search).get('view') === 'review'),
      isCommandPaletteOpen: false,
      isInspectorOpen: false,
      isFidelityPanelOpen: false,
      isSuggestModalOpen: false,
      isTemplateGalleryOpen: false,
      isReconciliationModalOpen: false,
      isHistoryModalOpen: false,

      // Multi-Document Workspace Defaults
      documents: [
        {
          id: 'doc-default',
          title: 'RFC 9110: HTTP Architecture & Semantics',
          content: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeDocumentId: 'doc-default',
      snapshots: [],

      setMarkdown: (markdown) => {
        set((state) => {
          const activeId =
            state.activeDocumentId || (state.documents[0]?.id ?? 'doc-default');
          const title = extractDocumentTitle(markdown);
          const existingDocIndex = state.documents.findIndex((d) => d.id === activeId);

          let updatedDocs: DocumentItem[];
          if (existingDocIndex !== -1) {
            updatedDocs = [...state.documents];
            updatedDocs[existingDocIndex] = {
              ...updatedDocs[existingDocIndex],
              content: markdown,
              title,
              updatedAt: Date.now(),
            };
          } else {
            updatedDocs = [
              ...state.documents,
              {
                id: activeId,
                title,
                content: markdown,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ];
          }

          return {
            markdown,
            documents: updatedDocs,
            activeDocumentId: activeId,
          };
        });
      },

      setDestination: (destination) => set({ destination }),
      setThemeId: (themeId) => set({ themeId }),
      setBaseFontSize: (baseFontSize) => set({ baseFontSize }),
      setDocumentSignature: (documentSignature) => set({ documentSignature }),
      setCompiledDoc: (compiledDoc) => set({ compiledDoc }),
      setIsCompiling: (isCompiling) => set({ isCompiling }),
      setIsCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
      setIsInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
      setIsFidelityPanelOpen: (isFidelityPanelOpen) => set({ isFidelityPanelOpen }),
      setIsSuggestModalOpen: (isSuggestModalOpen) => set({ isSuggestModalOpen }),
      setIsTemplateGalleryOpen: (isTemplateGalleryOpen) => set({ isTemplateGalleryOpen }),
      setIsReconciliationModalOpen: (isReconciliationModalOpen) =>
        set({ isReconciliationModalOpen }),
      setIsHistoryModalOpen: (isHistoryModalOpen) => set({ isHistoryModalOpen }),

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

      createDocument: (initialMarkdown = '', customTitle) => {
        const title = customTitle?.trim() || extractDocumentTitle(initialMarkdown);
        const newDoc = createDocumentItem(initialMarkdown, title, get().destination);

        set((state) => {
          // Sync current active doc first
          const syncedDocs = state.documents.map((d) =>
            d.id === state.activeDocumentId
              ? { ...d, content: state.markdown, updatedAt: Date.now() }
              : d
          );

          const newSnapshots = initialMarkdown.trim()
            ? [createDocumentSnapshot(newDoc, 'Initial Draft'), ...state.snapshots]
            : state.snapshots;

          return {
            documents: [...syncedDocs, newDoc],
            activeDocumentId: newDoc.id,
            markdown: initialMarkdown,
            snapshots: newSnapshots.slice(0, 50),
          };
        });

        return newDoc.id;
      },

      switchDocument: (id) => {
        set((state) => {
          if (state.activeDocumentId === id) return state;

          const targetDoc = state.documents.find((d) => d.id === id);
          if (!targetDoc) return state;

          // Save current markdown to outgoing active doc
          const syncedDocs = state.documents.map((d) =>
            d.id === state.activeDocumentId
              ? { ...d, content: state.markdown, updatedAt: Date.now() }
              : d
          );

          return {
            documents: syncedDocs,
            activeDocumentId: id,
            markdown: targetDoc.content,
          };
        });
      },

      renameDocument: (id, newTitle) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, title: newTitle.trim() || d.title, updatedAt: Date.now() } : d
          ),
        }));
      },

      duplicateDocument: (id) => {
        let createdId = '';
        set((state) => {
          const target = state.documents.find((d) => d.id === id);
          if (!target) return state;

          const clone = duplicateDocumentItem({
            ...target,
            content: target.id === state.activeDocumentId ? state.markdown : target.content,
          });
          createdId = clone.id;

          const syncedDocs = state.documents.map((d) =>
            d.id === state.activeDocumentId
              ? { ...d, content: state.markdown, updatedAt: Date.now() }
              : d
          );

          const snap = createDocumentSnapshot(clone, 'Document Cloned');

          return {
            documents: [...syncedDocs, clone],
            activeDocumentId: clone.id,
            markdown: clone.content,
            snapshots: [snap, ...state.snapshots].slice(0, 50),
          };
        });
        return createdId;
      },

      deleteDocument: (id) => {
        set((state) => {
          if (state.documents.length <= 1) {
            // Reset to empty document
            const resetDoc = createDocumentItem('', 'Untitled Document', state.destination);
            return {
              documents: [resetDoc],
              activeDocumentId: resetDoc.id,
              markdown: '',
            };
          }

          const filtered = state.documents.filter((d) => d.id !== id);
          if (state.activeDocumentId === id) {
            const nextDoc = filtered[0];
            return {
              documents: filtered,
              activeDocumentId: nextDoc.id,
              markdown: nextDoc.content,
            };
          }

          return { documents: filtered };
        });
      },

      createSnapshot: (label = 'Manual Snapshot') => {
        set((state) => {
          const activeDoc = state.documents.find(
            (d) => d.id === state.activeDocumentId
          ) || {
            id: state.activeDocumentId || 'doc-default',
            title: extractDocumentTitle(state.markdown),
            content: state.markdown,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          const snapshot = createDocumentSnapshot(
            { ...activeDoc, content: state.markdown },
            label
          );

          return {
            snapshots: [snapshot, ...state.snapshots].slice(0, 50),
          };
        });
      },

      restoreSnapshot: (snapshotId) => {
        set((state) => {
          const snapshot = state.snapshots.find((s) => s.id === snapshotId);
          if (!snapshot) return state;

          const currentDoc = state.documents.find(
            (d) => d.id === state.activeDocumentId
          ) || {
            id: state.activeDocumentId || 'doc-default',
            title: extractDocumentTitle(state.markdown),
            content: state.markdown,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          const { updatedDoc, backupSnapshot } = restoreDocumentSnapshot(
            { ...currentDoc, content: state.markdown },
            snapshot
          );

          const updatedDocs = state.documents.map((d) =>
            d.id === state.activeDocumentId ? updatedDoc : d
          );

          return {
            documents: updatedDocs,
            markdown: updatedDoc.content,
            snapshots: [backupSnapshot, ...state.snapshots].slice(0, 50),
          };
        });
      },

      deleteSnapshot: (snapshotId) => {
        set((state) => ({
          snapshots: state.snapshots.filter((s) => s.id !== snapshotId),
        }));
      },
    }),
    {
      name: 'md-to-docs-storage',
      partialize: (state) => ({
        markdown: state.markdown,
        destination: state.destination,
        themeId: state.themeId,
        baseFontSize: state.baseFontSize,
        documentSignature: state.documentSignature,
        documents: state.documents,
        activeDocumentId: state.activeDocumentId,
        snapshots: state.snapshots,
      }),
    }
  )
);
