import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@mdtodocs/compiler-core';
import {
  evaluateCapability,
  DESTINATIONS,
  FEATURE_CAPABILITIES,
  type DestinationType,
} from '@mdtodocs/capability-graph';
import { validateDocument, detectActivePolyfills } from '../src/index';

describe('Prompt 9: Destination Diagnostics & Capability Inspector', () => {
  it('FEATURE_CAPABILITIES exports comprehensive cross-destination matrix', () => {
    expect(FEATURE_CAPABILITIES.length).toBeGreaterThanOrEqual(10);

    const destinations: DestinationType[] = ['google-docs', 'word', 'pdf', 'clipboard'];

    for (const feat of FEATURE_CAPABILITIES) {
      expect(feat.id).toBeDefined();
      expect(feat.name).toBeDefined();
      expect(feat.category).toBeDefined();
      expect(feat.description).toBeDefined();

      for (const dest of destinations) {
        expect(['native', 'styled', 'transformed', 'image', 'text', 'unsupported']).toContain(
          feat.support[dest]
        );
      }
    }
  });

  it('DESTINATIONS accurately declares profiles for all supported formats', () => {
    expect(DESTINATIONS['google-docs'].name).toBe('Google Docs');
    expect(DESTINATIONS['google-docs'].supportsMermaid).toBe(true);
    expect(DESTINATIONS['google-docs'].supportsMath).toBe(true);
    expect(DESTINATIONS['google-docs'].supportsCallouts).toBe(true);
    expect(DESTINATIONS['google-docs'].supportsTaskLists).toBe(true);
    expect(DESTINATIONS['google-docs'].supportsFootnotes).toBe(true);

    expect(DESTINATIONS['word'].name).toBe('Microsoft Word');
    expect(DESTINATIONS['word'].maxTableColumns).toBe(63);
    expect(DESTINATIONS['word'].supportsMermaid).toBe(true);
    expect(DESTINATIONS['word'].supportsCallouts).toBe(true);
  });

  it('evaluateCapability distinguishes Mermaid from standard code blocks', () => {
    const standardCodeNode = { type: 'code', lang: 'typescript', value: 'const x = 1;' };
    const mermaidNode = { type: 'code', lang: 'mermaid', value: 'graph TD; A-->B;' };

    const standardCap = evaluateCapability('code', standardCodeNode, 'google-docs');
    const mermaidCap = evaluateCapability('code', mermaidNode, 'google-docs');

    expect(standardCap.support).toBe('styled');
    expect(mermaidCap.support).toBe('image');
    expect(mermaidCap.requiresPolyfill).toBe(true);
    expect(mermaidCap.reason).toContain('Mermaid diagram converted to vector SVG asset');

    const pdfMermaidCap = evaluateCapability('code', mermaidNode, 'pdf');
    expect(pdfMermaidCap.support).toBe('native');
  });

  it('evaluateCapability flags wide tables exceeding destination column limits', () => {
    const normalTable = {
      type: 'table',
      children: [
        {
          type: 'tableRow',
          children: [{ type: 'tableCell' }, { type: 'tableCell' }, { type: 'tableCell' }],
        },
      ],
    };

    const wideTable = {
      type: 'table',
      children: [
        {
          type: 'tableRow',
          children: Array.from({ length: 25 }, () => ({ type: 'tableCell' })),
        },
      ],
    };

    const normalCap = evaluateCapability('table', normalTable, 'google-docs');
    expect(normalCap.support).toBe('native');
    expect(normalCap.requiresPolyfill).toBe(false);

    const wideCap = evaluateCapability('table', wideTable, 'google-docs');
    expect(wideCap.support).toBe('transformed');
    expect(wideCap.requiresPolyfill).toBe(true);
    expect(wideCap.transformTo).toBe('list');
    expect(wideCap.reason).toContain('exceeding the 20-column limit');
  });

  it('detectActivePolyfills identifies active protections and fidelity adjustments', () => {
    const markdown = `
# Complex Feature Document

:::warning
Critical system message
:::

Here is an inline equation $E = mc^2$ and a display equation:

$$
\\int_{0}^{\\infty} e^{-x} dx = 1
$$

- [x] Completed task
- [ ] Pending task

\`\`\`mermaid
graph TD;
    Start --> Stop;
\`\`\`

Here is a footnote[^1].

[^1]: Footnote citation text.
`;

    const doc = parseMarkdown(markdown);
    const polyfills = detectActivePolyfills(doc, 'google-docs');

    const polyfillIds = polyfills.map((p) => p.id);
    expect(polyfillIds).toContain('math-typesetting');
    expect(polyfillIds).toContain('callout-styling');
    expect(polyfillIds).toContain('task-list-ballot');
    expect(polyfillIds).toContain('mermaid-vector-asset');
    expect(polyfillIds).toContain('footnote-superscript');

    const mathPolyfill = polyfills.find((p) => p.id === 'math-typesetting');
    expect(mathPolyfill?.count).toBe(2);

    const calloutPolyfill = polyfills.find((p) => p.id === 'callout-styling');
    expect(calloutPolyfill?.count).toBe(1);

    const taskListPolyfill = polyfills.find((p) => p.id === 'task-list-ballot');
    expect(taskListPolyfill?.count).toBe(2);
  });

  it('validateDocument generates complete report with activePolyfills and fidelity score', () => {
    const markdown = `
# Clean Document

Simple paragraph with **bold** text and an [external link](https://example.com).

- Item 1
- Item 2
`;

    const doc = parseMarkdown(markdown);
    const report = validateDocument(doc, 'google-docs');

    expect(report.destination).toBe('google-docs');
    expect(report.summary.fidelityScore).toBe(100);
    expect(report.summary.unsupported).toBe(0);
    expect(report.activePolyfills.length).toBe(0);
  });
});
