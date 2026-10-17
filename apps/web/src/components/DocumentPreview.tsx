import React, { useState, useMemo } from 'react';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import type { Root } from 'mdast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { InteractiveTable } from './InteractiveTable';
import { MermaidDiagram } from './MermaidDiagram';
import { InteractiveCodeBlock } from './InteractiveCodeBlock';

interface DocumentPreviewProps {
  markdown: string;
  destination: DestinationType;
  onDestinationChange?: (dest: DestinationType) => void;
  themeId: string;
  onThemeIdChange: (themeId: string) => void;
  baseFontSize: number;
  onBaseFontSizeChange: (size: number) => void;
  isCompiling: boolean;
  onOpenInspector: () => void;
  documentSignature: { enabled: boolean; placement: 'every-page' | 'last-page' };
  onDocumentSignatureChange: (signature: { enabled: boolean; placement: 'every-page' | 'last-page' }) => void;
  isReviewMode?: boolean;
}


// Remark plugin applying destination planner transformations directly to the ReactMarkdown AST
const createDestinationPlanPlugin = (destination: DestinationType) => () => (tree: Root) => {
  const collector = new DiagnosticsCollector();
  planRepresentation(tree, destination, collector);
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  markdown,
  destination,
  onDestinationChange,
  themeId,
  onThemeIdChange,
  baseFontSize,
  onBaseFontSizeChange,
  isCompiling,
  onOpenInspector,
  documentSignature,
  onDocumentSignatureChange,
  isReviewMode = false,
}) => {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  const destinationPlanPlugin = useMemo(() => {
    return [createDestinationPlanPlugin(destination)];
  }, [destination]);

  return (
    <div
      data-preview-pane
      className={
        isReviewMode
          ? 'w-full flex flex-col items-center relative overflow-visible bg-transparent'
          : 'col-span-12 md:col-span-7 lg:col-span-8 bg-surface-container-high/60 flex flex-col p-space-md relative h-auto min-h-[600px] md:h-full md:min-h-0 overflow-hidden'
      }
    >
      <div className="w-full flex flex-wrap items-center justify-between text-secondary font-code-sm text-code-sm pb-space-sm px-space-xs border-b border-outline-variant/20 mb-space-sm shrink-0 gap-space-sm" data-print-hide>
        <div className="flex flex-wrap items-center gap-space-sm">
          <span className="font-medium text-on-surface flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
            <span>Preview</span>
          </span>
          <span className="text-outline-variant">·</span>

          <div className="flex items-center gap-space-xs">
            <span className="text-secondary text-[11px]">Target:</span>
            <select
              className="bg-transparent border border-outline-variant/30 rounded px-2 py-0.5 text-on-surface focus:outline-none focus:border-primary text-code-sm font-semibold text-[11px]"
              value={destination}
              onChange={(e) => onDestinationChange?.(e.target.value as DestinationType)}
            >
              <option value="google-docs">Docs</option>
              <option value="word">Word</option>
              <option value="pdf">PDF</option>
              <option value="clipboard">Copy</option>
            </select>
          </div>

          <span className="text-outline-variant">·</span>

          <div className="flex items-center gap-space-xs">
            <span className="text-secondary text-[11px]">Theme:</span>
            <select
              className="bg-transparent border border-outline-variant/30 rounded px-2 py-0.5 text-on-surface focus:outline-none focus:border-primary text-code-sm"
              value={themeId}
              onChange={(e) => onThemeIdChange(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="clean">Clean</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <span className="text-outline-variant">·</span>

          <div className="flex items-center gap-space-xs">
            <span className="text-secondary text-[11px]">Size:</span>
            <input
              type="number"
              min="8"
              max="24"
              className="w-12 bg-transparent border border-outline-variant/30 rounded px-1.5 py-0.5 text-on-surface focus:outline-none focus:border-primary tabular-nums text-code-sm"
              value={baseFontSize}
              onChange={(e) => onBaseFontSizeChange(parseInt(e.target.value) || 12)}
            />
          </div>

          <span className="text-outline-variant">·</span>

          <div className="flex items-center gap-space-xs" title="Add an mdtodocs attribution line to exported documents.">
            <span className="text-secondary text-[11px]">Signature:</span>
            <select
              className="bg-transparent border border-outline-variant/30 rounded px-2 py-0.5 text-on-surface focus:outline-none focus:border-primary text-code-sm"
              value={documentSignature.enabled ? documentSignature.placement : 'off'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'off') {
                  onDocumentSignatureChange({ ...documentSignature, enabled: false });
                } else {
                  onDocumentSignatureChange({ enabled: true, placement: val as 'every-page' | 'last-page' });
                }
              }}
            >
              <option value="off">Off</option>
              <option value="every-page">Every page</option>
              <option value="last-page">Last page</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-space-sm ml-auto">
          <button
            onClick={onOpenInspector}
            className="flex items-center gap-space-xxs text-secondary hover:text-on-surface transition-colors font-code-sm text-code-sm px-space-xs py-0.5 rounded bg-surface border border-outline-variant/30 shadow-xs"
          >
            <span className="material-symbols-outlined text-[15px]">info</span>
            Details
          </button>
          <div className="flex items-center gap-space-xs bg-surface rounded p-space-xxs shadow-xs border border-outline-variant/20">
            <button
              onClick={handleZoomOut}
              title="Zoom out"
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="tabular-nums font-medium text-on-surface px-space-xs">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              title="Zoom in"
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-start p-space-lg overflow-y-auto min-h-0">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="w-full max-w-[816px] min-w-0 bg-surface-container-lowest transition-all duration-300 p-space-xxl shadow-[0_12px_36px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] rounded flex flex-col h-auto min-h-[1056px] relative border border-outline-variant/30 prose prose-slate box-border break-words [overflow-wrap:anywhere] mb-space-xxl"
        >
          {isCompiling && (
            <div className="absolute inset-0 bg-surface-container-lowest/50 flex items-center justify-center rounded z-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="relative z-10 w-full min-w-0 font-serif text-on-surface break-words [overflow-wrap:anywhere] [&>h1]:text-headline-xl [&>h2]:text-headline-lg [&>h3]:text-headline-md [&_*]:transition-colors [&_*]:duration-500">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, ...destinationPlanPlugin]}
              rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
              components={{
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
                img({ src, alt, ...props }: any) {
                  return (
                    <img
                      src={src}
                      alt={alt || ''}
                      className="max-w-full h-auto rounded my-4 mx-auto block shadow-xs"
                      loading="lazy"
                      {...props}
                    />
                  );
                },
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match && match[1] === 'mermaid') {
                    return <MermaidDiagram code={String(children).replace(/\n$/, '')} />;
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
              }}
            >
              {markdown}
            </ReactMarkdown>

            {documentSignature.enabled && (
              <div className="mt-12 text-right text-secondary/60 font-['Caveat',cursive] text-2xl select-none" style={{ pageBreakInside: 'avoid' }}>
                made with mdtodocs.com
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
