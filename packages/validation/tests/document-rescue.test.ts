import { describe, it, expect } from 'vitest';
import {
  analyzeDocumentForRescue,
  applyRescueFix,
  applyAllRescueFixes,
  documentRescueEngine,
  linearizeMarkdownTable,
  RESCUE_RULES,
} from '@mdtodocs/compiler-core';

describe('Prompt 09: Document Rescue MVP (Preflight Diagnostics & Auto-Repair)', () => {
  it('RESCUE_RULES exports deterministic rules with explicit visual verification flags', () => {
    expect(RESCUE_RULES.length).toBeGreaterThanOrEqual(6);

    for (const rule of RESCUE_RULES) {
      expect(rule.id).toBeDefined();
      expect(rule.name.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
      expect(['info', 'warning', 'error']).toContain(rule.severity);
      expect(typeof rule.requiresVisualVerification).toBe('boolean');
      expect(typeof rule.check).toBe('function');
    }
  });

  describe('Rule: mermaid-syntax', () => {
    it('detects unquoted bracket labels, unclosed subgraphs, and typographic quotes', () => {
      const faultyMarkdown = `# System Architecture\n\n\`\`\`mermaid\ngraph TD\n  subgraph Core\n  A[Calculate (Total)] --> B{Is Valid? [Yes/No]}\n\`\`\`\n`;

      const diags = analyzeDocumentForRescue(faultyMarkdown, 'google-docs');
      const mermaidDiags = diags.filter(d => d.ruleId === 'mermaid-syntax');

      expect(mermaidDiags.length).toBe(1);
      expect(mermaidDiags[0].severity).toBe('error');
      expect(mermaidDiags[0].position?.line).toBe(3);
      expect(mermaidDiags[0].requiresVisualVerification).toBe(false);
      expect(mermaidDiags[0].fixAction?.autoFixable).toBe(true);
      expect(mermaidDiags[0].fixAction?.label).toBe('Auto-Fix Diagram Syntax');

      // Test repair
      const fixed = applyRescueFix(faultyMarkdown, 'mermaid-syntax');
      expect(fixed).toContain('A["Calculate (Total)"]');
      expect(fixed).toContain('B{"Is Valid? [Yes/No]"}');
      expect(fixed).toContain('end');

      // Re-analysis on fixed markdown reports 0 mermaid errors
      const postDiags = analyzeDocumentForRescue(fixed, 'google-docs');
      expect(postDiags.filter(d => d.ruleId === 'mermaid-syntax').length).toBe(0);
    });

    it('false positive control: valid mermaid syntax produces zero diagnostics', () => {
      const cleanMarkdown = `# Clean Diagram\n\n\`\`\`mermaid\ngraph TD\n  subgraph Core\n    A["Calculate (Total)"] --> B["Done"]\n  end\n\`\`\`\n`;

      const diags = analyzeDocumentForRescue(cleanMarkdown, 'google-docs');
      expect(diags.filter(d => d.ruleId === 'mermaid-syntax').length).toBe(0);
    });
  });

  describe('Rule: table-overflow', () => {
    it('detects wide tables exceeding column margins for Word and PDF', () => {
      const wideTableMarkdown = `# Wide Report\n\n| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 | Col 8 |\n|---|---|---|---|---|---|---|---|\n| V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 |\n`;

      const wordDiags = analyzeDocumentForRescue(wideTableMarkdown, 'word');
      const tableDiags = wordDiags.filter(d => d.ruleId === 'table-overflow');

      expect(tableDiags.length).toBe(1);
      expect(tableDiags[0].severity).toBe('warning');
      expect(tableDiags[0].position?.line).toBe(3);
      expect(tableDiags[0].fixAction?.autoFixable).toBe(true);
      expect(tableDiags[0].fixAction?.label).toBe('Linearize Table');

      // Test linearize repair
      const fixed = applyRescueFix(wideTableMarkdown, 'table-overflow', 'word');
      expect(fixed).toContain('- **V1**');
      expect(fixed).toContain('**Col 2**: V2');

      // Re-analysis on linearized markdown reports 0 table overflow warnings
      const postDiags = analyzeDocumentForRescue(fixed, 'word');
      expect(postDiags.filter(d => d.ruleId === 'table-overflow').length).toBe(0);
    });

    it('false positive control: standard 3-column table produces zero overflow warnings', () => {
      const normalTable = `# Metrics\n\n| Metric | Baseline | Target |\n|---|---|---|\n| Speed | 100ms | 50ms |\n`;

      const diags = analyzeDocumentForRescue(normalTable, 'word');
      expect(diags.filter(d => d.ruleId === 'table-overflow').length).toBe(0);
    });
  });

  describe('Rule: missing-image-source', () => {
    it('detects missing or empty image destination URLs and provides link fallback', () => {
      const markdown = `# Asset Test\n\n![System Architecture]()\n\nParagraph text.\n`;

      const diags = analyzeDocumentForRescue(markdown, 'word');
      const imgDiags = diags.filter(d => d.ruleId === 'missing-image-source');

      expect(imgDiags.length).toBe(1);
      expect(imgDiags[0].severity).toBe('warning');
      expect(imgDiags[0].position?.line).toBe(3);
      expect(imgDiags[0].fixAction?.label).toBe('Replace with Link Fallback');

      // Test auto repair
      const fixed = applyRescueFix(markdown, 'missing-image-source', 'word');
      expect(fixed).toContain('[Missing Image: System Architecture](#missing-image)');
      expect(fixed).not.toContain('![System Architecture]()');

      // Re-analysis produces zero missing image warnings
      const postDiags = analyzeDocumentForRescue(fixed, 'word');
      expect(postDiags.filter(d => d.ruleId === 'missing-image-source').length).toBe(0);
    });

    it('false positive control: valid relative or absolute images produce zero warnings', () => {
      const validMarkdown = `# Assets\n\n![Architecture](./images/arch.png)\n![Logo](https://example.com/logo.svg)\n`;

      const diags = analyzeDocumentForRescue(validMarkdown, 'word');
      expect(diags.filter(d => d.ruleId === 'missing-image-source').length).toBe(0);
    });
  });

  describe('Rule: consecutive-pagebreaks', () => {
    it('detects back-to-back pagebreak indicators and collapses them', () => {
      const markdown = `# Chapter 1\n\nContent.\n\n<!-- pagebreak -->\n<!-- pagebreak -->\n\n# Chapter 2\n`;

      const diags = analyzeDocumentForRescue(markdown, 'pdf');
      const pbDiags = diags.filter(d => d.ruleId === 'consecutive-pagebreaks');

      expect(pbDiags.length).toBe(1);
      expect(pbDiags[0].severity).toBe('warning');
      expect(pbDiags[0].position?.line).toBe(5);

      // Auto repair
      const fixed = applyRescueFix(markdown, 'consecutive-pagebreaks', 'pdf');
      expect(fixed).not.toContain('<!-- pagebreak -->\n<!-- pagebreak -->');
      expect(fixed).toContain('<!-- pagebreak -->');

      const postDiags = analyzeDocumentForRescue(fixed, 'pdf');
      expect(postDiags.filter(d => d.ruleId === 'consecutive-pagebreaks').length).toBe(0);
    });

    it('false positive control: intentional isolated pagebreaks produce zero warnings', () => {
      const markdown = `# Chapter 1\n\nContent.\n\n<!-- pagebreak -->\n\n# Chapter 2\n`;

      const diags = analyzeDocumentForRescue(markdown, 'pdf');
      expect(diags.filter(d => d.ruleId === 'consecutive-pagebreaks').length).toBe(0);
    });
  });

  describe('Rule: unsupported-html-element', () => {
    it('detects unsupported interactive HTML tags on Word destination', () => {
      const markdown = `# Media\n\n<marquee>Breaking News</marquee>\n`;

      const diags = analyzeDocumentForRescue(markdown, 'word');
      const htmlDiags = diags.filter(d => d.ruleId === 'unsupported-html-element');

      expect(htmlDiags.length).toBe(1);
      expect(htmlDiags[0].severity).toBe('warning');
      expect(htmlDiags[0].message).toContain('marquee');

      const fixed = applyRescueFix(markdown, 'unsupported-html-element', 'word');
      expect(fixed).toContain('```html\n<marquee>Breaking News</marquee>\n```');
    });
  });

  describe('Rule: heading-orphan & Visual Verification Reporting', () => {
    it('reports visual verification required for trailing orphan headings', () => {
      const markdown = `# Final Document\n\nBody content here.\n\n## Unfinished Appendix`;

      const diags = analyzeDocumentForRescue(markdown, 'google-docs');
      const orphanDiags = diags.filter(d => d.ruleId === 'heading-orphan');

      expect(orphanDiags.length).toBe(1);
      expect(orphanDiags[0].severity).toBe('info');
      expect(orphanDiags[0].requiresVisualVerification).toBe(true);
      expect(orphanDiags[0].message).toContain('Unfinished Appendix');
    });
  });

  describe('Multi-issue Atomic Rescue (applyAllRescueFixes)', () => {
    it('safely applies all automated repairs in a single pass without text corruption or score fabrication', () => {
      const complexFaultyMarkdown = [
        '# Document With Multiple Issues',
        '',
        '```mermaid',
        'graph TD',
        '  subgraph Pipeline',
        '  A[Process (Step 1)] --> B["Finished"]',
        '```',
        '',
        '![Diagram]()',
        '',
        '<!-- pagebreak -->',
        '<!-- pagebreak -->',
        '',
        '| Col1 | Col2 | Col3 | Col4 | Col5 | Col6 | Col7 | Col8 |',
        '|---|---|---|---|---|---|---|---|',
        '| A | B | C | D | E | F | G | H |',
        '',
      ].join('\n');

      const initialDiags = analyzeDocumentForRescue(complexFaultyMarkdown, 'word');
      expect(initialDiags.length).toBeGreaterThanOrEqual(4);

      // 1-Click apply all safe fixes
      const rescuedMarkdown = applyAllRescueFixes(complexFaultyMarkdown, 'word');

      // Verify each repair
      expect(rescuedMarkdown).toContain('A["Process (Step 1)"]');
      expect(rescuedMarkdown).toContain('end');
      expect(rescuedMarkdown).toContain('[Missing Image: Diagram](#missing-image)');
      expect(rescuedMarkdown).not.toContain('<!-- pagebreak -->\n<!-- pagebreak -->');
      expect(rescuedMarkdown).toContain('- **A**');

      // Re-analysis shows all automated errors and warnings resolved
      const remainingDiags = analyzeDocumentForRescue(rescuedMarkdown, 'word');
      const criticalIssues = remainingDiags.filter(d => d.severity === 'error' || d.severity === 'warning');
      expect(criticalIssues.length).toBe(0);

      // Idempotency: Running again produces identical string
      const secondPass = applyAllRescueFixes(rescuedMarkdown, 'word');
      expect(secondPass).toBe(rescuedMarkdown);
    });
  });
});
