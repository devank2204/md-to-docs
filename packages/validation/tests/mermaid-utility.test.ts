import { describe, it, expect } from 'vitest';
import {
  renderMermaid,
  inlineOndineColors,
  sanitizeMermaidSvg,
  extractMermaidAccessibleText,
  autoFixMermaidCode,
} from '@mdtodocs/asset-pipeline';
import { LANDING_ROUTES, getRouteSpec } from '../../../apps/web/src/routes/landingData';

describe('Mermaid Utility Cluster (Prompt 10)', () => {
  const sampleFlowchart = `graph TD
  Client["Web Browser"] --> Gateway["API Gateway"]
  Gateway --> Service["Compiler Worker"]
`;

  const sampleSequence = `sequenceDiagram
  autonumber
  actor User as End User
  participant App as Client Application
  participant API as Backend Service

  User->>App: Click "Export"
  App->>API: POST /compile
  API-->>App: 200 OK
`;

  it('renders Mermaid to SVG with transparent background', async () => {
    const result = await renderMermaid(sampleFlowchart, { transparent: true });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('background-color:transparent');
    expect(result.svg).not.toContain('<rect id="ondine-export-bg"');
    expect(result.svg).toContain('Web Browser');
    expect(result.svg).toContain('API Gateway');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('renders Mermaid to SVG with custom solid background', async () => {
    const customBg = '#1e1e24';
    const result = await renderMermaid(sampleFlowchart, {
      transparent: false,
      background: customBg,
      theme: 'dark',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain(`background-color:${customBg}`);
    expect(result.svg).toContain(`<rect id="ondine-export-bg" width="100%" height="100%" fill="${customBg}"/>`);
  });

  it('sanitizes SVG to guarantee valid xmlns, viewBox, and strip scripts', () => {
    const dirtySvg = '<svg width="500" height="300" onload="alert(1)"><script>malicious()</script><circle cx="50" cy="50" r="40"/></svg>';
    const cleaned = sanitizeMermaidSvg(dirtySvg);

    expect(cleaned).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(cleaned).toContain('viewBox="0 0 500 300"');
    expect(cleaned).not.toContain('<script');
    expect(cleaned).not.toContain('onload=');
    expect(cleaned).toContain('<circle cx="50" cy="50" r="40"/>');
  });

  it('extracts human-readable accessible text alternative from Mermaid code', () => {
    const textFlow = extractMermaidAccessibleText(sampleFlowchart);
    expect(textFlow).toContain('Flowchart');
    expect(textFlow).toContain('Web Browser');
    expect(textFlow).toContain('API Gateway');
    expect(textFlow).toContain('Compiler Worker');

    const textSeq = extractMermaidAccessibleText(sampleSequence);
    expect(textSeq).toContain('Sequence Diagram');
    expect(textSeq).toContain('User sends "Click "Export"" to App');
    expect(textSeq).toContain('App sends "POST /compile" to API');
  });

  it('auto-repairs unquoted brackets in Mermaid syntax and compiles successfully', async () => {
    const brokenCode = `graph TD
  A[Calculate (Total)] --> B{Is Valid? [Yes/No]}
`;
    // Verify autoFixMermaidCode repairs the brackets
    const fixed = autoFixMermaidCode(brokenCode);
    expect(fixed).toContain('A["Calculate (Total)"]');
    expect(fixed).toContain('B{"Is Valid? [Yes/No]"}');

    // Verify renderMermaid transparently succeeds by invoking autoFix
    const result = await renderMermaid(brokenCode);
    expect(result.success).toBe(true);
  });

  it('defines dedicated /mermaid-to-svg and /mermaid-to-png SEO landing routes', () => {
    const svgSpec = getRouteSpec('/mermaid-to-svg');
    expect(svgSpec).toBeDefined();
    expect(svgSpec?.path).toBe('/mermaid-to-svg');
    expect(svgSpec?.title).toContain('Mermaid to SVG');
    expect(svgSpec?.canonical).toBe('https://mdtodocs.com/mermaid-to-svg');
    expect(svgSpec?.featureBullets.length).toBeGreaterThanOrEqual(3);
    expect(svgSpec?.limitations.length).toBeGreaterThanOrEqual(2);
    expect(svgSpec?.formatMatrix.length).toBeGreaterThanOrEqual(4);
    expect(svgSpec?.faqs.length).toBeGreaterThanOrEqual(2);

    const pngSpec = getRouteSpec('/mermaid-to-png');
    expect(pngSpec).toBeDefined();
    expect(pngSpec?.path).toBe('/mermaid-to-png');
    expect(pngSpec?.title).toContain('Mermaid to PNG');
    expect(pngSpec?.canonical).toBe('https://mdtodocs.com/mermaid-to-png');
    expect(pngSpec?.featureBullets.length).toBeGreaterThanOrEqual(3);
    expect(pngSpec?.limitations.length).toBeGreaterThanOrEqual(2);
    expect(pngSpec?.formatMatrix.length).toBeGreaterThanOrEqual(4);
    expect(pngSpec?.faqs.length).toBeGreaterThanOrEqual(2);
  });
});
