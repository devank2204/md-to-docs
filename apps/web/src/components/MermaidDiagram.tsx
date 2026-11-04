import React, { useEffect, useState, useRef } from 'react';
import { create, RenderError } from 'ondine/compiler/wasm';
import { wasm as all } from 'ondine/compiler/wasm/all';
import { inlineOndineColors, autoFixMermaidCode } from '@mdtodocs/asset-pipeline';
import { useStore } from '@/store';
import { DiagramCanvasModal } from './DiagramCanvasModal';

export type MermaidTheme = 'neutral' | 'default' | 'dark' | 'forest' | 'base';

export { autoFixMermaidCode };

// Singleton in-browser Ondine WASM compiler instance
let ondineCompiler: ReturnType<typeof create> | null = null;
function getCompiler() {
  if (!ondineCompiler) {
    ondineCompiler = create({ modules: { all } });
  }
  return ondineCompiler;
}

interface MermaidDiagramProps {
  code: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const [theme, setTheme] = useState<MermaidTheme>('neutral');
  const [copiedType, setCopiedType] = useState<'svg' | 'code' | 'image' | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  const [renderResult, setRenderResult] = useState<{
    code: string;
    theme: MermaidTheme;
    svg: string;
    error: string | null;
    errorLine?: number;
    errorColumn?: number;
    errorSnippet?: string;
  }>({
    code: '',
    theme: 'neutral',
    svg: '',
    error: null,
  });

  const isRendering = renderResult.code !== code || renderResult.theme !== theme;
  const svg = renderResult.code === code && renderResult.theme === theme ? renderResult.svg : '';
  const error = renderResult.code === code && renderResult.theme === theme ? renderResult.error : null;
  const errorLineNumber = renderResult.code === code ? renderResult.errorLine : null;

  // Close overflow menu on outside click or Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isMenuOpen]);

  // Sub-millisecond Ondine WASM Diagram Compilation
  useEffect(() => {
    let isMounted = true;

    try {
      const compiler = getCompiler();
      const isDark = theme === 'dark';
      
      try {
        const rawResult = compiler.render(code);
        const inlined = inlineOndineColors(rawResult.svg, isDark);
        if (isMounted) {
          setRenderResult({
            code,
            theme,
            svg: inlined,
            error: null,
          });
        }
      } catch (err: any) {
        // Attempt auto-repair on syntax failure
        const repaired = autoFixMermaidCode(code);
        if (repaired !== code) {
          try {
            const rawResult = compiler.render(repaired);
            const inlined = inlineOndineColors(rawResult.svg, isDark);
            if (isMounted) {
              setRenderResult({
                code,
                theme,
                svg: inlined,
                error: null,
              });
              return;
            }
          } catch {
            // fall through to error reporting
          }
        }

        const isRenderErr = err instanceof RenderError || err?.name === 'Render.RenderError';
        const parsedLine = isRenderErr && err.line ? err.line : (() => {
          const match = /(?:line|Line)\s+(\d+)/.exec(err?.message || '');
          return match ? parseInt(match[1], 10) : undefined;
        })();

        if (isMounted) {
          setRenderResult({
            code,
            theme,
            svg: '',
            error: err?.message || 'Mermaid syntax error',
            errorLine: parsedLine,
            errorColumn: isRenderErr ? err.column : undefined,
            errorSnippet: isRenderErr ? err.snippet : undefined,
          });
        }
      }
    } catch (e: any) {
      if (isMounted) {
        setRenderResult({
          code,
          theme,
          svg: '',
          error: e?.message || 'Failed to compile diagram',
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [code, theme]);

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

  const getCanvasFromSvg = (backgroundColor = '#ffffff'): Promise<HTMLCanvasElement | null> => {
    return new Promise((resolve) => {
      if (!svg) return resolve(null);

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        if (!svgEl) return resolve(null);

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
        if (!ctx) return resolve(null);

        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = () => {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          console.error('Failed to load SVG into image for canvas rasterization');
          resolve(null);
        };

        img.src = url;
      } catch (err) {
        console.error('Error generating canvas from SVG:', err);
        resolve(null);
      }
    });
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

  const handleDownloadPng = async () => {
    const canvas = await getCanvasFromSvg('#ffffff');
    if (!canvas) return;

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'diagram.png';
    a.click();
  };

  const handleDownloadJpeg = async () => {
    const canvas = await getCanvasFromSvg('#ffffff');
    if (!canvas) return;

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = 'diagram.jpg';
    a.click();
  };

  const handleCopyImage = async () => {
    const canvas = await getCanvasFromSvg('#ffffff');
    if (!canvas) return;

    if (canvas.toBlob && navigator.clipboard && window.ClipboardItem) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedType('image');
          setTimeout(() => setCopiedType(null), 2000);
        } catch (e) {
          console.error('Failed to copy image to clipboard:', e);
        }
      }, 'image/png');
    }
  };

  const codeLines = code.split(/\r?\n/);
  const [fixStatus, setFixStatus] = useState<'idle' | 'fixed' | 'failed'>('idle');

  const handleAutoFix = () => {
    const fixed = autoFixMermaidCode(code);
    const currentMarkdown = useStore.getState().markdown;
    if (currentMarkdown.includes(code)) {
      const updated = currentMarkdown.replace(code, fixed);
      useStore.getState().setMarkdown(updated);
      setFixStatus('fixed');
      setTimeout(() => setFixStatus('idle'), 2500);
    } else {
      setFixStatus('failed');
      setTimeout(() => setFixStatus('idle'), 2500);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className="group relative my-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs not-prose overflow-hidden transition-all duration-200 hover:shadow-md hover:border-outline-variant/50"
      >
        {/* Subtle Floating Toolbar - secondary controls revealed on hover/focus/touch */}
        {!error && (
          <div
            data-print-hide
            className={`absolute top-2.5 right-2.5 z-20 flex items-center gap-1 p-1 rounded-lg bg-surface/90 dark:bg-surface-container-high/90 backdrop-blur-xs border border-outline-variant/50 shadow-xs transition-opacity duration-150 ${
              isMenuOpen
                ? 'opacity-100 ring-1 ring-primary/30'
                : 'opacity-100 [media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            }`}
          >
            {/* Direct Action: Inspect Fullscreen Canvas Studio */}
            <button
              type="button"
              onClick={() => setIsCanvasOpen(true)}
              disabled={!svg}
              aria-label="Inspect in Canvas Studio (Pan & Zoom)"
              title="Open in Fullscreen Canvas (Pan & Zoom)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-primary hover:bg-primary/10 transition-colors active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_full</span>
              <span className="text-[11px] font-semibold hidden sm:inline">Inspect Canvas</span>
            </button>

            <span className="w-px h-3.5 bg-outline-variant/50 mx-0.5" aria-hidden="true" />

            {/* Quick Action: Copy Diagram Image */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={!svg}
              aria-label="Copy diagram image to clipboard"
              title={copiedType === 'image' ? 'Copied image to clipboard!' : 'Copy diagram image'}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedType === 'image' ? 'check' : 'content_copy'}
              </span>
              <span className="text-[11px] font-medium hidden sm:inline">
                {copiedType === 'image' ? 'Copied' : 'Copy'}
              </span>
            </button>

            <span className="w-px h-3.5 bg-outline-variant/50 mx-0.5" aria-hidden="true" />

            {/* Secondary Options Trigger (Overflow Menu) */}
            <div className="relative">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="More diagram options"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                title="More options (Export SVG/PNG/JPEG, code, theme)"
                className={`p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors flex items-center justify-center cursor-pointer ${
                  isMenuOpen ? 'bg-surface-container-highest text-on-surface' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">more_vert</span>
              </button>

              {/* Overflow Dropdown */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-full mt-1.5 w-52 rounded-lg bg-surface-container-highest/98 backdrop-blur-md border border-outline-variant/70 shadow-lg py-1.5 text-xs text-on-surface z-30 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Theme Selector Section */}
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
                    Theme
                  </div>
                  <div className="px-3 py-1 mb-1">
                    <select
                      value={theme}
                      onChange={(e) => {
                        setTheme(e.target.value as MermaidTheme);
                      }}
                      aria-label="Select diagram theme"
                      className="w-full bg-surface-container border border-outline-variant/60 rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary font-sans cursor-pointer"
                    >
                      <option value="neutral">Neutral (Default)</option>
                      <option value="default">Default</option>
                      <option value="dark">Dark</option>
                      <option value="forest">Forest</option>
                      <option value="base">Base</option>
                    </select>
                  </div>

                  <div className="my-1 border-t border-outline-variant/40" />

                  {/* Downloads Section */}
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
                    Download
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleDownloadSvg();
                      setIsMenuOpen(false);
                    }}
                    disabled={!svg}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                    <span>Download SVG (Vector)</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleDownloadPng();
                      setIsMenuOpen(false);
                    }}
                    disabled={!svg}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">image</span>
                    <span>Download PNG (2x)</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleDownloadJpeg();
                      setIsMenuOpen(false);
                    }}
                    disabled={!svg}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">photo</span>
                    <span>Download JPEG</span>
                  </button>

                  <div className="my-1 border-t border-outline-variant/40" />

                  {/* Copy / Source Section */}
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
                    Clipboard & Source
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleCopySvg();
                      setIsMenuOpen(false);
                    }}
                    disabled={!svg}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">code</span>
                    <span>{copiedType === 'svg' ? 'Copied SVG!' : 'Copy SVG XML'}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleCopyCode();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">terminal</span>
                    <span>{copiedType === 'code' ? 'Copied Source!' : 'Copy Mermaid Source'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagram Viewport: clean, bounded max-height, no clumsy 2D scroll trapping */}
        <div
          onClick={() => {
            if (!error && svg) setIsCanvasOpen(true);
          }}
          className={`relative p-6 flex flex-col items-center justify-center min-h-[140px] max-h-[460px] overflow-hidden rounded-xl transition-colors ${
            !error && svg ? 'cursor-pointer' : ''
          } ${theme === 'dark' ? 'bg-[#1e1e24]' : 'bg-white'}`}
        >
          {isRendering ? (
            <div className="flex items-center gap-2 text-secondary font-code-sm text-code-sm py-8">
              <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
              <span>Rendering diagram ({theme})...</span>
            </div>
          ) : error ? (
            <div
              className="w-full p-4 rounded bg-error-container/20 border border-error/30 text-on-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-error font-medium">
                  <span className="material-symbols-outlined text-[18px]">error_outline</span>
                  <span>Mermaid Syntax Error</span>
                  {errorLineNumber && (
                    <span className="px-1.5 py-0.5 bg-error text-white text-[10px] font-bold rounded">
                      Line {errorLineNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFix}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary text-on-primary hover:bg-primary/90 text-xs font-medium shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Auto-fix common Mermaid syntax issues (unquoted labels, special characters, unclosed subgraphs)"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {fixStatus === 'fixed' ? 'check' : 'auto_fix_high'}
                    </span>
                    <span>{fixStatus === 'fixed' ? 'Repaired!' : 'Auto-Fix Diagram'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSource(!showSource)}
                    className="text-secondary hover:text-on-surface font-code-sm text-[11px] underline cursor-pointer"
                  >
                    {showSource ? 'Hide Details' : 'Debug Source'}
                  </button>
                </div>
              </div>

              <p className="font-code-sm text-[12px] text-error mb-3 font-mono leading-relaxed">
                {error}
              </p>

              {/* Interactive Syntax Error Debugger with Line Highlights */}
              <div className="rounded border border-outline-variant/30 bg-surface-container-high/60 p-2 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {codeLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isError = lineNum === errorLineNumber;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 px-2 py-0.5 rounded ${
                        isError
                          ? 'bg-error/15 text-error font-semibold border-l-2 border-error'
                          : 'text-on-surface'
                      }`}
                    >
                      <span className="w-6 text-right select-none opacity-40 text-[10px] tabular-nums">
                        {lineNum}
                      </span>
                      <span className="whitespace-pre">{line || ' '}</span>
                      {isError && (
                        <span className="ml-auto text-[10px] text-error flex items-center gap-1 select-none font-sans font-bold">
                          <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                          <span>Syntax error here</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Scaled Clean Vector Preview */}
              <div
                className="mermaid-preview w-full flex justify-center [&>svg]:max-w-full [&>svg]:max-h-[420px] [&>svg]:h-auto transition-transform duration-200 group-hover:scale-[1.008]"
                dangerouslySetInnerHTML={{ __html: svg }}
              />

              {/* Hover Canvas Overlay Pill (Figma / Linear Inspired) */}
              <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/25 via-transparent to-transparent">
                <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-lg text-[11px] font-medium tracking-wide active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[15px] text-primary">zoom_in_map</span>
                  <span>Inspect in Canvas Studio (Pan & Zoom)</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Interactive Canvas Lightbox */}
      <DiagramCanvasModal
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        svg={svg}
        code={code}
        diagramTitle="Diagram Canvas Studio"
      />
    </>
  );
};
