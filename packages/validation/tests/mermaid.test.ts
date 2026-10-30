import { test, expect } from 'vitest';
import { renderMermaid, inlineOndineColors } from '@mdtodocs/asset-pipeline';

test('mermaid render using Ondine compiler', async () => {
  const source = `graph TD\nA-->B`;
  
  const result = await renderMermaid(source);
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.svg).toContain('<svg');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.svg).not.toContain('fill="var(--_s)"'); // Confirms color inlining for export fidelity
  }
});

test('mermaid inlines dark theme colors for exports', async () => {
  const source = `flowchart LR\nStart --> Stop`;
  const result = await renderMermaid(source, { theme: 'dark' });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.svg).toContain('#1e1e24'); // dark background inlined
  }
});
