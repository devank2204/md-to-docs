import { visit } from 'unist-util-visit';
import { parseMarkdown } from '@mdtodocs/compiler-core';

export function sourceBlock(
  markdown: string,
  line: number,
  tree = parseMarkdown(markdown),
): { start: number; end: number; line: number; text: string } | null {
  if (!Number.isInteger(line) || line < 1) return null;
  let block: { start: number; end: number; line: number; text: string } | null =
    null;
  const blockTypes = new Set([
    'heading',
    'paragraph',
    'table',
    'code',
    'html',
    'math',
    'blockquote',
    'list',
    'listItem',
  ]);
  visit(tree, (node) => {
    const position = node.position;
    const start = position?.start.offset;
    const end = position?.end.offset;
    if (
      !blockTypes.has(node.type) ||
      !position ||
      start === undefined ||
      end === undefined ||
      position.start.line > line ||
      position.end.line < line
    )
      return;
    if (!block || end - start < block.end - block.start)
      block = {
        start,
        end,
        line: position.start.line,
        text: markdown.slice(start, end),
      };
  });
  return block;
}

export function selectSource(markdown: string, start: number, end: number) {
  const editor = document.querySelector<HTMLTextAreaElement>(
    '[data-source-editor]',
  );
  if (!editor || editor.value !== markdown) return false;
  editor.focus();
  editor.setSelectionRange(start, end);
  // Native textarea selection does not consistently scroll after programmatic jumps.
  const style = getComputedStyle(editor);
  const lineHeight = Number.parseFloat(style.lineHeight) || 24;
  editor.scrollTop = Math.max(
    0,
    (markdown.slice(0, start).split('\n').length - 3) * lineHeight,
  );
  return true;
}
