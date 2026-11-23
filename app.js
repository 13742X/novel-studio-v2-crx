const BIBLE=[
  ["novel","Novel Bible"],
  ["char","Character Bible"],
  ["world","Location & World Bible"],
  ["struct","Narrative Structure"],
  ["voice","Voice & Style Bible"],
  ["cont","Continuity Ledger"],
  ["index","Manuscript Index"],
  ["master","Master Instruction"],
  ["chapter","Chapter Generation"],
  ["skeleton","Skeleton Outline"],
  ["plan","Chapter Planning"],
  ["write","Write Chapter"],
  ["review","Review Chapter"],
  ["rewrite","Rewrite Passage"],
  ["continuity","Continuity Check"],
  ["develop","Story Development"],
  ["analyse","Manuscript Analysis"],
  ["screenplay","Film / TV Script (Fountain)"]
];
/* ---------- generated Story Bible documents ----------
   The forms are the source of truth. These documents are rebuilt from them on every save and render,
   stored in P.bible, and are what the AI reads. They are read-only in the app. */
const GEN_KEYS=["novel","char","world","cont","index"];
const EDIT_KEYS=["struct","voice"];
const GEN_DESC={
 novel:"Built from the Project page: title, genre, pitch, plot in brief, themes, synopsis, act summaries, structure beats, story threads and ending. Edit it there.",
 char:"Built from the Characters page: profiles, relationships, secrets and development stages. Edit it there.",
 world:"Built from the Places & Lore page. Edit it there.",
 cont:"Built from the Story Timeline and the Chapters page (summaries, characters, place, time). Edit it there.",
 index:"Built from the Chapters page (titles, acts, status, word counts). Edit it there."};
const FRAMEWORKS={
 three:{name:"Three-act structure",beats:["Hook / opening situation","Inciting incident","End of Act 1 (point of no return)","Midpoint","End of Act 2 (crisis / all seems lost)","Climax","Resolution"]},
 savecat:{name:"Save the Cat",beats:["Opening image","Theme stated","Set-up","Catalyst","Debate","Break into Two","B story","Fun and games","Midpoint","Bad guys close in","All is lost","Dark night of the soul","Break into Three","Finale","Final image"]},
 hero:{name:"Hero's journey",beats:["Ordinary world","Call to adventure","Refusal of the call","Meeting the mentor","Crossing the threshold","Tests, allies and enemies","Approach to the inmost cave","Ordeal","Reward","The road back","Resurrection","Return with the elixir"]},
 custom:{name:"Custom (add your own)",beats:[]}};
const THREAD_TYPES=["Subplot","Mystery / reveal","Character arc","Setup & payoff","Theme / motif"],THREAD_STATUS=["Planned","Open","Resolved","Dropped"];
const PLOT_SECS=["Plot in brief","Central question & themes","Synopsis","Act summaries","Structure beats","Story threads","Ending"];
const HOLD_OPS=["write","plan","rewrite","expand","describe","dialogue"];
const PL0=()=>({short:"",question:"",themes:"",ending:"",endingMode:"hold",acts:{1:"",2:"",3:""},fw:"three",beats:[],threads:[]});
let showGen=false;
const bibleDocsMD=()=>["novel","char","world","struct","voice","cont"].filter(k=>rv(P.bible[k])).map(k=>"### "+BIBLE.find(b=>b[0]===k)[1]+"\n\n"+rv(P.bible[k])).join("\n\n");
function dropSec(md,title){return String(md||"").replace(new RegExp("(^|\\n)## "+title+"[^\\n]*(\\n[\\s\\S]*?)?(?=\\n## |$)","g"),"").trim()}
function contUpTo(md,n){return String(md||"").split(/\n(?=### Ch \d+:)/).filter(b=>{const m=b.match(/^### Ch (\d+):/);return !m||+m[1]<=n}).join("\n")}
function genNovel(){
 const gl=genreLabel(),w=P.chapters.reduce((a,c)=>a+wc(c.text),0),o=["# Novel Bible: "+(P.name||"Untitled novel"),"","## Project overview"];
 o.push("- Title: "+(P.name||"Untitled novel"));
 if(rv(P.subtitle))o.push("- Subtitle: "+rv(P.subtitle));
 if(gl)o.push("- Genre: "+gl);
 o.push("- Target length: "+(+P.target||0)+" words; written so far: "+w+" words across "+P.chapters.length+" chapters");
 if(rv(P.strapline))o.push("","### Pitch",rv(P.strapline));
 const pl=P.plot||{},one=v=>rv(v).replace(/\s*\n\s*/g," ");
 if(rv(pl.short))o.push("","## Plot in brief",rv(pl.short));
 const th=[];if(rv(pl.question))th.push("- Central dramatic question: "+one(pl.question));if(rv(pl.themes))th.push("- Themes and motifs: "+one(pl.themes));
 if(th.length)o.push("","## Central question & themes",th.join("\n"));
 o.push("","## Synopsis",rv(P.synopsis)||"(none yet)");
 const ac=[1,2,3].filter(a=>rv((pl.acts||{})[a])).map(a=>"- **Act "+a+":** "+ind(rv(pl.acts[a])));
 if(ac.length)o.push("","## Act summaries",ac.join("\n"));
 const bl=(pl.beats||[]).filter(b=>rv(b.label)||rv(b.text)).map(b=>({b,n:chIdx(b.chap)})).sort((x,y)=>(x.n<0?1e9:x.n)-(y.n<0?1e9:y.n))
  .map(({b,n})=>"- **"+(rv(b.label)||"Beat")+"** ["+(n>=0?"Ch "+(n+1)+": "+(P.chapters[n].title||"Untitled"):"chapter not set")+"]"+(rv(b.text)?": "+ind(rv(b.text)):""));
 if(bl.length)o.push("","## Structure beats",bl.join("\n"));
 const tl=(pl.threads||[]).filter(t=>rv(t.name)).map(t=>{const s=chIdx(t.setup),p=chIdx(t.payoff);return"- **"+rv(t.name)+"** ("+(t.type||"Subplot")+", "+(t.status||"Planned")+")"+(s>=0?" opens Ch "+(s+1):"")+(p>=0?(s>=0?",":"")+" pays off Ch "+(p+1):"")+(rv(t.notes)?": "+ind(rv(t.notes)):"")});
 if(tl.length)o.push("","## Story threads",tl.join("\n"));
 if(rv(pl.ending))o.push("","## Ending (the author's intended ending)",rv(pl.ending));
 return o.join("\n")+"\n"}
/* Plot context for ONE chapter: its act, the beat it carries, the beat just reached and the next one ahead, and the threads that open, run or pay off here. */
function plotAt(i){
 const pl=P.plot||{},c=P.chapters[i],L=[],one=v=>rv(v).replace(/\s*\n\s*/g," ");
 if(!c)return"";
 const as=rv((pl.acts||{})[+c.act]);if(as)L.push("- Act "+c.act+" is about: "+one(as));
 const bs=(pl.beats||[]).filter(b=>rv(b.label)||rv(b.text)).map(b=>({n:chIdx(b.chap),t:rv(b.label)+(rv(b.text)?": "+one(b.text):"")})).filter(b=>b.n>=0).sort((a,b)=>a.n-b.n);
 bs.filter(b=>b.n===i).forEach(b=>L.push("- This chapter carries the story beat: "+b.t));
 const pv=bs.filter(b=>b.n<i).pop(),nx=bs.find(b=>b.n>i);
 if(pv)L.push("- Last story beat reached (chapter "+(pv.n+1)+"): "+pv.t);
 if(nx)L.push("- Next story beat ahead (chapter "+(nx.n+1)+"; do not reach it early): "+nx.t);
 const T=(pl.threads||[]).filter(t=>rv(t.name)&&t.status!=="Dropped").map(t=>({t,s:chIdx(t.setup),p:chIdx(t.payoff)})),line=x=>x.t.name.trim()+" ("+(x.t.type||"Subplot")+")"+(rv(x.t.notes)?": "+one(x.t.notes):"");
 T.filter(x=>x.s===i).forEach(x=>L.push("- Thread opens in this chapter: "+line(x)));
 T.filter(x=>x.p===i).forEach(x=>L.push("- Thread pays off in this chapter: "+line(x)));
 const run=T.filter(x=>x.s>=0&&x.s<i&&(x.p>i||(x.p<0&&x.t.status!=="Resolved")));
 if(run.length)L.push("- Threads still running (keep them alive, do not resolve them here): "+run.map(line).join("; "));
 return L.length?"# PLOT CONTEXT FOR THIS CHAPTER\n"+L.join("\n"):""}
function genChars(){const C=P.characters.filter(x=>x.name&&x.inc!==false);
 if(!C.length)return"# Character Bible\n\n(no characters yet)\n";
 return"# Character Bible\n\n"+TIERS.map(t=>{const L=C.filter(x=>(x.tier||"major")===t[0]);return L.length?"## "+t[1]+"\n\n"+L.map(x=>charMD(x)).join("\n\n"):""}).filter(Boolean).join("\n\n")+"\n"}
function genWorld(){const L=(P.locations||[]).filter(x=>x.name||x.notes),types=[...new Set(L.map(x=>x.type||"Place"))];
 return"# Location & World Bible\n\n"+(L.length?types.map(t=>"## "+t+"\n"+L.filter(x=>(x.type||"Place")===t).map(x=>"- **"+(x.name||"Unnamed")+"**"+(rv(x.notes)?": "+rv(x.notes).replace(/\n/g,"\n  "):"")+(rv(x.look)?"\n  - Look: "+rv(x.look).replace(/\n/g,"\n    "):"")).join("\n")).join("\n\n"):"(no places or lore yet)")+"\n"}
function genCont(){
 const T=P.timeline,L=P.locations||[],pl=c=>(L.find(x=>x.id===c.loc)||{}).name||c.place||"",o=["# Continuity Ledger","","## Story timeline"];
 const tl=T.items.slice().sort((a,b)=>a.start-b.start).map(it=>{const tr=(T.tracks.find(t=>t.id===it.tid)||{}).name||"Track",who=[...(it.chars||[]).map(cName),...(it.places||[]).map(id=>(L.find(l=>l.id===id)||{}).name)].filter(Boolean).join(", ");return"- **"+it.title+"** ["+tr+", Ch "+(it.start+1)+(it.span>1?"–"+(it.start+it.span):"")+"]"+(who?" ("+who+")":"")+(rv(it.notes)?": "+rv(it.notes).replace(/\n/g," "):"")});
 o.push(tl.length?tl.join("\n"):"(none)","","## Chapter record");
 const ch=P.chapters.map((c,i)=>({c,i})).filter(z=>rv(z.c.summary));
 if(!ch.length)o.push("(no chapter summaries yet)");
 ch.forEach(({c,i})=>{o.push("","### Ch "+(i+1)+": "+(c.title||"Untitled"),"Act "+c.act+" · "+c.status+(cName(c.pov)?" · POV "+cName(c.pov):"")+(pl(c)?" · Place: "+pl(c):"")+(rv(c.time)?" · Time: "+rv(c.time):""));
  const w=[c.major,c.minor].filter(rv).join(", ");if(w)o.push("Characters: "+w);o.push(rv(c.summary))});
 return o.join("\n")+"\n"}
function genIndex(){return"# Manuscript Index\n\n"+P.chapters.map((c,i)=>"- Ch "+(i+1)+": "+(c.title||"Untitled")+" (Act "+c.act+", "+c.status+", "+wc(c.text)+" words, "+(rv(c.summary)?"has summary":"no summary")+")").join("\n")+"\n"}
function syncBible(p){
 if(!p||p!==P)return;
 p.bible=p.bible||{};
 if(!p.bibleSynced){/* first run: keep any hand-written text these documents held, in a private note (never sent to AI) */
  const old=GEN_KEYS.map(k=>({k,t:rv(p.bible[k])})).filter(x=>x.t.length>60&&x.t!==rv(SAMPLES[x.k]||"")&&!/^#[^\n]*$/.test(x.t));
  if(old.length){p.notes=p.notes||[];p.notes.push({id:uid(),title:"Archived bible text (before auto-generation)",scope:"priv",tag:"Archive",text:old.map(x=>"## "+BIBLE.find(b=>b[0]===x.k)[1]+"\n\n"+x.t).join("\n\n---\n\n")})}
  p.bibleSynced=1}
 const g={novel:genNovel,char:genChars,world:genWorld,cont:genCont,index:genIndex};
 GEN_KEYS.forEach(k=>{const v=g[k]();if(p.bible[k]!==v)p.bible[k]=v})}
const VIEWS=[["dash","Dashboard","📊"],["proj","Project","📘"],["bible","Story Bible","📖"],["chars","Characters","👥"],["locs","Places & Lore","🗺️"],["chap","Chapters","✍️"],["time","Story Timeline","⏳"],["board","Whiteboard","🧩"],["notes","Notes","📝"],["subs","Submissions","📬"],["ai","AI Toolkit","🤖"],["export","Export & Downloads","⬇️"],["set","Settings","⚙️"]];
const CHAR_FIELDS=[
 ["history","Background & history","Where they come from: family, formative events, education, past wins and wounds.",3],
 ["look","Physical description","Locked appearance, reused in every prompt: age, build, face, hair, clothing, distinguishing marks.",4],
 ["personality","Personality, motivations & fears","What they want, what drives them, what they dread, their flaws and contradictions.",4],
 ["relationships","Relationships with other characters","Pick another character and write one line about the bond. It shows on both profiles and can be drawn on the Whiteboard.",3],
 ["secrets","Secrets & concealed information","One entry per secret. Record who else knows it and from which chapter. The AI is told to keep it hidden, and which characters must not know it.",3],
 ["development","Character development","The overall arc in a few lines, then stages tied to chapters so each chapter prompt only gets the stage that applies.",3],
 ["speech","Speech patterns & mannerisms","Vocabulary, rhythm, verbal tics, accent, things they never say, habitual gestures.",3],
 ["voice","Sample dialogue","Two or three lines this character would plausibly say. The AI matches these for voice.",3],
 ["notes","Other notes","Anything that doesn't fit above. Earlier free-form notes live here.",3]
];
const CORE=7;
const TIERS=[["major","Major characters"],["minor","Minor characters"],["unnamed","Unnamed / background"]];
const coreOf=c=>c.tier==="unnamed"?1:c.tier==="minor"?2:CORE;
const newChar=()=>Object.assign({id:uid(),name:"",role:"",tier:"major",inc:true,img:"",svg:"",secretList:[],stages:[]},Object.fromEntries(CHAR_FIELDS.map(f=>[f[0],""])));
const fld=(k,lb,hint,val,rows)=>`<label class="fld"><span class="fl">${lb}</span><span class="fh">${hint}</span><textarea data-k="${k}" rows="${rows||3}">${esc(val)}</textarea></label>`;
const rv=v=>v&&String(v).trim()?String(v).trim():"";
const ind=v=>v.replace(/\n/g,"\n    ");
const cName=id=>(P.characters.find(x=>x.id===id)||{}).name||"";
const chIdx=id=>id?P.chapters.findIndex(c=>c.id===id):-1;
const chLbl=(c,n)=>(n+1)+". "+(c.title||"Untitled");
const chOpts=(sel,first)=>`<option value="">${first}</option>`+P.chapters.map((c,n)=>`<option value="${c.id}" ${c.id===sel?"selected":""}>${esc(chLbl(c,n))}</option>`).join("");
function relsOf(id){return(P.rels||[]).filter(r=>(r.a===id||r.b===id)&&cName(r.a===id?r.b:r.a))}
function secNow(s,ci){const kn=(s.known||[]).filter(cName),fi=chIdx(s.from);return{kn,fi,now:(ci==null||fi<0||fi<=ci)?kn:[]}}
function charGaps(x){const g=[];
 if(!rv(x.history))g.push("Background");
 if(!rv(x.look))g.push("Physical description");
 if(!rv(x.personality))g.push("Personality");
 if(!relsOf(x.id).length&&!rv(x.relationships))g.push("Relationships");
 if(!rv(x.development)&&!(x.stages||[]).some(s=>rv(s.text)))g.push("Development");
 if(!rv(x.speech))g.push("Speech");
 if(!rv(x.voice))g.push("Sample dialogue");
 if(x.tier==="unnamed")return[];
 if(x.tier==="minor")return g.filter(v=>v==="Physical description"||v==="Personality");
 return g}
/* Prompt text for one character. ci = chapter index for a chapter prompt, omitted for whole-book prompts. */
function charMD(x,ci){
 const g=ci==null,L=[],add=(lb,v)=>{v=rv(v);if(v)L.push("  - "+lb+": "+ind(v))};
 add("Background",x.history);add("Appearance",x.look);add("Personality, motivations & fears",x.personality);
 const rl=relsOf(x.id).map(r=>"    - "+cName(r.a===x.id?r.b:r.a)+(rv(r.label)?" – "+ind(rv(r.label)):""));
 if(rv(x.relationships))rl.push("    - Others: "+ind(rv(x.relationships)));
 if(rl.length)L.push("  - Relationships:\n"+rl.join("\n"));
 const sl=(x.secretList||[]).filter(s=>rv(s.text));
 if(g&&sl.length)L.push("  - SECRETS (concealed; never reveal or hint without author approval):\n"+sl.map(s=>{const k=secNow(s);return"    - "+ind(rv(s.text))+(k.kn.length?" [shared with "+k.kn.map(cName).join(", ")+(k.fi>=0?" from chapter "+(k.fi+1):"")+"]":" [known to nobody else]")}).join("\n"));
 const st=(x.stages||[]).filter(s=>rv(s.text)).map(s=>({n:chIdx(s.chap),t:rv(s.text)})),placed=st.filter(s=>s.n>=0).sort((a,b)=>a.n-b.n);
 if(g){add("Character development",x.development);const all=placed.concat(st.filter(s=>s.n<0));if(all.length)L.push("  - Development stages:\n"+all.map(s=>"    - "+(s.n>=0?"Chapter "+(s.n+1)+": ":"")+ind(s.t)).join("\n"))}
 else{add("Overall arc",x.development);const cur=placed.filter(s=>s.n<=ci).pop(),nx=placed.find(s=>s.n>ci);if(cur)L.push("  - Current stage (since chapter "+(cur.n+1)+"): "+ind(cur.t));if(nx)L.push("  - Heading toward (chapter "+(nx.n+1)+"; do not reach it early): "+ind(nx.t))}
 add("Speech & mannerisms",x.speech);add("Sample dialogue (match this voice)",x.voice);
 return["- **"+(x.name||"Unnamed")+"** ("+(x.role||"role unset")+")"+(rv(x.notes)?": "+ind(rv(x.notes)):""),...L].join("\n")}
/* Who may and may not know each secret at chapter ci, limited to the characters in the prompt. */
function boundaries(C,ci){const out=[];
 C.forEach(o=>(o.secretList||[]).filter(s=>rv(s.text)).forEach(s=>{
  const k=secNow(s,ci),know=new Set([o.id,...k.now]),ign=C.filter(x=>x.name&&!know.has(x.id)).map(x=>x.name),who=[o.name||"Unnamed",...k.now.map(cName)];
  out.push("- "+(o.name||"Unnamed")+"'s secret: "+rv(s.text).replace(/\s*\n\s*/g," ")+"\n  - Known to: "+who.join(", ")+(ign.length?"\n  - NOT known to (must not know, suspect, hint at or act on it): "+ign.join(", "):"")+(k.fi>ci&&k.kn.length?"\n  - Not yet shared with "+k.kn.map(cName).join(", ")+" (they learn it in chapter "+(k.fi+1)+")":""));
 }));
 return out.join("\n")}
/* ---- markdown import / export ---- */
const CHAR_TPL=`## Full Name
Role: e.g. protagonist, antagonist, mentor

### Background & history
Family, formative events, education, past wins and wounds.

### Physical description
Age, build, face, hair, clothing, distinguishing marks.

### Personality, motivations & fears
What they want, what drives them, what they dread, flaws and contradictions.

### Relationships
- Another Character's Full Name: one line about the bond

### Secrets
- A secret they conceal (known by: Name, Name; from chapter 5)

### Character development
The overall arc in a few lines.
- Chapter 3: where they are at this point
- Chapter 12: how they have changed by here

### Speech patterns & mannerisms
Vocabulary, rhythm, tics, gestures.

### Sample dialogue
- "A line they would plausibly say."

### Other notes
Anything else.
`;
const SEC_MAP=[[/speech|mannerism|accent|verbal/i,"speech"],[/sample|dialogue|voice/i,"voice"],[/background|history|backstory/i,"history"],[/physical|appearance|look|description/i,"look"],[/personality|motivation|fear|psycholog/i,"personality"],[/relationship/i,"relationships"],[/secret|conceal/i,"secrets"],[/develop|arc/i,"development"],[/note|other|misc/i,"notes"]];
const SEC_NAME={history:"Background",look:"Physical description",personality:"Personality",relationships:"Relationships",secrets:"Secrets",development:"Development",speech:"Speech",voice:"Sample dialogue",notes:"Notes"};
const secKey=t=>{const m=SEC_MAP.find(a=>a[0].test(t));return m?m[1]:null};
function listItems(lines){const it=[];let blank=true;lines.forEach(l=>{const b=l.match(/^\s*[-*•]\s+(.*)$/);if(b){it.push(b[1].trim());blank=false}else if(!l.trim())blank=true;else if(it.length&&!blank)it[it.length-1]+=" "+l.trim();else{it.push(l.trim());blank=false}});return it}
function parseRel(l){const m=l.replace(/^\s*[-*•]\s*/,"").trim();if(!m)return null;const x=m.match(/^(.+?)\s*(?::|\s[–—-]\s)\s*(.+)$/);return x?{who:x[1].replace(/[*_]/g,"").trim(),label:x[2].trim()}:{who:m.replace(/[*_]/g,""),label:""}}
function parseSecret(t){t=t.trim();let known=[],from=null;const m=t.match(/\(([^()]*)\)\s*\.?$/);
 if(m&&/known by|from\s+(?:chapter|ch)/i.test(m[1])){const kb=m[1].match(/known by:?\s*(.*?)\s*(?:;|,?\s*from\s+(?:chapter|ch)|$)/i),fr=m[1].match(/from\s+(?:chapter|ch\.?)\s*(\d+)/i);
  if(kb)known=kb[1].split(/\s*(?:,|&|\band\b)\s*/).map(s=>s.trim()).filter(Boolean);if(fr)from=+fr[1];t=t.slice(0,m.index).trim()}
 return{text:t,known,from}}
function parseChars(txt){
 const lines=String(txt||"").replace(/\r/g,"").split("\n");
 const hs=lines.map((l,n)=>{const m=l.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);return m?{n,lv:m[1].length,t:m[2].replace(/[*_`]/g,"").trim()}:null}).filter(Boolean);
 if(!hs.length)return[];
 const cnt={};hs.filter(h=>secKey(h.t)).forEach(h=>cnt[h.lv]=(cnt[h.lv]||0)+1);
 const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||a-b)[0];
 const cl=top?Math.max(1,+top-1):Math.min(...hs.map(h=>h.lv));
 const out=[];let ch=null,sec=null;
 lines.forEach((l,n)=>{const h=hs.find(x=>x.n===n);
  if(h&&h.lv<=cl){if(h.lv===cl){const m=h.t.match(/^(.*?)\s*\((.+)\)\s*$/);ch={name:(m?m[1]:h.t).trim(),role:m?m[2].trim():"",pre:[],sec:{}};out.push(ch)}else ch=null;sec=null;return}
  if(!ch)return;
  if(h&&h.lv===cl+1){const k=secKey(h.t)||"notes";sec=k;(ch.sec[k]=ch.sec[k]||[]);if(!secKey(h.t))ch.sec[k].push("**"+h.t+"**");return}
  (sec?ch.sec[sec]:ch.pre).push(l)});
 return out.filter(c=>c.name).map(c=>{
  const tx=k=>(c.sec[k]||[]).join("\n").trim(),d={name:c.name,role:c.role,found:[]},extra=[];
  c.pre.filter(l=>l.trim()).forEach(l=>{const m=l.match(/^\s*[-*]?\s*\**role\**\s*:\s*\**(.+?)\**\s*$/i);if(m)d.role=m[1].trim();else extra.push(l.trim())});
  ["history","look","personality","speech","voice"].forEach(k=>d[k]=tx(k));d.voice=d.voice.split("\n").map(l=>l.replace(/^\s*[-*•]\s+/,"")).join("\n");
  d.notes=[tx("notes"),extra.join("\n")].filter(Boolean).join("\n\n");
  d.rels=(c.sec.relationships||[]).filter(l=>l.trim()).map(parseRel).filter(Boolean);
  d.secrets=listItems(c.sec.secrets||[]).map(parseSecret).filter(s=>s.text);
  const stRe=/^\s*[-*•]\s*(?:chapter|ch\.?)\s*(\d+)\s*[:–—-]\s*(.+)$/i,ov=[];d.stages=[];
  (c.sec.development||[]).forEach(l=>{const m=l.match(stRe);if(m)d.stages.push({n:+m[1],text:m[2].trim()});else ov.push(l)});
  d.development=ov.join("\n").trim();
  ["history","look","personality","speech","voice"].forEach(k=>{if(d[k])d.found.push(SEC_NAME[k])});
  if(d.rels.length)d.found.push("Relationships");if(d.secrets.length)d.found.push("Secrets");if(d.development||d.stages.length)d.found.push("Development");if(d.notes)d.found.push("Notes");
  return d})}
function resolveChar(n){n=String(n||"").trim().toLowerCase();if(!n)return null;const a=P.characters.filter(x=>x.name&&x.name.trim().toLowerCase()===n);if(a.length===1)return a[0];const b=P.characters.filter(x=>x.name&&names(x.name).some(v=>v.toLowerCase()===n));return b.length===1?b[0]:null}
function applyImport(items,mode){
 const ow=mode==="over",pairs=[];let nNew=0,nUpd=0,nRel=0,nLoose=0;
 items.filter(it=>it.on).forEach(it=>{const d=it.data;let c=resolveChar(d.name);
  if(!c){c=newChar();c.name=d.name;P.characters.push(c);nNew++}else nUpd++;
  ["role","history","look","personality","speech","voice","notes","development"].forEach(k=>{if(d[k]&&(ow||!rv(c[k])))c[k]=d[k]});
  if(d.stages.length){const have=new Set(c.stages.map(s=>rv(s.text).toLowerCase()));if(ow)c.stages=[];
   d.stages.forEach(s=>{const ch=P.chapters[s.n-1],t=ch?s.text:"Chapter "+s.n+": "+s.text;if(ow||!have.has(t.toLowerCase()))c.stages.push({id:uid(),chap:ch?ch.id:"",text:t})})}
  pairs.push([c,d])});
 pairs.forEach(([c,d])=>{
  if(d.secrets.length){if(ow)c.secretList=[];const have=new Set(c.secretList.map(s=>rv(s.text).toLowerCase()));
   d.secrets.forEach(s=>{if(!ow&&have.has(s.text.toLowerCase()))return;const kn=[],un=[];s.known.forEach(n=>{const o=resolveChar(n);o&&o.id!==c.id?kn.push(o.id):un.push(n)});const ch=s.from?P.chapters[s.from-1]:null;
    c.secretList.push({id:uid(),text:s.text+(un.length?" (also known by "+un.join(", ")+")":""),known:[...new Set(kn)],from:ch?ch.id:""})})}
  d.rels.forEach(r=>{const o=resolveChar(r.who);
   if(o&&o.id!==c.id){const ex=P.rels.find(q=>(q.a===c.id&&q.b===o.id)||(q.a===o.id&&q.b===c.id));if(ex){if(r.label&&(ow||!rv(ex.label)))ex.label=r.label}else P.rels.push({id:uid(),a:c.id,b:o.id,label:r.label});nRel++}
   else{const line=r.who+(r.label?" – "+r.label:"");if(!rv(c.relationships).includes(line)){c.relationships=(rv(c.relationships)?rv(c.relationships)+"\n":"")+line;nLoose++}}})});
 return"Imported "+nNew+" new and updated "+nUpd+" existing character"+(nNew+nUpd===1?"":"s")+"; "+nRel+" relationship"+(nRel===1?"":"s")+" linked"+(nLoose?"; "+nLoose+" kept as plain notes (no matching character)":"")+"."}
function charExport(x){
 const o=["## "+(x.name||"Unnamed"),"Role: "+(x.role||"")],one=v=>rv(v).replace(/\s*\n\s*/g," "),sec=(t,b)=>{b=rv(b);if(b)o.push("","### "+t,b)};
 sec("Background & history",x.history);sec("Physical description",x.look);sec("Personality, motivations & fears",x.personality);
 const rl=relsOf(x.id).map(r=>"- "+cName(r.a===x.id?r.b:r.a)+": "+one(r.label));
 rv(x.relationships).split("\n").filter(l=>l.trim()).forEach(l=>rl.push(/^\s*[-*]/.test(l)?l.trim():"- "+l.trim()));
 if(rl.length)o.push("","### Relationships",rl.join("\n"));
 const sl=(x.secretList||[]).filter(s=>rv(s.text)).map(s=>{const kn=(s.known||[]).map(cName).filter(Boolean),fi=chIdx(s.from),meta=[kn.length?"known by: "+kn.join(", "):"",fi>=0?"from chapter "+(fi+1):""].filter(Boolean).join("; ");return"- "+one(s.text)+(meta?" ("+meta+")":"")});
 if(sl.length)o.push("","### Secrets",sl.join("\n"));
 const st=(x.stages||[]).filter(s=>rv(s.text)).map(s=>({n:chIdx(s.chap),t:one(s.text)})).sort((a,b)=>(a.n<0?1e9:a.n)-(b.n<0?1e9:b.n)).map(s=>"- "+(s.n>=0?"Chapter "+(s.n+1)+": ":"")+s.t),dv=[rv(x.development),...st].filter(Boolean).join("\n");
 if(dv)o.push("","### Character development",dv);
 sec("Speech patterns & mannerisms",x.speech);sec("Sample dialogue",rv(x.voice).split("\n").filter(l=>l.trim()).map(l=>"- "+l.replace(/^\s*[-*•]\s+/,"").trim()).join("\n"));sec("Other notes",x.notes);
 return o.join("\n")}
const charsExport=()=>"# Characters: "+(P.name||"Untitled novel")+"\n\n"+P.characters.map(charExport).join("\n\n")+"\n";
/* ---- per-character JSON (AI export / import) ---- */
const CJ_MAP={name:"name",role:"role",background:"history",physicalDescription:"look",personality:"personality",otherRelationships:"relationships",speechAndMannerisms:"speech",sampleDialogue:"voice",notes:"notes"};
const CJ_README="Amend or complete this character and return ONLY the full JSON object with the same keys and no commentary. Keep existing content unless asked to change it. relationships[].with must be the exact name of another character. secrets[].knownBy lists other characters' exact names; fromChapter is a chapter number or null. development.stages[].chapter is a chapter number or null. Ignore keys starting with underscore.";
function charJSON(x){
 return{
  _readme:CJ_README,
  _otherCharacters:P.characters.filter(o=>o.id!==x.id&&o.name).map(o=>o.name),
  _chapters:P.chapters.map((c,n)=>({number:n+1,title:c.title})),
  name:x.name||"",role:x.role||"",
  background:rv(x.history),physicalDescription:rv(x.look),personality:rv(x.personality),
  relationships:relsOf(x.id).map(r=>({with:cName(r.a===x.id?r.b:r.a),label:rv(r.label)})),
  otherRelationships:rv(x.relationships),
  secrets:(x.secretList||[]).filter(s=>rv(s.text)).map(s=>{const fi=chIdx(s.from);return{text:rv(s.text),knownBy:(s.known||[]).map(cName).filter(Boolean),fromChapter:fi>=0?fi+1:null}}),
  development:{arc:rv(x.development),stages:(x.stages||[]).filter(s=>rv(s.text)).map(s=>{const n=chIdx(s.chap);return{chapter:n>=0?n+1:null,text:rv(s.text)}})},
  speechAndMannerisms:rv(x.speech),sampleDialogue:rv(x.voice),notes:rv(x.notes)
 }}
function parseCharJSON(txt){
 const t=String(txt||"").trim().replace(/^```[a-z]*\s*/i,"").replace(/```\s*$/,"").trim(),a=t.indexOf("{"),b=t.lastIndexOf("}"),errs=[];
 if(a<0||b<a)return{errs:["No JSON object found."]};
 let j;try{j=JSON.parse(t.slice(a,b+1))}catch(e){return{errs:["Not valid JSON ("+e.message+")."]}}
 if(!j||typeof j!=="object"||Array.isArray(j))return{errs:["Expected one JSON object for a single character."]};
 const str=(k,v)=>{if(v==null)return"";if(Array.isArray(v)&&v.every(s=>typeof s==="string"))return v.join("\n").trim();if(typeof v==="object"){errs.push('"'+k+'" must be text');return""}return String(v).trim()};
 const lst=(k,v)=>{if(v==null)return[];if(Array.isArray(v))return v;errs.push('"'+k+'" must be a list');return[]};
 const chn=(k,v)=>{if(v==null||v==="")return null;const n=+v;if(Number.isInteger(n)&&n>=1)return n;errs.push('"'+k+'" must be a chapter number (1, 2, 3…) or null');return null};
 const pickKey=(o,keys)=>{if(!o||typeof o!=="object")return undefined;const l=Object.keys(o);for(const k of keys){const m=l.find(x=>x.toLowerCase()===k.toLowerCase());if(m!==undefined&&o[m]!=null&&o[m]!=="")return o[m]}return undefined};
 const pickText=o=>{if(!o||typeof o!=="object"||Array.isArray(o))return"";
  const v=pickKey(o,["text","secret","description","content","note","notes","summary","details","detail","stage","state","entry","value"]);
  if(typeof v==="string"&&v.trim())return v.trim();
  const skip=/^(knownby|known_by|alsoknownby|knownto|fromchapter|from_chapter|knownfromchapter|chapter|chapternumber|chapter_number|with|label|id|name|title)$/i;
  let best="";for(const k in o){if(!skip.test(k)&&typeof o[k]==="string"&&o[k].trim().length>best.length)best=o[k].trim()}
  return best};
 const keysOf=s=>s&&typeof s==="object"&&!Array.isArray(s)?(Object.keys(s).join(", ")||"none"):typeof s;
 const d={};
 Object.keys(CJ_MAP).forEach(k=>{if(k in j)d[CJ_MAP[k]]=str(k,j[k])});
 if("name" in j&&!d.name)errs.push('"name" cannot be empty');
 if("relationships" in j)d.rels=lst("relationships",j.relationships).map((r,i)=>{
  if(typeof r==="string"){const p=parseRel(r);return p||null}
  if(!r||typeof r!=="object"||typeof r.with!=="string"||!r.with.trim()){errs.push("relationships["+i+'] needs a "with" name');return null}
  return{who:r.with.trim(),label:str("relationships["+i+"].label",r.label)}}).filter(Boolean);
 if("secrets" in j)d.secrets=lst("secrets",j.secrets).map((s,i)=>{
  if(typeof s==="string")s={text:s};
  const st=pickText(s);
  if(!st){errs.push("secrets["+i+'] has no secret text (keys found: '+keysOf(s)+")");return null}
  const kbr=pickKey(s,["knownBy","known_by","alsoKnownBy","knownTo"]);let kb=[];
  if(typeof kbr==="string")kb=kbr.split(/\s*(?:,|;|&|\band\b)\s*/).map(x=>x.trim()).filter(Boolean);
  else if(Array.isArray(kbr))kb=kbr.map(x=>typeof x==="string"?x:(x&&x.name)).filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim());
  else if(kbr!=null)errs.push("secrets["+i+"].knownBy must be a list of names");
  return{text:st,known:kb,from:chn("secrets["+i+"].fromChapter",pickKey(s,["fromChapter","from_chapter","knownFromChapter","chapter"]))}}).filter(Boolean);
 if("development" in j){const v=j.development;
  if(typeof v==="string")d.development=v.trim();
  else if(v&&typeof v==="object"&&!Array.isArray(v)){
   if("arc" in v)d.development=str("development.arc",v.arc);
   if("stages" in v)d.stages=lst("development.stages",v.stages).map((s,i)=>{
    if(typeof s==="string")s={text:s};
    const st=pickText(s);
    if(!st){errs.push("development.stages["+i+'] has no description (keys found: '+keysOf(s)+")");return null}
    return{n:chn("development.stages["+i+"].chapter",pickKey(s,["chapter","chapterNumber","chapter_number","fromChapter","ch"])),text:st}}).filter(Boolean)}
  else if(v!=null)errs.push('"development" must be an object with "arc" and "stages"')}
 return{d,errs}}
function applyCharJSON(c,d){
 const warn=[];let nRel=0;
 Object.keys(CJ_MAP).map(k=>CJ_MAP[k]).forEach(f=>{if(f in d)c[f]=d[f]});
 if(d.rels){
  P.rels=P.rels.filter(r=>r.a!==c.id&&r.b!==c.id);const seen=new Set(),loose=[];
  d.rels.forEach(r=>{const o=resolveChar(r.who);
   if(o&&o.id!==c.id&&!seen.has(o.id)){seen.add(o.id);P.rels.push({id:uid(),a:c.id,b:o.id,label:r.label||""});nRel++}
   else loose.push(r.who+(r.label?" – "+r.label:""))});
  if(loose.length){c.relationships=[rv(c.relationships),...loose].filter(Boolean).join("\n");warn.push(loose.length+" relationship(s) had no matching character and were kept as plain notes")}}
 if(d.secrets)c.secretList=d.secrets.map(s=>{const kn=[],un=[];
  s.known.forEach(n=>{const o=resolveChar(n);o&&o.id!==c.id?kn.push(o.id):un.push(n)});
  const ch=s.from?P.chapters[s.from-1]:null;if(s.from&&!ch)warn.push("a secret referred to chapter "+s.from+", which doesn't exist (set to known from the start)");
  return{id:uid(),text:s.text+(un.length?" (also known by "+un.join(", ")+")":""),known:[...new Set(kn)],from:ch?ch.id:""}});
 if(d.stages)c.stages=d.stages.map(s=>{const ch=s.n?P.chapters[s.n-1]:null;if(s.n&&!ch)warn.push("a stage referred to chapter "+s.n+", which doesn't exist");return{id:uid(),chap:ch?ch.id:"",text:(s.n&&!ch?"Chapter "+s.n+": ":"")+s.text}});
 return"Replaced “"+(c.name||"Unnamed")+"” from JSON"+(d.rels?" · "+nRel+" relationship"+(nRel===1?"":"s")+" linked":"")+(d.secrets?" · "+d.secrets.length+" secret"+(d.secrets.length===1?"":"s"):"")+(d.stages?" · "+d.stages.length+" stage"+(d.stages.length===1?"":"s"):"")+"."+(warn.length?"\nNote: "+[...new Set(warn)].join("; ")+".":"")}
function cjExport(){
 const c=P.characters.find(x=>x.id===curChar);if(!c)return;
 cjTxt=JSON.stringify(charJSON(c),null,2);cjMsg="";render();
 copyOut(cjTxt,"Character JSON copied. Paste it into your AI.")}
async function cjImport(){
 const c=P.characters.find(x=>x.id===curChar);if(!c)return;
 let txt=cjTxt;
 if(!txt.trim()){try{txt=await navigator.clipboard.readText()}catch(e){}}
 if(!txt.trim()){cjMsg="Not imported: paste the AI's JSON into the box first.";return render()}
 const r=parseCharJSON(txt);
 if(r.errs.length){cjTxt=txt;cjMsg="Not imported. Nothing was changed.\n- "+r.errs.join("\n- ");return render()}
 if(!await ask("Replace “"+(c.name||"Unnamed")+"” with this JSON? Keys left out of the JSON are kept; everything present overwrites.")){cjTxt=txt;return render()}
 cjMsg=applyCharJSON(c,r.d);cjTxt="";save();render()}
function cjPanel(c){
 if(cjFor!==c.id){cjTxt="";cjMsg="";cjFor=c.id}
 return`<details class="box" ${cjTxt||cjMsg?"open":""}><summary><b>AI JSON</b> <span class="mute">export this character, let an AI amend it, import it back</span></summary><div class="row" style="margin-top:8px"><button class="pri" data-act="cjexport" draggable="true" data-cjdrag="1" title="Click to copy the JSON, or drag this button into Claude / ChatGPT" style="cursor:grab">AI export (click to copy, or drag)</button><button data-act="cjimport">AI import (replace this character)</button></div><textarea id="cj" rows="8" style="font-family:ui-monospace,Menlo,monospace;font-size:13px" placeholder="Exported JSON appears here. Paste the AI's amended JSON here, then click 2. Import AI's JSON (or leave empty to import straight from the clipboard).">${esc(cjTxt)}</textarea>${cjMsg?`<div class="box ${cjMsg.startsWith("Not imported")?"warn":""}" style="margin-top:8px;white-space:pre-wrap">${esc(cjMsg)}</div>`:""}</details>`}
/* ---- project plan JSON (AI export / import). Fills the Project page boxes. Beats merge by label, threads by name; nothing is deleted. ---- */
let pjTxt="",pjMsg="";
const PJ_README="Complete or amend this project plan and return ONLY the full JSON object with the same keys and no commentary. Keep existing content unless asked to change it. genre must be one of _genreOptions (or leave it empty and use genreCustom). framework must be one of _frameworkOptions. beats[].chapter and threads[].opensChapter / paysOffChapter are chapter numbers (1, 2, 3…) or null. thread type must be one of _threadTypes and status one of _threadStatuses. endingMode is \"hold\" or \"all\". Keep every existing beat and thread, and keep each beat label and thread name exactly as given so it updates in place; add new ones as new entries. Ignore keys starting with underscore.";
function projJSON(){
 const pl=P.plot,cn=id=>{const n=chIdx(id);return n>=0?n+1:null};
 return{
  _readme:PJ_README,
  _genreOptions:GENRES,_frameworkOptions:Object.keys(FRAMEWORKS),_threadTypes:THREAD_TYPES,_threadStatuses:THREAD_STATUS,
  _chapters:P.chapters.map((c,n)=>({number:n+1,title:c.title,act:c.act})),
  title:P.name||"",subtitle:rv(P.subtitle),genre:P.genre||"",genreCustom:rv(P.genreCustom),targetWords:+P.target||0,
  strapline:rv(P.strapline),plotInBrief:rv(pl.short),centralQuestion:rv(pl.question),themes:rv(pl.themes),
  acts:{act1:rv(pl.acts[1]),act2:rv(pl.acts[2]),act3:rv(pl.acts[3])},
  framework:pl.fw,
  beats:pl.beats.map(b=>({label:rv(b.label),text:rv(b.text),chapter:cn(b.chap)})),
  threads:pl.threads.map(t=>({name:rv(t.name),type:t.type,status:t.status,opensChapter:cn(t.setup),paysOffChapter:cn(t.payoff),notes:rv(t.notes)})),
  ending:rv(pl.ending),endingMode:pl.endingMode==="all"?"all":"hold",
  synopsis:rv(P.synopsis)}}
function parseProjJSON(txt){
 const t=String(txt||"").trim().replace(/^```[a-z]*\s*/i,"").replace(/```\s*$/,"").trim(),a=t.indexOf("{"),b=t.lastIndexOf("}"),errs=[];
 if(a<0||b<a)return{errs:["No JSON object found."]};
 let j;try{j=JSON.parse(t.slice(a,b+1))}catch(e){return{errs:["Not valid JSON ("+e.message+")."]}}
 if(!j||typeof j!=="object"||Array.isArray(j))return{errs:["Expected one JSON object."]};
 const str=(k,v)=>{if(v==null)return"";if(Array.isArray(v)&&v.every(s=>typeof s==="string"))return v.join("\n").trim();if(typeof v==="object"){errs.push('"'+k+'" must be text');return""}return String(v).trim()};
 const chn=(k,v)=>{if(v==null||v==="")return null;const n=+v;if(Number.isInteger(n)&&n>=1)return n;errs.push('"'+k+'" must be a chapter number or null');return null};
 const lst=(k,v)=>{if(Array.isArray(v))return v;errs.push('"'+k+'" must be a list');return[]};
 const pick=(v,opts,def)=>opts.find(o=>o.toLowerCase()===String(v||"").trim().toLowerCase())||def;
 const d={};
 [["title","name"],["subtitle","subtitle"],["genreCustom","genreCustom"],["strapline","strapline"],["plotInBrief","short"],["centralQuestion","question"],["themes","themes"],["ending","ending"],["synopsis","synopsis"]].forEach(([k,f])=>{if(k in j)d[f]=str(k,j[k])});
 if("title" in j&&!d.name)errs.push('"title" cannot be empty');
 if("genre" in j){const g=String(j.genre||"").trim();if(!g)d.genre="";else{const m=pick(g,GENRES,null);if(m)d.genre=m;else{d.genre="Other (custom)";if(!("genreCustom" in j))d.genreCustom=g}}}
 if("targetWords" in j){const n=+j.targetWords;if(Number.isFinite(n)&&n>0)d.target=Math.round(n);else errs.push('"targetWords" must be a positive number')}
 if(j.acts&&typeof j.acts==="object"){d.acts={};[1,2,3].forEach(n=>{const k="act"+n;if(k in j.acts)d.acts[n]=str("acts."+k,j.acts[k])})}
 if("framework" in j){const f=pick(j.framework,Object.keys(FRAMEWORKS),null);f?d.fw=f:errs.push('"framework" must be one of '+Object.keys(FRAMEWORKS).join(", "))}
 if("endingMode" in j)d.endingMode=String(j.endingMode).toLowerCase()==="all"?"all":"hold";
 if("beats" in j)d.beats=lst("beats",j.beats).map((x,i)=>{if(!x||typeof x!=="object"||!(rv(x.label)||rv(x.text))){errs.push("beats["+i+"] needs a label or text");return null}
  return{label:str("beats["+i+"].label",x.label),text:str("beats["+i+"].text",x.text),n:chn("beats["+i+"].chapter",x.chapter)}}).filter(Boolean);
 if("threads" in j)d.threads=lst("threads",j.threads).map((x,i)=>{if(!x||typeof x!=="object"||!rv(x.name)){errs.push("threads["+i+'] needs a "name"');return null}
  return{name:str("name",x.name),type:pick(x.type,THREAD_TYPES,"Subplot"),status:pick(x.status,THREAD_STATUS,"Planned"),s:chn("threads["+i+"].opensChapter",x.opensChapter),p:chn("threads["+i+"].paysOffChapter",x.paysOffChapter),notes:str("notes",x.notes)}}).filter(Boolean);
 return{d,errs}}
function applyProjJSON(d,makeCh){
 const pl=P.plot,warn=[],norm=s=>rv(s).toLowerCase().replace(/\s+/g," ");
 let bAdd=0,bUpd=0,tAdd=0,tUpd=0;
 if(makeCh){const mx=Math.max(0,...(d.beats||[]).map(b=>b.n||0),...(d.threads||[]).flatMap(t=>[t.s||0,t.p||0]));
  const cur=P.chapters[P.chapters.length-1];
  while(P.chapters.length<mx)P.chapters.push({id:uid(),title:"Chapter "+(P.chapters.length+1),act:(cur&&cur.act)||1,target:P.ai.chapterWords||3000,status:"Planned",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:"Past",summary:"",beats:"",text:"",versions:[],scenes:[]})}
 if("name" in d)P.name=d.name;
 ["subtitle","genre","genreCustom","strapline","synopsis","target"].forEach(k=>{if(k in d)P[k]=d[k]});
 ["short","question","themes","ending","fw","endingMode"].forEach(k=>{if(k in d)pl[k]=d[k]});
 if(d.acts)Object.keys(d.acts).forEach(n=>pl.acts[n]=d.acts[n]);
 /* chapter number -> id. null/0 returns undefined, meaning "no change" */
 const ch=n=>{if(!n)return undefined;const c=P.chapters[n-1];if(!c){warn.push("chapter "+n+" doesn't exist");return undefined}return c.id};
 (d.beats||[]).forEach(b=>{
  const ex=pl.beats.find(x=>norm(x.label)&&norm(x.label)===norm(b.label)),cid=ch(b.n);
  if(ex){if(rv(b.text))ex.text=b.text;if(cid!==undefined)ex.chap=cid;bUpd++}
  else{pl.beats.push({id:uid(),label:b.label,text:b.text,chap:cid||""});bAdd++}});
 (d.threads||[]).forEach(t=>{
  const ex=pl.threads.find(x=>norm(x.name)===norm(t.name)),s=ch(t.s),p=ch(t.p);
  if(ex){ex.type=t.type;ex.status=t.status;if(rv(t.notes))ex.notes=t.notes;if(s!==undefined)ex.setup=s;if(p!==undefined)ex.payoff=p;tUpd++}
  else{pl.threads.push({id:uid(),name:t.name,type:t.type,status:t.status,setup:s||"",payoff:p||"",notes:t.notes});tAdd++}});
 const part=(n,u,a)=>n||u?" · "+n+" "+a+(n===1?"":"s")+" ("+u+" updated, "+(n-u)+" new)":"";
 return"Project updated from JSON"+(d.beats?part(bAdd+bUpd,bUpd,"beat"):"")+(d.threads?part(tAdd+tUpd,tUpd,"thread"):"")+"."+(warn.length?"\nNote: "+[...new Set(warn)].join("; ")+" (left as it was).":"")}
function pjExport(){pjTxt=JSON.stringify(projJSON(),null,2);pjMsg="";render();copyOut(pjTxt,"Project JSON copied. Paste it into your AI.")}
async function pjImport(){
 let txt=pjTxt;
 if(!txt.trim()){try{txt=await navigator.clipboard.readText()}catch(e){}}
 if(!txt.trim()){pjMsg="Not imported: paste the AI's JSON (or upload the file) first.";return render()}
 const r=parseProjJSON(txt);
 if(r.errs.length){pjTxt=txt;pjMsg="Not imported. Nothing was changed.\n- "+r.errs.join("\n- ");return render()}
 const d=r.d,mx=Math.max(0,...(d.beats||[]).map(b=>b.n||0),...(d.threads||[]).flatMap(t=>[t.s||0,t.p||0]));
 if(!await ask("Fill the Project page from this JSON? Fields present in the JSON overwrite what is there; fields left out are kept. Beats are matched by label and threads by name: matches are updated, new ones are added, and nothing is deleted.",{ok:"Apply"})){pjTxt=txt;return render()}
 let makeCh=false;
 if(mx>P.chapters.length)makeCh=await ask("The JSON refers to chapter "+mx+" but you only have "+P.chapters.length+". Create empty Planned chapters up to "+mx+" so beats and threads can be pinned to them?",{ok:"Create chapters",cancel:"Leave unset"});
 pjMsg=applyProjJSON(d,makeCh);pjTxt="";save();render()}
function pjPanel(){
 return`<details class="box" ${pjTxt||pjMsg?"open":""}><summary><b>AI JSON</b> <span class="mute">export this project plan, let an AI complete it, import it back</span></summary><div class="row" style="margin-top:8px"><button class="pri" data-act="pjexport">AI export (copy JSON)</button><button data-act="pjimport">AI import (fill the boxes)</button><label class="mute" style="flex:none">Upload .json <input type="file" id="pjfile" accept=".json,.txt,application/json"></label></div><textarea id="pj" rows="8" style="font-family:ui-monospace,Menlo,monospace;font-size:13px" placeholder="Exported JSON appears here. Paste the AI's completed JSON here, then click AI import (or leave empty to import from the clipboard).">${esc(pjTxt)}</textarea>${pjMsg?`<div class="box ${pjMsg.startsWith("Not imported")?"warn":""}" style="margin-top:8px;white-space:pre-wrap">${esc(pjMsg)}</div>`:""}</details>`}
/* ---- whole-book blueprint JSON: project + characters + places & lore + chapter plan. Planning only: no prose, no images. Nothing is ever deleted. ---- */
let bpTxt="",bpMsg="";
const BP_README=`Fill in this story blueprint and return ONLY the full JSON object with the same keys and no commentary or code fences. This is planning only: do NOT write chapter prose and do NOT include images. Keep everything already filled in unless asked to change it. Keep every character name, place name, beat label, thread name and chapter number exactly as given so it updates in place; add anything new as a new entry (follow _characterTemplate and _placeTemplate). CHARACTERS: complete every field for each character (background, physicalDescription, personality, relationships using exact character names, secrets, development stages tied to chapter numbers, speechAndMannerisms, sampleDialogue); tier is major, minor or unnamed. PLACES: places, objects, factions and lore rules, each with notes and look; type is one of _options.placeTypes or a custom type. PROJECT: complete every field, using only the _options values for genre, framework, thread type and status. CHAPTERS: keep the chapters array in order and complete every chapter: summary (100 to 150 words: what happens, what changes, what the reader learns), beats (3 to 6 short lines, in order), pov (exact character name), place (exact place name), time, majorCharacters and minorCharacters (exact character names), and SCENES: every chapter must have 2 to 5 scenes in its scenes array (follow _sceneTemplate). Scenes run in order and together deliver the chapter summary and beats, and every beat must land in a scene. Each scene has a title, pov (exact character name), characters (list of exact character names), place (exact place name), time, and a summary of 40 to 80 words covering the scene's objective, the conflict, and the outcome or turn that hands over to the next scene. Short chapters get 2 scenes, major set pieces up to 5. Never leave the scenes array empty, and never put prose in a scene summary. The chapters array has exactly _chapterCount entries (numbered 1 to _chapterCount). Return exactly that many chapters, with the same numbers. Do not add, split, merge or remove chapters unless the author explicitly asks for a different number. Every chapter number used elsewhere (project beats chapter, threads opensChapter and paysOffChapter, secrets fromChapter, development stages chapter) refers to a chapter's number field. FOR A NEW PROJECT (_chapterCount is 27) use the Save the Cat framework across the 27 chapters given (9 per act: chapters 1 to 9 are Act 1, 10 to 18 Act 2, 19 to 27 Act 3) and pin each of the 15 beats to the single chapter where it begins. As a guide, adjust to fit the story: Opening Image 1, Theme Stated 2, Set-up 3, Catalyst 5, Debate 6, Break into Two 9, B Story 10, Fun and Games 11, Midpoint 14, Bad Guys Close In 15, All Is Lost 17, Dark Night of the Soul 18, Break into Three 19, Finale 20, Final Image 27. PARTIAL BLUEPRINTS: fields that already have text are the author's, so keep them unless the author asks you to change them. bible.voice is the Voice & Style Bible and the most important document in the blueprint, because every chapter is written from it: follow _voiceFormat exactly and base it on voiceSample. bible.structure is the author's structure guide: draft it if empty, otherwise keep it. Ignore bible.novel and bible.world (they are generated from the forms).`;
const VOICE_FORMAT="bible.voice must be a complete Voice & Style Bible in Markdown, built from voiceSample (the author's own prose). Include: (1) a table with one row per category (Narrative voice, Sentence construction, Vocabulary, Description, Humour, Dialogue, Pacing, Characterisation, Metaphors, Reader relationship), each cell a specific finding backed by a short quoted phrase from voiceSample, never a generic label; (2) a section '## Rules for the writer' with 10 to 15 imperative, checkable rules that a writer who has not seen the sample could follow (for example 'Open scenes mid-action, never with weather'); (3) a section '## Things to avoid' listing the habits, words and constructions this author would not use. If voiceSample is empty, draft the guide from what the author said in the brainstorm and start it with the line 'Drafted without a writing sample'. If bible.voice already holds real content, keep it and only fill what is missing.";
const voiceIsTemplate=()=>rv(P.bible.voice).replace(/^#.*$/gm,"").trim().length<40||/Paste your own chapter in the first chapter/.test(P.bible.voice);
/* up to ~1500 words of the author's own prose, from the earliest chapters that have text */
function voiceSample(){let out=[],n=0;for(const c of P.chapters){const t=rv(c.text);if(!t)continue;const take=[];for(const para of t.split(/\n+/).map(x=>x.trim()).filter(Boolean)){take.push(para);n+=wc(para);if(n>=1500)break}out.push(take.join("\n\n"));if(n>=1500)break}return out.join("\n\n* * *\n\n")}
const BP_PROMPT="Using everything we have agreed in this conversation, fill in the story blueprint JSON below. Follow the instructions in its _readme key. Return only the completed JSON.";
const bpCsv=v=>rv(v).split(",").map(s=>s.trim()).filter(Boolean);
/* a brand-new project: one empty chapter and nothing written */
const bpFresh=()=>{const c=P.chapters[0];return P.chapters.length<=1&&!!c&&!rv(c.text)&&!rv(c.summary)&&!rv(c.beats)&&!(c.scenes||[]).length};
function bpChapter(c,n){
 const lc=(P.locations||[]).find(x=>x.id===c.loc);
 return{number:n+1,title:c.title||"",act:+c.act||1,targetWords:+c.target||0,pov:cName(c.pov),place:lc?lc.name:rv(c.place),time:rv(c.time),tense:c.tense||"Past",
  majorCharacters:bpCsv(c.major),minorCharacters:bpCsv(c.minor),summary:rv(c.summary),beats:rv(c.beats).split("\n").map(s=>s.trim()).filter(Boolean),
  scenes:(c.scenes||[]).map(s=>({title:rv(s.title),pov:rv(s.pov),characters:bpCsv(s.chars),place:rv(s.place),time:rv(s.time),summary:rv(s.summary)})),...(bpWithText&&rv(c.text)?{text:c.text.trim()}:{})}}
function blueprintJSON(){
  const fresh=bpFresh(), pj=projJSON(), proj={};
  Object.keys(pj).filter(k=>!k.startsWith("_")).forEach(k=>proj[k]=pj[k]);
  if(fresh){proj.framework="savecat";if(!proj.beats.length)proj.beats=FRAMEWORKS.savecat.beats.map(l=>({label:l,text:"",chapter:null}))}
  const chapters=fresh?Array.from({length:27},(_,n)=>({number:n+1,title:"Chapter "+(n+1),act:Math.floor(n/9)+1,targetWords:P.ai.chapterWords||3000,pov:"",place:"",time:"",tense:"Past",majorCharacters:[],minorCharacters:[],summary:"",beats:[],scenes:[{title:"",pov:"",characters:[],place:"",time:"",summary:""}]})):P.chapters.map(bpChapter);
  const chars=P.characters.filter(x=>x.name).map(x=>{const j=charJSON(x),o={name:j.name,role:j.role,tier:x.tier||"major"};["_readme","_otherCharacters","_chapters"].forEach(k=>delete j[k]);return Object.assign(o,j)});
  const places=(P.locations||[]).filter(x=>x.name).map(x=>({name:x.name,type:x.type||"Place",notes:rv(x.notes),look:rv(x.look)}));
 return{
  _readme:BP_README,
  _chapterCount:chapters.length,
  _options:{genres:GENRES,frameworks:Object.keys(FRAMEWORKS),threadTypes:THREAD_TYPES,threadStatuses:THREAD_STATUS,characterTiers:TIERS.map(t=>t[0]),placeTypes:PT},
  _characterTemplate:{name:"",role:"",tier:"major",background:"",physicalDescription:"",personality:"",relationships:[{with:"Another character's exact name",label:"One line about the bond"}],otherRelationships:"",secrets:[{text:"",knownBy:[],fromChapter:null}],development:{arc:"",stages:[{chapter:null,text:""}]},speechAndMannerisms:"",sampleDialogue:"",notes:""},
  _placeTemplate:{name:"",type:"Place",notes:"",look:""},
  _sceneTemplate:{title:"",pov:"Exact character name",characters:["Exact character names"],place:"Exact place name",time:"",summary:"Objective, conflict, and outcome or turn (40 to 80 words)"},
  _voiceFormat:VOICE_FORMAT,
  voiceSample:bpWithText?"":voiceSample(),
  bible:{
    novel:    rv(P.bible.novel)     || "",
    world:    rv(P.bible.world)     || "",
    structure:rv(P.bible.struct)    || "",
    voice:    rv(P.bible.voice)     || "",
    master:   rv(P.master)          || ""
  },
  style:{blacklist:rv(P.style.blacklist)},
  project:proj,characters:chars,places,chapters}}
function parseBlueprint(txt){
 const t=String(txt||"").trim().replace(/^```[a-z]*\s*/i,"").replace(/```\s*$/,"").trim(),a=t.indexOf("{"),b=t.lastIndexOf("}"),errs=[];
 if(a<0||b<a)return{errs:["No JSON object found."]};
 let j;try{j=JSON.parse(t.slice(a,b+1))}catch(e){return{errs:["Not valid JSON ("+e.message+")."]}}
 if(!j||typeof j!=="object"||Array.isArray(j))return{errs:["Expected one JSON object."]};
 const places=j.places||j.locations;
 if(!j.project&&!j.characters&&!places&&!j.chapters)return{errs:["Found none of the keys project, characters, places or chapters."]};
 const d={project:null,chars:[],places:[],chapters:[]};
 const str=v=>v==null?"":(Array.isArray(v)?v.filter(s=>typeof s==="string").join("\n"):typeof v==="object"?"":String(v)).trim();
 const names=v=>Array.isArray(v)?v.map(s=>typeof s==="string"?s.trim():(s&&s.name?String(s.name).trim():"")).filter(Boolean).join(", "):str(v);
 const pick=(v,opts)=>opts.find(o=>o.toLowerCase()===String(v||"").trim().toLowerCase())||"";
 const list=(k,v)=>{if(v==null)return[];if(Array.isArray(v))return v;errs.push('"'+k+'" must be a list');return[]};
 if(j.project!=null){if(typeof j.project!=="object"||Array.isArray(j.project))errs.push('"project" must be an object');else{const r=parseProjJSON(JSON.stringify(j.project));r.errs.forEach(e=>errs.push("project: "+e));if(r.d)d.project=r.d}}
 list("characters",j.characters).forEach((x,i)=>{
  if(!x||typeof x!=="object"||Array.isArray(x)||!rv(x.name)){errs.push("characters["+i+'] needs a "name"');return}
  const r=parseCharJSON(JSON.stringify(x));
  r.errs.forEach(e=>errs.push("characters["+i+"] ("+x.name+"): "+e));
  if(r.d)d.chars.push({d:r.d,tier:pick(x.tier,TIERS.map(q=>q[0]))})});
 list("places",places).forEach((x,i)=>{
  if(!x||typeof x!=="object"||!rv(x.name)){errs.push("places["+i+'] needs a "name"');return}
  const ty=str(x.type);d.places.push({name:str(x.name),type:ty&&(pick(ty,PT)||ty),notes:str(x.notes),look:str(x.look)})});
 const seen=new Set();
 list("chapters",j.chapters).forEach((x,i)=>{
  if(!x||typeof x!=="object"||Array.isArray(x)){errs.push("chapters["+i+"] must be an object");return}
  const n=x.number==null||x.number===""?i+1:+x.number;
  if(!Number.isInteger(n)||n<1||n>300){errs.push("chapters["+i+'] has an invalid "number"');return}
  if(seen.has(n)){errs.push("chapter number "+n+" appears twice");return}seen.add(n);
  const c={n,title:str(x.title),pov:str(x.pov),place:str(x.place),time:str(x.time),summary:str(x.summary),major:names(x.majorCharacters),minor:names(x.minorCharacters)};
  if(x.act!=null&&x.act!==""){const ac=+x.act;if([1,2,3].includes(ac))c.act=ac;else errs.push("chapter "+n+': "act" must be 1, 2 or 3')}
  if(x.targetWords!=null&&x.targetWords!==""){const w=+x.targetWords;if(Number.isFinite(w)&&w>0)c.target=Math.round(w);else errs.push("chapter "+n+': "targetWords" must be a positive number')}
  const te=pick(x.tense,["Past","Present"]);if(te)c.tense=te;if(typeof x.text==="string"&&x.text.trim())c.text=x.text.trim();
  c.beats=Array.isArray(x.beats)?x.beats.map(s=>String(typeof s==="string"?s:(s&&s.text)||"").replace(/^\s*(?:[-*•]|\d+[.)])\s+/,"").trim()).filter(Boolean).join("\n"):str(x.beats);
  c.scenes=list("chapters["+i+"].scenes",x.scenes).map(s=>s&&typeof s==="object"?{title:str(s.title),pov:str(s.pov),chars:names(s.characters),place:str(s.place),time:str(s.time),summary:str(s.summary)}:null).filter(s=>s&&(s.title||s.summary));
  d.chapters.push(c)});
 if(j.bible&&typeof j.bible==="object"&&!Array.isArray(j.bible)){d.bible={};[["voice","voice"],["structure","struct"],["master","master"]].forEach(([k,f])=>{const v=str(j.bible[k]);if(v)d.bible[f]=v})}
 return{d,errs}}
function applyBlueprint(d,withText){
 const norm=s=>rv(s).toLowerCase().replace(/\s+/g," "),n={chNew:0,chUpd:0,cNew:0,cUpd:0,pNew:0,pUpd:0,txt:0},warn=[];
 P.locations=P.locations||[];
 /* 1. places & lore */
 d.places.forEach(p=>{let o=P.locations.find(x=>norm(x.name)===norm(p.name));
  if(!o){o={id:uid(),name:p.name,type:"Place",notes:"",look:"",img:"",svg:""};P.locations.push(o);n.pNew++}else n.pUpd++;
  if(p.type)o.type=p.type;if(p.notes)o.notes=p.notes;if(p.look)o.look=p.look});
 /* 2. character shells, so names resolve everywhere below */
 const cmap=d.chars.map(c=>{let o=P.characters.find(x=>norm(x.name)===norm(c.d.name));
  if(!o){o=newChar();o.name=c.d.name;P.characters.push(o);n.cNew++}else n.cUpd++;
  if(c.tier)o.tier=c.tier;return o});
 /* 3. chapters: create up to the highest number, then fill. Prose (text) is never touched. */
 const before=P.chapters.length,mx=Math.max(0,...d.chapters.map(c=>c.n));
 while(P.chapters.length<mx){const k=P.chapters.length,l=P.chapters[k-1];P.chapters.push({id:uid(),title:"Chapter "+(k+1),act:(l&&l.act)||1,target:P.ai.chapterWords||3000,status:"Planned",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:(l&&l.tense)||"Past",summary:"",beats:"",text:"",versions:[],scenes:[]});n.chNew++}
 d.chapters.forEach(x=>{const c=P.chapters[x.n-1];if(x.n<=before)n.chUpd++;
  if(x.title)c.title=x.title;if(x.act)c.act=x.act;if(x.target)c.target=x.target;if(x.tense)c.tense=x.tense;
  if(x.time)c.time=x.time;if(x.summary)c.summary=x.summary;if(x.beats)c.beats=x.beats;if(x.major)c.major=x.major;if(x.minor)c.minor=x.minor;
  if(x.pov){const o=resolveChar(x.pov);if(o)c.pov=o.id;else warn.push("chapter "+x.n+" POV “"+x.pov+"” has no character profile")}
  if(x.place){const l=P.locations.find(q=>norm(q.name)===norm(x.place));if(l){c.loc=l.id;c.place=l.name}else c.place=x.place}
  if(x.scenes.length)c.scenes=x.scenes;if(withText&&x.text&&x.text!==rv(c.text)){c.versions=c.versions||[];if(rv(c.text))c.versions.unshift({t:Date.now(),text:c.text,note:"Before bridge import"});c.versions=c.versions.slice(0,40);c.text=x.text;if(c.status==="Planned"||c.status==="Drafting")c.status="Drafted";n.txt++}});
 /* 4. character details (chapters now exist, so stages and secrets can be pinned). Merge: nothing is removed. */
 d.chars.forEach((cc,i)=>{const o=cmap[i],q=cc.d;
  ["role","history","look","personality","relationships","speech","voice","notes","development"].forEach(k=>{if(q[k])o[k]=q[k]});
  (q.rels||[]).forEach(r=>{const t=resolveChar(r.who);
   if(t&&t.id!==o.id){const ex=P.rels.find(z=>(z.a===o.id&&z.b===t.id)||(z.a===t.id&&z.b===o.id));if(ex){if(r.label)ex.label=r.label}else P.rels.push({id:uid(),a:o.id,b:t.id,label:r.label||""})}
   else{const line=r.who+(r.label?" – "+r.label:"");if(!rv(o.relationships).includes(line))o.relationships=[rv(o.relationships),line].filter(Boolean).join("\n");warn.push("“"+r.who+"” has no character profile (kept as a plain note on "+o.name+")")}});
  (q.secrets||[]).forEach(s=>{const kn=[],un=[];s.known.forEach(nm=>{const t=resolveChar(nm);t&&t.id!==o.id?kn.push(t.id):un.push(nm)});
   const ch=s.from?P.chapters[s.from-1]:null;if(s.from&&!ch)warn.push("a secret referred to chapter "+s.from+", which doesn't exist");
   const text=s.text+(un.length?" (also known by "+un.join(", ")+")":""),ex=o.secretList.find(z=>norm(z.text)===norm(text)||norm(z.text)===norm(s.text));
   if(ex){ex.known=[...new Set([...(ex.known||[]),...kn])];if(ch)ex.from=ch.id}
   else o.secretList.push({id:uid(),text,known:[...new Set(kn)],from:ch?ch.id:""})});
  (q.stages||[]).forEach(s=>{const ch=s.n?P.chapters[s.n-1]:null;if(s.n&&!ch)warn.push("a stage referred to chapter "+s.n+", which doesn't exist");
   const ex=ch?o.stages.find(z=>z.chap===ch.id):o.stages.find(z=>!z.chap&&norm(z.text)===norm(s.text));
   if(ex)ex.text=s.text;else o.stages.push({id:uid(),chap:ch?ch.id:"",text:(s.n&&!ch?"Chapter "+s.n+": ":"")+s.text})})});
 /* 5. the Project page (beats merge by label, threads by name) */
 if(d.bible){if(d.bible.voice)P.bible.voice=d.bible.voice;if(d.bible.struct)P.bible.struct=d.bible.struct;if(d.bible.master)P.master=d.bible.master}
 const pm=d.project?applyProjJSON(d.project,false):"";
 const pl=(k,u,w,ws)=>k||u?k+" "+(k===1?w:ws||w+"s")+" ("+u+" updated, "+(k-u)+" new)":"";
 const sum=[pl(n.chNew+n.chUpd,n.chUpd,"chapter"),pl(d.chars.length,n.cUpd,"character"),pl(d.places.length,n.pUpd,"place / lore entry","place / lore entries")].filter(Boolean);
 return"Blueprint applied"+(sum.length?": "+sum.join(" · "):"")+(n.txt?" · prose loaded for "+n.txt+" chapter"+(n.txt===1?"":"s"):"")+"."+(pm?"\n"+pm:"")+(warn.length?"\nNote: "+[...new Set(warn)].join("; ")+".":"")}
function bpExport(){const j=JSON.stringify(blueprintJSON(),null,2);bpTxt=j;bpMsg="";render();copyOut(BP_PROMPT+"\n\n"+j,"Prompt + blueprint JSON copied. Paste it into your AI."+(voiceIsTemplate()?(rv(voiceSample())?" Voice & Style is still the blank template: the AI will draft it from your chapter text.":" Voice & Style is still the blank template and no chapter text exists to learn from: paste a sample of your own writing into chapter 1 first for a better result."):""))}
function bpDownload(){dl(slug(P.name||"novel")+"-blueprint.json",JSON.stringify(blueprintJSON(),null,2))}
async function bpImport(){
 let txt=bpTxt;
 if(!txt.trim()){try{txt=await navigator.clipboard.readText()}catch(e){}}
 if(!txt.trim()){bpMsg="Not imported: paste the AI's JSON (or upload the file) first.";return render()}
 const r=parseBlueprint(txt);
 if(r.errs.length){bpTxt=txt;bpMsg="Not imported. Nothing was changed.\n- "+r.errs.join("\n- ");return render()}
 const d=r.d,nm=s=>rv(s).toLowerCase().replace(/\s+/g," "),mx=Math.max(0,...d.chapters.map(c=>c.n));
 const cN=d.chars.filter(c=>!P.characters.some(x=>nm(x.name)===nm(c.d.name))).length,pN=d.places.filter(p=>!(P.locations||[]).some(x=>nm(x.name)===nm(p.name))).length,chN=Math.max(0,mx-P.chapters.length);
 const parts=[d.project?"the Project page":"",d.chars.length?d.chars.length+" character"+(d.chars.length===1?"":"s")+" ("+cN+" new)":"",d.places.length?d.places.length+" place / lore entr"+(d.places.length===1?"y":"ies")+" ("+pN+" new)":"",d.chapters.length?d.chapters.length+" chapter plan"+(d.chapters.length===1?"":"s")+(chN?" ("+chN+" new chapter"+(chN===1?"":"s")+" will be created)":""):""].filter(Boolean);
 if(!await ask("Apply this blueprint? It will fill: "+parts.join(", ")+". Fields in the JSON overwrite what is there, empty ones are ignored, and nothing is deleted. Prose is only loaded if the file contains it and you agree.",{ok:"Apply"})){bpTxt=txt;return render()}
 let wt=false;const nt=d.chapters.filter(c=>c.text).length;if(nt)wt=await ask("This file also contains finished prose for "+nt+" chapter"+(nt===1?"":"s")+". Load it into the chapters? Any text you already have is kept in Version History.",{ok:"Load prose",cancel:"Skip prose"});bpMsg=applyBlueprint(d,wt);bpTxt="";ci=Math.max(0,Math.min(ci,P.chapters.length-1));save();render()}
function bpPanel(){
 return`<details class="box" ${bpTxt||bpMsg?"open":""}><summary><b>AI Blueprint (whole book)</b> <span class="mute">project, characters, places &amp; lore and every chapter's plan in one JSON</span></summary><p class="mute" style="margin:8px 0">Brainstorm and agree the book with your AI first. Then click <b>1. Copy JSON for AI</b>, paste it into the same conversation, and paste the AI's completed JSON back here (or upload it). It fills the Project page, creates the characters and places, and plans every chapter: summary, beats, POV, place, time and scenes. It does not write chapter prose or images. On a new project it sets up Save the Cat across 27 chapters (9 per act).</p><div class="row"><button class="pri" data-act="bpexport">1. Copy JSON for AI</button><button data-act="bpimport">2. Import AI's JSON</button><label class="mute" style="flex:none">or upload .json <input type="file" id="bpfile" accept=".json,.txt,application/json"></label></div><textarea id="bp" rows="10" style="font-family:ui-monospace,Menlo,monospace;font-size:13px" placeholder="The blueprint JSON appears here after Copy JSON for AI. Paste the AI's completed JSON here, then click AI import (or leave empty to import from the clipboard).">${esc(bpTxt)}</textarea>${bpMsg?`<div class="box ${bpMsg.startsWith("Not imported")?"warn":""}" style="margin-top:8px;white-space:pre-wrap">${esc(bpMsg)}</div>`:""}</details>`}
function copyBrief(){
 const named=P.characters.filter(x=>x.name),need=named.filter(x=>charGaps(x).length),q=qnTxt.trim();
 if(!q&&!need.length){$("#st").textContent="Add quick notes for a new character first (existing profiles are already complete).";return}
 const parts=[
  "You are helping me develop character profiles for my novel. I am the author and have final say. Keep everything I have already written, fill the gaps with specific, plausible choices that fit the genre and story, and do not contradict anything established.",
  projectBrief(),
  rv(P.synopsis)?"# SYNOPSIS\n"+rv(P.synopsis).slice(0,2000):"",
  named.length?"# CHARACTERS ALREADY IN THE BOOK (use these exact names when linking relationships)\n"+named.map(x=>"- "+x.name+(x.role?" ("+x.role+")":"")).join("\n"):"",
  q?"# NEW CHARACTERS TO CREATE (my notes)\n"+q:"",
  need.length?"# EXISTING PROFILES TO COMPLETE\n"+need.map(x=>charMD(x)+"\n  - MISSING SECTIONS: "+charGaps(x).join(", ")).join("\n\n"):"",
  "# OUTPUT FORMAT\nReturn only markdown, one block per character, in exactly this structure. Replace the guidance text with real content. Omit any section that does not apply. For existing profiles, include only the sections that are missing.\n\n"+CHAR_TPL+"\nRules:\n- Relationship bullets start with the exact name of another character (existing, or in your reply), then a colon and one line.\n- One bullet per secret. Add (known by: Name, Name; from chapter N) only where others know it.\n- Development stages start with “Chapter N:” and describe where the character is at that point.\n- No commentary before or after the markdown."
 ].filter(Boolean);
 copyOut(parts.join("\n\n"),"AI brief copied ("+(named.length&&need.length?need.length+" to complete":"")+(q?(need.length?" + ":"")+"new notes":"")+"). Paste it into your AI.")}
function doPrev(){impMsg="";if(!impTxt.trim()){impMsg="Paste the AI's reply or upload a file first.";imp=null;return render()}
 imp=parseChars(impTxt).map(d=>({data:d,on:true}));render()}
function impView(){
 const msg=impMsg?`<div class="box">${esc(impMsg)}</div>`:"";if(!imp)return msg;
 if(!imp.length)return msg+`<div class="box warn">No characters found. Each character needs a heading such as “## Name”, with sections under “### …” headings. Download the blank template to see the layout.</div>`;
 return msg+`<div class="box"><div class="row"><b style="flex:none;min-width:0">Preview</b><select data-impmode style="max-width:360px"><option value="fill" ${impMode==="fill"?"selected":""}>Fill empty fields only (keeps what you’ve written)</option><option value="over" ${impMode==="over"?"selected":""}>Overwrite fields provided in the file</option></select></div>${imp.map((it,k)=>{const m=resolveChar(it.data.name);return`<label style="display:flex;gap:8px;padding:6px 0;border-top:1px solid var(--line);align-items:flex-start"><input type="checkbox" data-impon="${k}" ${it.on?"checked":""} style="width:auto;margin-top:4px"><span><b>${esc(it.data.name)}</b> <span class="mute">${m?"updates existing “"+esc(m.name)+"”":"new character"} · ${esc(it.data.found.join(", ")||"name only")}</span></span></label>`}).join("")}<div class="row" style="margin-top:8px"><button class="pri" data-act="impgo">Import selected</button><button data-act="impcancel">Discard</button></div></div>`}
function impPanel(){return`<details id="imppanel" class="box" ${impOpen||imp||impTxt||qnTxt||impMsg?"open":""}><summary><b>Import &amp; AI fill-in</b> <span class="mute">turn a few notes into full profiles</span></summary>
<ol class="mute" style="margin:10px 0 12px 18px;padding:0"><li>Jot quick notes for new characters below. Existing profiles with empty sections are included automatically.</li><li>Copy the AI brief and paste it into your AI.</li><li>Paste its reply here (or upload the .md file) and check the preview before anything changes.</li></ol>
<label class="fld"><span class="fl">Quick notes for new characters</span><span class="fh">One paragraph per character, e.g. “Mara Quinn – protagonist, disgraced forensic accountant, dry humour, hiding why she left her firm.”</span><textarea id="qn" rows="4">${esc(qnTxt)}</textarea></label>
<div class="row"><button class="pri" data-act="chbrief">Copy AI brief</button><button data-act="chtpl">Blank template (.md)</button><button data-act="chexp">Export all characters (.md)</button></div>
<label class="fld"><span class="fl">AI reply or markdown file</span><span class="fh">Each character starts with “## Name”, sections with “###”. Leave out any section you don’t need.</span><textarea id="impq" rows="6">${esc(impTxt)}</textarea></label>
<div class="row"><label class="mute" style="flex:none">Upload .md / .txt <input type="file" id="impfile" accept=".md,.markdown,.txt,text/markdown,text/plain"></label><button data-act="chprev">Preview import</button></div>${impView()}</details>`}
function charSummary(){if(!P.characters.length)return"";const full=P.characters.filter(x=>!charGaps(x).length).length;return`<p class="mute">${full} of ${P.characters.length} profiles complete. Counted: background, physical description, personality, relationships, development, speech and sample dialogue (secrets are optional).</p>`}
function relBlock(c,i,f){
 const mine=P.rels.map((r,ri)=>({r,ri})).filter(o=>o.r.a===c.id||o.r.b===c.id),used=new Set(mine.map(o=>o.r.a===c.id?o.r.b:o.r.a)),others=P.characters.filter(x=>x.name&&x.id!==c.id);
 const rows=mine.map(o=>{const fl=o.r.a===c.id?"b":"a",cur=o.r[fl];return`<div class="row" style="flex-wrap:nowrap"><select data-k="rels.${o.ri}.${fl}" style="max-width:200px" aria-label="Related character"><option value="">Choose character…</option>${others.filter(x=>x.id===cur||!used.has(x.id)).map(x=>`<option value="${x.id}" ${x.id===cur?"selected":""}>${esc(x.name)}</option>`).join("")}</select><input data-k="rels.${o.ri}.label" value="${esc(o.r.label)}" aria-label="One line about the bond"><button class="sm" data-act="delrel" data-id="${o.r.id}" title="Remove relationship">×</button></div>`}).join("");
 return`<div class="fld"><span class="fl">${f[1]}</span><span class="fh">${f[2]}</span>${rows}${others.length?(others.length>used.size?`<p style="margin:4px 0 8px"><button class="sm" data-act="addrel" data-i="${i}">+ Link a character</button></p>`:""):`<p class="mute" style="margin:4px 0 8px">Add and name another character to link them.</p>`}<label class="fld"><span class="fh" style="margin-top:6px">Other relationships: people without a profile (one per line)</span><textarea data-k="characters.${i}.relationships" rows="2">${esc(c.relationships)}</textarea></label></div>`}
function secBlock(c,i,f){
 const rows=c.secretList.map((s,j)=>{const kk=`characters.${i}.secretList.${j}.`,known=s.known||[],avail=P.characters.filter(x=>x.name&&x.id!==c.id&&!known.includes(x.id));
  return`<div class="box"><textarea data-k="${kk}text" rows="2" aria-label="Secret">${esc(s.text)}</textarea><div class="row" style="margin:8px 0 0"><span class="mute" style="flex:none;min-width:0">Also known by:</span>${known.filter(cName).map(id=>`<span class="tag" style="flex:none;min-width:0;margin:0">${esc(cName(id))} <a data-act="skdel" data-i="${i}" data-j="${j}" data-id="${id}" style="cursor:pointer">×</a></span>`).join("")}${avail.length?`<select data-secadd="${i}:${j}" style="max-width:190px"><option value="">+ Who else knows…</option>${avail.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>`:""}<select data-k="${kk}from" style="max-width:230px" aria-label="Known from chapter">${chOpts(s.from,"Known from the start")}</select><button class="sm" data-act="delsec" data-i="${i}" data-j="${j}">Delete</button></div></div>`}).join("");
 return`<div class="fld"><span class="fl">${f[1]}</span><span class="fh">${f[2]}</span>${rows}<p style="margin:4px 0 8px"><button class="sm" data-act="addsec" data-i="${i}">+ Add secret</button></p></div>`}
function devBlock(c,i,f){
 c.stages.sort((a,b)=>{const x=chIdx(a.chap),y=chIdx(b.chap);return(x<0?1e9:x)-(y<0?1e9:y)});
 const rows=c.stages.map((s,j)=>`<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><select data-k="characters.${i}.stages.${j}.chap" style="max-width:190px;flex:none" aria-label="Chapter">${chOpts(s.chap,"Chapter…")}</select><textarea data-k="characters.${i}.stages.${j}.text" rows="2" aria-label="Stage description">${esc(s.text)}</textarea><button class="sm" data-act="delstage" data-i="${i}" data-j="${j}" title="Delete stage">×</button></div>`).join("");
 return`<div class="fld"><span class="fl">${f[1]}</span><span class="fh">${f[2]}</span><textarea data-k="characters.${i}.development" rows="3" aria-label="Overall arc">${esc(c.development)}</textarea><span class="fh" style="margin-top:8px">Stages by chapter. A chapter’s prompt gets the latest stage reached and the next one ahead. Stages with no chapter are left out of chapter prompts.</span>${rows}<p style="margin:4px 0 8px"><button class="sm" data-act="addstage" data-i="${i}">+ Add stage</button></p></div>`}
function charCard(c,i){
 const gaps=charGaps(c),need=coreOf(c),n=need-gaps.length;c.secretList=c.secretList||[];c.stages=c.stages||[];
 const body=CHAR_FIELDS.map(f=>{const key=f[0];
  if(key==="look")return ent("characters",i,c);
  if(key==="relationships")return relBlock(c,i,f);
  if(key==="secrets")return secBlock(c,i,f);
  if(key==="development")return devBlock(c,i,f);
  return fld("characters."+i+"."+key,f[1],f[2],c[key],f[3])}).join("");
 return`<div class="card" data-picdrop="characters.${i}"><div class="row" style="align-items:flex-end"><label class="fld" style="margin:0"><span class="fl">Name</span><span class="fh">As it appears in the text</span><input data-k="characters.${i}.name" value="${esc(c.name)}"></label><label class="fld" style="margin:0"><span class="fl">Role</span><span class="fh">Protagonist, antagonist, mentor…</span><input data-k="characters.${i}.role" value="${esc(c.role)}"></label><label class="fld" style="margin:0;max-width:200px"><span class="fl">Tier</span><span class="fh">Groups the list, sets what is required</span><select data-k="characters.${i}.tier">${TIERS.map(t=>`<option value="${t[0]}" ${t[0]===(c.tier||"major")?"selected":""}>${t[1]}</option>`).join("")}</select></label><label class="mute" style="flex:none;min-width:0;display:flex;gap:6px;align-items:center;padding-bottom:8px" title="Untick to keep this character out of every AI prompt, export and the Character Bible"><input type="checkbox" data-k="characters.${i}.inc" ${c.inc!==false?"checked":""} style="width:auto"> Include in AI</label><button data-act="delchar" data-i="${i}">Delete</button></div>${c.tier==="unnamed"?`<div class="mute" style="margin:8px 0 14px">Background character: no sections are required. Name and role (and a look, if useful) are enough.</div>`:`<div class="bar" style="max-width:240px;margin:8px 0 4px"><i style="width:${Math.round(n/need*100)}%"></i></div><div class="mute" style="margin-bottom:14px">${n} of ${need} sections filled${c.tier==="minor"?" (minor character: look and personality only)":""}${gaps.length?" · still to do: "+esc(gaps.join(", ")):" · complete"}</div>`}${cjPanel(c)}${body}</div>`}
if(typeof document!=="undefined")document.addEventListener("toggle",e=>{if(e.target&&e.target.id==="imppanel")impOpen=e.target.open;if(e.target&&e.target.id==="aihelp")LS.set("ns_aihelp",e.target.open?"1":"0")},true);
const STAT=["Planned","Drafting","Drafted","Edited","Final"];
const GENRES=[
  "Folk Horror",
  "Dystopian & Speculative",
  "Historical Literary Fiction",
  "Literary Fiction",
  "Contemporary Fiction",
  "Gothic & Supernatural",
  "Historical Fiction",
  "Psychological Thriller & Crime",
  "Mystery & Noir",
  "Science Fiction",
  "Fantasy",
  "Satire & Dark Comedy",
  "Other (custom)"
];

/* ---------- prompt templates & seed samples: loaded from ./templates ---------- */
let MASTER="",CHAPTER_TPL="";
const TIPS={novel:"",script:""}; /* read-only craft tips from ./templates, never stored in the project */
const DEFAULT_TPLS={};
const SAMPLES={};
const OP_KEYS=["skeleton","plan","write","review","rewrite","continuity","develop","analyse","screenplay","audit_chapter","audit_synopsis","audit_plot"];
const AUDIT_OPS=["audit_chapter","audit_synopsis","audit_plot"];
const isAudit=op=>AUDIT_OPS.includes(op);
/* Short, local-model-friendly role used instead of the long novel-writing master instruction for audits. */
const AUDIT_ROLE=`# ROLE: MANUSCRIPT AUDITOR

You are a rigorous, impartial literary editor carrying out an audit. The author is the final authority on the story.

Rules:
- Base every finding on the material supplied below. If something cannot be verified from it, write "Not verifiable from the supplied material" instead of guessing.
- Quote the exact words you are criticising (a short quote, not a whole paragraph) so the author can find the line.
- Do not flatter and do not pad. Do not rewrite the chapter or synopsis unless a heading asks for a short sample.
- Do not invent characters, events, facts or sources.
- Use exactly the headings requested, in order, in Markdown.`;
const AUDIT_TPLS={
audit_chapter:`# CHAPTER AUDIT

Audit Chapter [NUMBER] ("[TITLE]", Act [ACT], target [WORD COUNT] words, POV [POV], [PAST/PRESENT] tense) using the chapter text, its summary and beats, the earlier chapter summaries, the character profiles and the secret boundaries supplied.

## 1. Verdict
Two or three sentences. Then score each from 1 to 10 with a one-line reason: Voice consistency, Pacing, Character consistency, Continuity, Prose quality.

## 2. Continuity problems
Contradictions with earlier summaries, character profiles, the timeline, or what a character is allowed to know. Quote the line and name what it contradicts. If none, say "None found".

## 3. Characters and dialogue
Out-of-character behaviour, dialogue that sounds the same across speakers, motivation gaps. Quote examples.

## 4. Prose and voice
Repetition, filler words, cliches, over-explained emotion, generic AI phrasing, tense or POV slips. Quote examples and give a one-line fix for each.

## 5. Structure and pacing
Does the text deliver the stated summary and beats? List beats that are missing, rushed or overlong. Say where the chapter sags and whether the ending earns its place.

## 6. Summary check
Is the supplied chapter summary accurate to the text? If not, give a corrected summary of about 100 words that the next chapter's AI can rely on.

## 7. Top five fixes
Five specific edits, ordered by impact.`,
audit_plot:`# PLOT AUDIT

Audit the plot as it stands in the chapter summaries, using the synopsis, narrative structure, continuity ledger and timeline where supplied. Only chapters that have a summary can be audited. List the chapters that have none and say how that limits the audit.

## 1. Verdict
Two or three sentences. Then score 1 to 10 with a one-line reason: Plot logic, Pacing, Rising stakes, Character arcs, Setups and payoffs.

## 2. Chapter-by-chapter flow
A table with one row per chapter: Chapter | What changes | Tension (1 to 5) | Note. Flag chapters where nothing changes or that repeat an earlier beat.

## 3. Plot holes and contradictions
Events that contradict each other, motivations that do not hold, conveniences and coincidences. Name the chapters involved. If none, say "None found".

## 4. Open threads and unpaid setups
Things introduced but never resolved, and payoffs that have no earlier setup. Name the chapters.

## 5. Structure and pacing
Where the inciting incident, turning points, midpoint, climax and resolution fall. Name any stretch that sags or rushes.

## 6. Character arcs
For each major character: where the arc starts, turns and ends according to the summaries, and any gap.

## 7. Timeline and knowledge
Chronology problems, and places where a character acts on something they could not yet know.

## 8. Top five fixes
Five specific changes, ordered by impact. Do not rewrite the summaries.`,
audit_synopsis:`# SYNOPSIS AUDIT

Audit the synopsis against the project overview, the chapter summaries and the story timeline supplied. The synopsis word count is given in the stats block.

## 1. Verdict
Two or three sentences on whether the synopsis is ready to send to an agent or publisher. Score 1 to 10 for: Clarity, Completeness (includes the ending), Hook, Alignment with the manuscript, Length.

## 2. Alignment with the manuscript
- Events in the synopsis that no chapter summary supports.
- Chapters or major events in the summaries that the synopsis leaves out or contradicts.
- Chapters that have no summary, so they could not be checked (list them by number).

## 3. Structure
Where the synopsis places the inciting incident, turning points, midpoint, climax and resolution, and whether the protagonist drives them. Name anything missing.

## 4. Submission readiness
Tense and person, spoilers (the ending must be stated), unexplained names, vague phrases such as "things get worse", length against a typical one-page (about 500 words) or two-page (about 800 words) synopsis.

## 5. Consistency of names and facts
Character names, roles, places and dates that differ between synopsis, summaries and timeline.

## 6. Top five fixes
Five specific edits, ordered by impact. Do not rewrite the whole synopsis.`
};
const SAMPLE_KEYS=["novel","char","world","struct","voice","cont","index"];
const FALLBACK_MASTER="# MASTER INSTRUCTIONS\n\n(templates/master.md missing — paste your own master instruction in Settings.)";
const FALLBACK_CHAPTER="# CHAPTER GENERATION\n\n(templates/chapter.md missing — paste your own chapter template.)";

async function fetchText(path){
 try{
  const r=await fetch(chrome.runtime.getURL(path)+"?t="+Date.now(),{cache:"no-store"});
  if(!r.ok){
    console.warn("[novel-studio] Missing file:", path, r.status);
    return "";
  }
  return await r.text();
 }catch(e){
  console.warn("[novel-studio] Fetch error:", path, e.message);
  return "";
 }
}

async function loadTemplates(){
 const [master,chapter,tipsNovel,tipsScript,...rest]=await Promise.all([
  fetchText("templates/master.md"),
  fetchText("templates/chapter.md"),
  fetchText("templates/novel-tips.md"),
  fetchText("templates/script-tips.md"),
  ...OP_KEYS.filter(k=>k!=="write").map(k=>fetchText("templates/"+k+".md")),
  ...SAMPLE_KEYS.map(k=>fetchText("templates/"+k+".md"))
 ]);
 TIPS.novel=(tipsNovel||"").trim();TIPS.script=(tipsScript||"").trim();
 MASTER=master||FALLBACK_MASTER;
 CHAPTER_TPL=chapter||FALLBACK_CHAPTER;
 const opNames=OP_KEYS.filter(k=>k!=="write");
 opNames.forEach((k,i)=>{ DEFAULT_TPLS[k]=rest[i]||AUDIT_TPLS[k]||""; });
 DEFAULT_TPLS.write=CHAPTER_TPL;
 SAMPLE_KEYS.forEach((k,i)=>{ SAMPLES[k]=rest[opNames.length+i]||""; });
}

const OPS=[
  ["skeleton","Skeleton novel outline"],
  ["plan","Plan chapter beats & scenes"],
  ["write","Write chapter"],
  ["review","Review chapter"],
  ["rewrite","Rewrite passage"],
  ["continuity","Check continuity"],
  ["develop","Develop story"],
  ["analyse","Analyse manuscript"],
  ["screenplay","Film / TV script (Fountain)"],
  ["audit_chapter","Audit chapter"],
  ["audit_plot","Plot audit (all chapter summaries)"],
  ["audit_synopsis","Audit synopsis"],
  ["sum","Summarise chapter"],
  ["expand","Expand passage"],
  ["describe","Describe (five senses)"],
  ["dialogue","Dialogue"]
];
const OP_TASK={
 sum:"Summarise the chapter below for my Continuity Ledger. Reply under exactly these headings: Major characters (comma separated), Minor characters (comma separated), Place, Time (exact or approximate), Summary (120 words), Beats (one per line), What changed (facts, character knowledge, relationships), Open threads.",
 expand:"TASK: Expand the passage into a fuller scene without padding. Dramatise through action, dialogue and observation, keep continuity, and add no major plot developments. Aim for 1.5 to 2 times the length.",
 describe:"TASK: Describe the subject using the five senses, in the author's voice. Give five short options, each led by a different sense, specific and free of cliche and generic adjectives.",
 dialogue:"TASK: Write or rework the dialogue so each character sounds individual according to the character profiles. Use subtext, avoid on-the-nose lines, keep tags minimal and avoid generic AI phrasing."};
const OP_DESC={
 skeleton:"Builds a chapter-by-chapter outline for the whole book. Type a focus in the box below if you want one.",
 plan:"Plans the selected chapter's scenes and beats before any prose is written.",
 write:"Writes the selected chapter as finished prose from its summary, beats and scenes. This is the heavy task, so the Chapters page must be filled in first. Your existing text is never overwritten until you approve it.",
 review:"Editorial critique of the selected chapter's draft. Does not change your text.",
 rewrite:"Rewrites a passage in three styles. Paste the passage below, or leave the box empty to use the whole chapter.",
 continuity:"Checks the chapter against your bible, timeline and earlier chapters for contradictions.",
 develop:"Brainstorms 6 to 8 options for a plot problem. Type the problem or topic in the box below.",
 analyse:"Whole-book analysis of structure, pacing, arcs and voice.",
 screenplay:"Adapts the material into a film or TV script in Fountain format.",
 audit_chapter:"Strict audit of the selected chapter: scores, continuity problems, prose issues and a top-five fix list. Uses a short prompt suited to local models.",
 audit_synopsis:"Checks your synopsis against the chapter summaries and for submission readiness.",
 audit_plot:"Reads all the chapter summaries together and audits the plot: holes, pacing, open threads and character arcs. Needs a summary on most chapters.",
 sum:"Summarises the chapter text into a summary, beats and what changed. Paste the result into the chapter's Summary field.",
 expand:"Expands a passage into a fuller scene. Paste it below, or leave the box empty to use the chapter.",
 describe:"Gives five sensory description options for the passage or subject below.",
 dialogue:"Writes or reworks dialogue so each character sounds distinct."};
const CTX_LIST=[
 ["proj","Project brief","Title, subtitle, genre and pitch."],
 ["syn","Synopsis & plot","Plot in brief, themes, synopsis, act summaries, structure beats, story threads and the ending. Chapter tasks get only the act, beats and threads that apply to that chapter. The ending is left out of chapter-writing tasks unless you change that on the Project page."],
 ["notes","AI Notes","Notes marked AI & Canon. Private notes are never sent."],
 ["bible","Story Bible","Your hand-written Narrative Structure and Voice & Style documents."],
 ["chars","Characters","Character Bible built from the Characters page. Chapter tasks get each character as they stand at that chapter, with secret boundaries."],
 ["locs","Places","Location & World Bible built from the Places & Lore page."],
 ["time","Timeline","Story Timeline events (part of the Continuity Ledger)."],
 ["prev","Earlier summaries","Continuity Ledger chapter record: summaries of earlier chapters, the AI's memory of the story so far."],
 ["smart","Smart relevance","Adds earlier chapters whose summaries mention words from this chapter or passage."],
 ["fullms","Full manuscript","Sends the full text of every written chapter. Very large. Meant for whole-book analysis."]];
const MAIN_OPS=["write","sum","audit_chapter","audit_plot"];
const SEL_HINT={
 write:"Extra guidance for this chapter (optional): tone, what to emphasise, things to avoid.",
 plan:"Extra guidance (optional).",
 skeleton:"Optional focus, for example: tighten Act 2.",
 develop:"The plot problem or topic to explore.",
 rewrite:"Paste the passage here. Leave empty to use the whole chapter draft.",
 expand:"Paste the passage here. Leave empty to use the whole chapter draft.",
 describe:"The subject or passage to describe. Leave empty to use the chapter draft.",
 dialogue:"Paste the dialogue or scene here. Leave empty to use the chapter draft."};
const OP_CTX={
  skeleton:{proj:1,syn:1,notes:1,bible:1,chars:1,locs:1,time:1,prev:0,smart:0,fullms:0},
  plan:{proj:1,syn:1,notes:1,bible:1,chars:1,locs:1,time:1,prev:1,smart:1,fullms:0},
  write:{proj:1,syn:1,notes:1,bible:1,chars:1,locs:1,time:1,prev:1,smart:1,fullms:0},
  review:{proj:1,syn:1,notes:1,bible:1,chars:1,locs:0,time:1,prev:1,smart:1,fullms:0},
  rewrite:{proj:1,syn:0,notes:1,bible:1,chars:1,locs:1,time:0,prev:0,smart:1,fullms:0},
  continuity:{proj:1,syn:0,notes:1,bible:1,chars:1,locs:1,time:1,prev:1,smart:0,fullms:0},
  develop:{proj:1,syn:1,notes:1,bible:1,chars:1,locs:1,time:1,prev:1,smart:0,fullms:0},
  analyse:{proj:1,syn:1,notes:1,bible:1,chars:1,locs:0,time:1,prev:1,smart:0,fullms:1},
  screenplay:{proj:1,syn:1,notes:1,bible:1,chars:1,locs:1,time:1,prev:1,smart:0,fullms:1},
  audit_chapter:{proj:1,syn:1,notes:1,bible:0,chars:1,locs:0,time:0,prev:1,smart:0,fullms:0},
  audit_synopsis:{proj:1,syn:1,notes:1,bible:0,chars:0,locs:0,time:1,prev:0,smart:0,fullms:0},
  audit_plot:{proj:1,syn:1,notes:1,bible:0,chars:0,locs:0,time:1,prev:0,smart:0,fullms:0},
  sum:{proj:0,syn:0,notes:0,bible:0,chars:0,locs:0,time:0,prev:0,smart:0,fullms:0},
  expand:{proj:1,syn:0,notes:1,bible:1,chars:1,locs:1,time:0,prev:0,smart:1,fullms:0},
  describe:{proj:1,syn:0,notes:1,bible:1,chars:0,locs:1,time:0,prev:0,smart:1,fullms:0},
  dialogue:{proj:1,syn:0,notes:1,bible:1,chars:1,locs:0,time:0,prev:0,smart:1,fullms:0}
};

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const wc=t=>(String(t||"").match(/\S+/g)||[]).length;
let dashTab="ov",db,P,all=[],view="dash",bk="novel",ci=0,tm,lk=0,lsrc=null,dr=null,bz=1,ti=null,td=null,focusMode=false;
let curNoteId=null,noteFilter="all",noteSearch="",curChar=null,curLoc=null;
let imp=null,impTxt="",impMode="fill",impMsg="",qnTxt="",impOpen=false;
let cjTxt="",cjMsg="",cjFor=null;
const WIN=new URLSearchParams(location.search).has("win"),CAN_WIN=typeof chrome!=="undefined"&&!!(chrome.windows&&chrome.windows.create&&chrome.runtime&&chrome.runtime.getURL);
async function popOut(){
 try{if(tm){clearTimeout(tm);tm=null}await put(P);
  let b={};try{b=JSON.parse(LS.get("ns_win")||"{}")}catch(e){}
  const o={url:chrome.runtime.getURL("sidepanel.html?win=1"),type:"popup",width:Math.max(700,b.w||1100),height:Math.max(500,b.h||800)};
  if(Number.isFinite(b.l)&&Number.isFinite(b.t)){o.left=b.l;o.top=b.t}
  await chrome.windows.create(o);
 }catch(e){$("#st").textContent="Could not open a separate window";return}
 await new Promise(r=>setTimeout(r,250));
 try{const w=await chrome.windows.getCurrent();if(chrome.sidePanel&&chrome.sidePanel.close)chrome.sidePanel.close({windowId:w.id})}catch(e){}
 window.close()}
if(CAN_WIN&&!WIN){/* the window is already open: focus it and close this side panel instead of running a second copy */
 chrome.windows.getAll({populate:true,windowTypes:["popup"]}).then(ws=>{const base=chrome.runtime.getURL("sidepanel.html"),w=ws.find(x=>(x.tabs||[]).some(t=>t.url&&t.url.startsWith(base)&&t.url.includes("win=1")));if(w){chrome.windows.update(w.id,{focused:true});window.close()}}).catch(()=>{})}
if(WIN&&CAN_WIN){const up=async()=>{try{if(document.hasFocus())return;const w=await chrome.windows.getCurrent();await chrome.windows.update(w.id,{focused:true,drawAttention:true})}catch(e){}};[300,700,1300].forEach(ms=>setTimeout(up,ms))}
if(WIN){let rt;const sv=()=>LS.set("ns_win",JSON.stringify({l:window.screenX,t:window.screenY,w:window.outerWidth,h:window.outerHeight}));window.addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(sv,300)});window.addEventListener("pagehide",sv)}
let tidyOn=true,kt=null;
const ctx={proj:1,syn:1,notes:1,bible:1,chars:1,locs:1,time:1,prev:1,smart:1,fullms:0};
const CW=130,PT=["Place","Object / relic","Faction","Lore / rule"];
let aiKey="",aiOut="",aiRes="",aiMode="write",aiSel="",tplEdit="write",aiTips="auto";
/* which fixed tips file applies: auto picks script tips for the screenplay operation, novel tips for everything else */
const tipsKind=op=>aiTips==="none"||op==="sum"?"":aiTips==="novel"||aiTips==="script"?aiTips:(op==="screenplay"?"script":"novel");
const tipsBlock=k=>k&&TIPS[k]?"# WRITING CRAFT TIPS ("+(k==="script"?"screenwriting":"novel")+"; fixed reference, always follow)\n"+TIPS[k]:"";

function mk(name){return migrate(mk0(name))}
function mk0(name){const bible={};BIBLE.forEach(b=>bible[b[0]]=SAMPLES[b[0]]||("# "+b[1]+"\n\n"));
 return{id:uid(),name,subtitle:"",genre:"",genreCustom:"",strapline:"",target:80000,master:MASTER,tpl:CHAPTER_TPL,tpls:{...DEFAULT_TPLS},
 ai:{chapterWords:3000,format:"Prose + separate editorial report"},
 bible,notes:[
   {id:uid(),title:"AI & Canon Notes",scope:"ai",tag:"Canon",text:""},
   {id:uid(),title:"Private Scratchpad",scope:"priv",tag:"Private",text:""}
 ],
 characters:[],locations:[],synopsis:"",query:"",agents:[],history:[],proposals:[],
 chapters:[{id:uid(),title:"Chapter 1 (author written)",act:1,target:3000,status:"Drafting",major:"",minor:"",place:"",time:"",tense:"Past",summary:"",beats:"",text:"",versions:[],scenes:[]}]}}
function idb(){return new Promise(r=>{try{const q=indexedDB.open("novelstudio",2);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains("p"))d.createObjectStore("p",{keyPath:"id"});if(!d.objectStoreNames.contains("h"))d.createObjectStore("h")};q.onsuccess=()=>{db=q.result;r()};q.onerror=()=>r()}catch(e){r()}})}
function loadAll(){return new Promise(r=>{if(!db)return r([]);const q=db.transaction("p").objectStore("p").getAll();q.onsuccess=()=>{const rows=q.result||[];seedCfg(rows);r(rows.map(migrate))};q.onerror=()=>r([])})}
function put(p){try{syncBible(p)}catch(e){console.warn("[novel-studio] sync",e)}if(!db)return Promise.resolve();return new Promise(r=>{const tx=db.transaction("p","readwrite");tx.objectStore("p").put(stripCfg(p));tx.oncomplete=tx.onerror=tx.onabort=()=>r()})}
function save(){$("#st").textContent="Saving…";clearTimeout(tm);tm=setTimeout(()=>{tm=null;put(P);$("#st").textContent=db?"Saved on this device":"Not saved (storage unavailable)";if(auto.on)autoSoon()},400)}
window.addEventListener("beforeunload",()=>{if(tm){clearTimeout(tm);tm=null;put(P)}});

/* ---------- backups: reminder + automatic save to a chosen folder ---------- */
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
/* ---------- device settings: AI connection. Stored in this browser only, never inside project data or project exports ---------- */
const CONN_DEFAULTS={provider:"cloud",endpoint:"https://api.openai.com/v1/chat/completions",model:"gpt-4o-mini",temp:0.7,lProto:"http",lHost:"",lPort:8080,lModel:"",lMaxTokens:2048,lCtx:8192,lTimeout:600,lStream:true,lAuditTemp:0.2};
const CONN_KEYS=Object.keys(CONN_DEFAULTS);
let CFG=Object.assign({},CONN_DEFAULTS),CFG_SAVED=false;
try{const raw=LS.get("ns_conn");if(raw){const j=JSON.parse(raw);CONN_KEYS.forEach(k=>{if(j[k]!==undefined)CFG[k]=j[k]});CFG_SAVED=true}}catch(e){}
const saveCfg=()=>{LS.set("ns_conn",JSON.stringify(CFG));CFG_SAVED=true};
/* One-off: first run after this update, adopt the connection already stored inside an existing project. */
function seedCfg(rows){
 if(CFG_SAVED||!rows||!rows.length)return;
 const withAi=rows.filter(r=>r&&r.ai&&CONN_KEYS.some(k=>r.ai[k]!==undefined));
 const best=withAi.find(r=>r.ai.lHost)||withAi[0];
 if(!best)return;
 CONN_KEYS.forEach(k=>{if(best.ai[k]!==undefined)CFG[k]=best.ai[k]});
 saveCfg()}
function applyCfg(src){
 CONN_KEYS.forEach(k=>{if(src&&src[k]!==undefined&&typeof src[k]===typeof CONN_DEFAULTS[k])CFG[k]=src[k]});
 saveCfg();(typeof all!=="undefined"?all:[]).forEach(p=>{if(p.ai)Object.assign(p.ai,CFG)})}
/* Copy of a project with the device settings removed, for saving and exporting. */
function stripCfg(p){const c=JSON.parse(JSON.stringify(p));if(c.ai)CONN_KEYS.forEach(k=>{delete c.ai[k]});return c}
let dirHandle=null,abt=null,dirty=false;
const auto={on:false,perm:"none",name:"",last:+LS.get("ns_autolast")||0,err:""};
const hstore=m=>db.transaction("h",m).objectStore("h");
async function backupJSON(withSettings){
 if(withSettings===undefined)withSettings=true;
 if(tm){clearTimeout(tm);tm=null}
 await put(P);
 const rows=db?await new Promise(r=>{const q=db.transaction("p").objectStore("p").getAll();q.onsuccess=()=>r(q.result);q.onerror=()=>r(all)}):all;
 const o={app:"novel-studio",version:3,projects:(rows&&rows.length?rows:all).map(stripCfg)};
 if(withSettings)o.settings=Object.assign({},CFG);
 return JSON.stringify(o,null,1);
}
async function expAll(markExport,withSettings){
 if(withSettings===undefined)withSettings=true;
 try{
  $("#st").textContent="Preparing "+(withSettings?"full":"projects-only")+" backup…";
  const json=await backupJSON(withSettings);
  await dl("novel-studio-"+(withSettings?"backup":"projects")+"-"+new Date().toISOString().slice(0,10)+".json",json);
  if(markExport){LS.set("ns_lastexport",Date.now());render()}
 }catch(e){
  $("#st").textContent="Export failed: "+(e&&e.message||e);
 }
}
const totalWords=()=>all.reduce((a,p)=>a+p.chapters.reduce((s,c)=>s+wc(c.text),0),0);
async function loadDir(){
 if(!db||!db.objectStoreNames.contains("h"))return;
 dirHandle=await new Promise(r=>{try{const q=hstore("readonly").get("dir");q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)}catch(e){r(null)}});
 if(dirHandle){auto.on=true;auto.name=dirHandle.name;await checkPerm()}
}
async function checkPerm(){try{auto.perm=await dirHandle.queryPermission({mode:"readwrite"})}catch(e){auto.perm="denied"}}
async function pickDir(){
 if(!window.showDirectoryPicker){$("#st").textContent="This browser cannot save to a folder";return}
 let h;try{h=await showDirectoryPicker({mode:"readwrite",id:"novelstudio-backup"})}catch(e){if(e.name!=="AbortError")$("#st").textContent="Could not use that folder: "+e.message+". Try a subfolder.";return}
 dirHandle=h;
 await new Promise(r=>{try{const q=hstore("readwrite").put(h,"dir");q.onsuccess=()=>r();q.onerror=()=>r()}catch(e){r()}});
 auto.on=true;auto.name=h.name;auto.perm="granted";auto.err="";
 await runAuto(true);render();
}
async function reauthDir(){
 if(!dirHandle)return;
 try{auto.perm=await dirHandle.requestPermission({mode:"readwrite"})}catch(e){auto.err=e.message}
 if(auto.perm==="granted")await runAuto(true);
 render();
}
async function turnOffAuto(){
 if(!await ask("Stop automatic backups? Backup files already in the folder are kept."))return;
 dirHandle=null;auto.on=false;auto.name="";auto.perm="none";auto.err="";
 try{hstore("readwrite").delete("dir")}catch(e){}
 render();
}
async function writeBackup(name,data){const fh=await dirHandle.getFileHandle(name,{create:true}),w=await fh.createWritable();await w.write(data);await w.close()}
async function runAuto(force){
 if(!dirHandle)return;
 clearTimeout(abt);abt=null;
 try{
  await checkPerm();
  if(auto.perm!=="granted"){$("#st").textContent="Auto-backup paused: re-enable it in Settings";return}
  if(!force&&totalWords()<50)return;
  const json=await backupJSON(),day=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
  await writeBackup("novel-studio-latest.json",json);
  await writeBackup("novel-studio-"+day+".json",json);
  const names=[];for await(const [n] of dirHandle.entries())if(/^novel-studio-\d{4}-\d\d-\d\d\.json$/.test(n))names.push(n);
  names.sort();while(names.length>14)await dirHandle.removeEntry(names.shift());
  auto.last=Date.now();LS.set("ns_autolast",auto.last);auto.err="";dirty=false;
  $("#st").textContent="Backed up to folder at "+new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
 }catch(e){auto.err=e.message||String(e);$("#st").textContent="Auto-backup failed: "+auto.err}
}
function autoSoon(){dirty=true;if(!abt)abt=setTimeout(()=>{abt=null;runAuto()},120000)}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&dirty&&auto.on)runAuto()});
function autoStatus(){
 if(!window.showDirectoryPicker)return"This browser cannot save to a folder.";
 if(!auto.on)return"Not set up. Choose a folder and Novel Studio keeps a backup file there up to date.";
 return`Saving to the folder “${esc(auto.name)}”. Last saved: ${auto.last?new Date(auto.last).toLocaleString():"not yet"}.`+(auto.perm!=="granted"?" Paused: Chrome needs you to re-enable access.":"")+(auto.err?" Last error: "+esc(auto.err):"");
}
function bkBanner(){
 const DAY=864e5,now=Date.now(),days=+LS.get("ns_bkdays")||3;
 if(auto.on&&auto.perm!=="granted")return`<div class="box warn"><b>Auto-backup is paused.</b> Chrome needs you to re-enable access to the folder “${esc(auto.name)}”. <button class="sm pri" data-act="bkreauth">Re-enable</button></div>`;
 if(auto.on&&auto.err)return`<div class="box warn"><b>Auto-backup failed:</b> ${esc(auto.err)} <button class="sm" data-act="bkrun">Retry</button> <button class="sm" data-act="bkexport">Export a file instead</button></div>`;
 if(auto.on)return"";
 const last=+LS.get("ns_lastexport")||0;
 if(now<(+LS.get("ns_snooze")||0)||totalWords()<200||(last&&now-last<days*DAY))return"";
 const msg=last?`Your last backup was ${Math.floor((now-last)/DAY)} days ago.`:"You haven't exported a backup yet.";
 return`<div class="box warn"><b>${msg}</b> Your chapters only live in this browser. <button class="sm pri" data-act="bkexport">Export backup now</button> <button class="sm" data-act="bkfolder">Set up auto-backup</button> <button class="sm" data-act="bksnooze">Remind me tomorrow</button></div>`;
}
function setPath(path,v){const k=path.split(".");let o=P;for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=v;
 if(k.length===2&&k[0]==="ai"&&CONN_KEYS.includes(k[1])){CFG[k[1]]=v;all.forEach(q=>{if(q.ai)q.ai[k[1]]=v});saveCfg()}}
function genreLabel(p=P){const g=p.genre&&p.genre!=="Other (custom)"?p.genre:"",c=(p.genreCustom||"").trim();return[g,c].filter(Boolean).join(" — ")}

function migrate(p){
 p.subtitle=p.subtitle||"";p.genre=p.genre||"";p.genreCustom=p.genreCustom||"";p.strapline=p.strapline||"";
 p.plot=Object.assign(PL0(),p.plot||{});p.plot.acts=Object.assign({1:"",2:"",3:""},p.plot.acts||{});
 p.plot.beats=(Array.isArray(p.plot.beats)?p.plot.beats:[]).map(b=>Object.assign({id:uid(),label:"",text:"",chap:""},b));
 p.plot.threads=(Array.isArray(p.plot.threads)?p.plot.threads:[]).map(t=>Object.assign({id:uid(),name:"",type:"Subplot",status:"Planned",setup:"",payoff:"",notes:""},t));
 p.style=Object.assign({blacklist:KPI_DEFAULT_BL,allow:KPI_DEFAULT_ALLOW,ignore:"",repeatMin:5},p.style||{});
 p.bible=p.bible||{};BIBLE.forEach(b=>{if(p.bible[b[0]]==null)p.bible[b[0]]="# "+b[1]+"\n\n"});
 if(!Array.isArray(p.notes)){
  p.notes=[
   {id:uid(),title:"AI & Canon Notes",scope:"ai",tag:"Canon",text:p.notesAi||""},
   {id:uid(),title:"Private Scratchpad",scope:"priv",tag:"Private",text:p.notesPriv||""}
  ];
 }
 p.notes=p.notes.map(n=>Object.assign({id:uid(),title:"Untitled note",scope:"ai",tag:"",text:""},n));
 if(!p.notes.length)p.notes.push({id:uid(),title:"AI & Canon Notes",scope:"ai",tag:"Canon",text:""});
 p.rels=Array.isArray(p.rels)?p.rels.filter(r=>r&&r.a&&r.b).map(r=>Object.assign({id:uid(),label:""},r)):[];
 p.characters=(p.characters||[]).map(c=>{const x=Object.assign(newChar(),c);if(!Array.isArray(x.secretList))x.secretList=[];if(!Array.isArray(x.stages))x.stages=[];
  if(typeof x.secrets==="string"&&x.secrets.trim())x.secrets.split(/\n+/).map(s=>s.replace(/^\s*[-*•]\s*/,"").trim()).filter(Boolean).forEach(s=>x.secretList.push({id:uid(),text:s,known:[],from:""}));
  x.secrets="";return x});
 p.locations=(p.locations||[]).map(c=>Object.assign({id:uid(),name:"",type:"Place",notes:"",look:"",img:"",svg:""},c));
 p.chapters=(p.chapters||[]).map(c=>Object.assign({id:uid(),title:"Untitled",act:1,target:3000,status:"Planned",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:"Past",summary:"",beats:"",text:"",versions:[],scenes:[]},c));
 if(!p.chapters.length)p.chapters.push({id:uid(),title:"Chapter 1",act:1,target:3000,status:"Planned",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:"Past",summary:"",beats:"",text:"",versions:[],scenes:[]});
 if(!p.tpl)p.tpl=CHAPTER_TPL;
 p.tpls=Object.assign({},DEFAULT_TPLS,{write:p.tpl},p.tpls||{});
 if(!p.master)p.master=MASTER||FALLBACK_MASTER;
 p.ai=Object.assign({chapterWords:3000,format:"Prose + separate editorial report"},p.ai||{},CFG);
 p.agents=p.agents||[];p.board=p.board||{cards:[],links:[]};
 p.history=p.history||[];p.proposals=p.proposals||[];
 p.timeline=p.timeline||{tracks:[{id:uid(),name:"Main plot",color:"#1c1c1c"},{id:uid(),name:"Character arcs",color:"#2a62d6"},{id:uid(),name:"Subplots",color:"#9b4dca"}],items:[]};
 /* colour inputs only accept #rrggbb: repair any short or invalid values already saved */
 const hex=c=>/^#[0-9a-f]{6}$/i.test(c||"")?c:(/^#[0-9a-f]{3}$/i.test(c||"")?"#"+c.slice(1).split("").map(x=>x+x).join(""):"#999999");
 p.timeline.tracks.forEach(t=>t.color=hex(t.color));
 p.timeline.items.forEach(x=>x.color=hex(x.color));
 return p;
}
function shell(){document.body.classList.toggle("focus",focusMode&&view==="chap");
 $("#proj").innerHTML=all.map(p=>`<option value="${p.id}" ${p.id===P.id?"selected":""}>${esc(p.name||"Untitled")}</option>`).join("")+'<option value="__new">+ New project</option>';
 $("#menu").innerHTML=VIEWS.map(v=>`<a data-v="${v[0]}" title="${v[1]}" class="${v[0]===view?"on":""}"><span class="ic">${v[2]}</span><span class="lb">${v[1]}</span></a>`).join("")+(CAN_WIN&&!WIN?`<a data-act="popout" title="Open Novel Studio in its own window (closes the side panel)"><span class="ic">⧉</span><span class="lb">Pop out</span></a>`:"");
 const on=$("#menu a.on");if(on&&on.scrollIntoView)on.scrollIntoView({block:"nearest",inline:"nearest"});
}
function render(){try{syncBible(P)}catch(e){console.warn("[novel-studio] sync",e)}shell();$("#main").innerHTML=bkBanner()+V[view]();document.querySelectorAll("#main [placeholder]").forEach(e=>{if(!e.title)e.title=e.placeholder});if(window.cp)cp.style.display="none";const t=document.querySelector(".ms");if(t)upd();kpi();if(view==="board")lines();if(view==="ai")updTok()}

/* ---------- writing KPIs ---------- */
const kpiOpts=()=>({blacklist:P.style.blacklist,allow:P.style.allow,ignore:P.style.ignore,repeatMin:P.style.repeatMin,names:[...P.characters.map(x=>x.name),...(P.locations||[]).map(x=>x.name)].flatMap(n=>String(n||"").split(/[\s,]+/)).filter(w=>w.length>1)});
const kpiSoon=()=>{clearTimeout(kt);kt=setTimeout(kpi,350)};
function kpi(){
 const el=$("#kpi");if(!el||!P.chapters[ci])return;
 const c=P.chapters[ci],t=c.text||"",a=kpiAnalyse(t,kpiOpts());
 if(!a.words){el.innerHTML='<h3 style="margin-top:0">Chapter KPIs</h3><p class="mute">Write or paste text into the manuscript to see word count, repeated words and blacklist hits.</p>';return}
 const pct=c.target?Math.round(a.words/c.target*100):0,S=(v,l)=>`<div><b>${v}</b>${l}</div>`,chip=(h,x="")=>`<span class="tag">${h}${x}</span>`,bl=a.bl;
 const snip=h=>{const s=Math.max(0,h.i-45),e=Math.min(t.length,h.i+h.n+45);return(s?"…":"")+esc(t.slice(s,h.i)).replace(/\n/g," ")+"<mark>"+esc(t.slice(h.i,h.i+h.n))+"</mark>"+esc(t.slice(h.i+h.n,e)).replace(/\n/g," ")+(e<t.length?"…":"")};
 el.innerHTML=`<h3 style="margin-top:0">Chapter KPIs</h3>
 <div class="stats">${S(a.words.toLocaleString(),"words ("+pct+"% of "+(c.target||0).toLocaleString()+")")}${S(a.readMin+" min","reading time")}${S(a.sentences,"sentences")}${S(a.avgSent,"avg words / sentence")}${S(a.longest,"longest sentence")}${S(a.paras,"paragraphs")}${S(a.dialoguePct+"%","dialogue")}${S(a.unique.toLocaleString(),"unique words")}</div>
 <div class="bar" style="margin-bottom:12px"><i style="width:${Math.min(100,pct)}%"></i></div>
 <h3>Blacklist hits: ${bl.total} <span class="mute">(${(bl.total/a.words*1000).toFixed(1)} per 1,000 words)</span></h3>
 <div>${bl.entries.map(e=>e.count?chip(`<b>${esc(e.label)}</b> ×${e.count}`+(e.top.length&&(e.top.length>1||e.top[0][0]!==e.label)?` <span class="mute">${e.top.map(x=>esc(x[0])+" ×"+x[1]).join(", ")}</span>`:"")):"").join("")||'<span class="mute">No blacklisted words found.</span>'}</div>
 <div class="row" style="margin-top:8px"><input id="blq" placeholder="Add to blacklist (word, *ly pattern or phrase)"><button class="sm" data-act="bladd">Add</button><button class="sm" data-v="set">Edit lists</button></div>
 ${bl.hits.length?`<div class="box" style="max-height:170px;overflow:auto;font-size:13px">${bl.hits.slice(0,80).map(h=>`<div>${snip(h)}</div>`).join("")}${bl.hits.length>80?`<div class="mute">…and ${bl.hits.length-80} more</div>`:""}</div>`:""}
 <h3>Repeated words <span class="mute">(used ${P.style.repeatMin}+ times; character and place names ignored)</span></h3>
 <div>${a.repeated.map(([w,n])=>chip(`<b>${esc(w)}</b> ×${n} <span class="mute">${(n/a.words*1000).toFixed(1)}/1k</span>`,` <a data-act="blban" data-w="${esc(w)}" title="Add to blacklist" style="cursor:pointer">⊘</a> <a data-act="blig" data-w="${esc(w)}" title="Ignore this word in the repetition check" style="cursor:pointer">✕</a>`)).join("")||'<span class="mute">Nothing flagged.</span>'}</div>
 <h3>Repeated phrases <span class="mute">(3 words, 3+ times)</span></h3>
 <div>${a.phrases.map(([p,n])=>chip(`${esc(p)} ×${n}`)).join("")||'<span class="mute">None.</span>'}</div>
 <h3>Sentence openers <span class="mute">(share of sentences, 3+ uses)</span></h3>
 <div>${a.openers.map(([w,n])=>chip(`<b>${esc(w)}</b> ${n} <span class="mute">${Math.round(n/a.sentences*100)}%</span>`)).join("")||'<span class="mute">None.</span>'}</div>`;
}

/* ---------- clipboard (Google Docs round trip) ---------- */
const tidyText=t=>{t=t.replace(/\r\n?/g,"\n").replace(/\u00a0/g," ").replace(/[ \t]+\n/g,"\n").trim();if(!/\n[ \t]*\n/.test(t))t=t.replace(/\n/g,"\n\n");return t.replace(/\n{3,}/g,"\n\n")};
async function copyOut(txt,msg){try{await navigator.clipboard.writeText(txt)}catch(e){const a=document.createElement("textarea");a.value=txt;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();document.execCommand("copy");a.remove()}$("#st").textContent=msg}
async function pasteChap(mode){
 let txt="";
 try{txt=await navigator.clipboard.readText()}catch(e){$("#st").textContent="Clipboard read was blocked. Click in the manuscript box and press Ctrl/Cmd+V instead.";return}
 if(!txt.trim()){$("#st").textContent="Clipboard is empty";return}
 if(tidyOn)txt=tidyText(txt);
 const c=P.chapters[ci];
 if(mode==="new"){
  let title="",body=txt;const m=txt.match(/^\s*(#{1,3}\s+.+|chapter\s+[\w-]+[^\n]*)\n+/i);
  if(m){title=m[1].replace(/^#{1,3}\s+/,"").trim();body=txt.slice(m[0].length).trim()}
  P.chapters.push({id:uid(),title:title||"Chapter "+(P.chapters.length+1),act:c.act,target:P.ai.chapterWords||3000,status:"Drafting",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:c.tense||"Past",summary:"",beats:"",text:body,versions:[],scenes:[]});
  ci=P.chapters.length-1;$("#st").textContent="Pasted as chapter "+(ci+1);
 }else{
  if(mode==="replace"&&c.text.trim()&&!await ask("Replace the manuscript of this chapter with the clipboard text? The current text is kept in Version History."))return;
  (c.versions=c.versions||[]).unshift({t:Date.now(),text:c.text,note:"Before paste"});c.versions=c.versions.slice(0,30);
  c.text=mode==="append"&&c.text.trim()?c.text.replace(/\s+$/,"")+"\n\n"+txt:txt;
  $("#st").textContent=(mode==="append"?"Appended ":"Replaced with ")+wc(txt).toLocaleString()+" words from clipboard";
 }
 save();render();
}

const V={
dash(){return`<div class="row" style="gap:6px;margin-bottom:16px">${[["ov","Overview"],["app","Appearances"]].map(t=>`<button class="${dashTab===t[0]?"pri":""}" data-dtab="${t[0]}">${t[1]}</button>`).join("")}</div>`+(dashTab==="app"?V.dashGrid():V.dashOv())},
dashOv(){const w=P.chapters.reduce((a,c)=>a+wc(c.text),0),pct=Math.min(100,Math.round(w/P.target*100));
 const act=a=>P.chapters.filter(c=>+c.act===a).reduce((s,c)=>s+wc(c.text),0);
 const pend=(P.proposals||[]).filter(x=>x.status==="pending").length;
 const gl=genreLabel(),ko=kpiOpts(),flags=P.chapters.map(c=>c.text?kpiAnalyse(c.text,ko).bl.total:0);
 return`<div class="row" style="align-items:baseline;margin-bottom:4px"><h2 style="margin:0">${esc(P.name)}</h2>${gl?`<span class="tag">${esc(gl)}</span>`:""}<button class="sm" data-v="proj" style="margin-left:auto">Edit project details</button></div>
 ${P.subtitle?`<p class="mute" style="margin:0 0 10px;font-size:15px;font-style:italic">${esc(P.subtitle)}</p>`:""}
 ${P.strapline?`<div class="box" style="white-space:pre-wrap;margin-bottom:16px">${esc(P.strapline)}</div>`:`<p class="mute" style="margin:0 0 14px">Add a subtitle, genre, strapline and plot in <a data-v="proj" style="cursor:pointer;text-decoration:underline">Project</a> to ground every AI prompt.</p>`}
 <div class="stats"><div><b>${w.toLocaleString()}</b>words written</div><div><b>${pct}%</b>of ${P.target.toLocaleString()}</div><div><b>${P.chapters.filter(c=>c.status==="Final"||c.status==="Edited").length}/${P.chapters.length}</b>chapters edited</div><div><b>${pend}</b>pending AI proposals</div></div>
 <div class="bar"><i style="width:${pct}%"></i></div><p class="mute">Act 1: ${act(1).toLocaleString()} · Act 2: ${act(2).toLocaleString()} · Act 3: ${act(3).toLocaleString()} words</p>
 <h3>Chapters</h3><table><tr><th>Title</th><th>Act</th><th>Status</th><th>Words</th><th title="Blacklist hits">Flags</th><th>Summary</th></tr>${P.chapters.map((c,i)=>`<tr><td><a data-open="${i}" style="cursor:pointer;text-decoration:underline">${i+1}. ${esc(c.title)}</a></td><td>${c.act}</td><td>${c.status}</td><td>${wc(c.text)} / ${c.target}</td><td>${flags[i]?"⚑ "+flags[i]:""}</td><td class="mute">${c.summary?"Done":"Missing"}</td></tr>`).join("")}</table>`},
proj(){const pl=P.plot,sw=wc(P.synopsis),fk=Object.keys(FRAMEWORKS);
 const chSel=(path,sel,first)=>`<select data-k="${path}" style="max-width:240px" aria-label="${esc(first)}">${chOpts(sel,first)}</select>`;
 const beats=pl.beats.map((b,j)=>`<div class="box"><div class="row" style="flex-wrap:nowrap"><input data-k="plot.beats.${j}.label" value="${esc(b.label)}" placeholder="Beat name" aria-label="Beat name" style="font-weight:600"><select data-k="plot.beats.${j}.chap" style="max-width:240px;flex:none" aria-label="Chapter">${chOpts(b.chap,"Chapter not set")}</select><button class="sm" data-act="delbeat" data-i="${j}" title="Remove beat">×</button></div><textarea data-k="plot.beats.${j}.text" rows="2" placeholder="What happens at this point in your story">${esc(b.text)}</textarea></div>`).join("");
 const threads=pl.threads.map((t,j)=>{const k=`plot.threads.${j}.`;return`<div class="box"><div class="row" style="flex-wrap:nowrap"><input data-k="${k}name" value="${esc(t.name)}" placeholder="Thread name, e.g. The blackmail" aria-label="Thread name" style="font-weight:600"><select data-k="${k}type" style="max-width:170px;flex:none" aria-label="Type">${THREAD_TYPES.map(x=>`<option ${x===t.type?"selected":""}>${esc(x)}</option>`).join("")}</select><select data-k="${k}status" style="max-width:120px;flex:none" aria-label="Status">${THREAD_STATUS.map(x=>`<option ${x===t.status?"selected":""}>${esc(x)}</option>`).join("")}</select><button class="sm" data-act="delthread" data-i="${j}" title="Remove thread">×</button></div><div class="row">${chSel(k+"setup",t.setup,"Opens: chapter not set")}${chSel(k+"payoff",t.payoff,"Pays off: chapter not set")}</div><textarea data-k="${k}notes" rows="2" placeholder="What the thread is, how it develops, how it ends">${esc(t.notes)}</textarea></div>`}).join("");
 return`<h2>Project</h2>
<p class="mute">Everything here is assembled into the <b>Novel Bible</b> that the AI reads. Chapter tasks get only the act, story beats and threads that apply to that chapter, so the more precisely you place them, the better the AI stays on course. <button class="sm" data-act="viewnovel">View generated Novel Bible</button></p>
${bpPanel()}
<h3>Identity &amp; pitch</h3>
<div class="box">
 <div class="row">
  <div style="flex:2"><span class="lbl">Title</span><input data-k="name" value="${esc(P.name)}" placeholder="Novel title"></div>
  <div style="flex:2"><span class="lbl">Subtitle</span><input data-k="subtitle" value="${esc(P.subtitle)}" placeholder="Subtitle (optional)"></div>
  <div style="max-width:150px"><span class="lbl">Target words</span><input data-k="target" data-num type="number" value="${P.target}" title="Target novel words"></div>
 </div>
 <div class="row">
  <div><span class="lbl">Genre (preset)</span><select data-k="genre"><option value="">Select a genre…</option>${GENRES.map(g=>`<option value="${esc(g)}" ${g===P.genre?"selected":""}>${esc(g)}</option>`).join("")}</select></div>
  <div><span class="lbl">Custom / freeform genre</span><input data-k="genreCustom" value="${esc(P.genreCustom)}" placeholder="e.g. Fenland Folk Horror / Eco-Gothic"></div>
 </div>
 ${fld("strapline","Two-paragraph strapline / pitch","Paragraph 1: hook, protagonist, setting and inciting disruption. Paragraph 2: escalating stakes, central conflict and thematic question.",P.strapline,5)}
</div>
<h3>Plot in brief</h3>
${fld("plot.short","Short plot synopsis","Roughly 100 to 200 words: who wants what, what stands in the way, how it turns out. For you and the AI, not for agents.",pl.short,6)}
<h3>Central question &amp; themes</h3>
<div class="row">${fld("plot.question","Central dramatic question","The question the whole book answers, e.g. “Can he keep who he is once everyone is watching?”",pl.question,3)}${fld("plot.themes","Themes and motifs","What the book is about underneath, and the images or ideas that recur.",pl.themes,3)}</div>
<h3>Act summaries</h3>
<p class="mute">What each act is for. A chapter's prompt gets the summary of the act it sits in. Set each chapter's act on the Chapters page.</p>
${[1,2,3].map(a=>fld("plot.acts."+a,"Act "+a,a===1?"Setup: the world, the want, the disruption, the point of no return.":a===2?"Confrontation: complications, midpoint shift, the low point.":"Resolution: the crisis, climax and aftermath.",pl.acts[a],3)).join("")}
<h3>Structure beats</h3>
<p class="mute">Pin the big turning points to chapters. A chapter's prompt gets the beat it carries, the last beat reached and the next one ahead (with “do not reach it early”). The plot audit uses them too.</p>
<div class="row"><select data-k="plot.fw" style="max-width:260px" aria-label="Framework">${fk.map(k=>`<option value="${k}" ${k===pl.fw?"selected":""}>${esc(FRAMEWORKS[k].name)}</option>`).join("")}</select><button data-act="loadfw">Add this framework's beats</button><button data-act="addbeat">+ Add your own beat</button></div>
${beats||'<p class="mute">No beats yet. Pick a framework to start from, or add your own.</p>'}
<h3>Story threads</h3>
<p class="mute">Subplots, mysteries, arcs and setups. Record where each opens and where it pays off. Chapter prompts list the threads that open, run or pay off in that chapter.</p>
${threads||'<p class="mute">No threads yet.</p>'}
<p><button data-act="addthread">+ Add thread</button></p>
<h3>Ending</h3>
${fld("plot.ending","The ending","How the book actually ends, so analysis and audits can judge whether the story earns it.",pl.ending,4)}
<div class="row"><select data-k="plot.endingMode" style="max-width:520px" aria-label="Ending handling"><option value="hold" ${pl.endingMode!=="all"?"selected":""}>Keep the ending out of chapter-writing prompts (write, plan, rewrite, expand, describe, dialogue)</option><option value="all" ${pl.endingMode==="all"?"selected":""}>Send the ending with every task</option></select></div>
<p class="mute">This only controls the Ending field. If your synopsis also gives the ending away, it is still sent; untick “Synopsis &amp; plot” in the AI Toolkit's prompt list to hold all of it back.</p>
<h3>Synopsis</h3>
<p class="mute">${sw.toLocaleString()} words. A one-page submission synopsis is about 500 words, two pages about 800. It should state the ending.</p>
<textarea data-k="synopsis" rows="10">${esc(P.synopsis)}</textarea>
<div class="row" style="margin-top:8px"><button data-act="dlsyn">Download synopsis (.doc)</button></div>`},
bible(){
 const ED=["struct","voice","master"];
 if(!showGen&&GEN_KEYS.includes(bk))bk="struct";
 if(!ED.includes(bk)&&!GEN_KEYS.includes(bk))bk="struct";
 const gen=GEN_KEYS.includes(bk),nm=Object.fromEntries(BIBLE),val=bk==="master"?P.master:P.bible[bk],keyPath=bk==="master"?"master":"bible."+bk;
 const tab=k=>`<a data-bk="${k}" class="${k===bk?"on":""}">${nm[k]}${GEN_KEYS.includes(k)?' <span class="mute">(auto)</span>':""}</a>`;
 const ta=`font-family:ui-monospace,Menlo,monospace;font-size:14px`;
 return`<h2>Story Bible</h2>
 <p class="mute">Most of the Story Bible is now written for you from the forms (Project, Characters, Places &amp; Lore, Chapters, Story Timeline). The AI reads those generated documents, so keep the forms up to date. Only the documents below are edited by hand.</p>
 <div class="split">
  <div class="list">${ED.map(tab).join("")}<div style="margin-top:10px"><button class="sm" data-act="togen">${showGen?"Hide":"Show"} generated documents</button></div>${showGen?`<div class="cgh"><span>Generated, read-only</span></div>`+GEN_KEYS.map(tab).join(""):""}</div>
  <div class="grow">${gen
   ?`<div class="box">${esc(GEN_DESC[bk])} It is rebuilt automatically and cannot be edited here.</div><textarea readonly rows="28" style="${ta};background:var(--soft)">${esc(val||"")}</textarea>`
   :`<textarea data-k="${keyPath}" rows="28" style="${ta}">${esc(val||"")}</textarea><div class="row"><button data-act="bsample">Restore default</button></div><p class="mute">Markdown. Saved automatically. This document feeds the AI prompts.</p>`}</div>
 </div>`},
chars(){
 const C=P.characters;let i=C.findIndex(x=>x.id===curChar);if(i<0&&C.length){i=0;curChar=C[0].id}
 const tile=(x,k)=>`<a data-cid="${x.id}" class="ctile ${k===i?"on":""}" style="${x.inc===false?"opacity:.45":""}" title="${esc(x.name||"Unnamed")}">${src(x)?`<img src="${src(x)}" alt="">`:`<span class="head">👤</span>`}<span class="cn">${esc(x.name||"Unnamed")}</span></a>`;
 return`<h2>Characters</h2>${charSummary()}${impPanel()}
 <div class="split"><div class="clist"><div style="display:flex;gap:6px;margin-bottom:10px"><button class="pri" data-act="addchar" title="Add character" style="width:44px;min-width:0;font-size:18px;line-height:1;padding:5px 0">+</button><button data-act="delcharcur" title="Delete selected character" style="width:44px;min-width:0;font-size:18px;line-height:1;padding:5px 0" ${i<0?"disabled":""}>−</button></div>${TIERS.map(t=>({t,items:C.map((x,k)=>({x,k})).filter(o=>(o.x.tier||"major")===t[0])})).filter(g=>g.items.length).map(g=>`<div class="cgh"><span>${g.t[1]}</span><span>${g.items.length}</span></div><div class="cgrid">${g.items.map(o=>tile(o.x,o.k)).join("")}</div>`).join("")}</div>
 <div class="grow">${i>=0?charCard(C[i],i):'<p class="mute">No characters yet. Click + to add your first profile.</p>'}</div></div>`},
chap(){const c=P.chapters[ci],k=`chapters.${ci}.`;
 return`<h2>Chapters <button class="sm" data-act="focus">${focusMode?"Exit focus mode":"Focus mode"}</button></h2>
 <datalist id="dl-chars">${P.characters.map(x=>x.name?`<option value="${esc(x.name)}">`:"").join("")}</datalist>
 <datalist id="dl-locs">${(P.locations||[]).map(x=>x.name?`<option value="${esc(x.name)}">`:"").join("")}</datalist>
 <div class="split"><div class="list">${P.chapters.map((x,i)=>`<a data-ci="${i}" class="${i===ci?"on":""}">${i+1}. ${esc(x.title)}<br><span class="mute">${x.status} · ${wc(x.text)}w</span></a>`).join("")}
  <div class="row" style="gap:4px;margin-top:8px"><button class="sm pri" data-act="addchap">+ Chapter</button><button class="sm" data-act="inschap" title="Insert new chapter after current">Insert after</button><button class="sm" data-act="chapup" ${ci===0?"disabled":""} title="Move chapter up">↑</button><button class="sm" data-act="chapdn" ${ci===P.chapters.length-1?"disabled":""} title="Move chapter down">↓</button></div>
  <details style="margin-top:8px"><summary class="mute" style="cursor:pointer">Add several chapters</summary><div style="margin-top:6px"><label class="lbl" for="bkn">How many (1 to 99)</label><input id="bkn" type="number" min="1" max="99" step="1" value="5"><label class="lbl" for="bkt" style="margin-top:6px">Title pattern</label><input id="bkt" value="Chapter {n}"><label class="lbl" for="bka" style="margin-top:6px">Act</label><select id="bka">${[1,2,3].map(a=>`<option value="${a}" ${a===(+c.act||1)?"selected":""}>Act ${a}</option>`).join("")}</select><p class="mute" style="margin:6px 0">Numbering continues from chapter ${P.chapters.length+1}. {n} becomes the chapter number. New chapters go at the end, status Planned.</p><button class="sm" data-act="bulkchap">Create chapters</button></div></details>
 </div>
 <div class="grow"><div class="row"><input data-k="${k}title" value="${esc(c.title)}"><select data-k="${k}act" data-num>${[1,2,3].map(a=>`<option value="${a}" ${+c.act===a?"selected":""}>Act ${a}</option>`).join("")}</select><select data-k="${k}status">${STAT.map(s=>`<option ${s===c.status?"selected":""}>${s}</option>`).join("")}</select><input data-k="${k}target" data-num type="number" value="${c.target}" title="Target words"></div>
 <div class="row"><select data-k="${k}pov"><option value="">POV: unassigned</option>${P.characters.map(x=>`<option value="${x.id}" ${x.id===c.pov?"selected":""}>POV: ${esc(x.name||"Unnamed")}</option>`).join("")}</select><select data-k="${k}tense" style="max-width:130px">${["Past","Present"].map(t=>`<option value="${t}" ${t===(c.tense||"Past")?"selected":""}>${t} tense</option>`).join("")}</select><select data-k="${k}loc"><option value="">Place: unassigned</option>${(P.locations||[]).map(x=>`<option value="${x.id}" ${x.id===c.loc?"selected":""}>Place: ${esc(x.name||"Unnamed")}</option>`).join("")}</select></div>${P.timeline.items.some(x=>x.start<=ci&&ci<x.start+x.span)?`<p class="mute">Timeline events here: ${P.timeline.items.filter(x=>x.start<=ci&&ci<x.start+x.span).map(x=>esc(x.title)).join(", ")}</p>`:""}
 <h3>Characters, place and time</h3><div class="row"><input data-k="${k}major" value="${esc(c.major)}" placeholder="Major characters (comma separated)"><input data-k="${k}minor" value="${esc(c.minor)}" placeholder="Minor characters"></div>
 ${P.characters.some(x=>x.name)?`<div class="row"><select data-addchar="major"><option value="">+ Add major character…</option>${P.characters.filter(x=>x.name).map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join("")}</select><select data-addchar="minor"><option value="">+ Add minor character…</option>${P.characters.filter(x=>x.name).map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join("")}</select></div>`:""}
 <div class="row"><input list="dl-locs" data-k="${k}place" value="${esc(c.place)}" placeholder="Place (e.g. Jermyn Street, outside Turnbull & Asser)"><input data-k="${k}time" value="${esc(c.time)}" placeholder="Time (e.g. Friday night, June 1992, approx 10:30pm)"></div><h3>Summary (for the next AI to read)</h3><textarea data-k="${k}summary" rows="4" placeholder="What happens, what changes, what the reader learns">${esc(c.summary)}</textarea>
 <h3>Beats (one per line)</h3><textarea data-k="${k}beats" rows="5" placeholder="Scene 1: …">${esc(c.beats)}</textarea>
 <h3>Scenes</h3>${(c.scenes=c.scenes||[]).map((s,j)=>`<div class="card"><div class="row"><input data-k="${k}scenes.${j}.title" value="${esc(s.title)}" placeholder="Scene ${j+1} title"><input list="dl-chars" data-k="${k}scenes.${j}.pov" value="${esc(s.pov)}" placeholder="POV character"><button class="sm" data-act="sceneup" data-i="${j}" ${j===0?"disabled":""} title="Move scene up">↑</button><button class="sm" data-act="scenedn" data-i="${j}" ${j===c.scenes.length-1?"disabled":""} title="Move scene down">↓</button><button class="sm" data-act="delscene" data-i="${j}">Delete</button></div><div class="row"><input data-k="${k}scenes.${j}.chars" value="${esc(s.chars)}" placeholder="Characters in scene"><input list="dl-locs" data-k="${k}scenes.${j}.place" value="${esc(s.place)}" placeholder="Place"><input data-k="${k}scenes.${j}.time" value="${esc(s.time)}" placeholder="Time"></div><textarea data-k="${k}scenes.${j}.summary" rows="3" placeholder="Objective, conflict, outcome">${esc(s.summary)}</textarea></div>`).join("")}<p><button data-act="addscene">Add scene</button></p>
 <h3>Manuscript <span class="mute" id="wcount"></span></h3>
 <div class="row" style="margin-bottom:6px;gap:6px"><button class="sm" data-act="copych" title="Copy the chapter text">Copy chapter</button><button class="sm" data-act="copychmd" title="Copy with a # title line, for Google Docs Markdown paste">Copy with title</button><span class="mute" style="flex:none">Paste from clipboard:</span><button class="sm" data-act="pastereplace">Replace</button><button class="sm" data-act="pasteappend">Append</button><button class="sm" data-act="pastenew">As new chapter</button><label class="mute" style="flex:none"><input type="checkbox" id="tidy" ${tidyOn?"checked":""} style="width:auto"> tidy paragraphs</label></div>
 <textarea class="ms" data-k="${k}text" rows="20">${esc(c.text)}</textarea>
 <div id="kpi" class="box kpi" style="margin-top:10px"></div>
 <div class="row" style="margin-top:10px"><button data-act="ver">Save version</button><select id="vers"><option value="">Version history (${(c.versions||[]).length})</option>${(c.versions||[]).map((v,i)=>`<option value="${i}">${new Date(v.t).toLocaleString()} · ${wc(v.text)}w${v.note?" · "+esc(v.note):""}</option>`).join("")}</select><button data-act="restore">Restore</button><button data-act="delchap">Delete chapter</button></div><div class="row"><button data-v="export">More downloads…</button><label class="mute">Upload text into this chapter <input type="file" id="chfile" accept=".md,.txt,.markdown"></label></div></div></div>`},
notes(){
 const notes=P.notes||[];
 const q=noteSearch.trim().toLowerCase();
 const vis=notes.filter(n=>(noteFilter==="all"||n.scope===noteFilter)&&(!q||(n.title+" "+n.tag+" "+n.text).toLowerCase().includes(q)));
 let active=vis.find(n=>n.id===curNoteId)||vis[0]||null;
 if(!active&&!q&&noteFilter==="all"&&notes.length)active=notes[0];
 if(active)curNoteId=active.id;
 const idx=active?notes.indexOf(active):-1;
 const aiCnt=notes.filter(n=>n.scope==="ai").length,privCnt=notes.length-aiCnt;
 return`<h2>Notes</h2>
 <div class="row"><span class="mute">Create and organise multiple notes (${aiCnt} AI &amp; Canon · ${privCnt} Private). Only <b>AI &amp; Canon</b> notes are sent to AI prompts and exports.</span><button data-v="export">Downloads…</button></div>
 <div class="split">
  <div class="list" style="width:260px">
   <div class="row" style="gap:4px;margin-bottom:8px">
    <button class="pri sm" data-act="addnote" data-scope="ai">+ AI note</button>
    <button class="sm" data-act="addnote" data-scope="priv">+ Private</button>
   </div>
   <input id="nsearch" value="${esc(noteSearch)}" placeholder="Filter notes…" style="margin-bottom:6px;padding:5px 8px;font-size:13px">
   <div class="row" style="gap:4px;margin-bottom:8px">
    ${[["all","All"],["ai","AI"],["priv","Private"]].map(f=>`<button class="sm ${noteFilter===f[0]?"pri":""}" data-act="nfilt" data-f="${f[0]}">${f[1]}</button>`).join("")}
   </div>
   ${vis.map(n=>`<a data-nid="${n.id}" class="${active&&n.id===active.id?"on":""}" style="margin-bottom:4px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
     <span class="ntitle" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(n.title||"Untitled note")}</span>
     <span class="nbadge ${n.scope}">${n.scope==="ai"?"AI":"Priv"}</span>
    </div>
    <span class="mute" style="font-size:12px">${n.tag?esc(n.tag)+" · ":""}${wc(n.text)}w</span>
   </a>`).join("")||'<p class="mute">No matching notes.</p>'}
  </div>
  <div class="grow">
   ${active?`<div class="note-pane ${active.scope==="priv"?"priv":""}">
    <div class="row">
     <input data-k="notes.${idx}.title" value="${esc(active.title)}" placeholder="Note title" style="flex:2;font-weight:600">
     <select data-k="notes.${idx}.scope" style="max-width:220px">
      <option value="ai" ${active.scope==="ai"?"selected":""}>AI &amp; Canon (sent to AI)</option>
      <option value="priv" ${active.scope==="priv"?"selected":""}>Private (excluded from AI)</option>
     </select>
     <input data-k="notes.${idx}.tag" value="${esc(active.tag)}" placeholder="Tag (Plot, Ch 3…)" style="max-width:150px">
    </div>
    <div class="row" style="gap:6px">
     <span class="mute">${active.scope==="ai"?"Included in AI Toolkit prompts, AI Analysis Export & Super Prompt.":"Excluded from AI prompts & AI exports; saved in device & JSON backups."}</span>
     <button class="sm" data-act="noteup" ${idx===0?"disabled":""} title="Move note up">↑</button>
     <button class="sm" data-act="notedown" ${idx===notes.length-1?"disabled":""} title="Move note down">↓</button>
     <button class="sm" data-act="dupnote">Duplicate</button>
     <button class="sm" data-act="dlnote">Download (.md)</button>
     <button class="sm" data-act="delnote" ${notes.length<=1?"disabled":""}>Delete</button>
    </div>
    <textarea data-k="notes.${idx}.text" rows="22" placeholder="${active.scope==="ai"?"Tone reminders, thematic rules, pacing guidance, overarching author notes for the AI…":"Wild ideas, alternate twists, contradictions, spoilers, or notes that would confuse the AI…"}">${esc(active.text)}</textarea>
   </div>`:`<div class="box"><p class="mute">No notes match the current filter. Clear the search or create a new note in Column 1.</p></div>`}
  </div>
 </div>`},
subs(){return`<h2>Submissions</h2><p class="mute">Your synopsis now lives on the <a data-v="proj" style="cursor:pointer;text-decoration:underline">Project</a> page, next to the plot it summarises.</p><h3>Query letter</h3><textarea data-k="query" rows="10">${esc(P.query)}</textarea>
 <h3>Agents and publishers</h3><table><tr><th>Name</th><th>Agency / imprint</th><th>Type</th><th>Status</th><th>Notes</th><th></th></tr>${P.agents.map((a,i)=>`<tr><td><input data-k="agents.${i}.name" value="${esc(a.name)}"></td><td><input data-k="agents.${i}.org" value="${esc(a.org)}"></td><td><select data-k="agents.${i}.type">${["Agent","Publisher"].map(t=>`<option ${t===a.type?"selected":""}>${t}</option>`).join("")}</select></td><td><select data-k="agents.${i}.status">${["To query","Queried","Requested pages","Rejected","Offer"].map(t=>`<option ${t===a.status?"selected":""}>${t}</option>`).join("")}</select></td><td><input data-k="agents.${i}.notes" value="${esc(a.notes)}"></td><td><button data-act="delagent" data-i="${i}">×</button></td></tr>`).join("")}</table><p><button class="pri" data-act="addagent">Add agent or publisher</button></p>`},
ai(){const pend=(P.proposals||[]).filter(x=>x.status==="pending");
 const opt=m=>`<option value="${m[0]}" ${m[0]===aiMode?"selected":""}>${m[1]}</option>`,noCh=["audit_plot","audit_synopsis","skeleton","analyse"].includes(aiMode),isAud=isAudit(aiMode);
 return`<h2>AI Toolkit</h2><details id="aihelp" class="box" ${LS.get("ns_aihelp")==="0"?"":"open"}><summary><b>How this page works</b></summary><ol class="mute" style="margin:8px 0 0 18px;padding:0"><li><b>Pick a task.</b> Write chapter, Summarise chapter, Audit chapter and Plot audit are the main ones. The line under the pickers says what the task does.</li><li><b>Check the list.</b> Each task shows what it needs. Writing a chapter is the heavy one: if the Chapters page is not filled in, you are told what is missing instead of getting a weak result.</li><li><b>Run</b> sends it to your AI and the reply appears below, like a chat. <b>Copy reply</b> puts it on your clipboard. You can also <b>Copy prompt</b> and paste it into any other AI, then paste its reply into the reply box.</li><li>Nothing in your book changes until you click an Apply button on the reply.</li></ol></details>
 <div class="box"><div class="row"><button data-act="ltest" title="Checks the server, then asks the model to reply">Test AI connection</button><span class="mute" style="flex:3">${isLocal()?"Local server "+esc(localBase()||"(host not set)")+(P.ai.lModel?" · model "+esc(P.ai.lModel):" · no model chosen"):"Cloud endpoint "+esc(P.ai.endpoint||"(not set)")+(P.ai.model?" · model "+esc(P.ai.model):"")}. Change in <a data-v="set" style="cursor:pointer;text-decoration:underline">Settings</a>.</span></div>
 ${localMsg?`<div class="box ${/^(OK|Connected)/.test(localMsg)?"":"warn"}" style="white-space:pre-wrap;margin:0">${esc(localMsg)}</div>`:""}
 <details style="margin-top:6px"><summary class="mute" style="cursor:pointer">Model, temperature and API key</summary><div class="row" style="margin-top:8px">${isLocal()?`<input id="mod" data-k="ai.lModel" list="dl-lmodels" value="${esc(P.ai.lModel)}" style="max-width:220px" placeholder="Local model name"><datalist id="dl-lmodels">${localModels.map(m=>`<option value="${esc(m)}">`).join("")}</datalist>`:`<input id="ep" data-k="ai.endpoint" value="${esc(P.ai.endpoint)}" placeholder="API or server proxy URL"><input id="mod" data-k="ai.model" value="${esc(P.ai.model)}" style="max-width:170px" placeholder="Model">`}<input id="temp" data-k="ai.temp" data-num type="number" step="0.1" min="0" max="2" value="${P.ai.temp}" style="max-width:80px" title="Temperature"><input id="key" type="password" value="${esc(aiKey)}" placeholder="API key (memory only, blank if not needed)"></div></details></div>
 <div class="row"><select id="aimode" aria-label="Task"><optgroup label="Main tasks">${OPS.filter(m=>MAIN_OPS.includes(m[0])).map(opt).join("")}</optgroup><optgroup label="Other tools">${OPS.filter(m=>!MAIN_OPS.includes(m[0])).map(opt).join("")}</optgroup></select><select id="aich" aria-label="Chapter" ${noCh?"disabled":""}>${P.chapters.map((x,i)=>`<option value="${i}" ${i===ci?"selected":""}>${i+1}. ${esc(x.title)}</option>`).join("")}</select></div>
 <p class="mute" id="opdesc" style="margin:0 0 10px">${esc(OP_DESC[aiMode]||"")}</p>
 ${readyPanel()}
 ${SEL_HINT[aiMode]?`<textarea id="aisel" rows="3" style="margin-bottom:10px" placeholder="${esc(SEL_HINT[aiMode])}">${esc(aiSel)}</textarea>`:""}
 <div class="row"><button class="pri" data-act="runai">Run</button><button data-act="stopai" title="Stop the running AI call or audit batch">Stop</button><button data-act="copy" title="Copy the full prompt to paste into another AI">Copy prompt</button>${aiMode==="audit_chapter"?`<button data-act="auditall" title="Run the chapter audit on every chapter that has text, one after another">Audit all chapters</button>`:""}</div>
 <details id="promptbox" class="box" ${aiOut?"open":""}><summary><b>Prompt and context</b> <span class="mute">what will be sent to the AI</span></summary>
  <div class="fld" style="margin:10px 0"><span class="fl">What goes into the prompt</span><span class="fh">These switch automatically when you change the task. Tick or untick to send more or less, then click Preview prompt. Hover a box for details.</span><div class="row" style="gap:6px 14px;margin:4px 0 0">${CTX_LIST.map(x=>`<label class="mute" style="flex:none" title="${esc(x[2])}"><input type="checkbox" data-ctx="${x[0]}" ${ctx[x[0]]?"checked":""} style="width:auto"> ${x[1]}</label>`).join("")}<span class="mute" id="tok"></span></div></div>
  <div class="row"><select id="aitips" title="Built-in writing tips added to the prompt. They ship with the app and cannot be edited."><option value="auto" ${aiTips==="auto"?"selected":""}>Tips: automatic</option><option value="novel" ${aiTips==="novel"?"selected":""}>Tips: novel</option><option value="script" ${aiTips==="script"?"selected":""}>Tips: script</option><option value="none" ${aiTips==="none"?"selected":""}>Tips: none</option></select><button data-act="gen">Preview prompt</button><button data-v="export" title="AI Analysis Export and Super prompt are on the Export &amp; Downloads page">AI exports…</button></div>
  <textarea id="out" rows="12" placeholder="Click Preview prompt to see exactly what will be sent. You can edit it before running.">${esc(aiOut)}</textarea></details>

 <h3>AI reply</h3>
 <textarea id="res" rows="16" placeholder="The AI's reply appears here, like a chat. You can also paste a reply from ChatGPT or Claude here to copy, save or apply it.">${esc(aiRes)}</textarea>
 <div class="row" style="margin-top:8px"><button class="pri" data-act="copyres">Copy reply</button>${aiMode==="write"?`<button data-act="applyprose">Apply prose to Ch ${ci+1} (backup first)</button><button data-act="savever">Save as Ch ${ci+1} version</button>`:""}${aiMode==="sum"?`<button data-act="applysum">Apply to Ch ${ci+1} summary &amp; details</button>`:""}${isAud?`<button data-act="dlaudits">Download audit reports (.md)</button>`:""}<button data-act="clearres">Clear</button></div>
 <details style="margin-bottom:10px"><summary class="mute" style="cursor:pointer">More actions</summary><div class="row" style="margin-top:8px"><button data-act="splitai">Split prose &amp; report</button><button data-act="savever">Save as Ch ${ci+1} version</button><button data-act="loghist">Save to history</button><button data-act="qprop" data-t="cont">Queue Continuity</button><button data-act="qprop" data-t="summary">Queue Ch summary</button><button data-act="qprop" data-t="beats">Queue Ch beats</button>${aiMode!=="write"?`<button data-act="applyprose">Apply prose to Ch ${ci+1} (backup first)</button>`:""}<button data-act="auditsyn">Audit synopsis</button></div></details>

 ${pend.length?`<h3>Pending AI Proposals (${pend.length})</h3>${pend.map(p=>`<div class="card"><div class="row"><b>${esc(p.title)}</b><span class="mute">${new Date(p.t).toLocaleString()}</span><button class="sm pri" data-act="appprop" data-id="${p.id}">Approve &amp; apply</button><button class="sm" data-act="rejprop" data-id="${p.id}">Dismiss</button></div><textarea rows="3" data-prop="${p.id}">${esc(p.content)}</textarea></div>`).join("")}`:""}

 ${P.history.length?`<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Editorial History (${P.history.length})</summary>${P.history.slice(0,20).map(h=>`<div class="card"><div class="row"><b>${esc(h.op)} · Ch ${h.chapIdx+1}</b><span class="mute">${new Date(h.t).toLocaleString()}</span><button class="sm" data-act="delhist" data-id="${h.id}">Delete</button></div><textarea rows="4" readonly>${esc(h.reply)}</textarea></div>`).join("")}</details>`:""}

 <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Master Instruction &amp; Operation Templates</summary>
  <h3>Master instruction</h3><textarea data-k="master" rows="10">${esc(P.master)}</textarea><div class="row"><button data-act="resetm">Reset master instruction</button></div>
  <h3>Operation template: <select id="tpled" style="width:auto;display:inline-block">${Object.keys(DEFAULT_TPLS).map(k=>`<option value="${k}" ${k===tplEdit?"selected":""}>${OPS.find(o=>o[0]===k)?.[1]||k}</option>`).join("")}</select></h3>
  <textarea data-k="tpls.${tplEdit}" rows="12">${esc(P.tpls[tplEdit])}</textarea>
  <div class="row"><button data-act="resett">Reset this template</button></div>
 </details>`},
time(){const T=P.timeline,n=P.chapters.length;T.items.forEach(x=>{x.start=Math.max(0,Math.min(n-1,+x.start||0));x.span=Math.max(1,Math.min(n-x.start,+x.span||1))});
 const it=T.items.find(x=>x.id===ti),ix=T.items.indexOf(it),q=`timeline.items.${ix}.`;
 const ents=it?[...it.chars.map(id=>["char",id,P.characters.find(c=>c.id===id)]),...it.places.map(id=>["place",id,(P.locations||[]).find(c=>c.id===id)])].filter(a=>a[2]):[];
 return`<h2>Story Timeline</h2><div class="row"><button class="pri" data-act="tadd">Add event</button><button data-act="ttrack">Add track</button><span class="mute">Drag characters/places below onto any track cell or bar. Drag bars sideways/vertically or resize the right edge.</span></div>
 ${P.characters.length||(P.locations||[]).length?`<div class="row" style="gap:6px;margin-bottom:10px">${P.characters.map(c=>`<span class="chip" draggable="true" data-tdrag="char:${c.id}">${src(c)?`<img src="${src(c)}" alt="">`:""}${esc(c.name||"Unnamed")}</span>`).join("")}${(P.locations||[]).map(p=>`<span class="chip" style="border-style:dashed" draggable="true" data-tdrag="place:${p.id}">${src(p)?`<img src="${src(p)}" alt="">`:""}${esc(p.name||"Unnamed")}</span>`).join("")}</div>`:""}
 <div style="overflow:auto;border:1px solid var(--line);border-radius:4px"><div style="width:${230+n*CW}px">
 <div style="display:flex;background:var(--soft)"><div style="width:230px;flex:none;padding:6px">Tracks</div>${P.chapters.map((c,j)=>`<div style="width:${CW}px;flex:none;padding:6px;border-left:1px solid var(--line);font-size:12px"><b>${j+1}</b> ${esc(c.title)}<br><span class="mute">Act ${c.act} · ${wc(c.text)}w</span></div>`).join("")}</div>
 ${T.tracks.map((tr,r)=>{const its=T.items.filter(x=>x.tid===tr.id).sort((a,b)=>a.start-b.start),ends=[],ls={};its.forEach(x=>{let l=ends.findIndex(e=>e<=x.start);if(l<0){l=ends.length;ends.push(0)}ends[l]=x.start+x.span;ls[x.id]=l});const h=Math.max(1,ends.length)*38+8;
 return`<div data-row="${tr.id}" style="display:flex;border-top:1px solid var(--line);height:${h}px"><div style="width:230px;flex:none;padding:6px;display:flex;gap:4px;align-items:flex-start"><input type="color" data-k="timeline.tracks.${r}.color" value="${tr.color}" style="width:32px;flex:none;padding:1px;height:34px" title="Track colour"><input data-k="timeline.tracks.${r}.name" value="${esc(tr.name)}" style="flex:1;min-width:0" title="Track name"><button class="sm" data-act="tdel" data-id="${tr.id}" title="Delete track">×</button></div><div data-tlane="${tr.id}" style="position:relative;flex:none;width:${n*CW}px;background:repeating-linear-gradient(90deg,transparent 0 ${CW-1}px,var(--line) ${CW-1}px ${CW}px)">${its.map(x=>`<div class="tb ${x.id===ti?"on":""}" data-tb="${x.id}" style="left:${x.start*CW+3}px;width:${x.span*CW-6}px;top:${ls[x.id]*38+4}px;border-left-color:${x.color}">${esc(x.title)}${[...x.chars.map(id=>P.characters.find(c=>c.id===id)),...x.places.map(id=>(P.locations||[]).find(c=>c.id===id))].filter(e=>e&&src(e)).slice(0,3).map(e=>`<img src="${src(e)}" alt="">`).join("")}<i class="tz" data-tz="${x.id}"></i></div>`).join("")}</div></div>`}).join("")}
 </div></div>
 ${it?`<div class="card"><div class="row"><input data-k="${q}title" value="${esc(it.title)}"><input type="color" data-k="${q}color" value="${it.color}"><select data-k="${q}tid">${T.tracks.map(t=>`<option value="${t.id}" ${t.id===it.tid?"selected":""}>${esc(t.name)}</option>`).join("")}</select><select data-k="${q}start" data-num>${P.chapters.map((c,j)=>`<option value="${j}" ${j===it.start?"selected":""}>Start: chapter ${j+1}</option>`).join("")}</select><input type="number" min="1" data-k="${q}span" data-num value="${it.span}" title="Chapters spanned"></div>
 <textarea data-k="${q}notes" rows="2" placeholder="Stakes, changes, clues">${esc(it.notes)}</textarea>
 <div style="margin:8px 0">${ents.map(a=>`<span class="tag">${esc(a[2].name||"Unnamed")} <a data-act="tdet" data-kind="${a[0]}" data-id="${a[1]}" style="cursor:pointer">×</a></span>`).join("")||'<span class="mute">No characters or places attached</span>'}</div>
 <div class="row"><select data-att="char"><option value="">Attach character…</option>${P.characters.filter(c=>!it.chars.includes(c.id)).map(c=>`<option value="${c.id}">${esc(c.name||"Unnamed")}</option>`).join("")}</select><select data-att="place"><option value="">Attach place or lore…</option>${(P.locations||[]).filter(c=>!it.places.includes(c.id)).map(c=>`<option value="${c.id}">${esc(c.name||"Unnamed")}</option>`).join("")}</select><button data-act="tbeats">Add to chapter beats</button><button data-act="titemdel">Delete event</button><button data-act="tdone">Done</button></div></div>`:""}`},
dashGrid(){const C=P.characters.filter(x=>x.name);if(!C.length)return`<h2>Appearances</h2><p class="mute">Add characters with names first.</p>`;return`<h2>Appearances</h2><p class="mute">Numbers count name mentions in the manuscript text (full name or first name). ● means you listed the character as POV, major, or in a scene, ○ as minor. A number with no mark means the name appears but is not listed. Two characters sharing a first name will be counted together.</p><div class="row"><button class="pri" data-act="detect">Add detected characters to chapters</button></div><div style="overflow-x:auto"><table><tr><th>Character</th>${P.chapters.map((c,j)=>`<th title="${esc(c.title)}">${j+1}</th>`).join("")}<th>Total</th></tr>${C.map(x=>{let t=0;const cells=P.chapters.map(c=>{const n=cnt(c.text,x.name),m=c.pov===x.id||has(c.major,x.name)||sc(c,x.name)?"●":has(c.minor,x.name)?"○":"";t+=n;return`<td>${m}${n?" "+n:""}</td>`}).join("");return`<tr><td>${esc(x.name)}</td>${cells}<td>${t}</td></tr>`}).join("")}</table></div>`},
locs(){const L=P.locations=P.locations||[];let i=L.findIndex(x=>x.id===curLoc);if(i<0&&L.length){i=0;curLoc=L[0].id}
 const ICON={"Place":"📍","Object / relic":"🏺","Faction":"🏴","Lore / rule":"📜"},ty=x=>x.type||"Place";
 const types=[...PT,...new Set(L.map(ty).filter(t=>!PT.includes(t)))];
 const tile=(x,k)=>`<a data-lid="${x.id}" class="ctile ${k===i?"on":""}" title="${esc(x.name||"Unnamed")}">${src(x)?`<img src="${src(x)}" alt="">`:`<span class="head">${ICON[ty(x)]||"📍"}</span>`}<span class="cn">${esc(x.name||"Unnamed")}</span></a>`;
 const groups=types.map(t=>({t,items:L.map((x,k)=>({x,k})).filter(o=>ty(o.x)===t)})).filter(g=>g.items.length);
 const c=L[i];
 return`<h2>Places &amp; Lore</h2>
 <div class="split"><div class="clist"><div style="display:flex;gap:6px;margin-bottom:4px"><button class="pri" data-act="addloc" title="Add place or lore (uses the selected entry's type)" style="width:44px;min-width:0;font-size:18px;line-height:1;padding:5px 0">+</button><button data-act="dellocur" title="Delete selected entry" style="width:44px;min-width:0;font-size:18px;line-height:1;padding:5px 0" ${i<0?"disabled":""}>−</button></div>
 ${groups.map(g=>`<div class="cgh"><span>${esc(g.t)}</span><span>${g.items.length}</span></div><div class="cgrid">${g.items.map(o=>tile(o.x,o.k)).join("")}</div>`).join("")}</div>
 <div class="grow">${c?`<div class="card" data-picdrop="locations.${i}" style="border-top:0;padding-top:0"><div class="row" style="align-items:flex-end"><label class="fld" style="margin:0"><span class="fl">Name</span><span class="fh">As it appears in the text</span><input data-k="locations.${i}.name" value="${esc(c.name)}"></label><label class="fld" style="margin:0"><span class="fl">Type</span><span class="fh">Place, object, faction or lore rule</span><select data-k="locations.${i}.type">${types.map(t=>`<option ${t===ty(c)?"selected":""}>${esc(t)}</option>`).join("")}</select></label><button data-act="delloc" data-i="${i}">Delete</button></div><label class="fld"><span class="fl">Notes</span><span class="fh">Atmosphere, geography, history, who goes there, facts to keep consistent.</span><textarea data-k="locations.${i}.notes" rows="5">${esc(c.notes)}</textarea></label>${ent("locations",i,c)}</div>`:'<p class="mute">Nothing here yet. Click + to add your first place, object, faction or lore entry.</p>'}</div></div>`},
board(){const B=boardOf();return`<h2>Whiteboard</h2><div class="row"><button draggable="true" data-act="bnote">Add note</button><button class="${lk?"pri":""}" data-act="blink">${lk?(lsrc?"Click 2nd card (or cancel)":"Link mode: click 1st card"):"Link two cards"}</button><button data-act="barr">Auto-arrange</button><button data-act="brels" title="Draw the relationships from the Characters tab as labelled links">Add character relationships</button><select id="bzoom" style="width:auto">${[0.75,1,1.25].map(z=>`<option value="${z}" ${z===bz?"selected":""}>${z*100}%</option>`).join("")}</select><span class="mute">Drag cards or buttons onto board (or double-click board for a note). Click a link label to edit or unlink.</span></div>${[["char","Characters",P.characters],["loc","Locations",P.locations||[]],["chap","Chapters",P.chapters]].map(g=>`<div class="mute" style="margin:6px 0 4px">Add ${g[1].toLowerCase()}</div><div class="row">${g[2].map((x,i)=>`<button draggable="true" data-act="badd" data-t="${g[0]}" data-i="${i}">${esc(x.name||x.title||"Untitled")}</button>`).join("")||'<span class="mute">None yet</span>'}</div>`).join("")}<div id="bd" style="margin-top:12px"><div style="position:relative;width:2000px;height:1400px;transform:scale(${bz});transform-origin:0 0"><svg id="bl" style="position:absolute;left:0;top:0;width:2000px;height:1400px;pointer-events:none"></svg>${B.cards.map((c,i)=>bcard(c,i)).join("")}</div></div>`},
export(){
 const w=P.chapters.reduce((a,c)=>a+wc(c.text),0),n3=P.chapters.slice(0,3).reduce((a,c)=>a+wc(c.text),0),sw=wc(P.synopsis);
 const grp=(t,d,btns)=>`<h3>${t}</h3><p class="mute" style="margin:0 0 8px">${d}</p><div class="row">${btns}</div>`;
 const b=(a,l,pri)=>`<button ${pri?'class="pri" ':""}data-act="${a}">${l}</button>`;
 return`<h2>Export &amp; Downloads</h2>
 <p class="mute">Every download in one place. ${w.toLocaleString()} words across ${P.chapters.length} chapter${P.chapters.length===1?"":"s"}.</p>
 ${grp("Word documents (.doc)","Times New Roman 12 pt. Open in Word or import into Google Docs. For agent and publisher submissions.",
  b("dlfirst3",`First 3 chapters (${n3.toLocaleString()} words)`,1)+b("dlsyn",`Synopsis (${sw.toLocaleString()} words)`,1)+b("dlnovel","Full novel (double-spaced)")+b("copynovel","Copy formatted novel"))}
 ${grp("Manuscript &amp; outline (.md)","Plain Markdown.",
  b("expmd","Manuscript")+b("outline","Chapter summaries")+b("dlchap","Current chapter")+b("chexp","All characters")+b("dlbiball","Story Bible (all documents)"))}
 ${grp("For AI","Packaged context to paste into an AI. Private notes are never included.",
  b("aianalysis","AI Analysis Export (last 2 chapters in full)")+b("dlsuper","Super prompt"))}
 ${grp("Backups (.json)","Full copies including images, version history and private notes. <b>Everything</b> also contains this device's settings (AI server address, model, timeouts). The two <b>no settings</b> options leave those out, so they are safe to share. Automatic folder backup and restore are in Settings.",
  b("expall","Everything: all projects + settings",1)+b("expproj","All projects, no settings")+b("exp","This project only, no settings")+`<button data-v="set">Backup settings…</button>`)}`},
set(){return`<h2>Settings</h2>
<p class="mute">Title, genre, pitch, plot and synopsis are on the <a data-v="proj" style="cursor:pointer;text-decoration:underline">Project</a> page. This page holds writing checks, the AI connection and backups.</p>
<h3>Writing Checks (blacklist &amp; repetition)</h3>
<p class="mute">Used by the KPI panel under each chapter and the Flags column on the Dashboard. One entry per line. <code>*ly</code> matches any word ending in "ly", <code>pre*</code> any word starting with "pre", and entries with spaces match phrases. Lines starting with # are ignored.</p>
<div class="row">
 <div><span class="lbl">Blacklist</span><textarea data-k="style.blacklist" rows="8">${esc(P.style.blacklist)}</textarea></div>
 <div><span class="lbl">Allowed words (exempt from wildcard patterns; comma or line separated)</span><textarea data-k="style.allow" rows="8">${esc(P.style.allow)}</textarea></div>
</div>
<div class="row">
 <div><span class="lbl">Ignore in repetition check (comma or line separated; character and place names are ignored automatically)</span><textarea data-k="style.ignore" rows="3">${esc(P.style.ignore)}</textarea></div>
 <div style="max-width:210px"><span class="lbl">Flag a word when used at least</span><input data-k="style.repeatMin" data-num type="number" min="2" value="${P.style.repeatMin}"></div>
</div>
<div class="row"><button data-act="blreset">Reset checks to defaults</button></div>

<h3>AI &amp; Writing Defaults</h3><p class="mute">The endpoint, model and temperature are device settings: saved in this browser only and left out of project exports. Words per new chapter belongs to the project. API keys are never saved anywhere.</p>
<div class="row"><input data-k="ai.endpoint" value="${esc(P.ai.endpoint)}" placeholder="AI API or server proxy URL"><input data-k="ai.model" value="${esc(P.ai.model)}" placeholder="Default model" style="max-width:190px"><input data-k="ai.temp" data-num type="number" step="0.1" min="0" max="2" value="${P.ai.temp}" title="Temperature" style="max-width:90px"><input data-k="ai.chapterWords" data-num type="number" value="${P.ai.chapterWords}" title="Default words per new chapter" style="max-width:120px"></div>
${localSettings()}
<h3>Backup &amp; Export</h3>
<p class="mute">All downloads (Word documents, Markdown, AI exports and JSON backups) are on the Export &amp; Downloads page. Restore from a backup and set up automatic backups here. A backup that contains device settings will ask before applying them.</p>
<div class="row"><button class="pri" data-v="export">Go to Export &amp; Downloads</button></div>
<div class="row"><label class="mute" style="flex:none">Import JSON backup <input type="file" id="impall" accept=".json"></label></div>
<h3>Automatic backup</h3>
<p class="mute">${autoStatus()}</p>
<p class="mute">Pick or create a subfolder (Chrome refuses some top-level folders such as Downloads). Every project is saved to <code>novel-studio-latest.json</code> plus one dated copy per day, and the newest 14 dated copies are kept. Files are written about two minutes after you stop editing, and when you close the panel.</p>
<div class="row">${!auto.on?`<button class="pri" data-act="bkfolder">Choose backup folder</button>`:`<button class="pri" data-act="bkrun">Back up now</button>${auto.perm!=="granted"?`<button data-act="bkreauth">Re-enable access</button>`:""}<button data-act="bkfolder">Change folder</button><button data-act="bkoff">Turn off</button>`}</div>
<div class="row"><div style="max-width:300px"><span class="lbl">Remind me to export a file after this many days without a backup</span><input id="bkdays" type="number" min="1" value="${+LS.get("ns_bkdays")||3}"></div></div>
<h3>Danger zone</h3><button data-act="delproj">Delete this project</button>`}};

/* ---------- in-app dialogs (replace the browser's confirm/prompt boxes) ---------- */
function ask(msg,o){o=o||{};const hasIn=o.input!==undefined;
 const okL=o.ok||(/^Delete/i.test(msg)?"Delete":/^Restore/i.test(msg)?"Restore":/^Reset/i.test(msg)?"Reset":/^Replace/i.test(msg)?"Replace":/^Stop/i.test(msg)?"Stop":/^Apply/i.test(o.ok||"")?"Apply":"OK");
 return new Promise(res=>{
  const prev=document.activeElement,ov=document.createElement("div");ov.className="mdl";
  ov.innerHTML=`<div class="mdb" role="dialog" aria-modal="true"><p>${esc(msg)}</p>${hasIn?`<input id="mdi" value="${esc(o.input)}">`:""}<div class="mda"><button data-m="0">${esc(o.cancel||"Cancel")}</button><button class="pri" data-m="1">${esc(okL)}</button></div></div>`;
  let val="";const fin=v=>{if(hasIn){const i=ov.querySelector("#mdi");val=i?i.value:""}document.removeEventListener("keydown",key,true);ov.remove();if(prev&&prev.focus)try{prev.focus()}catch(e){}res(hasIn?(v?val:null):v)};
  const key=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();fin(false)}else if(e.key==="Enter"&&hasIn&&e.target.id==="mdi"){e.preventDefault();e.stopPropagation();fin(true)}};
  ov.addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(b){fin(b.dataset.m==="1");return}if(e.target===ov)fin(false)});
  document.addEventListener("keydown",key,true);document.body.appendChild(ov);
  const f=hasIn?ov.querySelector("#mdi"):ov.querySelector(".pri");f.focus();if(hasIn)f.select()})}
const slug=s=>String(s||"file").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"file";
async function dl(name,data){
 let d=null;try{d=window.claude&&await claude.use("downloads")}catch(e){}
 if(!d){
  const u=URL.createObjectURL(new Blob([data],{type:/\.json$/i.test(name)?"application/json":"text/plain"}));
  const a=document.createElement("a");
  a.href=u;a.download=name;a.style.display="none";
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),10000);
  $("#st").textContent="Downloaded "+name;
  return;
 }
 try{await d.save({filename:name,data:data||" "});$("#st").textContent="Saved "+name}
 catch(e){$("#st").textContent=e&&e.code==="declined"?"Download cancelled":"Download failed"}
}
function outlineMD(){return "# "+P.name+": chapter summaries\n\n"+P.chapters.map((c,i)=>`## ${i+1}. ${c.title} (Act ${c.act}, ${c.status}, ${wc(c.text)}w)\n**Major characters:** ${c.major||"-"}\n**Minor characters:** ${c.minor||"-"}\n**Place:** ${c.place||"-"}\n**Time:** ${c.time||"-"}\n\n**Summary:** ${c.summary||"-"}\n\n**Beats:**\n${c.beats||"-"}${(c.scenes||[]).length?"\n\n**Scenes:**\n"+c.scenes.map((s,j)=>`${j+1}. ${s.title} (POV ${s.pov||"-"}; ${s.place||"-"}; ${s.chars||"-"}): ${s.summary}`).join("\n"):""}`).join("\n\n")}
function aiNotesText(){return(P.notes||[]).filter(n=>n.scope==="ai"&&n.text&&n.text.trim()).map(n=>`### ${n.title||"Untitled note"}${n.tag?" ("+n.tag+")":""}\n\n${n.text.trim()}`).join("\n\n")}
function projectBrief(){
 const gl=genreLabel(),rows=[];
 if(P.name)rows.push(`**Title:** ${P.name}`);
 if(P.subtitle)rows.push(`**Subtitle:** ${P.subtitle}`);
 if(gl)rows.push(`**Genre:** ${gl}`);
 if(P.strapline&&P.strapline.trim())rows.push(`\n**Two-Paragraph Strapline / Pitch:**\n${P.strapline.trim()}`);
 return rows.length?`# PROJECT OVERVIEW\n${rows.join("\n")}`:"";
}
function tipsExportMD(){
 const o=[];if(TIPS.novel)o.push("## Novel Writing Tips (fixed reference)\n\n"+TIPS.novel);if(TIPS.script)o.push("## Script Writing Tips (fixed reference)\n\n"+TIPS.script);
 return o.join("\n\n")}
function operationTemplatesMD(){
 const names={"skeleton":"Skeleton novel outline","plan":"Plan chapter beats & scenes","write":"Write chapter","review":"Review chapter","rewrite":"Rewrite passage","continuity":"Check continuity","develop":"Develop story","analyse":"Analyse manuscript","screenplay":"Film / TV script (Fountain)"};
 
 let out = `## Operation Templates\n\n${OP_KEYS.map(k=>`### ${names[k]||k}\n\n${P.tpls[k]||DEFAULT_TPLS[k]||""}`).join("\n\n")}`;
 out += `\n\n## Story Bible Templates\n\n${SAMPLE_KEYS.map(k=>`### ${k}.md\n\n${SAMPLES[k]||""}`).join("\n\n")}`;
 return out;
}
function superPromptMD(){
 const docs=bibleDocsMD();
 const chars=P.characters.map(x=>charMD(x)).join("\n")||"(none)";
 const locs=(P.locations||[]).map(x=>`- **${x.name||"Unnamed"}** (${x.type||"Place"}): ${x.notes||""}${x.look?"\n  - Look: "+x.look:""}`).join("\n")||"(none)";
 const tl=P.timeline.items.map(it=>{const tr=P.timeline.tracks.find(t=>t.id===it.tid)?.name||"Track";return`- **${it.title}** [${tr}, Ch ${it.start+1}–${it.start+it.span}]${it.notes?": "+it.notes:""}`}).join("\n")||"(none)";
 return[
  `# ${P.name}${P.subtitle?" — "+P.subtitle:""} — Super Prompt`,
  projectBrief()||`# PROJECT OVERVIEW\n**Title:** ${P.name}`,
  P.master,
  tipsExportMD(),
  operationTemplatesMD(),
  `## Author & AI Notes\n\n${aiNotesText()||"(none)"}`,
  `## Story Bible (generated from the forms)\n\n${docs}`,
  outlineMD()
 ].filter(Boolean).join("\n\n---\n\n");
}
function aiAnalysisExportMD(){
 const written=P.chapters.map((c,i)=>({c,i})).filter(x=>x.c.text&&x.c.text.trim());
 const lastTwo=written.slice(-2);
 const docs=bibleDocsMD();
 const chars=P.characters.map(x=>charMD(x)).join("\n")||"(none)";
 const locs=(P.locations||[]).map(x=>`- **${x.name||"Unnamed"}** (${x.type||"Place"}): ${x.notes||""}${x.look?"\n  - Look: "+x.look:""}`).join("\n")||"(none)";
 const tl=P.timeline.items.map(it=>{
  const tr=P.timeline.tracks.find(t=>t.id===it.tid)?.name||"Track";
  const who=[...it.chars.map(id=>P.characters.find(c=>c.id===id)?.name),...it.places.map(id=>(P.locations||[]).find(l=>l.id===id)?.name)].filter(Boolean).join(", ");
  return`- **${it.title}** [${tr}, Ch ${it.start+1}–${it.start+it.span}]${who?" ("+who+")":""}${it.notes?": "+it.notes:""}`;
 }).join("\n")||"(none)";
 const totalW=P.chapters.reduce((a,c)=>a+wc(c.text),0);
 const nm=id=>(P.characters.find(x=>x.id===id)||{}).name||"";
 const plName=c=>((P.locations||[]).find(x=>x.id===c.loc)||{}).name||c.place||"";
 const fullChaps=lastTwo.length
  ?lastTwo.map(({c,i})=>`## Chapter ${i+1}: ${c.title}\n*Act ${c.act} · ${c.status} · ${wc(c.text).toLocaleString()} words · POV: ${nm(c.pov)||"unassigned"} · Tense: ${c.tense||"Past"} · Place: ${plName(c)||"-"} · Time: ${c.time||"-"}*\n\n${c.text.trim()}`).join("\n\n---\n\n")
  :"(No chapters with written prose yet.)";
 return[
  `# ${P.name}${P.subtitle?" — "+P.subtitle:""} — AI Analysis Export`,
  `Exported: ${new Date().toISOString().slice(0,10)} · Progress: ${totalW.toLocaleString()} / ${P.target.toLocaleString()} words · Chapters: ${P.chapters.length} (${written.length} drafted; last ${lastTwo.length} included in full below)`,
  projectBrief()||`# PROJECT OVERVIEW\n**Title:** ${P.name}`,
  P.master,
  tipsExportMD(),
  operationTemplatesMD(),
  `## Author & AI Notes\n\n${aiNotesText()||"(none)"}`,
  `## Story Bible (generated from the forms)\n\n${docs}`,
  outlineMD(),
  `# FULL PROSE: LAST ${lastTwo.length} WRITTEN CHAPTER(S)\n\n${fullChaps}`
 ].filter(Boolean).join("\n\n---\n\n");
}
/* ---------- formatted novel (Word / Docs) ---------- */
const FM_FONT="'Times New Roman',Times,serif";
function novelBody(list){
 const ch=(list||P.chapters).filter(c=>rv(c.text)),first=true;
 const paras=t=>String(t).replace(/\r/g,"").trim().split(/\n/).map(p=>p.trim()).filter(Boolean);
 const brk=p=>/^(\*\s*\*\s*\*|#|\*{3}|-{3,}|—{3,})$/.test(p);
 const title=`<p style="text-align:center;margin:0;line-height:200%;font:12pt ${FM_FONT}"><br><br><br><br><br><br><br><br>${esc((P.name||"Untitled").toUpperCase())}</p>`+(P.subtitle?`<p style="text-align:center;margin:0;line-height:200%;font:italic 12pt ${FM_FONT}">${esc(P.subtitle)}</p>`:"");
 const body=ch.map((c,n)=>{
  let afterBreak=true;
  const ps=paras(c.text).map(p=>{
   if(brk(p)){afterBreak=true;return`<p style="text-align:center;text-indent:0;margin:0;line-height:200%;font:12pt ${FM_FONT}">#</p>`}
   const ind=afterBreak?"0":"0.5in";afterBreak=false;
   return`<p style="text-indent:${ind};margin:0;line-height:200%;text-align:left;font:12pt ${FM_FONT}">${esc(p)}</p>`}).join("");
  return`<p style="page-break-before:always;text-align:center;margin:0 0 0 0;line-height:200%;font:bold 12pt ${FM_FONT}"><br><br>${esc(c.title||"Chapter "+(n+1))}</p>${ps}`}).join("");
 return title+body;
}
function novelHTML(list){
 return`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(P.name||"Novel")}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page{size:8.5in 11in;margin:1in}body{font:12pt ${FM_FONT}}p{margin:0;font:12pt ${FM_FONT};line-height:200%}</style></head><body>${novelBody(list)}</body></html>`;
}
function novelCheck(){
 if(!P.chapters.some(c=>rv(c.text))){$("#st").textContent="No chapter text to export yet";return false}return true}
function dlNovel(){
 if(!novelCheck())return;
 const u=URL.createObjectURL(new Blob(["﻿",novelHTML()],{type:"application/msword"})),a=document.createElement("a");
 a.href=u;a.download=slug(P.name||"novel")+".doc";a.style.display="none";document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(u),10000);
 $("#st").textContent="Downloaded "+slug(P.name||"novel")+".doc ("+P.chapters.reduce((s,c)=>s+wc(c.text),0).toLocaleString()+" words)";
}
async function copyNovel(){
 if(!novelCheck())return;
 const html=`<div style="font:12pt ${FM_FONT}">${novelBody()}</div>`,plain=P.chapters.filter(c=>rv(c.text)).map(c=>c.title+"\n\n"+c.text.trim()).join("\n\n\n");
 try{
  await navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([html],{type:"text/html"}),"text/plain":new Blob([plain],{type:"text/plain"})})]);
  $("#st").textContent="Formatted novel copied. Paste into Word or Docs.";
 }catch(e){
  const d=document.createElement("div");d.contentEditable="true";d.style.cssText="position:fixed;left:-9999px;top:0";d.innerHTML=html;document.body.appendChild(d);
  const r=document.createRange();r.selectNodeContents(d);const s=getSelection();s.removeAllRanges();s.addRange(r);
  let ok=false;try{ok=document.execCommand("copy")}catch(_){}
  s.removeAllRanges();d.remove();
  $("#st").textContent=ok?"Formatted novel copied. Paste into Word or Docs.":"Copy blocked by the browser. Use Download novel (.doc) instead.";
 }
}
/* ---------- Word (.doc) helpers: first N chapters, synopsis ---------- */
function saveDoc(name,html){
 const u=URL.createObjectURL(new Blob(["\ufeff",html],{type:"application/msword"})),a=document.createElement("a");
 a.href=u;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(u),10000);
 $("#st").textContent="Downloaded "+name;
}
function dlFirstN(n){
 const ch=P.chapters.slice(0,n).filter(c=>rv(c.text));
 if(!ch.length){$("#st").textContent="The first "+n+" chapters have no text yet";return}
 saveDoc(slug(P.name||"novel")+"-first-"+n+"-chapters.doc",novelHTML(ch));
}
function dlSynopsis(){
 if(!rv(P.synopsis)){$("#st").textContent="No synopsis yet. Write it on the Project page.";return}
 const p=x=>`<p style="margin:0 0 12pt;line-height:150%;font:12pt ${FM_FONT}">${esc(x)}</p>`;
 const body=`<p style="text-align:center;margin:0 0 4pt;font:bold 14pt ${FM_FONT}">${esc((P.name||"Untitled").toUpperCase())}</p>`
  +(P.subtitle?`<p style="text-align:center;margin:0 0 4pt;font:italic 12pt ${FM_FONT}">${esc(P.subtitle)}</p>`:"")
  +`<p style="text-align:center;margin:0 0 18pt;font:12pt ${FM_FONT}">Synopsis</p>`
  +rv(P.synopsis).split(/\n\s*\n/).map(x=>p(x.replace(/\s*\n\s*/g," "))).join("");
 saveDoc(slug(P.name||"novel")+"-synopsis.doc",`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(P.name||"Synopsis")}</title><style>@page{size:8.5in 11in;margin:1in}body{font:12pt ${FM_FONT}}</style></head><body>${body}</body></html>`);
}
const boardOf=()=>P.board=P.board||{cards:[],links:[]},pos=B=>30+(B.cards.length%10)*34;
const src=x=>x.img||(x.svg?"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(x.svg):"");
function ent(a,i,c){const s=src(c),loc=a==="locations",lb=loc?"Look":"Physical description",hint=loc?"Locked look, reused in every prompt: architecture, light, condition, smells.":"Locked appearance, reused in every prompt: age, build, face, hair, clothing, distinguishing marks.";return`<div class="row" style="align-items:flex-start">${s?`<img class="pic" src="${s}" alt="">`:""}<label class="fld" style="flex:3;min-width:220px"><span class="fl">${lb}</span><span class="fh">${hint}</span><textarea data-k="${a}.${i}.look" rows="4">${esc(c.look)}</textarea></label></div><div class="row"><label class="upl"><span>Upload or drop image / SVG</span><input type="file" accept="image/*,.svg" data-pic="${a}.${i}"></label><button data-act="pp" data-a="${a}" data-i="${i}">Build image prompt</button><button data-act="rmpic" data-a="${a}" data-i="${i}">Remove image</button></div><textarea id="pp-${a}-${i}" rows="4" style="display:none"></textarea>`}
function pprompt(c,loc){const gl=genreLabel();return(loc?"Establishing image of ":"Head-and-shoulders character portrait of ")+(c.name||"unnamed")+". "+(c.look||(c.notes||"").slice(0,400))+(gl?" Tone/genre: "+gl+".":"")+(P.synopsis?" Story context: "+P.synopsis.slice(0,300).replace(/\s+/g," "):"")+" Natural light, muted palette, no text, no watermark."}
function pic(path,f){if(!f)return;const o=path.split(".").reduce((x,k)=>x[k],P),done=()=>{save();render()};const r=new FileReader();
 if(f.type==="image/svg+xml"||/\.svg$/i.test(f.name)){r.onload=()=>{o.svg=r.result.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,"");o.img="";done()};r.readAsText(f);return}
 r.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,420/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);o.img=c.toDataURL("image/jpeg",0.82);o.svg="";done()};im.onerror=()=>{$("#st").textContent="Could not read that image"};im.src=r.result};r.readAsDataURL(f)}
function bcard(c,i){let h;const th=x=>src(x)?`<img src="${src(x)}" alt="">`:"";
 if(c.t==="char"){const x=P.characters.find(a=>a.id===c.ref)||{};h=`${th(x)}<b>${esc(x.name||"?")}</b><span class="mute">${esc(x.role||"")}</span>`}
 else if(c.t==="loc"){const x=(P.locations||[]).find(a=>a.id===c.ref)||{};h=`${th(x)}<b>${esc(x.name||"?")}</b><span class="mute">${esc(x.type||"")}</span>`}
 else if(c.t==="chap"){const x=P.chapters.find(a=>a.id===c.ref)||{};h=`<b>${esc(x.title||"?")}</b><span class="mute">Act ${x.act||""} ${esc(x.place||"")}</span>`}
 else h=`<textarea data-k="board.cards.${i}.text" rows="3" placeholder="Note">${esc(c.text)}</textarea>`;
 return`<div class="bc ${c.t}" data-id="${c.id}" style="left:${c.x}px;top:${c.y}px${c.col?";background:"+c.col:""}">${h}${c.t==="note"?`<i class="bx" style="right:24px" data-act="bcol" data-id="${c.id}" title="Change colour">◐</i>`:""}<i class="bx" data-act="bdel" data-id="${c.id}">×</i></div>`}
function lines(){const s=$("#bl");if(!s)return;const el=id=>document.querySelector('.bc[data-id="'+id+'"]');s.innerHTML=boardOf().links.map((l,idx)=>{const a=el(l.a),b=el(l.b);if(!a||!b)return"";const x1=a.offsetLeft+a.offsetWidth/2,y1=a.offsetTop+a.offsetHeight/2,x2=b.offsetLeft+b.offsetWidth/2,y2=b.offsetTop+b.offsetHeight/2;return`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#999" stroke-width="1.5"/><text data-blink-idx="${idx}" x="${(x1+x2)/2}" y="${(y1+y2)/2}" text-anchor="middle" font-size="12" fill="#333" stroke="#fcfcfc" stroke-width="4" paint-order="stroke" style="cursor:pointer;pointer-events:auto">${esc(l.label||"·")}</text>`}).join("")}
document.addEventListener("pointerdown",async e=>{const c=e.target.closest(".bc");if(!c||e.target.closest("textarea,.bx"))return;const B=boardOf(),card=B.cards.find(x=>x.id===c.dataset.id);if(!card)return;
 if(lk){if(!lsrc){lsrc=card.id;render()}else{if(lsrc!==card.id){const k=B.links.findIndex(l=>(l.a===lsrc&&l.b===card.id)||(l.a===card.id&&l.b===lsrc));k>=0?B.links.splice(k,1):B.links.push({a:lsrc,b:card.id,label:(await ask("Label for this link (optional)",{input:""}))||""})}lsrc=null;lk=0;save();render()}return}
 dr={c,card,ox:e.clientX/bz-card.x,oy:e.clientY/bz-card.y};c.setPointerCapture(e.pointerId);e.preventDefault()});
document.addEventListener("pointermove",e=>{if(!dr)return;dr.card.x=Math.max(0,e.clientX/bz-dr.ox);dr.card.y=Math.max(0,e.clientY/bz-dr.oy);dr.c.style.left=dr.card.x+"px";dr.c.style.top=dr.card.y+"px";lines()});
document.addEventListener("pointerup",()=>{if(dr){dr=null;save()}});
document.addEventListener("dblclick",e=>{const w=e.target.closest("#bd");if(!w||e.target.closest(".bc"))return;const r=w.firstElementChild.getBoundingClientRect();boardOf().cards.push({id:uid(),t:"note",x:Math.max(0,Math.round((e.clientX-r.left)/bz-75)),y:Math.max(0,Math.round((e.clientY-r.top)/bz-20)),text:""});save();render()});
const rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const names=n=>{n=n.trim();const f=n.split(/\s+/)[0];return f.length>2&&f!==n?[n,f]:[n]};
const cnt=(t,n)=>{if(!t||!n||!n.trim())return 0;return(t.match(new RegExp("\\b("+names(n).map(rx).join("|")+")\\b","gi"))||[]).length};
const has=(l,n)=>{const a=String(l||"").toLowerCase().split(",").map(s=>s.trim());return names(n).some(x=>a.includes(x.toLowerCase()))};
const sc=(c,n)=>(c.scenes||[]).some(s=>has(s.chars,n));

/* ---------- AI connection (cloud or local OpenAI-compatible server such as LocalAI) ---------- */
let localModels=[],localMsg="",aiCtl=null,aiEdited=false;
function lmField(a){ /* a dropdown of models the server reported; a free-text box only until models are known */
 llmInit();
 const list=(localModels.length?localModels:(LLM.installed_models||[])).filter(m=>!/embed|rerank/i.test(m)),cur=a.lModel||"";
 if(!list.length)return`<input data-k="ai.lModel" value="${esc(cur)}" placeholder="Press Test connection to list models">`;
 return`<select data-k="ai.lModel">${list.includes(cur)?"":cur?`<option value="${esc(cur)}" selected>${esc(cur)} (not in the installed list)</option>`:`<option value="" selected>Choose a model…</option>`}${list.map(m=>`<option value="${esc(m)}" ${m===cur?"selected":""}>${esc(m)}</option>`).join("")}</select>`}
const isLocal=()=>P.ai.provider==="local";
function localBase(){
 const a=P.ai;let h=String(a.lHost||"").trim().replace(/^https?:\/\//i,"").replace(/\/+$/,"").replace(/\/v1(\/.*)?$/i,"");
 if(!h)return"";
 const hasPort=/:\d+$/.test(h);
 return(a.lProto||"http")+"://"+h+(hasPort||!a.lPort?"":":"+a.lPort)}
const localURL=p=>localBase()+"/v1/"+p;
function updLocalUrl(){const e=$("#lurl");if(e)e.textContent=localBase()?localURL("chat/completions"):"(enter a host or IP)";const s=$("#lsum");if(s)s.firstChild.textContent="Local: "+(localBase()||"host not set")+" · "}
function localSettings(){const a=P.ai,f=(lb,h,inner)=>`<label class="fld" style="margin:0;flex:1;min-width:130px"><span class="fl">${lb}</span><span class="fh">${h}</span>${inner}</label>`;
 return`<h3>Local LLM (LocalAI / llama.cpp / any OpenAI-compatible server)</h3>
<p class="mute">Choose <b>Local</b> to send AI Toolkit prompts and audits to your own server instead of the cloud API. Nothing leaves your network. These settings are saved on this device only and are left out of project exports; the <b>Everything</b> backup includes them. The server must expose <code>/v1/chat/completions</code> (LocalAI does by default).</p>
<div class="box">
<div class="row" style="align-items:flex-end">${f("AI provider","Saved on this device, all projects",`<select data-k="ai.provider"><option value="cloud" ${a.provider!=="local"?"selected":""}>Cloud API (URL above)</option><option value="local" ${a.provider==="local"?"selected":""}>Local server (LocalAI)</option></select>`)}${f("Protocol","http for most LAN servers",`<select data-k="ai.lProto" style="max-width:110px"><option ${a.lProto!=="https"?"selected":""}>http</option><option ${a.lProto==="https"?"selected":""}>https</option></select>`)}${f("Host or IP","e.g. 192.168.1.50",`<input data-k="ai.lHost" value="${esc(a.lHost)}" placeholder="192.168.1.50" autocomplete="off">`)}${f("Port","LocalAI default 8080",`<input data-k="ai.lPort" data-num type="number" min="1" max="65535" value="${a.lPort}" style="max-width:100px">`)}</div>
<div class="row" style="align-items:flex-end">${f("Model name","Choose from the list. Use Test connection to refresh it",lmField(a))}${f("Max reply tokens","Reply length cap",`<input data-k="ai.lMaxTokens" data-num type="number" min="64" step="64" value="${a.lMaxTokens}" style="max-width:120px">`)}${f("Context window (tokens)","Your model's n_ctx. Used for a size warning only",`<input data-k="ai.lCtx" data-num type="number" min="512" step="512" value="${a.lCtx}" style="max-width:130px">`)}${f("Idle timeout (s)","Wait this long for the next data before giving up",`<input data-k="ai.lTimeout" data-num type="number" min="10" value="${a.lTimeout}" style="max-width:110px">`)}${f("Audit temperature","Lower is steadier. Audits only",`<input data-k="ai.lAuditTemp" data-num type="number" step="0.1" min="0" max="2" value="${a.lAuditTemp}" style="max-width:110px">`)}</div>
<label class="mute" style="display:block;margin-bottom:8px"><input type="checkbox" data-k="ai.lStream" ${a.lStream?"checked":""} style="width:auto"> Stream the reply as it is generated (recommended; avoids timeouts on slow hardware)</label>
<p class="mute" style="margin:0 0 8px">Request URL: <code id="lurl">${localBase()?esc(localURL("chat/completions")):"(enter a host or IP)"}</code>. An API key, if your server needs one, is typed in the AI Toolkit and kept in memory only.</p>
<div class="row"><button class="pri" data-act="ltest">Test connection &amp; list models</button></div>
${localMsg?`<div class="box ${/^(OK|Connected)/.test(localMsg)?"":"warn"}" style="white-space:pre-wrap;margin:0">${esc(localMsg)}</div>`:""}
</div>`}
async function localTest(){
 if(aiCtl){localMsg="An AI call is already running. Click Stop first.";return render()}
 if(!isLocal()){
  localMsg="Asking the cloud model to reply…";render();
  try{const r=await aiCall("Reply with the single word OK.");localMsg="Connected. The model replied: "+r.trim().slice(0,80)+"\nEverything is working."}
  catch(e){localMsg="The model did not answer: "+e.message}
  return render()}
 if(!localBase()){localMsg="Enter a host or IP first (Settings).";return render()}
 localMsg="Testing "+localURL("models")+" …";render();
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);
 try{
  const h={};if(aiKey)h.Authorization="Bearer "+aiKey;
  const r=await fetch(localURL("models"),{headers:h,signal:ctl.signal});
  if(!r.ok)throw new Error("HTTP "+r.status+" "+r.statusText);
  const j=await r.json();localModels=(j.data||j.models||[]).map(m=>m.id||m.name||m).filter(x=>typeof x==="string");
  if(localModels.length&&!P.ai.lModel)setPath("ai.lModel",localModels[0]);
  localMsg="Connected. "+(localModels.length?localModels.length+" model(s) found:\n- "+localModels.join("\n- "):"The server answered but listed no models.")+(P.ai.lModel&&localModels.length&&!localModels.includes(P.ai.lModel)?"\n\nNote: the model name you entered ("+P.ai.lModel+") is not in this list.":"");
 }catch(e){
  localMsg="Could not reach the server: "+(e.name==="AbortError"?"no answer within 10 seconds":e.message)+"\n\nCheck:\n- The IP, port and http/https are right and the server is running (open "+localURL("models")+" in a browser tab).\n- LocalAI is listening on the network, not only localhost (start it with --address 0.0.0.0:8080).\n- This extension is allowed to reach that address: manifest.json needs host_permissions covering it (for example \"http://*/*\"). Without that, the browser applies CORS and LocalAI must be started with CORS=true.";
 }finally{clearTimeout(t)}
 if(/^Connected/.test(localMsg)){const lst=localMsg,model=P.ai.lModel;
  if(!model){localMsg=lst+"\n\nChoose a model name, then test again to check that it replies.";return render()}
  localMsg=lst+"\n\nNow asking “"+model+"” to reply (the first reply can be slow while the model loads)…";render();
  try{const r=await aiCall("Reply with the single word OK.");localMsg=lst+"\n\nThe model replied: "+r.trim().slice(0,80)+"\nEverything is working."}
  catch(e){localMsg="Server reached, but the model did not answer: "+e.message+"\n\n"+lst}}
 render()}
/* One request to the configured provider. onChunk(textSoFar) is called while streaming. Returns the full reply text. */
async function aiCall(prompt,opts){
 opts=opts||{};const a=P.ai,local=isLocal();
 const ep=local?localURL("chat/completions"):a.endpoint;
 if(local&&!localBase())throw new Error("Local server host is not set (Settings)");
 if(!local&&!ep)throw new Error("Enter an API or proxy endpoint");
 const model=local?a.lModel:a.model;
 if(local&&!model)throw new Error("Choose a model name (Settings, Test connection lists them)");
 const isAnt=!local&&/anthropic\.com/i.test(ep),headers={"Content-Type":"application/json"};
 if(isAnt){if(aiKey)headers["x-api-key"]=aiKey;headers["anthropic-version"]="2023-06-01";headers["anthropic-dangerous-direct-browser-access"]="true"}
 else if(aiKey)headers.Authorization="Bearer "+aiKey;
 const temp=opts.audit&&local?(+a.lAuditTemp):(+a.temp);
 const t=Number.isFinite(temp)?temp:0.7,stream=local&&a.lStream!==false;
 const body=isAnt?{model,max_tokens:4096,temperature:t,messages:[{role:"user",content:prompt}]}
  :{model,temperature:t,messages:[{role:"user",content:prompt}]};
 if(local){body.max_tokens=+a.lMaxTokens||2048;if(stream)body.stream=true}
 const ctl=new AbortController();aiCtl=ctl;
 const idle=(local?(+a.lTimeout||600):300)*1000;let timer;const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>ctl.abort("timeout"),idle)};
 arm();
 try{
  const r=await fetch(ep,{method:"POST",headers,body:JSON.stringify(body),signal:ctl.signal});
  if(!r.ok){let m=r.statusText;try{const j=await r.json();m=j.error&&(j.error.message||j.error)||j.message||m}catch(_){}throw new Error("HTTP "+r.status+": "+(typeof m==="string"?m:JSON.stringify(m)))}
  if(stream&&r.body){
   const rd=r.body.getReader(),dec=new TextDecoder();let buf="",out="";
   for(;;){const{value,done}=await rd.read();if(done)break;arm();buf+=dec.decode(value,{stream:true});
    const lines=buf.split("\n");buf=lines.pop();
    for(const ln of lines){const m=ln.match(/^data:\s?(.*)$/);if(!m||m[1].trim()==="[DONE]"||!m[1].trim())continue;
     try{const j=JSON.parse(m[1]),d=j.choices&&j.choices[0]&&(j.choices[0].delta&&j.choices[0].delta.content||j.choices[0].text);if(d){out+=d;if(opts.onChunk)opts.onChunk(out)}}catch(_){}}}
   if(!out.trim())throw new Error("The server returned an empty reply");
   return out}
  const j=await r.json();
  return isAnt?(j.content||[]).map(x=>x.text||"").join(""):(j.choices&&j.choices[0]&&(j.choices[0].message?j.choices[0].message.content:j.choices[0].text)||JSON.stringify(j,null,2));
 }catch(e){
  if(e&&e.name==="AbortError"||ctl.signal.aborted)throw new Error(ctl.signal.reason==="timeout"?"no data received for "+Math.round(idle/1000)+" seconds (raise the idle timeout in settings if the model is slow)":"stopped");
  if(e&&e.name==="TypeError")throw new Error("network error ("+e.message+"). "+(local?"Check the server address and that the extension has host permission for it (see Test connection).":"Calls to other sites need host permission or a server proxy."));
  throw e}
 finally{clearTimeout(timer);if(aiCtl===ctl)aiCtl=null}
}
const opLabel=op=>OPS.find(x=>x[0]===op)?.[1]||op;
function liveRes(txt){aiRes=txt;const el=$("#res");if(el){el.value=txt;el.scrollTop=el.scrollHeight}}
async function runai(){
 if(aiCtl){$("#st").textContent="An AI call is already running. Click Stop first.";return}
 if(blocked())return;
 let o=$("#out")?.value||"";
 if(!o||!aiEdited){o=buildPrompt();aiEdited=false}
 aiOut=o;$("#st").textContent="Calling AI…";
 try{
  aiRes="";liveRes("");
  const txt=await aiCall(o,{audit:isAudit(aiMode),onChunk:t=>{liveRes(t);$("#st").textContent="Receiving… "+wc(t).toLocaleString()+" words"}});
  aiRes=txt;
  P.history.unshift({id:uid(),t:Date.now(),op:opLabel(aiMode),chapIdx:ci,reply:aiRes});
  P.history=P.history.slice(0,50);
  save();render();$("#st").textContent="AI reply saved to Editorial History (awaiting your approval)";
 }catch(e){$("#st").textContent="AI call failed: "+e.message}
}
async function runAudits(kind){
 if(aiCtl){$("#st").textContent="An AI call is already running. Click Stop first.";return}
 const jobs=[];
 if(kind==="syn"){if(!rv(P.synopsis)){$("#st").textContent="No synopsis yet. Write it on the Project page.";return}jobs.push({op:"audit_synopsis",i:ci})}
 else if(kind==="chap"){if(!rv(P.chapters[ci].text)){$("#st").textContent="Chapter "+(ci+1)+" has no text to audit.";return}jobs.push({op:"audit_chapter",i:ci})}
 else P.chapters.forEach((c,i)=>{if(rv(c.text))jobs.push({op:"audit_chapter",i})});
 if(!jobs.length){$("#st").textContent="No chapters with text to audit.";return}
 const keepCi=ci,keepMode=aiMode;let done=0,failed="";
 for(const j of jobs){
  ci=j.i;aiMode=j.op;
  const label=j.op==="audit_synopsis"?"synopsis":"chapter "+(j.i+1);
  try{
   const prompt=buildPrompt("",OP_CTX[j.op]);aiOut=prompt;
   $("#st").textContent="Auditing "+label+" ("+(done+1)+"/"+jobs.length+")…";
   const txt=await aiCall(prompt,{audit:true,onChunk:t=>{liveRes(t);$("#st").textContent="Auditing "+label+" ("+(done+1)+"/"+jobs.length+")… "+wc(t).toLocaleString()+" words"}});
   aiRes=txt;P.history.unshift({id:uid(),t:Date.now(),op:opLabel(j.op),chapIdx:j.i,reply:txt});P.history=P.history.slice(0,200);done++;save();
  }catch(e){failed=label+": "+e.message;break}
 }
 ci=keepCi;aiMode=keepMode;save();render();
 $("#st").textContent=failed?"Audit stopped at "+failed+". "+done+" of "+jobs.length+" saved to Editorial History.":"Audit finished: "+done+" report"+(done===1?"":"s")+" saved to Editorial History.";
}
function auditsMD(){
 const a=P.history.filter(h=>/^Audit/.test(h.op)).slice().reverse();
 if(!a.length)return"";
 return"# Audit reports: "+(P.name||"Untitled novel")+"\n\n"+a.map(h=>"## "+h.op+(h.op==="Audit synopsis"?"":" · Chapter "+(h.chapIdx+1)+(P.chapters[h.chapIdx]?": "+P.chapters[h.chapIdx].title:""))+"\n*"+new Date(h.t).toLocaleString()+"*\n\n"+h.reply).join("\n\n---\n\n")+"\n"}

let dp=null,tp=null;
document.addEventListener("dragstart",e=>{
 const cjd=e.target.closest&&e.target.closest("[data-cjdrag]");
 if(cjd){const c=P.characters.find(x=>x.id===curChar);if(!c){e.preventDefault();return}
  e.dataTransfer.setData("text/plain",JSON.stringify(charJSON(c),null,2));e.dataTransfer.effectAllowed="copy";
  $("#st").textContent="Drop into Claude or ChatGPT to paste this character's JSON";return}
 const b=e.target.closest&&e.target.closest("[data-act=badd],[data-act=bnote]");
 if(b){dp=b.dataset.act==="bnote"?{t:"note"}:{t:b.dataset.t,i:+b.dataset.i};e.dataTransfer.setData("text/plain","b");return}
 const tc=e.target.closest&&e.target.closest("[data-tdrag]");
 if(tc){const[kind,id]=tc.dataset.tdrag.split(":");tp={kind,id};e.dataTransfer.setData("text/plain","t")}
});
document.addEventListener("dragend",()=>{dp=null;tp=null;$$(".drop-over").forEach(x=>x.classList.remove("drop-over"))});
document.addEventListener("dragover",e=>{
 if(e.dataTransfer.types.includes("Files")&&e.target.closest&&e.target.closest("[data-picdrop]")){e.preventDefault();e.target.closest("[data-picdrop]").classList.add("drop-over")}
 else if(dp&&e.target.closest&&e.target.closest("#bd")){e.preventDefault()}
 else if(tp&&e.target.closest&&e.target.closest("[data-row],[data-tlane]")){e.preventDefault();const c=e.target.closest("[data-row],[data-tlane]");if(c)c.classList.add("drop-over")}
});
document.addEventListener("dragleave",e=>{const c=e.target.closest&&e.target.closest(".drop-over");if(c&&!c.contains(e.relatedTarget))c.classList.remove("drop-over")});
document.addEventListener("drop",e=>{
 const pd=e.target.closest&&e.target.closest("[data-picdrop]");
 if(pd&&e.dataTransfer.files&&e.dataTransfer.files[0]){e.preventDefault();pd.classList.remove("drop-over");pic(pd.dataset.picdrop,e.dataTransfer.files[0]);return}
 const w=e.target.closest&&e.target.closest("#bd");
 if(dp&&w){
  e.preventDefault();
  const r=w.firstElementChild.getBoundingClientRect(),B=boardOf(),x=Math.max(0,Math.round((e.clientX-r.left)/bz-75)),y=Math.max(0,Math.round((e.clientY-r.top)/bz-20));
  if(dp.t==="note")B.cards.push({id:uid(),t:"note",x,y,text:""});
  else if(dp.t==="char"||dp.t==="loc"||dp.t==="chap"){const g={char:P.characters,loc:P.locations||[],chap:P.chapters}[dp.t],ref=g[dp.i];if(ref)B.cards.push({id:uid(),t:dp.t,ref:ref.id,x,y})}
  dp=null;save();render();return;
 }
 const lane=e.target.closest&&e.target.closest("[data-tlane],[data-row]");
 if(!lane||!tp)return;
 e.preventDefault();$$(".drop-over").forEach(x=>x.classList.remove("drop-over"));
 const j=Math.max(0,Math.min(P.chapters.length-1,Math.floor((e.clientX-lane.getBoundingClientRect().left)/CW)));
 const T=P.timeline,row=e.target.closest("[data-row]"),tid=row?row.dataset.row:T.tracks[0].id;
 const hit=T.items.find(it=>it.tid===tid&&it.start<=j&&j<it.start+it.span);
 const it=hit||{id:uid(),title:tp.kind==="char"?(P.characters.find(c=>c.id===tp.id)||{}).name||"Event":((P.locations||[]).find(c=>c.id===tp.id)||{}).name||"Event",tid,start:j,span:1,color:tp.kind==="char"?"#2a62d6":"#1f8a70",notes:"",chars:[],places:[]};
 if(!hit)T.items.push(it);
 if(tp.kind==="char"&&!it.chars.includes(tp.id))it.chars.push(tp.id);
 if(tp.kind==="place"&&!it.places.includes(tp.id))it.places.push(tp.id);
 ti=it.id;tp=null;save();render();
});
/* timeline pointer: drag bars & resize handles */
let tdrag=null;
document.addEventListener("pointerdown",e=>{
 const z=e.target.closest("[data-tz]"),b=e.target.closest("[data-tb]");
 if(z||b){const it=P.timeline.items.find(x=>x.id===(z||b).dataset.tz||x.id===b.dataset.tb);if(!it)return;
  tdrag={it,mode:z?"z":"m",sx:e.clientX,start:it.start,span:it.span};e.preventDefault();(z||b).setPointerCapture(e.pointerId)}
});
document.addEventListener("pointermove",e=>{
 if(!tdrag)return;const dx=Math.round((e.clientX-tdrag.sx)/CW),it=tdrag.it,n=P.chapters.length;
 if(tdrag.mode==="z")it.span=Math.max(1,Math.min(n-it.start,tdrag.span+dx));
 else it.start=Math.max(0,Math.min(n-1,tdrag.start+dx));
 if(view==="time"){const tb=document.querySelector('[data-tb="'+it.id+'"]');if(tb){tb.style.left=it.start*CW+3+"px";tb.style.width=it.span*CW-6+"px"}}
});
document.addEventListener("pointerup",()=>{if(tdrag){tdrag=null;save();if(view==="time")render()}});

/* click routing */
document.addEventListener("click",async e=>{
 const t=e.target.closest("[data-dtab],[data-v],[data-act],[data-cid],[data-lid],[data-ci],[data-bk],[data-nid],[data-open],[data-impon],[data-addchar],[data-secadd],[data-att],[data-tb],[data-blink-idx],[data-tz]");
 if(!t)return;
 if(t.dataset.dtab){dashTab=t.dataset.dtab;render();return}
 if(t.dataset.v){view=t.dataset.v;if(view==="dash")dashTab="ov";render();return}
 if(t.dataset.bk){bk=t.dataset.bk;render();return}
 if(t.dataset.ci!==undefined){ci=+t.dataset.ci;render();return}
 if(t.dataset.open!==undefined){ci=+t.dataset.open;view="chap";render();return}
 if(t.dataset.cid){curChar=t.dataset.cid;render();return}
 if(t.dataset.lid){curLoc=t.dataset.lid;render();return}
 if(t.dataset.nid){curNoteId=t.dataset.nid;render();return}
 if(t.dataset.impon!==undefined){const k=+t.dataset.impon;imp[k].on=t.checked;return}
 if(t.dataset.addchar){const f=t.dataset.addchar,n=t.value;if(!n)return;const c=P.chapters[ci];c[f]=rv(c[f])?rv(c[f])+", "+n:n;save();render();return}
 if(t.dataset.secadd){const[i,j]=t.dataset.secadd.split(":").map(Number),id=t.value;if(!id)return;const s=P.characters[i].secretList[j];s.known=[...new Set([...(s.known||[]),id])];save();render();return}
 if(t.dataset.att){const it=P.timeline.items.find(x=>x.id===ti),id=t.value;if(!it||!id)return;const arr=it[t.dataset.att==="char"?"chars":"places"];if(!arr.includes(id))arr.push(id);save();render();return}
 if(t.dataset.tb){ti=t.dataset.tb;render();return}
 if(t.dataset.blinkIdx!==undefined){const k=+t.dataset.blinkIdx,l=boardOf().links[k];if(!l)return;const v=await ask("Link label (leave empty to remove the link)",{input:l.label||"",ok:"Save"});if(v===null)return;if(v==="")boardOf().links.splice(k,1);else l.label=v;save();render();return}
 const a=t.dataset.act;if(!a)return;
 const B=boardOf();
 switch(a){
  case "viewnovel":showGen=true;bk="novel";view="bible";render();break;
  case "loadfw":{const fw=FRAMEWORKS[P.plot.fw]||FRAMEWORKS.three,have=new Set(P.plot.beats.map(b=>rv(b.label).toLowerCase()));let n=0;fw.beats.forEach(l=>{if(!have.has(l.toLowerCase())){P.plot.beats.push({id:uid(),label:l,text:"",chap:""});n++}});save();render();$("#st").textContent=n?"Added "+n+" beat"+(n===1?"":"s")+" from "+fw.name:"Those beats are already there";break}
  case "addbeat":P.plot.beats.push({id:uid(),label:"",text:"",chap:""});save();render();break;
  case "delbeat":P.plot.beats.splice(+t.dataset.i,1);save();render();break;
  case "addthread":P.plot.threads.push({id:uid(),name:"",type:"Subplot",status:"Planned",setup:"",payoff:"",notes:""});save();render();break;
  case "delthread":P.plot.threads.splice(+t.dataset.i,1);save();render();break;
  case "togen":showGen=!showGen;if(!showGen&&GEN_KEYS.includes(bk))bk="struct";render();break;
  case "popout":popOut();break;
  case "focus":focusMode=!focusMode;render();break;
  case "cjexport":cjExport();break;
  case "cjimport":cjImport();break;
  case "pjexport":pjExport();break;
  case "pjimport":pjImport();break;
  case "bpexport":bpExport();break;
  case "bpdl":bpDownload();break;
  case "bpimport":bpImport();break;
  case "addchar":{const nc=newChar();P.characters.push(nc);curChar=nc.id;save();render();break}
  case "delchar":case "delcharcur":var ix=t.dataset.i!==undefined?+t.dataset.i:P.characters.findIndex(x=>x.id===curChar);if(P.characters[ix]&&await ask("Delete this character and its relationships?")){const id=P.characters[ix].id;P.characters.splice(ix,1);curChar=(P.characters[Math.min(ix,P.characters.length-1)]||{}).id||null;P.rels=P.rels.filter(r=>r.a!==id&&r.b!==id);P.board.cards=P.board.cards.filter(c=>!(c.t==="char"&&c.ref===id));save();render()}break;
  case "addrel":P.rels.push({id:uid(),a:P.characters[+t.dataset.i].id,b:"",label:""});save();render();break;
  case "delrel":P.rels=P.rels.filter(r=>r.id!==t.dataset.id);save();render();break;
  case "addsec":P.characters[+t.dataset.i].secretList.push({id:uid(),text:"",known:[],from:""});save();render();break;
  case "delsec":P.characters[+t.dataset.i].secretList.splice(+t.dataset.j,1);save();render();break;
  case "skdel":{const s=P.characters[+t.dataset.i].secretList[+t.dataset.j];s.known=s.known.filter(x=>x!==t.dataset.id);save();render();break}
  case "addstage":P.characters[+t.dataset.i].stages.push({id:uid(),chap:"",text:""});save();render();break;
  case "delstage":P.characters[+t.dataset.i].stages.splice(+t.dataset.j,1);save();render();break;
  case "addloc":{const cur=P.locations.find(x=>x.id===curLoc),nl={id:uid(),name:"",type:cur?(cur.type||"Place"):"Place",notes:"",look:"",img:"",svg:""};P.locations.push(nl);curLoc=nl.id;save();render();break}
  case "delloc":case "dellocur":{const ix=t.dataset.i!==undefined?+t.dataset.i:P.locations.findIndex(x=>x.id===curLoc),lc=P.locations[ix];
   if(lc&&await ask("Delete this place or lore entry?")){const id=lc.id;P.locations.splice(ix,1);curLoc=(P.locations[Math.min(ix,P.locations.length-1)]||{}).id||null;
    P.timeline.items.forEach(it=>it.places=(it.places||[]).filter(x=>x!==id));P.chapters.forEach(c=>{if(c.loc===id)c.loc=""});
    const B=boardOf(),rm=new Set(B.cards.filter(c=>c.t==="loc"&&c.ref===id).map(c=>c.id));B.cards=B.cards.filter(c=>!rm.has(c.id));B.links=B.links.filter(l=>!rm.has(l.a)&&!rm.has(l.b));save();render()}break}
  case "pp":{const ta=$("#pp-"+t.dataset.a+"-"+t.dataset.i),o=t.dataset.a==="locations"?P.locations[+t.dataset.i]:P.characters[+t.dataset.i];if(ta){ta.style.display="block";ta.value=pprompt(o,t.dataset.a==="locations");copyOut(ta.value,"Image prompt copied to clipboard")}break}
  case "rmpic":{const o=t.dataset.a==="locations"?P.locations[+t.dataset.i]:P.characters[+t.dataset.i];o.img="";o.svg="";save();render();break}
  case "addchap":P.chapters.push({id:uid(),title:"Chapter "+(P.chapters.length+1),act:P.chapters[ci]?.act||1,target:P.ai.chapterWords||3000,status:"Planned",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:"Past",summary:"",beats:"",text:"",versions:[],scenes:[]});ci=P.chapters.length-1;save();render();break;
  case "bulkchap":{const raw=+($("#bkn")?.value),n=Math.floor(raw);
   if(!Number.isFinite(raw)||n<1||n>99){$("#st").textContent="Enter a whole number from 1 to 99";break}
   let pat=($("#bkt")?.value||"").trim()||"Chapter {n}";if(!pat.includes("{n}"))pat+=" {n}";
   const act=+($("#bka")?.value)||1,cur=P.chapters[ci],start=P.chapters.length;
   if(n>20&&!await ask("Create "+n+" new chapters, "+(start+1)+" to "+(start+n)+"? You can delete them one at a time afterwards.",{ok:"Create"}))break;
   for(let k=0;k<n;k++)P.chapters.push({id:uid(),title:pat.split("{n}").join(start+k+1),act,target:P.ai.chapterWords||3000,status:"Planned",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:(cur&&cur.tense)||"Past",summary:"",beats:"",text:"",versions:[],scenes:[]});
   ci=start;save();render();$("#st").textContent="Added "+n+" chapter"+(n===1?"":"s")+" ("+(start+1)+" to "+(start+n)+")";break}
  case "inschap":P.chapters.splice(ci+1,0,{id:uid(),title:"Chapter "+(P.chapters.length+1),act:P.chapters[ci]?.act||1,target:P.ai.chapterWords||3000,status:"Planned",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:"Past",summary:"",beats:"",text:"",versions:[],scenes:[]});ci++;save();render();break;
  case "chapup":if(ci>0){[P.chapters[ci-1],P.chapters[ci]]=[P.chapters[ci],P.chapters[ci-1]];ci--;save();render()}break;
  case "chapdn":if(ci<P.chapters.length-1){[P.chapters[ci+1],P.chapters[ci]]=[P.chapters[ci],P.chapters[ci+1]];ci++;save();render()}break;
  case "delchap":if(await ask("Delete this chapter?")){P.chapters.splice(ci,1);if(!P.chapters.length)P.chapters.push({id:uid(),title:"Chapter 1",act:1,target:3000,status:"Planned",major:"",minor:"",place:"",time:"",pov:"",loc:"",tense:"Past",summary:"",beats:"",text:"",versions:[],scenes:[]});ci=Math.max(0,Math.min(ci,P.chapters.length-1));save();render()}break;
  case "addscene":{const c=P.chapters[ci];c.scenes=c.scenes||[];c.scenes.push({title:"",pov:"",chars:"",place:"",time:"",summary:""});save();render();break}
  case "delscene":P.chapters[ci].scenes.splice(+t.dataset.i,1);save();render();break;
  case "sceneup":{const s=P.chapters[ci].scenes,i=+t.dataset.i;if(i>0){[s[i-1],s[i]]=[s[i],s[i-1]];save();render()}break}
  case "scenedn":{const s=P.chapters[ci].scenes,i=+t.dataset.i;if(i<s.length-1){[s[i+1],s[i]]=[s[i],s[i+1]];save();render()}break}
  case "ver":{const c=P.chapters[ci];(c.versions=c.versions||[]).unshift({t:Date.now(),text:c.text,note:""});c.versions=c.versions.slice(0,30);save();render();break}
  case "restore":{const s=$("#vers"),v=P.chapters[ci].versions?.[+s.value];if(v&&await ask("Restore this version? Current text will be saved first.")){(P.chapters[ci].versions=P.chapters[ci].versions||[]).unshift({t:Date.now(),text:P.chapters[ci].text,note:"Before restore"});P.chapters[ci].text=v.text;save();render()}break}
  case "dlchap":dl(slug(P.chapters[ci].title)+".md","# "+P.chapters[ci].title+"\n\n"+P.chapters[ci].text);break;
  case "copych":copyOut(P.chapters[ci].text,"Chapter copied");break;
  case "copychmd":copyOut("# "+P.chapters[ci].title+"\n\n"+P.chapters[ci].text,"Chapter copied with title");break;
  case "pastereplace":pasteChap("replace");break;
  case "pasteappend":pasteChap("append");break;
  case "pastenew":pasteChap("new");break;
  case "bsample":
   if(!await ask("Restore \""+BIBLE.find(b=>b[0]===bk)[1]+"\" to its default? Your current text in this document will be replaced."))break;
   if(bk==="master") P.master=MASTER;
   else if(bk==="chapter") P.tpl=CHAPTER_TPL;
   else if(P.tpls[bk]!==undefined) P.tpls[bk]=DEFAULT_TPLS[bk]||"";
   else P.bible[bk]=SAMPLES[bk]||("# "+BIBLE.find(b=>b[0]===bk)[1]+"\n\n");
   save();render();break;
  case "addagent":P.agents.push({name:"",org:"",type:"Agent",status:"To query",notes:""});save();render();break;
  case "delagent":P.agents.splice(+t.dataset.i,1);save();render();break;
  case "addnote":{const n={id:uid(),title:a==="addnote"?("New "+(t.dataset.scope==="ai"?"AI":"private")+" note"):"Note",scope:t.dataset.scope||"ai",tag:"",text:""};P.notes.push(n);curNoteId=n.id;save();render();break}
  case "delnote":{if(await ask("Delete this note?")){P.notes=P.notes.filter(n=>n.id!==curNoteId);curNoteId=P.notes[0]?.id||null;save();render()}break}
  case "dupnote":{const n=P.notes.find(n=>n.id===curNoteId);if(n){const c={...n,id:uid(),title:n.title+" (copy)"};P.notes.splice(P.notes.indexOf(n)+1,0,c);curNoteId=c.id;save();render()}break}
  case "noteup":{const i=P.notes.findIndex(n=>n.id===curNoteId);if(i>0){[P.notes[i-1],P.notes[i]]=[P.notes[i],P.notes[i-1]];save();render()}break}
  case "notedown":{const i=P.notes.findIndex(n=>n.id===curNoteId);if(i<P.notes.length-1){[P.notes[i+1],P.notes[i]]=[P.notes[i],P.notes[i+1]];save();render()}break}
  case "nfilt":noteFilter=t.dataset.f;render();break;
  case "dlnote":{const n=P.notes.find(n=>n.id===curNoteId);if(n)dl(slug(n.title)+".md","# "+n.title+"\n\n"+n.text);break}
  case "chbrief":copyBrief();break;
  case "chtpl":dl("character-template.md",CHAR_TPL);break;
  case "chexp":dl("characters.md",charsExport());break;
  case "chprev":doPrev();break;
  case "impgo":{const msg=applyImport(imp,impMode);imp=null;impTxt="";impMsg=msg;save();render();break}
  case "impcancel":imp=null;impTxt="";impMsg="";render();break;
  case "bnote":B.cards.push({id:uid(),t:"note",x:pos(B),y:pos(B)+40,text:""});save();render();break;
  case "badd":{const g={char:P.characters,loc:P.locations||[],chap:P.chapters}[t.dataset.t],ref=g[+t.dataset.i];if(!ref)break;B.cards.push({id:uid(),t:t.dataset.t,ref:ref.id,x:pos(B),y:pos(B)+40});save();render();break}
  case "bdel":B.cards=B.cards.filter(c=>c.id!==t.dataset.id);B.links=B.links.filter(l=>l.a!==t.dataset.id&&l.b!==t.dataset.id);save();render();break;
  case "bcol":{const c=B.cards.find(c=>c.id===t.dataset.id);if(c){const cols=["#fff","#fff6c8","#e6f4ff","#e8ffe8","#ffe4e1","#f0e6ff"];c.col=cols[(cols.indexOf(c.col)+1)%cols.length];save();render()}break}
  case "blink":lk=!lk;lsrc=null;render();break;
  case "barr":{B.cards.forEach((c,i)=>{c.x=30+(i%10)*170;c.y=30+Math.floor(i/10)*120});save();render();break}
  case "brels":{const have=new Set(B.links.map(l=>[l.a,l.b].sort().join("|")));P.rels.forEach(r=>{const ca=B.cards.find(c=>c.t==="char"&&c.ref===r.a),cb=B.cards.find(c=>c.t==="char"&&c.ref===r.b);if(ca&&cb){const k=[ca.id,cb.id].sort().join("|");if(!have.has(k)){B.links.push({a:ca.id,b:cb.id,label:r.label||""});have.add(k)}}});save();render();break}
  case "tadd":{const it={id:uid(),title:"New event",tid:P.timeline.tracks[0].id,start:ci,span:1,color:P.timeline.tracks[0].color,notes:"",chars:[],places:[]};P.timeline.items.push(it);ti=it.id;save();render();break}
  case "ttrack":P.timeline.tracks.push({id:uid(),name:"New track",color:"#999999"});save();render();break;
  case "tdel":P.timeline.tracks=P.timeline.tracks.filter(x=>x.id!==t.dataset.id);P.timeline.items=P.timeline.items.filter(x=>x.tid!==t.dataset.id);if(ti&&!P.timeline.items.find(x=>x.id===ti))ti=null;save();render();break;
  case "tdet":{const it=P.timeline.items.find(x=>x.id===ti);if(it){const arr=it[t.dataset.kind==="char"?"chars":"places"];it[t.dataset.kind==="char"?"chars":"places"]=arr.filter(x=>x!==t.dataset.id);save();render()}break}
  case "tbeats":{const it=P.timeline.items.find(x=>x.id===ti);if(it){const c=P.chapters[it.start];c.beats=rv(c.beats)?rv(c.beats)+"\n"+it.title:it.title;save();render();$("#st").textContent="Added to chapter "+(it.start+1)+" beats"}break}
  case "titemdel":P.timeline.items=P.timeline.items.filter(x=>x.id!==ti);ti=null;save();render();break;
  case "tdone":ti=null;render();break;
  case "detect":{P.chapters.forEach(c=>{P.characters.forEach(x=>{if(x.name&&cnt(c.text,x.name)>0&&!has(c.major,x.name)&&!has(c.minor,x.name)&&!sc(c,x.name)){c.minor=rv(c.minor)?rv(c.minor)+", "+x.name:x.name}})});save();render();break}
  case "gen":{if(blocked())break;aiOut=buildPrompt();aiEdited=false;save();render();break}
  case "copy":{if(blocked())break;let o=$("#out")?.value||"";if(!o||!aiEdited){o=buildPrompt();aiOut=o;aiEdited=false;const t=$("#out");if(t)t.value=o}copyOut(o,"Prompt copied");break}
  case "copyres":{const r=$("#res")?.value||"";if(!r.trim()){$("#st").textContent="Nothing to copy yet";break}copyOut(r,"Reply copied");break}
  case "clearres":aiRes="";const rt=$("#res");if(rt)rt.value="";break;
  case "applysum":{const r=$("#res")?.value||"",d=parseSum(r),keys=Object.keys(d);
   if(!keys.length){$("#st").textContent="Could not find Summary, Beats, Characters, Place or Time headings in the reply";break}
   const L={summary:"summary",beats:"beats",major:"major characters",minor:"minor characters",place:"place",time:"time"};
   if(await ask("Update Chapter "+(ci+1)+" from this reply? These fields will be replaced: "+keys.map(k=>L[k]).join(", ")+".",{ok:"Apply"})){keys.forEach(k=>{P.chapters[ci][k]=d[k]});save();render();$("#st").textContent="Chapter "+(ci+1)+" updated from the reply"}break}
  case "aianalysis":dl(slug(P.name)+"-ai-analysis.md",aiAnalysisExportMD());break;
  case "dlsuper":dl(slug(P.name)+"-super-prompt.md",superPromptMD());break;
  case "dlbiball":dl(slug(P.name)+"-bible.md",bibleDocsMD());break;
  case "expall":expAll(false,true);break;
  case "expproj":expAll(false,false);break;
  case "exp":dl(slug(P.name)+".json",JSON.stringify(stripCfg(P),null,1));break;
  case "expmd":dl(slug(P.name)+".md","# "+P.name+"\n\n"+P.chapters.map(c=>"## "+c.title+"\n\n"+c.text).join("\n\n"));break;
  case "dlnovel":dlNovel();break;
  case "dlfirst3":dlFirstN(3);break;
  case "dlsyn":dlSynopsis();break;
  case "copynovel":copyNovel();break;
  case "outline":dl(slug(P.name)+"-outline.md",outlineMD());break;
  case "bkfolder":pickDir();break;
  case "bkreauth":reauthDir();break;
  case "bkoff":turnOffAuto();break;
  case "bkrun":runAuto(true);break;
  case "bkexport":expAll(true);break;
  case "bksnooze":LS.set("ns_snooze",Date.now()+864e5);render();break;
  case "bladd":{const v=$("#blq")?.value?.trim();if(v){P.style.blacklist=rv(P.style.blacklist)?rv(P.style.blacklist)+"\n"+v:v;save();render()}break}
  case "blreset":P.style.blacklist=KPI_DEFAULT_BL;P.style.allow=KPI_DEFAULT_ALLOW;P.style.ignore="";P.style.repeatMin=5;save();render();break;
  case "blban":{const w=t.dataset.w;if(w){P.style.blacklist=rv(P.style.blacklist)?rv(P.style.blacklist)+"\n"+w:w;save();render()}break}
  case "blig":{const w=t.dataset.w;if(w){P.style.ignore=rv(P.style.ignore)?rv(P.style.ignore)+"\n"+w:w;save();render()}break}
  case "resetm":if(await ask("Reset master instruction to the file default?")){P.master=MASTER||FALLBACK_MASTER;save();render()}break;
  case "resett":{const k=$("#tpled")?.value||tplEdit;if(DEFAULT_TPLS[k]&&await ask("Reset this template to the file default?")){P.tpls[k]=DEFAULT_TPLS[k];save();render()}break}
  case "runai":runai();break;
  case "stopai":if(aiCtl){aiCtl.abort("stopped");$("#st").textContent="Stopping…"}else $("#st").textContent="Nothing is running";break;
  case "ltest":localTest();break;
  case "auditchap":runAudits("chap");break;
  case "auditsyn":runAudits("syn");break;
  case "auditall":runAudits("all");break;
  case "dlaudits":{const m=auditsMD();if(!m){$("#st").textContent="No audit reports yet. Run an audit first.";break}dl(slug(P.name)+"-audit-reports.md",m);break}
  case "applyprose":{const r=$("#res")?.value||"";if(!r.trim()){$("#st").textContent="No reply to apply";break}const c=P.chapters[ci];(c.versions=c.versions||[]).unshift({t:Date.now(),text:c.text,note:"Before AI apply"});c.versions=c.versions.slice(0,30);c.text=r;save();render();$("#st").textContent="Prose applied to chapter "+(ci+1);break}
  case "splitai":{const r=$("#res")?.value||"";const m=r.match(/\n(?=#+\s*(?:Editorial|Report|Editor))/i);if(m){$("#res").value=r.slice(0,m.index).trim();$("#st").textContent="Prose and report split (edit report separately in history)"}else $("#st").textContent="No editorial-report heading found";break}
  case "savever":{const r=$("#res")?.value||"";if(!r.trim()){$("#st").textContent="No reply to save";break}const c=P.chapters[ci];(c.versions=c.versions||[]).unshift({t:Date.now(),text:r,note:"AI reply"});c.versions=c.versions.slice(0,30);save();render();$("#st").textContent="Saved as a version";break}
  case "loghist":{const r=$("#res")?.value||"";if(!r.trim()){$("#st").textContent="No reply to log";break}P.history.unshift({id:uid(),t:Date.now(),op:OPS.find(x=>x[0]===aiMode)?.[1]||aiMode,chapIdx:ci,reply:r});P.history=P.history.slice(0,50);save();render();$("#st").textContent="Saved to Editorial History";break}
  case "qprop":{const r=$("#res")?.value||"";if(!r.trim()){$("#st").textContent="No reply to queue";break}P.proposals.push({id:uid(),t:Date.now(),title:t.dataset.t==="cont"?"Continuity update":t.dataset.t==="summary"?"Chapter summary":"Chapter beats",content:r,status:"pending",kind:t.dataset.t,chapIdx:ci});save();render();$("#st").textContent="Queued as a proposal for approval";break}
  case "appprop":{const p=P.proposals.find(x=>x.id===t.dataset.id);if(p){const ta=document.querySelector('[data-prop="'+p.id+'"]');if(ta)p.content=ta.value;const c=P.chapters[p.chapIdx]||P.chapters[ci];if(p.kind==="summary")c.summary=p.content;else if(p.kind==="beats")c.beats=p.content;else{P.bible.cont=rv(P.bible.cont)+"\n\n"+p.content}P.proposals=P.proposals.filter(x=>x.id!==p.id);save();render();$("#st").textContent="Proposal applied"}break}
  case "rejprop":P.proposals=P.proposals.filter(x=>x.id!==t.dataset.id);save();render();break;
  case "delhist":P.history=P.history.filter(x=>x.id!==t.dataset.id);save();render();break;
  case "delproj":{if(all.length<=1){$("#st").textContent="Cannot delete the only project";break}if(await ask("Delete this project permanently?")){db.transaction("p","readwrite").objectStore("p").delete(P.id);all=all.filter(p=>p.id!==P.id);P=all[0];LS.set("ns_cur",P.id);save();render()}break}
 }
});

/* delegated input/change */
document.addEventListener("input",e=>{
 const el=e.target;if(el.id==="out"){aiOut=el.value;aiEdited=true;updTok()}
 if(el.id==="aisel")aiSel=el.value;
 if(el.id==="res")aiRes=el.value;
 if(el.id==="qn")qnTxt=el.value;
 if(el.id==="impq")impTxt=el.value;
 if(el.id==="cj")cjTxt=el.value;
 if(el.id==="pj")pjTxt=el.value;
 if(el.id==="bp")bpTxt=el.value;
 if(el.id==="key")aiKey=el.value;
 if(el.id==="nsearch"){noteSearch=el.value;render();return}
 if(el.id==="bkdays")LS.set("ns_bkdays",el.value);
 if(el.id==="tidy")tidyOn=el.checked;
 const k=el.dataset.k;if(!k)return;
 let v=el.type==="number"?+el.value:el.value;
 if(el.tagName==="SELECT"&&el.dataset.num)v=+v;
 if(el.type==="checkbox")v=el.checked;
 setPath(k,v);
 if(k.startsWith("ai.l"))updLocalUrl();
 if(el.classList.contains("ms"))upd();
 if(el.tagName==="TEXTAREA"&&el.classList.contains("ms"))kpiSoon();
 save();
});
document.addEventListener("change",e=>{
 const el=e.target;
 if(el.dataset.k&&/^characters\.\d+\.(tier|inc)$/.test(el.dataset.k)){setPath(el.dataset.k,el.type==="checkbox"?el.checked:el.value);save();render();return}
 if(el.dataset.k&&/^locations\.\d+\.type$/.test(el.dataset.k)){setPath(el.dataset.k,el.value);save();render();return}
 if(el.id==="proj"){if(tm){clearTimeout(tm);tm=null;put(P)}if(el.value==="__new"){const p=mk("Untitled novel");all.push(p);P=p;}else{P=all.find(p=>p.id===el.value)||P}LS.set("ns_cur",P.id);ci=0;curNoteId=null;aiOut="";aiRes="";save();render();return}
 if(el.id==="impall"&&el.files[0]){const r=new FileReader();r.onload=async()=>{try{const d=JSON.parse(r.result),ps=d.projects||[d];if(!ps.length)throw new Error("No projects found in file");let cfgMsg="";if(d.settings&&typeof d.settings==="object"){if(await ask("This backup includes device settings (AI server address, model, timeouts). Apply them to this device?",{ok:"Apply settings",cancel:"Keep current settings"})){applyCfg(d.settings);cfgMsg=" and device settings"}}ps.forEach(p=>{const m=migrate(Object.assign({},p,{id:p.id||uid()}));const k=all.findIndex(x=>x.id===m.id);if(k>=0)all[k]=m;else all.push(m);put(m)});P=all.find(x=>x.id===P.id)||all[0];LS.set("ns_cur",P.id);ci=0;curNoteId=null;aiOut="";aiRes="";render();$("#st").textContent="Backup imported ("+ps.length+" project(s)"+cfgMsg+")"}catch(err){$("#st").textContent="Import failed: "+err.message}};r.readAsText(el.files[0]);el.value="";return}
 if(el.id==="impfile"&&el.files[0]){const r=new FileReader();r.onload=()=>{impTxt=r.result;render()};r.readAsText(el.files[0]);return}
 if(el.id==="bpfile"&&el.files[0]){const r=new FileReader();$("#st").textContent="Reading "+el.files[0].name+"…";r.onload=()=>{bpTxt=r.result;bpMsg="";render();bpImport()};r.onerror=()=>{bpMsg="Not imported: the file could not be read.";render()};r.readAsText(el.files[0]);el.value="";return}
 if(el.id==="pjfile"&&el.files[0]){const r=new FileReader();r.onload=()=>{pjTxt=r.result;pjMsg="";render()};r.readAsText(el.files[0]);el.value="";return}
 if(el.id==="chfile"&&el.files[0]){const r=new FileReader();r.onload=()=>{const c=P.chapters[ci];(c.versions=c.versions||[]).unshift({t:Date.now(),text:c.text,note:"Before upload"});c.text=r.result;save();render()};r.readAsText(el.files[0]);return}
 if(el.dataset.pic){pic(el.dataset.pic,el.files[0]);return}
 if(el.dataset.impmode){impMode=el.value;render();return}
 if(el.id==="tpled"){tplEdit=el.value;render();return}
 if(el.id==="bzoom"){bz=+el.value;render();return}
 if(el.dataset.ctx){ctx[el.dataset.ctx]=el.checked;updTok();return}
 if(el.id==="aimode"){aiMode=el.value;aiOut="";aiEdited=false;const d=OP_CTX[aiMode];if(d)Object.assign(ctx,d);render();return}
 if(el.id==="aich"){ci=+el.value;render();return}
 if(el.id==="aitips"){aiTips=el.value;render();return}
 if(el.dataset.secadd){const[i,j]=el.dataset.secadd.split(":").map(Number),id=el.value;if(!id)return;const s=P.characters[i].secretList[j];s.known=[...new Set([...(s.known||[]),id])];save();render();return}
 if(el.dataset.att){const it=P.timeline.items.find(x=>x.id===ti),id=el.value;if(!it||!id)return;const arr=it[el.dataset.att==="char"?"chars":"places"];if(!arr.includes(id))arr.push(id);save();render();return}
 if(el.dataset.tz||el.dataset.tb){ti=el.dataset.tb||el.dataset.tz;render();return}
 if(el.dataset.addchar){const f=el.dataset.addchar,n=el.value;if(!n)return;const c=P.chapters[ci];c[f]=rv(c[f])?rv(c[f])+", "+n:n;save();render();return}
 const k=el.dataset.k;if(!k)return;
 let v=el.type==="number"?+el.value:el.value;
 if(el.tagName==="SELECT"&&el.dataset.num)v=+v;
 if(el.type==="checkbox")v=el.checked;
 setPath(k,v);
 if(k==="ai.provider"||k==="ai.lProto"){save();render();return}
 if(k.startsWith("ai.l"))updLocalUrl();
 if(el.classList.contains("ms"))upd();
 if(el.tagName==="TEXTAREA"&&el.classList.contains("ms"))kpiSoon();
 save();
});
function upd(){const t=document.querySelector(".ms"),e=$("#wcount");if(t&&e)e.textContent="("+wc(t.value).toLocaleString()+" words)"}
function updTok(){const e=$("#tok");if(!e)return;const p=$("#out")?.value||"",n=Math.round(p.length/4),lim=isLocal()?(+P.ai.lCtx||0)-(+P.ai.lMaxTokens||0):0;
 e.textContent="~"+n.toLocaleString()+" tokens"+(lim>0&&n>lim?" ⚠ over your local context window (room for ~"+lim.toLocaleString()+" prompt tokens). Untick some context, or raise the server's context size.":"")}

/* prompt builder */
function fillTpl(tpl,c,i){const R=(t,k,v)=>t.split(k).join(v),nm=id=>(P.characters.find(x=>x.id===id)||{}).name||"",pl=((P.locations||[]).find(x=>x.id===c.loc)||{}).name||c.place||"",who=[c.major,c.minor].filter(Boolean).join(", "),pv=i>0?"Previous chapter ("+P.chapters[i-1].title+"): "+(P.chapters[i-1].summary||"no summary yet"):"This is the opening chapter.";
 const scn=(c.scenes||[]).length?c.scenes.map((x,j)=>"Scene "+(j+1)+":\n"+[x.title,x.summary,x.pov&&"POV: "+x.pov,x.chars&&"Characters: "+x.chars,x.place&&"Place: "+x.place,x.time&&"Time: "+x.time].filter(Boolean).join(". ")).join("\n"):(c.beats||"(no scenes yet)");
 const rq=P.characters.filter(x=>x.name&&has(who,x.name)).map(x=>charMD(x,i)).join("\n")||"(none)";
 let t=tpl.replace(/## SCENE BREAKDOWN\n\n[\s\S]*?(?=## CHARACTER REQUIREMENTS)/,()=>"## SCENE BREAKDOWN\n\n"+scn+"\n\n");
 [["[NUMBER]",i+1],["[TITLE]",c.title],["[ACT]",c.act],["[WORD COUNT]",c.target],["[POV]",nm(c.pov)||"(not set)"],["[PAST/PRESENT]",c.tense||"Past"],["[NAMES]",who||"(not set)"],["[LOCATION]",[pl,c.time].filter(Boolean).join(", ")||"(not set)"],["[INSERT APPROVED CHAPTER SUMMARY]",c.summary||"(none)"],["[INSERT SPECIFIC CHARACTER MOTIVATIONS, EMOTIONAL STATES AND INTERACTIONS]",rq],["[INSERT RELEVANT FACTS, PREVIOUS EVENTS AND INFORMATION THAT MUST BE PRESERVED]",pv],["[INSERT ANY SPECIFIC INSTRUCTIONS FOR THIS CHAPTER]",c.beats||"(none)"]].forEach(a=>{t=R(t,a[0],String(a[1]))});return t}

/* ---- readiness: what each task needs before it can run ---- */
function readiness(op,i){
 const c=P.chapters[i];if(!c)return null;
 const r={need:[],warn:[],good:[],hint:"",goAttr:"",goLabel:""};
 const chk=(ok,msg,hard)=>{(ok?r.good:hard?r.need:r.warn).push(msg)};
 const nm=[c.major,c.minor].join(",").split(",").map(x=>x.trim()).filter(Boolean);
 const goCh=j=>{r.goAttr='data-open="'+j+'"';r.goLabel="Open Chapter "+(j+1)+" to fill it in"};
 if(op==="write"){
  goCh(i);r.hint="Fill in this chapter on the Chapters page (summary, beats or scenes, characters), then come back. The more detail it has, the less the AI has to invent.";
  chk(wc(c.summary)>=15,"Chapter summary: a few sentences on what happens and what changes",1);
  chk(!!(rv(c.beats)||(c.scenes||[]).some(x=>rv(x.summary)||rv(x.title))),"Beats or scenes: what happens, in order",1);
  chk(!!(rv(c.pov)||nm.length),"Characters: choose a POV or list major and minor characters",1);
  chk(!!rv(c.pov),"POV character chosen");
  chk(!!(rv(c.place)||rv(c.loc)),"Place set");
  chk(!!rv(c.time),"Time set");
  const miss=nm.filter(n=>!resolveChar(n));
  chk(!miss.length,miss.length?"No character profile for: "+miss.join(", ")+" (add them on the Characters page)":"Every listed character has a profile");
  const thin=P.characters.filter(x=>x.name&&(c.pov===x.id||has(nm.join(","),x.name))&&charGaps(x).length>=5).map(x=>x.name);
  chk(!thin.length,thin.length?"Profiles are mostly empty for: "+thin.join(", "):"Character profiles have detail");
  chk(i===0||!!(rv(P.chapters[i-1].summary)||rv(P.chapters[i-1].text)),"Previous chapter has a summary or text, so the AI knows where the story left off");
  chk(rv(P.bible.voice).length>150&&rv(P.bible.voice)!==rv(SAMPLES.voice),"Voice & Style Bible filled in: paste a sample of your own writing so the AI matches your voice");
  chk(!!(rv(P.synopsis)||rv(P.strapline)),"Synopsis or pitch written, so the AI knows where the story is heading");
  return r}
 if(op==="sum"||op==="audit_chapter"){
  goCh(i);r.hint="Write or paste the chapter text on the Chapters page first.";
  chk(wc(c.text)>=50,"Chapter text (at least a few paragraphs)",1);
  if(op==="audit_chapter")chk(!!rv(c.summary),"Chapter summary, so the audit can check it against the text");
  return r}
 if(op==="audit_plot"){
  r.hint="Add a summary to the chapters first. You can generate them with Summarise chapter.";
  const miss=P.chapters.map((x,j)=>rv(x.summary)?0:j+1).filter(Boolean),have=P.chapters.length-miss.length;
  chk(have>=2,"At least two chapters with a summary (you have "+have+")",1);
  chk(!miss.length,miss.length?"Chapters without a summary: "+miss.join(", ")+". They cannot be audited.":"Every chapter has a summary");
  chk(!!rv(P.synopsis),"Synopsis written, so the audit can compare the plot to your intent");
  if(miss.length)goCh(miss[0]-1);
  return r}
 if(op==="audit_synopsis"){
  r.hint="Write the synopsis first.";r.goAttr='data-v="proj"';r.goLabel="Open Project (synopsis)";
  chk(wc(P.synopsis)>=30,"Synopsis (at least a few sentences)",1);
  chk(P.chapters.some(x=>rv(x.summary)),"At least one chapter summary to compare against");
  return r}
 return null}
function readyPanel(){
 const r=readiness(aiMode,ci);if(!r)return"";
 const li=(ic,t,m)=>`<li${m?' class="mute"':""}>${ic} ${esc(t)}</li>`;
 const head=r.need.length?`<b>${aiMode==="write"?"Chapter "+(ci+1)+" needs more guidance and data before the AI can write it.":"Not ready yet."}</b> ${esc(r.hint)}`:(r.warn.length?"<b>Ready.</b> The result will be better if you add the items marked below.":"<b>Ready.</b> Everything this task needs is filled in.");
 return`<div id="rdy" class="box ${r.need.length?"warn":""}">${head}<ul style="list-style:none;margin:8px 0 0;padding:0;font-size:13px">${r.need.map(t=>li("✗",t)).join("")}${r.warn.map(t=>li("⚠",t)).join("")}${r.need.length||r.warn.length?r.good.map(t=>li("✓",t,1)).join(""):""}</ul>${r.goAttr&&(r.need.length||r.warn.length)?`<div class="row" style="margin:8px 0 0"><button class="sm pri" ${r.goAttr}>${esc(r.goLabel)}</button></div>`:""}</div>`}
function blocked(){
 const r=readiness(aiMode,ci);
 if(r&&r.need.length){$("#st").textContent=aiMode==="write"?"Chapter "+(ci+1)+" needs more guidance and data before the AI can write it. See the checklist.":"Not ready: see the checklist.";const p=$("#rdy");if(p&&p.scrollIntoView)p.scrollIntoView({block:"center"});return true}
 return false}
/* Parse the reply of "Summarise chapter" into chapter fields. */
function parseSum(t){
 const N="Major characters|Minor characters|Place|Time|Summary|Beats|What changed|Open threads",K={"major characters":"major","minor characters":"minor","place":"place","time":"time","summary":"summary","beats":"beats"};
 const reC=new RegExp("^\\s*(?:#{1,4}\\s*|[-*]\\s*)?\\**\\s*("+N+")\\s*(?:\\([^)]*\\))?\\s*\\**\\s*:\\s*\\**\\s*(.+)$","i");
 const reH=new RegExp("^\\s*(?:#{1,4}\\s*)?(?:\\d+[.)]\\s*)?\\**\\s*("+N+")\\s*(?:\\([^)]*\\))?\\s*\\**\\s*:?\\s*\\**\\s*$","i");
 const out={};let cur=null;
 String(t||"").replace(/\r/g,"").split("\n").forEach(l=>{
  let m=l.match(reC);if(m){cur=K[m[1].toLowerCase()]||"x";if(cur!=="x")out[cur]=[m[2]];return}
  m=l.match(reH);if(m){cur=K[m[1].toLowerCase()]||"x";if(cur!=="x")out[cur]=[];return}
  if(cur&&cur!=="x")out[cur].push(l)});
 const res={};
 Object.keys(out).forEach(k=>{let v=out[k].join("\n").trim().replace(/\*\*/g,"");if(k==="beats")v=v.split("\n").map(l=>l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/,"").trim()).filter(Boolean).join("\n");if(k==="major"||k==="minor"){v=v.replace(/\.$/,"");if(/^(none|n\/a|-)$/i.test(v))v=""}if(v)res[k]=v});
 return res}
function buildPrompt(selOverride,flagsOverride){
 try{syncBible(P)}catch(e){console.warn("[novel-studio] sync",e)}
 const c=P.chapters[ci],op=aiMode,flags=flagsOverride||ctx;
 const nm=id=>(P.characters.find(x=>x.id===id)||{}).name||"";
 const plName=c=>((P.locations||[]).find(x=>x.id===c.loc)||{}).name||c.place||"";
 const sel=(selOverride!==undefined?selOverride:($("#aisel")?.value||"")).trim();
 if(op==="sum")return OP_TASK.sum+"\n\n# CHAPTER TEXT\n"+(c.text||"(empty)");
 const pieces=[];
 pieces.push(isAudit(op)?AUDIT_ROLE:(P.master||MASTER||""));
 pieces.push(fillTpl(P.tpls[op]||DEFAULT_TPLS[op]||OP_TASK[op]||"",c,ci));
 {const tb=tipsBlock(tipsKind(op));if(tb)pieces.push(tb)}
 const chapOp=["write","plan","review","rewrite","expand","describe","dialogue","continuity","audit_chapter"].includes(op),wholeBook=!chapOp;
 const subst=t=>rv(String(t).replace(/^#.*$/gm,"").replace(/\((?:none|no )[^)]*\)/g,""));
 const add=(h,t)=>{if(t&&subst(t))pieces.push(h?h+"\n"+t:t)};
 if(flags.proj||flags.syn){let d=P.bible.novel;
  if(!flags.syn)PLOT_SECS.forEach(t=>{d=dropSec(d,t)});
  else if(chapOp)["Act summaries","Structure beats","Story threads"].forEach(t=>{d=dropSec(d,t)});
  if(flags.syn&&(P.plot||{}).endingMode!=="all"&&HOLD_OPS.includes(op))d=dropSec(d,"Ending");
  if(!flags.proj)d=dropSec(d,"Project overview");
  add("",d);
  if(flags.syn&&chapOp){const pc=plotAt(ci);if(pc)pieces.push(pc)}}
 if(flags.bible){const docs=EDIT_KEYS.filter(k=>rv(P.bible[k])).map(k=>"## "+BIBLE.find(b=>b[0]===k)[1]+"\n"+P.bible[k]).join("\n\n");if(docs)pieces.push("# STORY BIBLE\n"+docs);if(wholeBook&&["skeleton","analyse","develop","screenplay"].includes(op))add("",P.bible.index)}
 if(flags.chars){if(chapOp){const who=[c.major,c.minor].filter(Boolean).join(", "),C=P.characters.filter(x=>x.name&&x.inc!==false&&((x.tier||"major")==="major"||c.pov===x.id||has(who,x.name)));if(C.length)pieces.push("# CHARACTERS (as they stand at this chapter; major characters always listed, others only if in this chapter)\n"+C.map(x=>charMD(x,ci)).join("\n\n"))}else add("",P.bible.char)}
 if(flags.locs)add("",P.bible.world)
 if(flags.time||flags.prev){let d=P.bible.cont;if(!flags.time)d=dropSec(d,"Story timeline");if(!flags.prev)d=dropSec(d,"Chapter record");else if(chapOp)d=contUpTo(d,ci);add("",d)}
 if(flags.notes){const n=aiNotesText();if(n)pieces.push("# AUTHOR & AI NOTES\n"+n)}
 if(flags.smart){const s=sel||c.text||"";if(s){const words=new Set(s.toLowerCase().match(/\b[a-z]{4,}\b/g)||[]);const rel=P.chapters.filter((x,j)=>j!==ci&&x.summary&&[...words].some(w=>x.summary.toLowerCase().includes(w)));if(rel.length)pieces.push("# POSSIBLY RELEVANT EARLIER CHAPTERS\n"+rel.map(x=>`- ${x.title}: ${x.summary}`).join("\n"))}}
 if(op!=="audit_synopsis"&&op!=="audit_plot")pieces.push(`# CURRENT CHAPTER\n**Chapter:** ${ci+1}. ${c.title}\n**Act:** ${c.act}\n**Status:** ${c.status}\n**Target:** ${c.target} words\n**POV:** ${nm(c.pov)||"unassigned"}\n**Tense:** ${c.tense||"Past"}\n**Place:** ${plName(c)||c.place||"-"}\n**Time:** ${c.time||"-"}\n**Major characters:** ${c.major||"-"}\n**Minor characters:** ${c.minor||"-"}\n\n## Summary\n${c.summary||"(none)"}\n\n## Beats\n${c.beats||"(none)"}${(c.scenes||[]).length?"\n\n## Scenes\n"+c.scenes.map((s,j)=>`${j+1}. ${s.title||"(untitled)"} — POV ${s.pov||"-"}; place ${s.place||"-"}; time ${s.time||"-"}; chars ${s.chars||"-"}\n   ${s.summary||""}`).join("\n"):""}`);
 if(op==="audit_synopsis"){
  pieces.push("# SYNOPSIS STATS\nWord count: "+wc(P.synopsis).toLocaleString()+"\nChapters: "+P.chapters.length+" ("+P.chapters.filter(x=>rv(x.summary)).length+" with a summary)");
  pieces.push("# ALL CHAPTER SUMMARIES\n"+P.chapters.map((x,j)=>"- Ch "+(j+1)+" ("+x.title+", Act "+x.act+"): "+(rv(x.summary)||"(no summary yet)")).join("\n"));
 }
 if(op==="audit_plot"){
  pieces.push("# CHAPTER SUMMARIES (the plot as written so far)\n"+P.chapters.map((x,j)=>"## Ch "+(j+1)+": "+x.title+" (Act "+x.act+(x.pov?"; POV "+nm(x.pov):"")+(rv(x.place)?"; "+x.place:"")+(rv(x.time)?"; "+x.time:"")+")\n"+(rv(x.summary)||"(no summary yet)")).join("\n\n"));
  const sb=rv(P.bible.struct);if(sb)pieces.push("# NARRATIVE STRUCTURE\n"+sb);
 }
 const bnd=boundaries(P.characters.filter(x=>x.inc!==false),ci);if(bnd&&op!=="audit_synopsis"&&(flags.chars||flags.fullms))pieces.push("# SECRET BOUNDARIES FOR THIS CHAPTER\n"+bnd);
 if(flags.fullms)pieces.push("# FULL MANUSCRIPT (written chapters)\n"+P.chapters.map((x,j)=>x.text?`## Chapter ${j+1}: ${x.title}\n\n${x.text}`:"").filter(Boolean).join("\n\n"));
 else if(op==="write"||op==="plan"||op==="review"||op==="rewrite"){const prev=P.chapters.slice(0,ci).filter(x=>rv(x.text)).slice(-1)[0];if(prev)pieces.push("# PREVIOUS CHAPTER (full text)\n## "+prev.title+"\n\n"+prev.text)}
 if(sel&&["write","plan"].includes(op))pieces.push("# EXTRA GUIDANCE FROM THE AUTHOR FOR THIS RUN\n"+sel);
 if(sel&&!["write","plan"].includes(op))pieces.push("# SUPPLIED PASSAGE / TOPIC\n"+sel);
 else if(!sel&&(op==="rewrite"||op==="expand"||op==="describe"||op==="dialogue")&&rv(c.text))pieces.push("# CHAPTER DRAFT (to work from)\n"+c.text);
 if(op==="audit_chapter"&&!sel&&rv(c.text))pieces.push("# CHAPTER TEXT TO AUDIT\n## "+(ci+1)+". "+c.title+" ("+wc(c.text).toLocaleString()+" words)\n\n"+c.text);
 return pieces.filter(Boolean).join("\n\n---\n\n");
}

/* ---------- Ollama bridge: hand the AI Blueprint to bridge.py, load the amended blueprint (with chapter prose) back ---------- */
let brDir,brMsg="",brMode="write",brRange="all";
let bpWithText=false; /* when true, blueprintJSON() also carries each chapter's prose (used for the bridge, never for AI prompts) */
const brStem=()=>slug(P.name||"novel")+"-blueprint";
async function brLoadDir(){
 brDir=null;
 if(!db||!db.objectStoreNames.contains("h"))return;
 brDir=await new Promise(r=>{try{const q=hstore("readonly").get("bridge");q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)}catch(e){r(null)}});
}
async function brPerm(prompt){
 if(!brDir)return false;
 try{let p=await brDir.queryPermission({mode:"readwrite"});if(p!=="granted"&&prompt)p=await brDir.requestPermission({mode:"readwrite"});return p==="granted"}catch(e){return false}
}
async function brPick(){
 if(!window.showDirectoryPicker){brMsg="This browser cannot link a folder. Use Download blueprint / Upload instead.";return render()}
 let h;try{h=await showDirectoryPicker({mode:"readwrite",id:"novelstudio-bridge"})}catch(e){if(e.name!=="AbortError")brMsg="Could not use that folder: "+e.message;return render()}
 if(["packages","responses","state","logs","archive","chapters","final"].includes(h.name)){
  brMsg="“"+h.name+"” is a subfolder. Choose its parent, the data folder that contains packages/ and responses/.";return render()}
 brDir=h;
 await new Promise(r=>{try{const q=hstore("readwrite").put(brDir,"bridge");q.onsuccess=q.onerror=()=>r()}catch(e){r()}});
 brMsg="Linked “"+brDir.name+"”. bridge.py must use this same folder (--data or NS_DATA).";render()}
function brUnlink(){brDir=null;try{hstore("readwrite").delete("bridge")}catch(e){}brMsg="Folder unlinked.";render()}
const brJson=()=>{bpWithText=true;try{const j=blueprintJSON();j._bridgeRequest={mode:brMode,chapters:(brRange||"all").trim()||"all"};return JSON.stringify(j,null,2)}finally{bpWithText=false}};
async function brSub(name,create){return brDir.getDirectoryHandle(name,{create:!!create})}
async function brWrite(dir,name,text){const fh=await dir.getFileHandle(name,{create:true}),w=await fh.createWritable();await w.write(text);await w.close()}
async function brRead(dir,name){try{const fh=await dir.getFileHandle(name);return await(await fh.getFile()).text()}catch(e){return null}}

/* ---------- Ollama model setup: one validated source of truth, kept in localStorage AND the data folder's config.json (read by bridge.py before every chapter) ---------- */
const LLM_KEY="ns_llm",LLM_ROLES=[["draft1","Write","Writes the first draft of each chapter"],["draft2","Edit","Rewrites and polishes the draft in a second pass"],["audit","Audit","Checks and fixes the chapter, and writes its summary"]];
const LLM_NUM=["num_ctx","num_predict","temperature","edit_temperature","audit_temperature","top_p","repeat_penalty","timeout"];
const LLM_ORDER=["ollama_url","models","installed_models","num_ctx","num_predict","temperature","edit_temperature","audit_temperature","top_p","repeat_penalty","think","timeout"];
const LLM_DEF={ollama_url:"http://localhost:11434",models:{draft1:"",draft2:"",audit:"",summary:""},installed_models:[],num_ctx:32768,num_predict:8000,temperature:0.85,edit_temperature:0.85,audit_temperature:0.2,top_p:0.95,repeat_penalty:1.05,think:false,timeout:3600};
const LLM_RAM_CTX={8:8192,16:16384,24:24576,32:32768,48:32768,64:65536};
const LLM_PREFS={draft1:["qwen3.6","qwen3.5","qwen3","qwen2.5","llama3.2","llama3.1","llama3","mistral","gemma3","gemma2","gemma"],audit:["llama3.2","qwen3.6","qwen3.5","qwen3","qwen2.5","llama3.1","llama3","mistral","gemma3","gemma2","gemma"]};
LLM_PREFS.draft2=LLM_PREFS.draft1;LLM_PREFS.summary=LLM_PREFS.audit;
let LLM=null,llmInfo={},llmRam="",llmRaw={},llmBusy=false,llmDirty=false,llmFileTried=false,llmFileAt="",llmFileErr="",llmLocalAt="",llmTestMsg="",llmSaveMsg="",llmOpen;
function llmMerge(raw){
 const c=JSON.parse(JSON.stringify(LLM_DEF));raw=raw||{};
 if(typeof raw.ollama_url==="string"&&raw.ollama_url.trim())c.ollama_url=raw.ollama_url.trim();
 for(const [r] of LLM_ROLES){const v=raw.models&&raw.models[r];c.models[r]=typeof v==="string"&&v.toLowerCase()!=="auto"?v.trim():""}
 if(Array.isArray(raw.installed_models))c.installed_models=raw.installed_models.filter(x=>typeof x==="string");
 for(const k of LLM_NUM)if(raw[k]!==undefined&&raw[k]!==""&&isFinite(+raw[k]))c[k]=+raw[k];
 if(raw.edit_temperature===undefined||raw.edit_temperature===""||!isFinite(+raw.edit_temperature))c.edit_temperature=c.temperature;
 if(raw.think!==undefined)c.think=raw.think===true||String(raw.think).toLowerCase()==="true";
 c.models.summary=c.models.audit;
 return c}
function llmInit(){
 if(LLM)return;let s=null;try{s=JSON.parse(LS.get(LLM_KEY)||"null")}catch(e){}
 LLM=llmMerge(s&&s.cfg);llmInfo=(s&&s.info)||{};llmRam=(s&&s.ram)||"";llmLocalAt=(s&&s.at)||""}
function llmPersistLocal(){llmLocalAt=new Date().toISOString();LS.set(LLM_KEY,JSON.stringify({cfg:LLM,info:llmInfo,ram:llmRam,at:llmLocalAt}))}
const llmGB=b=>b?(b/1e9).toFixed(1)+" GB":"";
function llmSuggest(role,list){for(const p of LLM_PREFS[role]||[]){const m=list.find(n=>n.split(":")[0].toLowerCase()===p||n.toLowerCase().startsWith(p));if(m)return m}return list[0]||""}
function llmValidate(){
 const c=LLM,e=[];
 if(!/^https?:\/\/\S+$/i.test(c.ollama_url||""))e.push("The Ollama address must look like http://localhost:11434.");
 if(!c.installed_models.length)e.push("Press Test connection first, so the installed models can be loaded and chosen.");
 else for(const [r,lb] of LLM_ROLES)if(!c.installed_models.includes(c.models[r]))e.push(lb+" model: choose one of the installed models.");
 const rng=(k,lo,hi,lb)=>{const v=+c[k];if(!isFinite(v)||v<lo||v>hi)e.push(lb+" must be a number from "+lo+" to "+hi+".")};
 rng("num_ctx",2048,1048576,"Context window");rng("num_predict",256,262144,"Max reply tokens");rng("temperature",0,2,"Write temperature");rng("edit_temperature",0,2,"Edit temperature");
 rng("audit_temperature",0,2,"Audit temperature");rng("top_p",0.05,1,"Top p");rng("repeat_penalty",0.5,2,"Repeat penalty");rng("timeout",30,86400,"Timeout");
 if(+c.num_predict>=+c.num_ctx)e.push("Max reply tokens must be smaller than the context window, or the prompt has no room.");
 return e}
function llmAdvice(){
 const c=LLM,A=[],add=(l,t)=>A.push({l,t}),inst=c.installed_models,used=[...new Set(Object.values(c.models).filter(Boolean))],inf=n=>llmInfo[n]||{},n=k=>+c[k],ram=+llmRam||0;
 if(!inst.length)add("warn","No models loaded yet. Press Test connection. Only models Ollama reports as installed can be chosen, so an old or removed model can never be left in the config.");
 const mx=used.map(m=>inf(m).ctx).filter(Boolean);
 if(mx.length&&n("num_ctx")>Math.min(...mx))add("warn","The context window ("+n("num_ctx")+") is larger than a chosen model supports ("+Math.min(...mx)+"). Lower it.");
 if(ram){const rec=LLM_RAM_CTX[ram];if(n("num_ctx")>rec)add("warn","On a "+ram+" GB Mac a context window above "+rec+" usually makes Ollama swap memory and slow down or crash. This is a rule of thumb for mid-size models.");
  const big=Math.max(0,...used.map(m=>inf(m).size||0));if(big&&big/1e9>ram*0.6)add("warn","The largest chosen model needs "+llmGB(big)+", which is most of your "+ram+" GB. That leaves little room for the context. Pick a smaller model or lower the context.")}
 else add("info","Choose your Mac's memory below to get context and model-size advice.");
 const pb=Math.max(0,n("num_ctx")-n("num_predict"));
 if(isFinite(pb)&&pb>0)add("info","Room for the prompt is about "+Math.round(pb*3.5/1000)+"k characters (roughly "+Math.round(pb*0.65/1000)+"k words of bible, summaries and earlier chapters). The bridge trims the oldest material to fit as the book grows.");
 if(n("num_predict")<6000)add("warn","A 3,000-word chapter needs about 4,000 tokens, and a reply that hits the cap is cut off. Use 6,000 to 8,000.");
 if(c.think){if(n("num_predict")<12000)add("warn","Thinking is on. The model's reasoning counts against the reply cap, so a long chapter can come back empty. Raise max reply tokens to 12,000 or more, or turn thinking off.")}
 else if(used.some(m=>inf(m).thinking))add("ok","Thinking is off for your reasoning model, which is recommended for prose: the whole reply budget goes to the chapter.");
 const est=Math.round(n("num_predict")/12+300);if(n("timeout")<est)add("warn","A full-length reply at about 12 tokens per second takes up to "+est+" seconds plus prompt processing. Set the timeout above that (3600 is safe).");
 if(n("temperature")>1.1)add("warn","Write temperature above 1.1 tends to produce incoherent prose. 0.7 to 0.95 suits drafting.");
 else if(n("temperature")<0.5)add("warn","Write temperature below 0.5 gives flat, repetitive prose. 0.7 to 0.95 suits drafting.");
 if(n("edit_temperature")>1.1)add("warn","Edit temperature above 1.1 can wander from the draft. 0.5 to 0.9 keeps the edit close to it.");
 if(n("audit_temperature")>0.5)add("warn","Audit temperature should be low (0.1 to 0.3) so the audit and summary stay steady and faithful.");
 if(n("repeat_penalty")>1.15)add("warn","Repeat penalty above 1.15 distorts word choice. 1.0 to 1.1 is normal.");
 else if(n("repeat_penalty")<1)add("warn","Repeat penalty below 1.0 rewards repetition. Use 1.0 to 1.1.");
 if(n("top_p")<0.8)add("warn","A top p below 0.8 narrows the vocabulary. 0.9 to 0.95 is normal.");
 const d=c.models;if(d.draft1&&d.audit&&d.draft1!==d.audit)add("info","Writing and auditing use different models. That catches more problems, but Ollama must load each model in turn, which adds time. One model for all four roles avoids the swaps.");
 else if(d.draft1&&d.draft1===d.audit)add("info","Writing and auditing use the same model. A different model for the audit often catches more, if you have one installed and enough memory.");
 if(!A.some(a=>a.l==="warn")&&inst.length)A.unshift({l:"ok",t:"No problems found with these values."});
 return A}
const llmAdviceHTML=()=>llmAdvice().map(a=>`<div style="margin:3px 0"><b>${a.l==="warn"?"⚠":a.l==="ok"?"✓":"ℹ"}</b> ${esc(a.t)}</div>`).join("");
function llmStatHTML(){
 const t=s=>s?new Date(s).toLocaleTimeString():"";
 const f=!brDir?"not linked. Link the bridge folder to write it, or use Download.":llmFileErr?"not written: "+llmFileErr:llmDirty?"has unsaved changes. Press Save.":llmFileAt?"up to date ("+t(llmFileAt)+")":"not read or written yet.";
 return`This device: ${llmLocalAt?"saved ("+t(llmLocalAt)+")":"not saved yet"}<br>config.json: ${esc(f)}`}
function llmInfoLine(r){
 const m=LLM.models[r],i=llmInfo[m];if(!m)return"Choose a model.";
 if(!i)return esc(m);
 const bits=[llmGB(i.size),i.ctx?"max context "+i.ctx:"",i.thinking?"can think (thinking is "+(LLM.think?"ON":"off")+")":"does not think"].filter(Boolean);
 return"<b>"+esc(m)+"</b> · "+bits.join(" · ")}
function llmRefreshLive(){const a=document.getElementById("llmadvice"),s=document.getElementById("llmstat");if(a)a.innerHTML=llmAdviceHTML();if(s)s.innerHTML=llmStatHTML();
 for(const [r] of LLM_ROLES){const el=document.getElementById("llminfo-"+r);if(el)el.innerHTML=llmInfoLine(r)}}
function llmOut(disk){
 const mine={ollama_url:LLM.ollama_url,models:Object.assign({},(disk&&disk.models)||{},LLM.models,{summary:LLM.models.audit}),installed_models:LLM.installed_models,num_ctx:LLM.num_ctx,num_predict:LLM.num_predict,temperature:LLM.temperature,edit_temperature:LLM.edit_temperature,audit_temperature:LLM.audit_temperature,top_p:LLM.top_p,repeat_penalty:LLM.repeat_penalty,think:LLM.think,timeout:LLM.timeout},out={};
 for(const k of LLM_ORDER)out[k]=mine[k];
 for(const k of Object.keys(disk||{}))if(!(k in out))out[k]=disk[k]; /* keep chapters, mode, samples, sample_words, master_chars and anything else */
 return out}
async function llmWriteFile(){
 if(!brDir){llmFileErr="no bridge folder is linked";return false}
 if(!await brPerm(true)){llmFileErr="folder permission was not granted";return false}
 try{
  const old=await brRead(brDir,"config.json");let disk={};
  if(old!==null){try{disk=JSON.parse(old)}catch(e){await brWrite(brDir,"config.json.bak",old);disk={}}}
  await brWrite(brDir,"config.json",JSON.stringify(llmOut(disk),null,2)+"\n");
  llmRaw=disk;llmFileErr="";llmFileAt=new Date().toISOString();llmDirty=false;return true
 }catch(e){llmFileErr=e.message;return false}}
async function llmReloadFile(manual){
 if(!brDir){if(manual)llmSaveMsg="Link the bridge folder first.";return}
 if(!await brPerm(!!manual)){if(manual)llmSaveMsg="Folder permission was not granted.";return}
 const t=await brRead(brDir,"config.json");
 if(t===null){llmSaveMsg=manual?"No config.json in this folder yet. Save will create it.":"";llmDirty=true;return}
 try{llmRaw=JSON.parse(t)}catch(e){llmSaveMsg="config.json is not valid JSON ("+e.message+"). Save will back it up as config.json.bak and write a fresh one.";llmDirty=true;return}
 LLM=llmMerge(llmRaw);llmFileAt=new Date().toISOString();llmFileErr="";llmDirty=false;llmPersistLocal();
 llmSaveMsg=manual?"Loaded config.json.":""}
function llmFetch(url,opt,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(url,Object.assign({signal:c.signal},opt||{})).finally(()=>clearTimeout(t))}
async function llmTestConn(){
 if(llmBusy)return;
 const base=String(LLM.ollama_url||"").trim().replace(/\/+$/,"");
 if(!/^https?:\/\/\S+$/i.test(base)){llmTestMsg="Enter the address like http://localhost:11434";return render()}
 LLM.ollama_url=base;llmBusy=true;llmTestMsg="Connecting to "+base+" …";render();
 let tags;
 try{
  const r=await llmFetch(base+"/api/tags",{},8000);
  if(!r.ok)throw new Error("HTTP "+r.status);
  tags=(await r.json()).models;
  if(!Array.isArray(tags))throw new Error("that does not look like an Ollama server (no model list)");
 }catch(e){
  llmBusy=false;
  llmTestMsg="Could not reach Ollama at "+base+".\n"+(e&&e.name==="AbortError"?"No answer within 8 seconds.":(e&&e.message)||String(e))+"\nCheck that Ollama is running, that the address is right, and that the browser may reach it (Ollama's OLLAMA_ORIGINS setting). Your saved models were not changed.";
  return render()}
 const rows=await Promise.all(tags.filter(m=>m&&m.name).map(async m=>{
  const o={name:m.name,size:m.size||0,ctx:null,thinking:false,embed:/embed|rerank/i.test(m.name)};
  try{const r=await llmFetch(base+"/api/show",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:m.name,name:m.name})},8000);
   if(r.ok){const j=await r.json(),caps=j.capabilities||[];o.thinking=caps.includes("thinking");if(caps.includes("embedding")&&!caps.includes("completion"))o.embed=true;
    const mi=j.model_info||{};for(const k of Object.keys(mi))if(/\.context_length$/.test(k)&&isFinite(+mi[k])){o.ctx=+mi[k];break}}}catch(e){}
  return o}));
 const usable=rows.filter(x=>!x.embed).sort((a,b)=>a.name.localeCompare(b.name)),names=usable.map(x=>x.name);
 llmInfo={};usable.forEach(x=>{llmInfo[x.name]={size:x.size,ctx:x.ctx,thinking:x.thinking}});
 LLM.installed_models=names;
 const notes=[];
 for(const [r,lb] of LLM_ROLES){
  const cur=LLM.models[r];
  if(!names.includes(cur)){const s=llmSuggest(r,names);LLM.models[r]=s;if(s)notes.push(cur?lb+": “"+cur+"” is no longer installed, replaced with “"+s+"”.":lb+": set to “"+s+"”.")}}
 LLM.models.summary=LLM.models.audit;
 llmBusy=false;llmPersistLocal();
 let msg=names.length?"Connected. "+names.length+" usable model"+(names.length===1?"":"s")+" installed:\n"+usable.map(x=>"- "+x.name+(x.size?" · "+llmGB(x.size):"")+(x.ctx?" · max context "+x.ctx:"")+(x.thinking?" · can think":"")).join("\n"):"Connected, but no text-generation models are installed. Run: ollama pull qwen3.6";
 if(rows.length>usable.length)msg+="\n(Skipped "+(rows.length-usable.length)+" embedding model(s); they cannot write chapters.)";
 if(notes.length)msg+="\n"+notes.join("\n");
 llmTestMsg=msg;llmDirty=true;
 if(names.length&&!llmValidate().length){const ok=await llmWriteFile();llmSaveMsg=ok?"Installed models and settings written to config.json.":"Saved on this device. config.json not written: "+llmFileErr}
 render()}
async function llmSave(){
 const e=llmValidate();
 if(e.length){llmSaveMsg="Not saved:\n- "+e.join("\n- ");return render()}
 llmPersistLocal();
 const ok=await llmWriteFile();
 llmSaveMsg=ok?"Saved to this device and to config.json. A running bridge applies it from the next chapter; no restart needed.":"Saved on this device only. config.json was not written: "+llmFileErr+".\nUse Download config.json and put it in the data folder.";
 render()}
function llmDownload(){const e=llmValidate();if(e.length){llmSaveMsg="Not downloaded:\n- "+e.join("\n- ");return render()}dl("config.json",JSON.stringify(llmOut(llmRaw),null,2)+"\n")}
function llmRecommend(){
 const ram=+llmRam||0,ctx=ram?LLM_RAM_CTX[ram]:16384;
 Object.assign(LLM,{num_ctx:ctx,num_predict:Math.min(8000,Math.floor(ctx*0.5)),temperature:0.85,edit_temperature:0.75,audit_temperature:0.2,top_p:0.95,repeat_penalty:1.05,think:false,timeout:3600});
 llmPersistLocal();llmDirty=true;
 llmSaveMsg="Recommended values applied"+(ram?" for "+ram+" GB":" (memory not set, so a cautious 16384 context was used)")+". Models were not changed. Press Save to write config.json.";render()}
document.addEventListener("change",e=>{
 const k=e.target.dataset&&e.target.dataset.llm;if(!k)return;llmInit();
 const t=e.target;
 if(k==="ram"){llmRam=t.value;llmPersistLocal();return llmRefreshLive()}
 if(k==="think")LLM.think=t.checked;
 else if(k==="ollama_url")LLM.ollama_url=t.value.trim();
 else if(k.startsWith("models.")){const r=k.slice(7);if(LLM.installed_models.includes(t.value)){LLM.models[r]=t.value;LLM.models.summary=LLM.models.audit}}
 else if(LLM_NUM.includes(k))LLM[k]=t.value.trim()===""?"":Number(t.value);
 llmPersistLocal();llmDirty=true;llmRefreshLive()});
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-lact]");if(!b)return;
 ({test:llmTestConn,save:llmSave,reload:async()=>{await llmReloadFile(true);render()},rec:llmRecommend,dl:llmDownload})[b.dataset.lact]?.()});
document.addEventListener("toggle",e=>{if(e.target&&e.target.id==="llmbox")llmOpen=e.target.open},true);
function llmPanel(){
 llmInit();
 if(brDir&&!llmFileTried){llmFileTried=true;llmReloadFile(false).then(render)}
 const c=LLM,open=llmOpen===undefined?!c.installed_models.length:llmOpen,inst=c.installed_models;
 const TEMP={draft1:["temperature","Temperature","Creativity of the first draft. 0.7 to 0.95 is normal; lower is plainer and safer.",0.05],draft2:["edit_temperature","Temperature","How freely the edit changes the draft. 0.5 to 0.9; lower keeps it closer to the draft.",0.05],audit:["audit_temperature","Temperature","Keep low (0.1 to 0.3) so the audit and the chapter summary stay steady and faithful.",0.05]};
 const card=([r,lb,h])=>{const [k,tl,th,st]=TEMP[r];return`<div class="box" style="flex:1;min-width:250px;margin:0"><b>${lb}</b> <span class="mute">${h}</span>
  <select data-llm="models.${r}" ${inst.length?"":"disabled"} style="width:100%;margin:6px 0">${c.models[r]&&inst.includes(c.models[r])?"":`<option value="" selected>Choose a model…</option>`}${inst.map(m=>`<option value="${esc(m)}" ${m===c.models[r]?"selected":""}>${esc(m)}</option>`).join("")}</select>
  <div id="llminfo-${r}" class="mute" style="margin-bottom:6px">${inst.length?llmInfoLine(r):"Press Test connection to load your models."}</div>
  <label style="font-weight:600">${tl}</label> <input data-llm="${k}" type="number" step="${st}" value="${esc(c[k])}" style="max-width:100px"><div class="mute">${th}</div></div>`};
 const pf=(k,lb,hint,step)=>`<label style="font-weight:600">${lb}</label><input data-llm="${k}" type="number" step="${step}" value="${esc(c[k])}" style="max-width:120px"><span class="mute">${hint}</span>`;
 return`<details class="box" id="llmbox" ${open?"open":""}><summary><b>Ollama model setup</b> <span class="mute">${inst.length?inst.length+" installed models loaded":"press Test connection to begin"}</span></summary>
 <p class="mute" style="margin:8px 0">Saved on this device and in <code>config.json</code> in the linked data folder, which bridge.py re-reads before every chapter. Each function can only use a model Ollama reports as installed.</p>
 <div class="row" style="align-items:flex-end"><label style="font-weight:600;flex:1;min-width:220px">Ollama address<input data-llm="ollama_url" value="${esc(c.ollama_url)}" placeholder="http://localhost:11434"></label><button class="pri" data-lact="test" ${llmBusy?"disabled":""}>${llmBusy?"Testing…":"Test connection"}</button></div>
 ${llmTestMsg?`<div class="mute" style="margin:6px 0;white-space:pre-wrap">${esc(llmTestMsg)}</div>`:""}
 <div class="row" style="align-items:stretch;margin-top:8px;gap:10px">${LLM_ROLES.map(card).join("")}</div>
 <p class="mute" style="margin:8px 0 4px"><b>Settings shared by all three functions</b></p>
 <div style="display:grid;grid-template-columns:minmax(150px,190px) 120px 1fr;gap:8px 12px;align-items:center">
 ${pf("num_ctx","Context window","Prompt plus reply, in tokens. Bigger remembers more of the book but needs more RAM and is slower. About 16384 on a 16 GB Mac, 32768 on 32 GB or more.",1024)}
 ${pf("num_predict","Max reply tokens","Longest single reply. A 3,000-word chapter is about 4,000 tokens; 6,000 to 8,000 leaves a safe margin.",256)}
 ${pf("top_p","Top p","Limits word choice to the likeliest options. 0.9 to 0.95 is normal.",0.05)}
 ${pf("repeat_penalty","Repeat penalty","Discourages repeated words. 1.0 to 1.1; above 1.15 distorts prose.",0.01)}
 ${pf("timeout","Timeout (seconds)","How long to wait for one model call. 3600 is safe on slow hardware.",60)}
 <label style="font-weight:600">Thinking</label><label style="grid-column:2 / span 2"><input type="checkbox" data-llm="think" ${c.think?"checked":""} style="width:auto"> <span class="mute">Let reasoning models think before writing. Off is recommended for prose: thinking eats the reply budget.</span></label>
 </div>
 <div class="row" style="margin-top:10px;align-items:center"><label class="mute">Your Mac's memory <select data-llm="ram"><option value="">Not set</option>${[8,16,24,32,48,64].map(g=>`<option value="${g}" ${+llmRam===g?"selected":""}>${g} GB${g===64?" or more":""}</option>`).join("")}</select></label><button class="sm" data-lact="rec">Apply recommended values</button></div>
 <div class="box" style="margin:8px 0"><b>Advice</b><div id="llmadvice" class="mute" style="margin-top:4px">${llmAdviceHTML()}</div></div>
 <div class="row"><button class="pri" data-lact="save">Save</button><button data-lact="reload">Reload from config.json</button><button data-lact="dl">Download config.json</button>${brDir?"":`<button class="sm" data-bact="pick">Link bridge folder</button>`}</div>
 <div id="llmstat" class="mute" style="margin-top:6px">${llmStatHTML()}</div>
 ${llmSaveMsg?`<div class="mute" style="margin-top:6px;white-space:pre-wrap">${esc(llmSaveMsg)}</div>`:""}</details>`}

async function brSend(){
 const json=brJson(),name=brStem()+".json";
 if(!await brPerm(true)){await dl(name,json);brMsg="No folder linked, so "+name+" was downloaded. Put it in the bridge's packages folder.";return render()}
 try{
  const written=P.chapters.filter(c=>rv(c.text)).length,left=P.chapters.length-written;
  await brWrite(await brSub("packages",1),name,json);
  brMsg=(voiceIsTemplate()?"Warning: Voice & Style is still the blank template, so the chapters will be written in a generic voice. Fill it in first (Story Bible, Voice & Style).\n":"")+"Blueprint sent as packages/"+name+". "+(written?written+" chapter"+(written===1?" already has":"s already have")+" text and will be kept and used as context. ":"")+left+" chapter"+(left===1?"":"s")+" for the bridge to write."
 }catch(e){brMsg="Could not write to the folder: "+e.message}
 render()}
async function brFile(){ /* the finished file if there is one, otherwise the latest progress */
 let rs;try{rs=await brSub("responses")}catch(e){return null}
 for(const suffix of ["-complete.json","-progress.json"]){const t=await brRead(rs,brStem()+suffix);if(t)return{text:t,kind:suffix.slice(1,-5)}}
 return null}
async function brStatus(){
 if(!await brPerm(true)){brMsg="Link the bridge folder first.";return render()}
 const fmtT=iso=>iso?new Date(iso).toLocaleTimeString():"";
 const fmtAgo=iso=>{if(!iso)return"";const s=Math.max(0,Math.round((Date.now()-new Date(iso).getTime())/1000));if(s<60)return s+"s";const m=Math.floor(s/60);return m<60?m+"m "+(s%60)+"s":Math.floor(m/60)+"h "+(m%60)+"m"};
 const listFiles=async(parent,sub)=>{
  const out=[];
  try{
   const d=sub?await parent.getDirectoryHandle(sub):parent;
   for await(const [n,h] of d.entries())if(h.kind==="file")out.push(n);
   out.sort();
  }catch(e){}
  return out;
 };
 let hasResp=true,respFiles=[],chapFiles=[];
 try{
  const rs=await brSub("responses");
  respFiles=await listFiles(rs);
  chapFiles=await listFiles(rs,"chapters");
 }catch(e){hasResp=false}
 let pkgFiles=[];
 try{pkgFiles=await listFiles(await brSub("packages"))}catch(e){}
 let stateFiles=[];
 try{stateFiles=await listFiles(await brSub("state"))}catch(e){}
 let logTail="";
 try{const lg=await brSub("logs"),t=await brRead(lg,"bridge.log");if(t)logTail=t.trim().split("\n").slice(-30).join("\n")}catch(e){}

 const f=await brFile(),pkgName=brStem()+".json",hasPkg=pkgFiles.includes(pkgName),paused=stateFiles.includes("STOP");
 const extra="Linked folder: “"+brDir.name+"”"
  +(paused?"\nPAUSED: state/STOP is present.":"")
  +"\npackages/: "+(pkgFiles.length?pkgFiles.join(", "):"(empty)")
  +"\nresponses/: "+(respFiles.length?respFiles.join(", "):"(no JSON files yet)")
  +(chapFiles.length?"\nresponses/chapters/: "+chapFiles.join(", "):"")
  +(stateFiles.length?"\nstate/: "+stateFiles.join(", "):"");

 if(!f){
  brMsg=(!hasResp?"This folder has no responses/ subfolder, so bridge.py has not initialized it.\n"
   :hasPkg?"“packages/"+pkgName+"” is sitting in packages/, waiting for bridge.py to pick it up.\n"
   :"No blueprint found in packages/ or responses/ for “"+pkgName+"”. Click “3. Send to bridge” first.\n")
   +extra
   +(logTail?"\n\nLog (logs/bridge.log):\n"+logTail:"\n\nLog (logs/bridge.log): (not found in this linked folder)");
  return render()}

 try{
  const j=JSON.parse(f.text),b=j._bridge||{},chs=(j.chapters||[]),done=chs.filter(c=>rv(c.text)).length,words=chs.reduce((a,c)=>a+wc(c.text),0);
  const hb=b.heartbeat||b.updated,hbAge=hb?Math.round((Date.now()-new Date(hb).getTime())/1000):9999;
  const live=f.kind!=="complete"&&b.active!==false&&!/^(complete|failed|paused|finished)/.test(b.status||"");
  const stateLine=f.kind==="complete"?"Complete (ready to load)"
   :live?(hbAge<45?"Still progressing (last heartbeat "+fmtAgo(hb)+" ago at "+fmtT(hb)+")":"Last heartbeat "+fmtAgo(hb)+" ago at "+fmtT(hb)+" (slow model call, paused, or bridge stopped)")
   :(b.status||"Stopped");
  const act=logTail||(b.activity||[]).slice(-30).join("\n");
  brMsg="Status: "+(b.status||"unknown")+(b.detail?"\nCurrent action: "+b.detail:"")
   +"\nState: "+stateLine
   +(b.receivedAt?"\nReceived: "+fmtT(b.receivedAt):"")
   +(b.stepStartedAt?"\nCurrent step started: "+fmtT(b.stepStartedAt)+" ("+fmtAgo(b.stepStartedAt)+" elapsed)":"")
   +"\nChapters with text: "+done+" of "+chs.length+" ("+words.toLocaleString()+" words)"
   +(b.error?"\nError: "+b.error:"")
   +"\nFile: "+brStem()+"-"+f.kind+".json\n"+extra
   +(act?"\n\nActivity log:\n"+act:"");
 }catch(e){brMsg="The file is not readable yet ("+e.message+"). Try again in a moment.\n"+extra+(logTail?"\n\nLog (logs/bridge.log):\n"+logTail:"")}
 render()}
async function brLoad(){
 if(!await brPerm(true)){brMsg="Link the bridge folder first, or upload the file with AI Blueprint > Upload .json.";return render()}
 const f=await brFile();if(!f){brMsg="Nothing in responses/ for “"+brStem()+"” yet.";return render()}
 bpTxt=f.text;bpMsg="";brMsg="";render();await bpImport();
 if(f.kind==="complete"&&bpMsg.startsWith("Blueprint applied")){
  try{const rs=await brSub("responses");await rs.removeEntry(brStem()+"-complete.json")}catch(e){}
 }}
async function brPause(on){
 if(!await brPerm(true)){brMsg="Link the bridge folder first.";return render()}
 try{const st=await brSub("state",1);if(on)await brWrite(st,"STOP","stop");else await st.removeEntry("STOP");brMsg=on?"Pause requested: the bridge stops after the chapter it is writing.":"Pause cleared. Re-send the blueprint (or restart bridge.py) to continue."}
 catch(e){brMsg=on?"Could not write STOP: "+e.message:"No pause file to clear."}
 render()}
document.addEventListener("change",e=>{if(e.target.id==="brmode")brMode=e.target.value;if(e.target.id==="brrange")brRange=e.target.value});
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-bact]");if(!b)return;
 ({pick:brPick,unlink:brUnlink,send:brSend,status:brStatus,load:brLoad,pause:()=>brPause(true),resume:()=>brPause(false),
  })[b.dataset.bact]?.()});
function bridgePanel(){
 if(brDir===undefined){brDir=null;brLoadDir().then(render)}
 const w=P.chapters.filter(c=>rv(c.text)).length;
 return`<details class="box" ${brMsg?"open":""}><summary><b>Local bridge (Ollama)</b> <span class="mute">hand the whole blueprint to bridge.py, get the written book back</span></summary>
 <p class="mute" style="margin:8px 0"><b>Send blueprint</b> puts the AI Blueprint in <code>packages/</code>. bridge.py then writes every chapter that has no text, in order. After each chapter it summarises what was written and adds the prose and summary to the blueprint, then builds the next chapter's package from that amended blueprint (all earlier summaries plus the last two chapters in full). Chapters you have already written (${w} now) are kept and used as context. <b>Load result</b> brings the amended blueprint back through the normal blueprint import, with the prose going into the chapters (your current text is kept in Version History).</p>
 <div class="row"><select id="brmode" title="What the bridge does with the chapters in the range"><option value="write" ${brMode==="write"?"selected":""}>Mode: write chapters with no text</option><option value="audit" ${brMode==="audit"?"selected":""}>Mode: audit and fix written chapters</option><option value="edit" ${brMode==="edit"?"selected":""}>Mode: rewrite written chapters (polish)</option></select><input id="brrange" value="${esc(brRange)}" placeholder="Chapters: all, 3 or 1-5" style="max-width:170px" title="Which chapters: all, a number, or a range such as 1-5"></div>
 <div class="row"><button class="pri" data-bact="send">3. Send to bridge</button><button data-bact="status">Check progress</button><button data-bact="load">4. Load result</button><button data-bact="pause">Pause</button><button data-bact="resume">Clear pause</button></div>
 <div class="row"><button class="sm" data-bact="pick">${brDir?"Change":"Link"} bridge folder</button>${brDir?`<button class="sm" data-bact="unlink">Unlink</button>`:""}<span class="mute">${brDir?"Linked: “"+esc(brDir.name)+"”":"No folder linked (download and upload still work)"}</span></div>
 ${brMsg?`<div class="box" style="margin:8px 0 0;white-space:pre-wrap">${esc(brMsg)}</div>`:""}</details>`}
{const _pj=V.proj;V.proj=()=>{const h=_pj(),k=h.indexOf("<h3>Identity &amp; pitch</h3>");return k>0?h.slice(0,k)+(llmPanel()+bridgePanel())+h.slice(k):(llmPanel()+bridgePanel())+h}}

(async function boot(){
 await idb();
 await loadTemplates();
 all=await loadAll();
 if(!all.length){const p=mk("Untitled novel");all=[p];await put(p)}
 P=all.find(p=>p.id===LS.get("ns_cur"))||all[0];
 LS.set("ns_cur",P.id);
 await loadDir();
 render();
})();