import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('Prompt 04: Technical SEO Foundation & Netlify Prerendering', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const webDistDir = path.resolve(rootDir, 'apps/web/dist');
  const webPublicDir = path.resolve(rootDir, 'apps/web/public');

  it('netlify.toml exists in repository root with required build and redirect rules', async () => {
    const netlifyPath = path.join(rootDir, 'netlify.toml');
    const netlifyContent = await fs.readFile(netlifyPath, 'utf8');

    expect(netlifyContent).toContain('publish = "apps/web/dist"');
    expect(netlifyContent).toContain('command = "pnpm --filter web build && pnpm prerender"');
    expect(netlifyContent).toContain('status = 404');
    expect(netlifyContent).toContain('X-Frame-Options');
    expect(netlifyContent).toContain('X-Content-Type-Options');
    expect(netlifyContent).toContain('Cache-Control');
  });

  it('public/sitemap.xml and public/robots.txt exist and declare canonical URLs', async () => {
    const sitemapPath = path.join(webPublicDir, 'sitemap.xml');
    const sitemap = await fs.readFile(sitemapPath, 'utf8');

    expect(sitemap).toContain('https://mdtodocs.com/');
    expect(sitemap).toContain('https://mdtodocs.com/markdown-to-word');
    expect(sitemap).toContain('https://mdtodocs.com/markdown-to-pdf');
    expect(sitemap).toContain('https://mdtodocs.com/markdown-to-google-docs');
    expect(sitemap).toContain('https://mdtodocs.com/markdown-to-html');
    expect(sitemap).toContain('https://mdtodocs.com/markdown-to-rich-text');

    const robotsPath = path.join(webPublicDir, 'robots.txt');
    const robots = await fs.readFile(robotsPath, 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://mdtodocs.com/sitemap.xml');
  });

  it('prerendered HTML files exist with unique meta, canonical, JSON-LD and SSR content', async () => {
    const targetRoutes = [
      { dir: '', canonical: 'https://mdtodocs.com/', expectedH1: 'Markdown to Docs' },
      { dir: 'markdown-to-word', canonical: 'https://mdtodocs.com/markdown-to-word/', expectedH1: 'Convert Markdown to Microsoft Word (.docx)' },
      { dir: 'markdown-to-pdf', canonical: 'https://mdtodocs.com/markdown-to-pdf/', expectedH1: 'Convert Markdown to PDF' },
      { dir: 'markdown-to-google-docs', canonical: 'https://mdtodocs.com/markdown-to-google-docs/', expectedH1: 'Paste Markdown into Google Docs' },
      { dir: 'markdown-to-html', canonical: 'https://mdtodocs.com/markdown-to-html/', expectedH1: 'Convert Markdown to Standalone HTML' },
      { dir: 'markdown-to-rich-text', canonical: 'https://mdtodocs.com/markdown-to-rich-text/', expectedH1: 'Convert Markdown to Rich Text' },
    ];

    const seenTitles = new Set<string>();
    const seenDescriptions = new Set<string>();

    for (const route of targetRoutes) {
      const filePath = route.dir === ''
        ? path.join(webDistDir, 'index.html')
        : path.join(webDistDir, route.dir, 'index.html');

      const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const html = await fs.readFile(filePath, 'utf8');

      // 1. Verify unique title
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      expect(titleMatch).toBeTruthy();
      const title = titleMatch![1];
      expect(title.length).toBeGreaterThan(15);
      expect(seenTitles.has(title)).toBe(false);
      seenTitles.add(title);

      // 2. Verify unique meta description
      const descMatch = html.match(/<meta name="description" content="(.*?)" \/>/);
      expect(descMatch).toBeTruthy();
      const desc = descMatch![1];
      expect(desc.length).toBeGreaterThan(30);
      expect(seenDescriptions.has(desc)).toBe(false);
      seenDescriptions.add(desc);

      // 3. Verify canonical link
      expect(html).toContain(`<link rel="canonical" href="${route.canonical}" />`);

      // 4. Verify Open Graph & Twitter Card tags
      expect(html).toContain('property="og:title"');
      expect(html).toContain('property="og:description"');
      expect(html).toContain(`property="og:url" content="${route.canonical}"`);
      expect(html).toContain('name="twitter:card"');

      // 5. Verify JSON-LD Schema.org Structured Data
      expect(html).toContain('<script type="application/ld+json">');
      expect(html).toContain('"@type": "WebApplication"');
      expect(html).toContain(route.canonical);

      // 6. Verify SSR markup inside <div id="root"> (Crawlable with JS disabled)
      expect(html).toContain(`<h1`);
      expect(html).toContain(route.expectedH1);
      expect(html).toContain('How to convert');
      expect(html).toContain('Is my document private?');
    }
  });

  it('404.html exists in dist with helpful navigation link', async () => {
    const notFoundPath = path.join(webDistDir, '404.html');
    const notFoundExists = await fs.stat(notFoundPath).then(() => true).catch(() => false);
    expect(notFoundExists).toBe(true);

    const html = await fs.readFile(notFoundPath, 'utf8');
    expect(html).toContain('Page Not Found (404)');
    expect(html).toContain('Return to mdtodocs App');
  });
});

describe('all authoritative routes in production output', () => {
 it('emits one metadata set, primary heading and valid internal links for every route', async () => {
  const { LANDING_ROUTES } = await import('../../../apps/web/src/routes/landingData');
  const { load } = await import('cheerio');
  const dist = path.resolve(__dirname, '../../../apps/web/dist');
  const sitemap = await fs.readFile(path.join(dist, 'sitemap.xml'), 'utf8');
  for (const spec of Object.values(LANDING_ROUTES)) {
   const html = await fs.readFile(path.join(dist, spec.path, 'index.html'), 'utf8');
   const $ = load(html);
   expect($('h1').length).toBe(1);
   expect($('h1').text()).toBe(spec.h1);
   expect($('title').length).toBe(1);
   expect($('title').text()).toBe(spec.title);
   expect($('meta[name="description"]').attr('content')).toBe(spec.description);
   expect($('link[rel="canonical"]').length).toBe(1);
   expect($('link[rel="canonical"]').attr('href')).toBe(spec.canonical);
   expect(JSON.parse($('script[type="application/ld+json"]').text()).url).toBe(spec.canonical);
   expect(sitemap).toContain(`<loc>${spec.canonical}</loc>`);
   expect($('meta[name="robots"]').attr('content')).not.toBe('noindex');
   for (const a of $('nav a').toArray()) {
    const href = $(a).attr('href')!;
    expect(href.endsWith('/')).toBe(true);
    expect(await fs.stat(path.join(dist, href, 'index.html')).then(()=>true)).toBe(true);
   }
  }
 });
});
