import {test,expect} from '@playwright/test';
const source='# A long document title for the mobile navigation\n\nA readable paragraph with the full available width.\n\n## Second heading\n\nMore text.';
for(const width of [320,375,390,768])test(`mobile tools, title and reading width ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/');
 await expect(page.getByRole('button',{name:'Tools',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/Switch to .* appearance/})).toBeVisible();
 await page.locator('textarea').first().fill(source);
 const input=page.getByRole('textbox',{name:'Document name',exact:true});await input.blur();await expect(input).toHaveCSS('font-size','14px');await input.focus();await expect(input).toHaveCSS('font-size','16px');await input.fill('Mobile renamed');await page.getByRole('button',{name:'Save document name',exact:true}).click();await expect(input).toHaveValue('Mobile renamed');
 await page.getByRole('button',{name:'Tools',exact:true}).click();await expect(page.getByRole('button',{name:'Document options',exact:true})).toBeVisible();await page.keyboard.press('Escape');
 await page.getByRole('tab',{name:'Preview',exact:true}).click();const paper=page.locator('[data-document-paper]');await expect(paper.getByRole('heading',{name:'Second heading'})).toBeVisible();await expect(paper.locator('details.collapsible-section')).toHaveCount(0);
 await expect(paper).toHaveCSS('padding-left','12px');expect((await paper.boundingBox())!.width).toBeGreaterThan(width-30);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`/tmp/mobile-refinement-${width}.png`});
});
test('desktop retains heading disclosure',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.locator('textarea').first().fill(source);await expect(page.locator('details.collapsible-section').first()).toBeVisible();await page.locator('details.collapsible-section>summary').first().click();await expect(page.locator('details.collapsible-section').first()).not.toHaveAttribute('open');
});
test('deferred preview shimmers, reduced motion is still, and content survives',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 await page.route('**/DocumentPreview-*.js',async route=>{await gate;await route.continue();});
 await page.goto('/');await page.locator('textarea').first().fill(source);await page.getByRole('tab',{name:'Preview',exact:true}).click();
 try {await expect(page.getByRole('status',{name:'Loading tool'})).toBeVisible();await expect(page.locator('.skeleton-line').first()).toHaveCSS('animation-name','none');await page.screenshot({path:'/tmp/mobile-shimmer.png'});} finally {release();}
 await expect(page.getByRole('heading',{name:'Second heading'})).toBeVisible();
});
test('feedback matches body role and has a complete focus treatment',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.getByRole('button',{name:'Feedback',exact:true}).last().click();const form=page.locator('.support-form');await expect(form).toHaveCSS('font-size','15px');await expect(form).toHaveCSS('line-height','24px');await expect(form.getByText('Online submission is not connected yet.',{exact:false})).toHaveCount(0);
 for(const label of ['Email (optional)','Your feedback']) {const input=page.getByLabel(label);await input.focus();await expect(input).toHaveCSS('outline-style','solid');await expect(input).toHaveCSS('outline-width','2px');for(const side of ['top','right','bottom','left']) await expect(input).toHaveCSS(`border-${side}-width`,'1px');}
 await page.screenshot({path:'/tmp/feedback-refinement.png'});
});
test('the first diagram review click survives a delayed repair chunk',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);
 await page.route('**/MermaidRepairAssistant-*.js',async route=>{await gate;await route.continue();});
 await page.goto('/');await page.locator('textarea').first().fill('# Repair\n\n::: mermaid\ngraph TD\nA[Calculate (Total)] --> B\n:::');
 await page.getByRole('button',{name:'Review diagram fixes',exact:true}).click();release();
 await expect(page.getByRole('dialog',{name:'Review Mermaid fixes'})).toBeVisible();const apply=page.getByRole('button',{name:'Apply fix to diagram at line 3'});await expect(apply).toBeVisible();await apply.click();expect(await page.locator('textarea').first().inputValue()).toContain('A["Calculate (Total)"]');
});
