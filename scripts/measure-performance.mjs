import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const base = process.argv[2] || 'http://127.0.0.1:4180';
const output = process.argv[3] || '/tmp/performance.json';
const samples = Number(process.env.PERF_SAMPLES || 3);
const routes = ['/', '/markdown-to-word/', '/markdown-to-google-docs/', '/markdown-to-pdf/', '/mermaid-to-svg/', '/mermaid-to-png/'];
const results = [];
const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',args:['--no-sandbox']});
for (const mobile of [true,false]) for (const route of routes) for (let sample=0;sample<samples;sample++) {
 const context = await browser.newContext({viewport:mobile?{width:375,height:900}:{width:1440,height:900}});
 const page = await context.newPage();
 const cdp = await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:mobile?150:20,downloadThroughput:(mobile?1.6:20)*1024*1024/8,uploadThroughput:750*1024/8});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:mobile?4:1});
 const requests = new Map(); const errors=[];
 const activeScripts = new Set(); let scriptActivity = Date.now();
 cdp.on('Network.requestWillBeSent', ({requestId,type})=>{if(type==='Script'){activeScripts.add(requestId);scriptActivity=Date.now();}});
 cdp.on('Network.loadingFailed', ({requestId})=>{activeScripts.delete(requestId);scriptActivity=Date.now();});
 cdp.on('Network.responseReceived',({requestId,type,response})=>{requests.set(requestId,{type,url:response.url,bytes:0,status:response.status});if(type==='Script')activeScripts.add(requestId);});
 cdp.on('Network.loadingFinished',({requestId,encodedDataLength})=>{if(requests.has(requestId))requests.get(requestId).bytes=encodedDataLength; if(activeScripts.delete(requestId))scriptActivity=Date.now()});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__perf={lcp:0,cls:0,longTasks:[],fcp:0};new PerformanceObserver(l=>{for(const e of l.getEntries())window.__perf.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__perf.cls+=e.value}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())window.__perf.longTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true});});
 await page.goto(base+route,{waitUntil:'load',timeout:120000});
 await page.waitForTimeout(1500);
 const settleStart=Date.now();
 while(activeScripts.size || Date.now()-scriptActivity<500) {
  if(Date.now()-settleStart>60000) throw new Error('Initial script downloads did not settle');
  await page.waitForTimeout(100);
 }
 const initial = await page.evaluate(()=>({...window.__perf,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,resources:performance.getEntriesByType('resource').map(e=>({name:e.name,transfer:e.transferSize,decoded:e.decodedBodySize}))}));
 const initialRequests=[...requests.values()];
 const start=Date.now();
 let previewMs=null,pasteMs=null,exportMs=null;
 if(!route.startsWith('/mermaid')) {
  const input=page.getByRole('textbox').first();
  await input.fill('# Performance sample\n\nA **technical** report.\n\n| Item | Status |\n| --- | --- |\n| Build | Ready |');pasteMs=Date.now()-start;
  if(mobile) await page.getByRole('tab',{name:'Preview',exact:true}).click();
  await page.locator('[data-preview-pane]').getByText('technical',{exact:false}).first().waitFor({timeout:60000});
  previewMs=Date.now()-start;
 }
 results.push({mobile,route,sample,initial,requests:initialRequests,jsTransfer:initialRequests.filter(r=>r.type==='Script').reduce((a,r)=>a+r.bytes,0),pasteMs,previewMs,exportMs,errors});
 await page.screenshot({path:output.replace(/\.json$/,`-${mobile?'mobile':'desktop'}-${route.replaceAll('/','')||'home'}-${sample}.png`)});
 await context.close();
 await fs.writeFile(output,JSON.stringify(results,null,2));
 console.log(mobile,route,sample,results.at(-1).jsTransfer,initial.lcp,initial.cls);
}
await browser.close();
