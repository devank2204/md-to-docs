import type { Root } from 'mdast';
import type { DestinationType } from '@mdtodocs/capability-graph';
import type { DocumentDiagnostic, DiagnosticSeverity, DiagnosticFixAction } from './index';
import { parseMarkdown } from '../parser';
import { autoFixMermaidCode } from './mermaidFix';

export type RescueRuleId =
  | 'table-overflow'
  | 'mermaid-syntax'
  | 'missing-image-source'
  | 'heading-orphan'
  | 'consecutive-pagebreaks'
  | 'unsupported-html-element'
  | 'math-equation-typesetting';

export interface RescueAction extends DiagnosticFixAction {
  id: string;
  ruleId: RescueRuleId | string;
  label: string;
  description: string;
  autoFixable: boolean;
  requiresVisualVerification?: boolean;
}

export interface RescueDiagnostic extends DocumentDiagnostic {
  requiresVisualVerification: boolean;
  rescueAction?: RescueAction;
}

export interface RescueRule {
  id: RescueRuleId | string;
  name: string;
  description: string;
  severity: DiagnosticSeverity;
  requiresVisualVerification: boolean;
  check: (markdown: string, destination: DestinationType, doc: Root) => RescueDiagnostic[];
  fix?: (markdown: string, destination: DestinationType) => string;
}

/**
 * Converts a wide Markdown table string into a clean itemized bullet list.
 */
export function linearizeMarkdownTable(tableMarkdown: string): string {
  const lines = tableMarkdown.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return tableMarkdown;

  const parseRow = (line: string): string[] => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(c => c.trim());
  };

  const headers = parseRow(lines[0]);
  // Skip delimiter row (e.g. |---|---|)
  let dataStartIndex = 1;
  if (lines[1] && /^[\s|:-]+$/.test(lines[1])) {
    dataStartIndex = 2;
  }

  const outputLines: string[] = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    const rowTitle = cells[0] || `Item ${i - dataStartIndex + 1}`;
    
    // Check if we can format as compact single bullet or nested
    const details = headers
      .slice(1)
      .map((header, idx) => {
        const val = cells[idx + 1] || '';
        return val ? `**${header}**: ${val}` : null;
      })
      .filter(Boolean);

    if (details.length > 0) {
      outputLines.push(`- **${rowTitle}** (${details.join(' · ')})`);
    } else {
      outputLines.push(`- **${rowTitle}**`);
    }
  }

  return outputLines.join('\n');
}

/**
 * Core registry of deterministic Document Rescue rules.
 */
export const RESCUE_RULES: RescueRule[] = [
  // 1. Mermaid Syntax & Subgraph Verification
  {
    id: 'mermaid-syntax',
    name: 'Mermaid Diagram Syntax',
    description: 'Detects unquoted labels with brackets or parentheses, unclosed subgraphs, and typographic curly quotes',
    severity: 'error',
    requiresVisualVerification: false,
    check: (markdown: string, destination: DestinationType) => {
      const diagnostics: RescueDiagnostic[] = [];
      const mermaidRegex = /```mermaid[ \t]*\r?\n([\s\S]*?)```/g;
      let match: RegExpExecArray | null;

      while ((match = mermaidRegex.exec(markdown)) !== null) {
        const code = match[1];
        const repaired = autoFixMermaidCode(code);

        if (code !== repaired) {
          // Calculate line number
          const preText = markdown.slice(0, match.index);
          const line = preText.split('\n').length;

          diagnostics.push({
            id: `mermaid-syntax-${line}`,
            ruleId: 'mermaid-syntax',
            severity: 'error',
            destination,
            nodeType: 'code',
            position: { line, column: 1 },
            message: 'Mermaid syntax error: unquoted label with special characters, unclosed subgraph, or curly quotes detected.',
            suggestedAction: 'Quote label text and close subgraphs to ensure error-free vector SVG rendering.',
            requiresVisualVerification: false,
            fixAction: {
              label: 'Auto-Fix Diagram Syntax',
              description: 'Quote node labels and close subgraphs using autoFixMermaidCode',
              autoFixable: true,
            },
          });
        }
      }

      return diagnostics;
    },
    fix: (markdown: string) => {
      return markdown.replace(/```mermaid[ \t]*\r?\n([\s\S]*?)```/g, (_match, code) => {
        const repaired = autoFixMermaidCode(code);
        return `\`\`\`mermaid\n${repaired}\`\`\``;
      });
    },
  },

  // 2. Table Column Overflow
  {
    id: 'table-overflow',
    name: 'Table Column Layout Overflow',
    description: 'Detects tables exceeding column thresholds for Word/PDF printable margin widths',
    severity: 'warning',
    requiresVisualVerification: false,
    check: (markdown: string, destination: DestinationType, _doc: Root) => {
      const diagnostics: RescueDiagnostic[] = [];
      // Word limit is 6 columns, PDF limit is 7 columns, Google Docs is 8
      const maxColumns = destination === 'word' ? 6 : destination === 'pdf' ? 7 : 8;

      // Scan lines for markdown tables
      const tableRegex = /((?:^[ \t]*\|.+\|[ \t]*\r?\n){2,})/gm;
      let match: RegExpExecArray | null;

      while ((match = tableRegex.exec(markdown)) !== null) {
        const tableBlock = match[1];
        const firstLine = tableBlock.trim().split('\n')[0];
        const cols = firstLine.replace(/^\|/, '').replace(/\|$/, '').split('|').length;

        if (cols > maxColumns) {
          const preText = markdown.slice(0, match.index);
          const line = preText.split('\n').length;

          diagnostics.push({
            id: `table-overflow-${line}`,
            ruleId: 'table-overflow',
            severity: 'warning',
            destination,
            nodeType: 'table',
            position: { line, column: 1 },
            message: `Table has ${cols} columns (exceeds recommended ${maxColumns} for ${destination} margins). Columns may clip or wrap awkwardly.`,
            suggestedAction: 'Linearize table into an itemized structured list or export in landscape orientation.',
            requiresVisualVerification: false,
            fixAction: {
              label: 'Linearize Table',
              description: 'Convert wide table into a structured key-value bullet list',
              autoFixable: true,
            },
          });
        }
      }

      return diagnostics;
    },
    fix: (markdown: string, destination: DestinationType) => {
      const maxColumns = destination === 'word' ? 6 : destination === 'pdf' ? 7 : 8;
      const tableRegex = /((?:^[ \t]*\|.+\|[ \t]*\r?\n){2,})/gm;

      return markdown.replace(tableRegex, (match) => {
        const firstLine = match.trim().split('\n')[0];
        const cols = firstLine.replace(/^\|/, '').replace(/\|$/, '').split('|').length;
        if (cols > maxColumns) {
          return linearizeMarkdownTable(match) + '\n';
        }
        return match;
      });
    },
  },

  // 3. Missing Image Source
  {
    id: 'missing-image-source',
    name: 'Missing Image Source',
    description: 'Detects image tags with empty, whitespace, or missing URL parameters',
    severity: 'warning',
    requiresVisualVerification: false,
    check: (markdown: string, destination: DestinationType) => {
      const diagnostics: RescueDiagnostic[] = [];
      const imageRegex = /!\[([^\]]*)\]\(([^)]*)\)/g;
      let match: RegExpExecArray | null;

      while ((match = imageRegex.exec(markdown)) !== null) {
        const alt = match[1];
        const url = match[2].trim();

        if (url === '' || url === '#') {
          const preText = markdown.slice(0, match.index);
          const line = preText.split('\n').length;

          diagnostics.push({
            id: `missing-image-${line}`,
            ruleId: 'missing-image-source',
            severity: 'warning',
            destination,
            nodeType: 'image',
            position: { line, column: 1 },
            message: `Image "${alt || 'untitled'}" is missing a destination URL or file path.`,
            suggestedAction: 'Replace empty image tag with a descriptive placeholder link fallback.',
            requiresVisualVerification: false,
            fixAction: {
              label: 'Replace with Link Fallback',
              description: 'Convert broken empty image tag to an accessible text placeholder link',
              autoFixable: true,
            },
          });
        }
      }

      return diagnostics;
    },
    fix: (markdown: string) => {
      return markdown.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (match, alt, url) => {
        if (url.trim() === '' || url.trim() === '#') {
          const label = alt ? `Missing Image: ${alt}` : 'Missing Image';
          return `[${label}](#missing-image)`;
        }
        return match;
      });
    },
  },

  // 4. Consecutive Page Breaks
  {
    id: 'consecutive-pagebreaks',
    name: 'Consecutive Page Breaks',
    description: 'Detects back-to-back pagebreak indicators causing accidental blank pages',
    severity: 'warning',
    requiresVisualVerification: false,
    check: (markdown: string, destination: DestinationType) => {
      const diagnostics: RescueDiagnostic[] = [];
      const pattern = /(?:<!--\s*page-?break\s*-->|\\pagebreak|<div\s+class=["'](?:page-?break)["']\s*>\s*<\/div>)(?:\s*(?:<!--\s*page-?break\s*-->|\\pagebreak|<div\s+class=["'](?:page-?break)["']\s*>\s*<\/div>))+/gi;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(markdown)) !== null) {
        const preText = markdown.slice(0, match.index);
        const line = preText.split('\n').length;

        diagnostics.push({
          id: `consecutive-pagebreaks-${line}`,
          ruleId: 'consecutive-pagebreaks',
          severity: 'warning',
          destination,
          nodeType: 'html',
          position: { line, column: 1 },
          message: 'Multiple consecutive page breaks detected, which will produce empty pages in exported documents.',
          suggestedAction: 'Collapse consecutive page breaks into a single page break.',
          requiresVisualVerification: false,
          fixAction: {
            label: 'Collapse Page Breaks',
            description: 'Deduplicate redundant page breaks into one clean page break',
            autoFixable: true,
          },
        });
      }

      return diagnostics;
    },
    fix: (markdown: string) => {
      const pattern = /(?:<!--\s*page-?break\s*-->|\\pagebreak|<div\s+class=["'](?:page-?break)["']\s*>\s*<\/div>)(?:\s*(?:<!--\s*page-?break\s*-->|\\pagebreak|<div\s+class=["'](?:page-?break)["']\s*>\s*<\/div>))+/gi;
      return markdown.replace(pattern, '<!-- pagebreak -->\n');
    },
  },

  // 5. Unsupported Raw HTML Tags
  {
    id: 'unsupported-html-element',
    name: 'Unsupported Raw HTML Elements',
    description: 'Detects raw HTML tags that are not natively supported by target destination',
    severity: 'warning',
    requiresVisualVerification: false,
    check: (markdown: string, destination: DestinationType) => {
      const diagnostics: RescueDiagnostic[] = [];
      if ((destination as string) === 'html') return diagnostics;

      const rawHtmlRegex = /<((?:marquee|blink|canvas|video|audio|iframe|object|embed)[^>]*)>([\s\S]*?)<\/\1>/gi;
      let match: RegExpExecArray | null;

      while ((match = rawHtmlRegex.exec(markdown)) !== null) {
        const tag = match[1].split(/\s+/)[0];
        const preText = markdown.slice(0, match.index);
        const line = preText.split('\n').length;

        diagnostics.push({
          id: `unsupported-html-${line}`,
          ruleId: 'unsupported-html-element',
          severity: 'warning',
          destination,
          nodeType: 'html',
          position: { line, column: 1 },
          message: `Raw <${tag}> tag is not natively supported in ${destination}. Will be preserved as code block.`,
          suggestedAction: 'Wrap raw HTML in a visible code block to prevent silent drops.',
          requiresVisualVerification: false,
          fixAction: {
            label: 'Preserve as Code Block',
            description: `Convert <${tag}> tag into a visible markdown code block`,
            autoFixable: true,
          },
        });
      }

      return diagnostics;
    },
    fix: (markdown: string, destination: DestinationType) => {
      if ((destination as string) === 'html') return markdown;
      const rawHtmlRegex = /<((?:marquee|blink|canvas|video|audio|iframe|object|embed)[^>]*)>([\s\S]*?)<\/\1>/gi;
      return markdown.replace(rawHtmlRegex, (match) => {
        return `\`\`\`html\n${match}\n\`\`\``;
      });
    },
  },

  // 6. Heading Orphan (Visual Verification Recommended)
  {
    id: 'heading-orphan',
    name: 'Orphan Heading Without Content',
    description: 'Detects trailing headings at the end of the document without body content',
    severity: 'info',
    requiresVisualVerification: true,
    check: (markdown: string, destination: DestinationType) => {
      const diagnostics: RescueDiagnostic[] = [];
      const trimmed = markdown.trimEnd();
      const trailingHeadingMatch = trimmed.match(/(?:^|\n)(#{1,6}\s+([^\n]+))\s*$/);

      if (trailingHeadingMatch) {
        const headingTitle = trailingHeadingMatch[2];
        const lines = trimmed.split('\n');
        const line = lines.length;

        diagnostics.push({
          id: `heading-orphan-${line}`,
          ruleId: 'heading-orphan',
          severity: 'info',
          destination,
          nodeType: 'heading',
          position: { line, column: 1 },
          message: `Trailing heading "${headingTitle}" has no section body content following it.`,
          suggestedAction: 'Add section content under heading or remove trailing heading line.',
          requiresVisualVerification: true,
          fixAction: {
            label: 'Remove Trailing Orphan Heading',
            description: `Remove empty trailing heading "${headingTitle}"`,
            autoFixable: true,
          },
        });
      }

      return diagnostics;
    },
    fix: (markdown: string) => {
      const trimmed = markdown.trimEnd();
      return trimmed.replace(/(?:^|\n)(#{1,6}\s+[^\n]+)\s*$/, '');
    },
  },

  // 7. Math Typesetting Notice (Visual Verification in Target App)
  {
    id: 'math-equation-typesetting',
    name: 'Math Equation Typesetting',
    description: 'Informs user of destination typesetting fidelity for LaTeX math equations',
    severity: 'info',
    requiresVisualVerification: true,
    check: (markdown: string, destination: DestinationType) => {
      const diagnostics: RescueDiagnostic[] = [];
      const hasMath = /\$\$[\s\S]+?\$\$|\$[^\n$]+?\$/g.test(markdown);

      if (hasMath && (destination === 'word' || destination === 'google-docs')) {
        diagnostics.push({
          id: 'math-equation-typesetting-1',
          ruleId: 'math-equation-typesetting',
          severity: 'info',
          destination,
          nodeType: 'math',
          message: destination === 'word'
            ? 'Math equations typeset via Cambria Math XML and MathML.'
            : 'Math equations typeset via MathML formula objects for Google Docs.',
          suggestedAction: 'Visual verification recommended in target application for complex nested matrices or fractions.',
          requiresVisualVerification: true,
        });
      }

      return diagnostics;
    },
  },
];

/**
 * Deterministic pre-export diagnostic engine that detects layout risks and offers 1-click safe repairs.
 */
export class DocumentRescueEngine {
  private rules: RescueRule[] = RESCUE_RULES;

  public registerRule(rule: RescueRule) {
    this.rules.push(rule);
  }

  public getRules(): RescueRule[] {
    return this.rules;
  }

  /**
   * Deterministically analyze the document for layout risks and syntax issues.
   * Never fabricates confidence scores.
   */
  public analyze(markdown: string, destination: DestinationType, doc?: Root): RescueDiagnostic[] {
    const ast = doc || parseMarkdown(markdown);
    const results: RescueDiagnostic[] = [];

    for (const rule of this.rules) {
      try {
        const diags = rule.check(markdown, destination, ast);
        results.push(...diags);
      } catch (err) {
        console.error(`Error executing rescue rule ${rule.id}:`, err);
      }
    }

    return results;
  }

  /**
   * Apply safe 1-click text fix for a specific rule or diagnostic.
   */
  public applyFix(markdown: string, ruleId: string, destination: DestinationType = 'google-docs'): string {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule || !rule.fix) {
      return markdown;
    }
    return rule.fix(markdown, destination);
  }

  /**
   * Apply all available safe automated fixes in sequential order.
   */
  public applyAllFixes(markdown: string, destination: DestinationType = 'google-docs'): string {
    let patched = markdown;

    for (const rule of this.rules) {
      if (rule.fix) {
        try {
          patched = rule.fix(patched, destination);
        } catch (err) {
          console.error(`Error applying fix for rule ${rule.id}:`, err);
        }
      }
    }

    return patched;
  }
}

export const documentRescueEngine = new DocumentRescueEngine();

export function analyzeDocumentForRescue(
  markdown: string,
  destination: DestinationType,
  doc?: Root
): RescueDiagnostic[] {
  return documentRescueEngine.analyze(markdown, destination, doc);
}

export function applyRescueFix(
  markdown: string,
  ruleId: string,
  destination: DestinationType = 'google-docs'
): string {
  return documentRescueEngine.applyFix(markdown, ruleId, destination);
}

export function applyAllRescueFixes(
  markdown: string,
  destination: DestinationType = 'google-docs'
): string {
  return documentRescueEngine.applyAllFixes(markdown, destination);
}
