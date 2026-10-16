import React, { useEffect, useState, useId, useMemo } from 'react';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import type { Root } from 'mdast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';

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
}

interface MermaidDiagramProps {
  code: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const reactId = useId();
  const diagramId = `mermaid-${reactId.replace(/:/g, '')}`;

  const [renderResult, setRenderResult] = useState<{
    code: string;
    svg: string;
    error: string | null;
  }>({
    code: '',
    svg: '',
    error: null,
  });

  const isRendering = renderResult.code !== code;
  const svg = renderResult.code === code ? renderResult.svg : '';
  const error = renderResult.code === code ? renderResult.error : null;
  const [copiedType, setCopiedType] = useState<'svg' | 'code' | null>(null);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    let isMounted = true;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'strict',
    });

    mermaid
      .render(diagramId, code)
      .then((res) => {
        if (isMounted) {
          setRenderResult({ code, svg: res.svg, error: null });
        }
      })
      .catch((e: any) => {
        if (isMounted) {
          setRenderResult({
            code,
            svg: '',
            error: e?.message || 'Mermaid diagram syntax error',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [code, diagramId]);

  const handleCopySvg = async () => {
    if (!svg) return;
    try {
      await navigator.clipboard.writeText(svg);
      setCopiedType('svg');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error('Failed to copy SVG:', e);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedType('code');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  const handleDownloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svg) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return;

      let width = 800;
      let height = 600;
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          width = parts[2];
          height = parts[3];
        }
      } else {
        const w = parseFloat(svgEl.getAttribute('width') || '');
        const h = parseFloat(svgEl.getAttribute('height') || '');
        if (!isNaN(w) && w > 0) width = w;
        if (!isNaN(h) && h > 0) height = h;
      }

      const scale = 2; // High-resolution 2x canvas export
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'diagram.png';
        a.click();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        console.error('Failed to load SVG into image for PNG export');
      };
      img.src = url;
    } catch (e) {
      console.error('Failed to export PNG:', e);
    }
  };

  return (
    <div className="my-6 rounded border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
      {/* Diagram Action Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-container-low border-b border-outline-variant/20 font-code-sm text-[11px] text-secondary select-none">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-primary">account_tree</span>
          <span className="font-semibold uppercase tracking-wider text-on-surface">Diagram</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopySvg}
            disabled={!svg}
            title="Copy SVG XML to clipboard"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copiedType === 'svg' ? 'check' : 'content_copy'}
            </span>
            <span>{copiedType === 'svg' ? 'Copied SVG!' : 'Copy SVG'}</span>
          </button>

          <button
            onClick={handleCopyCode}
            title="Copy Mermaid source code"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copiedType === 'code' ? 'check' : 'code'}
            </span>
            <span>{copiedType === 'code' ? 'Copied Code!' : 'Copy Source'}</span>
          </button>

          <span className="text-outline-variant mx-0.5">·</span>

          <button
            onClick={handleDownloadSvg}
            disabled={!svg}
            title="Download diagram as .svg"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[13px]">download</span>
            <span>SVG</span>
          </button>

          <button
            onClick={handleDownloadPng}
            disabled={!svg}
            title="Download rasterized high-resolution diagram as .png"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[13px]">image</span>
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Diagram Viewport */}
      <div className="p-4 flex flex-col items-center justify-center min-h-[120px] bg-white overflow-x-auto">
        {isRendering ? (
          <div className="flex items-center gap-2 text-secondary font-code-sm text-code-sm py-8">
            <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
            <span>Rendering diagram...</span>
          </div>
        ) : error ? (
          <div className="w-full p-4 rounded bg-error-container/30 border border-error/20 text-on-surface">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-error font-medium">
                <span className="material-symbols-outlined text-[18px]">error_outline</span>
                <span>Mermaid Syntax Error</span>
              </div>
              <button
                onClick={() => setShowSource(!showSource)}
                className="text-secondary hover:text-on-surface font-code-sm text-[11px] underline"
              >
                {showSource ? 'Hide Code' : 'View Code'}
              </button>
            </div>
            <p className="font-code-sm text-[12px] text-error/90 mb-2">{error}</p>
            {showSource && (
              <pre className="p-3 bg-surface-container-high rounded text-[11px] font-code-sm overflow-x-auto text-on-surface">
                <code>{code}</code>
              </pre>
            )}
          </div>
        ) : (
          <div
            className="mermaid-preview w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </div>
  );
};

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
}) => {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  const destinationPlanPlugin = useMemo(() => {
    return [createDestinationPlanPlugin(destination)];
  }, [destination]);

  return (
    <div data-preview-pane className="col-span-12 md:col-span-7 lg:col-span-8 bg-surface-container-high/60 flex flex-col p-space-md relative h-auto min-h-[600px] md:h-full md:min-h-0 overflow-hidden">
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

      <div className="flex-1 flex justify-center p-space-lg overflow-y-auto min-h-0">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="w-full max-w-[816px] min-w-0 bg-surface-container-lowest transition-all duration-300 p-space-xxl shadow-[0_12px_36px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] rounded flex flex-col min-h-[1056px] relative border border-outline-variant/30 prose prose-slate box-border break-words [overflow-wrap:anywhere]"
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
                    <div className="w-full my-4 overflow-x-auto rounded border border-outline-variant/30 not-prose">
                      <table className="w-full border-collapse text-left text-[13px] font-sans" {...props}>
                        {children}
                      </table>
                    </div>
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
                  return (
                    <pre className="w-full max-w-full overflow-x-auto p-4 rounded bg-surface-container-low/70 border border-outline-variant/30 font-code-sm text-code-sm leading-relaxed my-4" {...props}>
                      {children}
                    </pre>
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
