import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { diagramFontForContext } from '@/utils/diagramImages';
import { useDiagramActions } from '@/hooks/useDiagramActions';
import { createPortal } from 'react-dom';

interface DiagramCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  svg: string;
  code: string;
  diagramTitle?: string;
}

export const DiagramCanvasModal: React.FC<DiagramCanvasModalProps> = ({
  isOpen,
  onClose,
  svg: sourceSvg,
  code,
  diagramTitle = 'Mermaid Diagram',
}) => {
  const svg = useMemo(() => diagramFontForContext(sourceSvg, getComputedStyle(document.body).fontFamily), [sourceSvg]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Canvas Transform State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0,
  });

  // Diagram Native Dimensions
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const actions = useDiagramActions(svg, code, isOpen ? 'canvas-open' : 'canvas-closed');
  const copiedType = actions.copied === 'image' ? 'png' : actions.copied;
  const [showMinimap, setShowMinimap] = useState(true);

  // Parse width & height from SVG viewBox or attributes
  useEffect(() => {
    if (!svg) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (svgEl) {
        let w = 800;
        let h = 600;
        const viewBox = svgEl.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/\s+/).map(Number);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            w = parts[2];
            h = parts[3];
          }
        } else {
          const widthAttr = parseFloat(svgEl.getAttribute('width') || '');
          const heightAttr = parseFloat(svgEl.getAttribute('height') || '');
          if (!isNaN(widthAttr) && widthAttr > 0) w = widthAttr;
          if (!isNaN(heightAttr) && heightAttr > 0) h = heightAttr;
        }
        setSvgDimensions({ width: w, height: h });
      }
    } catch {
      // Fallback to default dimensions
    }
  }, [svg]);

  // Fit diagram neatly into screen viewport with comfortable padding
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padding = 80; // Margin around diagram
    const availableW = Math.max(100, clientWidth - padding * 2);
    const availableH = Math.max(100, clientHeight - padding * 2);

    const scaleW = availableW / svgDimensions.width;
    const scaleH = availableH / svgDimensions.height;
    const fitScale = Math.min(scaleW, scaleH, 1.25); // Cap initial fit at 1.25x for small diagrams
    const boundedScale = Math.max(0.15, Math.min(3.0, fitScale));

    const renderedW = svgDimensions.width * boundedScale;
    const renderedH = svgDimensions.height * boundedScale;

    setZoom(boundedScale);
    setPan({
      x: (clientWidth - renderedW) / 2,
      y: (clientHeight - renderedH) / 2,
    });
  }, [svgDimensions]);

  // Reset to 100% actual scale centered
  const handleActualSize = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setZoom(1);
    setPan({
      x: (clientWidth - svgDimensions.width) / 2,
      y: (clientHeight - svgDimensions.height) / 2,
    });
  }, [svgDimensions]);

  // Initial fit when opened
  useEffect(() => {
    if (isOpen) {
      // Delay slightly for container layout measurement
      const timer = setTimeout(() => {
        handleFitToScreen();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, handleFitToScreen]);

  // Lock document body scroll while canvas studio is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [isOpen]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '0' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFitToScreen();
      } else if (e.key === '1') {
        e.preventDefault();
        handleActualSize();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((prev) => Math.min(5.0, prev * 1.2));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((prev) => Math.max(0.15, prev * 0.8));
      } else if (e.key === 'ArrowLeft') {
        setPan((p) => ({ ...p, x: p.x + 40 }));
      } else if (e.key === 'ArrowRight') {
        setPan((p) => ({ ...p, x: p.x - 40 }));
      } else if (e.key === 'ArrowUp') {
        setPan((p) => ({ ...p, y: p.y + 40 }));
      } else if (e.key === 'ArrowDown') {
        setPan((p) => ({ ...p, y: p.y - 40 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleFitToScreen, handleActualSize]);

  // Pointer Drag Pan Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on primary click
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Zoom centered on pointer location
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const nextZoom = Math.max(0.15, Math.min(5.0, zoom * zoomFactor));

    // Calculate focal shift to keep point under cursor invariant
    const newPanX = cursorX - (cursorX - pan.x) * (nextZoom / zoom);
    const newPanY = cursorY - (cursorY - pan.y) * (nextZoom / zoom);

    setZoom(nextZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Double click toggles between fit and 100%
  const handleDoubleClick = () => {
    if (Math.abs(zoom - 1) < 0.1) {
      handleFitToScreen();
    } else {
      handleActualSize();
    }
  };

  // Same gesture-safe image clipboard and recovery path as the inline diagram.
  const handleCopySvg = () => actions.run('svg');
  const handleCopyCode = () => actions.run('code');
  const handleDownloadSvg = () => actions.run('download-svg');
  const handleCopyPng = () => actions.run('image');

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')).filter(node => node.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Diagram Canvas Studio"
      className="fixed inset-0 z-50 w-full h-full max-w-none max-h-none m-0 p-0 border-0 flex flex-col select-none overflow-hidden animate-in fade-in duration-200"
    >
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/85 dark:bg-black/90 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Top Header Floating Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">schema</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span>{diagramTitle}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-300">
                Diagram preview
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {Math.round(svgDimensions.width)} × {Math.round(svgDimensions.height)} px · Drag to pan · Scroll to zoom
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono hidden md:inline mr-2">
            Double-click to toggle fit · <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Esc</kbd> to exit
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close canvas"
            title="Close (Esc)"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </header>

      {actions.message && <p role={actions.error ? 'alert' : 'status'} className="relative z-20 px-6 py-2 text-xs text-white bg-black/80">{actions.message}</p>}
      {/* Main Interactive Infinite Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className={`relative flex-1 w-full h-full overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          // Physical tactile Figma/Miro dot grid that scales and translates with pan/zoom
          backgroundImage:
            'radial-gradient(circle, rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px)',
          backgroundSize: `${Math.max(12, Math.min(96, 24 * zoom))}px ${Math.max(
            12,
            Math.min(96, 24 * zoom)
          )}px`,
          backgroundPosition: `${pan.x % (24 * zoom)}px ${pan.y % (24 * zoom)}px`,
        }}
      >
        {/* Rendered SVG Plane */}
        <div
          ref={contentRef}
          className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
            width: `${svgDimensions.width}px`,
            height: `${svgDimensions.height}px`,
          }}
        >
          <div
            className="w-full h-full rounded-xl shadow-2xl overflow-hidden [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        {/* Minimap / Radar Preview (Bottom-Right) */}
        {showMinimap && (
          <div className="absolute bottom-6 right-6 z-20 hidden sm:flex flex-col rounded-xl border border-white/15 bg-black/75 backdrop-blur-md p-2 shadow-2xl transition-all">
            <div className="flex items-center justify-between pb-1.5 px-1 border-b border-white/10 text-[10px] text-slate-400 font-medium">
              <span>Overview Radar</span>
              <button
                type="button"
                onClick={() => setShowMinimap(false)}
                className="hover:text-white transition-colors"
                title="Hide minimap"
              >
                ✕
              </button>
            </div>
            <div
              className="relative w-44 h-28 mt-1.5 rounded bg-slate-900/80 overflow-hidden flex items-center justify-center border border-white/5 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickXPercent = (e.clientX - rect.left) / rect.width;
                const clickYPercent = (e.clientY - rect.top) / rect.height;
                if (!containerRef.current) return;
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;
                setPan({
                  x: cw / 2 - clickXPercent * svgDimensions.width * zoom,
                  y: ch / 2 - clickYPercent * svgDimensions.height * zoom,
                });
              }}
            >
              <div
                className="w-full h-full opacity-60 [&>svg]:w-full [&>svg]:h-full pointer-events-none"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              {/* Illuminated Viewport Box */}
              {containerRef.current && (
                <div
                  className="absolute border-2 border-primary bg-primary/20 pointer-events-none rounded-xs transition-all"
                  style={{
                    left: `${Math.max(
                      0,
                      Math.min(
                        100,
                        ((-pan.x) / (svgDimensions.width * zoom)) * 100
                      )
                    )}%`,
                    top: `${Math.max(
                      0,
                      Math.min(
                        100,
                        ((-pan.y) / (svgDimensions.height * zoom)) * 100
                      )
                    )}%`,
                    width: `${Math.max(
                      10,
                      Math.min(
                        100,
                        (containerRef.current.clientWidth /
                          (svgDimensions.width * zoom)) *
                          100
                      )
                    )}%`,
                    height: `${Math.max(
                      10,
                      Math.min(
                        100,
                        (containerRef.current.clientHeight /
                          (svgDimensions.height * zoom)) *
                          100
                      )
                    )}%`,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Island HUD Controls (Bottom-Center, Linear / Raycast Style) */}
      <footer className="relative z-30 pb-6 pointer-events-none flex justify-center">
        <div className="pointer-events-auto flex flex-wrap justify-center max-w-[calc(100vw-24px)] items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 dark:bg-slate-950/95 border border-white/15 backdrop-blur-xl shadow-2xl text-xs text-white">
          {/* Fit to Screen */}
          <button
            type="button"
            onClick={handleFitToScreen}
            aria-label="Fit diagram to screen"
            title="Fit to Screen (F or 0)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">fit_screen</span>
            <span className="font-medium text-[11px] hidden sm:inline">Fit</span>
          </button>

          {/* 100% Actual Size */}
          <button
            type="button"
            onClick={handleActualSize}
            aria-label="100% actual size"
            title="100% Actual Size (1)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <span className="font-mono text-[11px] font-semibold">100%</span>
          </button>

          <span className="w-px h-4 bg-white/15 mx-1" aria-hidden="true" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.15, z * 0.85))}
            aria-label="Zoom out"
            title="Zoom Out (-)"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">remove</span>
          </button>

          {/* Zoom Level Indicator */}
          <button
            type="button"
            onClick={handleActualSize}
            title="Click to reset to 100%"
            className="px-2 py-1 rounded-lg hover:bg-white/10 font-mono text-[11px] tabular-nums font-semibold text-white transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(5.0, z * 1.15))}
            aria-label="Zoom in"
            title="Zoom In (+)"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">add</span>
          </button>

          <span className="w-px h-4 bg-white/15 mx-1" aria-hidden="true" />

          {/* Copy PNG (High-DPI 2x) */}
          <button
            type="button"
            onClick={handleCopyPng}
            aria-label="Copy PNG image to clipboard"
            title="Copy 2x PNG to clipboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-primary">
              {copiedType === 'png' ? 'check' : 'content_copy'}
            </span>
            <span>{copiedType === 'png' ? 'Copied PNG!' : 'Copy PNG'}</span>
          </button>

          {/* Download SVG */}
          <button
            type="button"
            onClick={handleDownloadSvg}
            aria-label="Download vector SVG"
            title="Download SVG vector file"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[15px]">download</span>
            <span className="hidden sm:inline">SVG</span>
          </button>

          {/* Copy SVG Vector Code */}
          <button
            type="button"
            onClick={handleCopySvg}
            aria-label="Copy SVG vector to clipboard"
            title="Copy SVG to clipboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-secondary">code</span>
            <span className="hidden sm:inline">{copiedType === 'svg' ? 'Copied!' : 'Copy SVG'}</span>
          </button>

          {/* Copy Mermaid Source */}
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy Mermaid source code"
            title="Copy Mermaid source code"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-secondary">terminal</span>
            <span className="hidden sm:inline">{copiedType === 'code' ? 'Copied!' : 'Source'}</span>
          </button>

          {/* Toggle Minimap */}
          <button
            type="button"
            onClick={() => setShowMinimap(!showMinimap)}
            aria-label="Toggle radar minimap"
            title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
            className={`p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer ${
              showMinimap ? 'text-primary bg-primary/10' : 'text-slate-400'
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">map</span>
          </button>
        </div>
      </footer>
    </dialog>,
    document.body
  );
};
