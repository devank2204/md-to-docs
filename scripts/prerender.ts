import { structuredData } from '../apps/web/src/routes/metadata';
import { renderLanding } from '../apps/web/src/landingStatic';
import fs from 'fs/promises';
import path from 'path';

import { LANDING_ROUTES, type RouteLandingSpec, BASE_URL } from '../apps/web/src/routes/landingData';

type RouteSEO = RouteLandingSpec;

const ROUTES: RouteSEO[] = Object.values(LANDING_ROUTES);

const generateSSRHtml = renderLanding;

function generateJsonLd(route: RouteSEO): string {
  const schema = structuredData(route);

  return JSON.stringify(schema, null, 2);
}

function generateSitemapXml(routes: RouteSEO[]): string {
  const urls = routes
    .map(
      r => `  <url>
    <loc>${r.canonical}</loc>
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
    <noscript><p>Enable JavaScript to convert documents. Conversion instructions and related tools are available below.</p></noscript>
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
    .replace(/<script\b[^>]*src=[^>]*><\/script>/g, '')
    .replace('</head>', '<meta name="robots" content="noindex" /></head>')
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
    <meta name="twitter:card" content="summary" />
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

