import { parseMarkdown, planRepresentation, DiagnosticsCollector } from '@mdtodocs/compiler-core';
import type { DestinationType } from '@mdtodocs/capability-graph';
import type { Root, Code, Table as MdTable, Heading, Paragraph, Link, Image } from 'mdast';

export interface ValidationError {
  line?: number;
  type: string;
  message: string;
}

export interface ValidationWarning {
  line?: number;
  type: string;
  message: string;
}

export interface DocumentMetrics {
  wordCount: number;
  headingCount: number;
  tableCount: number;
  diagramCount: number;
  equationCount: number;
  linkCount: number;
  imageCount: number;
}

export interface ValidationResult {
  valid: boolean;
  metrics: DocumentMetrics;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  compilerDiagnostics: any[];
}

const KNOWN_MERMAID_TYPES = [
  'graph',
  'flowchart',
  'sequencediagram',
  'classdiagram',
  'statediagram',
  'statediagram-v2',
  'erdiagram',
  'journey',
  'gantt',
  'pie',
  'gitgraph',
  'mindmap',
  'timeline',
  'quadrantchart',
  'xychart',
  'sankey-beta',
  'sankey',
  'kanban',
  'block-beta',
  'block',
  'c4context',
  'c4container',
  'c4component',
  'c4dynamic',
  'c4deployment',
  'packet-beta',
  'architecture-beta',
  'zenuml',
];

export function validateMarkdownDocument(
  markdown: string,
  destination: DestinationType = 'word'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  let wordCount = 0;
  let headingCount = 0;
  let tableCount = 0;
  let diagramCount = 0;
  let equationCount = 0;
  let linkCount = 0;
  let imageCount = 0;

  // 1. AST Parsing
  let tree: Root;
  try {
    tree = parseMarkdown(markdown);
  } catch (err: any) {
    errors.push({
      type: 'markdown_parse_failure',
      message: err?.message || 'Failed to parse Markdown AST',
    });
    return {
      valid: false,
      metrics: {
        wordCount: 0,
        headingCount: 0,
        tableCount: 0,
        diagramCount: 0,
        equationCount: 0,
        linkCount: 0,
        imageCount: 0,
      },
      errors,
      warnings,
      compilerDiagnostics: [],
    };
  }

  // 2. Traverse AST and extract metrics & diagnostics
  function traverse(node: any) {
    if (!node) return;

    if (node.type === 'heading') {
      headingCount++;
    } else if (node.type === 'table') {
      tableCount++;
      validateTable(node as MdTable);
    } else if (node.type === 'code') {
      const codeNode = node as Code;
      if (codeNode.lang?.toLowerCase() === 'mermaid') {
        diagramCount++;
        validateMermaid(codeNode);
      }
    } else if (node.type === 'math' || node.type === 'inlineMath') {
      equationCount++;
    } else if (node.type === 'link') {
      linkCount++;
      const linkNode = node as Link;
      if (!linkNode.url || linkNode.url.trim() === '') {
        warnings.push({
          line: node.position?.start?.line,
          type: 'empty_link_url',
          message: 'Link is missing a destination URL.',
        });
      }
    } else if (node.type === 'image') {
      imageCount++;
      const imgNode = node as Image;
      if (!imgNode.url || imgNode.url.trim() === '') {
        errors.push({
          line: node.position?.start?.line,
          type: 'empty_image_src',
          message: 'Image is missing a source URL or file path.',
        });
      }
    } else if (node.type === 'text') {
      const text = node.value || '';
      const words = text.trim().split(/\s+/).filter(Boolean);
      wordCount += words.length;
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  function validateTable(table: MdTable) {
    if (!table.children || table.children.length === 0) {
      warnings.push({
        line: table.position?.start?.line,
        type: 'empty_table',
        message: 'Table contains no rows.',
      });
      return;
    }

    const headerRow = table.children[0];
    const expectedCols = headerRow.children.length;

    table.children.slice(1).forEach((row: any, idx: number) => {
      const rowCols = row.children?.length || 0;
      if (rowCols !== expectedCols) {
        warnings.push({
          line: row.position?.start?.line,
          type: 'ragged_table_row',
          message: `Table row ${idx + 2} has ${rowCols} cells, but header has ${expectedCols} columns.`,
        });
      }
    });
  }

  function validateMermaid(code: Code) {
    const val = (code.value || '').trim();
    if (!val) {
      errors.push({
        line: code.position?.start?.line,
        type: 'empty_mermaid_block',
        message: 'Mermaid code block is empty.',
      });
      return;
    }

    // Check first non-comment line for diagram type
    const lines = val.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith('%%'));
    if (lines.length === 0) {
      errors.push({
        line: code.position?.start?.line,
        type: 'empty_mermaid_block',
        message: 'Mermaid diagram has no declaration lines.',
      });
      return;
    }

    const firstToken = lines[0].split(/[\s(:{\[]/)[0].toLowerCase();
    const isRecognized = KNOWN_MERMAID_TYPES.some((type) => firstToken.startsWith(type));

    if (!isRecognized) {
      warnings.push({
        line: code.position?.start?.line,
        type: 'unrecognized_mermaid_diagram_type',
        message: `Diagram type '${firstToken}' was not recognized as a standard Mermaid declaration.`,
      });
    }
  }

  traverse(tree);

  // 3. Destination Planner Checks
  const collector = new DiagnosticsCollector();
  try {
    planRepresentation(tree, destination, collector);
  } catch (err: any) {
    warnings.push({
      type: 'destination_plan_warning',
      message: err?.message || 'Error occurred during destination capability planning.',
    });
  }

  const compilerDiagnostics = collector.getAll();

  return {
    valid: errors.length === 0,
    metrics: {
      wordCount,
      headingCount,
      tableCount,
      diagramCount,
      equationCount,
      linkCount,
      imageCount,
    },
    errors,
    warnings,
    compilerDiagnostics,
  };
}
