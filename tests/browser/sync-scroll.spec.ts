import { test, expect, type Page } from '@playwright/test';

const source = Array.from({ length: 35 }, (_, index) => `## Section ${index + 1}\n\nShort paragraph ${index + 1}.\n\n${index === 8 ? '```mermaid\ngraph TD\nA[Draft] --> B[Review]\nB --> C[Publish]\n```\n\n' : ''}${index === 15 ? '| Task | Owner |\n|---|---|\n' + Array.from({ length: 15 }, (_, row) => `| Task ${row} | Team |`).join('\n') + '\n\n' : ''}`).join('');
async function enter(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('textarea').first().fill(source);
  await expect(page.getByRole('button', { name: /^Sync scroll:/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
}
async function sourceTop(page: Page, section: number, markdown = source) {
  return page.locator('textarea').evaluate((editor: HTMLTextAreaElement, { source, section }) => {
    const line = source.slice(0, source.indexOf(`## Section ${section}\n`)).split('\n').length - 1;
    const style = getComputedStyle(editor);
    const target = line * parseFloat(style.lineHeight) + parseFloat(style.paddingTop);
    editor.scrollTop = target;
    return target;
  }, { source: markdown, section });
}
async function anchorDistance(page: Page, section: number, markdown = source) {
  return page.locator('[data-preview-scroll]').evaluate((pane, offset) => {
    const anchor = pane.querySelector(`[data-source-offset="${offset}"]`)!;
    return anchor.getBoundingClientRect().top - pane.getBoundingClientRect().top;
  }, markdown.indexOf(`## Section ${section}\n`));
}

test('source scroll aligns matching sections through diagrams and tables; reverse scroll follows', async ({ page }) => {
  await enter(page);
  for (const section of [7, 14, 23]) {
    await sourceTop(page, section);
    await expect.poll(async () => Math.abs(await anchorDistance(page, section))).toBeLessThan(4);
  }
  await page.locator('[data-preview-scroll]').evaluate((pane, offset) => {
    const anchor = pane.querySelector(`[data-source-offset="${offset}"]`)!;
    pane.scrollTop += anchor.getBoundingClientRect().top - pane.getBoundingClientRect().top;
  }, source.indexOf('## Section 12\n'));
  await expect.poll(() => page.locator('textarea').evaluate((editor: HTMLTextAreaElement, source) => {
    const line = source.slice(0, source.indexOf('## Section 12\n')).split('\n').length - 1;
    const style = getComputedStyle(editor);
    return Math.abs(editor.scrollTop - (line * parseFloat(style.lineHeight) + parseFloat(style.paddingTop)));
  }, source)).toBeLessThan(4);
  // Once aligned, the panes must settle rather than bounce scroll events forever.
  const before = await page.locator('textarea').evaluate(node => node.scrollTop);
  await page.waitForTimeout(200);
  expect(await page.locator('textarea').evaluate(node => node.scrollTop)).toBeCloseTo(before, 0);
});

test('top/bottom align and disabling sync permits independent scrolling', async ({ page }) => {
  await enter(page);
  await page.locator('textarea').evaluate(node => { node.scrollTop = node.scrollHeight; });
  await expect.poll(() => page.locator('[data-preview-scroll]').evaluate(node => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(2);
  await page.locator('[data-preview-scroll]').evaluate(node => { node.scrollTop = 0; });
  await expect.poll(() => page.locator('textarea').evaluate(node => node.scrollTop)).toBeLessThan(2);
  await page.getByRole('button', { name: /^Sync scroll:/ }).click();
  await sourceTop(page, 14);
  await page.waitForTimeout(100);
  expect(await page.locator('[data-preview-scroll]').evaluate(node => node.scrollTop)).toBe(0);
  await page.getByRole('button', { name: /^Sync scroll:/ }).click();
  await expect.poll(async () => Math.abs(await anchorDistance(page, 14))).toBeLessThan(4);
});

test('geometry updates after zoom and sidebar resizing; mobile and reading view stay independent', async ({ page }) => {
  await enter(page);
  await sourceTop(page, 14);
  await page.getByTitle('Zoom in', { exact: true }).click();
  await expect.poll(async () => Math.abs(await anchorDistance(page, 14))).toBeLessThan(4);
  await page.getByTitle('Collapse sidebar (Ctrl+B)', { exact: true }).first().click();
  await expect.poll(async () => Math.abs(await anchorDistance(page, 14))).toBeLessThan(4);
  await page.getByTitle('Switch to clean reading view', { exact: true }).click();
  await expect(page.getByRole('button', { name: /^Sync scroll:/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Back to Editor/ }).click();
  await expect(page.getByRole('button', { name: /^Sync scroll:/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: /^Sync scroll:/ })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Preview', exact: true })).toBeVisible();
});


test('late image layout and collapsed sections refresh the mapping without changing text', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/scroll-tall.svg', async route => {
    await held;
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="1200"><rect width="200" height="1200" fill="gray"/></svg>' });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const markdown = source.replace('Short paragraph 10.', '![Tall image](/scroll-tall.svg)');
  await page.locator('textarea').first().fill(markdown);
  await sourceTop(page, 20, markdown);
  await expect.poll(async () => Math.abs(await anchorDistance(page, 20, markdown))).toBeLessThan(4);
  release();
  await expect.poll(() => page.locator('img[alt="Tall image"]').evaluate((image: HTMLImageElement) => image.naturalHeight)).toBe(1200);
  await expect.poll(async () => Math.abs(await anchorDistance(page, 20, markdown))).toBeLessThan(4);
  await page.getByRole('heading', { name: 'Section 20', exact: true }).click();
  await sourceTop(page, 23, markdown);
  await expect.poll(async () => Math.abs(await anchorDistance(page, 23, markdown))).toBeLessThan(4);
  await expect(page.locator('textarea')).toHaveValue(markdown);
});

test('wrapped Unicode source stays aligned and changing documents clears the old mapping', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/');
  const markdown = '## Intro\n\n' + 'A wrapped paragraph with café 中文 and emoji 🌿. '.repeat(100) + '\n\n' + source;
  await page.locator('textarea').first().fill(markdown);
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  await page.locator('[data-preview-scroll]').evaluate((pane, offset) => {
    const anchor = pane.querySelector(`[data-source-offset="${offset}"]`)!;
    pane.scrollTop += anchor.getBoundingClientRect().top - pane.getBoundingClientRect().top;
  }, markdown.indexOf('## Section 14\n'));
  await expect.poll(() => page.locator('textarea').evaluate(node => node.scrollTop)).toBeGreaterThan(1000);
  const aligned = await page.locator('textarea').evaluate(node => node.scrollTop);
  // Native caret movement is an independent check that the mapped source is visible
  // despite soft wraps, Unicode and very different source/preview paragraph heights.
  await page.locator('textarea').evaluate((node: HTMLTextAreaElement, offset) => {
    node.setSelectionRange(offset, offset);
    node.focus({ preventScroll: true });
  }, markdown.indexOf('## Section 14\n'));
  await page.locator('textarea').press('ArrowRight');
  expect(Math.abs(await page.locator('textarea').evaluate(node => node.scrollTop) - aligned)).toBeLessThan(2);
  await page.getByTitle('New Document (Alt+N)', { exact: true }).click();
  await page.locator('textarea').fill(source);
  await sourceTop(page, 14);
  await expect.poll(async () => Math.abs(await anchorDistance(page, 14))).toBeLessThan(4);
});


test('imported CRLF Markdown aligns using original source offsets', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('textarea').first().fill('# Open workspace');
  const markdown = source.replaceAll('\n', '\r\n');
  await page.getByLabel('Import Markdown file', { exact: true }).setInputFiles({ name: 'windows.md', mimeType: 'text/markdown', buffer: Buffer.from(markdown) });
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  const target = await page.locator('textarea').evaluate((editor: HTMLTextAreaElement) => {
    const line = editor.value.slice(0, editor.value.indexOf('## Section 23\n')).split('\n').length - 1;
    const style = getComputedStyle(editor);
    editor.scrollTop = line * parseFloat(style.lineHeight) + parseFloat(style.paddingTop);
    return editor.scrollTop;
  });
  expect(target).toBeGreaterThan(0);
  await expect.poll(() => page.locator('[data-preview-scroll]').evaluate((pane, offset) => {
    const anchor = pane.querySelector(`[data-source-offset="${offset}"]`)!;
    return Math.abs(anchor.getBoundingClientRect().top - pane.getBoundingClientRect().top);
  }, markdown.indexOf('## Section 23\r\n'))).toBeLessThan(4);
});
