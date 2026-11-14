import { test, expect } from '@playwright/test';
import { fillSource, openExport } from './action-helpers';

for (const width of [375, 1440]) test(`prerender accepts typing before entry module and preserves focus at ${width}`,  async ({ page }) => {
 await page.setViewportSize({ width, height: 900 });
 let release!: () => void;
 const gate = new Promise<void>(resolve => release = resolve);
 await page.route('**/assets/index-*.js', async route => { await gate; await route.continue(); });
 await page.goto('/markdown-to-word/', { waitUntil: 'commit' });
 const input = page.getByRole('textbox').first();
 await input.pressSequentially('# Early paste survives');
 await expect(input).toHaveValue('# Early paste survives');
 if (width < 1024) await expect(page.getByRole('textbox', {name:'Markdown terminal input'})).toHaveCount(0);
 else await expect(page.getByText('Start by pasting here',{exact:true})).toBeHidden();
 release();
 await expect(page.locator('textarea')).toHaveValue('# Early paste survives');
 await expect(input).toBeFocused();
 await openExport(page);
 await expect(page.getByRole('button',{name:'Prepare Word document'})).toBeVisible();
 await page.getByRole('button',{name:/^Close /}).click();
 await page.reload();
 await expect(input).toHaveValue('# Early paste survives');
});

test('empty mobile landing does not request workspace, preview, DOCX or diagram engines', async ({page}) => {
 const scripts: string[] = [];
 page.on('request', r => { if (r.resourceType() === 'script') scripts.push(r.url()); });
 await page.goto('/markdown-to-word/');
 await page.waitForTimeout(1000);
 expect(scripts.some(url => /Workspace-|DocumentPreview-|ondineEngine-|docx-|useDocumentCompilation-/.test(url))).toBe(false);
});

test('failed workspace chunk offers recovery and retains the saved input', async ({page}) => {
 await page.setViewportSize({width:1440,height:900});
 await page.route('**/assets/Workspace-*.js', route => route.abort());
 await page.goto('/markdown-to-word/');
 await fillSource(page, '# Source survives a failed module');
 await expect(page.getByRole('alert')).toContainText('Could not load');
 await page.unroute('**/assets/Workspace-*.js');
 await page.getByRole('button', {name:'Retry loading'}).click();
 await expect(page.locator('textarea').first()).toHaveValue('# Source survives a failed module');
 await expect(page.getByRole('alert')).toHaveCount(0);
});

test('DOCX import delay cannot publish output for a replaced source', async ({page}) => {
 await page.setViewportSize({width:1440,height:900});
 let release!: () => void;
 let requested!: () => void;
 const gate = new Promise<void>(resolve=>release=resolve);
 const seen = new Promise<void>(resolve=>requested=resolve);
 await page.route('**/assets/docx-*.js', async route => { requested(); await gate; await route.continue(); });
 await page.goto('/markdown-to-word/');
 await fillSource(page, '# Old source');
 await openExport(page);
 await page.getByRole('button', {name:'Prepare Word document'}).click();
 await seen;
 await fillSource(page, '# New source');
 release();
 await expect(page.getByRole('button', {name:'Prepare Word document'})).toBeVisible();
 await expect(page.getByRole('button', {name:'Download .docx',exact:true})).toHaveCount(0);
 await page.getByRole('button', {name:'Prepare Word document'}).click();
 await expect(page.getByRole('button', {name:'Download .docx',exact:true})).toBeVisible();
});

test('deferred command palette, history and reconciliation open on demand', async ({page}) => {
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/markdown-to-word/');
 await fillSource(page, '# Optional tools');
 const command = async (query: string) => {
  await page.keyboard.press('Control+k');
  const search=page.getByPlaceholder('Type a command, destination, theme, or heading...');
  await search.fill(query); await search.press('Enter');
 };
 await command('Browse Document History');
 await expect(page.getByRole('heading',{name:'Version history'})).toBeVisible();
 await page.getByRole('button',{name:'Close Version history',exact:true}).click();
 await command('Sync Word Comments');
 await expect(page.getByRole('heading',{name:'Reconciliation & Review Patch Studio'})).toBeVisible();
});

test('deferred formatted handoff writes HTML and plain text on the copy gesture', async ({page, context}) => {
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.goto('/markdown-to-google-docs/');
 await fillSource(page, '# Clipboard sample\n\nA **formatted** report.\n\n| Item | State |\n| --- | --- |\n| Test | Ready |');
 await page.getByRole('button',{name:'Copy for Google Docs',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Copied to clipboard'})).toBeVisible();
 const contents=await page.evaluate(async()=>{
  const items=await navigator.clipboard.read();
  const item=items.find(value=>value.types.includes('text/html'))!;
  return {html:await (await item.getType('text/html')).text(),plain:await (await item.getType('text/plain')).text()};
 });
 expect(contents.html).toContain('<strong');
 expect(contents.html).toContain('<table');
 expect(contents.plain).toContain('# Clipboard sample');
});

test('pending desktop studio retains readable source and one route introduction', async ({page}) => {
 await page.setViewportSize({width:1440,height:900});
 let release!: () => void;
 const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/assets/Workspace-*.js',async route=>{await gate;await route.continue()});
 await page.goto('/markdown-to-word/');
 await fillSource(page,'# Source while the studio loads');
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('textarea')).toHaveValue('# Source while the studio loads');
 await expect(page.getByText('Start by pasting here',{exact:true})).toBeHidden();
 release();
 await expect(page.getByRole('button',{name:/^Sync scroll:/})).toBeVisible();
});

test('a clipboard read started before mount cannot replace a newly selected document', async ({page}) => {
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:()=>new Promise<string>(resolve=>(window as any).resolveStartupClipboard=resolve)}}));
 let release!: () => void;
 const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/assets/index-*.js',async route=>{await gate;await route.continue()});
 await page.goto('/markdown-to-word/',{waitUntil:'commit'});
 await page.getByRole('button',{name:'Paste text',exact:true}).click();
 release();
 await page.waitForFunction(()=>(window as any).__mdStartup?.active===false);
 await page.keyboard.press('Control+Alt+n');
 await page.evaluate(()=>(window as any).resolveStartupClipboard('# Late clipboard read'));
 await expect(page.locator('textarea')).toHaveValue('');
});

for (const width of [375,1440]) test(`startup import preserves the existing file budget at ${width}`, async ({page}) => {
 await page.setViewportSize({width,height:900});
 let release!: () => void;
 const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/assets/index-*.js',async route=>{await gate;await route.continue()});
 await page.goto('/markdown-to-word/',{waitUntil:'commit'});
 await expect(page.getByRole('textbox').first()).toBeVisible();
 await page.locator('input[type=file]').setInputFiles({name:'large.md',mimeType:'text/markdown',buffer:Buffer.alloc(1000001,'x')});
 if(width<1024) {
  await expect(page.getByRole('status')).toContainText('smaller than 1 MB');
  await expect(page.getByRole('textbox')).toHaveValue('');
 } else {
  await expect.poll(async()=>(await page.getByRole('textbox').inputValue()).length).toBe(1000001);
 }
 release();
});

test('clearing mobile source clears its previous formatting diagnostics', async ({page}) => {
 await page.goto('/');
 const row='| '+Array.from({length:22},(_,i)=>`Column ${i}`).join(' | ')+' |';
 const separator='| '+Array.from({length:22},()=>'---').join(' | ')+' |';
 await fillSource(page,`# Wide table\n\n${row}\n${separator}\n${row}`);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('mdtodocs:review')));
 await expect(page.getByText('Review what may change in your chosen app.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/^Close /}).click();
 await fillSource(page,'');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('mdtodocs:review')));
 await expect(page.getByText('No structural formatting issues found.',{exact:true})).toBeVisible();
});
