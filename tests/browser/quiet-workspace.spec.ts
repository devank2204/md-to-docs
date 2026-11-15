import {test,expect} from '@playwright/test';
for(const width of [375,1024,1440]) test(`quiet controls and direct actions ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');await page.locator('textarea').first().fill('# A long document title that should use the available navigation space\n\n```mermaid\nflowchart TD\n A-->B\n```');
 const history=page.getByRole('button',{name:'Version history',exact:true}).filter({visible:true}).first();await expect(history).toBeVisible();await history.click();await expect(page.getByRole('dialog',{name:'Version history',exact:true})).toBeVisible();await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Review diagram fixes',exact:true}).first()).toBeVisible();
 const title=page.getByRole('textbox',{name:'Document name',exact:true}).first();await expect(title).toHaveCSS('border-top-width','0px');if(width===1440)expect((await title.boundingBox())!.width).toBeGreaterThan(400);
 await page.locator('header .export-menu>summary').click();await expect(page.getByText('Advanced export options',{exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`/tmp/quiet-workspace-${width}.png`});
});
test('support content and honest feedback draft',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Privacy',exact:true}).last().click();await expect(page.getByRole('dialog',{name:'Privacy',exact:true})).toContainText('browser storage is not a cloud backup');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Feedback',exact:true}).last().click();await page.getByLabel('Email (optional)').fill('person@example.com');await page.getByLabel('Your feedback').fill('A test draft');await expect(page.getByRole('dialog',{name:'Feedback',exact:true})).toContainText('nothing is sent');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Feedback',exact:true}).last().click();await expect(page.getByLabel('Your feedback')).toHaveValue('A test draft');
});
test('palette has seven focused commands and no document headings',async({page})=>{
 await page.goto('/');await page.locator('textarea').first().fill('# A heading which is not a command');await page.setViewportSize({width:1440,height:900});await page.getByTitle('Open Command Palette (Cmd+K / Ctrl+K)').click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog',{name:'Commands'}).getByText('A heading which is not a command',{exact:true})).toHaveCount(0);await expect(page.getByRole('dialog',{name:'Commands'}).getByText('Document Headings',{exact:true})).toHaveCount(0);await expect(page.getByRole('dialog',{name:'Commands'}).getByRole('button')).toHaveCount(7);
});
test('header appearance and reading controls share neutral hover in both appearances',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.locator('textarea').first().fill('# Hover');
 for(const mode of ['cream','dark']){
  await page.evaluate(mode=>document.documentElement.setAttribute('data-appearance',mode),mode);
  const appearance=page.getByRole('button',{name:/Switch to .* appearance/});const reading=page.getByTitle('Switch to clean reading view');
  const color=mode==='cream'?'rgb(238, 237, 231)':'rgb(53, 53, 51)';await appearance.hover();await expect(appearance).toHaveCSS('background-color',color);await reading.hover();await expect(reading).toHaveCSS('background-color',color);
 }
});
test('Word and HTML remain direct downloads',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.locator('textarea').first().fill('# Direct download\n\nLatest text.');
 for(const name of ['Word document (.docx)','HTML (.html)']){
  await page.locator('header .export-menu>summary').click();const download=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();expect((await download).suggestedFilename()).toMatch(name.startsWith('Word')?/\.docx$/:/\.html$/);
 }
 await expect(page.getByRole('dialog',{name:/Deliver your document|Export document/})).toHaveCount(0);
});
