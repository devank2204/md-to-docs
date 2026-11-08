import { describe, it, expect } from 'vitest';
import {
  LANDING_ROUTES,
  getRouteSpec,
  type LandingRoutePath,
} from '../../../apps/web/src/routes/landingData';
import {
  parseMarkdown,
  planRepresentation,
  DiagnosticsCollector,
  THEMES,
} from '@mdtodocs/compiler-core';
import {
  renderToDocxBlob,
  renderToClipboardHtml,
  renderToHtml,
} from '@mdtodocs/renderers';

describe('Prompt 05: Five Core Conversion Landing Pages', () => {
  const routes: LandingRoutePath[] = [
    '/markdown-to-word',
    '/markdown-to-pdf',
    '/markdown-to-google-docs',
    '/markdown-to-html',
    '/markdown-to-rich-text',
  ];

  it('declares comprehensive, distinct specifications for all 5 core routes and root', () => {
    for (const routePath of routes) {
      const spec = getRouteSpec(routePath);
      expect(spec, `Missing route spec for ${routePath}`).toBeDefined();
      if (!spec) continue;

      expect(spec.path).toBe(routePath);
      expect(spec.title.length).toBeGreaterThan(20);
      expect(spec.description.length).toBeGreaterThan(40);
      expect(spec.h1.length).toBeGreaterThan(10);
      expect(spec.lead.length).toBeGreaterThan(30);
      expect(spec.badge.length).toBeGreaterThan(3);
      expect(spec.sampleMarkdown.length).toBeGreaterThan(50);
    }
  });

  it('preselects the correct destination for each conversion intent', () => {
    expect(getRouteSpec('/markdown-to-word')?.destination).toBe('word');
    expect(getRouteSpec('/markdown-to-pdf')?.destination).toBe('pdf');
    expect(getRouteSpec('/markdown-to-google-docs')?.destination).toBe('google-docs');
    expect(getRouteSpec('/markdown-to-html')?.destination).toBe('clipboard');
    expect(getRouteSpec('/markdown-to-rich-text')?.destination).toBe('clipboard');
  });

  it('uses final URLs and accurate destination handoff descriptions', () => {
    expect(getRouteSpec('/')).toBe(LANDING_ROUTES['/']);
    for (const spec of Object.values(LANDING_ROUTES)) {
      expect(spec.canonical.endsWith('/')).toBe(true);
      expect(getRouteSpec(spec.path + (spec.path === '/' ? '' : '/'))).toBe(spec);
    }
    expect(getRouteSpec('/markdown-to-pdf')?.lead).toContain('browser print');
    expect(getRouteSpec('/markdown-to-google-docs')?.lead).toContain('paste');
    expect(getRouteSpec('/missing')).toBeNull();
  });

  it('successfully compiles and exports all route sample markdowns on ONE shared engine', async () => {
    const theme = THEMES['classic-academic'];
    const signature = { enabled: false, placement: 'last-page' as const };

    for (const routePath of routes) {
      const spec = getRouteSpec(routePath);
      expect(spec).toBeDefined();
      if (!spec) continue;

      // 1. Shared Compiler Core Parser
      const ast = parseMarkdown(spec.sampleMarkdown);
      expect(ast.type).toBe('root');
      expect(ast.children.length).toBeGreaterThan(0);

      // 2. Shared Capability Planner
      const collector = new DiagnosticsCollector();
      const plannedAst = planRepresentation(ast, spec.destination, collector);
      expect(plannedAst).toBeDefined();
      expect(collector.hasErrors()).toBe(false);

      // 3. Shared Export Engine Verification
      if (spec.destination === 'word') {
        const docxBlob = await renderToDocxBlob(plannedAst, theme, signature);
        expect(docxBlob.size).toBeGreaterThan(1000);
      } else if (routePath === '/markdown-to-html') {
        const html = renderToHtml(plannedAst, { theme, title: spec.h1, fullDocument: true });
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain(spec.h1);
      } else {
        const clipboardHtml = renderToClipboardHtml(plannedAst, theme, signature);
        expect(clipboardHtml.length).toBeGreaterThan(50);
      }
    }
  });
});
