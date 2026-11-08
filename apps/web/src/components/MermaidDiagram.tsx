import React, { useEffect, useState, useRef, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useDiagramActions } from '@/hooks/useDiagramActions';
import { renderMermaid, autoFixMermaidCode } from '@mdtodocs/asset-pipeline';
import { useStore } from '@/store';
import { DiagramCanvasModal } from './DiagramCanvasModal';

export type MermaidTheme = 'neutral' | 'default' | 'dark' | 'forest' | 'base';

export { autoFixMermaidCode };

interface MermaidDiagramProps {
  code: string;
  sourceStart?: number;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, sourceStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const [theme, setTheme] = useState<MermaidTheme>('neutral');
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

  const scope = useStore(state => state.activeDocumentId);
  const actions = useDiagramActions(svg, code, scope);
  const copiedType = actions.copied;
  const menuId = useId();
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  useLayoutEffect(() => {
    if (!isMenuOpen) return;
    const place = () => {
      const trigger = menuButtonRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const inherited = getComputedStyle(trigger);
      const height = Math.min(600, window.innerHeight - 24);
      setMenuStyle({ position: 'fixed', width: 224, left: Math.max(12, Math.min(rect.right - 224, window.innerWidth - 236)), top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - height - 12)), maxHeight: height, overflowY: 'auto', fontFamily: inherited.fontFamily, letterSpacing: inherited.letterSpacing });
    };
    place();
    menuRef.current?.querySelector<HTMLElement>('select, button')?.focus();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [isMenuOpen]);
  const closeMenu = () => { setIsMenuOpen(false); menuButtonRef.current?.focus(); };

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

  useEffect(() => {
    let active = true;
    renderMermaid(code, { theme, repair: false, font: containerRef.current ? getComputedStyle(containerRef.current).fontFamily : undefined }).then(result => {
      if (!active) return;
      setRenderResult(result.success
        ? { code, theme, svg: result.svg, error: null }
        : { code, theme, svg: '', error: result.error.message, errorLine: result.error.line, errorColumn: result.error.column, errorSnippet: result.error.snippet });
    }).catch(() => { if (active) setRenderResult({ code, theme, svg: '', error: 'Could not render this diagram. Your source is unchanged.' }); });
    return () => { active = false; };
  }, [code, theme]);

  const handleCopySvg = () => actions.run('svg');
  const handleCopyCode = () => actions.run('code');
  const handleCopyImage = () => actions.run('image');
  const handleDownloadSvg = () => actions.run('download-svg');
  const handleDownloadPng = () => actions.run('download-png');
  const handleDownloadJpeg = () => actions.run('download-jpeg');

  const codeLines = code.split(/\r?\n/);
  const handleAutoFix = () => window.dispatchEvent(new CustomEvent('mdtodocs:mermaid-review', { detail: { sourceStart } }));

  return (
    <>
      <div
        ref={containerRef}
        className="group relative my-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs not-prose overflow-hidden transition-all duration-200 hover:shadow-md hover:border-outline-variant/50"
      >
        {/* Reserve space for actions so controls never cover diagram labels. */}
        {!error && (
          <div
            data-print-hide
            className={`relative ml-auto mr-2.5 mt-2.5 w-fit max-w-[calc(100%-20px)] z-20 flex items-center gap-1 p-1 rounded-lg bg-surface/90 dark:bg-surface-container-high/90 backdrop-blur-xs border border-outline-variant/50 shadow-xs transition-opacity duration-150 ${
              isMenuOpen
                ? 'opacity-100 ring-1 ring-primary/30'
                : 'opacity-100'
            }`}
          >
            {/* Direct Action: Inspect Fullscreen Canvas Studio */}
            <button
              type="button"
              onClick={() => setIsCanvasOpen(true)}
              disabled={!svg || actions.busy}
              aria-label="Inspect in Canvas Studio (Pan & Zoom)"
              title="Open in Fullscreen Canvas (Pan & Zoom)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-primary hover:bg-primary/10 transition-colors active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">open_in_full</span>
              <span className="text-[11px] font-semibold hidden sm:inline">Inspect Canvas</span>
            </button>

            <span className="w-px h-3.5 bg-outline-variant/50 mx-0.5" aria-hidden="true" />

            {/* Quick Action: Copy Diagram Image */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={!svg || actions.busy}
              aria-label="Copy diagram image to clipboard"
              title={copiedType === 'image' ? 'Copied image to clipboard!' : 'Copy diagram image'}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                {copiedType === 'image' ? 'check' : 'content_copy'}
              </span>
              <span className="text-[11px] font-medium">
                {copiedType === 'image' ? 'Copied' : 'Copy Image'}
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
                aria-haspopup="dialog"
                aria-controls={menuId}
                aria-expanded={isMenuOpen}
                title="More options (Export SVG/PNG/JPEG, code, theme)"
                className={`p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors flex items-center justify-center cursor-pointer ${
                  isMenuOpen ? 'bg-surface-container-highest text-on-surface' : ''
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[17px]">more_vert</span>
              </button>

              {/* Overflow Dropdown */}
              {isMenuOpen && createPortal(
                <div
                  id={menuId}
                  style={menuStyle}
                  ref={menuRef}
                  role="dialog"
                  aria-label="Diagram options"
                  onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); closeMenu(); } }}
                  className="diagram-options rounded-lg bg-surface-container-highest backdrop-blur-md border border-outline-variant/70 shadow-lg py-1.5 text-xs text-on-surface z-[200]"
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
                    onClick={() => {
                      handleDownloadSvg();
                      closeMenu();
                    }}
                    disabled={!svg || actions.busy}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">download</span>
                    <span>Download SVG (Vector)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadPng();
                      closeMenu();
                    }}
                    disabled={!svg || actions.busy}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">image</span>
                    <span>Download PNG (2x)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadJpeg();
                      closeMenu();
                    }}
                    disabled={!svg || actions.busy}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">photo</span>
                    <span>Download JPEG</span>
                  </button>

                  <div className="my-1 border-t border-outline-variant/40" />

                  <button type="button" onClick={() => { handleCopyImage(); closeMenu(); }} disabled={!svg || actions.busy}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-secondary">content_copy</span>
                    <span>Copy Image (PNG)</span>
                  </button>
                  {/* Copy / Source Section */}
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
                    Clipboard & Source
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleCopySvg();
                      closeMenu();
                    }}
                    disabled={!svg || actions.busy}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-secondary">code</span>
                    <span>{copiedType === 'svg' ? 'Copied SVG!' : 'Copy SVG XML'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCopyCode();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container text-left transition-colors cursor-pointer"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-secondary">terminal</span>
                    <span>{copiedType === 'code' ? 'Copied Source!' : 'Copy Mermaid Source'}</span>
                  </button>
                </div>, document.body
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
              <span aria-hidden="true" className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
              <span>Rendering diagram ({theme})...</span>
            </div>
          ) : error ? (
            <div
              className="w-full p-4 rounded bg-error-container/20 border border-error/30 text-on-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-error font-medium">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">error_outline</span>
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
                    aria-label="Review diagram fix"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary text-on-primary hover:bg-primary/90 text-xs font-medium shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="Review a validated fix before changing the source"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                      auto_fix_high
                    </span>
                    <span>Review diagram fix</span>
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
              {showSource && <div className="rounded border border-outline-variant/30 bg-surface-container-high/60 p-2 font-mono text-[11px] overflow-x-auto leading-relaxed">
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
                          <span aria-hidden="true" className="material-symbols-outlined text-[12px]">arrow_back</span>
                          <span>Syntax error here</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>}
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
                  <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-primary">zoom_in_map</span>
                  <span>Inspect in Canvas Studio (Pan & Zoom)</span>
                </div>
              </div>
            </>
          )}
        </div>
        {actions.message && <p data-print-hide role={actions.error ? 'alert' : 'status'} className="px-3 py-2 font-code-sm text-code-sm text-on-surface">{actions.message}</p>}
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
