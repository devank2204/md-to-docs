import fs from 'fs/promises';
import path from 'path';

import { LANDING_ROUTES, RouteLandingSpec, BASE_URL } from '../apps/web/src/routes/landingData';

type RouteSEO = RouteLandingSpec;

const ROUTES: RouteSEO[] = Object.values(LANDING_ROUTES);

function generateSSRHtml(route: RouteSEO): string {
  const isHome = route.path === '/';

  const bulletsHtml = route.featureBullets
    .map(b => `<li style="margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;"><span style="color:#10b981;font-weight:bold;">✓</span> <span>${b}</span></li>`)
    .join('');

  const faqsHtml = route.faqs
    .map(
      f => `
      <details style="margin-bottom:12px;padding:12px 16px;background:#f4f4f5;border-radius:8px;border:1px solid #e4e4e7;">
        <summary style="font-weight:600;cursor:pointer;color:#18181b;font-size:14px;">${f.q}</summary>
        <p style="margin-top:8px;font-size:13px;color:#52525b;line-height:1.6;">${f.a}</p>
      </details>
    `
    )
    .join('');

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;background:#fafafa;min-height:100vh;">
      <header style="height:56px;border-bottom:1px solid #e4e4e7;background:#ffffff;display:flex;align-items:center;justify-content:space-between;padding:0 24px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <a href="/" style="text-decoration:none;display:flex;align-items:center;gap:8px;color:#18181b;">
            <img src="/mark.png" alt="mdtodocs logo" style="width:28px;height:28px;border-radius:6px;" />
            <strong style="font-size:16px;letter-spacing:-0.5px;">mdtodocs</strong>
          </a>
        </div>
        <nav style="display:flex;align-items:center;gap:16px;font-size:13px;">
          <a href="/markdown-to-word" style="color:#52525b;text-decoration:none;">Word (.docx)</a>
          <a href="/markdown-to-pdf" style="color:#52525b;text-decoration:none;">PDF</a>
          <a href="/markdown-to-google-docs" style="color:#52525b;text-decoration:none;">Google Docs</a>
          <a href="/markdown-to-html" style="color:#52525b;text-decoration:none;">HTML</a>
          <a href="/mermaid-to-svg" style="color:#52525b;text-decoration:none;">Mermaid to SVG</a>
          <a href="/mermaid-to-png" style="color:#52525b;text-decoration:none;">Mermaid to PNG</a>
          <a href="/" style="padding:6px 14px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;">Open App</a>
        </nav>
      </header>

      <main style="max-width:960px;margin:0 auto;padding:48px 20px;">
        <article>
          <div style="display:inline-block;padding:4px 10px;background:#e4e4e7;border-radius:999px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#3f3f46;margin-bottom:16px;">
            ${route.badge}
          </div>
          <h1 style="font-size:36px;line-height:1.2;letter-spacing:-1px;margin:0 0 16px 0;color:#09090b;font-weight:700;">
            ${route.h1}
          </h1>
          <p style="font-size:18px;line-height:1.6;color:#52525b;margin:0 0 32px 0;max-width:720px;">
            ${route.lead}
          </p>

          <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <h2 style="font-size:18px;font-weight:600;margin:0 0 16px 0;">Fidelity &amp; Layout Guarantees</h2>
            <ul style="list-style:none;padding:0;margin:0;">
              ${bulletsHtml}
            </ul>
          </div>

          <div style="background:#18181b;color:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:32px;font-family:monospace;font-size:13px;overflow-x:auto;">
            <div style="color:#a1a1aa;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Sample Input Preview</div>
            <pre style="margin:0;white-space:pre-wrap;">${route.sampleMarkdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>

          <div style="margin-top:40px;">
            <h2 style="font-size:22px;font-weight:600;margin:0 0 16px 0;">Frequently Asked Questions</h2>
            ${faqsHtml}
          </div>
        </article>
      </main>

      <footer style="border-top:1px solid #e4e4e7;background:#ffffff;padding:24px;text-align:center;font-size:12px;color:#71717a;margin-top:48px;">
        <p style="margin:0 0 8px 0;">mdtodocs &copy; 2026 &middot; The dependable output layer for technical documentation.</p>
        <p style="margin:0;">Zero server uploads &middot; 100% private in-browser conversion &middot; <a href="/sitemap.xml" style="color:#71717a;">Sitemap</a></p>
      </footer>
    </div>
  `;
}

function generateJsonLd(route: RouteSEO): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `mdtodocs - ${route.h1}`,
    url: route.canonical,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'All',
    description: route.description,
    browserRequirements: 'Requires JavaScript and HTML5 canvas/SVG support',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: route.featureBullets,
  };

  return JSON.stringify(schema, null, 2);
}

function generateSitemapXml(routes: RouteSEO[]): string {
  const urls = routes
    .map(
      r => `  <url>
    <loc>${r.canonical}</loc>
    <changefreq>${r.path === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${r.path === '/' ? '1.0' : '0.9'}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
}

function cleanBaseTemplate(rawHtml: string): string {
  const scriptTags = rawHtml.match(/<script\b[^>]*src="\/assets\/[^>]*><\/script>/g) || [];
  const cssTags = rawHtml.match(/<link\b[^>]*href="\/assets\/[^>]*>/g) || [];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/mark.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>mdtodocs: Markdown to Documents</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet" />
    ${scriptTags.join('\n    ')}
    ${cssTags.join('\n    ')}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

function generate404Html(templateHtml: string): string {
  const content = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafafa;padding:20px;text-align:center;">
      <div style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:36px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <img src="/mark.png" alt="mdtodocs" style="width:48px;height:48px;margin-bottom:16px;" />
        <h1 style="font-size:24px;font-weight:700;margin:0 0 8px 0;color:#18181b;">Page Not Found (404)</h1>
        <p style="font-size:14px;color:#52525b;line-height:1.5;margin:0 0 24px 0;">The requested document conversion page does not exist or has been relocated.</p>
        <a href="/" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Return to mdtodocs App</a>
      </div>
    </div>
  `;

  return templateHtml
    .replace(/<title>.*?<\/title>/, '<title>Page Not Found (404) | mdtodocs</title>')
    .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${content}</div>`);
}

export async function runPrerender() {
  const distDir = path.resolve(process.cwd(), 'apps/web/dist');
  const publicDir = path.resolve(process.cwd(), 'apps/web/public');
  const templatePath = path.join(distDir, 'index.html');

  console.log('Running mdtodocs Technical SEO Prerendering...');
  console.log(`Dist directory: ${distDir}`);

  let templateHtml: string;
  try {
    const raw = await fs.readFile(templatePath, 'utf8');
    templateHtml = cleanBaseTemplate(raw);
  } catch (err: any) {
    console.error(`Could not read dist/index.html. Run "pnpm --filter web build" first!`, err);
    process.exit(1);
  }

  // 1. Generate Sitemap & Robots in public and dist
  const sitemapXml = generateSitemapXml(ROUTES);
  const robotsTxt = generateRobotsTxt();

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml);
  await fs.writeFile(path.join(distDir, 'robots.txt'), robotsTxt);
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml);
  await fs.writeFile(path.join(publicDir, 'robots.txt'), robotsTxt);
  console.log('Generated sitemap.xml and robots.txt in public/ and dist/');

  // 2. Generate 404.html in dist
  const notFoundHtml = generate404Html(templateHtml);
  await fs.writeFile(path.join(distDir, '404.html'), notFoundHtml);
  console.log('Generated 404.html');

  // 3. Prerender all route HTML files
  for (const route of ROUTES) {
    const isRoot = route.path === '/';
    const routeDir = isRoot ? distDir : path.join(distDir, route.path.replace(/^\//, ''));
    await fs.mkdir(routeDir, { recursive: true });

    const ssrHtml = generateSSRHtml(route);
    const jsonLd = generateJsonLd(route);

    let html = templateHtml;

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);

    // Replace or insert meta description
    if (html.includes('<meta name="description"')) {
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${route.description}" />`
      );
    } else {
      html = html.replace(
        '</head>',
        `  <meta name="description" content="${route.description}" />\n  </head>`
      );
    }

    // Insert Canonical, Open Graph, Twitter Cards, and Schema.org JSON-LD
    const metaTags = `
    <link rel="canonical" href="${route.canonical}" />
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="mdtodocs" />
    <meta property="og:url" content="${route.canonical}" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:image" content="${BASE_URL}/mark.png" />
    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="${BASE_URL}/mark.png" />
    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
${jsonLd}
    </script>
`;

    html = html.replace('</head>', `${metaTags}\n  </head>`);

    // Inject SSR HTML inside <div id="root">
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${ssrHtml}</div>`);

    const outputFilePath = path.join(routeDir, 'index.html');
    await fs.writeFile(outputFilePath, html, 'utf8');
    console.log(`Prerendered: ${route.path} -> ${outputFilePath}`);
  }

  console.log(`Technical SEO Prerendering complete! Processed ${ROUTES.length} routes.`);
}

// Execute prerender script
runPrerender().catch((err) => {
  console.error('Prerender failure:', err);
  process.exit(1);
});

