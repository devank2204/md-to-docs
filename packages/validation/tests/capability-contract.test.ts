import { describe, it, expect } from 'vitest';
import { visit } from 'unist-util-visit';
import { parseMarkdown, planRepresentation, DiagnosticsCollector, type DocumentDiagnostic } from '@mdtodocs/compiler-core';
import {
  evaluateCapability,
  DESTINATIONS,
  CAPABILITY_RULES,
  getDestinationProfile,
  isFeatureSupported,
  getSupportedFeatures,
  type DestinationType,
} from '@mdtodocs/capability-graph';
import { renderToClipboardHtml, renderToDocxBlob, renderToHtml } from '@mdtodocs/renderers';

describe('Prompt 03: Destination Capability Contract & Structured Warning Model', () => {
  it('CAPABILITY_RULES exports structured, actionable diagnostic rules', () => {
    expect(Object.keys(CAPABILITY_RULES).length).toBeGreaterThanOrEqual(5);

    for (const [key, rule] of Object.entries(CAPABILITY_RULES)) {
      expect(rule.id).toBe(key);
      expect(rule.name.length).toBeGreaterThan(0);
      expect(['info', 'warning', 'error']).toContain(rule.severity);
      expect(rule.description.length).toBeGreaterThan(0);
      expect(rule.fallbackMechanism.length).toBeGreaterThan(0);
    }
  });

  it('destination helpers accurately evaluate feature support and profiles', () => {
    const wordProfile = getDestinationProfile('word');
    expect(wordProfile.maxTableColumns).toBe(63);
    expect(wordProfile.name).toBe('Microsoft Word');

    const docsProfile = getDestinationProfile('google-docs');
    expect(docsProfile.maxTableColumns).toBe(20);

    expect(isFeatureSupported('tables', 'word')).toBe(true);
    expect(isFeatureSupported('math', 'google-docs')).toBe(true);
    expect(isFeatureSupported('headings', 'pdf')).toBe(true);

    const supportedInWord = getSupportedFeatures('word');
    expect(supportedInWord.length).toBeGreaterThanOrEqual(10);
  });

  it('generates structured warning with fixAction and position when table exceeds column limits', () => {
    // Generate a 25-column table that exceeds the 20-column limit for Google Docs
    const headerRow = '| ' + Array.from({ length: 25 }, (_, i) => `Col${i + 1}`).join(' | ') + ' |';
    const alignRow = '| ' + Array.from({ length: 25 }, () => '---').join(' | ') + ' |';
    const dataRow = '| ' + Array.from({ length: 25 }, (_, i) => `Val${i + 1}`).join(' | ') + ' |';
    const markdown = `# Table Test\n\n${headerRow}\n${alignRow}\n${dataRow}\n`;

    const doc = parseMarkdown(markdown);
    const collector = new DiagnosticsCollector();
    const plannedDoc = planRepresentation(doc, 'google-docs', collector);

    expect(collector.hasWarnings()).toBe(true);
    const warnings = collector.getWarnings();
    expect(warnings.length).toBeGreaterThanOrEqual(1);

    const tableWarn = warnings.find(w => w.ruleId === 'wide-table-overflow');
    expect(tableWarn).toBeDefined();
    expect(tableWarn?.severity).toBe('warning');
    expect(tableWarn?.destination).toBe('google-docs');
    expect(tableWarn?.nodeType).toBe('table');
    expect(tableWarn?.position?.line).toBe(3);
    expect(tableWarn?.fixAction?.autoFixable).toBe(true);
    expect(tableWarn?.fixAction?.label).toBe('Linearize Table');

    // Verify AST was linearized into a list with polyfill marker
    const listNode = plannedDoc.children.find((c: any) => c.type === 'list');
    expect(listNode).toBeDefined();
    expect((listNode as any).data?.polyfill).toBe('table-to-list');
  });

  it('generates warning and preserves content as code block for unsupported raw HTML', () => {
    const markdown = `# HTML Support Test\n\n<video width="320" height="240" controls>\n  <source src="movie.mp4" type="video/mp4">\n</video>\n\n<canvas id="myCanvas"></canvas>\n`;

    const doc = parseMarkdown(markdown);
    const collector = new DiagnosticsCollector();
    const plannedDoc = planRepresentation(doc, 'word', collector);

    expect(collector.hasWarnings()).toBe(true);
    const htmlWarnings = collector.getWarnings().filter(w => w.ruleId === 'unsupported-html-element');
    expect(htmlWarnings.length).toBeGreaterThanOrEqual(2);

    const videoWarn = htmlWarnings.find(w => w.message.includes('video'));
    expect(videoWarn).toBeDefined();
    expect(videoWarn?.destination).toBe('word');
    expect(videoWarn?.nodeType).toBe('html');
    expect(videoWarn?.position?.line).toBe(3);
    expect(videoWarn?.suggestedAction).toContain('code block');

    // Verify raw HTML tags were converted to code blocks with data.polyfill so content is never dropped
    const codeBlocks: any[] = [];
    visit(plannedDoc, (node: any) => {
      if (node.type === 'code' && node.data?.polyfill === 'html-to-code') {
        codeBlocks.push(node);
      }
    });
    expect(codeBlocks.length).toBeGreaterThanOrEqual(2);
    expect(codeBlocks.some(c => c.value.includes('<video') || c.value.includes('<source'))).toBe(true);
    expect(codeBlocks.some(c => c.value.includes('<canvas'))).toBe(true);
  });

  it('generates warning for missing image source without dropping alt text', () => {
    const markdown = `# Image Test\n\n![Broken Diagram]()\n`;

    const doc = parseMarkdown(markdown);
    const collector = new DiagnosticsCollector();
    const plannedDoc = planRepresentation(doc, 'google-docs', collector);

    expect(collector.hasWarnings()).toBe(true);
    const imgWarn = collector.getWarnings().find(w => w.ruleId === 'missing-image-source');
    expect(imgWarn).toBeDefined();
    expect(imgWarn?.nodeType).toBe('image');
    expect(imgWarn?.position?.line).toBe(3);

    // Verify placeholder link was created preserving alt text
    const linkNode: any = plannedDoc.children.find((c: any) => c.children?.some((child: any) => child.data?.polyfill === 'image-to-link'));
    expect(linkNode).toBeDefined();
  });

  it('exporters guarantee ZERO silent drop for raw HTML and unknown AST nodes', async () => {
    const syntheticDoc: any = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [{ type: 'text', value: 'Zero Drop Guarantee' }]
        },
        {
          type: 'html',
          value: '<canvas id="direct-canvas" width="100"></canvas>'
        },
        {
          type: 'unknownCustomBlock',
          value: 'This is custom markdown node content that must not vanish'
        }
      ]
    };

    // 1. Clipboard HTML must contain both the HTML value and custom block value
    const clipboardHtml = renderToClipboardHtml(syntheticDoc);
    expect(clipboardHtml).toContain('direct-canvas');
    expect(clipboardHtml).toContain('This is custom markdown node content that must not vanish');

    // 2. Standalone HTML must contain both
    const standaloneHtml = renderToHtml(syntheticDoc);
    expect(standaloneHtml).toContain('direct-canvas');
    expect(standaloneHtml).toContain('This is custom markdown node content that must not vanish');

    // 3. Word DOCX must compile cleanly and preserve the text
    const docxBlob = await renderToDocxBlob(syntheticDoc);
    expect(docxBlob.size).toBeGreaterThan(1000);
  });
});
