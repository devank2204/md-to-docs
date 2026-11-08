import type { Page } from '@playwright/test';

export async function openExport(page: Page) {
  if (await page.getByRole('dialog', { name: /Export document|Deliver your document/ }).isVisible()) return;
  await page.locator('header').getByRole('button', { name: /^Export/ }).click();
}
export async function fillSource(page: Page, text: string) {
  const delivery = page.getByRole('dialog', { name: /Export document|Deliver your document/ });
  const reopen = await delivery.isVisible();
  if (reopen) await delivery.getByRole('button', { name: /^Close / }).click();
  await page.locator('textarea').first().fill(text);
  if (reopen) await openExport(page);
}
