import { test, expect } from '@playwright/test';
import { LANDING_ROUTES } from '../../apps/web/src/routes/landingData';
for (const spec of Object.values(LANDING_ROUTES)) {
 test(`landing intent survives initialization: ${spec.path}`, async ({ page, request }) => {
  const url = spec.path === '/' ? '/' : `${spec.path}/`;
  const response = await request.get(url);
  const html = await response.text();
  expect(html).toContain(spec.h1);
  expect(html).toContain(spec.canonical);
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  await page.goto(url);
  await expect(page.locator('h1')).toHaveText(spec.h1);
  await expect(page).toHaveTitle(spec.title);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', spec.canonical);
  await expect(page.getByRole('navigation', { name: 'Related conversion tools' })).toBeVisible();
  await page.reload();
  await expect(page.locator('h1')).toHaveText(spec.h1);
 });
}
test('document heading, navigation and refresh preserve route metadata and source', async ({ page }) => {
 await page.setViewportSize({ width: 1440, height: 900 });
 await page.goto('/markdown-to-word/');
 await page.getByRole('textbox', {name:'Markdown terminal input'}).fill('# Quarterly Engineering Review\n\nA report.');
 await expect(page).toHaveTitle(LANDING_ROUTES['/markdown-to-word'].title);
 await page.getByRole('navigation', {name:'Related conversion tools'}).getByRole('link', {name:'Paste Markdown into Google Docs', exact:true}).click();
 await expect(page).toHaveTitle(LANDING_ROUTES['/markdown-to-google-docs'].title);
 await page.goBack();
 await expect(page).toHaveTitle(LANDING_ROUTES['/markdown-to-word'].title);
 await page.goForward();
 await page.reload();
 await expect(page).toHaveTitle(LANDING_ROUTES['/markdown-to-google-docs'].title);
 await expect(page.locator('textarea').first()).toHaveValue(/Quarterly Engineering Review/);
});
for (const width of [375,768,1440]) test(`landing widths ${width}`, async ({page}) => {
 await page.setViewportSize({width,height:900});
 for (const route of ['/', '/markdown-to-word/', '/markdown-to-google-docs/', '/markdown-to-pdf/', '/mermaid-to-svg/']) {
 await page.goto(route);
 await expect(page.locator('h1')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({path:`/tmp/after-${width}-${route.replaceAll('/','')||'home'}.png`});
 }
});

test('all landing descriptions and links remain readable without JavaScript', async ({ browser }) => {
 const context = await browser.newContext({ javaScriptEnabled: false });
 const page = await context.newPage();
 for (const spec of Object.values(LANDING_ROUTES)) {
  await page.goto(spec.path === '/' ? '/' : spec.path + '/');
  await expect(page.locator('h1')).toHaveText(spec.h1);
  await expect(page.getByRole('heading', {name:'How to convert'})).toBeVisible();
  await expect(page.getByRole('navigation', {name:'Related conversion tools'}).getByRole('link')).toHaveCount(7);
 }
 await context.close();
});
