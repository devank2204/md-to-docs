import mermaid from 'mermaid';

export interface RenderMermaidOptions {
  theme?: string;
  background?: string;
  font?: string;
  scale?: number;
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
    details?: any;
  };
}

export type RenderMermaidResult = RenderMermaidResultSuccess | RenderMermaidResultError;

let initialized = false;
const renderCache = new Map<string, RenderMermaidResult>();

export async function renderMermaid(source: string, options: RenderMermaidOptions = {}): Promise<RenderMermaidResult> {
  const theme = (options.theme as any) || 'default';
  const cacheKey = JSON.stringify({ source, theme, version: '12.0.0' });

  if (renderCache.has(cacheKey)) {
    return renderCache.get(cacheKey)!;
  }

  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'strict', // Treat Mermaid source as untrusted input
    });
    initialized = true;
  }
  
  try {
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    const { svg } = await mermaid.render(id, source);
    
    // Parse SVG to extract dimensions
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgEl = doc.querySelector('svg');
    let width = 500;
    let height = 500;
    
    if (svgEl) {
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(' ').map(parseFloat);
        if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
          width = parts[2];
          height = parts[3];
        }
      }
      
      const widthAttr = svgEl.getAttribute('width');
      const heightAttr = svgEl.getAttribute('height');
      
      if (widthAttr && widthAttr.endsWith('px')) {
          width = parseFloat(widthAttr);
      }
      if (heightAttr && heightAttr.endsWith('px')) {
          height = parseFloat(heightAttr);
      }
    }

    const result: RenderMermaidResult = {
      success: true,
      svg,
      width,
      height,
      diagramType: 'mermaid',
      source,
    };
    renderCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    const result: RenderMermaidResult = {
      success: false,
      source,
      error: {
        message: err?.message || 'Failed to render Mermaid diagram',
      }
    };
    renderCache.set(cacheKey, result);
    return result;
  }
}
