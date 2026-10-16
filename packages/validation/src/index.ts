import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { evaluateCapability } from '@mdtodocs/capability-graph';

export interface ActivePolyfill {
  id: string;
  name: string;
  category: 'table' | 'math' | 'callout' | 'footnote' | 'mermaid' | 'list';
  severity: 'info' | 'warning';
  title: string;
  description: string;
  count: number;
}

export interface ValidationReport {
  destination: DestinationType;
  timestamp: string;
  results: ValidationResult[];
  activePolyfills: ActivePolyfill[];
  summary: {
    total: number;
    preserved: number;
    transformed: number;
    degraded: number;
    unsupported: number;
    fidelityScore: number; // 0-100
  };
}

export interface ValidationResult {
  nodeId?: string;
  element: string; // e.g., 'Heading', 'Table', 'ImageBlock'
  status: 'preserved' | 'transformed' | 'degraded' | 'unsupported';
  message?: string;
}

export function detectActivePolyfills(doc: Root, destination: DestinationType): ActivePolyfill[] {
  const polyfills: ActivePolyfill[] = [];
  let wideTables = 0;
  let mathCount = 0;
  let mermaidCount = 0;
  let calloutCount = 0;
  let taskListCount = 0;
  let footnoteCount = 0;

  visit(doc, (node: any) => {
    if (node.type === 'table') {
      const cols = node.children?.[0]?.children?.length || 0;
      const maxCols = destination === 'word' ? 63 : 20;
      if (cols > maxCols) {
        wideTables++;
      }
    } else if (node.type === 'code' && node.lang === 'mermaid') {
      mermaidCount++;
    } else if (node.type === 'math' || node.type === 'inlineMath') {
      mathCount++;
    } else if (node.type === 'containerDirective') {
      calloutCount++;
    } else if (node.type === 'listItem' && node.checked !== null && node.checked !== undefined) {
      taskListCount++;
    } else if (node.type === 'footnoteReference' || node.type === 'footnoteDefinition') {
      footnoteCount++;
    }
  });

  if (wideTables > 0) {
    polyfills.push({
      id: 'table-linearization',
      name: 'Wide Table Linearization',
      category: 'table',
      severity: 'warning',
      title: `${wideTables} wide table${wideTables > 1 ? 's' : ''} linearized`,
      description: `Tables with more than 20 columns are linearized into structured bullet lists to prevent layout overflow in ${destination}.`,
      count: wideTables,
    });
  }

  if (mermaidCount > 0) {
    polyfills.push({
      id: 'mermaid-vector-asset',
      name: 'Mermaid Vector Asset Preservation',
      category: 'mermaid',
      severity: 'info',
      title: `${mermaidCount} Mermaid diagram${mermaidCount > 1 ? 's' : ''} compiled`,
      description: 'Diagrams compiled into standalone vector SVG assets for high-fidelity rendering without blurry rasterization.',
      count: mermaidCount,
    });
  }

  if (mathCount > 0) {
    polyfills.push({
      id: 'math-typesetting',
      name: 'MathML & KaTeX Equation Polyfill',
      category: 'math',
      severity: 'info',
      title: `${mathCount} equation${mathCount > 1 ? 's' : ''} formatted`,
      description: destination === 'word'
        ? 'Equations styled with Cambria Math typography for native Word document compatibility.'
        : destination === 'pdf'
        ? 'Equations rendered with precision KaTeX typesetting for vector print fidelity.'
        : 'Equations rendered with MathML <math> tags and KaTeX HTML for Google Docs formula compatibility.',
      count: mathCount,
    });
  }

  if (calloutCount > 0) {
    polyfills.push({
      id: 'callout-styling',
      name: 'Callout Accent Table Polyfill',
      category: 'callout',
      severity: 'info',
      title: `${calloutCount} callout${calloutCount > 1 ? 's' : ''} protected`,
      description: 'Callouts wrapped in single-cell tables with left accent borders, soft backgrounds, and cantSplit pagination protection.',
      count: calloutCount,
    });
  }

  if (taskListCount > 0) {
    polyfills.push({
      id: 'task-list-ballot',
      name: 'Task List Ballot Glyph Mapping',
      category: 'list',
      severity: 'info',
      title: `${taskListCount} task item${taskListCount > 1 ? 's' : ''} mapped`,
      description: 'Interactive checkboxes mapped to universal ballot glyphs (checked / unchecked) for native Docs/Word fidelity.',
      count: taskListCount,
    });
  }

  if (footnoteCount > 0 && (destination === 'google-docs' || destination === 'clipboard')) {
    polyfills.push({
      id: 'footnote-superscript',
      name: 'Footnote Superscript Run & Endnotes',
      category: 'footnote',
      severity: 'info',
      title: `${footnoteCount} footnote marker${footnoteCount > 1 ? 's' : ''} formatted`,
      description: 'Footnotes converted to superscript anchor links and dedicated definition endnotes for Google Docs compatibility.',
      count: footnoteCount,
    });
  }

  return polyfills;
}

export function validateDocument(doc: Root, destination: DestinationType): ValidationReport {
  const results: ValidationResult[] = [];
  
  visit(doc, (node: any) => {
    if (!node.type || node.type === 'root') return;

    const cap = evaluateCapability(node.type, node, destination);
    
    let status: ValidationResult['status'] = 'preserved';
    let message = cap.reason;

    if (cap.support === 'native') {
      status = 'preserved';
    } else if (cap.support === 'styled' || cap.support === 'image' || cap.support === 'text') {
      // Styled elements with no polyfill are preserved
      status = cap.requiresPolyfill ? 'transformed' : 'preserved';
    } else if (cap.support === 'transformed') {
      status = 'degraded';
    } else {
      status = 'unsupported';
    }

    results.push({
      nodeId: node.id || Math.random().toString(36).substr(2, 9),
      element: node.type,
      status,
      message,
    });
  });

  const total = results.length;
  const preserved = results.filter(r => r.status === 'preserved').length;
  const transformed = results.filter(r => r.status === 'transformed').length;
  const degraded = results.filter(r => r.status === 'degraded').length;
  const unsupported = results.filter(r => r.status === 'unsupported').length;

  const score = total === 0 ? 100 : Math.round(
    ((preserved * 100) + (transformed * 90) + (degraded * 50)) / total
  );

  const activePolyfills = detectActivePolyfills(doc, destination);

  return {
    destination,
    timestamp: new Date().toISOString(),
    results,
    activePolyfills,
    summary: {
      total,
      preserved,
      transformed,
      degraded,
      unsupported,
      fidelityScore: score,
    },
  };
}
