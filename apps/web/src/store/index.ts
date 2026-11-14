import { persistSafety, safetyVersions } from '../utils/safetyBackup';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { deviceStorage } from '../utils/deviceStorage';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { THEMES } from '@mdtodocs/compiler-core/src/theme';
import type { DocumentDiagnostic, DocumentPresetId } from '@mdtodocs/compiler-core';
import type { Root } from 'mdast';
import {
  extractDocumentTitle,
  createDocumentItem,
  duplicateDocumentItem,
  createDocumentSnapshot,
  restoreDocumentSnapshot,
  type DocumentItem,
  type DocumentSnapshot,
} from '@mdtodocs/renderers/src/documentManager';

export interface AppState {
  appAppearance: 'cream' | 'dark' | 'system';
  setAppAppearance: (value: 'cream' | 'dark' | 'system') => void;
  markdown: string;
  destination: DestinationType;
  htmlOutput: boolean;
  setHtmlOutput: (value: boolean) => void;
  themeId: keyof typeof THEMES;
  activePresetId: DocumentPresetId;
  baseFontSize: number;
  documentSignature: {
    enabled: boolean;
    placement: 'every-page' | 'last-page';
  };
  compiledDoc: Root | null;
  isCompiling: boolean;
  diagnostics: DocumentDiagnostic[];
  diagnosticsKey: string;
  diagnosticsFailed: boolean;
  setDiagnostics: (diagnostics: DocumentDiagnostic[], key?: string, failed?: boolean) => void;
  isReviewMode: boolean;
  isCommandPaletteOpen: boolean;
  isInspectorOpen: boolean;
  isRescuePanelOpen: boolean;
  isFidelityPanelOpen: boolean;
  isSuggestModalOpen: boolean;
  isTemplateGalleryOpen: boolean;
  isReconciliationModalOpen: boolean;
  isHistoryModalOpen: boolean;
  zoom: number;

  // Multi-Document Workspace & History
  documents: DocumentItem[];
  activeDocumentId: string;
  snapshots: DocumentSnapshot[];

  setMarkdown: (markdown: string) => void;
  setDestination: (destination: DestinationType) => void;
  setThemeId: (themeId: keyof typeof THEMES) => void;
  setActivePreset: (presetId: DocumentPresetId) => void;
  setBaseFontSize: (size: number) => void;
  setDocumentSignature: (signature: { enabled: boolean; placement: 'every-page' | 'last-page' }) => void;
  setCompiledDoc: (doc: Root | null) => void;
  setIsCompiling: (isCompiling: boolean) => void;
  setIsReviewMode: (isReviewMode: boolean) => void;
  setIsCommandPaletteOpen: (isCommandPaletteOpen: boolean) => void;
  setIsInspectorOpen: (isInspectorOpen: boolean) => void;
  setIsRescuePanelOpen: (isRescuePanelOpen: boolean) => void;
  setIsFidelityPanelOpen: (isFidelityPanelOpen: boolean) => void;
  setIsSuggestModalOpen: (isSuggestModalOpen: boolean) => void;
  setIsTemplateGalleryOpen: (isTemplateGalleryOpen: boolean) => void;
  setIsReconciliationModalOpen: (isReconciliationModalOpen: boolean) => void;
  setIsHistoryModalOpen: (isHistoryModalOpen: boolean) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;

  createDocument: (initialMarkdown?: string, customTitle?: string) => string;
  switchDocument: (id: string) => void;
  renameDocument: (id: string, newTitle: string) => void;
  duplicateDocument: (id: string) => string;
  deleteDocument: (id: string) => void;
  createSnapshot: (label?: string) => boolean;
  restoreSnapshot: (snapshotId: string) => boolean;
  pendingDocument: DocumentItem | null;
  resolveCapacity: (replaceId?: string) => boolean;
  deleteSnapshot: (snapshotId: string) => void;

  // View Routing & About Modal
  currentView: 'landing' | 'workspace';
  isAboutModalOpen: boolean;
  setCurrentView: (view: 'landing' | 'workspace') => void;
  setIsAboutModalOpen: (isOpen: boolean) => void;
  resetWorkspaceToHome: () => void;

  // Workspace Sidebar
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;

  // Session Export Analytics & Value Milestones
  sessionExportCount: number;
  recordSuccessfulExport: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      markdown: '',
      destination: 'google-docs',
      htmlOutput: false,
      setHtmlOutput: (htmlOutput) => set({ htmlOutput }),
      appAppearance: 'system',
      setAppAppearance: (appAppearance) => set({ appAppearance }),
      themeId: 'default',
      activePresetId: 'default',
      baseFontSize: THEMES['default'].typography.baseFontSizePt,
      documentSignature: {
        enabled: false,
        placement: 'last-page',
      },
      compiledDoc: null,
      isCompiling: false,
      diagnostics: [],
      diagnosticsKey: '',
      diagnosticsFailed: false,
      setDiagnostics: (diagnostics, diagnosticsKey = '', diagnosticsFailed = false) => set({ diagnostics, diagnosticsKey, diagnosticsFailed }),
      isReviewMode:
        typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('mode') === 'review' ||
          new URLSearchParams(window.location.search).get('view') === 'review'),
      isCommandPaletteOpen: false,
      isInspectorOpen: false,
      isRescuePanelOpen: false,
      setIsRescuePanelOpen: (isRescuePanelOpen) => set({ isRescuePanelOpen }),
      isFidelityPanelOpen: false,
      isSuggestModalOpen: false,
      isTemplateGalleryOpen: false,
      isReconciliationModalOpen: false,
      isHistoryModalOpen: false,

      // View Routing & About Modal Defaults
      currentView: 'landing',
      isAboutModalOpen: false,
      setCurrentView: (currentView) => set({ currentView }),
      setIsAboutModalOpen: (isAboutModalOpen) => set({ isAboutModalOpen }),
      resetWorkspaceToHome: () => {
        const resetDoc = createDocumentItem('', 'Untitled Document', get().destination);
        set({
          documents: [resetDoc],
          activeDocumentId: resetDoc.id,
          markdown: '',
          currentView: 'landing',
        });
      },

      // Workspace Sidebar
      isSidebarOpen: true,
      setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      // Multi-Document Workspace Defaults
      documents: [
        {
          id: 'doc-default',
          title: 'Untitled Document',
          content: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeDocumentId: 'doc-default',
      snapshots: [],
      pendingDocument: null,
      resolveCapacity: (replaceId) => {
        const state = get();
        const pending = state.pendingDocument;
        if (!replaceId) { set({ pendingDocument: null }); return true; }
        const old = state.documents.find(d => d.id === replaceId);
        if (!pending || !old) return false;
        const backup = createDocumentSnapshot({
          ...old,
          content: old.id === state.activeDocumentId ? state.markdown : old.content,
        }, 'Before capacity replacement');
        if (!persistSafety(backup)) return false;
        set({
          documents: [...state.documents.filter(d => d.id !== replaceId).map(d =>
            d.id === state.activeDocumentId ? { ...d, content: state.markdown } : d
          ), pending],
          activeDocumentId: pending.id,
          markdown: pending.content,
          currentView: 'workspace',
          snapshots: [backup, ...state.snapshots],
          pendingDocument: null,
        });
        return true;
      },
      sessionExportCount: 0,
      recordSuccessfulExport: () =>
        set((state) => ({ sessionExportCount: state.sessionExportCount + 1 })),

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
              title: updatedDocs[existingDocIndex].customTitle ? updatedDocs[existingDocIndex].title : title,
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
            currentView: markdown.trim().length > 0 ? 'workspace' : state.currentView,
          };
        });
      },

      zoom: 100,

      setDestination: (destination) => set({ destination }),
      setThemeId: (themeId) => set({ themeId }),
      setActivePreset: (activePresetId) => set({ activePresetId }),
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
      setZoom: (zoom) => set((state) => ({ zoom: typeof zoom === 'function' ? zoom(state.zoom) : zoom })),

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

        if(get().documents.length>=5){set({pendingDocument:newDoc});return ''}
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
            currentView: 'workspace',
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
            currentView: 'workspace',
          };
        });
      },

      renameDocument: (id, newTitle) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, customTitle: true, title: newTitle.trim() || d.title, updatedAt: Date.now() } : d
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
          if(state.documents.length>=5)return {pendingDocument:clone};
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
              currentView: 'workspace',
            };
          }

          const filtered = state.documents.filter((d) => d.id !== id);
          if (state.activeDocumentId === id) {
            const nextDoc = filtered[0];
            return {
              documents: filtered,
              activeDocumentId: nextDoc.id,
              markdown: nextDoc.content,
              currentView: 'workspace',
            };
          }

          return { documents: filtered };
        });
      },

      createSnapshot: (label = 'Manual Snapshot') => {
        let saved=false;
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

          if(!persistSafety(snapshot))return state;
          saved=true;
          return {
            snapshots: [snapshot, ...state.snapshots].slice(0, 50),
          };
        });
        return saved;
      },

      restoreSnapshot: (snapshotId) => {
        let restored=false;
        set((state) => {
          const snapshot = state.snapshots.find((s) => s.id === snapshotId);
          const savedSnapshot=snapshot || safetyVersions().find(s=>s.id===snapshotId);
          if (!savedSnapshot) return state;

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
            savedSnapshot
          );
          if(!persistSafety(backupSnapshot))return state;
          restored=true;

          const updatedDocs = state.documents.map((d) =>
            d.id === state.activeDocumentId ? updatedDoc : d
          );

          return {
            documents: updatedDocs,
            markdown: updatedDoc.content,
            snapshots: [backupSnapshot, ...state.snapshots].slice(0, 50),
          };
        });
        return restored;
      },

      deleteSnapshot: (snapshotId) => {
        set((state) => ({
          snapshots: state.snapshots.filter((s) => s.id !== snapshotId),
        }));
      },
    }),
    {
      name: 'md-to-docs-storage',
      storage: createJSONStorage(() => deviceStorage),
      partialize: (state) => ({
        markdown: state.markdown,
        destination: state.destination,
        htmlOutput: state.htmlOutput,
        appAppearance: state.appAppearance,
        themeId: state.themeId,
        activePresetId: state.activePresetId,
        baseFontSize: state.baseFontSize,
        documentSignature: state.documentSignature,
        documents: state.documents,
        activeDocumentId: state.activeDocumentId,
        snapshots: state.snapshots,
        currentView: state.currentView,
        isSidebarOpen: state.isSidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.activePresetId) {
            state.activePresetId = 'default';
          }
          if (!state.currentView) {
            state.currentView = state.markdown && state.markdown.trim().length > 0 ? 'workspace' : 'landing';
          }

        }
      },
    }
  )
);
