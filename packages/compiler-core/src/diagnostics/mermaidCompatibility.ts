import { parseMarkdown } from '../parser';
import type { Code, RootContent } from 'mdast';

export interface MermaidBlock {
  start: number;
  end: number;
  line: number;
  code: string;
  original: string;
  format: 'fenced' | 'azure' | 'standalone';
  fence: string;
  prefix: string;
  newline: string;
}

const diagramStart =
  /^(?:graph\s+(?:TD|TB|BT|LR|RL)\b|flowchart\s+(?:TD|TB|BT|LR|RL)\b|sequenceDiagram\b|classDiagram\b|stateDiagram(?:-v2)?\b|erDiagram\b|gantt\b|pie\b|journey\b|gitGraph\b|mindmap\b|timeline\b|quadrantChart\b|requirementDiagram\b|(?:C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b|kanban\b|treemap-beta\b|radar-beta\b|xychart(?:-beta)?\b|block-beta\b|packet-beta\b|architecture-beta\b|sankey-beta\b)/;

export function findMermaidBlocks(markdown: string): MermaidBlock[] {
  // Ordinary documents need no extra Markdown parse while the user is typing.
  if (
    !/(?:^|\n)[^\n]*(?:`{3,}|~{3,})[ \t]*mermaid\b|(?:^|\n) {0,3}:::[ \t]*mermaid\b/i.test(
      markdown,
    ) &&
    !diagramStart.test(markdown.trimStart())
  )
    return [];
  const tree = parseMarkdown(markdown);
  const blocks: MermaidBlock[] = [];
  const protectedRanges: [number, number][] = [];
  const add = (
    start: number,
    end: number,
    code: string,
    format: MermaidBlock['format'],
    fence = '```',
    prefix = '',
  ) =>
    blocks.push({
      start,
      end,
      code,
      format,
      fence,
      prefix,
      original: markdown.slice(start, end),
      line: markdown.slice(0, start).split('\n').length,
      newline: markdown.includes('\r\n') ? '\r\n' : '\n',
    });
  const walk = (node: RootContent) => {
    const start = node.position?.start.offset,
      end = node.position?.end.offset;
    if (
      (node.type === 'code' || node.type === 'html') &&
      start !== undefined &&
      end !== undefined
    ) {
      protectedRanges.push([start, end]);
      if (node.type === 'code' && node.lang?.toLowerCase() === 'mermaid') {
        const original = markdown.slice(start, end);
        const fence = original.match(/^(`{3,}|~{3,})/)?.[1] || '```';
        const last = original.split(/\r?\n/).at(-1) || '';
        const prefix = last.match(/^([ \t>]*)(?:`{3,}|~{3,})/)?.[1] || '';
        add(start, end, (node as Code).value, 'fenced', fence, prefix);
      }
    }
    if ('children' in node)
      node.children.forEach((child) => walk(child as RootContent));
  };
  tree.children.forEach(walk);
  const lines = markdown.match(/[^\n]*(?:\n|$)/g) || [];
  let offset = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (
      /^ {0,3}:::[ \t]*mermaid[ \t]*\r?\n$/i.test(line) &&
      !protectedRanges.some(([start, end]) => offset >= start && offset < end)
    ) {
      let close = index + 1;
      while (
        close < lines.length &&
        !/^ {0,3}:::[ \t]*(?:\r?\n)?$/.test(lines[close])
      )
        close++;
      if (close < lines.length) {
        const content = lines
          .slice(index + 1, close)
          .join('')
          .replace(/\r?\n$/, '');
        const raw = lines
          .slice(index, close + 1)
          .join('')
          .replace(/\r?\n$/, '');
        add(offset, offset + raw.length, content, 'azure');
        offset += lines.slice(index, close + 1).join('').length;
        index = close;
        continue;
      }
    }
    offset += line.length;
  }
  if (!blocks.length && diagramStart.test(markdown.trimStart())) {
    const start = markdown.length - markdown.trimStart().length;
    add(start, markdown.trimEnd().length, markdown.trim(), 'standalone');
  }
  return blocks.sort((a, b) => a.start - b.start);
}

export function formatMermaidBlock(block: MermaidBlock, code: string): string {
  const fence = block.fence;
  const body = code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => block.prefix + line)
    .join(block.newline);
  return `${fence}mermaid${block.newline}${body}${block.newline}${block.prefix}${fence}`;
}

export function applyMermaidRepairs(
  current: string,
  expected: string,
  patches: { block: MermaidBlock; code: string }[],
): string {
  if (current !== expected)
    throw new Error('Document changed. Review the latest source again.');
  let result = current;
  let previousStart = current.length;
  for (const { block, code } of [...patches].sort(
    (a, b) => b.block.start - a.block.start,
  )) {
    if (
      block.end > previousStart ||
      current.slice(block.start, block.end) !== block.original
    )
      throw new Error('Diagram source changed. Review again.');
    result =
      result.slice(0, block.start) +
      formatMermaidBlock(block, code) +
      result.slice(block.end);
    previousStart = block.start;
  }
  return result;
}
