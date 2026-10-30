import { create, RenderError } from 'ondine/compiler/wasm';
import { wasm as all } from 'ondine/compiler/wasm/all';

export interface RenderMermaidOptions {
  theme?: 'light' | 'dark' | 'neutral' | string;
  background?: string;
  font?: string;
  scale?: number;
  transparent?: boolean;
}

export interface RenderMermaidResultSuccess {
  success: true;
  svg: string;
  width: number;
  height: number;
  diagramType: 'mermaid';
  source: string;
}

export interface RenderMermaidResultError {
  success: false;
  source: string;
  error: {
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
    details?: any;
  };
}

export type RenderMermaidResult = RenderMermaidResultSuccess | RenderMermaidResultError;

export interface OndinePalette {
  bg: string;
  fg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  line: string;
  muted: string;
  strokeWidth: string;
  font: string;
}

export const ONDINE_PALETTES: Record<'light' | 'dark' | 'neutral', OndinePalette> = {
  light: {
    bg: '#ffffff',
    fg: '#0f172a', // slate-900
    surface: '#ffffff',
    surfaceAlt: '#f8fafc', // slate-50
    border: '#334155', // slate-700
    line: '#334155',
    muted: '#64748b', // slate-500
    strokeWidth: '1.5px',
    font: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  dark: {
    bg: '#1e1e24', // matched to web app dark preview surface
    fg: '#f8fafc', // slate-50
    surface: '#272730',
    surfaceAlt: '#32323e',
    border: '#64748b', // slate-500
    line: '#94a3b8', // slate-400
    muted: '#94a3b8',
    strokeWidth: '1.5px',
    font: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  neutral: {
    bg: '#ffffff',
    fg: '#1e293b',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    border: '#475569',
    line: '#475569',
    muted: '#64748b',
    strokeWidth: '1.5px',
    font: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

export interface InlineOndineOptions {
  isDark?: boolean;
  transparent?: boolean;
  background?: string;
}

/**
 * Inlines concrete colors into Ondine SVGs for standalone consumers (Word DOCX, Google Docs clipboard, Canvas rasterization)
 * that strip or do not evaluate CSS custom properties (`var(--_s)`, `var(--_b)`, etc.).
 */
export function inlineOndineColors(
  svg: string,
  optionsOrDark: boolean | InlineOndineOptions = false
): string {
  const opts: InlineOndineOptions =
    typeof optionsOrDark === 'boolean' ? { isDark: optionsOrDark } : optionsOrDark || {};
  const isDark = !!opts.isDark;
  const isTransparent = !!opts.transparent;
  const p = isDark ? ONDINE_PALETTES.dark : ONDINE_PALETTES.light;
  const bg = isTransparent ? 'transparent' : opts.background || p.bg;
  let res = svg;

  // 1. Replace fills with concrete hex values
  res = res.replace(/fill="var\(--_s\)"/g, `fill="${p.surface}"`);
  res = res.replace(/fill="var\(--_bg\)"/g, `fill="${bg === 'transparent' ? 'none' : bg}"`);
  res = res.replace(/fill="var\(--_fg\)"/g, `fill="${p.fg}"`);
  res = res.replace(/fill="var\(--_l\)"/g, `fill="${p.line}"`);
  res = res.replace(/fill="var\(--_a\)"/g, `fill="${p.surfaceAlt}"`);
  res = res.replace(/fill="var\(--_m\)"/g, `fill="${p.muted}"`);

  // 2. Replace strokes with concrete hex values
  res = res.replace(/stroke="var\(--_b\)"/g, `stroke="${p.border}"`);
  res = res.replace(/stroke="var\(--_l\)"/g, `stroke="${p.line}"`);
  res = res.replace(/stroke="var\(--_fg\)"/g, `stroke="${p.fg}"`);
  res = res.replace(/stroke="var\(--_s\)"/g, `stroke="${p.surface}"`);

  // 3. Replace stroke-width and inline colors
  res = res.replace(/stroke-width:var\(--_sw\)/g, `stroke-width:${p.strokeWidth}`);
  res = res.replace(/color:var\(--_fg\)/g, `color:${p.fg}`);
  res = res.replace(/font-family:[^;"]+/g, `font-family:${p.font}`);

  // 4. Ensure root <svg> has clean presentation styling
  res = res.replace(
    /(<svg\b[^>]*\bstyle=")([^"]*)(")/,
    `$1max-width:100%;height:auto;background-color:${bg};color:${p.fg};font-family:${p.font};$3`
  );

  // 5. Manage background rect
  if (isTransparent) {
    // Strip any background rect for clean transparent export
    res = res.replace(/<rect\s+id="ondine-export-bg"[^>]*\/>\s*/g, '');
    res = res.replace(/<rect\s+class="ondine-bg"[^>]*\/>\s*/g, '');
  } else {
    // Ensure solid background rect right inside <svg> if not present
    if (!res.includes('<rect id="ondine-export-bg"') && !res.includes('<rect class="ondine-bg"')) {
      res = res.replace(
        /(<svg\b[^>]*>)/,
        `$1\n  <rect id="ondine-export-bg" width="100%" height="100%" fill="${bg}"/>`
      );
    } else if (res.includes('<rect id="ondine-export-bg"')) {
      res = res.replace(
        /<rect\s+id="ondine-export-bg"[^>]*\/>/,
        `<rect id="ondine-export-bg" width="100%" height="100%" fill="${bg}"/>`
      );
    }
  }

  return res;
}

/**
 * Sanitizes and validates an exported Mermaid SVG to prevent clipping, ensure valid XML,
 * and guarantee predictable rendering across browsers, Figma, Illustrator, and Word.
 */
export function sanitizeMermaidSvg(rawSvg: string): string {
  if (!rawSvg) return '';
  let svg = rawSvg;

  // 1. Ensure XML namespace is present
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svg = svg.replace(/(<svg\b)/, '$1 xmlns="http://www.w3.org/2000/svg"');
  }

  // 2. Strip potential XSS or active scripts
  svg = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  svg = svg.replace(/\bon[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Ensure viewBox is present; if only width/height exist, compute viewBox
  const widthMatch = svg.match(/\bwidth="([\d.]+)(?:px)?"/);
  const heightMatch = svg.match(/\bheight="([\d.]+)(?:px)?"/);
  if (!svg.includes('viewBox=') && widthMatch && heightMatch) {
    const w = parseFloat(widthMatch[1]);
    const h = parseFloat(heightMatch[1]);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      svg = svg.replace(/(<svg\b)/, `$1 viewBox="0 0 ${w} ${h}"`);
    }
  }

  return svg;
}

/**
 * Extracts human-readable semantic structure from Mermaid diagram code
 * to provide accessible alternatives (ARIA description, screen reader transcripts, and text fallbacks).
 */
export function extractMermaidAccessibleText(source: string): string {
  if (!source || !source.trim()) return 'Empty diagram';

  const lines = source.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return 'Empty diagram';

  const firstLine = lines[0].toLowerCase();
  let diagramType = 'Diagram';
  if (firstLine.startsWith('graph') || firstLine.startsWith('flowchart')) diagramType = 'Flowchart';
  else if (firstLine.startsWith('sequencediagram')) diagramType = 'Sequence Diagram';
  else if (firstLine.startsWith('statediagram')) diagramType = 'State Diagram';
  else if (firstLine.startsWith('classdiagram')) diagramType = 'Class Diagram';
  else if (firstLine.startsWith('erdiagram')) diagramType = 'Entity-Relationship Diagram';
  else if (firstLine.startsWith('gantt')) diagramType = 'Gantt Chart';
  else if (firstLine.startsWith('pie')) diagramType = 'Pie Chart';

  // Extract explicit node labels: e.g. A["Title Here"], B("Other"), C{"Decision"}
  const labelRegex = /([A-Za-z0-9_-]+)\s*(?:\[|\(|\{)(?:\[|\()?["']?([^"'\(\)\[\]\{\}]+)["']?(?:\]|\))?(?:\]|\)|\})/g;
  const nodes: { id: string; label: string }[] = [];
  const seenLabels = new Set<string>();

  // Extract sequence messages: Alice ->> Bob: Message
  const sequenceRegex = /([A-Za-z0-9_-]+)\s*-(?:->|>>)\s*([A-Za-z0-9_-]+)\s*:\s*(.+)/g;
  const messages: string[] = [];

  for (const line of lines) {
    if (
      line.startsWith('%%') ||
      line.startsWith('graph') ||
      line.startsWith('flowchart') ||
      line.startsWith('sequenceDiagram')
    ) {
      continue;
    }

    // Subgraph titles
    const subMatch = line.match(/^subgraph\s+(?:["']?([^"']+)["']?|(\w+))/i);
    if (subMatch) {
      const name = subMatch[1] || subMatch[2];
      if (name && !seenLabels.has(name)) {
        nodes.push({ id: 'subgraph', label: `Group: ${name}` });
        seenLabels.add(name);
      }
      continue;
    }

    // Node labels
    let match: RegExpExecArray | null;
    while ((match = labelRegex.exec(line)) !== null) {
      const id = match[1];
      const label = match[2].trim();
      if (label && !seenLabels.has(label)) {
        nodes.push({ id, label });
        seenLabels.add(label);
      }
    }

    // Sequence messages
    let seqMatch: RegExpExecArray | null;
    while ((seqMatch = sequenceRegex.exec(line)) !== null) {
      messages.push(`${seqMatch[1]} sends "${seqMatch[3].trim()}" to ${seqMatch[2]}`);
    }
  }

  const parts: string[] = [`${diagramType} outlining structure:`];
  if (nodes.length > 0) {
    parts.push(`Nodes: ${nodes.map((n) => n.label).join(' → ')}.`);
  }
  if (messages.length > 0) {
    parts.push(`Interactions: ${messages.join('; ')}.`);
  }

  return parts.join(' ');
}

import { autoFixMermaidCode } from '@mdtodocs/compiler-core';
export { autoFixMermaidCode };

let ondineRenderer: ReturnType<typeof create> | null = null;
const renderCache = new Map<string, RenderMermaidResult>();

function getRenderer() {
  if (!ondineRenderer) {
    ondineRenderer = create({ modules: { all } });
  }
  return ondineRenderer;
}

export async function renderMermaid(source: string, options: RenderMermaidOptions = {}): Promise<RenderMermaidResult> {
  const isDark = options.theme === 'dark';
  const isTransparent = !!options.transparent;
  const background = options.background;
  const cacheKey = JSON.stringify({ source, isDark, isTransparent, background, v: 'ondine-0.0.4' });

  if (renderCache.has(cacheKey)) {
    return renderCache.get(cacheKey)!;
  }

  const renderer = getRenderer();

  try {
    const rawResult = renderer.render(source);
    const cleanedSvg = inlineOndineColors(rawResult.svg, {
      isDark,
      transparent: isTransparent,
      background,
    });
    const sanitizedSvg = sanitizeMermaidSvg(cleanedSvg);

    const result: RenderMermaidResultSuccess = {
      success: true,
      svg: sanitizedSvg,
      width: rawResult.width || 600,
      height: rawResult.height || 400,
      diagramType: 'mermaid',
      source,
    };

    renderCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    // Attempt auto-repair on syntax failure
    const repaired = autoFixMermaidCode(source);
    if (repaired !== source) {
      try {
        const rawResult = renderer.render(repaired);
        const cleanedSvg = inlineOndineColors(rawResult.svg, {
          isDark,
          transparent: isTransparent,
          background,
        });
        const sanitizedSvg = sanitizeMermaidSvg(cleanedSvg);

        const result: RenderMermaidResultSuccess = {
          success: true,
          svg: sanitizedSvg,
          width: rawResult.width || 600,
          height: rawResult.height || 400,
          diagramType: 'mermaid',
          source,
        };

        renderCache.set(cacheKey, result);
        return result;
      } catch {
        // Fall through to error reporting below
      }
    }

    const isRenderError = err instanceof RenderError || err?.name === 'Render.RenderError';
    const errorResult: RenderMermaidResultError = {
      success: false,
      source,
      error: {
        message: err?.message || 'Failed to render Mermaid diagram',
        line: isRenderError ? err.line : undefined,
        column: isRenderError ? err.column : undefined,
        snippet: isRenderError ? err.snippet : undefined,
        details: err,
      },
    };

    renderCache.set(cacheKey, errorResult);
    return errorResult;
  }
}

