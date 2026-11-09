import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const directory=process.argv[2] || '/tmp/performance-ui';
await fs.mkdir(directory,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',args:['--no-sandbox']});
const routes=['/','/markdown-to-word/','/markdown-to-google-docs/','/markdown-to-pdf/','/mermaid-to-svg/','/mermaid-to-png/'];
for(const port of [4180,4181]) for(const width of [375,768,1440]) {
 const context=await browser.newContext({viewport:{width,height:900}});
 for(const route of routes) {
  const page=await context.newPage();
  await page.goto(`http://127.0.0.1:${port}${route}`);
  await page.evaluate(()=>document.fonts.ready);
  if(route.startsWith('/mermaid')) await page.locator('svg text').first().waitFor();
  await page.screenshot({path:`${directory}/${port===4180?'before':'after'}-${width}-${route.replaceAll('/','')||'home'}.png`});
  if(route==='/') {
   await page.locator('textarea').first().fill('# Engineering review\n\nA **technical** report.\n\n| Task | Status |\n| --- | --- |\n| Build | Ready |\n\n$$x^2+y^2$$\n\n```mermaid\ngraph LR\nA[Draft] --> B[Document]\n```');
   if(width<1024) {
    await page.screenshot({path:`${directory}/${port===4180?'before':'after'}-${width}-workspace-edit.png`});
    await page.getByRole('tab',{name:'Preview',exact:true}).click();
   }
   await page.locator('.mermaid-preview svg text').first().waitFor();
   await page.screenshot({path:`${directory}/${port===4180?'before':'after'}-${width}-workspace-preview.png`});
   await page.reload();
   await page.locator('textarea').first().waitFor();
   if(width===1440) await page.getByRole('button',{name:'Sync scroll',exact:true}).waitFor();
   await page.screenshot({path:`${directory}/${port===4180?'before':'after'}-${width}-restored-workspace.png`});
  }
  await page.evaluate(()=>localStorage.clear());await page.close();
 }
 await context.close();
}
await browser.close();
