import {openExport} from './action-helpers';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const source = '# Product Launch Plan\n\nA short introduction.\n\n## Milestones\n\n| Task | Owner |\n|---|---|\n| Launch | Team |\n';
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`compact actions, Markdown roundtrip and import at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.locator('textarea').first().fill(source);
    if (width < 1024) {
      await page.getByRole('tab', { name: 'Preview', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Product Launch Plan', exact: true })).toBeVisible();
      await expect(page.locator('.mobile-workspace > .mobile-export')).toHaveCount(0);
      await expect(page.getByRole('button',{name:'Copy for Google Docs',exact:true})).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const trigger = page.locator('header').getByText('Download',{exact:true});
    await openExport(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Markdown (.md)', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.md$/);
    expect(await readFile((await download.path())!, 'utf8')).toBe(source);
    await page.getByRole('button', { name: /^Close / }).click();
    await expect(trigger).toBeVisible();
    if (width < 1024) {
      await page.getByRole('button', { name: 'Open documents' }).click();
      await page.getByRole('button', { name: '＋ New document', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Choose file', exact: true })).toBeVisible();
    } else {
      await page.getByTitle('New Document (Alt+N)', { exact: true }).click();
      await expect(page.getByRole('button', { name: 'Import Markdown', exact: true })).toBeVisible();
    }
    await page.getByLabel('Import Markdown file', { exact: true }).setInputFiles({ name: 'again.md', mimeType: 'text/markdown', buffer: Buffer.from('# Imported again') });
    await expect(page.getByRole('textbox', { name: 'Markdown text' })).toHaveValue('# Imported again');
    await page.screenshot({ path: `artifacts/mobile/actions-${width}.png` });
  });
}
test('mobile destination sheet returns to export and prepares a Word file', async ({ page }) => {
  await page.goto('/');
  await page.locator('textarea').first().fill(source);
  await openExport(page);
  await page.getByRole('button', { name: /^Save as / }).click();
  await page.getByRole('button', { name: /Word document/ }).click();
  await expect(page.getByRole('dialog', { name: 'Export document' })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare Word document', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download .docx', exact: true })).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .docx', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toMatch(/\.docx$/);
});

test('mobile diagram uses a content-sized viewport and an options sheet', async ({ page }) => {
  await page.goto('/');
  await page.locator('textarea').fill('# Diagram\n\n```mermaid\ngraph LR; A-->B;\n```');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.mermaid-preview svg')).toBeVisible();
  await expect(page.locator('[data-diagram-viewport]')).toHaveCSS('min-height', '0px');
  await page.getByRole('button', { name: 'More diagram options', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Diagram options' })).toBeVisible();
  await page.getByRole('button', { name: 'Close Diagram options', exact: true }).click();
  await expect(page.getByRole('button', { name: 'More diagram options', exact: true })).toBeFocused();
});

test('prepared HTML stays available on close, then invalidates when source changes', async ({ page }) => {
  await page.goto('/');
  await page.locator('textarea').fill('# Original');
  await openExport(page);
  await page.getByRole('button', { name: /^Save as / }).click();
  await page.getByRole('button', { name: /HTML/ }).click();
  await page.getByRole('button', { name: 'Prepare HTML file', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download .html', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close Export document', exact: true }).click();
  await openExport(page);
  await expect(page.getByRole('button', { name: 'Download .html', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close Export document', exact: true }).click();
  await page.locator('textarea').fill('# Latest');
  await openExport(page);
  await expect(page.getByRole('button', { name: 'Prepare HTML file', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare HTML file', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .html', exact: true }).click();
  expect(await readFile((await (await downloaded).path())!, 'utf8')).toContain('Latest');
});

test('mobile Clear all saves a version that can restore the text', async ({ page }) => {
  await page.goto('/');
  await page.locator('textarea').fill(source);
  await page.getByRole('button', { name: 'Document options' }).click();
  await page.getByRole('button', { name: 'Clear all text', exact: true }).click();
  await expect(page.locator('textarea')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Choose file', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Document options' }).click();
  await page.getByRole('button', { name: 'Version history', exact: true }).click();
  await page.getByRole('button', { name: /Before clearing text/ }).click();
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Restore this version',exact:true}).click();
  await page.getByRole('button',{name:'Close Version history',exact:true}).click();
  await expect(page.locator('textarea')).toHaveValue(source);
});


test('narrow desktop toolbar keeps Import and Clear all inside the editor pane', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 844 });
  await page.goto('/');
  await page.locator('textarea').first().fill(source);
  const pane = (await page.locator('[data-editor-pane]').boundingBox())!;
  for (const name of ['Import Markdown', 'Clear all', 'Review & outline']) {
    const button = page.getByRole('button', { name, exact: true });
    await expect(button).toBeVisible();
    const bounds = (await button.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(pane.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(pane.x + pane.width);
  }
});
