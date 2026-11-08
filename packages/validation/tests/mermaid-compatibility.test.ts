import { describe, expect, it } from 'vitest';
import {
  autoFixMermaidCode,
  findMermaidBlocks,
  proposeMermaidRepair,
  applyMermaidRepairs,
} from '@mdtodocs/compiler-core';
import { renderMermaid } from '@mdtodocs/asset-pipeline';

// Regression: Mermaid compatibility was tested through a duplicated helper and silent fallback.
// Found by /qa on 2026-11-07. Report: docs/qa/mermaid-repair-and-actions.md
const cases = [
  [
    'special labels',
    'graph TD\nA[Calculate (Total)] --> B{Is Valid? [Yes/No]}',
    'A["Calculate (Total)"]',
  ],
  ['smart delimiters', 'graph LR\nA[“Draft”] --> B[Done]', 'A["Draft"]'],
  ['split arrow', 'flowchart TD\nA -- > B', 'A --> B'],
  ['missing subgraph end', 'graph TD\nsubgraph Group\nA --> B', '\nend'],
  ['reserved label', 'flowchart LR\nA[end] --> B[Done]', 'A["end"]'],
] as const;
for (const [name, source, expected] of cases)
  it(`offers a validated repair for ${name}`, async () => {
    const proposal = proposeMermaidRepair(source);
    expect(proposal.code).toContain(expected);
    expect(proposal.changes.length).toBeGreaterThan(0);
    expect(
      (await renderMermaid(proposal.code, { repair: false })).success,
    ).toBe(true);
  });

it.each([
  'flowchart TD\nA[(Database)] --> B((Circle)) --> C([Stadium])',
  'graph TD\nA["subgraph end -- > O’Brien"] --> B',
  'sequenceDiagram\nA->>B: subgraph end -- > “hello”',
  'flowchart LR\nA ----> B\nA ---o C\nA ---x D',
  'graph TD\n%% subgraph This is a comment\nA --> B',
])(
  'does not rewrite valid shapes, labels, other diagram languages or edge meaning: %s',
  (source) => {
    expect(autoFixMermaidCode(source)).toBe(source);
  },
);

it('recognizes Azure containers, standard/tilde fences and standalone diagrams, skipping code examples', () => {
  const source =
    '# Notes\n\n::: mermaid\ngraph LR\nA --> B\n:::\n\n~~~mermaid\nsequenceDiagram\nA->>B: Hello\n~~~\n\n````md\n::: mermaid\ngraph TD\nX --> Y\n:::\n````';
  const blocks = findMermaidBlocks(source);
  expect(blocks.map((block) => block.format)).toEqual(['azure', 'fenced']);
  expect(blocks[0].original).toBe('::: mermaid\ngraph LR\nA --> B\n:::');
  expect(findMermaidBlocks('flowchart LR\nA --> B')[0].format).toBe(
    'standalone',
  );
  expect(
    findMermaidBlocks('Ordinary prose about flowchart LR\nA --> B'),
  ).toHaveLength(0);
});

it('patches only the selected duplicate block and refuses a changed document', () => {
  const raw = '```mermaid\ngraph TD\nA[Calculate (Total)] --> B\n```';
  const source = '# Two\n\n' + raw + '\n\n' + raw;
  const blocks = findMermaidBlocks(source);
  const proposed = proposeMermaidRepair(blocks[1].code);
  const result = applyMermaidRepairs(source, source, [
    { block: blocks[1], code: proposed.code },
  ]);
  expect(result.slice(0, blocks[1].start)).toBe(
    source.slice(0, blocks[1].start),
  );
  expect(result).toContain('A["Calculate (Total)"]');
  expect(() =>
    applyMermaidRepairs(source + '\nChanged', source, [
      { block: blocks[1], code: proposed.code },
    ]),
  ).toThrow(/changed/i);
});

it('strict rendering reports the original error instead of silently changing source', async () => {
  const result = await renderMermaid('graph TD\nA[Calculate (Total)] --> B', {
    repair: false,
  });
  expect(result.success).toBe(false);
});

it('preserves CRLF prose, tilde fences and nested list indentation during repair', () => {
  const source =
    '- Diagram\r\n\r\n  ~~~~mermaid\r\n  graph TD\r\n  A[Calculate (Total)] --> B\r\n  ~~~~\r\n\r\nKeep this.';
  const block = findMermaidBlocks(source)[0];
  const result = applyMermaidRepairs(source, source, [
    { block, code: autoFixMermaidCode(block.code) },
  ]);
  expect(result).toBe(
    '- Diagram\r\n\r\n  ~~~~mermaid\r\n  graph TD\r\n  A["Calculate (Total)"] --> B\r\n  ~~~~\r\n\r\nKeep this.',
  );
});

it('preserves inline comments and rejects overlapping or duplicate patches', () => {
  const code = 'graph TD\nA --> B %% subgraph Not real -- > end';
  expect(autoFixMermaidCode(code)).toBe(code);
  const source = '```mermaid\n' + code + '\n```';
  const block = findMermaidBlocks(source)[0];
  expect(() =>
    applyMermaidRepairs(source, source, [
      { block, code },
      { block, code },
    ]),
  ).toThrow();
});

it('emits standalone SVG XML that image decoders can read, including quoted font names', async () => {
  const result = await renderMermaid('graph TD\nA[Draft] --> B[Document]', {
    repair: false,
  });
  expect(result.success).toBe(true);
  if (!result.success) return;
  const document = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
  expect(document.querySelector('parsererror')?.textContent || '').toBe('');
  expect(document.documentElement.localName).toBe('svg');
});

it('does not treat a supplied font family as executable CSS or SVG markup', async () => {
  const result = await renderMermaid('graph TD\nA --> B', {
    repair: false,
    font: 'serif;fill:url(https://example.test/track)',
  });
  expect(result.success).toBe(true);
  if (result.success) expect(result.svg).not.toContain('example.test');
});
