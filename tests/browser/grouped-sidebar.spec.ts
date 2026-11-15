import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openWorkspace(page: Page, count = 2) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.addInitScript((count) => {
    const documents = Array.from({ length: count }, (_, i) => ({ id: `sidebar-${i}`, title: i ? `API contract ${i}` : 'Project notes', content: i ? `# API ${i}\n\nOther document.` : '# Project notes\n\nKeep this draft.', createdAt: 1, updatedAt: 1 }));
    localStorage.setItem('md-to-docs-storage', JSON.stringify({ state: { documents, activeDocumentId: documents[0].id, markdown: documents[0].content, currentView: 'workspace', isSidebarOpen: true }, version: 0 }));
  }, count);
  await page.goto('/');
  await expect(page.getByRole('complementary', { name: 'Documents and tools' })).toBeVisible();
}

test('reference sidebar preserves document identity, rename cancellation and switching', async ({ page }) => {
  await openWorkspace(page);
  const sidebar = page.getByRole('complementary', { name: 'Documents and tools' });
  await expect(sidebar).toHaveCSS('width', '248px');
  await expect(sidebar).toHaveCSS('font-size', '13px');
  await expect(sidebar).toHaveCSS('background-color', 'rgb(250, 249, 246)');
  const supporting = await sidebar.getByRole('navigation', { name: 'Supporting links' }).boundingBox();
  expect(supporting!.y + supporting!.height).toBeLessThanOrEqual(932);
  await sidebar.locator('summary[aria-label="More actions for Project notes"]').click();
  await sidebar.getByRole('button', { name: 'Rename', exact: true }).click();
  await sidebar.getByRole('textbox', { name: 'Document name' }).fill('Cancelled title');
  await sidebar.getByRole('textbox', { name: 'Document name' }).press('Escape');
  await expect(sidebar.getByRole('button', { name: 'Project notes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await sidebar.locator('summary[aria-label="More actions for Project notes"]').click();
  await sidebar.getByRole('button', { name: 'Rename', exact: true }).click();
  await sidebar.getByRole('textbox', { name: 'Document name' }).fill('Renamed notes');
  await sidebar.getByRole('textbox', { name: 'Document name' }).press('Enter');
  await sidebar.getByRole('button', { name: 'API contract 1', exact: true }).click();
  await expect(page.locator('textarea').first()).toHaveValue('# API 1\n\nOther document.');
  await sidebar.getByRole('button', { name: 'Renamed notes', exact: true }).click();
  await expect(page.locator('textarea').first()).toHaveValue('# Project notes\n\nKeep this draft.');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('md-to-docs-storage')!).state);
  expect(saved.activeDocumentId).toBe('sidebar-0');
  expect(saved.documents).toHaveLength(2);
});

test('tool navigation retains the draft and uses existing crawlable destinations', async ({ page }) => {
  await openWorkspace(page);
  const sidebar = page.getByRole('complementary', { name: 'Documents and tools' });
  await expect(sidebar.getByRole('navigation', { name: 'Document tools' }).getByRole('link')).toHaveCount(3);
  await expect(sidebar.getByRole('navigation', { name: 'Diagram tools' }).getByRole('link')).toHaveCount(2);
  await expect(sidebar.getByRole('link', { name: 'Mermaid editor', exact: true })).toHaveAttribute('href', '/mermaid-to-svg/');
  await expect(sidebar.getByRole('link', { name: 'Mermaid to SVG / PNG', exact: true })).toHaveAttribute('href', '/mermaid-to-png/');
  await sidebar.getByRole('link', { name: 'Markdown to Word', exact: true }).click();
  await expect(page).toHaveURL(/\/markdown-to-word\/$/);
  await expect(page.locator('textarea').first()).toHaveValue('# Project notes\n\nKeep this draft.');
  await sidebar.getByRole('link', { name: 'Markdown editor', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-editor-pane] textarea')).toBeFocused();
  await sidebar.locator('summary[aria-label="More actions for Project notes"]').click();
  await sidebar.getByRole('button', { name: 'Version history', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Version history', exact: true })).toBeVisible();
});

test('sidebar duplicate at capacity leaves all five documents intact on cancellation', async ({ page }) => {
  await openWorkspace(page, 5);
  const sidebar = page.getByRole('complementary', { name: 'Documents and tools' });
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('md-to-docs-storage')!).state.documents);
  await sidebar.locator('summary[aria-label="More actions for Project notes"]').click();
  await sidebar.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel import', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('md-to-docs-storage')!).state.documents)).toEqual(before);
});
