import { visit } from 'unist-util-visit';
import type { Root, Table, List } from 'mdast';
import { evaluateCapability } from '@mdtodocs/capability-graph';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { DiagnosticsCollector } from '../diagnostics';

export function planRepresentation(
  doc: Root,
  destination: DestinationType,
  collector: DiagnosticsCollector
): Root {
  // We mutate a clone of the AST if we want pure functions, but for now we'll mutate in place
  // since the parser returns a fresh AST on every change.

  visit(doc, (node: any, index, parent) => {
    if (!node.type) return;

    const position = node.position ? {
      line: node.position.start.line,
      column: node.position.start.column,
    } : undefined;

    const cap = evaluateCapability(node.type, node, destination);

    // 1. Wide Table Linearization
    if (cap.requiresPolyfill && cap.transformTo === 'list' && node.type === 'table') {
      collector.add({
        ruleId: 'wide-table-overflow',
        severity: 'warning',
        destination,
        nodeType: 'table',
        position,
        message: cap.reason || 'Table requires polyfill to prevent layout overflow',
        suggestedAction: 'Converted wide table to a linearized list to prevent layout overflow.',
        fixAction: {
          label: 'Linearize Table',
          description: 'Convert wide table rows into structured bullet list',
          autoFixable: true,
        },
      });

      const listNode = transformTableToList(node as Table);
      (listNode as any).data = {
        polyfill: 'table-to-list',
        reason: cap.reason,
      };
      if (parent && index !== undefined) {
        parent.children[index] = listNode;
      }
      return 'skip'; // Skip visiting children of this node
    }

    // 2. Explicit Page Breaks (<!-- pagebreak -->, <div class="page-break">, \pagebreak)
    const isPageBreakHtml =
      node.type === 'html' &&
      (/<!--\s*page-?break\s*-->/i.test(node.value || '') ||
        /<div\s+class=["'](?:page-?break)["']\s*>\s*<\/div>/i.test(node.value || '') ||
        (node.value || '').trim() === '\\pagebreak');

    const isPageBreakParagraph =
      node.type === 'paragraph' &&
      node.children?.length === 1 &&
      node.children[0].type === 'text' &&
      ((node.children[0].value || '').trim() === '\\pagebreak' ||
        /<!--\s*page-?break\s*-->/i.test(node.children[0].value || ''));

    if (isPageBreakHtml || isPageBreakParagraph) {
      const pageBreakNode: any = {
        type: 'html',
        value: '<div class="page-break" data-pagebreak="true"></div>',
        position: node.position,
        data: {
          isPageBreak: true,
          hName: 'div',
          hProperties: { className: ['page-break'], 'data-pagebreak': 'true' },
          hChildren: [],
        },
      };
      if (parent && index !== undefined) {
        parent.children[index] = pageBreakNode;
      }
      return 'skip';
    }

    // Pre-print verification for PDF destination: Wide table margin clipping
    if (destination === 'pdf' && node.type === 'table') {
      const cols = node.children?.[0]?.children?.length || 0;
      if (cols > 7) {
        collector.add({
          ruleId: 'pdf-table-width-overflow',
          severity: 'warning',
          destination: 'pdf',
          nodeType: 'table',
          position,
          message: `Table has ${cols} columns, which may cause horizontal clipping or cramped columns on portrait PDF pages.`,
          suggestedAction: 'Consider simplifying columns or printing in landscape orientation.',
        });
      }
    }

    // 3. Raw HTML / Unsupported Tags: Do NOT silently drop!
    if (node.type === 'html' && destination !== 'pdf') {
      const val = (node.value || '').trim();
      const isPureComment = val.startsWith('<!--') && val.endsWith('-->');

      if (!isPureComment && val.length > 0) {
        const tagMatch = val.match(/<([a-zA-Z0-9\-]+)/);
        const tagName = tagMatch ? `<${tagMatch[1]}>` : 'HTML element';

        collector.add({
          ruleId: 'unsupported-html-element',
          severity: 'warning',
          destination,
          nodeType: 'html',
          position,
          message: `Raw ${tagName} is not natively supported in ${destination}. Content preserved as code block.`,
          suggestedAction: 'Preserved raw HTML in a visible code block to prevent silent content loss.',
          fixAction: {
            label: 'Preserve as Code',
            description: 'Convert raw HTML into a styled code block',
            autoFixable: true,
          },
        });

        const codeNode: any = {
          type: 'code',
          lang: 'html',
          value: node.value,
          position: node.position,
          data: {
            polyfill: 'html-to-code',
            reason: `Raw HTML construct preserved to prevent silent loss`,
          },
        };
        if (parent && index !== undefined) {
          parent.children[index] = codeNode;
        }
        return 'skip';
      }
    }

    // 3. Missing or Unsupported Images
    if (node.type === 'image') {
      if (!node.url || node.url.trim() === '') {
        collector.add({
          ruleId: 'missing-image-source',
          severity: 'warning',
          destination,
          nodeType: 'image',
          position,
          message: 'Image is missing a source URL or file path.',
          suggestedAction: 'Converted image to placeholder text link.',
        });
        const linkNode = {
          type: 'link',
          url: '#missing-image',
          position: node.position,
          data: { polyfill: 'image-to-link' },
          children: [{ type: 'text', value: `[Missing Image: ${node.alt || 'no alt text'}]` }],
        };
        if (parent && index !== undefined) {
          parent.children[index] = linkNode;
        }
        return 'skip';
      } else if (cap.support === 'unsupported') {
        collector.add({
          ruleId: 'missing-image-source',
          severity: 'warning',
          destination,
          nodeType: 'image',
          position,
          message: 'Inline images not supported in target format.',
          suggestedAction: 'Converted inline image to link.',
        });
        const linkNode = {
          type: 'link',
          url: node.url,
          title: node.title,
          position: node.position,
          data: { polyfill: 'image-to-link' },
          children: [{ type: 'text', value: node.alt || 'Image' }],
        };
        if (parent && index !== undefined) {
          parent.children[index] = linkNode;
        }
        return 'skip';
      }
    }

    // 4. Mermaid Diagrams
    if (node.type === 'code' && node.lang === 'mermaid') {
      collector.add({
        ruleId: 'mermaid-asset-conversion',
        severity: 'info',
        destination,
        nodeType: 'code',
        position,
        message: destination === 'pdf'
          ? 'Mermaid diagram rendered as vector SVG'
          : 'Mermaid diagram compiled to vector SVG asset',
      });
    }

    // 5. Mathematical Equations
    if (node.type === 'math' || node.type === 'inlineMath') {
      collector.add({
        ruleId: 'math-equation-typesetting',
        severity: 'info',
        destination,
        nodeType: node.type,
        position,
        message: (destination === 'google-docs' || destination === 'clipboard')
          ? `${node.type === 'math' ? 'Display equation' : 'Inline equation'} formatted with MathML and KaTeX for ${destination === 'google-docs' ? 'Google Docs' : 'clipboard'}`
          : destination === 'word'
          ? `${node.type === 'math' ? 'Display equation' : 'Inline equation'} formatted in Cambria Math typography`
          : `${node.type === 'math' ? 'Display equation' : 'Inline equation'} typeset with KaTeX for vector print`,
      });
    }

    // 6. Styled Callouts
    if (node.type === 'containerDirective') {
      collector.add({
        ruleId: 'callout-styling',
        severity: 'info',
        destination,
        nodeType: 'containerDirective',
        position,
        message: 'Callout rendered with left accent border, icon, and cantSplit protection',
      });
    }

    // 7. General Styled / Transformed Blocks
    if (cap.support === 'styled' && node.type !== 'blockquote' && node.type !== 'thematicBreak' && node.type !== 'containerDirective' && node.type !== 'code' && node.type !== 'html') {
      collector.add({
        ruleId: 'styled-element',
        severity: 'info',
        destination,
        nodeType: node.type,
        position,
        message: `${node.type} rendered with custom styling (not a native ${destination} element)`,
      });
    }
  });

  return doc;
}

function transformTableToList(table: Table): List {
  return {
    type: 'list',
    ordered: false,
    spread: false,
    children: table.children.map((row) => {
      const children: any[] = [];
      row.children.forEach((cell) => {
        children.push(...cell.children);
      });
      return { type: 'listItem', spread: false, children };
    }),
  };
}

