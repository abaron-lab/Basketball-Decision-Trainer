// Liste der Spielzüge (PLAYS), Positions-Symbole, Kurznamen (SHORT) und Szenario-Aufbau.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// Positions-Symbol wie auf der Taktiktafel: Halbfeld mit markierter Position und Nummer
function posIcon(k){const P=POS[k],[x,y]=P.at;return`<svg viewBox="0 0 60 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
<rect x="2" y="2" width="56" height="44" rx="3"/><path d="M6 2v8a24 24 0 0 0 48 0V2"/><rect x="22" y="2" width="16" height="17"/><path d="M22 19a8 8 0 0 0 16 0"/>
<path d="M25.5 5.5h9"/><circle cx="30" cy="8.6" r="2.2"/>
<circle cx="${x}" cy="${y}" r="8.4" fill="${P.red?'#ff6b5e':'#ffc83d'}" stroke="#0d1322" stroke-width="1.5"/><text x="${x}" y="${y+4.2}" text-anchor="middle" fill="#1a1300" stroke="none" font-family="Nunito,Arial,sans-serif" font-weight="900" font-size="12.5">${P.num}</text></svg>`;}
const posBadge=k=>`<i class="posb">${POS[k].num}</i>`;
const PLAYS={
  top:{pos:'pg',name:'Aufbau über die Mitte',desc:'Ball nach vorne bringen und die Verteidigung lesen',T:[3.6,3.0,2.6],vars:(M)=>M===5?['drive','helpL','helpR','sag','helpC','helpK']:['drive','helpL','helpR','sag','helpC'],build:buildTop},
  break:{pos:'pg',name:'Schnellangriff',desc:'Ballgewinn! 3 gegen 2 nach vorne',T:[3.3,2.9,2.5],vars:()=>['drive','stopL','stopR'],build:buildBreak},
  wing:{pos:'pg',name:'Angriff über den Flügel',desc:'Von der Seite zum Korb ziehen',T:[3.4,3.0,2.6],vars:(M)=>M===5?['drive','helpTop','helpC','helpK','sag']:['drive','helpTop','helpC','sag'],build:buildWing},
  give:{pos:'pg',name:'Pass und geh',desc:'Nach dem Pass: schneiden oder Platz machen?',T:[3.6,3.1,2.7],vars:()=>['cut','stay'],build:buildGive},
  backdoor:{pos:'pg',name:'Backdoor-Cut',desc:'Der Verteidiger stellt den Passweg zu …',T:[3.6,3.0,2.6],vars:(M,L)=>L>=2?['cut','cut','helpC','gap']:['cut','gap'],build:buildBackdoor},
  wcatch:{pos:'wing',name:'Pass auf den Flügel',desc:'Fang den Ball und lies deinen Verteidiger',T:[3.6,3.1,2.7],vars:(M)=>M===5?['shot','drive','helpC','helpK']:['shot','drive','helpC'],build:buildWCatch},
  wcut:{pos:'wing',name:'Ohne Ball: Backdoor?',desc:'Wo steht dein Verteidiger?',T:[3.4,3.0,2.6],vars:()=>['deny','sag','dribble'],build:buildWCut},
  wbreak:{pos:'wing',name:'Schnellangriff als Läufer',desc:'Lauf die Seitenlinie entlang nach vorne',T:[3.4,3.0,2.6],vars:()=>['drive','stopPG','stopOR'],build:buildWBreak},
  xpass:{pos:'wing',name:'Extra-Pass',desc:'Der Aufbau zieht und passt zu dir',T:[3.6,3.1,2.7],vars:()=>['open','close','fly'],build:buildXPass},
  two:{pos:'wing',name:'Einer gegen zwei',desc:'Ein Verteidiger für zwei Angreifer',T:[3.4,3.0,2.6],vars:()=>['toYou','stayK','middle'],build:buildTwo},
  cpost:{pos:'center',name:'Ball am Brett',desc:'Dreh dich zur Mitte und lies die Hilfe',T:[3.6,3.2,2.8],vars:(M)=>M===5?['drive','helpW','helpT','helpK']:['drive','helpW','helpT'],build:buildCPost},
  chigh:{pos:'center',name:'Ball an der Freiwurflinie',desc:'Komm hoch und fordere den Ball',T:[3.4,3.0,2.6],vars:()=>['shot','drive','backdoor'],build:buildCHigh},
  cdive:{pos:'center',name:'Aufbau zieht zum Korb',desc:'Du hast keinen Ball. Was machst du?',T:[3.4,3.0,2.6],vars:()=>['help','stay','helpW'],build:buildCDive},
  dball:{pos:'def',name:'Gegenspieler mit Ball',desc:'Dein Gegenspieler bekommt den Ball',T:[3.2,2.8,2.4],vars:()=>['wing','top','corner'],build:buildDBall},
  dpass:{pos:'def',name:'Ein Pass entfernt',desc:'Der Ball ist beim Nachbarn',T:[3.2,2.8,2.4],vars:()=>['wing','top','post'],build:buildDPass},
  dhelp:{pos:'def',name:'Zwei Pässe entfernt',desc:'Der Ball ist auf der anderen Seite',T:[3.2,2.8,2.4],vars:()=>['wing','corner','top'],build:buildDHelp},
  drot:{pos:'def',name:'Aushelfen',desc:'Der Ballführer ist an seinem Verteidiger vorbei',T:[3.2,2.8,2.4],vars:()=>['top','mid','base'],build:buildDRot},
  dclose:{pos:'def',name:'Zurück zum Gegenspieler',desc:'Der Ball kommt zu deinem Gegenspieler',T:[3.4,3.0,2.6],vars:()=>['wing','corner','top'],build:buildDClose},
  djump:{pos:'def',name:'Mitgehen beim Pass',desc:'Der Ball wandert. Wo stehst du jetzt?',T:[3.4,3.0,2.6],vars:()=>['away','toward'],build:buildDJump},
  dback:{pos:'def',name:'Zurück in die Abwehr',desc:'Ballverlust! Sprint zurück. Wohin?',T:[3.4,3.0,2.6],vars:()=>['first','ball','man'],build:buildDBack},
  wspace:{pos:'wing',name:'Mitspieler zieht zum Korb',desc:'Ohne Ball: in die Ecke oder in die Lücke?',T:[3.4,3.0,2.6],vars:()=>['corner','gap'],build:buildWSpace},
  wcorner:{pos:'wing',name:'Ball in der Ecke',desc:'Pass ans Brett, Grundlinie oder Wurf?',T:[3.6,3.1,2.7],vars:()=>['post','base','shot'],build:buildWCorner},
  dcut:{pos:'def',name:'Backdoor verteidigen',desc:'Dein Gegenspieler schneidet hinter deinem Rücken',T:[3.4,3.0,2.6],vars:()=>['cut','fake'],build:buildDCut},
  dtwo:{pos:'def',name:'Unterzahl 1 gegen 2',desc:'Schnellangriff gegen dich allein',T:[3.4,3.0,2.6],vars:()=>['early','late'],build:buildDTwo},
  rimrun:{pos:'center',name:'Rim Run',desc:'Schnellangriff: Sprint zum Korb oder hinten bleiben?',T:[3.6,3.1,2.7],vars:()=>['run','back'],build:buildRimRun},
  dkick:{pos:'pg',name:'Durchbruch & Kick-out',desc:'Zieh in die Zone. Wer springt dir in den Weg?',T:[3.4,3.0,2.6],vars:(M)=>M===5?['lay','kickL','kickR','dump','kickK']:['lay','kickL','kickR','dump'],build:(v,T,L,M)=>buildDKick(v,T,L,M,'top')},
  plong:{pos:'pg',name:'Ballgewinn: langer Pass?',desc:'Schau sofort nach vorne!',T:[3.2,2.8,2.4],vars:()=>['longL','longR','drive'],build:(v,T,L,M)=>buildLong(v,T,L,M,'pg')},
  wdrive:{pos:'wing',name:'Durchbruch vom Flügel',desc:'Zieh zum Korb und lies die Hilfe',T:[3.4,3.0,2.6],vars:(M)=>M===5?['lay','kickTop','kickOW','dump','kickK']:['lay','kickTop','dump','kickOW'],build:(v,T,L,M)=>buildDKick(v,T,L,M,'wing')},
  clong:{pos:'center',name:'Rebound & langer Pass',desc:'Du hast den Rebound. Wer ist vorne frei?',T:[3.2,2.8,2.4],vars:()=>['longL','longR','outlet'],build:(v,T,L,M)=>buildLong(v,T,L,M,'center')},
  swing:{pos:'pg',name:'Ball umkehren',desc:'Die Abwehr steht auf einer Seite. Wohin mit dem Ball?',T:[3.6,3.1,2.7],vars:()=>['swing','gap','drive'],build:buildSwing},
  cflash:{pos:'center',name:'Flash-Cut',desc:'Dein Flügel braucht Hilfe. Zum Ball laufen oder unten bleiben?',T:[3.4,3.0,2.6],vars:()=>['flash','busy'],build:buildCFlash},
  creb:{pos:'center',name:'Offensiv-Rebound',desc:'Dein Flügel wirft daneben. Du holst den Ball. Und jetzt?',T:[3.6,3.1,2.7],vars:(M)=>M===5?['put','kickO','kickP','kickK']:['put','kickO','kickP'],build:buildCReb},
  crun:{pos:'center',name:'Rim Run mit Ball',desc:'Du sprintest zum Korb und bekommst den Ball im Lauf',T:[3.6,3.1,2.7],vars:()=>['lay','helpW','helpO'],build:buildCRun}
};
const playsOf=pos=>Object.keys(PLAYS).filter(k=>PLAYS[k].pos===pos);
// Kurznamen für die Auswahl im Menü (passt auf kleinen Handys in zwei Zeilen)
const SHORT={top:'Über die Mitte',wing:'Über den Flügel',wcatch:'Fangen & lesen',wcut:'Backdoor?',wbreak:'Läufer',cpost:'Ball am Brett',chigh:'Freiwurflinie',cdive:'Ohne Ball',dball:'Am Ball',dpass:'Ein Pass weg',dhelp:'Zwei Pässe weg',drot:'Aushelfen',dclose:'Zurück zum Mann',dkick:'Durchbruch',plong:'Langer Pass',wdrive:'Durchbruch',clong:'Rebound',swing:'Umkehren',cflash:'Flash-Cut',djump:'Mitgehen',dback:'Zurück',wspace:'Platz machen',wcorner:'Ecke',dcut:'Backdoor',dtwo:'1 gegen 2',creb:'Rebound vorne',crun:'Rim Run mit Ball'};

function buildScenario(seed,play,variant){
  R=mulberry(seed);clearPlayers();
  const P=PLAYS[play],T=P.T[G.level-1];
  const info=P.build(variant,T,G.level,G.mode);
  const original=kickComparison?.version==='before';
  if(original&&!comparisonFloor)comparisonFloor=courtTexture();
  floorMaterial.map=original?comparisonFloor:trainingFloor;
  Hd=role('H');
  // Tasten für Pässe
  players.forEach(p=>{p.x=p.path[0][1];p.z=p.path[0][2];p.pt=0;p.ang=angTo(-p.x,-p.z);p.rig.cur={};});
  const owner=info.feed?role(info.feed.from):info.ballAt?role(info.ballAt):Hd;
  ball.owner=owner;ball.hold=!!info.hold;ball.fl=null;owner.drib=0;
  // Kamera-Rahmen für den Entscheidungsmoment
  const end=p=>{const l=p.path[p.path.length-1];return pt(l[1],l[2]);};
  let he=end(Hd),dl=Math.hypot(he.x,he.z),dir;
  if(info.camFix){he=pt(info.camFix.x,info.camFix.z);dir=pt(info.camFix.dx,info.camFix.dz);}
  else{if(dl<3.5){const s0=pt(Hd.path[0][1],Hd.path[0][2]),d0=Math.hypot(s0.x,s0.z);dir=pt(-s0.x/d0,-s0.z/d0);}else dir=pt(-he.x/dl,-he.z/dl);}
  const ref=pt(he.x,Math.min(he.z,-5.2));
  const fitPts=[[0,rimHeight()+.95,.4],[-.9,rimHeight()+.85,.4],[.9,rimHeight()+.85,.4],[0,0,1.2]];
  // Nur wichtige Spieler einrahmen: du, dein Verteidiger, Helfer, Ballführer, anspielbare Mitspieler und ihre Verteidiger
  const rel=new Set([Hd,role('dH'),info.helper&&role(info.helper),owner,info.give&&role(info.give.to)]);(info.rel||[]).forEach(r=>rel.add(role(r)));
  players.forEach(p=>{if(p.sel){rel.add(p);rel.add(GUARD[p.role]);}});
  if(owner!==Hd)players.forEach(p=>{if(p.team==='def'&&Math.hypot(p.path[p.path.length-1][1]-owner.path[owner.path.length-1][1],p.path[p.path.length-1][2]-owner.path[owner.path.length-1][2])<2)rel.add(p);});
  players.forEach(p=>{const e=end(p);if(!rel.has(p)||p.trail||((e.x-ref.x)*dir.x+(e.z-ref.z)*dir.z<-1.2&&p!==Hd))return;fitPts.push([e.x,0,e.z],[e.x,2.1,e.z]);});
  {const e=end(Hd);fitPts.push([e.x-dir.x*.5,0,e.z-dir.z*.5]);}
  if(info.spots)info.spots.forEach(p=>fitPts.push([p.x,0,p.z],[p.x,1.2,p.z]));
  // Pass-Tasten: von links nach rechts, so wie die Mitspieler im Bild stehen
  {const cs=info.camSide||1,cx=ref.x-dir.x*5+dir.z*cs*.8,cz=ref.z-dir.z*5-dir.x*cs*.8,scr=p=>{const e=end(p),dx=e.x-cx,dz=e.z-cz;return Math.atan2(dx*dir.z-dz*dir.x,dx*dir.x+dz*dir.z);};
   let k=1;players.filter(p=>p.sel).sort((a,b)=>scr(a)-scr(b)).forEach(p=>p.key=k++);}
  R=Math.random;
  return Object.assign({seed,play,variant,T,he,dir,fitPts,camSide:1,labels:LBL_DEF,notes:{}},info);
}

