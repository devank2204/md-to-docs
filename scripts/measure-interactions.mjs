import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
function usedBytes(entry) {
 const source=entry.source || '';
 const ranges=entry.functions.flatMap(f=>f.ranges);
 const points=[...new Set(ranges.flatMap(r=>[r.startOffset,r.endOffset]))].sort((a,b)=>a-b);
 let bytes=0;
 for(let i=1;i<points.length;i++) {
  const start=points[i-1],end=points[i];
  const range=ranges.filter(r=>r.startOffset<=start && r.endOffset>=end).sort((a,b)=>(a.endOffset-a.startOffset)-(b.endOffset-b.startOffset))[0];
  if(range?.count) bytes+=Buffer.byteLength(source.slice(start,end));
 }
 return bytes;
}
const output=process.argv[2] || '/tmp/performance-interactions.json';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',args:['--no-sandbox']});
const rows=[];
for(const port of (process.env.PERF_PORTS || '4180,4181').split(',').map(Number)) for(let sample=0;sample<3;sample++) {
 const page=await browser.newPage({viewport:{width:375,height:900}});
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.coverage.startJSCoverage();
 await page.addInitScript(()=>{function check(){const input=document.querySelector('textarea');if(input&&(window.__mdStartup?.active||Object.keys(input).some(k=>k.startsWith('__reactProps')))){window.inputReady=performance.now();return;}requestAnimationFrame(check)}requestAnimationFrame(check)});
 await page.goto(`http://127.0.0.1:${port}/markdown-to-word/`);
 await page.waitForTimeout(1000);
 const ready=await page.evaluate(()=>window.inputReady);
 const coverage=await page.coverage.stopJSCoverage();
 const parsed=coverage.reduce((n,s)=>n+Buffer.byteLength(s.source || ''),0);
 const executed=coverage.reduce((n,s)=>n+usedBytes(s),0);
 await page.locator('textarea').first().fill('# Report\n\nA **technical** document.\n\n| Task | State |\n| --- | --- |\n| Test | Ready |');
 await page.locator('header').getByRole('button',{name:/^Export/}).click();
 const start=Date.now();
 await page.getByRole('button',{name:'Prepare Word document'}).click();
 await page.getByRole('button',{name:'Download .docx',exact:true}).waitFor({timeout:60000});
 rows.push({port,sample,ready,parsed,executed,exportMs:Date.now()-start});
 await fs.writeFile(output,JSON.stringify(rows,null,2));console.log(rows.at(-1));await page.close();
}
await browser.close();
