import type { Page } from '@playwright/test';

export async function openExport(page: Page) {
  if (await page.getByRole('dialog', { name: /Export document|Deliver your document/ }).isVisible()) return;
  await openOutputMenu(page);
  await page.locator('header .ux-menu-items').getByRole('button',{name:'Advanced export options',exact:true}).click();
}
export async function fillSource(page: Page, text: string) {
  const delivery = page.getByRole('dialog', { name: /Export document|Deliver your document/ });
  const reopen = await delivery.isVisible();
  if (reopen) await delivery.getByRole('button', { name: /^Close / }).click();
  await page.locator('textarea').first().fill(text);
  if (reopen) await openExport(page);
}
export async function openOutputMenu(page:Page){const menu=page.locator('header .export-menu');if(!await menu.evaluate(el=>el.hasAttribute('open')))await menu.locator('summary').click();}
export async function openDocumentOptions(page:Page){const button=page.getByRole('button',{name:'Document options',exact:true});if(!await button.isVisible())await page.locator('header .workspace-menu>summary').click();await button.click();}
export async function switchAppearance(page:Page,label:'Cream'|'Dark green'|'Black') {
  const chooser=page.getByRole('button',{name:/^Appearance:/});
  if(!await chooser.isVisible()) await page.locator('header .workspace-menu>summary').click();
  await chooser.click();
  await page.getByRole('button',{name:label,exact:true}).click();
}
export async function copyForDocs(page:Page){await openOutputMenu(page);await page.getByRole('button',{name:'Copy for Google Docs',exact:true}).click();}
