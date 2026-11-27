// Konto mit E-Mail-Link (freiwillig): Eltern melden sich ohne Passwort mit ihrer E-Mail-Adresse an, alle Spieler des Geräts
// liegen dann zusätzlich in Firestore unter accounts/<uid>/players/<spieler-uid> und werden zwischen Geräten abgeglichen.
// Firebase Authentication per REST (kein SDK): sendOobCode (EMAIL_SIGNIN) → Link in der E-Mail → signInWithEmailLink.
// Ein Konto entsteht erst mit dem Klick auf den Link (bestätigte Adresse = Double-Opt-in). Ohne config.js bleibt alles lokal.
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
// Stand aus dem Konto in einen Slot schreiben (wie beim Spieler-Link, aber ohne Neuladen)
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
// Rücksprung-Adresse: diese Seite mit ihren Parametern (Team, Mädchen/Jungen), ohne alte Anmelde-Parameter
// (Parameter unverändert übernehmen, nicht neu kodieren)
function accBackUrl(intent){const s=location.search.replace(/^\?/,'').split('&').filter(x=>x&&!/^(mode|oobCode|apiKey|lang|continueUrl|tenantId|konto)(=|$)/.test(x));
  if(intent)s.push('konto='+intent);return location.origin+location.pathname+(s.length?'?'+s.join('&'):'');}
async function accSend(email,consent,intent){
  await idt('sendOobCode',{requestType:'EMAIL_SIGNIN',email,continueUrl:accBackUrl(intent),canHandleCodeInApp:true});
  store.set(ACC_PK,JSON.stringify({email,ts:consent||0,at:Date.now(),intent:intent||''}));}
async function accFinish(code,email,consent){
  const j=await idt('signInWithEmailLink',{email,oobCode:code});
  if(ACC&&ACC.uid!==j.localId)store.del(ACC_SK);
  ACC={uid:j.localId,email:j.email||email,it:j.idToken,rt:j.refreshToken,exp:Date.now()+(+j.expiresIn||3600)*1000,teams:[]};accSave();store.del(ACC_PK);
  // Konto-Dokument: Zeitpunkt der Einwilligung (einmal) und Teams mit Ranglisten-Einträgen
  const doc=await fsReq('GET',`accounts/${ACC.uid}`);
  if(doc){const f=doc.fields||{};ACC.teams=String(f.teams&&f.teams.stringValue||'').split(',').filter(Boolean);accSave();}
  else await fsReq('PATCH',`accounts/${ACC.uid}`,{fields:{consent:{integerValue:String(consent||Date.now())},teams:{stringValue:''}}});}
function accDrop(){clearTimeout(ACC_T);ACC_T=0;ACC=null;accSave();store.del(ACC_SK);accLabel();}
// Konto löschen: Ranglisten-Einträge des Kontos, alle Spieler im Konto, Konto-Dokument, zuletzt die Anmeldung selbst.
// Die Spieler auf diesem Gerät bleiben. Ist die letzte Anmeldung zu lange her, verlangt Firebase eine neue: dann kommt ein Link.
async function accDelete(){ACC_BUSY=true;clearTimeout(ACC_T);ACC_T=0;
  try{const uid=ACC.uid,teams=[...new Set([...(ACC.teams||[]),TEAMID])];
    for(const t of teams){
      const r=await fsReq('POST',`teams/${encodeURIComponent(t)}:runQuery`,{structuredQuery:{from:[{collectionId:'scores'}],where:{fieldFilter:{field:{fieldPath:'uid'},op:'EQUAL',value:{stringValue:uid}}}}});
      for(const d of(r||[]).filter(x=>x.document))await fsReq('DELETE',d.document.name.split('/documents/')[1]);}
    const j=await fsReq('GET',`accounts/${uid}/players?pageSize=100`);
    for(const d of(j&&j.documents)||[])await fsReq('DELETE',d.name.split('/documents/')[1]);
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
  if(/TOO_MANY|QUOTA|RESOURCE_EXHAUSTED/.test(m))return'Gerade gab es zu viele Versuche. Probier es später noch mal.';
  if(/USER_DISABLED/.test(m))return'Dieses Konto ist gesperrt.';
  return`Das hat gerade nicht geklappt. Probier es später noch mal. (${m.slice(0,40)})`;}
const accMask=e=>{const[a,b]=String(e||'').split('@');return b?a.slice(0,1)+'•••@'+b:'';};

// ---------- Oberfläche (#acct) ----------
let ACC_LINK=null,ACC_NEWP=0;
function accPane(p,msg){document.querySelectorAll('#acct .apane').forEach(x=>x.classList.toggle('on',x.dataset.p===p));$('acMsg').textContent=msg||'';
  $('acMsg').classList.toggle('ok',false);
  if(p==='sent'){const pd=accPend();$('acTo').textContent=pd?pd.email:'';$('acPaste').value='';}
  if(p==='in'){$('acWho').textContent=accMask(ACC.email);const n=regList().filter(x=>x.name||x.g).length;
    $('acInfo').textContent=`${n===1?'1 Spieler':n+' Spieler'} gesichert`+(ACC.last?` · zuletzt ${accAgo(ACC.last)}`:'');$('acDel').textContent='Konto löschen';}
  if(p==='confirm'){const del=ACC_LINK&&ACC_LINK.intent==='loeschen';$('acCfT').textContent=del?'Gib die E-Mail-Adresse ein, dann wird das Konto gelöscht.':'Fast geschafft! Gib zur Sicherheit die E-Mail-Adresse noch einmal ein.';
    $('acOk2Row').classList.toggle('hidden',del);}
  $('acT').textContent=p==='in'?'Gesichert':p==='sent'?'Schau ins Postfach':p==='busy'?'Einen Moment …':'Spieler sichern';
  $('acSend').disabled=$('acFin').disabled=$('acGo').disabled=false;}
function accAgo(t){const s=(Date.now()-t)/1000;return s<90?'gerade eben':s<3600?`vor ${Math.round(s/60)} Min.`:s<86400?`vor ${Math.round(s/3600)} Std.`:new Date(t).toLocaleDateString('de-DE');}
function accSay(m,ok){$('acMsg').textContent=m;$('acMsg').classList.toggle('ok',!!ok);}
function openAcct(p){if(!onlineOn()){openSave();return;}
  $('acct').classList.remove('hidden');accPane(p||(ACC?'in':accPend()?'sent':'out'));
  if(!p&&ACC)accSync().then(()=>{if(!$('acct').classList.contains('hidden')&&ACC)accPane('in');}).catch(()=>{});}
function closeAcct(){$('acct').classList.add('hidden');ACC_LINK=null;accLabel();
  if(ACC_NEWP&&regList().length>1){ACC_NEWP=0;openWho(false);return;}ACC_NEWP=0;if(G.phase==='menu')maybeWelcome();}
// Taste auf der Spielerkarte und Erinnerung in der Auswertung
function accLabel(){const on=accOn();$('pcSave').innerHTML=svgI(on?'check':'link')+(on?'Gesichert':'Sichern');
  if(onlineOn()){$('sSave').querySelector('b').textContent='Mit der E-Mail deiner Eltern auf jedes Gerät';}
  $('whoAcct').classList.toggle('hidden',!onlineOn()||on);}
async function accFinishUI(code,email,consent,intent){accPane('busy');
  try{await accFinish(code,email,consent);
    if(intent==='loeschen'){await accDelete();accPane('out');accSay('Das Konto ist gelöscht. Die Spieler auf diesem Gerät bleiben.',true);return;}
    const r=await accSync();ACC_NEWP=r?r.added:0;accPane('in');
    accSay(r&&r.added?(r.added===1?'Angemeldet! 1 Spieler aus dem Konto ist jetzt auf diesem Gerät.':`Angemeldet! ${r.added} Spieler aus dem Konto sind jetzt auf diesem Gerät.`):'Angemeldet! Dein Spieler ist jetzt gesichert.',true);
    if(r&&r.gone)reloadAs(regList().length?regList()[0].id:newSlotId());}
  catch(e){accPane(ACC?'in':accPend()?'sent':'confirm');accSay(accErr(e));}}
// Startet die Seite mit dem Link aus der E-Mail? Dann Anmeldung abschließen (true = startFlow macht nichts weiter)
function accLanding(){if(!onlineOn())return false;const q=new URLSearchParams(location.search);
  if(q.get('mode')!=='signIn'||!q.get('oobCode'))return false;
  const link={code:q.get('oobCode'),intent:q.get('konto')||'',url:location.href};
  try{history.replaceState(null,'',accBackUrl('').replace(location.origin,''))}catch(e){}
  const pd=accPend();sess.set('pgt_picked','1');
  if(pd){$('acct').classList.remove('hidden');accFinishUI(link.code,pd.email,pd.ts,link.intent||pd.intent);}
  else{ACC_LINK=link;openAcct('confirm');}
  return true;}
function accStart(){accLabel();if(accOn())accSync().then(r=>{if(r&&r.gone)reloadAs(regList().length?regList()[0].id:newSlotId());}).catch(()=>{});}

$('acX').onclick=$('acClose').onclick=closeAcct;
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
$('acAgain').onclick=async()=>{const pd=accPend();if(!pd){accPane('out');return;}$('acAgain').disabled=true;
  try{await accSend(pd.email,pd.ts,pd.intent);accSay('Neuer Link ist unterwegs.',true);}catch(e){accSay(accErr(e));}$('acAgain').disabled=false;};
$('acOther').onclick=()=>{const pd=accPend();store.del(ACC_PK);accPane('out');if(pd)$('acMail').value=pd.email;};
$('acFin').onclick=()=>{const em=$('acMail2').value.trim(),del=ACC_LINK&&ACC_LINK.intent==='loeschen';
  if(!ACC_LINK){accPane('out');return;}
  if(!MAILRE.test(em)){accSay('Bitte die E-Mail-Adresse eingeben, an die der Link ging.');return;}
  if(!del&&!$('acOk2').checked){accSay('Bitte zuerst das Häkchen setzen (das machen deine Eltern).');return;}
  $('acFin').disabled=true;accFinishUI(ACC_LINK.code,em,Date.now(),ACC_LINK.intent);};
$('acMail2').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();$('acFin').click();}});
// Link in der installierten App öffnen (iPhone: die App hat einen eigenen Speicher, die E-Mail öffnet aber Safari)
$('acCopy').onclick=()=>{const t=ACC_LINK?ACC_LINK.url:'';const ok=()=>accSay('Kopiert. Öffne die App, tippe auf Sichern und füge den Link dort ein.',true);
  (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(ok).catch(()=>accSay('Kopieren ging nicht. Halte den Link in der E-Mail gedrückt und kopiere ihn dort.'));};
$('acOut').onclick=()=>{accDrop();store.del(ACC_PK);accPane('out');accSay('Abgemeldet. Die Spieler bleiben auf diesem Gerät.',true);};
let accDelArm=0;
$('acDel').onclick=async()=>{if(Date.now()-accDelArm>4000){accDelArm=Date.now();$('acDel').textContent='Wirklich löschen? Nochmal tippen';return;}
  accDelArm=0;accPane('busy');
  try{const r=await accDelete();accPane(r==='mail'?'sent':'out');
    accSay(r==='mail'?'Fast fertig: Tippe auf den Link in der neuen E-Mail, dann ist das Konto gelöscht.':'Das Konto ist gelöscht. Die Spieler auf diesem Gerät bleiben.',true);}
  catch(e){accPane(ACC?'in':'out');accSay(accErr(e));}};
$('whoAcct').onclick=()=>{$('who').classList.add('hidden');sess.set('pgt_picked','1');openAcct();};
$('acPlain').onclick=()=>{$('acct').classList.add('hidden');openSave();};
