// Spielzustand, Lernziele (LZ), Spielerprofil und Abzeichen, Wegpunkte, Ball-Logik (Pässe, Flug, freier Ball).
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Spielzustand =================
const G={ts:1,stopElapsed:null,slowT:0,wave:-9,phase:'menu',pos:'pg',level:1,mode:4,noLimit:false,round:0,rounds:10,score:0,streak:0,bestStreak:0,results:[],sc:null,t:0,dStart:0,win:4,timers:[],replay:false,choice:null,snap:null,bag:[],plays:['top','break','wing','backdoor'],excite:0,saved:false};
const WIN=[4,2.5,1.8];
// Lernziele: Begriffe aus dem DBB-Leitfaden Minibasketball (Kap. 7.2), dazu „Guter Wurf“ (DBB-Spielkonzeption: Wofür spielen wir?)
// und „Mann-Mann-Verteidigung“ (Miniregeln: MMV-Pflicht). Quellen siehe Info-Seite und docs/TRAINER.md.
const LZ={luecke:{n:'Lücke erkennen',s:'Lücke',i:'up'},umspielen:{n:'Gegenspieler umspielen',s:'1 gegen 1',i:'spin'},ueberzahl:{n:'Überzahl nutzen',s:'Überzahl',i:'bolt'},
  lauf:{n:'In den Lauf passen',s:'In den Lauf',i:'cut'},zusammen:{n:'Zusammenspiel',s:'Zusammen',i:'pass'},anbieten:{n:'Anbieten und Orientieren',s:'Anbieten',i:'eye'},
  wurf:{n:'Guter Wurf',s:'Wurf',i:'ball'},vert:{n:'Mann-Mann-Verteidigung',s:'Abwehr',i:'shield'}};
// Zuordnung nach dem, was gelesen werden muss:
// - Lücke erkennen: Raum und Helfer lesen. Kommt keine Hilfe, ist der Weg frei (Lücke zum Durchschlüpfen),
//   oder ein Mitspieler steht in der Lücke zwischen zwei Verteidigern (Lücke für einen Pass, Leitfaden Kap. 3.1).
// - Gegenspieler umspielen: den eigenen Verteidiger lesen (steht neben dir statt vor dir, kommt mit Schwung angerannt).
// - Guter Wurf (Wurfauswahl): Ist Werfen richtig, zählt die Runde dazu. Wer wirft, obwohl Korbleger oder Pass besser waren,
//   bekommt zusätzlich einen Fehlversuch bei „Guter Wurf“ (lz2, siehe resolve), z. B. „lieber Korbleger als weiter Wurf“.
const LZ_OVR={'break':'ueberzahl',wbreak:'ueberzahl',two:'ueberzahl','backdoor:cut':'lauf','chigh:backdoor':'lauf','chigh:drive':'umspielen','wcatch:drive':'umspielen',
  'xpass:fly':'umspielen','give:cut':'zusammen','rimrun:run':'ueberzahl','swing:gap':'luecke','swing:drive':'umspielen',
  'plong:longL':'lauf','plong:longR':'lauf','plong:drive':'ueberzahl','clong:longL':'lauf','clong:longR':'lauf',crun:'ueberzahl'};
function lzOf(play,variant,ans,off){if(PLAYS[play]&&PLAYS[play].pos==='def')return'vert';const o=LZ_OVR[play+':'+variant]||LZ_OVR[play];if(o)return o;
  if(off)return'anbieten';if(ans.startsWith('pass:'))return'zusammen';return ans==='drive'?'luecke':'wurf';}
// Falscher Wurf (mit Ball): zählt zusätzlich als Fehlversuch bei „Guter Wurf“
function lz2Of(sc,choice,lz,off){return choice==='shot'&&sc.ans!=='shot'&&!off&&!sc.def&&lz!=='wurf'?'wurf':null;}
const lzKeys=r=>r.lz2?[r.lz,r.lz2]:[r.lz];
// ================= Spielerprofil =================
const PK='pgt_profile';
function jparse(v){try{return JSON.parse(v)||{}}catch(e){return{}}}
const PROFILE=Object.assign({age:store.get('pgt_mode')==='5'?'U12':'U10',num:7,skin:2,hair:0,hairC:1,games:0,rounds:0,correct:0,cat:{pass:[0,0],drive:[0,0],shot:[0,0],off:[0,0]},rtS:0,rtN:0,best:0,pos:{},xp:0,badges:{},lz:{}},jparse(store.get(PK)));
PROFILE.cat.def=PROFILE.cat.def||[0,0];PROFILE.lz=PROFILE.lz||{};
if(!PROFILE.uid){PROFILE.uid=Math.random().toString(36).slice(2,10);store.set(PK,JSON.stringify(PROFILE));}
function saveProf(){store.set(PK,JSON.stringify(PROFILE));regSync();}
// Mädchen oder Jungen (PROFILE.g = 'w' | 'm'; fehlt bei alten Profilen = Jungen). ?g=w im Link wählt für neue Spieler vor.
const GURL=(/[?&]g=([wm])(?![a-z])/.exec(location.search)||[])[1]||'';
setGirl(PROFILE.g==='w');
function myLook(){return{skin:PROFILE.skin,hair:PROFILE.hair,hairC:PROFILE.hairC,wrist:true};}
const LEVELS=[[0,'Rookie'],[300,'Talent'],[900,'Starter'],[2000,'Teamstütze'],[4000,'Allstar'],[7000,'Legende']];
function lvlOf(xp){let i=0;while(i<LEVELS.length-1&&xp>=LEVELS[i+1][0])i++;const a=LEVELS[i][0],b=LEVELS[i+1]?LEVELS[i+1][0]:null;return{i,name:LEVELS[i][1],a,b,f:b?(xp-a)/(b-a):1};}
const TIERS=['bronze','bronze','silver','silver','gold','diamond'],TIERN={bronze:'BRONZE',silver:'SILBER',gold:'GOLD',diamond:'DIAMANT'};
function ratings(){const P=PROFILE,acc=a=>(a[0]+1.5)/(a[1]+3),r=a=>Math.round(clamp(30+69*acc(a),30,99));
  const rt=P.rtN?P.rtS/P.rtN:2.4,tempo=Math.round(clamp(99-(rt-.7)*24,30,99));
  const it=[['LESEN',r([P.correct,P.rounds])],['TEMPO',tempo],['PASS',r(P.cat.pass)],['KORB',r(P.cat.drive)],['WURF',r(P.cat.shot)],['OHNE BALL',r(P.cat.off)]];
  return{ovr:Math.round(it[0][1]*.4+it[1][1]*.2+(it[2][1]+it[3][1]+it[4][1]+it[5][1])*.1),it};}
const BADGES=[
 {id:'first',n:'Erstes Spiel',d:'Spiele dein erstes Spiel.',i:'play',c:'#4a86ff',t:P=>P.games>=1},
 {id:'perfect',n:'Perfekt',d:'Alle Spielzüge eines Spiels richtig.',i:'star',c:'#f5b800',t:(P,g)=>g&&g.n>=5&&g.ok===g.n},
 {id:'streak5',n:'Heiße Hand',d:'5 richtige Entscheidungen hintereinander.',i:'flame',c:'#ff8a3d',t:P=>P.best>=5,p:P=>[P.best,5]},
 {id:'streak10',n:'Unaufhaltsam',d:'10 richtige Entscheidungen hintereinander.',i:'flame',c:'#ff4d4d',t:P=>P.best>=10,p:P=>[P.best,10]},
 {id:'fast',n:'Blitzschnell',d:'Richtig entschieden in unter 1 Sekunde.',i:'bolt',c:'#e8c400',t:(P,g)=>g&&g.fast},
 {id:'passer',n:'Passmeister',d:'25 richtige Pässe insgesamt.',i:'pass',c:'#a66bff',t:P=>P.cat.pass[0]>=25,p:P=>[P.cat.pass[0],25]},
 {id:'offball',n:'Ohne Ball stark',d:'10 richtige Entscheidungen ohne Ball.',i:'cut',c:'#1fb5a3',t:P=>P.cat.off[0]>=10,p:P=>[P.cat.off[0],10]},
 {id:'allpos',n:'Allrounder',d:'Spiele auf allen vier Positionen.',i:'tri',c:'#2ecc71',t:P=>['pg','wing','center','def'].every(k=>P.pos[k]),p:P=>[['pg','wing','center','def'].filter(k=>P.pos[k]).length,4]},
 {id:'pro',n:'Profi',d:'3 Sterne auf dem Level Profi.',i:'trophy',c:'#ffa000',t:(P,g)=>g&&g.level===3&&g.stars===3},
 {id:'u12',n:'Großes Feld',d:'3 Sterne im 5 gegen 5.',i:'shield',c:'#3f8cff',t:(P,g)=>g&&g.mode===5&&g.stars===3},
 {id:'games10',n:'Trainingsfleiß',d:'10 Spiele gespielt.',i:'medal',c:'#9aa6bd',t:P=>P.games>=10,p:P=>[P.games,10]},
 {id:'record',n:'Rekordjäger',d:'Deinen eigenen Rekord verbessert.',i:'target',c:'#ff5a8a',t:(P,g)=>g&&g.record}];
function lzRows(z){return Object.keys(LZ).map(k=>{const a=z[k]||[0,0],q=a[1]?a[0]/a[1]:0;
  return`<div class="lzr"><span class="ic">${svgI(LZ[k].i)}</span><span>${LZ[k].n}</span><small>${a[1]?Math.round(q*100)+' % · '+a[0]+'/'+a[1]:'noch nicht geübt'}</small><i><em style="width:${Math.round(q*100)}%"></em></i></div>`;}).join('');}
function bProg(b){if(!b.p)return null;const[c,g]=b.p(PROFILE);return{c:Math.min(c,g),g,f:clamp(c/g,0,1)};}
const bpBar=pr=>pr&&pr.c>0?`<i class="bp"><em style="width:${Math.round(pr.f*100)}%"></em></i>`:'';
// Nächstes Ziel: das offene Abzeichen mit Fortschritt, das am nächsten dran ist
function nextGoal(){let best=null;BADGES.forEach(b=>{if(PROFILE.badges[b.id])return;const pr=bProg(b);if(pr&&pr.c>0&&(!best||pr.f>best.pr.f))best={b,pr};});
  if(!best){const b=BADGES.find(x=>!PROFILE.badges[x.id]&&x.p);if(b)best={b,pr:bProg(b)};}return best;}
function medal(b,on,big){return`<span class="medal${on?' on':''}${big?' big':''}" style="--mc:${b.c}">${svgI(b.i)}</span>`;}
function recordGame(g){ // nach jedem Spiel: Werte, XP und neue Abzeichen
  const P=PROFILE,before=lvlOf(P.xp).i;P.games++;P.pos[G.pos]=1;
  G.results.forEach(r=>{P.rounds++;if(r.ok)P.correct++;const k=r.def?'def':r.off?'off':r.ans.startsWith('pass:')?'pass':r.ans==='drive'?'drive':'shot';P.cat[k][1]++;if(r.ok)P.cat[k][0]++;if(r.ok&&r.rt!=null){P.rtS+=r.rt;P.rtN++;}
    lzKeys(r).forEach(k=>{const z=P.lz[k]||(P.lz[k]=[0,0]);z[1]++;if(r.ok)z[0]++;});});
  P.best=Math.max(P.best,G.bestStreak);
  const neu=BADGES.filter(b=>!P.badges[b.id]&&b.t(P,g));neu.forEach(b=>P.badges[b.id]=Date.now());
  const xp=Math.round(G.score/10)+neu.length*50;P.xp+=xp;saveProf();
  askPersist();const L=lvlOf(P.xp);return{neu,xp,up:L.i>before?L.name:null};}
function later(t,fn){G.timers.push({t:G.t+t,fn});}
let players=[],ROLE={},GUARD={},Hd=null,HTEAM='off';
function role(r){return ROLE[r];}

function addP(r,team,num,o={}){
  const p={act:null,jy:0,role:r,team,num,x:0,z:0,path:null,pt:0,lin:false,spd:0,vx:0,vz:0,ph:R()*6,armsUp:0,drib:0,dside:1,ang:Math.PI,sel:o.sel!==undefined?o.sel:(team==='off'&&r!=='H'),name:o.name||'',key:0,finish:o.finish||'shot'};
  if(r==='H'){num=PROFILE.num;HTEAM=team;}
  else{
    const taken=new Set(players.filter(other=>other.team===team).map(other=>other.num));
    if(team===HTEAM)taken.add(PROFILE.num);
    if(taken.has(num)){num=11;while(taken.has(num))num++;}
  }
  p.num=num;
  p.rig=(GLB.ok?makeGLBRig:makeRig)(team===HTEAM?'home':'away',num,r==='H'?myLook():null);scene.add(p.rig.root);p.blobs=[blob(),blob(),blob()];players.push(p);ROLE[r]=p;return p;}
function clearPlayers(){players.forEach(p=>{scene.remove(p.rig.root);p.blobs.forEach(b=>{scene.remove(b);b.material.dispose();});});players=[];ROLE={};GUARD={};HTEAM='off';}
function setPath(p,pts,lin){p.path=pts;p.pt=0;p.lin=!!lin;}
function goTo(p,list,lin){setPath(p,[[0,p.x,p.z],...list],lin);}
function evalPath(P,t,lin){const L=P[P.length-1];if(t<=P[0][0])return[P[0][1],P[0][2]];if(t>=L[0])return[L[1],L[2]];
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];if(t<=b[0]){let u=(t-a[0])/(b[0]-a[0]);if(!lin)u=smooth(u);return[lerp(a[1],b[1],u),lerp(a[2],b[2],u)];}}return[L[1],L[2]];}
function updP(p,dt){
  p.travel=0;
  if(p.path&&dt>0&&G.phase!=='menu')footSfx(p,dt);
  if(p.path&&dt>0){p.pt+=dt;const[x,z]=evalPath(p.path,p.pt,p.lin);p.travel=Math.hypot(x-p.x,z-p.z);const vx=(x-p.x)/dt,vz=(z-p.z)/dt;p.vx=lerp(p.vx,vx,.25);p.vz=lerp(p.vz,vz,.25);p.spd=Math.hypot(p.vx,p.vz);p.x=x;p.z=z;}
  else if(dt>0){p.vx*=.8;p.vz*=.8;p.spd=Math.hypot(p.vx,p.vz);}
  p.ph+=dt*(1.2+p.spd*1.9);p.armsUp=Math.max(0,p.armsUp-dt*.55);
}
// Schuhquietschen (selten und leise: höchstens alle 0,9 s, nicht jedes Mal) an Wegpunkten mit sehr scharfem
// Richtungswechsel oder harter Bremsung bei hohem Tempo (aus der Wegpunktliste,
// nicht aus der geglätteten Geschwindigkeit). Schritte nur für den eigenen Spieler und den Ballführer, leise.
function footSfx(p,dt){const P=p.path,t0=p.pt,t1=p.pt+dt;
  if(G.phase==='approach'&&p.plantTime>t0&&p.plantTime<=t1)sfx.step(p,.38);
  for(let i=1;i<P.length;i++){const b=P[i];if(b[0]<=t0)continue;if(b[0]>t1)break;
    const a=P[i-1],c=P[i+1],da=b[0]-a[0];if(da<=.05)continue;
    const v1x=(b[1]-a[1])/da,v1z=(b[2]-a[2])/da,s1=Math.hypot(v1x,v1z);
    let s2=0,cs=1;if(c&&c[0]-b[0]>.05){const db=c[0]-b[0],v2x=(c[1]-b[1])/db,v2z=(c[2]-b[2])/db;s2=Math.hypot(v2x,v2z);if(s1>.3&&s2>.3)cs=(v1x*v2x+v1z*v2z)/(s1*s2);}
    if((Math.max(s1,s2)>3.2&&cs<.1)||(s1>4.5&&s2<.3))sfx.squeak(p);}
  if((p===ROLE.H||p===ball.owner)&&p.spd>1.3&&!(p.jy>.05)){p.stepD=(p.stepD||0)+p.spd*dt;
    if(p.stepD>.55+.13*p.spd){p.stepD=0;sfx.step(p,clamp(.08+.035*p.spd,.1,.28));}}}
function angTo(dx,dz){return Math.atan2(dx,-dz);}
function wrapA(a){while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;}
function faceP(p,dt){
  const r=p.rig;
  // Blickrichtung
  let ta;
  if(ball.owner===p)ta=(p.spd>1.5&&G.phase!=='decide'&&!ball.hold)?angTo(p.vx,p.vz):angTo(-p.x,-p.z);
  else if(p.team==='def')ta=angTo(ball.x-p.x,ball.z-p.z);
  else ta=p.spd>2.2?angTo(p.vx,p.vz):angTo(ball.x-p.x,ball.z-p.z);
  if(p.team==='off'&&p.armsUp>0)ta=angTo(-p.x,-p.z);
  if(p.targetLook&&(p.act?.k==='pass'||p.act?.k==='catch'))ta=angTo(p.targetLook.x-p.x,p.targetLook.z-p.z);
  p.ang+=wrapA(ta-p.ang)*Math.min(1,dt*9);
  r.root.position.set(p.x,0,-p.z);r.root.rotation.y=p.ang;
  r.root.visible=Math.hypot(cam.position.x-p.x,cam.position.z+p.z)>2.6&&!(p.trail&&Hd&&p.z<Hd.z-2.2);
}
function poseP(p,dt){
  if(p.rig.glb){poseGLB(p,dt);swayHair(p,dt);updBlobs(p);return;}
  const r=p.rig,k=1-Math.exp(-dt*14),c=r.cur;
  faceP(p,dt);
  const run=clamp(p.spd/5.5,0,1),ph=p.ph,def=p.team==='def',A=p.act;
  let jy=0;if(A){A.t+=dt;if(A.t>=A.d)p.act=null;}
  let crouch=def?(p.spd>3.5?.07:.15):(p===Hd?.06:.03);if(p.armsUp>0)crouch=0;
  const T={hipsY:.95-crouch*.85+Math.abs(Math.sin(ph))*.05*run,torsoX:run*.2+crouch*1.1};
  for(let i=0;i<2;i++){const sg=i?1:-1,sw=Math.sin(ph+(i?Math.PI:0));
    T['hx'+i]=-sw*.85*run-crouch*2.0;T['hz'+i]=sg*(def?.16:.05);T['kx'+i]=Math.max(0,Math.sin(ph+(i?Math.PI:0)+1.3))*1.2*run+crouch*3.6;
    let sx=sw*.65*run-.15,sz=sg*.14,ex=-.35-.35*run;
    if(def&&p.spd<3.5){sz=sg*1.12;sx=-.35;ex=-.8;}
    if(p.armsUp>0){sx=-2.95;sz=sg*.16;ex=-.12;}
    else if(ball.owner===p&&ball.hold){sx=-.2;sz=-sg*.3;ex=-1.35;}
    else if(ball.owner===p){const bi=p.dside>0?1:0,hb=clamp((ball.y-.15)/.85,0,1);
      if(i===bi){sx=-.35-.25*hb;sz=sg*.18;ex=-.2-.9*hb;}else{sx=-.75;sz=sg*.4;ex=-1.0;}}
    else if(p.team==='off'&&!def&&p.spd<1.2&&p!==Hd){sx=-.55;sz=sg*.2;ex=-1.2;}
    T['sx'+i]=sx;T['sz'+i]=sz;T['ex'+i]=ex;}
  if(A&&p.act){const t=A.t,u=t/A.d,sb=p.dside>0?1:0;
    if(A.k==='shoot'){if(t<.14){T.hipsY=.95-.2;T.torsoX=.12;for(let i=0;i<2;i++){T['hx'+i]=-.55;T['kx'+i]=1.1;T['sx'+i]=-1.1;T['sz'+i]=(i?1:-1)*-.2;T['ex'+i]=-1.3;}}
      else{const a=clamp((t-.14)/.48,0,1);jy=.34*Math.sin(Math.PI*a);T.torsoX=-.04;
        for(let i=0;i<2;i++){const sg=i?1:-1;T['hx'+i]=a<1?-.12:-.4;T['kx'+i]=a<1?.25:.7;
          if(i===sb){T['sx'+i]=-2.95;T['sz'+i]=sg*.05;T['ex'+i]=t<.24?-1.3:-.05;}else{T['sx'+i]=t<.34?-2.6:-1.2;T['sz'+i]=-sg*.25;T['ex'+i]=t<.34?-1.1:-.6;}}}}
    else if(A.k==='layup'){const a=clamp(t/.62,0,1);jy=.48*Math.sin(Math.PI*a);T.torsoX=-.05;
      for(let i=0;i<2;i++){const sg=i?1:-1,up=i===sb;
        T['hx'+i]=a<1?(up?-1.35:.25):-.3;T['kx'+i]=a<1?(up?1.7:.35):.5;
        if(up){T['sx'+i]=-3.0;T['sz'+i]=sg*.08;T['ex'+i]=-.08;}else{T['sx'+i]=-.9;T['sz'+i]=sg*.5;T['ex'+i]=-.7;}}}
    else if(A.k==='block'){const a=clamp(t/.62,0,1);jy=.42*Math.sin(Math.PI*a);T.torsoX=-.06;
      for(let i=0;i<2;i++){const sg=i?1:-1;T['hx'+i]=-.2;T['kx'+i]=a<1?.4:.8;T['sx'+i]=-3.0;T['sz'+i]=sg*.3;T['ex'+i]=-.05;}}
    else if(A.k==='pass'){const e=clamp(u*2.2,0,1);T.torsoX=.18;
      for(let i=0;i<2;i++){const sg=i?1:-1;T['sx'+i]=-1.5;T['sz'+i]=-sg*.12;T['ex'+i]=lerp(-1.5,-.05,e);}}
    else if(A.k==='catch'){for(let i=0;i<2;i++){const sg=i?1:-1;T['sx'+i]=-1.35;T['sz'+i]=-sg*.1;T['ex'+i]=-.5;}}
    else if(A.k==='cheer'){const tt=Math.max(0,t-(A.dl||0));jy=tt>0&&tt<1.3?.26*Math.abs(Math.sin(tt*6.5)):0;
      for(let i=0;i<2;i++){const sg=i?1:-1;T['sx'+i]=-2.75+.35*Math.sin(tt*13+i*Math.PI);T['sz'+i]=sg*.42;T['ex'+i]=-.35;if(jy>.03){T['kx'+i]=.5;T['hx'+i]=-.25;}}}
    else if(A.k==='sad'){T.torsoX=.22;for(let i=0;i<2;i++){const sg=i?1:-1;T['sx'+i]=.25;T['sz'+i]=sg*.75;T['ex'+i]=-2.0;}}}
  if(p.spd<.5&&!p.act)T.torsoX+=Math.sin(clock*2.3+p.ph)*.02;
  for(const key in T){c[key]=c[key]===undefined?T[key]:lerp(c[key],T[key],k);}
  r.hips.position.y=c.hipsY;r.torso.rotation.x=c.torsoX;r.head.rotation.x=-c.torsoX*.6+(A&&A.k==='sad'&&p.act?.45:0);
  p.jy=jy;r.root.position.y=jy;
  {const want=ball.owner===p?0:clamp(wrapA(angTo(ball.x-p.x,ball.z-p.z)-p.ang),-.9,.9);c.hy=c.hy===undefined?want:lerp(c.hy,want,k*.6);r.head.rotation.y=c.hy;}
  for(let i=0;i<2;i++){r.hip[i].rotation.x=c['hx'+i];r.hip[i].rotation.z=c['hz'+i];r.kn[i].rotation.x=c['kx'+i];r.sh[i].rotation.x=c['sx'+i];r.sh[i].rotation.z=c['sz'+i];r.el[i].rotation.x=c['ex'+i];}
  swayHair(p,dt);updBlobs(p);
}

// ================= Ball-Logik =================
// Passgeschwindigkeit: kurze Pässe etwa 11 m/s, lange schneller (20 m: 16 m/s). Der Bogen folgt der Schwerkraft: Bei gleicher
// Abwurf- und Fanghöhe liegt der Scheitel g·t²/8 über der Geraden. Ein zu kleiner Bogen bei langer Flugzeit wirkt wie Schweben.
const passT=d=>.06+d/(12.5+Math.min(d,20)*.2),passH=t=>Math.max(.05,9.81*t*t/8);
function fly(to,d,h,end,o){if(o&&o.shot)sfx.release(ball.owner||shooter);ball.owner=null;ball.hold=false;ball.free=null;ball.fl=Object.assign({a:{x:ball.x,y:ball.y,z:ball.z},b:to,d,h,t:0,end},o||{});}
// Leuchtspur hinter dem Ball bei Würfen
const trail=[];{const tt=canvasTex(64,64,(g,w)=>{const r=g.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);r.addColorStop(0,'rgba(255,220,150,1)');r.addColorStop(.4,'rgba(255,140,40,.6)');r.addColorStop(1,'rgba(255,90,0,0)');g.fillStyle=r;g.fillRect(0,0,w,w);});
  for(let i=0;i<18;i++){const sp=new T3.Sprite(new T3.SpriteMaterial({map:tt,blending:T3.AdditiveBlending,depthWrite:false,transparent:true,opacity:0,toneMapped:false}));sp.scale.setScalar(.4);sp.visible=false;scene.add(sp);trail.push({sp,a:0});}}
let trailI=0,trailAcc=0;
function updTrail(dt){if(ball.fl&&ball.fl.shot){trailAcc+=dt;if(trailAcc>.018){trailAcc=0;const t=trail[trailI++%trail.length];t.a=.75;t.sp.position.set(ball.x,ball.y,-ball.z);t.sp.visible=true;}}
  trail.forEach(t=>{if(!t.sp.visible)return;t.a-=dt*2.4;if(t.a<=0){t.sp.visible=false;return;}t.sp.material.opacity=t.a;t.sp.scale.setScalar(.12+t.a*.4);});}
let lastCos=1;
// Freier Ball: Schwerkraft, Aufprall mit Energieverlust (Basketball springt aus 1,8 m etwa 1,2 m hoch), danach rollen.
// Banden hinter Grundlinie und Seitenlinien werfen ihn zurück, damit er nicht durch die Zuschauer rollt.
const BALLF={g:9.81,e:.76,fr:.82,vmax:8.3,r:.13,roll:1.1,wx:9.6,wz0:-26,wz1:3.6};
function bounceBall(f,dt){const F=BALLF;ball.x+=f.vx*dt;ball.z+=f.vz*dt;
  if(Math.abs(ball.x)>F.wx){ball.x=Math.sign(ball.x)*F.wx;f.vx*=-.5;}
  if(ball.z>F.wz1){ball.z=F.wz1;f.vz*=-.5;}else if(ball.z<F.wz0){ball.z=F.wz0;f.vz*=-.5;}
  if(f.vy!==0||ball.y>F.r){f.vy-=F.g*dt;ball.y+=f.vy*dt;
    if(ball.y<=F.r&&f.vy<0){ball.y=F.r;const v=Math.min(-f.vy,F.vmax);
      if(v>1)sfx.bounce(ball,Math.min(1,v/6));
      f.vy=v*F.e;f.vx*=F.fr;f.vz*=F.fr;if(f.vy<.7)f.vy=0;}}
  else{const k=Math.exp(-dt*F.roll);f.vx*=k;f.vz*=k;if(Math.hypot(f.vx,f.vz)<.04)ball.free=null;}
  ball.spin+=dt*Math.hypot(f.vx,f.vz)/F.r;}
function updBall(dt){
  if(ball.fl){const f=ball.fl;f.t+=dt;const u=clamp(f.t/f.d,0,1);
    ball.x=lerp(f.a.x,f.b.x,u);ball.z=lerp(f.a.z,f.b.z,u);ball.y=lerp(f.a.y,f.b.y,u)+f.h*4*u*(1-u);ball.spin+=dt*(f.shot?-11:14);
    // Landet der Flug am Boden (nach dem Korb, Fehlwurf, Block), springt der Ball von dort frei weiter (bounceBall)
    if(u>=1){ball.fl=null;if(f.b.y<.3){sfx.bounce(ball);const vy=Math.max((f.b.y-f.a.y-4*f.h)/f.d,-BALLF.vmax);
      ball.free={vx:(f.b.x-f.a.x)/f.d*BALLF.fr,vy:-vy*BALLF.e,vz:(f.b.z-f.a.z)/f.d*BALLF.fr};}f.end&&f.end();}}
  else if(ball.owner){ball.free=null;const o=ball.owner,a=o.ang,lx=Math.cos(a),lz=Math.sin(a),fx=Math.sin(a),fz=-Math.cos(a);
    if(ball.hold){const sa=o.act&&o.act.k==='shoot'?o.act:null;ball.x=o.x+fx*(sa?.2:.33);ball.z=o.z+fz*(sa?.2:.33);ball.y=(sa?lerp(1.25,2.3,clamp((sa.t-.08)/.14,0,1)):o.armsUp>0?2.25:1.18)+(o.jy||0);}
    else{ball.x=o.x+lx*o.dside*.36+fx*.3;ball.z=o.z+lz*o.dside*.36+fz*.3;const c=Math.cos(o.drib);ball.y=.13+.8*Math.abs(c);ball.spin+=dt*8;
      if(Math.sign(c)!==Math.sign(lastCos)&&(G.phase==='approach'||G.phase==='outcome'))sfx.dribble(o);lastCos=c;}}
  else if(ball.free)bounceBall(ball.free,dt);
  ballMesh.position.set(ball.x,ball.y,-ball.z);ballMesh.rotation.x=ball.spin;ballMesh.visible=ball.fl&&ball.fl.shot||cam.position.distanceTo(ballMesh.position)>1.3;
}

