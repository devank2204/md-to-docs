import { DiagramReviewStrip } from './DiagramReviewStrip';
import { visit } from 'unist-util-visit';
import React, { createContext, useContext, lazy, useMemo } from 'react';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { planRepresentation, DiagnosticsCollector, type DocumentDiagnostic } from '@mdtodocs/compiler-core';
import type { Root } from 'mdast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { InteractiveTable } from './InteractiveTable';
import { FeatureBoundary } from './FeatureBoundary';
const MermaidDiagram = lazy(() => import('./MermaidDiagram').then(m => ({ default: m.MermaidDiagram })));
import { InteractiveCodeBlock } from './InteractiveCodeBlock';
import { useStore } from '@/store';

const PreviewImages = createContext<Map<string, string>>(new Map());
function PreparedPreviewImage({ src, alt, ...props }: any) {
  const prepared = useContext(PreviewImages).get(src);
  return <img src={prepared || src} alt={alt || ''} className="max-w-full h-auto rounded my-4 mx-auto block shadow-xs" loading={prepared ? 'eager' : 'lazy'} {...props} />;
}

interface DocumentPreviewProps {
  markdown: string;
  destination: DestinationType;
  isCompiling: boolean;
  documentSignature?: { enabled: boolean; placement: 'every-page' | 'last-page' };
  isReviewMode?: boolean;
  readingLayout?: boolean;
  reviewNotes?: DocumentDiagnostic[];
}

// Only source positions preserved by the planner receive anchors. No fuzzy text matching.
function sourceReviewPlugin(notes: DocumentDiagnostic[]) {
  return () => (tree: any) => {
    tree.children = tree.children.flatMap((node: any) => {
      if (node.type !== 'element' || !node.position) return [node];
      const line = node.position.start.line;
      const issues = notes.filter(note => note.position && note.position.line >= line && note.position.line <= node.position.end.line);
      const anchor = { type: 'element', tagName: 'span', properties: { 'data-source-line': line, 'data-source-offset': node.position.start.offset, className: ['source-anchor'], tabIndex: -1 }, children: [] };
      const marker = { type: 'element', tagName: 'button', properties: {
        type: 'button', 'data-review-marker': line, 'data-print-hide': true,
        className: ['review-marker', 'font-code-sm', 'text-code-sm'],
        'aria-label': `Review formatting at line ${line}`,
      }, children: [{ type: 'text', value: `Review formatting · ${issues.length} ${issues.length === 1 ? 'note' : 'notes'}` }] };
      return issues.length ? [anchor, node, marker] : [anchor, node];
    });
  };
}

// Rehype plugin to wrap headings and their section content into collapsible <details>
function groupHeadings(children: any[]): any[] {
  const result: any[] = [];
  let i = 0;
  while (i < children.length) {
    const child = children[i];
    if (child && child.type === 'element' && /^h[1-6]$/.test(child.tagName)) {
      const level = parseInt(child.tagName[1], 10);
      const sectionChildren: any[] = [];
      let j = i + 1;
      while (j < children.length) {
        const next = children[j];
        if (next && next.type === 'element' && /^h[1-6]$/.test(next.tagName)) {
          const nextLevel = parseInt(next.tagName[1], 10);
          if (nextLevel <= level) {
            break;
          }
        }
        sectionChildren.push(next);
        j++;
      }

      const nestedChildren = groupHeadings(sectionChildren);

      const detailsNode = {
        type: 'element',
        tagName: 'details',
        properties: {
          className: ['collapsible-section', 'group/sec', 'my-2'],
          open: true,
          'data-heading-level': level,
        },
        children: [
          {
            type: 'element',
            tagName: 'summary',
            properties: {
              className: [
                'cursor-pointer',
                'select-none',
                'flex',
                'items-center',
                'gap-1.5',
                'list-none',
                '[&::-webkit-details-marker]:hidden',
                'hover:opacity-80',
                'transition-opacity',
              ],
            },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: {
                  className: [
                    'material-symbols-outlined',
                    'text-[18px]',
                    'text-outline/60',
                    'group-hover/sec:text-primary',
                    'transition-transform',
                    'duration-150',
                    'group-open/sec:rotate-90',
                    'shrink-0',
                    'select-none',
                  ],
                  'aria-hidden': 'true',
                },
                children: [{ type: 'text', value: 'chevron_right' }],
              },
              child,
            ],
          },
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: [
                'collapsible-section-body',
                'pl-4',
                'border-l',
                'border-outline-variant/30',
                'ml-2',
                'my-1',
              ],
            },
            children: nestedChildren,
          },
        ],
      };
      result.push(detailsNode);
      i = j;
    } else {
      result.push(child);
      i++;
    }
  }
  return result;
}

const rehypeCollapsibleHeadings = () => (tree: any) => {
  if (tree && Array.isArray(tree.children)) {
    tree.children = groupHeadings(tree.children);
  }
};

// Remark plugin applying destination planner transformations directly to the ReactMarkdown AST
const createDestinationPlanPlugin = (destination: DestinationType) => () => (tree: Root) => {
  const collector = new DiagnosticsCollector();
  planRepresentation(tree, destination, collector);
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  markdown,
  destination,
  isCompiling,
  isReviewMode = false,
  readingLayout = false,
  reviewNotes = [],
}) => {
  const zoom = useStore((state) => state.zoom);
  const setZoom = useStore((state) => state.setZoom);
  const themeId = useStore((state) => state.themeId);
  const baseFontSize = useStore((state) => state.baseFontSize);

  const compiledDoc = useStore(state => state.compiledDoc);
  const diagnosticsKey = useStore(state => state.diagnosticsKey);
  const documentId = useStore(state => state.activeDocumentId);
  const preparedImages = useMemo(() => {
    const images = new Map<string, string>();
    if (!compiledDoc) return images;
    let revision: any[];
    try { revision = JSON.parse(diagnosticsKey); } catch { return images; }
    if (revision[0] !== documentId || revision[1] !== markdown || revision[2] !== destination) return images;
    // Reuse the compiler's completed image bytes. Offscreen images can settle
    // without another external request when the deferred preview mounts scrolled.
    visit(compiledDoc, (node: any) => {
      if (node.type === 'image' && node.data?.resolvedAsset?.data) images.set(node.url, node.data.resolvedAsset.data);
    });
    return images;
  }, [compiledDoc, diagnosticsKey, documentId, markdown, destination]);

  const isDark = themeId === 'dark';

  const destinationPlanPlugin = useMemo(() => {
    return [createDestinationPlanPlugin(destination)];
  }, [destination]);

  // Stable component types preserve open diagram menus, clipboard work and canvas
  // state when only compilation status/diagnostics change.
  const markdownComponents = useMemo(() => ({
                  p({ children, ...props }: any) {
                    return (
                      <p className="break-words [overflow-wrap:anywhere] leading-relaxed my-3" {...props}>
                        {children}
                      </p>
                    );
                  },
                  table({ children, ...props }: any) {
                    return (
                      <InteractiveTable {...props}>
                        {children}
                      </InteractiveTable>
                    );
                  },
                  th({ children, ...props }: any) {
                    return (
                      <th className="p-2.5 bg-surface-container-low font-semibold border border-outline-variant/30 break-words align-top text-on-surface" {...props}>
                        {children}
                      </th>
                    );
                  },
                  td({ children, ...props }: any) {
                    return (
                      <td className="p-2.5 border border-outline-variant/20 break-words align-top text-on-surface" {...props}>
                        {children}
                      </td>
                    );
                  },
                  pre({ children, ...props }: any) {
                    const child = Array.isArray(children) ? children[0] : children;
                    const className = child?.props?.className || '';
                    if (typeof className === 'string' && className.includes('language-mermaid')) {
                      return <>{children}</>;
                    }

                    const rawCode = typeof child?.props?.children === 'string'
                      ? child.props.children
                      : Array.isArray(child?.props?.children)
                      ? child.props.children.map((c: any) => typeof c === 'string' ? c : '').join('')
                      : '';

                    return (
                      <InteractiveCodeBlock className={className} rawCode={rawCode} {...props}>
                        {children}
                      </InteractiveCodeBlock>
                    );
                  },
                  img: PreparedPreviewImage,
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match && match[1] === 'mermaid') {
                      return <FeatureBoundary><MermaidDiagram code={String(children).replace(/\n$/, '')} sourceStart={props.node?.position?.start?.offset} /></FeatureBoundary>;
                    }
                    return <code className={`${className || ''} break-words`} {...props}>{children}</code>;
                  },
                  ul({ node, children, ...props }: any) {
                    const isPolyfill = (node as any)?.data?.polyfill === 'table-to-list';
                    if (isPolyfill) {
                      return (
                        <div className="my-4 border border-outline-variant/40 rounded bg-surface-container-low/40 p-3 not-prose">
                          <div className="flex items-center gap-1.5 font-code-sm text-[11px] text-secondary mb-2 select-none border-b border-outline-variant/20 pb-1.5">
                            <span className="material-symbols-outlined text-[14px] text-primary">swap_horiz</span>
                            <span className="font-semibold uppercase tracking-wider text-on-surface">Linearized Table</span>
                            <span className="text-outline">·</span>
                            <span>Adapted for {destination === 'word' ? 'Word' : 'Google Docs'} layout limits</span>
                          </div>
                          <ul {...props} className="pl-6 list-disc space-y-1 font-serif text-[15px]">{children}</ul>
                        </div>
                      );
                    }
                    return <ul {...props}>{children}</ul>;
                  },
                  a({ node, children, ...props }: any) {
                    const isPolyfill = (node as any)?.data?.polyfill === 'image-to-link';
                    if (isPolyfill) {
                      return (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-code-sm font-code-sm text-primary break-all">
                          <span className="material-symbols-outlined text-[13px]">link</span>
                          <a {...props} className="underline hover:text-primary-focus break-all">{children}</a>
                          <span className="text-secondary text-[10px]">(image fallback)</span>
                        </span>
                      );
                    }
                    return <a {...props} className="break-words underline hover:text-primary transition-colors">{children}</a>;
                  }
  }), [destination]);

  return (
    <PreviewImages.Provider value={preparedImages}>
    <div
      data-reading-layout={readingLayout || undefined}
      data-preview-pane
      className={
        isReviewMode
          ? 'w-full flex flex-col items-center relative overflow-visible bg-transparent'
          : `w-full ${isDark ? 'bg-[#0f172a]' : 'bg-[#f1f3f5]'} flex flex-col p-1.5 sm:p-space-md relative h-full min-h-0 overflow-hidden`
      }
    >
      <DiagramReviewStrip />
      <div data-preview-scroll className="flex-1 flex justify-center items-start p-1.5 sm:p-space-md md:p-space-lg overflow-y-auto overflow-x-hidden min-h-0 w-full">
        <div
          style={{
            transform: readingLayout ? undefined : `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            backgroundColor: isDark ? '#111827' : '#ffffff',
            color: isDark ? '#e5e7eb' : '#1a1a1a',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            fontSize: `${baseFontSize}pt`,
          }}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('[data-review-marker]'))
              window.dispatchEvent(new CustomEvent('mdtodocs:review'));
          }}
          data-document-paper
          className={`w-full max-w-[816px] min-w-0 transition-all duration-300 p-4 sm:p-space-md md:p-space-xxl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_12px_28px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] rounded-sm flex flex-col h-auto min-h-[1056px] relative border box-border break-words [overflow-wrap:anywhere] mb-space-xxl ${
            isDark ? 'prose prose-invert' : 'prose prose-slate'
          }`}
        >
          {isCompiling && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/20 overflow-hidden z-20 rounded-t-sm">
              <div className="h-full bg-primary animate-pulse w-full"></div>
            </div>
          )}
          {markdown.trim().length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-outline select-none text-center">
              <span className="material-symbols-outlined text-[42px] text-outline/30 mb-3">edit_document</span>
              <h3 className="font-serif text-lg text-on-surface font-medium">Untitled Document</h3>
              <p className="font-code-sm text-xs text-outline/70 mt-1.5 max-w-sm">
                Paste or type Markdown in the editor to see your document here.
              </p>
            </div>
          ) : (
            <div className="relative z-10 w-full min-w-0 font-serif text-on-surface break-words [overflow-wrap:anywhere] [&>h1]:text-headline-xl [&>h2]:text-headline-lg [&>h3]:text-headline-md [&_*]:transition-colors [&_*]:duration-500">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, ...destinationPlanPlugin]}
                rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }], sourceReviewPlugin(reviewNotes), rehypeCollapsibleHeadings]}
                components={markdownComponents}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Floating Canvas Zoom Control (beside document page) */}
      <div
        data-print-hide
        className="absolute bottom-5 right-5 z-30 flex items-center bg-surface/90 backdrop-blur-md border border-outline-variant/60 rounded-full shadow-md px-1.5 py-1 text-xs select-none"
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z - 10, 50))}
          className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Zoom out"
        >
          <span className="material-symbols-outlined text-[14px]">remove</span>
        </button>
        <button
          type="button"
          onClick={() => setZoom(100)}
          className="px-2 font-mono text-on-surface font-semibold text-[11px] tabular-nums hover:text-primary transition-colors cursor-pointer"
          title="Click to reset to 100%"
        >
          {zoom}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z + 10, 150))}
          className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Zoom in"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
        </button>
      </div>
    </div>
    </PreviewImages.Provider>
  );
};
