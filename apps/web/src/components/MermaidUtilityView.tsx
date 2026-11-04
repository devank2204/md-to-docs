import { useState, useEffect, useMemo } from 'react';
import {
  inlineOndineColors,
  autoFixMermaidCode,
  sanitizeMermaidSvg,
  extractMermaidAccessibleText,
} from '@mdtodocs/asset-pipeline';
import { create, RenderError } from 'ondine/compiler/wasm';
import { wasm as all } from 'ondine/compiler/wasm/all';
import { LandingPageContent } from './LandingPageContent';
import { getRouteSpec, type LandingRoutePath } from '@/routes/landingData';
import { analytics } from '@/utils/analytics';

// Singleton in-browser Ondine WASM compiler instance
let ondineCompiler: ReturnType<typeof create> | null = null;
function getCompiler() {
  if (!ondineCompiler) {
    ondineCompiler = create({ modules: { all } });
  }
  return ondineCompiler;
}

export type DiagramBackground = 'transparent' | 'white' | 'dark';
export type PngScale = 1 | 2 | 4;

interface MermaidUtilityViewProps {
  currentPath: '/mermaid-to-svg' | '/mermaid-to-png';
  onNavigateRoute: (path: LandingRoutePath) => void;
  onOpenInStudio: (markdown: string) => void;
}

const TEMPLATES: { id: string; name: string; icon: string; code: string }[] = [
  {
    id: 'architecture',
    name: 'Architecture',
    icon: 'account_tree',
    code: `graph TD
  Client["Web Browser (React SPA)"] --> Gateway["API Gateway (Fastify)"]
  Gateway --> ServiceA["Auth & Session Service"]
  Gateway --> ServiceB["Document Compiler Engine (WASM)"]
  ServiceB --> Worker["Background Queue"]
  ServiceB --> Storage[("Encrypted Local Blob")]
`,
  },
  {
    id: 'sequence',
    name: 'Sequence',
    icon: 'timeline',
    code: `sequenceDiagram
  autonumber
  actor User as End User
  participant App as Client Application
  participant Auth as OAuth Provider
  participant API as Backend Service

  User->>App: Click "Sign in with SSO"
  App->>Auth: Request authorization code
  Auth-->>User: Prompt credentials
  User->>Auth: Enter 2FA passcode
  Auth-->>App: Redirect with auth code
  App->>API: Exchange code for JWT session
  API-->>App: Return secure HTTP-only token
  App-->>User: Display authenticated workspace
`,
  },
  {
    id: 'state',
    name: 'State Machine',
    icon: 'alt_route',
    code: `stateDiagram-v2
  [*] --> Draft
  Draft --> Compiling: User Types Markdown
  Compiling --> Valid: Zero Errors
  Compiling --> Degraded: Warning Detected
  Compiling --> Error: Syntax Issue
  Error --> AutoFixing: 1-Click Repair
  AutoFixing --> Compiling
  Valid --> ReadyToExport
  Degraded --> ReadyToExport
  ReadyToExport --> [*]
`,
  },
  {
    id: 'class',
    name: 'Class Diagram',
    icon: 'schema',
    code: `classDiagram
  class DocumentCompiler {
    +parseMarkdown(source: string) Root
    +planRepresentation(ast: Root) PlannedRoot
    +render(format: string) OutputBuffer
  }
  class AssetPipeline {
    +renderMermaid(code: string) SvgResult
    +inlineOndineColors(svg: string) CleanSvg
  }
  DocumentCompiler --> AssetPipeline : uses
`,
  },
];

export function MermaidUtilityView({
  currentPath,
  onNavigateRoute,
  onOpenInStudio,
}: MermaidUtilityViewProps) {
  const spec = getRouteSpec(currentPath);
  const isSvgFocused = currentPath === '/mermaid-to-svg';

  const [code, setCode] = useState<string>(() => {
    return isSvgFocused ? TEMPLATES[0].code : TEMPLATES[1].code;
  });

  const [background, setBackground] = useState<DiagramBackground>('transparent');
  const [pngScale, setPngScale] = useState<PngScale>(2);
  const [zoom, setZoom] = useState<number>(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'svg' | 'png' | 'code' | 'accessible' | null>(null);

  // Compilation state
  const [svgOutput, setSvgOutput] = useState<string>('');
  const [rawDimensions, setRawDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 400,
  });
  const [error, setError] = useState<{
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
  } | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Compile Mermaid via Ondine WASM on code / background change
  useEffect(() => {
    let isCancelled = false;
    setIsCompiling(true);

    try {
      const compiler = getCompiler();
      const isDark = background === 'dark';
      const isTransparent = background === 'transparent';
      const bgHex = background === 'dark' ? '#1e1e24' : background === 'white' ? '#ffffff' : undefined;

      try {
        const rawResult = compiler.render(code);
        if (!isCancelled) {
          const inlined = inlineOndineColors(rawResult.svg, {
            isDark,
            transparent: isTransparent,
            background: bgHex,
          });
          const sanitized = sanitizeMermaidSvg(inlined);
          setSvgOutput(sanitized);
          setRawDimensions({
            width: rawResult.width || 600,
            height: rawResult.height || 400,
          });
          setError(null);
          setIsCompiling(false);
        }
      } catch (renderErr: any) {
        // Try auto-repair
        const repaired = autoFixMermaidCode(code);
        if (repaired !== code) {
          try {
            const rawRepaired = compiler.render(repaired);
            if (!isCancelled) {
              const inlined = inlineOndineColors(rawRepaired.svg, {
                isDark,
                transparent: isTransparent,
                background: bgHex,
              });
              const sanitized = sanitizeMermaidSvg(inlined);
              setSvgOutput(sanitized);
              setRawDimensions({
                width: rawRepaired.width || 600,
                height: rawRepaired.height || 400,
              });
              setError(null);
              setIsCompiling(false);
              return;
            }
          } catch {
            // Fall through to error
          }
        }

        if (!isCancelled) {
          const isOndineError =
            renderErr instanceof RenderError || renderErr?.name === 'Render.RenderError';
          setError({
            message: renderErr?.message || 'Failed to render Mermaid diagram',
            line: isOndineError ? renderErr.line : undefined,
            column: isOndineError ? renderErr.column : undefined,
            snippet: isOndineError ? renderErr.snippet : undefined,
          });
          setIsCompiling(false);
        }
      }
    } catch (e: any) {
      if (!isCancelled) {
        setError({ message: e?.message || 'Compiler failed to initialize' });
        setIsCompiling(false);
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [code, background]);

  // Extract accessible text
  const accessibleText = useMemo(() => {
    return extractMermaidAccessibleText(code);
  }, [code]);

  // Handlers
  const handleCopySvg = async () => {
    if (!svgOutput) return;
    try {
      await navigator.clipboard.writeText(svgOutput);
      setCopiedType('svg');
      analytics.track('export_success', { destination: 'mermaid', format: 'svg', durationMs: 0 });
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error('Failed to copy SVG:', e);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mermaid-diagram-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    analytics.track('export_success', { destination: 'mermaid', format: 'svg', durationMs: 0 });
  };

  const rasterizeToCanvas = async (scale: number): Promise<HTMLCanvasElement | null> => {
    if (!svgOutput) return null;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(rawDimensions.width * scale);
      canvas.height = Math.round(rawDimensions.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      const svgBlob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        if (background === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (background === 'dark') {
          ctx.fillStyle = '#1e1e24';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  };

  const handleCopyPng = async () => {
    try {
      const canvas = await rasterizeToCanvas(pngScale);
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedType('png');
          analytics.track('export_success', { destination: 'mermaid', format: 'png', durationMs: 0 });
          setTimeout(() => setCopiedType(null), 2000);
        } catch (err) {
          console.error('Failed to copy PNG to clipboard:', err);
        }
      }, 'image/png');
    } catch (e) {
      console.error('Failed to rasterize PNG:', e);
    }
  };

  const handleDownloadPng = async () => {
    try {
      const canvas = await rasterizeToCanvas(pngScale);
      if (!canvas) return;

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `mermaid-diagram-${pngScale}x-${Date.now()}.png`;
      a.click();
      analytics.track('export_success', { destination: 'mermaid', format: 'png', durationMs: 0 });
    } catch (e) {
      console.error('Failed to download PNG:', e);
    }
  };

  const handleAutoFix = () => {
    const fixed = autoFixMermaidCode(code);
    setCode(fixed);
  };

  const handleOpenStudio = () => {
    const docMarkdown = `# Architecture Diagram\n\n\`\`\`mermaid\n${code.trim()}\n\`\`\`\n\nExported from the Mermaid utility workspace.\n`;
    onOpenInStudio(docMarkdown);
  };

  const handleCopyAccessible = async () => {
    try {
      await navigator.clipboard.writeText(accessibleText);
      setCopiedType('accessible');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error('Failed to copy accessible transcript:', e);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-surface text-on-surface">
      {/* Top Utility Nav Header */}
      <header className="sticky top-12 z-20 w-full bg-surface-container-low/90 backdrop-blur-md border-b border-outline-variant/30 px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateRoute('/')}
            className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-on-surface px-2 py-1 rounded-md hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Document Studio</span>
          </button>

          <span className="text-outline-variant">|</span>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs">
            <button
              type="button"
              onClick={() => onNavigateRoute('/mermaid-to-svg')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                isSvgFocused
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">account_tree</span>
              <span>Mermaid to SVG</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateRoute('/mermaid-to-png')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                !isSvgFocused
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">image</span>
              <span>Mermaid to PNG</span>
            </button>
          </div>
        </div>

        {/* Quick action: Open in Studio */}
        <button
          type="button"
          onClick={handleOpenStudio}
          title="Open this diagram in full document editor"
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-medium text-on-surface transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] text-primary">edit_document</span>
          <span>Open in Document Studio</span>
        </button>
      </header>

      {/* Main Workspace: Code on Left, Diagram on Right */}
      <section className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* Left Column: Mermaid Source Code & Controls */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Template Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-primary">code</span>
              <span>Mermaid Code</span>
            </span>

            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-semibold text-outline mr-1">Templates:</span>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setCode(tpl.code)}
                  title={`Load ${tpl.name} template`}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-secondary hover:text-on-surface transition-colors cursor-pointer"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Code Textarea Container */}
          <div className="relative flex-1 flex flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest overflow-hidden shadow-xs">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Mermaid diagram code..."
              spellCheck={false}
              className="flex-1 w-full p-4 font-code-sm text-xs leading-relaxed bg-transparent text-on-surface resize-none focus:outline-none min-h-[340px]"
            />

            {/* Error Banner with 1-click Auto-Fix */}
            {error && (
              <div className="p-3 bg-rose-500/10 border-t border-rose-500/20 text-rose-800 dark:text-rose-200 text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-rose-600">error</span>
                    <span>Syntax Error {error.line ? `(Line ${error.line})` : ''}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFix}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white font-medium text-[11px] hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                    <span>Auto-Fix</span>
                  </button>
                </div>
                <p className="font-mono text-[11px] leading-snug">{error.message}</p>
                {error.snippet && (
                  <pre className="p-1.5 rounded bg-black/10 dark:bg-white/10 text-[10px] font-mono overflow-x-auto">
                    {error.snippet}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Advanced Settings & Accessibility */}
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full px-3 py-2 flex items-center justify-between text-secondary hover:text-on-surface font-medium cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">accessibility</span>
                <span>Accessibility & Diagram Metadata</span>
              </div>
              <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: isAdvancedOpen ? 'rotate(180deg)' : 'none' }}>
                expand_more
              </span>
            </button>

            {isAdvancedOpen && (
              <div className="p-3 border-t border-outline-variant/20 flex flex-col gap-2.5 bg-surface-container-lowest">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface mb-1">
                    <span>Generated Screen Reader Alternative</span>
                    <button
                      type="button"
                      onClick={handleCopyAccessible}
                      className="text-primary hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {copiedType === 'accessible' ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedType === 'accessible' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed bg-surface-container-low p-2 rounded border border-outline-variant/30 font-sans">
                    {accessibleText}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-outline pt-1 border-t border-outline-variant/20">
                  <span>Native Size: {Math.round(rawDimensions.width)} × {Math.round(rawDimensions.height)} px</span>
                  <span>Payload: ~{(svgOutput.length / 1024).toFixed(1)} KB SVG</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Diagram Canvas & Export Actions */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
          {/* Diagram Canvas Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">preview</span>
                <span>Live Vector Preview</span>
              </span>

              {isCompiling && (
                <span className="flex items-center gap-1 text-[11px] text-outline animate-pulse">
                  <span className="material-symbols-outlined text-[13px] animate-spin">refresh</span>
                  <span>Compiling...</span>
                </span>
              )}
            </div>

            {/* Background & Scale Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Background Picker */}
              <div className="flex items-center p-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs">
                <button
                  type="button"
                  onClick={() => setBackground('transparent')}
                  title="Transparent background"
                  className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    background === 'transparent'
                      ? 'bg-surface font-semibold text-on-surface shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">grid_view</span>
                  <span>Alpha</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackground('white')}
                  title="Solid White background"
                  className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    background === 'white'
                      ? 'bg-surface font-semibold text-on-surface shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-black/20" />
                  <span>White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackground('dark')}
                  title="Dark slate background"
                  className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    background === 'dark'
                      ? 'bg-surface font-semibold text-on-surface shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/20" />
                  <span>Dark</span>
                </button>
              </div>

              {/* PNG Scale Multiplier */}
              <div className="flex items-center p-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs">
                {([1, 2, 4] as PngScale[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPngScale(s)}
                    title={s === 1 ? '1x Standard Web' : s === 2 ? '2x Retina (144 DPI)' : '4x Ultra HD Print (300 DPI)'}
                    className={`px-2 py-0.5 rounded font-mono cursor-pointer transition-colors ${
                      pngScale === s
                        ? 'bg-surface font-semibold text-on-surface shadow-xs'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diagram Preview Surface */}
          <div
            className={`relative flex-1 flex items-center justify-center min-h-[380px] rounded-xl border border-outline-variant/40 overflow-hidden shadow-xs ${
              background === 'transparent'
                ? 'bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%),linear-gradient(-45deg,#f4f4f5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f4f4f5_75%),linear-gradient(-45deg,transparent_75%,#f4f4f5_75%)] dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]'
                : background === 'dark'
                ? 'bg-[#1e1e24]'
                : 'bg-white'
            }`}
          >
            {/* Diagram Viewport Container */}
            <div
              className="p-6 max-w-full max-h-full overflow-auto flex items-center justify-center transition-transform duration-150"
              style={{ transform: `scale(${zoom})` }}
            >
              {svgOutput ? (
                <div
                  className="mermaid-utility-svg-container [&>svg]:max-w-full [&>svg]:h-auto select-none"
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-outline select-none py-16">
                  <span className="material-symbols-outlined text-[36px] opacity-40 mb-2">account_tree</span>
                  <span className="text-xs">Enter valid Mermaid code to compile vector preview</span>
                </div>
              )}
            </div>

            {/* Floating Zoom Controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 p-1 rounded-lg bg-surface/90 backdrop-blur-md border border-outline-variant/40 shadow-xs text-xs select-none">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}
                title="Zoom out"
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">remove</span>
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Reset zoom to 100%"
                className="px-1.5 font-mono text-[11px] text-on-surface hover:bg-surface-container rounded cursor-pointer"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
                title="Zoom in"
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
              </button>
            </div>
          </div>

          {/* Action Row: Export & Copy Buttons */}
          <div className="flex items-center flex-wrap justify-between gap-2 pt-1">
            {/* Primary Action Button Pair */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Download Primary (SVG or PNG depending on focus) */}
              <button
                type="button"
                onClick={isSvgFocused ? handleDownloadSvg : handleDownloadPng}
                disabled={!svgOutput}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>{isSvgFocused ? 'Download SVG' : `Download PNG (${pngScale}x)`}</span>
              </button>

              {/* Copy Primary */}
              <button
                type="button"
                onClick={isSvgFocused ? handleCopySvg : handleCopyPng}
                disabled={!svgOutput}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface text-xs font-medium shadow-2xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-primary">
                  {(isSvgFocused && copiedType === 'svg') || (!isSvgFocused && copiedType === 'png')
                    ? 'check'
                    : isSvgFocused
                    ? 'code'
                    : 'content_paste'}
                </span>
                <span>
                  {isSvgFocused
                    ? copiedType === 'svg'
                      ? 'SVG Copied!'
                      : 'Copy SVG Code'
                    : copiedType === 'png'
                    ? 'Image Copied!'
                    : 'Copy PNG Image'}
                </span>
              </button>
            </div>

            {/* Secondary Action Alternates */}
            <div className="flex items-center gap-2">
              {isSvgFocused ? (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={!svgOutput}
                    title={`Export high-res PNG at ${pngScale}x`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-medium text-secondary hover:text-on-surface transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">image</span>
                    <span>Download PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPng}
                    disabled={!svgOutput}
                    title="Copy PNG bitmap directly to clipboard"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-medium text-secondary hover:text-on-surface transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedType === 'png' ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedType === 'png' ? 'Copied' : 'Copy Image'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    disabled={!svgOutput}
                    title="Download vector SVG"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-medium text-secondary hover:text-on-surface transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">account_tree</span>
                    <span>Download SVG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySvg}
                    disabled={!svgOutput}
                    title="Copy SVG XML markup"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-medium text-secondary hover:text-on-surface transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedType === 'svg' ? 'check' : 'code'}
                    </span>
                    <span>{copiedType === 'svg' ? 'Copied' : 'Copy SVG'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SEO & Educational Guidance Below Workspace */}
      {spec && (
        <LandingPageContent
          spec={spec}
          onLoadSample={(sample) => setCode(sample)}
          onNavigateRoute={onNavigateRoute}
        />
      )}
    </div>
  );
}
