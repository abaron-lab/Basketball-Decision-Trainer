// Konto (freiwillig): Eltern melden sich ohne Passwort mit ihrer E-Mail-Adresse an, alle Spieler des Geräts liegen dann
// zusätzlich in Firestore unter accounts/<uid>/players/<spieler-uid> und werden zwischen Geräten abgeglichen. Weitere Geräte
// (z. B. das Tablet der Kinder) verbindet das Elterngerät per QR-Code oder Code zum Eintippen, ohne E-Mail auf dem Kindergerät.
// Firebase Authentication per REST (kein SDK): sendOobCode (EMAIL_SIGNIN) → Link in der E-Mail → signInWithEmailLink; Geräte: signUp (anonym).
// Ein Konto entsteht erst mit dem Klick auf den Link (bestätigte Adresse = Double-Opt-in). Ohne config.js bleibt alles lokal.
// Oberfläche: Profil (#acct, Taste #profBtn oben rechts) mit „Wer spielt?“ und Konto.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html (nach ui.js).

// Gerätebezogene Schlüssel (nicht pro Spieler): Anmeldung, offene Anfrage, Spieler, die schon im Konto waren
const ACC_K='pgt_acct',ACC_PK='pgt_acct_pend',ACC_SK='pgt_acct_sync';
let ACC=(()=>{try{const a=JSON.parse(store.get(ACC_K)||'null');return a&&a.uid&&a.rt?a:null}catch(e){return null}})();
const accOn=()=>onlineOn()&&!!ACC;
const accPend=()=>{try{const p=JSON.parse(store.get(ACC_PK)||'null');return p&&p.email?p:null}catch(e){return null}};
function accSave(){if(ACC)store.set(ACC_K,JSON.stringify(ACC));else store.del(ACC_K);}
const accKnown=()=>{try{return JSON.parse(store.get(ACC_SK)||'{}')||{}}catch(e){return{}}};
const accKnownSet=k=>store.set(ACC_SK,JSON.stringify(k));
const FSB=()=>`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(ONLINE.projectId)}/databases/(default)/documents`;
const KEYQ=()=>'key='+encodeURIComponent(ONLINE.apiKey);

// ---------- Firebase Authentication (REST) ----------
async function idt(op,body){
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?${KEYQ()}`,{method:'POST',headers:{'Content-Type':'application/json','X-Firebase-Locale':'de'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error((j.error&&j.error.message)||('HTTP '+r.status));e.code=e.message;throw e;}return j;}
// Gültiges ID-Token (1 Stunde), sonst mit dem Refresh-Token erneuern
async function accToken(){if(!ACC)throw new Error('NO_ACCOUNT');
  if(ACC.it&&ACC.exp>Date.now()+60e3)return ACC.it;
  const r=await fetch(`https://securetoken.googleapis.com/v1/token?${KEYQ()}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(ACC.rt)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const m=(j.error&&j.error.message)||('HTTP '+r.status);if(/TOKEN_EXPIRED|USER_DISABLED|USER_NOT_FOUND|INVALID_REFRESH_TOKEN|PROJECT_NUMBER_MISMATCH/.test(m))accDrop();const e=new Error(m);e.code=m;throw e;}
  ACC.it=j.id_token;ACC.rt=j.refresh_token||ACC.rt;ACC.exp=Date.now()+(+j.expires_in||3600)*1000;accSave();return ACC.it;}
// Firestore mit Anmeldung; path relativ zu …/documents
async function fsReq(method,path,body,keep){const t=await accToken();
  const r=await fetch(`${FSB()}/${path}${path.includes('?')?'&':'?'}${KEYQ()}`,{method,keepalive:!!keep,headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:body?JSON.stringify(body):undefined});
  if(r.status===404&&method==='GET')return null;
  if(!r.ok){const e=new Error('HTTP '+r.status);e.status=r.status;throw e;}
  return r.json().catch(()=>null);}

// ---------- Spieler auf dem Gerät (alle Slots, nicht nur der aktuelle) ----------
const slotSuf=id=>id?'@'+id:'';
const lsGet=(k,id)=>{try{return localStorage.getItem(k+slotSuf(id))}catch(e){return null}};
const lsSet=(k,id,v)=>{try{localStorage.setItem(k+slotSuf(id),v)}catch(e){}};
const PDEF=()=>({num:7,skin:2,hair:0,hairC:1,games:0,rounds:0,correct:0,cat:{pass:[0,0],drive:[0,0],shot:[0,0],off:[0,0],def:[0,0]},rtS:0,rtN:0,best:0,pos:{},xp:0,badges:{},lz:{}});
function slotProf(id){if(id===CUR)return PROFILE;let o={};try{o=JSON.parse(lsGet(PK,id)||'{}')||{}}catch(e){}
  const P=Object.assign(PDEF(),o);P.cat=Object.assign(PDEF().cat,o.cat||{});P.lz=P.lz||{};
  if(!P.uid){P.uid=Math.random().toString(36).slice(2,10);lsSet(PK,id,JSON.stringify(P));}return P;}
const slotName=id=>id===CUR?store.get('pgt_name')||'':lsGet('pgt_name',id)||'';
const slotHas=id=>slotProf(id).games>0||!!slotName(id);
function packSlot(id){if(id===CUR)return packObj();return packObj(slotProf(id),slotName(id),lsGet('pgt_pos',id)||'pg',+(lsGet('pgt_mode',id)||4));}
// Stand aus dem Konto in einen Slot schreiben (ohne Neuladen)
function writeSlot(id,d){if(!d.P.age)d.P.age=d.mode===5?'U12':'U10';
  lsSet(PK,id,JSON.stringify(d.P));if(d.name)lsSet('pgt_name',id,d.name);lsSet('pgt_welcome',id,'1');lsSet('pgt_pos',id,d.pos);lsSet('pgt_mode',id,String(d.mode));
  const l=regList().filter(x=>x.id!==id);l.push({id,uid:d.P.uid,name:d.name,num:d.P.num,xp:d.P.xp,g:d.P.games});regSave(l);
  if(id===CUR){Object.keys(PROFILE).forEach(k=>delete PROFILE[k]);Object.assign(PROFILE,d.P);setGirl(PROFILE.g==='w');
    if(G.phase==='menu'){try{renderStrip();refreshBest();demo();}catch(e){}}}}
function removeSlot(id){slotKeys(id).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});regSave(regList().filter(x=>x.id!==id));}
// Neuer gewinnt: mehr Spiele, bei gleich vielen die spätere Änderung (mt)
const accNewer=(a,b)=>(a.games|0)!==(b.games|0)?(a.games|0)>(b.games|0):(a.mt||0)>(b.mt||0);

// ---------- Abgleich ----------
function docOf(d){const f=d.fields||{};let o=null;try{o=JSON.parse(f.data.stringValue)}catch(e){return null}
  const u=unpackObj(o);if(!u)return null;const pid=d.name.split('/').pop();u.P.uid=pid;return{pid,u};}
async function pushSlot(id,keep){if(!accOn()||!slotHas(id))return;const P=slotProf(id);
  await fsReq('PATCH',`accounts/${ACC.uid}/players/${P.uid}`,{fields:{data:{stringValue:JSON.stringify(packSlot(id))},games:{integerValue:String(P.games|0)},ts:{integerValue:String(Date.now())}}},keep);
  const k=accKnown();k[P.uid]=1;accKnownSet(k);ACC.last=Date.now();accSave();}
let ACC_SYNC=null;
// Holt alle Spieler aus dem Konto: neuere Stände übernehmen, eigene neuere hochladen, fehlende Spieler anlegen.
// War ein Spieler schon im Konto und fehlt dort jetzt, wurde er auf einem anderen Gerät entfernt → hier auch.
function accSync(){if(!accOn())return Promise.resolve(null);if(ACC_SYNC)return ACC_SYNC;
  ACC_SYNC=(async()=>{regSync();
    const j=await fsReq('GET',`accounts/${ACC.uid}/players?pageSize=100`);
    const rem={};((j&&j.documents)||[]).forEach(d=>{const r=docOf(d);if(r)rem[r.pid]=r;});
    const known=accKnown(),now={},res={added:0,cur:false,gone:false};
    for(const e of regList()){const P=slotProf(e.id),r=rem[P.uid];
      if(r){delete rem[P.uid];now[P.uid]=1;
        if(accNewer(r.u.P,P)){writeSlot(e.id,r.u);if(e.id===CUR)res.cur=true;}
        else if(accNewer(P,r.u.P))await pushSlot(e.id);}
      else if(known[P.uid]){removeSlot(e.id);if(e.id===CUR)res.gone=true;}
      else if(slotHas(e.id)){await pushSlot(e.id);now[P.uid]=1;}}
    if(!regList().length&&!res.gone)regSync();
    for(const pid of Object.keys(rem)){const r=rem[pid];
      const id=!res.gone&&isEmptyMe()&&!regList().some(x=>x.id===CUR&&(x.name||x.g))?CUR:newSlotId();
      writeSlot(id,r.u);if(id===CUR)res.cur=true;now[pid]=1;res.added++;}
    accKnownSet(now);ACC.last=Date.now();accSave();return res;})().finally(()=>{ACC_SYNC=null;});
  return ACC_SYNC;}
// Nach jeder Änderung am Profil (saveProf): kurz warten, dann den aktuellen Spieler hochladen
let ACC_T=0,ACC_BUSY=false;
function accDirty(){if(!accOn()||ACC_BUSY)return;clearTimeout(ACC_T);ACC_T=setTimeout(()=>{ACC_T=0;pushSlot(CUR).catch(()=>{});},1500);}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ACC_T&&!ACC_BUSY){clearTimeout(ACC_T);ACC_T=0;pushSlot(CUR,true).catch(()=>{});}});
// Rangliste: Teams merken, in denen das Konto Einträge hat (zum Löschen mit dem Konto)
function accTeam(t){if(!accOn())return;ACC.teams=ACC.teams||[];if(ACC.teams.includes(t))return;ACC.teams.push(t);accSave();
  fsReq('PATCH',`accounts/${ACC.uid}?updateMask.fieldPaths=teams`,{fields:{teams:{stringValue:ACC.teams.join(',').slice(0,600)}}}).catch(()=>{});}

// ---------- Anmelden, Abmelden, Löschen ----------
const MAILRE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fsS=v=>({stringValue:String(v)}),fsI=v=>({integerValue:String(Math.round(+v||0))});
// Rücksprung-Adresse: diese Seite mit ihren Parametern (Team, Mädchen/Jungen), ohne alte Anmelde- und Kopplungs-Parameter
// (Parameter unverändert übernehmen, nicht neu kodieren)
function accBackUrl(intent){const s=location.search.replace(/^\?/,'').split('&').filter(x=>x&&!/^(mode|oobCode|apiKey|lang|continueUrl|tenantId|konto|koppeln)(=|$)/.test(x));
  if(intent)s.push('konto='+intent);return location.origin+location.pathname+(s.length?'?'+s.join('&'):'');}
async function accSend(email,consent,intent){
  await idt('sendOobCode',{requestType:'EMAIL_SIGNIN',email,continueUrl:accBackUrl(intent),canHandleCodeInApp:true});
  store.set(ACC_PK,JSON.stringify({email,ts:consent||0,at:Date.now(),intent:intent||''}));}
async function accFinish(code,email,consent){
  const j=await idt('signInWithEmailLink',{email,oobCode:code});
  if(ACC&&ACC.uid!==j.localId)store.del(ACC_SK);
  ACC={uid:j.localId,email:j.email||email,it:j.idToken,rt:j.refreshToken,exp:Date.now()+(+j.expiresIn||3600)*1000,teams:[]};accSave();store.del(ACC_PK);store.del('pgt_acct_gone');
  // Konto-Dokument: Zeitpunkt der Einwilligung (einmal) und Teams mit Ranglisten-Einträgen
  const doc=await fsReq('GET',`accounts/${ACC.uid}`);
  if(doc){const f=doc.fields||{};ACC.teams=String(f.teams&&f.teams.stringValue||'').split(',').filter(Boolean);accSave();}
  else await fsReq('PATCH',`accounts/${ACC.uid}`,{fields:{consent:fsI(consent||Date.now()),teams:fsS('')}});}
function accDrop(){clearTimeout(ACC_T);ACC_T=0;ACC=null;accSave();store.del(ACC_SK);accLabel();}
// Konto löschen: Ranglisten-Einträge des Kontos, alle Spieler, verbundene Geräte, Konto-Dokument, zuletzt die Anmeldung selbst.
// Die Spieler auf diesem Gerät bleiben. Ist die letzte Anmeldung zu lange her, verlangt Firebase eine neue: dann kommt ein Link.
async function accDelete(){ACC_BUSY=true;clearTimeout(ACC_T);ACC_T=0;pairEnd();
  try{const uid=ACC.uid,teams=[...new Set([...(ACC.teams||[]),TEAMID])];
    for(const t of teams){
      const r=await fsReq('POST',`teams/${encodeURIComponent(t)}:runQuery`,{structuredQuery:{from:[{collectionId:'scores'}],where:{fieldFilter:{field:{fieldPath:'uid'},op:'EQUAL',value:{stringValue:uid}}}}});
      for(const d of(r||[]).filter(x=>x.document))await fsReq('DELETE',d.document.name.split('/documents/')[1]);}
    for(const sub of['players','devices']){const j=await fsReq('GET',`accounts/${uid}/${sub}?pageSize=100`);
      for(const d of(j&&j.documents)||[])await fsReq('DELETE',d.name.split('/documents/')[1]);}
    await fsReq('DELETE',`accounts/${uid}`);
    try{await idt('delete',{idToken:await accToken()});}
    catch(e){if(/CREDENTIAL_TOO_OLD|TOKEN_EXPIRED|INVALID_ID_TOKEN/.test(e.code||'')){const em=ACC.email;await accSend(em,0,'loeschen');accDrop();return'mail';}throw e;}
    accDrop();return'done';}
  finally{ACC_BUSY=false;}}
// Link aus der E-Mail erkennen (Adresse der Seite oder eingefügter Text)
function accCode(t){const s=String(t||'');let m=/[?&]oobCode=([A-Za-z0-9_-]+)/.exec(s);if(!m){try{m=/[?&]oobCode=([A-Za-z0-9_-]+)/.exec(decodeURIComponent(s))}catch(e){}}
  if(!m)return null;const i=/[?&]konto=([a-z]+)/.exec(s);return{code:m[1],intent:i?i[1]:''};}
function accErr(e){const m=String(e&&(e.code||e.message)||'');console.warn('Konto:',m);
  if(e instanceof TypeError||/Failed to fetch|NetworkError|Load failed/.test(m))return'Keine Verbindung. Probier es mit Internet noch mal.';
  if(/INVALID_EMAIL|MISSING_EMAIL/.test(m))return'Diese E-Mail-Adresse passt nicht. Schau noch mal nach.';
  if(/OOB_CODE|ACTION_CODE/.test(m))return'Der Link ist abgelaufen oder wurde schon benutzt. Lass dir einen neuen schicken.';
  if(/PAIR_|HTTP 403|HTTP 404|PERMISSION_DENIED/.test(m))return'Der Code passt nicht oder ist abgelaufen. Lass dir auf dem Gerät deiner Eltern einen neuen zeigen.';
  if(/OPERATION_NOT_ALLOWED|ADMIN_ONLY/.test(m))return'Das Verbinden per Code ist noch nicht eingerichtet. Melde dich mit der E-Mail-Adresse an.';
  if(/TOO_MANY|QUOTA|RESOURCE_EXHAUSTED/.test(m))return'Gerade gab es zu viele Versuche. Probier es später noch mal.';
  if(/USER_DISABLED/.test(m))return'Dieses Konto ist gesperrt.';
  return`Das hat gerade nicht geklappt. Probier es später noch mal. (${m.slice(0,40)})`;}
const accMask=e=>{const[a,b]=String(e||'').split('@');return b?a.slice(0,1)+'•••@'+b:'';};

// ---------- Weitere Geräte verbinden (QR-Code oder Code zum Eintippen) ----------
// Das angemeldete Elterngerät legt pairs/<CODE> an (Konto, Ablauf nach 10 Minuten, verdeckte E-Mail). Das neue Gerät meldet sich
// anonym bei Firebase an (ohne persönliche Daten), liest den Code und trägt sich unter accounts/<uid>/devices/<geräte-uid> ein.
// Das erlauben die Regeln nur mit einem gültigen Code; danach darf das Gerät die Spieler des Kontos lesen und schreiben.
// Die Eltern sehen die Geräte im Profil und können jedes entfernen, dann verliert es den Zugriff.
const PAIR_MS=10*60e3,PAIR_ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789',PAIR_RE=/^[A-HJKMNP-Z2-9]{8}$/;
const accDevice=()=>!!(ACC&&ACC.dev);
function pairGen(){const a=new Uint32Array(8);crypto.getRandomValues(a);return Array.from(a,x=>PAIR_ABC[x%PAIR_ABC.length]).join('');}
const pairFmt=c=>c.slice(0,4)+'-'+c.slice(4);
// Code aus dem QR-Code (Adresse mit ?koppeln=…) oder getippt (Bindestrich, Leerzeichen, klein geschrieben egal)
function pairCode(t){const s=String(t||'');const m=/[?&]koppeln=([A-Za-z0-9-]+)/.exec(s);const c=(m?m[1]:s).toUpperCase().replace(/[^A-Z0-9]/g,'');return PAIR_RE.test(c)?c:null;}
function pairUrl(c){const u=accBackUrl('');return u+(u.includes('?')?'&':'?')+'koppeln='+c;}
function devName(){const u=navigator.userAgent||'';
  if(/iPad/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1))return'iPad';if(/iPhone|iPod/.test(u))return'iPhone';
  if(/Android/.test(u))return/Mobile/.test(u)?'Android-Handy':'Android-Tablet';if(/CrOS/.test(u))return'Chromebook';
  if(/Windows/.test(u))return'Windows-PC';if(/Macintosh/.test(u))return'Mac';if(/Linux/.test(u))return'Linux-PC';return'Gerät';}
async function devList(){const j=await fsReq('GET',`accounts/${ACC.uid}/devices?pageSize=50`);
  return((j&&j.documents)||[]).map(d=>{const f=d.fields||{};return{id:d.name.split('/').pop(),name:(f.name&&f.name.stringValue)||'Gerät',ts:+(f.ts&&f.ts.integerValue||0)};}).sort((a,b)=>a.ts-b.ts);}
// Elterngerät: Code anlegen, QR-Code zeigen, auf das neue Gerät warten
let PAIR=null;
async function pairShow(){pairEnd();accPane('qr');const cv=$('acQR');cv.classList.add('hidden');$('acPNew').classList.add('hidden');
  $('acPCode').textContent='····-····';$('acPExp').textContent='';$('acQRmsg').textContent='Code wird erstellt …';
  try{const known=new Set((await devList()).map(d=>d.id)),code=pairGen(),exp=Date.now()+PAIR_MS;
    await fsReq('PATCH',`pairs/${code}?currentDocument.exists=false`,{fields:{acct:fsS(ACC.uid),exp:fsI(exp),mail:fsS(accMask(ACC.email))}});
    if(ACC_P!=='qr'){fsReq('DELETE',`pairs/${code}`).catch(()=>{});return;}
    PAIR={code,exp,known,n:0,t:setInterval(pairTick,1000)};$('acPCode').textContent=pairFmt(code);pairTick();
    drawQR(cv,pairUrl(code)).then(()=>{if(PAIR&&PAIR.code===code){cv.classList.remove('hidden');$('acQRmsg').textContent='';}})
      .catch(()=>{$('acQRmsg').textContent='Den QR-Code gibt es nur mit Internet. Der Code zum Eintippen geht trotzdem.';});}
  catch(e){accPane('home');accSay(accErr(e));}}
function pairTick(){if(!PAIR)return;const left=PAIR.exp-Date.now();
  if(left<=0){pairEnd();$('acQR').classList.add('hidden');$('acPCode').textContent='····-····';$('acPExp').textContent='Der Code ist abgelaufen.';$('acPNew').classList.remove('hidden');return;}
  $('acPExp').textContent=`Gilt noch ${Math.ceil(left/60e3)} Min.`;
  if(PAIR.n++%3)return;const p=PAIR;
  devList().then(l=>{if(PAIR!==p)return;const nw=l.find(d=>!p.known.has(d.id));
    if(nw){pairEnd();accPane('home');accSay(`Fertig! ${nw.name} ist jetzt verbunden.`,true);}}).catch(()=>{});}
function pairEnd(){if(!PAIR)return;clearInterval(PAIR.t);const c=PAIR.code;PAIR=null;if(accOn()&&!accDevice())fsReq('DELETE',`pairs/${c}`).catch(()=>{});}
// Neues Gerät: mit dem Code verbinden
async function pairJoin(raw){const code=pairCode(raw);scanStop();
  if(!code){accSay('Der Code hat 8 Zeichen, z. B. ABCD-EFGH. Schau noch mal nach.');return;}
  if(ACC){accPane('home');accSay(accDevice()?'Dieses Gerät ist schon mit dem Konto verbunden.':'Dieses Gerät ist schon angemeldet. Den Code brauchst du auf dem anderen Gerät.');return;}
  const back=ACC_P==='busy'?'home':ACC_P;accPane('busy');let tok=null;
  try{const j=await idt('signUp',{returnSecureToken:true});tok=j.idToken;
    const r=await fetch(`${FSB()}/pairs/${code}?${KEYQ()}`,{headers:{Authorization:'Bearer '+tok}});
    if(!r.ok){const e=new Error(r.status===404||r.status===403?'PAIR_INVALID':'HTTP '+r.status);e.code=e.message;throw e;}
    const f=((await r.json())||{}).fields||{},acct=f.acct&&f.acct.stringValue;
    if(!acct||+(f.exp&&f.exp.integerValue||0)<Date.now()){const e=new Error('PAIR_EXPIRED');e.code=e.message;throw e;}
    ACC={uid:acct,dev:j.localId,mail:(f.mail&&f.mail.stringValue)||'',it:tok,rt:j.refreshToken,exp:Date.now()+(+j.expiresIn||3600)*1000,teams:[]};
    await fsReq('PATCH',`accounts/${acct}/devices/${j.localId}?currentDocument.exists=false`,{fields:{code:fsS(code),name:fsS(devName()),ts:fsI(Date.now())}});
    store.del(ACC_SK);store.del(ACC_PK);store.del('pgt_acct_gone');accSave();tok=null;
    fsReq('DELETE',`pairs/${code}`).catch(()=>{});
    try{const d=await fsReq('GET',`accounts/${acct}`);if(d){const t=d.fields&&d.fields.teams;ACC.teams=String(t&&t.stringValue||'').split(',').filter(Boolean);accSave();}}catch(e){}
    let res=null;try{res=await accSync();}catch(e){}
    accLabel();accPane('home');
    accSay(res&&res.added?(res.added===1?'Verbunden! 1 Spieler aus dem Konto ist jetzt auf diesem Gerät.':`Verbunden! ${res.added} Spieler aus dem Konto sind jetzt auf diesem Gerät. Tippe auf deinen Namen.`):'Verbunden! Deine Spieler werden jetzt automatisch gesichert.',true);}
  catch(e){if(tok){if(ACC&&ACC.dev){ACC=null;accSave();}idt('delete',{idToken:tok}).catch(()=>{});}
    accPane(back);accSay(accErr(e));}}
// Gerät selbst trennen (die anonyme Anmeldung wird gelöscht, die Spieler bleiben)
async function pairLeave(){accPane('busy');
  try{await fsReq('DELETE',`accounts/${ACC.uid}/devices/${ACC.dev}`);try{await idt('delete',{idToken:await accToken()});}catch(e){}
    accDrop();accPane('home');accSay('Getrennt. Die Spieler bleiben auf diesem Gerät.',true);}
  catch(e){accPane('home');accSay(accErr(e));}}
// Hat das Elterngerät dieses Gerät entfernt (oder das Konto gelöscht), lehnt Firestore ab: dann hier abmelden
function accGone(e){if(!accDevice()||!e||(e.status!==403&&e.status!==404))return false;accDrop();store.set('pgt_acct_gone','1');return true;}

// ---------- QR-Code scannen (Kamera; BarcodeDetector, sonst jsQR von jsDelivr) ----------
let SCAN=null;
function loadJsQR(){return window.jsQR?Promise.resolve():new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';sc.onload=ok;sc.onerror=no;document.head.appendChild(sc);});}
async function scanStart(){scanStop();const v=$('acVid'),say=t=>$('acScanMsg').textContent=t,me={};SCAN=me;
  $('acct').classList.remove('scanning');say('Kamera wird gestartet …');
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){say('Hier geht die Kamera leider nicht. Tippe den Code ein.');return;}
  let det=null;try{if('BarcodeDetector' in window&&(await BarcodeDetector.getSupportedFormats()).includes('qr_code'))det=new BarcodeDetector({formats:['qr_code']});}catch(e){}
  if(!det)try{await loadJsQR();}catch(e){if(SCAN===me)say('Der Scanner braucht Internet. Tippe den Code ein.');return;}
  let st;try{st=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});}
  catch(e){if(SCAN===me)say(e&&e.name==='NotAllowedError'?'Die Kamera ist nicht erlaubt. Erlaube sie in den Einstellungen oder tippe den Code ein.':'Die Kamera geht gerade nicht. Tippe den Code ein.');return;}
  if(SCAN!==me){st.getTracks().forEach(t=>t.stop());return;}
  me.st=st;v.srcObject=st;try{await v.play();}catch(e){}
  $('acct').classList.add('scanning');say('Halte die Kamera auf den QR-Code auf dem Gerät deiner Eltern.');
  const cv=document.createElement('canvas'),g=cv.getContext('2d',{willReadFrequently:true});let busy=false,bad=0;
  me.t=setInterval(async()=>{if(busy||SCAN!==me||!v.videoWidth)return;busy=true;
    try{let txt=null;
      if(det){const r=await det.detect(v);txt=r&&r[0]&&r[0].rawValue;}
      else{const k=Math.min(1,640/Math.max(v.videoWidth,v.videoHeight));cv.width=Math.round(v.videoWidth*k);cv.height=Math.round(v.videoHeight*k);
        g.drawImage(v,0,0,cv.width,cv.height);const r=window.jsQR(g.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height,{inversionAttempts:'dontInvert'});txt=r&&r.data;}
      if(txt&&SCAN===me){const c=pairCode(txt);if(c){pairJoin(c);return;}if(++bad===1)say('Das ist nicht der Code aus dem Spiel. Zeig auf den QR-Code im Profil deiner Eltern.');}}
    catch(e){}finally{busy=false;}},180);}
function scanStop(){const s=SCAN;SCAN=null;$('acct').classList.remove('scanning');if(!s)return;clearInterval(s.t);if(s.st)s.st.getTracks().forEach(t=>t.stop());const v=$('acVid');try{v.pause();}catch(e){}v.srcObject=null;}

// ---------- Oberfläche: Profil (#acct) ----------
// Startseite „home“: Wer spielt? und Konto (nicht angemeldet / Elterngerät / verbundenes Gerät); Unterseiten mit „Zurück“
let ACC_LINK=null,ACC_P='';
const ACC_TITLE={home:'Profil',mail:'Mit E-Mail anmelden',sent:'Schau ins Postfach',confirm:'Fast geschafft',qr:'Gerät hinzufügen',scan:'QR-Code scannen',code:'Code eintippen',busy:'Einen Moment …'};
function accPane(p,msg){if(ACC_P==='scan'&&p!=='scan')scanStop();if(ACC_P==='qr'&&p!=='qr')pairEnd();ACC_P=p;
  document.querySelectorAll('#acct .apane').forEach(x=>x.classList.toggle('on',x.dataset.p===p));accSay(msg||'');
  $('acT').textContent=ACC_TITLE[p]||'Profil';$('acBack').classList.toggle('hidden',p==='home'||p==='busy');
  if(p==='home')accHome();
  if(p==='sent'){const pd=accPend();$('acTo').textContent=pd?pd.email:'';$('acPaste').value='';}
  if(p==='confirm'){const del=ACC_LINK&&ACC_LINK.intent==='loeschen';$('acCfT').textContent=del?'Gib die E-Mail-Adresse ein, dann wird das Konto gelöscht.':'Gib zur Sicherheit die E-Mail-Adresse noch einmal ein.';
    $('acOk2Row').classList.toggle('hidden',del);$('acCopyN').classList.toggle('hidden',del);}
  if(p==='code')$('acCode').value='';
  if(p==='scan')scanStart();
  $('acSend').disabled=$('acFin').disabled=$('acGo').disabled=$('acJoin').disabled=false;
  $('acct').querySelector('.body').scrollTop=0;}
function accHome(){whoRows($('acList'),closeAcct);const on=onlineOn();
  $('acKonto').classList.toggle('hidden',!on);$('acLocal').classList.toggle('hidden',on);if(!on)return;
  const st=!ACC?'out':ACC.dev?'dev':'owner',n=regList().filter(x=>x.name||x.g).length,ns=n===1?'1 Spieler':n+' Spieler';
  document.querySelectorAll('#acct .acdo').forEach(x=>x.classList.toggle('on',x.dataset.s===st));
  $('acSt').classList.toggle('off',st==='out');$('acSt').querySelector('use').setAttribute('href',st==='out'?'#i-lock':'#i-check');
  $('acDel').textContent='Konto löschen';$('acLeave').textContent='Gerät vom Konto trennen';
  if(st==='out'){$('acStT').textContent='Nicht angemeldet';$('acStS').textContent='Die Spieler sind nur auf diesem Gerät.';
    const pd=accPend(),el=$('acPendN');el.textContent='';el.classList.toggle('hidden',!pd);
    if(pd){el.append(`Ein Anmelde-Link ist unterwegs an ${pd.email}. `);const b=document.createElement('button');b.className='lnk';b.id='acPendGo';b.textContent='Anmeldung fortsetzen';b.onclick=()=>accPane('sent');el.append(b);}
    if(store.get('pgt_acct_gone')){store.del('pgt_acct_gone');accSay('Dieses Gerät ist nicht mehr mit dem Konto verbunden. Die Spieler bleiben hier.');}}
  else if(st==='owner'){$('acStT').textContent='Angemeldet';$('acStS').textContent=`${accMask(ACC.email)} · ${ns} gesichert`;accDevs();}
  else{$('acStT').textContent='Mit dem Konto verbunden';$('acStS').textContent=`${ACC.mail?'Konto von '+ACC.mail+' · ':''}${ns} gesichert`;}}
// Elterngerät: Liste der verbundenen Geräte, Entfernen mit zweitem Tippen
function accDevs(){const el=$('acDevs');$('acDevT').classList.toggle('hidden',!el.children.length);
  devList().then(l=>{if(!accOn()||accDevice()||ACC_P!=='home')return;el.innerHTML='';$('acDevT').classList.toggle('hidden',!l.length);
    l.forEach(d=>{const r=document.createElement('div');r.className='devr';
      r.innerHTML='<svg class="i"><use href="#i-device"/></svg><span><b></b><small></small></span><button class="rbtn" aria-label="Gerät entfernen"><svg class="i"><use href="#i-close"/></svg></button>';
      r.querySelector('b').textContent=d.name;r.querySelector('small').textContent=d.ts?'Seit '+new Date(d.ts).toLocaleDateString('de-DE'):'';
      const x=r.querySelector('button');let arm=0;
      x.onclick=async()=>{if(Date.now()-arm>4000){arm=Date.now();x.classList.add('arm');x.textContent='Entfernen?';return;}
        x.disabled=true;try{await fsReq('DELETE',`accounts/${ACC.uid}/devices/${d.id}`);accSay(`${d.name} ist nicht mehr verbunden.`,true);r.remove();$('acDevT').classList.toggle('hidden',!el.children.length);}
        catch(e){x.disabled=false;accSay(accErr(e));}};
      el.appendChild(r);});}).catch(()=>{});}
function accSay(m,ok){$('acMsg').textContent=m;$('acMsg').classList.toggle('ok',!!ok);}
function openAcct(p){$('acct').classList.remove('hidden');accPane(p||'home');
  if(!p&&accOn())accSync().then(r=>{if(r&&r.gone){reloadAs(regList().length?regList()[0].id:newSlotId());return;}if(!$('acct').classList.contains('hidden')&&ACC_P==='home')accHome();})
    .catch(e=>{if(accGone(e)&&ACC_P==='home')accHome();});}
function closeAcct(){accPane('');$('acct').classList.add('hidden');ACC_LINK=null;accLabel();if(G.phase==='menu')maybeWelcome();}
// Profil-Taste oben rechts: Haken, wenn das Gerät mit einem Konto verbunden ist
function accLabel(){const on=accOn();$('profBtn').classList.toggle('on',on);
  $('profBtn').setAttribute('aria-label',on?'Profil: Spieler und Konto (angemeldet)':'Profil: Spieler und Konto');}
async function accFinishUI(code,email,consent,intent){accPane('busy');
  try{await accFinish(code,email,consent);
    if(intent==='loeschen'){await accDelete();accPane('home');accSay('Das Konto ist gelöscht. Die Spieler auf diesem Gerät bleiben.',true);return;}
    const r=await accSync();if(r&&r.gone){reloadAs(regList().length?regList()[0].id:newSlotId());return;}
    accLabel();accPane('home');
    accSay(r&&r.added?(r.added===1?'Angemeldet! 1 Spieler aus dem Konto ist jetzt auf diesem Gerät.':`Angemeldet! ${r.added} Spieler aus dem Konto sind jetzt auf diesem Gerät.`):'Angemeldet! Jetzt kannst du weitere Geräte hinzufügen.',true);}
  catch(e){accPane(ACC?'home':accPend()?'sent':'confirm');accSay(accErr(e));}}
// Startet die Seite mit dem Link aus der E-Mail? Dann Anmeldung abschließen (true = startFlow macht nichts weiter)
function accLanding(){if(!onlineOn())return false;const q=new URLSearchParams(location.search);
  if(q.get('mode')!=='signIn'||!q.get('oobCode'))return false;
  const link={code:q.get('oobCode'),intent:q.get('konto')||'',url:location.href};
  try{history.replaceState(null,'',accBackUrl('').replace(location.origin,''))}catch(e){}
  const pd=accPend();sess.set('pgt_picked','1');
  if(pd){$('acct').classList.remove('hidden');accFinishUI(link.code,pd.email,pd.ts,link.intent||pd.intent);}
  else{ACC_LINK=link;openAcct('confirm');}
  return true;}
// QR-Code mit der normalen Kamera-App gescannt: Seite startet mit ?koppeln=CODE
function pairLanding(){const c=new URLSearchParams(location.search).get('koppeln');if(!c)return false;
  try{history.replaceState(null,'',accBackUrl('').replace(location.origin,''))}catch(e){}
  if(!onlineOn())return false;sess.set('pgt_picked','1');$('acct').classList.remove('hidden');accPane('home');pairJoin(c);return true;}
function accStart(){accLabel();if(accOn())accSync().then(r=>{if(r&&r.gone)reloadAs(regList().length?regList()[0].id:newSlotId());}).catch(accGone);}

$('profBtn').onclick=()=>openAcct();
$('acX').onclick=$('acClose').onclick=closeAcct;
$('acBack').onclick=()=>accPane('home');
$('acNew').onclick=newPlayer;
$('acMailBtn').onclick=()=>accPane('mail');
$('acScanBtn').onclick=()=>accPane('scan');
$('acCodeBtn').onclick=$('acScanCode').onclick=()=>accPane('code');
$('acAdd').onclick=pairShow;$('acPNew').onclick=pairShow;
$('acJoin').onclick=()=>{$('acJoin').disabled=true;pairJoin($('acCode').value).finally(()=>{$('acJoin').disabled=false;});};
$('acCode').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();$('acJoin').click();}});
$('acSend').onclick=async()=>{const em=$('acMail').value.trim();
  if(!MAILRE.test(em)){accSay('Bitte eine E-Mail-Adresse eingeben, z. B. name@beispiel.de.');$('acMail').focus();return;}
  if(!$('acOk').checked){accSay('Bitte zuerst das Häkchen setzen (das machen deine Eltern).');$('acOkRow').classList.add('nudge');setTimeout(()=>$('acOkRow').classList.remove('nudge'),500);return;}
  $('acSend').disabled=true;accSay('Link wird geschickt …');
  try{await accSend(em,Date.now(),'');$('acMail').blur();accPane('sent');}catch(e){$('acSend').disabled=false;accSay(accErr(e));}};
$('acMail').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();$('acSend').click();}});
$('acGo').onclick=()=>{const c=accCode($('acPaste').value),pd=accPend();
  if(!c){accSay('Das ist nicht der Link aus der E-Mail. Kopiere den ganzen Link.');return;}
  if(!pd){ACC_LINK=c;accPane('confirm');return;}
  $('acGo').disabled=true;accFinishUI(c.code,pd.email,pd.ts,c.intent||pd.intent);};
$('acPaste').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();$('acGo').click();}});
$('acAgain').onclick=async()=>{const pd=accPend();if(!pd){accPane('mail');return;}$('acAgain').disabled=true;
  try{await accSend(pd.email,pd.ts,pd.intent);accSay('Neuer Link ist unterwegs.',true);}catch(e){accSay(accErr(e));}$('acAgain').disabled=false;};
$('acOther').onclick=()=>{const pd=accPend();store.del(ACC_PK);accPane('mail');if(pd)$('acMail').value=pd.email;};
$('acFin').onclick=()=>{const em=$('acMail2').value.trim(),del=ACC_LINK&&ACC_LINK.intent==='loeschen';
  if(!ACC_LINK){accPane('home');return;}
  if(!MAILRE.test(em)){accSay('Bitte die E-Mail-Adresse eingeben, an die der Link ging.');return;}
  if(!del&&!$('acOk2').checked){accSay('Bitte zuerst das Häkchen setzen (das machen deine Eltern).');return;}
  $('acFin').disabled=true;accFinishUI(ACC_LINK.code,em,Date.now(),ACC_LINK.intent);};
$('acMail2').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();$('acFin').click();}});
// Link in der installierten App öffnen (iPhone: die App hat einen eigenen Speicher, die E-Mail öffnet aber Safari)
$('acCopy').onclick=()=>{const t=ACC_LINK?ACC_LINK.url:'';const ok=()=>accSay('Kopiert. Öffne die App, tippe auf Profil → Anmeldung fortsetzen und füge den Link dort ein.',true);
  (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(ok).catch(()=>accSay('Kopieren ging nicht. Halte den Link in der E-Mail gedrückt und kopiere ihn dort.'));};
$('acOut').onclick=()=>{accDrop();store.del(ACC_PK);accPane('home');accSay('Abgemeldet. Die Spieler bleiben auf diesem Gerät.',true);};
let accDelArm=0,accLeaveArm=0;
$('acDel').onclick=async()=>{if(Date.now()-accDelArm>4000){accDelArm=Date.now();$('acDel').textContent='Wirklich löschen? Nochmal tippen';return;}
  accDelArm=0;accPane('busy');
  try{const r=await accDelete();accPane(r==='mail'?'sent':'home');
    accSay(r==='mail'?'Fast fertig: Tippe auf den Link in der neuen E-Mail, dann ist das Konto gelöscht.':'Das Konto ist gelöscht. Die Spieler auf diesem Gerät bleiben.',true);}
  catch(e){accPane('home');accSay(accErr(e));}};
$('acLeave').onclick=()=>{if(Date.now()-accLeaveArm>4000){accLeaveArm=Date.now();$('acLeave').textContent='Wirklich trennen? Nochmal tippen';return;}accLeaveArm=0;pairLeave();};
