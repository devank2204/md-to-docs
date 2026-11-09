import fs from 'node:fs/promises';
const before=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const after=JSON.parse(await fs.readFile(process.argv[3],'utf8'));
const median=values=>{const s=values.filter(v=>typeof v==='number').sort((a,b)=>a-b);return s.length ? s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2 : null};
function summarize(rows) {
 return [...new Set(rows.map(r=>`${r.mobile}:${r.route}`))].map(key=>{
  const group=rows.filter(r=>`${r.mobile}:${r.route}`===key);
  return {mobile:group[0].mobile,route:group[0].route,samples:group.length,
   jsTransfer:median(group.map(r=>r.jsTransfer)),
   htmlTransfer:median(group.map(r=>r.requests.filter(q=>q.type==='Document').reduce((n,q)=>n+q.bytes,0))),
   jsAndHtmlTransfer:median(group.map(r=>r.requests.filter(q=>q.type==='Script'||q.type==='Document').reduce((n,q)=>n+q.bytes,0))),
   largestScript:median(group.map(r=>Math.max(...r.requests.filter(q=>q.type==='Script').map(q=>q.bytes)))),
   totalTransfer:median(group.map(r=>r.requests.reduce((n,q)=>n+q.bytes,0))),
   requests:median(group.map(r=>r.requests.length)),
   scriptRequests:median(group.map(r=>r.requests.filter(q=>q.type==='Script').length)),
   lcp:median(group.map(r=>r.initial.lcp)),fcp:median(group.map(r=>r.initial.fcp)),cls:median(group.map(r=>r.initial.cls)),
   observedBlocking:median(group.map(r=>r.initial.longTasks.reduce((n,t)=>n+Math.max(0,t.duration-50),0))),
   longTasks:median(group.map(r=>r.initial.longTasks.length)),
   pasteMs:median(group.map(r=>r.pasteMs)),previewMs:median(group.map(r=>r.previewMs)),
   errors:group.flatMap(r=>r.errors),
   incompleteScripts:group.reduce((n,r)=>n+r.requests.filter(q=>q.type==='Script'&&!q.bytes).length,0)};
 });
}
const result={methodology:{browser:'Chromium 156.0.8078.79',node:'24.22.1',cold:'new context and disabled HTTP cache for each sample',mobile:'375x900; 209715.2 B/s down, 96000 B/s up, 150ms latency, 4x CPU',desktop:'1440x900; 2621440 B/s down, 96000 B/s up, 20ms latency, 1x CPU',transfer:'CDP encodedDataLength, gzip server; includes response headers',window:'load + 1500ms, plus completion of pending script requests; not Lighthouse or field data',tbt:'Not measured; observedBlocking is sum(max(longTask.duration-50,0)) in the observation window, not Lighthouse TBT'},before:summarize(before),after:summarize(after)};
await fs.writeFile(process.argv[4],JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
