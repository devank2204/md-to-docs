import { openDocumentOptions } from './action-helpers';
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
      await expect(page.locator('header .export-menu>summary')).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const trigger = page.locator('header .export-menu>summary');
    await trigger.click();
    const menu = page.locator('header .export-menu .ux-menu-items');
    await expect(menu).toBeVisible();
    const box = (await menu.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Markdown (.md)', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.md$/);
    expect(await readFile((await download.path())!, 'utf8')).toBe(source);
    await expect(trigger).toBeVisible();
    if (width < 1024) {
      await page.getByRole('button', { name: 'Open documents' }).click();
      await page.getByRole('button', { name: '＋ New document', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Choose file', exact: true })).toBeVisible();
    } else {
      await page.getByRole('button', { name: 'Create New Document', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Import Markdown', exact: true })).toBeVisible();
    }
    await page.getByLabel('Import Markdown file', { exact: true }).setInputFiles({ name: 'again.md', mimeType: 'text/markdown', buffer: Buffer.from('# Imported again') });
    await expect(page.getByRole('textbox', { name: 'Markdown text' })).toHaveValue('# Imported again');
    await page.screenshot({ path: `artifacts/mobile/actions-${width}.png` });
  });
}
test('mobile Word export downloads directly', async ({ page }) => {
  await page.goto('/');await page.locator('textarea').first().fill(source);
  await page.locator('header .export-menu>summary').click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button',{name:'Word document (.docx)',exact:true}).click();
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

test('direct HTML export uses the latest source after editing', async ({ page }) => {
  await page.goto('/');await page.locator('textarea').first().fill('# Original');
  for(const heading of ['Original','Latest']) {
    await page.locator('textarea').first().fill('# '+heading);
    await page.locator('header .export-menu>summary').click();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button',{name:'HTML (.html)',exact:true}).click();
    expect(await readFile((await (await downloaded).path())!,'utf8')).toContain(heading);
  }
});

test('mobile Clear all saves a version that can restore the text', async ({ page }) => {
  await page.goto('/');
  await page.locator('textarea').fill(source);
  await openDocumentOptions(page);
  await page.getByRole('button', { name: 'Clear all text', exact: true }).click();
  await expect(page.locator('textarea')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Choose file', exact: true })).toBeVisible();
  await openDocumentOptions(page);
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
