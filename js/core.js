// Grundlagen: Hilfsfunktionen, Speicher (mehrere Spieler pro Gerät), Mädchen-Version der Texte (fem), Koordinaten-Helfer.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

const $=id=>document.getElementById(id);
if(!window.THREE){$('loading').textContent='Die 3D-Grafik konnte nicht geladen werden. Bitte Seite neu laden.';throw new Error('three.js fehlt');}
const T3=THREE;
if(T3.ColorManagement)T3.ColorManagement.legacyMode=false;
// ================= Hilfsfunktionen =================
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
let R=Math.random;
const rand=(a,b)=>a+R()*(b-a);
const pick=a=>a[(R()*a.length)|0];
// Mehrere Spieler pro Gerät: Spielerdaten liegen unter "<schlüssel>@<id>" (der erste Spieler ohne Zusatz).
const PER=/^(pgt_profile|pgt_name|pgt_welcome|pgt_pos|pgt_mode|pgt4_best_)/;
let CUR=(()=>{try{return localStorage.getItem('pgt_cur')||''}catch(e){return''}})();
const nsk=k=>CUR&&PER.test(k)?k+'@'+CUR:k;
const store={get(k){try{return localStorage.getItem(nsk(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(nsk(k),v)}catch(e){}},
  del(k){try{localStorage.removeItem(nsk(k))}catch(e){}},keys(){try{return Object.keys(localStorage)}catch(e){return[]}}};
const sess={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}};

// ================= Mädchen-Version: Texte in weiblicher Form =================
// fem(): Personen-Nomen (Verteidiger → Verteidigerin) samt Artikel und Adjektiven davor, danach Pronomen
// (er → sie, ihm → ihr, sein → ihr, keiner → keine). Feste Wendungen vorab, Pronomen für Link/Ball bleiben.
// Die Texte im Code bleiben männlich; umgestellt wird beim Anzeigen (gApply, MutationObserver auf <body>),
// das Original merkt sich GTX, damit der Wechsel zurück zu „Jungen“ ohne Neuladen geht.
const fem=(()=>{
  const L='A-Za-zÄÖÜäöüß',
    N='Mitspieler|Gegenspieler|Aufbauspieler|Flügelspieler|Spielmacher|Spieler|Verteidiger|Ballführer|Angreifer|Läufer|Werfer|Helfer|Cutter|Center|Starter|Passmeister|Allrounder|Rekordjäger|Meister',
    POSN=/^(Center|Cutter)$/, // auch Positionsnamen: nur mit Artikel umstellen
    D={der:'die n',den:'die a',dem:'der d',des:'der g',ein:'eine n',einen:'eine a',einem:'einer d',eines:'einer g',
      dein:'deine n',deinen:'deine a',deinem:'deiner d',deines:'deiner g',mein:'meine n',meinen:'meine a',meinem:'meiner d',
      sein:'ihre n',seinen:'ihre a',seinem:'ihrer d',seines:'ihrer g',kein:'keine n',keinen:'keine a',keinem:'keiner d',
      jeder:'jede n',jeden:'jede a',jedem:'jeder d',dieser:'diese n',diesen:'diese a',diesem:'dieser d',
      zum:'zur d',vom:'von der d',beim:'bei der d'},
    PL=/^(die|deine|meine|keine|alle|allen|beide|beiden|zwei|drei|vier|manche|mehrere|ihre|seine|diese|deiner|unsere|eure)$/i,
    AF=/^[a-zäöüß]+(e|er|en|em|es)$/,NOADJ=/^(oder|aber|über|unter|hinter|wieder|immer|zwischen|neben|gegen|wenn|denn|dann|schon|oben|unten|hinten|vorne|eben|außer|mehr|weiter|sicher|später|einer|keiner|jemanden|niemanden)$/,
    ADJ=/^(frei|zweit|ander|eigen|rot|neu|erst|geschlagen|gedeckt|link|recht|vorder|stark|gut|echt|offen|nächst|best|ganz)(e|er|en|em)$/i,
    cap=(s,ref)=>ref[0]!==ref[0].toLowerCase()?s[0].toUpperCase()+s.slice(1):s,
    reN=new RegExp(`(^|[^${L}])(${N})(n|s)?(?![-${L}])`,'g'),reW=new RegExp(`((?:[${L}]+ ){0,3})$`);
  function nps(s){
    let out='',last=0,m;reN.lastIndex=0;
    while((m=reN.exec(s))){
      const ns=m.index+m[1].length,noun=m[2],suf=m[3]||'',ne=ns+noun.length+suf.length;
      const w=reW.exec(s.slice(last,ns))[1].split(' ').filter(Boolean);
      // rückwärts: Adjektive sammeln, bis ein Artikel kommt
      let det=null,j=w.length-1;
      for(;j>=0&&j>=w.length-3;j--){const t=w[j];
        if(D[t.toLowerCase()]||PL.test(t)){det=t;break;}
        if(!AF.test(t.toLowerCase())||NOADJ.test(t.toLowerCase())||(t[0]!==t[0].toLowerCase()&&!ADJ.test(t)))break;}
      let adj;if(det)adj=w.slice(j+1);else{adj=[];for(let k=w.length-1;k>=0&&ADJ.test(w[k])&&adj.length<2;k--)adj.unshift(w[k]);}
      if(POSN.test(noun)&&!det){continue;}
      const len=(det?det.length+1:0)+adj.reduce((a,x)=>a+x.length+1,0),st=ns-len;
      let r;
      if(suf==='n'||(det&&PL.test(det)))r=(det?det+' ':'')+adj.map(x=>x+' ').join('')+noun+'innen';
      else{let c='x',d='';if(det){const a=D[det.toLowerCase()].split(' ');c=a.pop();d=cap(a.join(' '),det);}
        if(suf==='s')c='g';
        const a2=adj.map(x=>c==='n'?x.replace(/er$/,'e'):c==='a'?x.replace(/en$/,'e'):c==='x'?x.replace(/er$/,'e').replace(/en$/,'e').replace(/em$/,'er'):x);
        r=(det?d+' ':'')+a2.map(x=>x+' ').join('')+noun+'in';}
      out+=s.slice(last,st)+r;last=ne;}
    return out+s.slice(last);}
  const rx=w=>new RegExp(`(^|[^${L}])(?:${w})(?![${L}])`,'g');
  const R=(w,t)=>[rx(w),t];
  // feste Wendungen (vor den allgemeinen Regeln)
  const PH=[R('zu dem, den er','zu der, die sie'),R('zu dem, der','zu der, die'),R('seiner und deiner','ihre und deine'),
    R('deiner ist','deine ist'),R('ein anderer frei','eine andere frei'),R('als Erster','als Erste'),R('der Einzige','die Einzige'),
    R('Zurück zum Mann','Zurück zur Gegenspielerin'),R('Freunde','Freundinnen'),
    R('Spielerkarte','Spielerinnenkarte'),R('Spielerkarten','Spielerinnenkarten'),R('der (hintere|andere) (hat|ist)','die $1 $2'),
    R('ein anderer aushilft','eine andere aushilft'),R('spiel den anderen','spiel die andere'),R('nicht deiner','nicht deine')];
  // Links (z. B. Spieler-Link auf „Sichern“) und Pronomen, die nicht für Personen stehen (Link, Ball): nicht umstellen
  const KEEP=[/()\S+:\/\/\S+/g,rx('(?:Schick|kopiere|Wer|kannst) ihn'),rx('Kommt er näher'),rx('lauf ihm entgegen')];
  const PRO=[R('Er','Sie'),R('er','sie'),R('ihn','sie'),R('Ihm','Ihr'),R('ihm','ihr'),
    R('([Ss])ein(e|en|em|er|es)?',(m,s,e)=>(s==='S'?'I':'i')+'hr'+(e||'')),
    [new RegExp(`(^|[^${L}])([Kk]e|[Ee])iner(?!\\s+(?:[a-zäöüß]+en\\s+)?[A-ZÄÖÜ])(?![${L}])`,'g'),(m,k)=>k+'ine']];
  const run=(s,[r,t])=>s.replace(r,(m,p,...g)=>p+(typeof t==='function'?t(m.slice(p.length),...g):t.replace(/\$(\d)/g,(x,i)=>g[i-1])));
  return s=>{if(!s||!/[a-z]/.test(s))return s;
    const keep=[];for(const r of KEEP)s=s.replace(r,(m,p)=>{keep.push(m.slice(p.length));return p+'\uE000'+(keep.length-1)+'\uE001';});
    for(const x of PH)s=run(s,x);
    s=nps(s);
    for(const x of PRO)s=run(s,x);
    return s.replace(/\uE000(\d+)\uE001/g,(m,i)=>keep[+i]);};
})();
let GIRL=false,gObs=null;
const GTX=new WeakMap(),GATTR=['placeholder','title','aria-label'];
function gText(n){const v=n.nodeValue,s=GTX.get(n);if(!s&&!GIRL)return;const o=s&&v===s[1]?s[0]:v,t=GIRL?fem(o):o;if(t!==v)n.nodeValue=t;GTX.set(n,[o,t]);}
function gAttr(el,a){const v=el.getAttribute(a);if(v==null)return;const m=el.__ga||(el.__ga={}),s=m[a];if(!s&&!GIRL)return;const o=s&&v===s[1]?s[0]:v,t=GIRL?fem(o):o;if(t!==v)el.setAttribute(a,t);m[a]=[o,t];}
function gApply(root){if(root.nodeType===3){gText(root);return;}if(root.nodeType!==1||/^(SCRIPT|STYLE)$/.test(root.tagName))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>/^(SCRIPT|STYLE)$/.test(n.parentNode.tagName)?2:1});let n;while((n=w.nextNode()))gText(n);
  const els=[root,...root.querySelectorAll('[placeholder],[title],[aria-label]')];els.forEach(el=>GATTR.forEach(a=>el.hasAttribute(a)&&gAttr(el,a)));}
function setGirl(on){GIRL=!!on;document.documentElement.classList.toggle('girl',GIRL);
  if(!gObs&&!GIRL)return;
  if(!gObs){gObs=new MutationObserver(rs=>rs.forEach(r=>{if(r.type==='characterData')gText(r.target);else if(r.type==='attributes')gAttr(r.target,r.attributeName);else r.addedNodes.forEach(gApply);}));
    gObs.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:GATTR});}
  gApply(document.body);}
// Weltkoordinaten: x nach rechts, z Richtung Korb (Korb bei 0/0). three.js: (x, y, -z)
const V=(x,y,z)=>new T3.Vector3(x,y,-z);

