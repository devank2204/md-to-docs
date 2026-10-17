import React, { useEffect, useState, useId, useRef } from 'react';
import mermaid from 'mermaid';

export type MermaidTheme = 'neutral' | 'default' | 'dark' | 'forest' | 'base';

interface MermaidDiagramProps {
  code: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const reactId = useId();
  const diagramId = `mermaid-${reactId.replace(/:/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<MermaidTheme>('neutral');
  const [copiedType, setCopiedType] = useState<'svg' | 'code' | 'image' | null>(null);
  const [showSource, setShowSource] = useState(false);

  const [renderResult, setRenderResult] = useState<{
    code: string;
    theme: MermaidTheme;
    svg: string;
    error: string | null;
  }>({
    code: '',
    theme: 'neutral',
    svg: '',
    error: null,
  });

  const isRendering = renderResult.code !== code || renderResult.theme !== theme;
  const svg = (renderResult.code === code && renderResult.theme === theme) ? renderResult.svg : '';
  const error = (renderResult.code === code && renderResult.theme === theme) ? renderResult.error : null;

  useEffect(() => {
    let isMounted = true;

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: 'strict',
      });

      // Clear any prior temporary element mermaid might have appended on error
      const existingTemp = document.getElementById(diagramId);
      if (existingTemp) existingTemp.remove();

      mermaid
        .render(diagramId, code)
        .then((res) => {
          if (isMounted) {
            setRenderResult({ code, theme, svg: res.svg, error: null });
          }
        })
        .catch((e: any) => {
          if (isMounted) {
            const errorMsg = e?.message || e?.str || 'Mermaid syntax error';
            setRenderResult({
              code,
              theme,
              svg: '',
              error: errorMsg,
            });
          }
        });
    } catch (e: any) {
      if (isMounted) {
        setRenderResult({
          code,
          theme,
          svg: '',
          error: e?.message || 'Failed to initialize diagram',
        });
      }
    }

    return () => {
      isMounted = false;
      const el = document.getElementById(diagramId);
      if (el) el.remove();
    };
  }, [code, theme, diagramId]);

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

  // Parse line number from error message if available
  const errorLineNumber = error
    ? (() => {
        const match = /(?:line|Line)\s+(\d+)/.exec(error);
        return match ? parseInt(match[1], 10) : null;
      })()
    : null;

  const codeLines = code.split(/\r?\n/);

  return (
    <div
      ref={containerRef}
      className="my-6 rounded border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs not-prose"
    >
      {/* Diagram Action Bar */}
      <div
        data-print-hide
        className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-surface-container-low border-b border-outline-variant/20 font-code-sm text-[11px] text-secondary select-none gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-primary">account_tree</span>
            <span className="font-semibold uppercase tracking-wider text-on-surface">Diagram</span>
          </div>

          <span className="text-outline-variant">·</span>

          {/* Theme Selector */}
          <div className="flex items-center gap-1">
            <span className="text-secondary text-[11px]">Theme:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as MermaidTheme)}
              className="bg-transparent border border-outline-variant/30 rounded px-1.5 py-0.5 text-on-surface focus:outline-none focus:border-primary text-code-sm font-medium"
            >
              <option value="neutral">Neutral</option>
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="forest">Forest</option>
              <option value="base">Base</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Copy Image Button */}
          <button
            onClick={handleCopyImage}
            disabled={!svg}
            title="Copy high-res diagram image directly to clipboard"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[13px]">
              {copiedType === 'image' ? 'check' : 'content_copy'}
            </span>
            <span className="font-medium">
              {copiedType === 'image' ? 'Copied Image!' : 'Copy Image'}
            </span>
          </button>

          {/* Copy SVG */}
          <button
            onClick={handleCopySvg}
            disabled={!svg}
            title="Copy SVG XML to clipboard"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 disabled:opacity-40"
          >
            <span>{copiedType === 'svg' ? 'Copied SVG!' : 'SVG'}</span>
          </button>

          {/* Copy Source */}
          <button
            onClick={handleCopyCode}
            title="Copy Mermaid source code"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[13px]">code</span>
            <span>{copiedType === 'code' ? 'Copied Code!' : 'Source'}</span>
          </button>

          <span className="text-outline-variant mx-0.5">·</span>

          {/* Download SVG */}
          <button
            onClick={handleDownloadSvg}
            disabled={!svg}
            title="Download vector diagram as .svg"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[13px]">download</span>
            <span>SVG</span>
          </button>

          {/* Download PNG */}
          <button
            onClick={handleDownloadPng}
            disabled={!svg}
            title="Download rasterized 2x Retina diagram as .png"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[13px]">image</span>
            <span>PNG</span>
          </button>

          {/* Download JPEG */}
          <button
            onClick={handleDownloadJpeg}
            disabled={!svg}
            title="Download compressed diagram as .jpg with white background"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-container hover:text-on-surface transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[13px]">photo</span>
            <span>JPEG</span>
          </button>
        </div>
      </div>

      {/* Diagram Viewport */}
      <div className={`p-4 flex flex-col items-center justify-center min-h-[120px] overflow-x-auto ${theme === 'dark' ? 'bg-[#1e1e24]' : 'bg-white'}`}>
        {isRendering ? (
          <div className="flex items-center gap-2 text-secondary font-code-sm text-code-sm py-8">
            <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
            <span>Rendering diagram ({theme})...</span>
          </div>
        ) : error ? (
          <div className="w-full p-4 rounded bg-error-container/20 border border-error/30 text-on-surface">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-error font-medium">
                <span className="material-symbols-outlined text-[18px]">error_outline</span>
                <span>Mermaid Syntax Error</span>
                {errorLineNumber && (
                  <span className="px-1.5 py-0.5 bg-error text-white text-[10px] font-bold rounded">
                    Line {errorLineNumber}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSource(!showSource)}
                className="text-secondary hover:text-on-surface font-code-sm text-[11px] underline"
              >
                {showSource ? 'Hide Details' : 'Debug Source'}
              </button>
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
          <div
            className="mermaid-preview w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </div>
  );
};
