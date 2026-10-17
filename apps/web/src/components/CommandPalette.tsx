import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/store';
import { exportDocx, copyFormattedDoc, printPdf, copyPlainMarkdown } from '@/utils/exportHelpers';
import { DOCUMENT_TEMPLATES } from '@/data/templates';
import type { DestinationType } from '@mdtodocs/capability-graph';
import type { THEMES } from '@mdtodocs/compiler-core';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInspector?: () => void;
  onOpenFidelityPanel?: () => void;
  onOpenSuggestModal?: () => void;
  activeTheme?: any;
}

interface CommandItem {
  id: string;
  category:
    | 'Export & Share'
    | 'Destination'
    | 'View & Modes'
    | 'Theme & Typography'
    | 'Document Headings'
    | 'Templates & Starters'
    | 'Documents & Workspace'
    | 'Open Documents';
  title: string;
  description?: string;
  icon: string;
  shortcut?: string;
  isActive?: boolean;
  keywords?: string[];
  action: () => void;
}


export function CommandPalette(props: CommandPaletteProps) {
  if (!props.isOpen) return null;
  return <CommandPaletteModal {...props} />;
}

function CommandPaletteModal({
  onClose,
  onOpenInspector,
  onOpenFidelityPanel,
  onOpenSuggestModal,
  activeTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [prevQuery, setPrevQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const markdown = useStore((state) => state.markdown);
  const destination = useStore((state) => state.destination);
  const themeId = useStore((state) => state.themeId);
  const baseFontSize = useStore((state) => state.baseFontSize);
  const documentSignature = useStore((state) => state.documentSignature);
  const isReviewMode = useStore((state) => state.isReviewMode);
  const compiledDoc = useStore((state) => state.compiledDoc);
  const documents = useStore((state) => state.documents);
  const activeDocumentId = useStore((state) => state.activeDocumentId);

  const setMarkdown = useStore((state) => state.setMarkdown);
  const setDestination = useStore((state) => state.setDestination);
  const setThemeId = useStore((state) => state.setThemeId);
  const setBaseFontSize = useStore((state) => state.setBaseFontSize);
  const setDocumentSignature = useStore((state) => state.setDocumentSignature);
  const setIsReviewMode = useStore((state) => state.setIsReviewMode);
  const createDocument = useStore((state) => state.createDocument);
  const switchDocument = useStore((state) => state.switchDocument);
  const duplicateDocument = useStore((state) => state.duplicateDocument);
  const createSnapshot = useStore((state) => state.createSnapshot);
  const setIsHistoryModalOpen = useStore((state) => state.setIsHistoryModalOpen);


  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Extract headings from markdown
  const headingCommands = useMemo<CommandItem[]>(() => {
    if (!markdown) return [];
    const lines = markdown.split('\n');
    const items: CommandItem[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2].trim();
        items.push({
          id: `heading-${idx}`,
          category: 'Document Headings',
          title: headingText,
          description: `Jump to Heading ${level} (Line ${idx + 1})`,
          icon: level === 1 ? 'title' : 'format_size',
          action: () => {
            // Find heading elements in the preview sheet and scroll smoothly
            const previewEl = document.querySelector('[data-preview-pane]');
            if (previewEl) {
              const headings = previewEl.querySelectorAll('h1, h2, h3, h4');
              for (const h of Array.from(headings)) {
                if (h.textContent?.includes(headingText)) {
                  h.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  break;
                }
              }
            }
          },
        });
      }
    });

    return items;
  }, [markdown]);

  // Build standard commands
  const baseCommands = useMemo<CommandItem[]>(() => {
    return [
      // Export & Share
      {
        id: 'export-gdocs',
        category: 'Export & Share',
        title: 'Copy for Google Docs',
        description: 'Formatted HTML clipboard for native Google Docs paste',
        icon: 'content_copy',
        shortcut: 'Alt+C',
        action: async () => {
          await copyFormattedDoc(markdown, compiledDoc, 'google-docs', activeTheme, documentSignature);
        },
      },
      {
        id: 'export-word',
        category: 'Export & Share',
        title: 'Download Word Document (.docx)',
        description: 'Generate publication-grade OOXML Word document',
        icon: 'download',
        shortcut: 'Alt+W',
        action: async () => {
          await exportDocx(markdown, compiledDoc, activeTheme, documentSignature);
        },
      },
      {
        id: 'export-pdf',
        category: 'Export & Share',
        title: 'Export PDF (Print)',
        description: 'Open browser print dialog formatted with print stylesheets',
        icon: 'picture_as_pdf',
        shortcut: 'Alt+P',
        action: () => {
          printPdf();
        },
      },
      {
        id: 'copy-markdown',
        category: 'Export & Share',
        title: 'Copy Plain Markdown',
        description: 'Copy raw Markdown source code to clipboard',
        icon: 'file_copy',
        action: async () => {
          await copyPlainMarkdown(markdown);
        },
      },

      // Destinations
      {
        id: 'dest-gdocs',
        category: 'Destination',
        title: 'Target: Google Docs',
        description: 'Optimize representations for Google Docs compatibility',
        icon: 'description',
        isActive: destination === 'google-docs',
        action: () => setDestination('google-docs' as DestinationType),
      },
      {
        id: 'dest-word',
        category: 'Destination',
        title: 'Target: Microsoft Word',
        description: 'Optimize representations for Word OOXML',
        icon: 'article',
        isActive: destination === 'word',
        action: () => setDestination('word' as DestinationType),
      },
      {
        id: 'dest-pdf',
        category: 'Destination',
        title: 'Target: PDF Print',
        description: 'Optimize representations for paginated print media',
        icon: 'picture_as_pdf',
        isActive: destination === 'pdf',
        action: () => setDestination('pdf' as DestinationType),
      },
      {
        id: 'dest-clipboard',
        category: 'Destination',
        title: 'Target: Rich Clipboard',
        description: 'Multi-MIME clipboard format for universal paste',
        icon: 'assignment',
        isActive: destination === 'clipboard',
        action: () => setDestination('clipboard' as DestinationType),
      },

      // View & Modes
      {
        id: 'mode-review',
        category: 'View & Modes',
        title: isReviewMode ? 'Exit Review Mode (Return to Editor)' : 'Enter Stakeholder Review Mode',
        description: isReviewMode
          ? 'Switch to two-pane split markdown authoring'
          : 'Distraction-free centered document sheet with review controls',
        icon: isReviewMode ? 'edit_note' : 'visibility',
        isActive: isReviewMode,
        action: () => setIsReviewMode(!isReviewMode),
      },
      {
        id: 'action-suggest',
        category: 'View & Modes',
        title: 'Suggest an Edit / Propose Change',
        description: 'Open feedback modal to create GitHub issues or copy suggestions',
        icon: 'rate_review',
        action: () => onOpenSuggestModal?.(),
      },
      {
        id: 'action-reconcile',
        category: 'View & Modes',
        title: 'Reconcile Word Comments & Review Edits...',
        description: 'Import Word (.docx) comments, track changes, or paste review notes to patch markdown',
        icon: 'sync_alt',
        keywords: ['word', 'comment', 'review', 'patch', 'reconcile', 'track changes', 'diff', 'merge'],
        action: () => useStore.getState().setIsReconciliationModalOpen(true),
      },

      {
        id: 'view-inspector',
        category: 'View & Modes',
        title: 'Open Document Inspector',
        description: 'Inspect structure, element statistics, and fidelity score',
        icon: 'info',
        action: () => onOpenInspector?.(),
      },
      {
        id: 'view-fidelity',
        category: 'View & Modes',
        title: 'Open Fidelity Check Panel',
        description: 'View capability diagnostics and destination transformation notices',
        icon: 'verified',
        action: () => onOpenFidelityPanel?.(),
      },

      // Theme & Typography
      {
        id: 'theme-default',
        category: 'Theme & Typography',
        title: 'Theme: Modern Default (Corporate)',
        description: 'Professional serif typography with indigo accents',
        icon: 'palette',
        isActive: themeId === 'default',
        action: () => setThemeId('default' as keyof typeof THEMES),
      },
      {
        id: 'theme-clean',
        category: 'Theme & Typography',
        title: 'Theme: Clean Editorial (Minimalist)',
        description: 'Crisp sans-serif typography with generous spacing',
        icon: 'palette',
        isActive: themeId === 'clean',
        action: () => setThemeId('clean' as keyof typeof THEMES),
      },
      {
        id: 'theme-dark',
        category: 'Theme & Typography',
        title: 'Theme: Technical Dark',
        description: 'High-contrast dark palette tailored for engineering docs',
        icon: 'palette',
        isActive: themeId === 'dark',
        action: () => setThemeId('dark' as keyof typeof THEMES),
      },
      {
        id: 'font-small',
        category: 'Theme & Typography',
        title: 'Font Size: Compact (10.5 pt)',
        description: 'High information density layout',
        icon: 'text_fields',
        isActive: baseFontSize === 10.5,
        action: () => setBaseFontSize(10.5),
      },
      {
        id: 'font-normal',
        category: 'Theme & Typography',
        title: 'Font Size: Standard (11.5 pt)',
        description: 'Balanced reading layout',
        icon: 'text_fields',
        isActive: baseFontSize === 11.5,
        action: () => setBaseFontSize(11.5),
      },
      {
        id: 'font-large',
        category: 'Theme & Typography',
        title: 'Font Size: Large (12.5 pt)',
        description: 'Spacious presentation layout',
        icon: 'text_fields',
        isActive: baseFontSize === 12.5,
        action: () => setBaseFontSize(12.5),
      },
      {
        id: 'toggle-signature',
        category: 'Theme & Typography',
        title: documentSignature.enabled
          ? 'Document Signature: Enabled'
          : 'Document Signature: Disabled',
        description: 'Toggle generated timestamp and metadata footer',
        icon: 'draw',
        isActive: documentSignature.enabled,
        action: () =>
          setDocumentSignature({
            ...documentSignature,
            enabled: !documentSignature.enabled,
          }),
      },

      // Templates & Starters
      {
        id: 'open-template-gallery',
        category: 'Templates & Starters' as const,
        title: 'Browse Executive Template Gallery...',
        description: 'Explore full gallery of architectural, product, and leadership document templates',
        icon: 'collections_bookmark',
        action: () => {
          useStore.getState().setIsTemplateGalleryOpen(true);
        },
      },
      ...DOCUMENT_TEMPLATES.map((tmpl) => ({
        id: `template-${tmpl.id}`,
        category: 'Templates & Starters' as const,
        title: `Template: ${tmpl.title}`,
        description: `${tmpl.summary} (${tmpl.tags.join(', ')})`,
        icon: tmpl.icon,
        action: () => {
          setMarkdown(tmpl.content);
        },
      })),

      // Documents & Workspace
      {
        id: 'doc-new',
        category: 'Documents & Workspace' as const,
        title: 'Create New Document',
        description: 'Open a blank markdown draft in a new tab',
        icon: 'add_circle',
        shortcut: 'Ctrl+Alt+N',
        action: () => createDocument('', 'Untitled Document'),
      },
      {
        id: 'doc-duplicate',
        category: 'Documents & Workspace' as const,
        title: 'Duplicate Current Document',
        description: 'Create an exact cloned copy of the active document',
        icon: 'content_copy',
        action: () => duplicateDocument(activeDocumentId),
      },
      {
        id: 'doc-snapshot',
        category: 'Documents & Workspace' as const,
        title: 'Capture Document Snapshot',
        description: 'Save a point-in-time version checkpoint into history',
        icon: 'bookmark_add',
        action: () => createSnapshot('Manual Checkpoint'),
      },
      {
        id: 'doc-history',
        category: 'Documents & Workspace' as const,
        title: 'Browse Document History & Snapshots...',
        description: 'View point-in-time version timeline, compare, or roll back',
        icon: 'history',
        action: () => setIsHistoryModalOpen(true),
      },
      ...documents.map((doc) => ({
        id: `switch-doc-${doc.id}`,
        category: 'Open Documents' as const,
        title: `Switch to: ${doc.title || 'Untitled Document'}`,
        description: `Open document tab (${doc.content.split(/\s+/).filter(Boolean).length} words)`,
        icon: doc.id === activeDocumentId ? 'check_circle' : 'description',
        isActive: doc.id === activeDocumentId,
        keywords: ['switch', 'tab', 'document', doc.title.toLowerCase()],
        action: () => switchDocument(doc.id),
      })),
    ];
  }, [
    markdown,
    compiledDoc,
    destination,
    themeId,
    baseFontSize,
    documentSignature,
    isReviewMode,
    activeTheme,
    documents,
    activeDocumentId,
    setMarkdown,
    setDestination,
    setThemeId,
    setBaseFontSize,
    setDocumentSignature,
    setIsReviewMode,
    createDocument,
    switchDocument,
    duplicateDocument,
    createSnapshot,
    setIsHistoryModalOpen,
    onOpenInspector,
    onOpenFidelityPanel,
    onOpenSuggestModal,
  ]);


  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...baseCommands, ...headingCommands];
    if (!q) return all;

    return all.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchTitle || matchCat || matchDesc;
    });
  }, [query, baseCommands, headingCommands]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeItem = listRef.current.querySelector('[data-selected="true"]');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = filteredCommands[selectedIndex];
      if (command) {
        command.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      data-print-hide
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-high border border-outline-variant/60 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden text-on-surface flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-outline-variant/40 gap-3 bg-surface-container-low">
          <span className="material-symbols-outlined text-[22px] text-primary">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, destination, theme, or heading..."
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-on-surface-variant hover:text-on-surface text-xs px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-[11px] text-outline border border-outline-variant/60 font-mono">
              ESC
            </kbd>
          )}
        </div>

        {/* Commands List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-outline-variant/20">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              No matching commands or document headings found for "{query}".
            </div>
          ) : (
            filteredCommands.map((command, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={command.id}
                  data-selected={isSelected}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isSelected ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {command.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{command.title}</span>
                        {command.isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      {command.description && (
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {command.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: shortcut or category badge */}
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {command.shortcut ? (
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] text-on-surface-variant border border-outline-variant/60 font-mono">
                        {command.shortcut}
                      </kbd>
                    ) : (
                      <span className="text-[10px] text-outline font-normal">
                        {command.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 border-t border-outline-variant/40 bg-surface-container-low flex items-center justify-between text-[11px] text-outline font-code-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-surface-container border border-outline-variant/60">↑</kbd>
              <kbd className="px-1 py-0.2 rounded bg-surface-container border border-outline-variant/60">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-surface-container border border-outline-variant/60">↵</kbd>
              <span>to run</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-surface-container border border-outline-variant/60">esc</kbd>
              <span>to dismiss</span>
            </span>
          </div>

          <span className="hidden sm:inline">mdtodocs accelerator</span>
        </div>
      </div>
    </div>
  );
}
