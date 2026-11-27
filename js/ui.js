// Rangliste, Trainer (Themen, Aufgabe, Team), Spielerkarte, Menü und Bedienung, Willkommen, mehrere Spieler, Demo im Menü.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Rangliste =================
// Online-Rangliste (optional, z. B. für GitHub Pages): Firebase-Projekt in config.js eintragen, siehe README.
// Fehlt config.js oder bleibt projectId leer, wird nur auf diesem Gerät gespeichert.
const ONLINE=(()=>{const c=window.ONLINE_CONFIG||{};return{projectId:String(c.projectId||'').trim(),apiKey:String(c.apiKey||'').trim()};})();
const TEAMID=(()=>{const m=/[?&]team=([^&#]+)/.exec(location.search);let t='';try{t=m?decodeURIComponent(m[1]):'';}catch(e){}t=t.toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,24);return t||'team';})();
const onlineOn=()=>!!(ONLINE.projectId&&ONLINE.apiKey);
const FS=()=>`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(ONLINE.projectId)}/databases/(default)/documents/teams/${TEAMID}`;
const LVN=['Anfänger','Mittel','Profi'];
const INFO_HTML=`<h3>Was ist das?</h3>
<p>Der Basketball IQ Trainer ist ein Entscheidungstrainer für Kinder im Minibasketball und darüber (etwa 8 bis 14 Jahre). Geübt wird keine Technik, sondern das <b>Lesen der Verteidigung</b>: Zum Korb, passen, werfen, ohne Ball laufen oder richtig verteidigen.</p>
<h3>Lernziele</h3>
<p>Der DBB-Leitfaden Minibasketball nennt sieben taktische Grundfertigkeiten. Sechs davon übt das Spiel direkt, die siebte als Entscheidung:</p>
<ul><li><b>Lücke erkennen</b>: Raum und Helfer lesen. Kommt keine Hilfe, ist der Weg zum Korb frei, oder ein Mitspieler steht in der Lücke zwischen zwei Verteidigern (Lücke für einen Pass).</li>
<li><b>Gegenspieler umspielen</b>: den eigenen Verteidiger lesen. Steht er neben dir statt vor dir oder kommt mit Schwung angerannt, ziehst du an ihm vorbei.</li>
<li><b>Überzahl nutzen, In den Lauf passen, Zusammenspiel, Anbieten und Orientieren</b>: wie im Leitfaden.</li>
<li><b>Ins Ziel treffen</b> heißt im Spiel <b>Guter Wurf</b>. Treffen übt man in der Halle, hier geht es um die Wurfauswahl: „Wofür spielen wir? Korbnahe Abschlüsse, freie Dreier, Freiwürfe“ (DBB-Spielkonzeption). Wer wirft, obwohl ein Korbleger oder ein Pass besser war, bekommt dort einen Fehlversuch.</li>
<li><b>Mann-Mann-Verteidigung</b>: im Minibasketball Pflicht (Miniregeln). Am Ball, ein Pass weg, zwei Pässe weg, Aushelfen, zurück zum Gegenspieler, beim Pass mitgehen, zurück in die Abwehr.</li></ul>
<h3>Woran sich das Spiel hält</h3>
<ul><li><b>Miniregeln 2024</b>: U10 und U12 spielen 4 gegen 4 (5 gegen 5 nur in der leistungsorientierten U12). Keine Blöcke, keine Übergaben aus der Hand, Doppeln verboten. Deshalb gibt es im Spiel keine Screens, und bei „Ball am Brett“ hilft ein zweiter Verteidiger erst aus, wenn der Center zum Korb zieht.</li>
<li><b>Lernen durch Ausprobieren</b>: Der Leitfaden empfiehlt, den Kindern keine fertige Lösung vorzugeben, sondern Fragen zu stellen. Nach einer falschen Entscheidung fragt das Spiel deshalb zuerst, z. B. „Wer hat ausgeholfen?“, und erklärt erst danach.</li>
<li><b>Prinzipien der Nachwuchs-Nationalteams</b> (DBB-Spielkonzeption): schnelle Entscheidung Wurf, Drive oder Pass, Extra-Pass, „1 can’t guard 2“, Attackieren und Platz machen (Pass und raus), Rim Run im Schnellangriff, nach Ballverlust zurück: erst den Korb sichern, dann den Ball.</li>
<li><b>FIBA Coaching Manual Mini-Basketball</b>: spielnah lernen und Fragen stellen statt vorsagen („game-based teaching“). Aus dem 3 gegen 3 und 4 gegen 4: Backdoor-Cut, Pass und geh, Flash-Cut, Ball umkehren, Platz lassen statt zum Ball laufen, Schnellangriff mit Pass nach vorne. In der Verteidigung: ein Pass weg, zwei Pässe weg, bei jedem Pass mitgehen („jump to the ball“), im Umschalten erst Korb, dann Ball.</li>
<li><b>Mann-Mann-Kriterien</b> (DBB, U14/U16): am Ball höchstens 1,5 m Abstand zwischen Gegenspieler und Korb, einen Passweg weg höchstens 1,5 m absinken, Helfen nach einem Durchbruch und sofort zurück zum eigenen Gegenspieler. Für Minis gelten die Miniregeln, die Kriterien dienen hier als Orientierung. Aushelfen ist erlaubt, Doppeln nicht.</li></ul>
<h3>So nutzt ihr es im Verein</h3>
<ul><li><b>Themen</b>: passende Spielzüge zu einem Trainingsthema, gemischt über alle Positionen.</li>
<li><b>Aufgabe</b>: ein Link mit Thema und Text, z. B. als Hausaufgabe zwischen zwei Trainings.</li>
<li><b>Team</b>: Mit einem eigenen Team-Link (<code>?team=name</code>) seht ihr, welche Kinder welche Lernziele schon gut lesen. Gezählt werden Spiele, die mit Namen in die Rangliste eingetragen wurden.</li></ul>
<h3>Quellen</h3>
<ul><li><a href="https://basketball-bund.de/wp-content/uploads/sites/2/2024/07/DBB_Jugend_Miniregeln_2024.pdf" target="_blank" rel="noopener">DBB: Spielregeln Minibasketball (2024)</a></li>
<li><a href="https://basketball-bund.de/wp-content/uploads/sites/2/2022/07/DBB_Jugend_Minileitfaden.pdf" target="_blank" rel="noopener">DBB: Leitfaden Minibasketball, Maaßmann &amp; Mayer (4. Auflage 2022)</a></li>
<li><a href="https://basketball-bund.de/wp-content/uploads/sites/2/2022/12/SPIELKONZEPTION-ZUR-ENTWICKLUNG-VON-NATIONALSPIELERN-NATIONALSPIELERIN....pdf" target="_blank" rel="noopener">DBB: Spielkonzeption zur Entwicklung von Nationalspieler:innen (2022)</a></li>
<li><a href="https://www.basketball-bund.de/wp-content/uploads/sites/2/2021/08/MMV-Kriterien.pdf" target="_blank" rel="noopener">DBB: Kriterien Mann-Mann-Verteidigung U14/U16</a></li>
<li><a href="https://assets.fiba.basketball/image/upload/documents-corporate-wabc-coaching-manual-mini-basketball-eng.pdf" target="_blank" rel="noopener">FIBA/WABC: Coaching Manual Mini-Basketball</a></li></ul>
<p><small>Inoffizielles Lernspiel, nicht vom DBB oder der FIBA herausgegeben. Inhalte sind an die genannten Unterlagen angelehnt und stark vereinfacht. Regeln können je Landesverband und Wettbewerb abweichen. Das Profil wird auf dem Gerät gespeichert. Wer es geräteübergreifend sichern möchte, kann freiwillig ein Konto mit der E-Mail-Adresse der Eltern anlegen (oben rechts unter Profil, ohne Passwort). Weitere Geräte, z. B. das Tablet der Kinder, werden danach per QR-Code verbunden. In die Rangliste kommt nur, wer einen Vornamen oder Spitznamen einträgt; mit Konto geschieht das automatisch unter dem Spitznamen, die E-Mail-Adresse erscheint nie.</small></p>
<p><small>Geräusche (Ball, Schuhe, Korb, Publikum und Tape-Stop) und gesprochene Ansagen erstellt mit <a href="https://elevenlabs.io/" target="_blank" rel="noopener">ElevenLabs</a>.</small></p>
<p class="legal"><a href="impressum.html" target="_blank" rel="noopener">Impressum</a> · <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutz</a> · <a href="lizenzen.html" target="_blank" rel="noopener">Lizenzen</a></p>`;
function cleanName(n){return String(n||'').replace(/[<>"'`\\{}]/g,'').replace(/\s+/g,' ').trim().slice(0,14);}
function jget(k){try{return JSON.parse(store.get(k)||'[]')||[]}catch(e){return[]}}
function localBoard(){return jget('pgt_board_'+TEAMID);}
function saveLocal(e){const b=localBoard();b.push(e);b.sort((a,c)=>c.score-a.score);store.set('pgt_board_'+TEAMID,JSON.stringify(b.slice(0,400)));}
async function postOnline(e){
  const I=v=>({integerValue:String(v|0)}),S=v=>({stringValue:String(v)});
  const fields={name:S(e.name),score:I(e.score),correct:I(e.correct),rounds:I(e.rounds),pos:S(e.pos),mode:I(e.mode),level:I(e.level),learn:{booleanValue:!!e.learn},ts:I(Math.floor(e.ts/1000))};
  if(e.lz)fields.lz=S(String(e.lz).slice(0,160));
  // Mit Konto (js/account.js): Eintrag gehört dem Konto (uid), damit er beim Löschen des Kontos mit verschwindet
  const tok=e.uid&&accOn()&&ACC.uid===e.uid?await accToken().catch(()=>null):null;if(tok)fields.uid=S(e.uid);
  const post=f=>fetch(`${FS()}/scores?key=${encodeURIComponent(ONLINE.apiKey)}`,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},f.uid?{Authorization:'Bearer '+tok}:{}),body:JSON.stringify({fields:f})});
  const no=r=>r.status===400||r.status===403;
  let r=await post(fields);
  if(no(r)&&fields.uid){delete fields.uid;r=await post(fields);} // ältere Firestore-Regeln ohne Konto
  if(no(r)&&fields.lz){delete fields.lz;r=await post(fields);} // ältere Firestore-Regeln ohne Lernziele
  if(!r.ok){const er=new Error('HTTP '+r.status);er.rejected=no(r);throw er;}
  if(fields.uid)accTeam(TEAMID);}
async function flushPending(){const p=jget('pgt_pending_'+TEAMID);if(!p.length)return;const rest=[];
  for(const e of p){try{await postOnline(e);}catch(err){if(!err.rejected)rest.push(e);}}store.set('pgt_pending_'+TEAMID,JSON.stringify(rest));if(rest.length)throw new Error('offline');}
async function fetchOnline(){
  const body={structuredQuery:{from:[{collectionId:'scores'}],orderBy:[{field:{fieldPath:'score'},direction:'DESCENDING'}],limit:500}};
  const r=await fetch(`${FS()}:runQuery?key=${encodeURIComponent(ONLINE.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const j=await r.json(),val=x=>!x?undefined:x.stringValue!==undefined?x.stringValue:x.integerValue!==undefined?+x.integerValue:x.booleanValue;
  return j.filter(d=>d.document).map(d=>{const f=d.document.fields||{},o={};['name','score','correct','rounds','pos','mode','level','learn','ts','lz'].forEach(k=>o[k]=val(f[k]));o.ts*=1000;return o;});}
async function loadBoard(){
  if(!onlineOn())return{list:localBoard(),online:false};
  try{await flushPending().catch(()=>{});return{list:await fetchOnline(),online:true};}catch(e){return{list:localBoard(),online:false,err:true};}}
function topList(list,f){const best={};
  list.filter(e=>e&&e.name&&e.pos===f.pos&&+e.mode===f.mode&&+e.level===f.level).forEach(e=>{const k=e.name.toLowerCase();if(!best[k]||e.score>best[k].score)best[k]=e;});
  return Object.values(best).sort((a,b)=>b.score-a.score||a.ts-b.ts).slice(0,10);}
function renderList(el,rows,me,st){el.innerHTML='';
  const s=document.createElement('div');s.className='lb-st';s.innerHTML=svgI(st[0]);s.append(st[1]);el.appendChild(s);
  if(!rows.length){const d=document.createElement('div');d.className='lb-st';d.textContent='Noch keine Einträge. Sei die oder der Erste!';el.appendChild(d);return;}
  rows.forEach((e,i)=>{const d=document.createElement('div');d.className='lb-row'+(me&&e.name.toLowerCase()===me.toLowerCase()?' me':'');
    const rk=document.createElement('div');rk.className='rk'+(i<3?' r'+(i+1):'');rk.textContent=String(i+1);
    const nm=document.createElement('div');nm.textContent=e.name;const sm=document.createElement('small');sm.textContent=`${e.correct}/${e.rounds} richtig`+(e.learn?' · Lernmodus':'');nm.appendChild(sm);
    const sc=document.createElement('div');sc.className='sc';sc.textContent=e.score;d.append(rk,nm,sc);el.appendChild(d);});}
async function showBoardIn(el,f,me,data){
  const head=`${POS[f.pos].short} · ${f.mode===5?'5:5':'4:4'} · ${LVN[f.level-1]}`;
  if(!data){el.innerHTML='<div class="lb-st">Rangliste wird geladen …</div>';data=await loadBoard();}
  const st=[data.online?'globe':'device',(data.online?`Team „${TEAMID}“`:data.err?'Offline: nur dieses Gerät':'Auf diesem Gerät')+' · '+head];
  renderList(el,topList(data.list,f),me,st);return data;}
async function saveScore(){
  if(G.saved)return;const name=cleanName($('nameIn').value);
  if(!name){$('nameIn').focus();$('nameIn').placeholder='Bitte Namen eingeben';return;}
  G.saved=true;store.set('pgt_name',name);$('saveBtn').disabled=true;$('saveBtn').textContent='…';
  const lzc={};G.results.forEach(r=>lzKeys(r).forEach(k=>{const a=lzc[k]||(lzc[k]=[0,0]);a[1]++;if(r.ok)a[0]++;}));
  const e={name,score:G.score,correct:G.results.filter(r=>r.ok).length,rounds:G.results.length,pos:G.pos,mode:G.mode,level:G.level,learn:G.noLimit,ts:Date.now(),lz:Object.entries(lzc).map(([k,a])=>`${k}:${a[0]}/${a[1]}`).join(',')};
  if(accOn())e.uid=ACC.uid;
  saveLocal(e);
  if(onlineOn()){try{await postOnline(e);}catch(err){if(!err.rejected){const p=jget('pgt_pending_'+TEAMID);p.push(e);store.set('pgt_pending_'+TEAMID,JSON.stringify(p));}}}
  $('saveBtn').innerHTML=svgI('check')+(e.uid?'Eingetragen':'Gespeichert');$('nameIn').readOnly=true;
  showBoardIn($('sBoard'),{pos:G.pos,mode:G.mode,level:G.level},name);}
$('saveBtn').onclick=saveScore;
const NHINT=$('nameHint').firstChild.textContent;
if(!onlineOn())$('nameHint').firstChild.textContent='Dein Name wird nur auf diesem Gerät gespeichert. ';
// Mit Konto: nach jedem Spiel automatisch unter dem Spitznamen eintragen (Einwilligung bei der Anmeldung)
function autoScore(){if(!onlineOn())return;const on=accOn();
  $('nameHint').firstChild.textContent=on?'Mit deinem Konto wirst du automatisch mit deinem Spitznamen eingetragen. ':NHINT;
  if(on&&store.get('pgt_name')){saveScore();return true;}return false;}
$('nameIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();saveScore();$('nameIn').blur();}});
// Ranglisten-Fenster
const bF={pos:'pg',mode:4,level:1};let bData=null;
function bChips(id,items,key){const el=$(id);el.innerHTML='';items.forEach(([v,l])=>{const b=document.createElement('button');b.className='chip'+(bF[key]===v?' sel':'');b.innerHTML=l;
  b.onclick=()=>{bF[key]=v;bRender();};el.appendChild(b);});}
function bRender(){bChips('bPos',Object.keys(POS).map(k=>[k,posBadge(k)+POS[k].short]),'pos');bChips('bMode',[[4,'4 gegen 4'],[5,'5 gegen 5']],'mode');bChips('bLvl',[[1,'<i class="dot l1"></i>Anfänger'],[2,'<i class="dot l2"></i>Mittel'],[3,'<i class="dot l3"></i>Profi']],'level');
  showBoardIn($('bList'),bF,store.get('pgt_name'),bData).then(d=>bData=d);}
$('boardBtn').onclick=()=>{Object.assign(bF,{pos:G.pos,mode:G.mode,level:G.level});bData=null;$('board').classList.remove('hidden');bRender();};
$('boardClose').onclick=$('boardX').onclick=()=>$('board').classList.add('hidden');

// ================= Trainer: Themen, Aufgabe, Team =================
const THEMES=[
 {id:'hilfe',n:'Wer hilft, lässt jemanden frei',d:'Hilfe erkennen, freien Mitspieler finden',i:'pass',plays:['top','wing','dkick','wcatch','wdrive','cpost','creb']},
 {id:'ohneball',n:'Ohne Ball',d:'Backdoor, Flash-Cut, Pass und geh, Platz machen',i:'cut',plays:['backdoor','give','wcut','cdive','cflash','wspace']},
 {id:'ballbewegen',n:'Ball bewegen',d:'Den Ball dorthin spielen, wo die Abwehr nicht ist',i:'pass',plays:['swing','xpass','cflash','give']},
 {id:'schnell',n:'Schnellangriff',d:'Überzahl nutzen, langer Pass, Rim Run',i:'bolt',plays:['break','plong','wbreak','two','clong','rimrun','crun','p2on1']},
 {id:'umschalten',n:'Umschalten',d:'Nach Ballgewinn nach vorne, nach Ballverlust zurück',i:'bolt',plays:['plong','clong','break','rimrun','dback','dtwo']},
 {id:'wurf',n:'Guter Wurf',d:'Wann werfen, wann ziehen, wann passen?',i:'ball',plays:['top','wcatch','xpass','chigh','creb','wcorner','pback']},
 {id:'backdoor',n:'Backdoor',d:'Steht der Verteidiger im Passweg: hinten rum!',i:'cut',plays:['backdoor','wcut','chigh','dcut']},
 {id:'abwehr',n:'Mann-Mann-Verteidigung',d:'Am Ball, ein Pass weg, helfen, mitgehen, zurück',i:'shield',plays:['dball','dpass','dhelp','drot','dclose','djump','dback','dcut','dtwo']}];
const TASK=(()=>{const q=new URLSearchParams(location.search),t=THEMES.find(x=>x.id===q.get('aufgabe'));if(!t)return null;
  const r=+q.get('r'),l=+q.get('l');return{theme:t.id,txt:cleanName2(q.get('txt')||'')||t.n,r:r===5?5:10,l:[1,2,3].includes(l)?l:0};})();
function cleanName2(n){return String(n||'').replace(/[<>"'`\\{}]/g,'').replace(/\s+/g,' ').trim().slice(0,60);}
function startTheme(id,o){const t=THEMES.find(x=>x.id===id);if(!t)return;o=o||{};G.theme=id;G.plays=t.plays.slice();
  const ps=new Set(t.plays.map(k=>PLAYS[k].pos));G.pos=ps.size===1?[...ps][0]:'mix';G.rounds=o.r||10;if(o.l){G.level=o.l;markSel('lvl','l',o.l);}
  $('coach').classList.add('hidden');newGame();showBanner(t.n,'Trainingsthema');}
function coachTab(t){document.querySelectorAll('#coachTabs .lvb').forEach(x=>x.classList.toggle('sel',x.dataset.t===t));document.querySelectorAll('.cpane').forEach(p=>p.classList.toggle('on',p.dataset.t===t));
  if(t==='tm')renderTeam();if(t==='hw')hwLink();}
function renderThemes(){const el=$('thList');el.innerHTML='';THEMES.forEach(t=>{const b=document.createElement('button');b.className='thm';
  b.innerHTML=`<span class="ic">${svgI(t.i)}</span><div><b></b><small></small></div><span class="go">Spielen</span>`;b.querySelector('b').textContent=t.n;
  b.querySelector('small').textContent=t.d+' · '+t.plays.map(k=>PLAYS[k].name).join(', ');b.onclick=()=>startTheme(t.id);el.appendChild(b);});
  $('hwTheme').innerHTML=THEMES.map(t=>`<option value="${t.id}">${t.n}</option>`).join('');}
const HWS={l:1,r:10,g:''};
function hwLink(){const t=$('hwTheme').value,txt=cleanName2($('hwTxt').value);const q=new URLSearchParams();if(TEAMID!=='team')q.set('team',TEAMID);q.set('aufgabe',t);if(txt)q.set('txt',txt);q.set('l',HWS.l);q.set('r',HWS.r);if(HWS.g)q.set('g',HWS.g);
  const base=/^https?:/.test(location.protocol)?location.origin+location.pathname:'index.html';$('hwLink').value=base+'?'+q.toString();
  $('hwNote').textContent=TEAMID==='team'?'Tipp: Öffnet das Spiel vorher mit eurem Team-Link (…?team=name), dann landen die Ergebnisse in eurer Team-Rangliste.':`Ergebnisse landen in der Rangliste von Team „${TEAMID}“.`;}
function selRow(id,attr,cb){document.querySelectorAll(`#${id} .lvb`).forEach(b=>b.onclick=()=>{document.querySelectorAll(`#${id} .lvb`).forEach(x=>x.classList.toggle('sel',x===b));cb(+b.dataset[attr]);hwLink();});}
selRow('hwLvl','l',v=>HWS.l=v);selRow('hwRounds','r',v=>HWS.r=v);
document.querySelectorAll('#hwG .lvb').forEach(b=>b.onclick=()=>{HWS.g=b.dataset.g;markSel('hwG','g',HWS.g);hwLink();});
$('hwTheme').onchange=hwLink;$('hwTxt').addEventListener('input',hwLink);$('hwTxt').addEventListener('keydown',e=>e.stopPropagation());
$('hwCopy').onclick=async()=>{const i=$('hwLink');let ok=false;try{await navigator.clipboard.writeText(i.value);ok=true;}catch(e){try{i.select();ok=document.execCommand('copy');}catch(e2){}}
  $('hwCopy').innerHTML=svgI(ok?'check':'link')+(ok?'Kopiert':'Bitte markieren');};
$('hwShare').onclick=async()=>{const u=$('hwLink').value;try{if(navigator.share){await navigator.share({title:'Basketball IQ Trainer',text:cleanName2($('hwTxt').value)||'Aufgabe für dich',url:u});return;}}catch(e){}$('hwCopy').click();};
let tmData=null,tmSel='all';
async function renderTeam(){$('tmHead').textContent='Lade Ergebnisse …';if(!tmData)tmData=await loadBoard();const d=tmData;
  $('tmHead').textContent=(d.online?`Team „${TEAMID}“ (online)`:'Nur dieses Gerät')+' · Gezählt werden Spiele, die mit Namen eingetragen wurden.';
  const ch=$('tmLz');ch.innerHTML='';[['all','Alle'],...Object.keys(LZ).map(k=>[k,LZ[k].s])].forEach(([k,l])=>{const b=document.createElement('button');b.className='chip'+(tmSel===k?' sel':'');b.textContent=l;b.onclick=()=>{tmSel=k;renderTeam();};ch.appendChild(b);});
  const by={};d.list.forEach(e=>{if(!e||!e.name)return;const k=e.name.toLowerCase(),o=by[k]||(by[k]={name:e.name,games:0,ok:0,n:0,lz:{}});o.games++;o.ok+=+e.correct||0;o.n+=+e.rounds||0;
    String(e.lz||'').split(',').forEach(t=>{const m=/^(\w+):(\d+)\/(\d+)$/.exec(t);if(m&&LZ[m[1]]){const a=o.lz[m[1]]||(o.lz[m[1]]=[0,0]);a[0]+=+m[2];a[1]+=+m[3];}});});
  const rows=Object.values(by).map(o=>{const a=tmSel==='all'?[o.ok,o.n]:(o.lz[tmSel]||[0,0]);return{o,a,q:a[1]?a[0]/a[1]:-1};}).sort((x,y)=>y.q-x.q||y.a[1]-x.a[1]);
  const el=$('tmList');el.innerHTML='';if(!rows.length){el.innerHTML='<div class="lb-st">Noch keine Einträge.</div>';return;}
  rows.forEach(({o,a,q})=>{const d=document.createElement('div');d.className='kid'+(a[1]?'':' none');const pc=Math.round(Math.max(0,q)*100),col=q>=.8?'#2ecc71':q>=.5?'#ffc83d':'#ff8a80';
    d.innerHTML=`<span></span><small>${a[1]?pc+' % · '+a[0]+'/'+a[1]:'noch nicht geübt'}</small><i><em style="width:${pc}%;background:${col}"></em></i>`;d.querySelector('span').textContent=o.name+' ('+o.games+' Spiele)';el.appendChild(d);});}
$('coachBtn').onclick=()=>{tmData=null;renderThemes();$('infoPane').innerHTML=INFO_HTML;hwLink();$('coach').classList.remove('hidden');coachTab('th');};
$('coachClose').onclick=$('coachX').onclick=()=>$('coach').classList.add('hidden');
document.querySelectorAll('#coachTabs .lvb').forEach(b=>b.onclick=()=>coachTab(b.dataset.t));
if(TASK){$('taskTxt').textContent=TASK.txt;$('taskBar').classList.remove('hidden');$('taskBar').onclick=()=>startTheme(TASK.theme,{r:TASK.r,l:TASK.l});}

// ================= Spielerkarte =================
const CARD={r:null,on:false};
function cardInit(){if(CARD.r)return true;if(CARD.fail)return false;
  try{const c=document.createElement('canvas'),r=new T3.WebGLRenderer({canvas:c,antialias:true,alpha:true});
    r.setPixelRatio(Math.min(2,devicePixelRatio||1));r.outputEncoding=T3.sRGBEncoding;r.toneMapping=T3.ACESFilmicToneMapping;r.toneMappingExposure=1.15;
    const sc=new T3.Scene();sc.add(new T3.HemisphereLight(0xe6eeff,0x4a3520,.95));
    const k=new T3.DirectionalLight(0xfff2dd,1.5);k.position.set(1.6,3,3.2);sc.add(k);const rl=new T3.DirectionalLight(0x9cc0ff,1.3);rl.position.set(-2.2,2.2,-2.6);sc.add(rl);
    const cm=new T3.PerspectiveCamera(24,1,.1,30),b=new T3.Mesh(ballMesh.geometry,ballMesh.material);
    Object.assign(CARD,{r,scene:sc,cam:cm,ball:b});return true;}catch(e){CARD.fail=true;return false;}}
function cardRig(){if(!cardInit())return;if(CARD.rig)CARD.scene.remove(CARD.rig.root);const rg=(GLB.ok?makeGLBRig:makeRig)('home',PROFILE.num,myLook());CARD.rig=rg;CARD.scene.add(rg.root);
  CARD.ball.position.set(0,1.19,.34);rg.root.add(CARD.ball);if(rg.glb){rg.A.idle.setEffectiveWeight(1);return;}
  rg.torso.rotation.x=.03;rg.hips.position.y=.94;
  for(let i=0;i<2;i++){const sg=i?1:-1;rg.sh[i].rotation.x=-.2;rg.sh[i].rotation.z=-sg*.3;rg.el[i].rotation.x=-1.35;rg.hip[i].rotation.z=sg*.07;rg.hip[i].rotation.x=-.05;rg.kn[i].rotation.x=.1;}
  CARD.ball.position.set(0,1.19,.34);rg.root.add(CARD.ball);}
function cardMount(host){CARD.host=host;if(!cardInit()){host.innerHTML='';return;}host.appendChild(CARD.r.domElement);cardSize();}
function cardSize(){const h=CARD.host;if(!h||!CARD.r)return;const w=Math.max(60,h.clientWidth),hh=Math.max(80,h.clientHeight);CARD.r.setSize(w,hh,false);
  const c=CARD.cam,t=Math.tan(c.fov*Math.PI/360);c.aspect=w/hh;const d=Math.max(1.12/t,.62/(t*c.aspect));c.position.set(0,1.02,d);c.lookAt(0,1.0,0);c.updateProjectionMatrix();}
function cardFrame(){if(!CARD.on||!CARD.r||!CARD.rig)return;const rg=CARD.rig,ry=Math.sin(clock*.8)*.6;rg.root.rotation.y=ry;
  if(rg.glb){rg.A.idle.time=clock%rg.A.idle.getClip().duration;rg.mx.update(0);rg.root.updateMatrixWorld(true);const b=CARD.ball.getWorldPosition(new T3.Vector3());
    for(const ar of rg.arms){const lat=new T3.Vector3(Math.cos(ry),0,-Math.sin(ry)).multiplyScalar(ar.s);ik2(ar,b.clone().addScaledVector(lat,.16),b.clone().addScaledVector(lat,.7).add(new T3.Vector3(0,-.6,0)),1);}}
  else rg.torso.rotation.x=.03+Math.sin(clock*2.2)*.015;
  CARD.r.render(CARD.scene,CARD.cam);}
function renderCard(){const P=PROFILE,R=ratings(),L=lvlOf(P.xp),tier=TIERS[L.i];
  $('tcard').className='tcard '+tier;$('tcOvr').textContent=R.ovr;$('tcPos').textContent=POS[G.pos].short.toUpperCase();$('tcTier').textContent=TIERN[tier];
  $('tcNum').textContent=P.num;$('tcName').textContent=(store.get('pgt_name')||'Dein Name').toUpperCase();
  $('tcStats').innerHTML=R.it.map(([k,v])=>`<div><b>${v}</b><span>${k}</span></div>`).join('');
  $('tcLv').textContent=L.name;$('tcXp').style.width=(L.f*100)+'%';$('tcXpT').textContent=L.b?`${P.xp} / ${L.b} XP`:`${P.xp} XP`;
  const got=BADGES.filter(b=>P.badges[b.id]).sort((a,b)=>P.badges[b.id]-P.badges[a.id]);$('tcBadges').innerHTML=got.slice(0,4).map(b=>medal(b,true)).join('');

  $('lzList').innerHTML=lzRows(P.lz);
  $('bGrid').innerHTML=BADGES.map((b,i)=>{const on=!!P.badges[b.id];return`<button class="bcell${on?' on':''}" data-i="${i}">${medal(b,on)}<span>${b.n}</span>${on?'':bpBar(bProg(b))}</button>`;}).join('');
  $('bGrid').querySelectorAll('.bcell').forEach(c=>c.onclick=()=>{const b=BADGES[+c.dataset.i],on=!!P.badges[b.id];$('bGrid').querySelectorAll('.bcell').forEach(x=>x.classList.toggle('sel',x===c));
    const pr=on?null:bProg(b);$('bDesc').innerHTML=medal(b,on)+`<div><b>${b.n}</b><br>${b.d}${on?' <span style="color:#7ff0ad">Geschafft!</span>':pr?` <span style="color:#8fa0c6">${pr.c} von ${pr.g}</span>${bpBar(pr)}`:' <span style="color:#8fa0c6">(noch offen)</span>'}</div>`;});
  $('bDesc').innerHTML=`<div><b>${got.length} von ${BADGES.length}</b> gesammelt. Tippe auf ein Abzeichen, um zu sehen, wie du es bekommst.</div>`;
  $('cardNum').textContent=P.num;$('numV').textContent=P.num;$('pName').value=store.get('pgt_name')||'';
  const sw=(id,cols,key)=>{const el=$(id);el.innerHTML='';cols.forEach((c,i)=>{const b=document.createElement('button');b.style.background='#'+c.toString(16).padStart(6,'0');b.className=P[key]===i?'sel':'';b.setAttribute('aria-label',key+' '+(i+1));
    b.onclick=()=>{P[key]=i;saveProf();renderCard();cardRig();};el.appendChild(b);});};
  sw('swSkin',SKINC,'skin');sw('swHair',HAIRC,'hairC');markSel('pG','v',PROFILE.g||'m');
  const hs=$('hairSel');hs.innerHTML='';HAIRS.forEach((n,i)=>{const b=document.createElement('button');b.className='chip'+(P.hair===i?' sel':'');b.textContent=n;b.onclick=()=>{P.hair=i;saveProf();renderCard();cardRig();};hs.appendChild(b);});}
function pcTab(t){document.querySelectorAll('#pcTabs .lvb').forEach(x=>x.classList.toggle('sel',x.dataset.t===t));document.querySelectorAll('.pcp').forEach(p=>p.classList.toggle('on',p.dataset.t===t));
  if(t==='card')cardMount($('tcAv'));else if(t==='edit')cardMount($('pvHost'));}
function openCard(t){renderCard();cardRig();$('pcard').classList.remove('hidden');CARD.on=true;pcTab(t||'card');requestAnimationFrame(cardSize);}
function closeCard(){$('pcard').classList.add('hidden');CARD.on=false;renderStrip();}
// Menü: Spielerkarten-Leiste mit Level, XP und Abzeichen
function renderStrip(){regSync();const P=PROFILE,L=lvlOf(P.xp),nm=store.get('pgt_name'),got=BADGES.filter(b=>P.badges[b.id]).length;
  $('cardBtn').className='pstrip '+TIERS[L.i];$('cardNum').textContent=P.num;
  const n=$('psName');n.textContent=nm||'Dein Name';n.classList.toggle('empty',!nm);
  $('psLv').textContent=L.b?`${L.name} · noch ${L.b-P.xp} XP bis ${LEVELS[L.i+1][1]}`:`${L.name} · ${P.xp} XP`;
  requestAnimationFrame(()=>$('psBar').style.width=(L.f*100)+'%');
  const top=BADGES.filter(b=>P.badges[b.id]).sort((a,b)=>P.badges[b.id]-P.badges[a.id])[0];
  $('psBd').innerHTML=(top?medal(top,true):medal(BADGES[0],false))+`<span>${got}/${BADGES.length}</span>`;}
$('cardBtn').onclick=()=>openCard();$('pcClose').onclick=$('pcX').onclick=closeCard;
document.querySelectorAll('#pcTabs .lvb').forEach(b=>b.onclick=()=>pcTab(b.dataset.t));
$('numM').onclick=()=>{PROFILE.num=(PROFILE.num+99)%100;saveProf();renderCard();cardRig();};
document.querySelectorAll('#pG .lvb').forEach(b=>b.onclick=()=>{PROFILE.g=b.dataset.v;saveProf();setGirl(PROFILE.g==='w');renderCard();cardRig();if(G.phase==='menu')demo();});
$('numP').onclick=()=>{PROFILE.num=(PROFILE.num+1)%100;saveProf();renderCard();cardRig();};
$('pName').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')$('pName').blur();});
$('pName').addEventListener('change',()=>{const n=cleanName($('pName').value);if(n){store.set('pgt_name',n);saveProf();}renderCard();});
$('cardNum').textContent=PROFILE.num;
function showUnlock(res){const nb=res.neu;
  $('ulT').textContent=nb.length>1?'Neue Abzeichen!':nb.length?'Neues Abzeichen!':'Level-Aufstieg!';
  $('ulList').innerHTML=nb.map((b,i)=>`<div class="ul-it" style="animation-delay:${.15+i*.15}s">${medal(b,true,true)}<b>${b.n}</b><small>${b.d}</small></div>`).join('')+
    (!nb.length&&res.up?`<div class="ul-it">${svgI('star','fill')}</div>`:'');
  $('ulXp').innerHTML=`<b>+${res.xp} XP</b>`+(res.up?` · Neues Level: <b>${res.up}</b>`:'');
  $('unlock').classList.remove('hidden');sfx.good();confetti(50);}
$('ulOk').onclick=()=>$('unlock').classList.add('hidden');
$('ulCard').onclick=()=>{$('unlock').classList.add('hidden');openCard('badges');};

// ================= UI =================
const tagsEl=$('tags');let bubbles=[];
let spotMs=[];
function showSpots(on){if(on&&!spotMs.length)for(let i=0;i<3;i++){const m=new T3.Mesh(new T3.RingGeometry(.28,.46,40),new T3.MeshBasicMaterial({color:0xb7a2ff,transparent:true,opacity:.95,depthWrite:false}));m.rotation.x=-Math.PI/2;m.renderOrder=3;scene.add(m);spotMs.push(m);}
  spotMs.forEach((m,i)=>{const sp=on&&G.sc&&G.sc.spots&&G.sc.spots[i];m.visible=!!sp;if(sp)m.position.copy(V(sp.x,.035,sp.z));});}
function clearBubbles(){tagsEl.innerHTML='';bubbles=[];showSpots(false);}
function passers(){return players.filter(p=>p.sel).sort((a,b)=>a.key-b.key);}
function makeBubbles(){clearBubbles();
  if(G.sc.spots){showSpots(true);G.sc.spots.forEach((sp,i)=>{const b=document.createElement('button');b.className='tag spot'+(G.replay?' off':'');b.dataset.c='spot:'+sp.id;b.setAttribute('aria-label','Position '+sp.id);
    b.innerHTML=`<span class="in"><span class="no">${sp.id}</span><span class="tx"><span class="cap">Position</span><span class="nm">Hierhin</span></span></span>`;
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(G.phase==='decide'&&!G.replay)resolve(b.dataset.c);});tagsEl.appendChild(b);bubbles.push({el:b,p:{x:sp.x,z:sp.z,y:.55,key:i+1},w:0});});
    const Mp=role('M');if(Mp){const w=document.createElement('div');w.className='tag who';w.innerHTML='<span class="in"><span class="tx"><span class="cap">'+(GIRL?'Deine':'Dein')+'</span><span class="nm">Gegenspieler</span></span></span>';tagsEl.appendChild(w);bubbles.push({el:w,p:Mp,w:0});}
    posBubbles(true);return;}
  passers().forEach(p=>{const b=document.createElement('button');b.className='tag'+(G.replay?' off':'');b.dataset.r=p.role;b.dataset.c='pass:'+p.role;b.setAttribute('aria-label','Pass zu '+(p.name||'Mitspieler'));
    b.innerHTML=`<span class="in"><span class="no">${p.key}</span><span class="tx"><span class="cap">Pass</span><span class="nm"></span></span></span>`;const nm=p.name||'Mitspieler';b.querySelector('.nm').textContent=nm;if(nm.length>10&&nm.includes(' '))b.classList.add('two');
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(G.phase==='decide'&&!G.replay)resolve(b.dataset.c);});tagsEl.appendChild(b);bubbles.push({el:b,p,w:0});});posBubbles(true);}
const pv=new T3.Vector3();
// Pass-Schilder über den Mitspielern: Spitze zeigt auf den Kopf, Schilder weichen sich gegenseitig aus
function layBubbles(mini){const th=30,gap=5,bt=H-($('bottom').offsetHeight||150)-4,placed=ME.on?[{x:ME.x,y:ME.y,w:ME.w}]:[];let bad=0;
  bubbles.map(b=>{const{p}=b;pv.set(p.x,p.y!==undefined?p.y:2.15,-p.z).project(cam);return{b,ax:(pv.x+1)/2*W,ay:(1-pv.y)/2*H,w:mini?30:b.w};})
  .sort((a,c)=>c.ay-a.ay).forEach(o=>{const w=o.w;let x=clamp(o.ax-w/2,6,W-6-w),y=clamp(o.ay-th-9,62,bt-th),hit;
    for(let k=0;k<6;k++){hit=placed.find(q=>x<q.x+q.w+gap&&q.x<x+w+gap&&y<q.y+th+gap&&q.y<y+th+gap);if(!hit)break;
      const up=hit.y-th-gap;if(up>=62)y=up;else x=o.ax<hit.x+hit.w/2?Math.max(6,hit.x-w-gap):Math.min(W-6-w,hit.x+hit.w+gap);}
    if(hit||Math.abs(x+w/2-o.ax)>w/2+20)bad++;o.x=x;o.y=y;placed.push(o);});
  return{placed:placed.filter(o=>o.b),bad};}
// Schild „DU“ über dem eigenen Spieler (Bildschirmgröße fest, damit es auch auf dem Handy gut lesbar ist).
// Die Pass-Schilder weichen ihm aus (layBubbles).
const meEl=$('meTag'),ME={on:false,x:0,y:0,w:0,lx:-1,ly:-1};
function posMe(){const ph=G.phase;let on=!!Hd&&!camMode&&(ph==='approach'||ph==='decide'||ph==='outcome')&&Hd.rig.root.visible;
  if(on){pv.set(Hd.x,1.8+(Hd.jy||0),-Hd.z).project(cam);if(pv.z>1)on=false;}
  if(on!==ME.on){ME.on=on;meEl.classList.toggle('hidden',!on);if(on){ME.w=meEl.offsetWidth||40;ME.lx=-1;}}
  meEl.classList.toggle('dec',ph==='decide');if(!on)return;
  const x=Math.round(clamp((pv.x+1)/2*W-ME.w/2,6,W-6-ME.w)),y=Math.round(clamp((1-pv.y)/2*H-37,62,H-40));ME.x=x;ME.y=y;
  if(x!==ME.lx||y!==ME.ly){ME.lx=x;ME.ly=y;meEl.style.transform=`translate(${x}px,${y}px)`;}}
// Pass-Schilder über den Mitspielern: Spitze zeigt auf den Kopf, Schilder weichen sich aus.
// Wird es zu eng (z. B. Handy quer), zeigen alle Schilder nur die Nummer.
function posBubbles(re){if(re||G.tagMini===undefined){bubbles.forEach(b=>{b.el.classList.remove('mini');b.w=b.el.offsetWidth||110;b.lx=undefined;});G.tagMini=layBubbles(false).bad>0;bubbles.forEach(b=>b.el.classList.toggle('mini',G.tagMini));}
  layBubbles(G.tagMini).placed.forEach(({b,x,y,w,ax})=>{if(b.lx!==undefined&&Math.abs(b.lx-x)<2&&Math.abs(b.ly-y)<2)return;b.lx=x=Math.round(x);b.ly=y=Math.round(y);
    b.el.style.transform=`translate(${x}px,${y}px)`;b.el.style.setProperty('--ax',Math.round(clamp(ax-x,12,w-12))+'px');});}
function pressBtn(e){e.preventDefault();const b=e.currentTarget;if(!b.disabled&&G.phase==='decide'&&!G.replay)resolve(b.dataset.c);}
const svgI=(n,c)=>`<svg class="i${c?' '+c:''}"><use href="#i-${n}"/></svg>`;
const ICO={
'▲':'<path d="M12 20V5M6 11l6-6 6 6"/>',
'🏀':'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5v17M6 5.8c2.6 2.4 2.6 10 0 12.4M18 5.8c-2.6 2.4-2.6 10 0 12.4"/>',
'↩':'<path d="M18 19V10a5 5 0 0 0-10 0v4"/><path d="M4.5 11 8 14.5 11.5 11"/>',
'✋':'<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4 15.2a1.5 1.5 0 0 1 2.3-1.9L8 15"/>',
'↻':'<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 4v4h-4"/>',
'⤓':'<path d="M12 4v12M7 11l5 5 5-5M6 20h12"/>',
'→':'<path d="M4 12h14M13 6l6 6-6 6"/>',
'↗':'<path d="M6 18 18 6M9 6h9v9"/>',
'↘':'<path d="M6 6 18 18M18 9v9H9"/>'};
const icoSvg=c=>`<svg viewBox="0 0 24 24">${ICO[c]||ICO['▲']}</svg>`;
function buildButtons(){const sc=G.sc,np=passers().length;
  $('prompt').querySelector('.a').textContent='Was machst du?';
  const lb=sc.labels;document.querySelectorAll('#actRow .cb').forEach(b=>{const l=lb[b.dataset.c];b.classList.toggle('hidden',!l);if(l){b.querySelector('.ar').innerHTML=icoSvg(l[0]);b.querySelector('.lb').textContent=l[1];}});
  $('promptB').textContent=sc.prompt||(np?'Passen? Tippe auf das lila Schild über dem Mitspieler.':'Entscheide dich!');}
function setControls(on){const cont=$('controls');cont.classList.toggle('live',on&&!G.replay);cont.querySelectorAll('.cb').forEach(b=>{b.disabled=!on||G.replay;b.classList.remove('hint');});}
function updateHud(){$('hRound').innerHTML=`${posBadge(G.pos)}${G.mode===5?'5:5':'4:4'} · ${Math.min(G.round,G.rounds)}/${G.rounds}`;$('hScore').textContent=G.score;$('hStreak').innerHTML=svgI('flame','fill')+' '+G.streak;drawBoard();}
let bannerT=null;
function showBanner(t,s){$('bnT').textContent=t;$('bnS').textContent=s||'';$('bnS').classList.toggle('hidden',!s);const b=$('banner');b.classList.add('show');clearTimeout(bannerT);bannerT=setTimeout(()=>b.classList.remove('show'),1500);}
function flash(t,col){const f=$('flash');f.textContent=t;f.style.color=col;f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}
function bestKey(){return'pgt4_best_'+G.pos+'_'+G.mode+'_'+G.level+'_'+G.plays.slice().sort().join('')+(G.noLimit?'_l':'');}
function refreshBest(){const v=+(store.get(bestKey())||0);$('bestTxt').textContent=v?`Dein Rekord mit diesen Einstellungen: ${v} Punkte`:'';}
function selGroup(id,attr,cb){document.querySelectorAll(`#${id} .lvb`).forEach(b=>b.onclick=()=>{document.querySelectorAll(`#${id} .lvb`).forEach(x=>x.classList.remove('sel'));b.classList.add('sel');cb(b.dataset[attr]);refreshBest();});}
function markSel(id,attr,v){document.querySelectorAll(`#${id} .lvb`).forEach(x=>x.classList.toggle('sel',x.dataset[attr]===String(v)));}
function renderPlayChips(){const el=$('plays');el.innerHTML='';G.plays=playsOf(G.pos);
  G.plays.forEach(k=>{const b=document.createElement('button');b.className='chip sel';b.dataset.p=k;b.innerHTML='<span class="ck"></span>';b.append(SHORT[k]||PLAYS[k].name);b.title=PLAYS[k].name;
    b.onclick=()=>{const on=b.classList.contains('sel');if(on&&el.querySelectorAll('.chip.sel').length===1)return;b.classList.toggle('sel');G.plays=[...el.querySelectorAll('.chip.sel')].map(x=>x.dataset.p);refreshBest();playsSum();};el.appendChild(b);});playsSum();}
function playsSum(){const all=playsOf(G.pos).length,n=G.plays.length;$('playsSum').textContent=n>=all?`· alle ${all}`:`· ${n} von ${all}`;}
$('playsTog').onclick=()=>{const t=$('playsTog'),open=t.getAttribute('aria-expanded')!=='true';t.setAttribute('aria-expanded',open);$('plays').classList.toggle('hidden',!open);};
document.querySelectorAll('.pico').forEach(e=>e.innerHTML=posIcon(e.dataset.pos));
selGroup('lvl','l',v=>G.level=+v);
function showAge(age){
  basketMount.position.y=(age==='U14'?3.05:2.60)-rimG.position.y;
  // Pfosten steht fest (Fuß bei 0,9 m) und endet knapp über dem Arm, der mit dem Korb hoch- und runterfährt
  const top=3.65+basketMount.position.y,h=top-.9;basketPost.scale.y=h/3.4;basketPost.position.y=.9+h/2;
  // Altersklasse bestimmt die Spielform: U10 4 gegen 4, ab U12 5 gegen 5
  G.mode=age==='U10'?4:5;store.set('pgt_mode',String(G.mode));
  for(const id of ['age','wAge']){
    markSel(id,'age',age);
    for(const button of $(id).querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.age===age));
  }
}
for(const id of ['age','wAge'])selGroup(id,'age',age=>{
  PROFILE.age=age;saveProf();showAge(age);if(G.phase==='menu'){computeFit();demo();}
});
selGroup('pos','v',v=>{G.pos=v;store.set('pgt_pos',v);renderPlayChips();demo();});
{showAge(PROFILE.age);
 const p=store.get('pgt_pos');if(p&&POS[p])G.pos=p;markSel('pos','v',G.pos);renderPlayChips();}
$('noLimit').onchange=e=>{G.noLimit=e.target.checked;refreshBest();};
$('tipsBtn').onclick=()=>$('tips').classList.remove('hidden');$('tipsInfo').onclick=()=>{$('tips').classList.add('hidden');$('coachBtn').click();coachTab('in');};$('tipsClose').onclick=$('tipsX').onclick=()=>$('tips').classList.add('hidden');
document.querySelectorAll('#tipTabs .lvb').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tipTabs .lvb').forEach(x=>x.classList.toggle('sel',x===b));document.querySelectorAll('.tpane').forEach(p=>p.classList.toggle('on',p.dataset.t===b.dataset.t));});
function confetti(n){const fx=$('fx'),cols=['#ffc83d','#2ecc71','#4a86ff','#ff8a3d','#ff5a8a','#fff'];
  for(let i=0;i<n;i++){const d=document.createElement('i');d.className='cf';const a=Math.random()*Math.PI*2,v=120+Math.random()*260;
    d.style.cssText=`left:${50+(Math.random()-.5)*20}%;top:30%;background:${cols[i%cols.length]};--dx:${Math.cos(a)*v}px;--dy:${Math.sin(a)*v*.7+260}px;--r:${(Math.random()-.5)*900}deg;animation-delay:${Math.random()*.12}s`;
    fx.appendChild(d);setTimeout(()=>d.remove(),1600);}}
function vib(p){try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}}
function ptsPop(t){const e=$('ptsPop');e.textContent=t;e.classList.remove('go');void e.offsetWidth;e.classList.add('go');}
function newGame(){ac();G.round=0;G.score=0;G.streak=0;G.bestStreak=0;G.results=[];G.win=WIN[G.level-1];G.bag=makeBag();
  $('menu').classList.add('hidden');$('summary').classList.add('hidden');$('hud').classList.remove('hidden');$('bottom').classList.remove('hidden');setControls(false);startRound();}
$('kickSwitch').onclick=()=>{
  if(!kickComparison||G.phase!=='decide'||G.replay)return;
  const {seed,play,variant}=G.sc;
  kickComparison.version=kickComparison.version==='before'?'after':'before';
  G.sc=buildScenario(seed,play,variant);
  beginApproach();
};
function startKickComparison(version){
  const saved={};
  for(const key of ['level','mode','rounds','pos','noLimit'])saved[key]=G[key];
  kickComparison={version,saved};
  $('hud').classList.add('comparing');
  Object.assign(G,{level:1,mode:4,rounds:2,pos:'pg',noLimit:true});
  $('kickCompare').close();newGame();
}
$('kickBefore').onclick=()=>startKickComparison('before');
$('kickAfter').onclick=()=>startKickComparison('after');
$('startBtn').onclick=newGame;$('againBtn').onclick=()=>{if(G.nextLv){G.level=G.nextLv;G.nextLv=0;markSel('lvl','l',G.level);refreshBest();}newGame();};$('menuBtn').onclick=toMenu;$('quitBtn').onclick=toMenu;$('fbMenu').onclick=toMenu;$('lgBtn').onclick=()=>{$('lgd').classList.remove('hidden');$('lgBtn').classList.add('hidden');};
function toMenu(){hush();
  if(kickComparison){
    Object.assign(G,kickComparison.saved);kickComparison=null;
    $('hud').classList.remove('comparing');$('kickCompare').showModal();
  }
  if(G.theme){G.theme=null;G.rounds=10;const sp=store.get('pgt_pos');G.pos=sp&&POS[sp]&&sp!=='mix'?sp:'pg';markSel('pos','v',G.pos);renderPlayChips();}
  if(G.first){G.first=false;G.rounds=10;}
  tape(false);G.phase='menu';G.timers=[];renderStrip();endCam();G.ts=1;G.slowT=0;['summary','feedback','hud','bottom'].forEach(i=>$(i).classList.add('hidden'));$('menu').classList.remove('hidden');clearBubbles();$('vig').classList.remove('on');refreshBest();demo();drawBoard();}
$('nextBtn').onclick=()=>{if(G.quiz)return quizNudge();$('feedback').classList.add('hidden');if(G.round<G.rounds)startRound();else if(kickComparison)toMenu();else showSummary();};
$('replayBtn').onclick=()=>{if(G.quiz)return quizNudge();$('feedback').classList.add('hidden');const sc=G.sc;G.sc=buildScenario(sc.seed,sc.play,sc.variant);G.replay=true;beginApproach();showBanner('Wiederholung','Achte auf die Verteidiger');};
const mb=$('muteBtn'),mbI=()=>mb.innerHTML=svgI(muted?'mute':'sound');mbI();mb.onclick=()=>{muted=!muted;store.set('pgt_mute',muted?'1':'0');mbI();ac();};
// Sprache an/aus: in der Kopfzeile und im Fragekasten der Auswertung (auf dem Handy verdeckt die Auswertung die Kopfzeile)
const vbs=[$('voiceBtn'),$('fbVoice')],vbI=()=>vbs.forEach(b=>{b.innerHTML=svgI(voiceOn?'voice':'voiceoff');b.classList.toggle('off',!voiceOn);});vbI();
vbs.forEach(b=>b.onclick=()=>{voiceOn=!voiceOn;store.set('pgt_voice',voiceOn?'1':'0');vbI();hush();ac();
  if(voiceOn&&G.phase==='feedback'&&G.quiz)say([G.quiz.t,'Tippe auf der Karte auf den richtigen Punkt.'],.1);});
document.querySelectorAll('#actRow .cb').forEach(b=>b.addEventListener('pointerdown',pressBtn));
addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='INPUT')return;
  if(G.phase==='feedback'&&e.key==='Enter'&&e.repeat){e.preventDefault();return;}
  if(G.phase==='feedback'&&G.quiz){
    const q=G.quiz;
    if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){
      e.preventDefault();
      const far=miniFar(),visible=G.snap.filter(p=>far||p.z>=-10.8).sort((a,b)=>a.x-b.x||a.z-b.z);
      const step=e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1;
      const i=visible.findIndex(p=>p.role===q.cursor);
      const next=i<0?(step>0?0:visible.length-1):(i+step+visible.length)%visible.length;
      const selected=visible[next];
      q.cursor=selected.role;
      const team=selected.team===Hd.team?'Dein Team':'Gegnerisches Team';
      $('fbQs').textContent=team+' · Nr. '+selected.num+' · Mit Enter bestätigen.';
      drawMini(G.choice,{quiz:true,hl:q.cursor});return;
    }
    if(e.key==='Enter'&&q.cursor){e.preventDefault();quizReveal(q.cursor===q.r);return;}
  }
  if(G.phase==='decide'&&!G.replay){let c=null;const lb=G.sc.labels;if(e.key==='ArrowUp'&&lb.drive)c='drive';else if((e.key===' '||e.key==='ArrowDown')&&lb.shot)c='shot';else if(/^[1-5]$/.test(e.key)){if(G.sc.spots){const sp=G.sc.spots[+e.key-1];if(sp)c='spot:'+sp.id;}else{const p=players.find(q=>q.sel&&q.key===+e.key);if(p)c='pass:'+p.role;}}
    if(c){e.preventDefault();resolve(c);}}
  else if(G.phase==='feedback'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();$('nextBtn').click();}});
addEventListener('resize',()=>{computeFit();if(camMode)camMode.snap=true;if(CARD.on)cardSize();if(bubbles.length){posMe();posBubbles(true);}});

// ================= Willkommen (erster Start) =================
const WEL={pos:'pg',g:'',autoHair:false};
function maybeWelcome(){if(store.get('pgt_welcome')||PROFILE.games)return;
  $('wName').value=store.get('pgt_name')||'';WEL.pos=G.pos==='mix'?'pg':G.pos;markSel('wPos','v',WEL.pos);welJersey();
  const g=PROFILE.g||GURL;markSel('wG','v',g);if(g&&g!==PROFILE.g)welG(g);$('welcome').classList.remove('hidden');}
// Mädchen/Jungen: sofort umstellen (Texte, Figuren im Hintergrund); Mädchen bekommen als Start-Frisur einen Zopf
function welG(g){WEL.g=g;markSel('wG','v',g);
  if(g==='w'&&PROFILE.hair===0){PROFILE.hair=2;WEL.autoHair=true;}else if(g==='m'&&WEL.autoHair&&PROFILE.hair===2){PROFILE.hair=0;WEL.autoHair=false;}
  PROFILE.g=g;setGirl(g==='w');if(G.phase==='menu')demo();}
document.querySelectorAll('#wG .lvb').forEach(b=>b.onclick=()=>welG(b.dataset.v));
function welJersey(){$('wjName').textContent=cleanName($('wName').value).toUpperCase();$('wjNum').textContent=PROFILE.num;$('wNum').textContent=PROFILE.num;}
$('wName').addEventListener('input',welJersey);
$('wName').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')$('wName').blur();});
$('wNumM').onclick=()=>{PROFILE.num=(PROFILE.num+99)%100;welJersey();};
$('wNumP').onclick=()=>{PROFILE.num=(PROFILE.num+1)%100;welJersey();};
document.querySelectorAll('#wPos .lvb').forEach(b=>b.onclick=()=>{WEL.pos=b.dataset.v;markSel('wPos','v',WEL.pos);});
function welDone(){const n=cleanName($('wName').value);if(n)store.set('pgt_name',n);saveProf();store.set('pgt_welcome','1');$('welcome').classList.add('hidden');
  G.pos=WEL.pos;store.set('pgt_pos',G.pos);markSel('pos','v',G.pos);renderPlayChips();renderStrip();refreshBest();}
$('wSkip').onclick=()=>{welDone();demo();};
$('wGo').onclick=()=>{welDone();if(TASK){$('taskBar').click();return;}
  G.level=1;markSel('lvl','l',1);G.noLimit=true;$('noLimit').checked=true;G.rounds=5;G.first=true;newGame();};


// ================= Spieler: mehrere pro Gerät =================
// Verzeichnis der Spieler auf diesem Gerät (nur Anzeige): [{id,uid,name,num,xp,g}]
function regList(){let l=[];try{l=JSON.parse(store.get('pgt_players')||'[]')||[]}catch(e){}return Array.isArray(l)?l:[];}
function regSave(l){store.set('pgt_players',JSON.stringify(l));}
function regSync(){const l=regList(),P=PROFILE,e={id:CUR,uid:P.uid,name:store.get('pgt_name')||'',num:P.num,xp:P.xp,g:P.games};
  const i=l.findIndex(x=>x.id===CUR);if(i<0){if(!e.name&&!e.g&&l.length)return;l.push(e);}else l[i]=e;regSave(l);}
const isEmptyMe=()=>!PROFILE.games&&!store.get('pgt_name');
function useSlot(id){CUR=id;try{localStorage.setItem('pgt_cur',id)}catch(e){}}
function reloadAs(id){useSlot(id);sess.set('pgt_picked','1');try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}location.reload();}
function newSlotId(){const used=new Set(regList().map(x=>x.id));let id;do{id=Math.random().toString(36).slice(2,8)}while(used.has(id));return id;}
function slotKeys(id){const suf=id?'@'+id:'';return store.keys().filter(k=>{const m=/^(.*?)(@[a-z0-9]+)?$/.exec(k);return PER.test(m[1])&&(m[2]||'')===suf;});}
function newPlayer(){if(isEmptyMe()){store.del('pgt_welcome');reloadAs(CUR);return;}reloadAs(newSlotId());}
// Spieler wählen
function lvlName(xp){return lvlOf(xp||0).name;}
function jerseyHTML(num){return`<span class="ps-num"><svg viewBox="0 0 24 24"><path d="M8.5 3c.4 1.9 1.7 3 3.5 3s3.1-1.1 3.5-3H18c0 3 .8 5 2 6v12H4V9c1.2-1 2-3 2-6z"/></svg><b>${num}</b></span>`;}
// Liste der Spieler (beim Start in „Wer spielt?“ und im Profil): Antippen wechselt per Neuladen
function whoRows(el,cur){regSync();el.innerHTML='';
  regList().forEach(e=>{const b=document.createElement('button');b.className='wp'+(e.id===CUR?' sel':'');
    b.innerHTML=jerseyHTML(e.num)+`<span><b class="nm"></b><small>${lvlName(e.xp)} · ${e.g===1?'1 Spiel':(e.g||0)+' Spiele'}</small></span>`+(e.id===CUR?'<em class="wpme">Spielt gerade</em>':'');b.querySelector('.nm').textContent=e.name||'Ohne Namen';
    b.onclick=()=>{if(e.id===CUR){cur();return;}reloadAs(e.id);};el.appendChild(b);});}
function openWho(first){whoRows($('whoList'),closeWho);$('whoX').classList.toggle('hidden',!!first);$('who').classList.remove('hidden');}
function closeWho(){$('who').classList.add('hidden');sess.set('pgt_picked','1');maybeWelcome();}
$('whoX').onclick=closeWho;$('whoNew').onclick=newPlayer;
// Spielerdaten kompakt (für das Konto, siehe js/account.js)
const POSK=['pg','wing','center','def','mix'],CATK=['pass','drive','shot','off','def'];
// packObj: Spielerdaten kompakt (auch für das Konto, siehe js/account.js); P/n/p/m = Profil, Name, Position, Spielform
function packObj(P=PROFILE,n=store.get('pgt_name')||'',p=store.get('pgt_pos')||'pg',m=+(store.get('pgt_mode')||4)){
  return{v:1,u:P.uid,n,p,m,
    d:[P.num,P.skin,P.hair,P.hairC,P.games,P.rounds,P.correct,Math.round(P.rtS*10),P.rtN,P.best,P.xp,P.saved||0],
    c:CATK.map(k=>P.cat[k]||[0,0]),o:POSK.filter(k=>P.pos[k]).map(k=>POSK.indexOf(k)).join(''),
    b:BADGES.reduce((a,b,i)=>P.badges[b.id]?a+2**i:a,0),z:P.lz,g:P.g||'',age:P.age,t:P.mt||0};}
function unpackObj(o){try{
  if(!o||o.v!==1||!Array.isArray(o.d)||o.d.length<11)return null;
  const n=(i,max)=>clamp(Math.round(+o.d[i]||0),0,max),pr=a=>Array.isArray(a)?[clamp(+a[0]|0,0,1e6),clamp(+a[1]|0,0,1e6)]:[0,0];
  const P={num:n(0,99),skin:n(1,SKINC.length-1),hair:n(2,HAIRS.length-1),hairC:n(3,HAIRC.length-1),games:n(4,1e6),rounds:n(5,1e7),correct:n(6,1e7),
    rtS:n(7,1e8)/10,rtN:n(8,1e7),best:n(9,1e4),xp:n(10,1e8),saved:n(11,1e6),cat:{},pos:{},badges:{},lz:{},uid:String(o.u||'').replace(/[^a-z0-9]/g,'').slice(0,12)||Math.random().toString(36).slice(2,10)};
  CATK.forEach((k,i)=>P.cat[k]=pr(o.c&&o.c[i]));String(o.o||'').split('').forEach(i=>{if(POSK[+i])P.pos[POSK[+i]]=1;});
  const bm=+o.b||0;BADGES.forEach((b,i)=>{if(Math.floor(bm/2**i)%2)P.badges[b.id]=Date.now()-i;});
  if(o.z&&typeof o.z==='object')Object.keys(LZ).forEach(k=>{if(o.z[k])P.lz[k]=pr(o.z[k]);});
  if(o.g==='w'||o.g==='m')P.g=o.g;
  if(['U10','U12','U14'].includes(o.age))P.age=o.age;
  P.mt=clamp(+o.t||0,0,4e12);
  return{P,name:cleanName(o.n),pos:POS[o.p]&&o.p!=='mix'?o.p:'pg',mode:o.m===5?5:4};}catch(e){return null;}}
// QR-Code (Gerät hinzufügen, js/account.js): Bibliothek erst bei Bedarf von jsDelivr
function loadQR(){return window.qrcode?Promise.resolve():new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';sc.onload=ok;sc.onerror=no;document.head.appendChild(sc);});}
function drawQR(cv,url){const g=cv.getContext('2d');
  return loadQR().then(()=>{const q=window.qrcode(0,'M');q.addData(url);q.make();const n=q.getModuleCount(),m=4,sz=cv.width,c=sz/(n+2*m);
    g.fillStyle='#fff';g.fillRect(0,0,sz,sz);g.fillStyle='#0c1222';for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k))g.fillRect(Math.floor((k+m)*c),Math.floor((r+m)*c),Math.ceil(c),Math.ceil(c));});}
$('pcWho').onclick=()=>{closeCard();openAcct();};
$('sSave').onclick=()=>{PROFILE.saved=PROFILE.games;saveProf();openAcct();};
$('wHave').onclick=()=>{$('welcome').classList.add('hidden');if(onlineOn())openAcct();else openWho(false);};
// Spieler entfernen (zweimal tippen)
let delArm=0;$('pcDel').onclick=async()=>{if(Date.now()-delArm>3000){delArm=Date.now();$('pcDel').textContent=accOn()?'Wirklich entfernen, auch aus dem Konto? Nochmal tippen':'Wirklich entfernen? Nochmal tippen';return;}
  if(accOn()){$('pcDel').textContent='Wird entfernt …';clearTimeout(ACC_T);ACC_T=0;ACC_BUSY=true; // kein verspätetes Hochladen mehr
    try{await fsReq('DELETE',`accounts/${ACC.uid}/players/${PROFILE.uid}`);const k=accKnown();delete k[PROFILE.uid];accKnownSet(k);}
    catch(e){ACC_BUSY=false;delArm=0;$('pcDel').textContent='Ohne Internet geht das gerade nicht. Später noch mal tippen';return;}}
  slotKeys(CUR).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});const l=regList().filter(x=>x.id!==CUR);regSave(l);
  reloadAs(l.length?l[0].id:newSlotId());};
// Browser bitten, die Daten nicht automatisch zu löschen (einmal pro Gerät, nach dem ersten Spiel)
function askPersist(){try{if(navigator.storage&&navigator.storage.persist&&!store.get('pgt_persist')){store.set('pgt_persist','1');navigator.storage.persisted().then(p=>p||navigator.storage.persist()).catch(()=>{});}}catch(e){}}
// Erinnerung in der Auswertung: Spieler sichern
function needSave(){const P=PROFILE;if(!onlineOn()||accOn())return false;return P.saved?P.games-P.saved>=5:P.games>=2;}
function startFlow(){if(accLanding()){accLabel();return;}accStart();
  if(pairLanding())return;
  // alte Spieler-Links (#s=…) gibt es nicht mehr
  if(location.hash.includes('s='))try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
  if(regList().length>1&&!sess.get('pgt_picked')){openWho(true);return;}
  maybeWelcome();}

// ================= Demo im Menü =================
function demo(){let ps=playsOf(G.pos);if(!ps.length)ps=playsOf('pg');const p=pick(ps);const v=pick(PLAYS[p].vars(G.mode,1));G.sc=buildScenario((Math.random()*1e9)|0,p,v);G.t=0;computeFit();camDir=startDir();updCam(0,true);}
function startDir(){const sc=G.sc;if(sc.camFix)return{x:sc.camFix.dx,z:sc.camFix.dz};const d0=Math.hypot(Hd.x,Hd.z);return d0<3.5?{x:sc.dir.x,z:sc.dir.z}:{x:-Hd.x/d0,z:-Hd.z/d0};}

