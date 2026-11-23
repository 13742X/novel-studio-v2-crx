/* Novel Studio: writing analytics. Pure functions, no DOM access. */
const KPI_DEFAULT_BL="*ly\nvery\nreally\njust\nbegan to\nstarted to";
const KPI_DEFAULT_ALLOW="only, family, early, lonely, lovely, friendly, ugly, belly, holy, july, italy, reply, apply, supply, fly, ally, rely, bully, jelly, lily, silly, curly, daily, likely, unlikely, lively, deadly, elderly, orderly, assembly, anomaly, butterfly, dragonfly, firefly, monopoly, melancholy, weekly, monthly, yearly, hourly, nightly, kindly, costly, homely";
const KPI_STOP=new Set(("a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself me more most my myself no nor not now of off on once one or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up us was we were what when where which while who whom why will with would you your yours yourself yourselves didn't don't doesn't wasn't weren't wouldn't couldn't isn't aren't can't won't hadn't hasn't haven't shouldn't i'm i'd i'll i've you're you'd you'll you've we're we'd we'll we've they're they'd they'll they've").split(/\s+/));
const kpiRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function kpiList(s){return String(s||"").split(/\r?\n|,/).map(x=>x.trim().toLowerCase().replace(/’/g,"'")).filter(x=>x&&x[0]!=="#")}
function kpiCompile(bl,exempt){
 const al=new Set(exempt);
 return kpiList(bl).map(t=>{
  if(/\s/.test(t))return{label:t,kind:"phrase",re:new RegExp("(?<![A-Za-z'])"+t.split(/\s+/).map(kpiRx).join("\\s+")+"(?![A-Za-z'])","gi")};
  if(t.includes("*"))return{label:t,kind:"wild",re:new RegExp("^"+t.split("*").map(kpiRx).join("[a-z']*")+"$"),lit:t.replace(/\*/g,"").length,al};
  return{label:t,kind:"word",w:t};
 });
}
const kpiSort=(a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]);
function kpiAnalyse(text,o){
 text=String(text||"");o=o||{};
 const words=(text.match(/\S+/g)||[]).length;
 const ignore=new Set([...kpiList(o.ignore),...(o.names||[]).map(s=>String(s).toLowerCase())]);
 const toks=[],re=/[A-Za-z][A-Za-z'’]*/g;let m;
 while((m=re.exec(text))){const w=m[0].toLowerCase().replace(/’/g,"'").replace(/'+$/,"").replace(/'s$/,"");if(w)toks.push({w,i:m.index,n:m[0].length})}
 /* repeated words */
 const cnt=new Map();
 toks.forEach(t=>{if(t.w.length<3||KPI_STOP.has(t.w)||ignore.has(t.w))return;cnt.set(t.w,(cnt.get(t.w)||0)+1)});
 const min=Math.max(2,+o.repeatMin||5);
 const repeated=[...cnt].filter(a=>a[1]>=min).sort(kpiSort).slice(0,o.topN||15);
 /* repeated 3-word phrases */
 const ph=new Map();
 for(let k=0;k+2<toks.length;k++){
  const a=toks[k].w,b=toks[k+1].w,c=toks[k+2].w;
  if(KPI_STOP.has(a)&&KPI_STOP.has(b)&&KPI_STOP.has(c))continue;
  if(ignore.has(a)||ignore.has(b)||ignore.has(c))continue;
  const key=a+" "+b+" "+c;ph.set(key,(ph.get(key)||0)+1);
 }
 const phrases=[...ph].filter(a=>a[1]>=3).sort(kpiSort).slice(0,8);
 /* sentences and openers (a lowercase fragment after a closing quote joins the previous sentence) */
 const lens=[],op=new Map();let lastOpener=null;
 text.split(/\n+/).forEach(p=>{
  lastOpener=null;
  (p.match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)/g)||[]).forEach(s=>{
   const w=s.match(/[A-Za-z][A-Za-z'’]*/g);if(!w)return;
   const n=(s.match(/\S+/g)||[]).length,lower=/^[^A-Za-z]*[a-z]/.test(s);
   if(lower&&lens.length&&lastOpener!==null){lens[lens.length-1]+=n;return}
   lens.push(n);lastOpener=w[0].toLowerCase().replace(/’/g,"'");op.set(lastOpener,(op.get(lastOpener)||0)+1);
  });
 });
 const sentences=lens.length,sum=lens.reduce((a,b)=>a+b,0);
 const openers=[...op].filter(a=>a[1]>=3).sort(kpiSort).slice(0,6);
 /* dialogue share */
 const dw=(text.match(/“[^”]*”|"[^"\n]*"/g)||[]).reduce((a,q)=>a+(q.match(/\S+/g)||[]).length,0);
 /* blacklist */
 const exempt=[...kpiList(o.allow),...ignore];
 const comp=kpiCompile(o.blacklist,exempt),ents=comp.map(e=>({label:e.label,count:0,w:new Map()})),hits=[];
 toks.forEach(t=>{
  /* an explicit word entry wins over a wildcard, so a word is never counted twice */
  let j=comp.findIndex(e=>e.kind==="word"&&t.w===e.w);
  if(j<0)j=comp.findIndex(e=>e.kind==="wild"&&t.w.length>e.lit&&e.re.test(t.w)&&!e.al.has(t.w));
  if(j>=0){ents[j].count++;ents[j].w.set(t.w,(ents[j].w.get(t.w)||0)+1);hits.push({j,w:t.w,i:t.i,n:t.n})}
 });
 comp.forEach((e,j)=>{
  if(e.kind!=="phrase")return;
  e.re.lastIndex=0;let x;
  while((x=e.re.exec(text))){
   const w=x[0].toLowerCase().replace(/\s+/g," ");
   ents[j].count++;ents[j].w.set(w,(ents[j].w.get(w)||0)+1);hits.push({j,w,i:x.index,n:x[0].length});
   if(x[0].length===0)e.re.lastIndex++;
  }
 });
 hits.sort((a,b)=>a.i-b.i);
 return{
  words,unique:new Set(toks.map(t=>t.w)).size,
  paras:text.split(/\n+/).filter(l=>l.trim()).length,
  sentences,avgSent:sentences?Math.round(sum/sentences*10)/10:0,longest:lens.length?Math.max(...lens):0,
  dialoguePct:words?Math.round(dw/words*100):0,
  readMin:words?Math.max(1,Math.round(words/250)):0,
  repeated,phrases,openers,
  bl:{entries:ents.map(e=>({label:e.label,count:e.count,top:[...e.w].sort(kpiSort).slice(0,8)})),total:hits.length,hits}
 };
}
