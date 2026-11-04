import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_PRESETS,
  getPreset,
  applyPresetTheme,
  type DocumentPresetId,
  parseMarkdown,
  planRepresentation,
  DiagnosticsCollector,
} from '@mdtodocs/compiler-core';
import { renderToHtml, renderToClipboardHtml } from '@mdtodocs/renderers';

describe('Document Presets (AI-Generated Document Styling)', () => {
  const allPresetIds: DocumentPresetId[] = [
    'default',
    'ai-prd',
    'tech-arch',
    'research-report',
    'executive-brief',
  ];

  it('defines all 5 presets with complete metadata and distinct layout rules', () => {
    expect(Object.keys(DOCUMENT_PRESETS)).toHaveLength(5);

    for (const id of allPresetIds) {
      const preset = getPreset(id);
      expect(preset).toBeDefined();
      expect(preset.id).toBe(id);
      expect(preset.name).toBeTruthy();
      expect(preset.badge).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.theme).toBeDefined();
      expect(preset.layoutRules).toBeDefined();
      expect(preset.layoutRules.tableStyle).toMatch(/striped|bordered|minimal|academic/);
      expect(preset.layoutRules.calloutStyle).toMatch(/border-left|boxed|tinted/);
      expect(preset.layoutRules.codeBlockContrast).toMatch(/normal|high-contrast|subtle/);
      expect(preset.layoutRules.headingStyle).toMatch(/accent-underline|pill|classic|uppercase-muted/);
    }
  });

  it('Product Spec (PRD) preset has correct blue accents, boxed callouts, and striped tables', () => {
    const prd = getPreset('ai-prd');
    expect(prd.name).toBe('Product Spec (PRD)');
    expect(prd.badge).toBe('PRD Spec');
    expect(prd.theme.colors.primary).toBe('2563EB');
    expect(prd.layoutRules.tableStyle).toBe('striped');
    expect(prd.layoutRules.calloutStyle).toBe('boxed');
  });

  it('Technical Architecture preset has high-contrast code blocks and monospace typography', () => {
    const techArch = getPreset('tech-arch');
    expect(techArch.name).toBe('Technical Architecture');
    expect(techArch.badge).toBe('Tech Spec');
    expect(techArch.layoutRules.codeBlockContrast).toBe('high-contrast');
    expect(techArch.theme.colors.codeBackground).toBe('1E293B');
    expect(techArch.theme.typography.codeFont).toContain('Mono');
  });

  it('Research Report preset uses academic serif typography and formal table styling', () => {
    const research = getPreset('research-report');
    expect(research.badge).toBe('Research Report');
    expect(research.theme.typography.bodyFont).toContain('Newsreader');
    expect(research.layoutRules.tableStyle).toBe('academic');
    expect(research.layoutRules.calloutStyle).toBe('tinted');
  });

  it('Executive Deliverable preset features deep navy accents and minimalist styling', () => {
    const exec = getPreset('executive-brief');
    expect(exec.badge).toBe('Executive Brief');
    expect(exec.theme.colors.primary).toBe('1E3A8A');
    expect(exec.layoutRules.tableStyle).toBe('minimal');
    expect(exec.theme.spacing.lineHeight).toBeGreaterThanOrEqual(1.6);
  });

  it('applyPresetTheme creates an isolated theme and applies custom baseFontSize', () => {
    const themeDefaultSize = applyPresetTheme('ai-prd');
    expect(themeDefaultSize.typography.baseFontSizePt).toBe(10.5);

    const themeCustomSize = applyPresetTheme('ai-prd', 14);
    expect(themeCustomSize.typography.baseFontSizePt).toBe(14);
    // Original preset theme remains unchanged
    expect(getPreset('ai-prd').theme.typography.baseFontSizePt).toBe(10.5);
  });

  it('presets influence rendered exports without corrupting or modifying source markdown', () => {
    const rawMarkdown = `# System Architecture Spec

This document describes the distributed consensus algorithm.

| Parameter | Recommended | Range |
| :--- | :--- | :--- |
| Heartbeat | 50ms | 20-100ms |
| Election Timeout | 300ms | 150-600ms |

> [!NOTE]
> High availability requires at least 3 nodes.

\`\`\`rust
fn heartbeat() -> Result<(), NodeError> {
    send_ping();
    Ok(())
}
\`\`\`
`;

    // Clone source to verify strict immutability
    const markdownCopy = `${rawMarkdown}`;

    for (const presetId of allPresetIds) {
      const theme = applyPresetTheme(presetId);
      const collector = new DiagnosticsCollector();
      const ast = parseMarkdown(rawMarkdown);
      const plannedAst = planRepresentation(ast, 'google-docs', collector);

      // 1. Render to Clipboard HTML
      const clipboardHtml = renderToClipboardHtml(plannedAst, theme);
      expect(clipboardHtml).toContain('System Architecture Spec');
      expect(clipboardHtml).toContain('Heartbeat');
      expect(clipboardHtml).toContain('send_ping');

      // 2. Render to full HTML
      const fullHtml = renderToHtml(plannedAst, { theme, fullDocument: true });
      expect(fullHtml).toContain('<!DOCTYPE html>');
      expect(fullHtml).toContain(`font-size:${theme.typography.headingSizesPt[1]}pt`);
      expect(fullHtml).toContain(theme.colors.text);

      // Verify source markdown was NEVER mutated
      expect(rawMarkdown).toBe(markdownCopy);
    }
  });
});
