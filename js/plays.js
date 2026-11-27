// Spielzüge im Angriff: Hilfsgeometrie und Builder für Aufbau, Flügel und Center (dazu Durchbruch & Kick-out, langer Pass).
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Hilfsgeometrie für Szenarien =================
const homeOf=(m,k,b)=>{const d=Math.hypot(m.x,m.z)||1;return{x:m.x-m.x/d*k+(b.x-m.x)*.07,z:m.z-m.z/d*k+(b.z-m.z)*.07};};
const denyOf=(m,b,k)=>{const dx=b.x-m.x,dz=b.z-m.z,d=Math.hypot(dx,dz);return{x:m.x+dx/d*k,z:m.z+dz/d*k+.2};};
const pt=(x,z)=>({x,z});
function fakeHelp(D,home,spot,T){const s0={x:D.path[0][1],z:D.path[0][2]};setPath(D,[[0,s0.x,s0.z],[T*.3,home.x,home.z],[T*.52,lerp(home.x,spot.x,.6),lerp(home.z,spot.z,.6)],[T*.86,home.x,home.z]]);}

// --------- Spielzug 1: Aufbau über die Mitte ---------
function buildTop(v,T,L,M){
  const cs=R()<.5?-1:1,ks=-cs;
  const H=addP('H','off',1),LW=addP('LW','off',3,{name:'Flügel links'}),RW=addP('RW','off',2,{name:'Flügel rechts'}),C=addP('C','off',5,{name:'Center',finish:'layup'});
  const K=M===5?addP('K','off',7,{name:ks<0?'Ecke links':'Ecke rechts'}):null;
  const dH=addP('dH','def',4),dL=addP('dLW','def',8),dR=addP('dRW','def',6),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  GUARD={LW:dL,RW:dR,C:dC,K:dK};
  const px0=rand(-1.6,1.6),pz0=-13.4,pxD=clamp(px0*.4+rand(-.7,.7),-1.3,1.3),pzD=-7.3,cross=R()<.5?-1:1;
  const pxM=lerp(px0,pxD,.55)-cross*.55,pzM=lerp(pz0,pzD,.55),B=pt(pxD,pzD);
  setPath(H,[[0,px0,pz0],[T*.55,pxM,pzM],[T,pxD,pzD]],true);H.dside=-cross;H.cross=cross;
  const lw0=pt(rand(-5.4,-4.6),rand(-8.8,-7.6)),lwD=pt(rand(-6.5,-5.8),rand(-4.6,-3.4)),rw0=pt(rand(4.6,5.4),rand(-8.8,-7.6)),rwD=pt(rand(5.8,6.5),rand(-4.6,-3.4));
  setPath(LW,[[0,lw0.x,lw0.z],[T*.8,lwD.x,lwD.z]]);setPath(RW,[[0,rw0.x,rw0.z],[T*.8,rwD.x,rwD.z]]);
  const cD=pt(cs*rand(3.1,3.6),rand(-.9,-.3));setPath(C,[[0,cs*1.3,-4.8],[T*.75,cD.x,cD.z]]);
  let kD=null;if(K){kD=pt(ks*rand(6.6,7.0),rand(.2,.8));setPath(K,[[0,ks*5.6,-2.2],[T*.7,kD.x,kD.z]]);}
  const helper={helpL:'dLW',helpR:'dRW',helpC:'dC',helpK:'dK',sag:'dH'}[v]||null;
  const st=m=>{const d=Math.hypot(m.x,m.z);return pt(m.x-m.x/d*1.3,m.z-m.z/d*1.3);};
  const helpSpot=s=>pt(pxD*.45+s*.65,-5.3);
  if(v==='sag')setPath(dH,[[0,px0,pz0+1.5],[T*.5,lerp(px0,pxM,.9),lerp(pz0,pzM,.9)+1.9],[T,pxD*.6,-4.0]]);
  else setPath(dH,[[0,px0,pz0+1.5],[T*.55,pxM,pzM+1.4],[T*.75,lerp(pxM,pxD,.45)-cross*.55,lerp(pzM,pzD,.45)+.6],[T,pxD-cross*.85,pzD-.15]]);
  const homes={};
  const wing=(D,m0,mD,s)=>{const s0=st(m0);
    if(v==='sag'){const e=denyOf(mD,B,1.05);setPath(D,[[0,s0.x,s0.z],[T*.8,e.x,e.z]]);return homes[D.role]=e;}
    const h=homeOf(mD,v==='drive'?.85:1.0,B);
    if(helper===D.role){const hs=helpSpot(s);setPath(D,[[0,s0.x,s0.z],[T*.58,h.x,h.z],[T*.95,hs.x,hs.z]]);}else setPath(D,[[0,s0.x,s0.z],[T*.8,h.x,h.z]]);
    return homes[D.role]=h;};
  wing(dL,lw0,lwD,-1);wing(dR,rw0,rwD,1);
  const h4=pt(cD.x-cs*.55,cD.z-.5);homes.dC=h4;
  if(helper==='dC')setPath(dC,[[0,cs*1.0,-3.6],[T*.55,h4.x,h4.z],[T*.95,pxD*.3,-4.4]]);else setPath(dC,[[0,cs*1.0,-3.6],[T*.75,h4.x,h4.z]]);
  const low=s=>pt(s*1.3+pxD*.2,-3.7);
  if(dK){const h5=homeOf(kD,v==='drive'?.8:1.0,B);homes.dK=h5;const s5=pt(ks*4.6,-2.0);
    if(v==='sag'){const e=pt(kD.x-ks*.9,kD.z-.6);homes.dK=e;setPath(dK,[[0,s5.x,s5.z],[T*.75,e.x,e.z]]);}
    else if(helper==='dK'){const hs=low(ks);setPath(dK,[[0,s5.x,s5.z],[T*.55,h5.x,h5.z],[T*.95,hs.x,hs.z]]);}
    else setPath(dK,[[0,s5.x,s5.z],[T*.75,h5.x,h5.z]]);}
  let fake=false;
  if(L>=2&&R()<(L===3?.7:.45)){const cand=[];if(helper!=='dLW')cand.push([dL,helpSpot(-1)]);if(helper!=='dRW')cand.push([dR,helpSpot(1)]);if(dK&&helper!=='dK')cand.push([dK,low(ks)]);
    const[D,spot]=pick(cand);fakeHelp(D,homes[D.role],spot,T);fake=true;}
  const ans={drive:'drive',helpL:'pass:LW',helpR:'pass:RW',sag:'shot',helpC:'pass:C',helpK:'pass:K'}[v];
  const kSide=ks<0?'linken':'rechten';
  const WHY={drive:'Du hast deinen Verteidiger geschlagen, und niemand ist zur Hilfe gekommen. Die Zone war frei, also ab zum Korb!',
    helpL:'Der Verteidiger deines linken Flügelspielers ist in die Zone gerückt, um dich zu stoppen. Dadurch stand dein Mitspieler links frei.',
    helpR:'Der Verteidiger deines rechten Flügelspielers ist in die Zone gerückt, um dich zu stoppen. Dadurch stand dein Mitspieler rechts frei.',
    sag:'Dein Verteidiger ist weit zurückgewichen, fast bis zur Freiwurflinie, und deine Mitspieler waren zugestellt. Du hattest viel Platz für den Wurf.',
    helpC:'Der Verteidiger des Centers ist herausgekommen, um dir den Weg zu versperren. Dadurch war dein Center unter dem Korb frei.',
    helpK:`Der Verteidiger aus der ${kSide} Ecke ist zur Hilfe in die Zone gerückt. Dadurch stand dein Mitspieler in der ${kSide} Ecke frei.`};
  const RULE={drive:'Freie Bahn? Dann geh zum Korb!',sag:'Viel Platz, und keiner ist frei? Nimm den Wurf!'};
  return{ans,helper,fake,why:WHY[v],rule:RULE[v]||'Wer hilft, lässt jemanden frei. Schau, woher die Hilfe kommt!'};
}

// --------- Spielzug 2: Schnellangriff 3 gegen 2 ---------
function buildBreak(v,T,L,M){
  const H=addP('H','off',1),LR=addP('LR','off',3,{name:'Läufer links',finish:'layup'}),RR=addP('RR','off',2,{name:'Läufer rechts',finish:'layup'});
  const C=addP('C','off',5,{sel:false}),K=M===5?addP('K','off',7,{sel:false}):null;
  const dA=addP('dA','def',8),dB=addP('dB','def',6),dH=addP('dH','def',4),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  [C,K,dC,dK].forEach(p=>p&&(p.trail=true));
  GUARD={LR:dA,RR:dB};
  const x0=rand(-1,1),xd=clamp(x0*.5+rand(-.6,.6),-1,1);
  setPath(H,[[0,x0,-22],[T,xd,-8.0]],true);H.dside=R()<.5?-1:1;
  setPath(LR,[[0,-4.3,-21],[T,-4.7,-4.7]],true);setPath(RR,[[0,4.3,-21.3],[T,4.7,-4.9]],true);
  setPath(C,[[0,5.6,-25],[T,3.4,-15.6]],true);if(K)setPath(K,[[0,-5.6,-25.5],[T,-3.6,-16.4]],true);
  setPath(dH,[[0,x0+1.2,-20.4],[T,xd+1.9,-9.2]],true);setPath(dC,[[0,6.3,-24.4],[T,4.1,-15.2]],true);if(dK)setPath(dK,[[0,-6.3,-25],[T,-4.3,-16]],true);
  if(v==='drive'){setPath(dA,[[0,-1.2,-12.5],[T*.6,-2.4,-6.6],[T,-3.6,-3.4]]);setPath(dB,[[0,1.4,-10.5],[T*.6,2.4,-5.5],[T,3.6,-3.2]]);}
  else{setPath(dA,[[0,-1.2,-12.5],[T*.6,-.6,-7.2],[T,xd*.5,-5.8]]);const s=v==='stopL'?1:-1;setPath(dB,[[0,1.4,-10.5],[T*.6,s*1.5,-4.6],[T,s*2.9,-2.9]]);}
  const ans={drive:'drive',stopL:'pass:LR',stopR:'pass:RR'}[v];
  const WHY={drive:'Beide Verteidiger sind mit deinen Läufern zurückgelaufen. Niemand hat sich dir in den Weg gestellt, also war der Korbleger frei!',
    stopL:'Der vordere Verteidiger hat sich dir in den Weg gestellt, der hintere hat sich um den Läufer rechts gekümmert. Dein Läufer links war frei.',
    stopR:'Der vordere Verteidiger hat sich dir in den Weg gestellt, der hintere hat sich um den Läufer links gekümmert. Dein Läufer rechts war frei.'};
  return{ans,helper:v==='drive'?null:'dA',fake:false,why:WHY[v],rule:'Im Schnellangriff: Stoppt dich keiner, mach den Korbleger. Stoppt dich einer, pass zum freien Läufer.',shotNote:'Im Schnellangriff willst du einen leichten Korbleger, keinen weiten Wurf.'};
}

// --------- Spielzug 3: Angriff über den Flügel ---------
function buildWing(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',1),TOP=addP('TOP','off',2,{name:'Mitspieler oben'}),OW=addP('OW','off',3,{name:'Flügel gegenüber'}),C=addP('C','off',5,{name:'Center',finish:'layup'});
  const K=M===5?addP('K','off',7,{name:'Ecke'}):null;
  const dH=addP('dH','def',4),dT=addP('dTOP','def',6),dO=addP('dOW','def',8),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  GUARD={TOP:dT,OW:dO,C:dC,K:dK};
  const hD=pt(s*5.1,-5.5),B=hD;
  setPath(H,[[0,s*5.3,-12.6],[T*.62,s*5.8,-7.6],[T,hD.x,hD.z]],true);H.dside=-s;
  const tD=pt(-s*rand(.6,1.2),rand(-8.2,-7.6)),oD=pt(-s*rand(5.8,6.4),rand(-4.6,-3.8)),cD=pt(-s*rand(3.2,3.6),rand(-.8,-.3));
  setPath(TOP,[[0,-s*1.8,-11.2],[T*.8,tD.x,tD.z]]);setPath(OW,[[0,-s*4.8,-8.8],[T*.8,oD.x,oD.z]]);setPath(C,[[0,-s*1.2,-4.6],[T*.75,cD.x,cD.z]]);
  let kD=null;if(K){kD=pt(s*rand(6.6,7.0),rand(.2,.7));setPath(K,[[0,s*5.4,-2.4],[T*.7,kD.x,kD.z]]);}
  const helper={helpTop:'dTOP',helpC:'dC',helpK:'dK',sag:'dH'}[v]||null;
  // Geschlagener Verteidiger: seitlich oben neben dir (nicht zwischen Kamera und dir), die Kamera schaut von der anderen Seite
  if(v==='sag')setPath(dH,[[0,s*4.6,-11.6],[T*.6,s*4.9,-6.4],[T,s*3.7,-3.4]]);
  else setPath(dH,[[0,s*4.6,-11.6],[T*.6,s*5.0,-6.6],[T*.82,s*4.75,-6.6],[T,s*4.35,-6.75]]);
  const homes={};
  const hT=homeOf(tD,1.0,B);homes.dTOP=hT;
  if(helper==='dTOP')setPath(dT,[[0,-s*1.4,-10],[T*.55,hT.x,hT.z],[T*.95,s*3.5,-5.1]]);else setPath(dT,[[0,-s*1.4,-10],[T*.8,hT.x,hT.z]]);
  const hO=homeOf(oD,.9,B);setPath(dO,[[0,-s*4.4,-7.8],[T*.8,hO.x,hO.z]]);
  const hC=pt(cD.x+s*.5,cD.z-.3);homes.dC=hC;
  if(helper==='dC')setPath(dC,[[0,-s*1,-3.4],[T*.55,hC.x,hC.z],[T*.95,s*1.8,-2.6]]);else setPath(dC,[[0,-s*1,-3.4],[T*.75,hC.x,hC.z]]);
  if(dK){const hK=homeOf(kD,v==='drive'?.8:1.0,B);homes.dK=hK;
    if(helper==='dK')setPath(dK,[[0,s*4.8,-2],[T*.55,hK.x,hK.z],[T*.95,s*4.2,-2.8]]);else setPath(dK,[[0,s*4.8,-2],[T*.75,hK.x,hK.z]]);}
  let fake=false;
  if(L>=2&&R()<(L===3?.7:.45)){const cand=[];if(helper!=='dTOP')cand.push([dT,pt(s*3.5,-5.1)]);if(helper!=='dC')cand.push([dC,pt(s*1.8,-2.6)]);if(dK&&helper!=='dK')cand.push([dK,pt(s*4.2,-2.8)]);
    const[D,spot]=pick(cand);fakeHelp(D,homes[D.role],spot,T);fake=true;}
  const ans={drive:'drive',helpTop:'pass:TOP',helpC:'pass:C',helpK:'pass:K',sag:'shot'}[v];
  const WHY={drive:'Du hast deinen Verteidiger an der Seite stehen lassen, und keiner ist zur Hilfe gekommen. Freier Weg zum Korb!',
    helpTop:'Der Verteidiger deines Mitspielers oben ist dir in den Weg gesprungen. Dadurch stand dein Mitspieler oben frei für den Wurf.',
    helpC:'Der Verteidiger des Centers ist von der anderen Seite herübergekommen, um dich zu stoppen. Dein Center auf der anderen Seite war frei.',
    helpK:'Der Verteidiger aus der Ecke ist dir entgegengekommen. Dein Mitspieler in der Ecke war frei.',
    sag:'Dein Verteidiger ist weit zurückgewichen und alle Mitspieler waren gedeckt. Du hattest Platz für den Wurf.'};
  return{ans,helper,fake,camSide:s,why:WHY[v],rule:v==='drive'?'Freie Bahn? Dann geh zum Korb!':v==='sag'?'Viel Platz, und keiner ist frei? Nimm den Wurf!':'Wer dir entgegenkommt, lässt jemanden frei. Finde ihn!'};
}

// --------- Spielzug 4: Backdoor-Cut ---------
function buildBackdoor(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',1),Wc=addP('W','off',s<0?3:2,{name:'Cutter (Backdoor)',finish:'layup'}),OW=addP('OW','off',s<0?2:3,{name:'Flügel gegenüber'}),C=addP('C','off',5,{name:'Center',finish:'layup'});
  const K=M===5?addP('K','off',7,{name:'Ecke'}):null;
  const dH=addP('dH','def',4),dW=addP('dW','def',8),dO=addP('dOW','def',6),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  GUARD={W:dW,OW:dO,C:dC,K:dK};
  const px0=rand(-1.4,1.4),xd=clamp(px0*.4+rand(-.6,.6),-1.1,1.1),B=pt(xd,-7.6);
  setPath(H,[[0,px0,-13.4],[T,xd,-7.6]],true);H.dside=s;
  if(v==='gap'){const tg=L>=2?T*.72:T*.55;setPath(dH,[[0,px0,-12],[tg,xd,-6.4],[T,xd+s*1.8,-5.9]]);}
  else setPath(dH,[[0,px0,-12],[T,xd,-6.3]]);
  setPath(Wc,[[0,s*5.0,-8.6],[T*.55,s*5.9,-6.0],[T*.72,s*6.0,-5.6],[T,s*3.5,-2.9]]);
  if(v==='gap')setPath(dW,[[0,s*4.4,-7.8],[T*.55,s*5.2,-6.6],[T*.72,s*5.3,-6.2],[T,s*3.9,-3.5]]);
  else setPath(dW,[[0,s*4.4,-7.8],[T*.55,s*5.2,-6.6],[T*.72,s*5.3,-6.3],[T,s*4.8,-4.4]]);
  const oD=pt(-s*rand(5.8,6.3),rand(-4.6,-3.8));setPath(OW,[[0,-s*5,-8.6],[T*.8,oD.x,oD.z]]);const hO=homeOf(oD,.9,B);setPath(dO,[[0,-s*4.4,-7.8],[T*.8,hO.x,hO.z]]);
  const cD=pt(-s*rand(3.2,3.6),rand(-.8,-.3));setPath(C,[[0,-s*1.2,-4.6],[T*.75,cD.x,cD.z]]);const hC=pt(cD.x+s*.5,cD.z-.3);
  if(v==='helpC')setPath(dC,[[0,-s,-3.4],[T*.6,hC.x,hC.z],[T,s*1.3,-1.8]]);else setPath(dC,[[0,-s,-3.4],[T*.75,hC.x,hC.z]]);
  if(K){const kD=pt(-s*rand(6.6,7.0),rand(.2,.7));setPath(K,[[0,-s*5.4,-2.4],[T*.7,kD.x,kD.z]]);const hK=homeOf(kD,1.0,B);setPath(dK,[[0,-s*4.8,-2],[T*.75,hK.x,hK.z]]);}
  if(v==='gap')return{ans:'drive',helper:null,fake:false,
    why:'Dein Verteidiger ist zur Seite gerutscht, um den Pass zum Cutter abzufangen. Der Cutter war ohnehin gedeckt. Dafür war vor dir der Weg zum Korb frei!',
    rule:'Wer hilft, lässt jemanden frei. Manchmal bist du das selbst: Ist der Weg frei, geh zum Korb!',
    notes:{pass:'Zwei Verteidiger standen im Passweg zum Cutter: seiner und deiner. Der Pass wäre abgefangen worden.'}};
  const ans=v==='cut'?'pass:W':'pass:C';
  const why=v==='cut'?'Der Verteidiger hat den Passweg zugestellt. Dein Mitspieler ist hinter seinem Rücken zum Korb geschnitten: Backdoor! Ein Pass in den Lauf, und er ist frei.'
    :'Dein Mitspieler ist backdoor geschnitten, aber der Verteidiger des Centers hat ihn abgefangen. Wer hilft, lässt jemanden frei: Der Center war offen.';
  return{ans,helper:v==='cut'?'dH':'dC',fake:false,why,rule:v==='cut'?'Steht der Verteidiger im Passweg, schneidet dein Mitspieler hinten rum. Spiel ihm den Ball in den Lauf!':'Wer hilft, lässt jemanden frei.',driveNote:'Dein Verteidiger stand direkt vor dir, da war kein Weg frei.'};
}

// Gemeinsame Helfer für die Positions-Spielzüge
const LBL_DEF={drive:['▲','Zum Korb'],shot:['🏀','Selbst werfen']};
function maybeFake(L,cand,homes,T){if(L>=2&&cand.length&&R()<(L===3?.7:.45)){const[D,spot]=pick(cand);fakeHelp(D,homes[D.role],spot,T);return true;}return false;}

// ================= FLÜGEL =================
// --------- Flügel 1: Pass auf den Flügel ---------
function buildWCatch(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',s<0?3:2),PG=addP('PG','off',1,{name:'Aufbau'}),OW=addP('OW','off',s<0?2:3,{name:'Flügel gegenüber'}),C=addP('C','off',5,{name:'Center',finish:'layup'});
  const K=M===5?addP('K','off',7,{name:'Ecke'}):null;
  const dH=addP('dH','def',4),dP=addP('dPG','def',6),dO=addP('dOW','def',8),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  GUARD={PG:dP,OW:dO,C:dC,K:dK};
  const hD=pt(s*5.2,-4.0);
  setPath(H,[[0,s*5.6,-7.6],[T*.38,s*4.0,-3.4],[T*.78,hD.x,hD.z]]);
  const pD=pt(s*rand(1.2,1.8),rand(-8.4,-7.8));setPath(PG,[[0,s*.2,-11.6],[T*.55,pD.x,pD.z]],true);
  setPath(dP,[[0,s*.2,-10.3],[T*.55,pD.x-s*.2,pD.z+1.1]]);
  const oD=pt(-s*rand(5.6,6.2),rand(-4.6,-3.8));setPath(OW,[[0,-s*5.2,-7.4],[T*.8,oD.x,oD.z]]);
  const cD=pt(-s*rand(2.9,3.3),rand(-.9,-.4));setPath(C,[[0,-s*1.2,-3.8],[T*.7,cD.x,cD.z]]);
  let kD=null;if(K){kD=pt(s*rand(6.6,6.9),rand(.3,.7));setPath(K,[[0,s*6.2,-1.6],[T*.6,kD.x,kD.z]]);}
  const homes={};
  const hO=homeOf(oD,1.5,hD);homes.dOW=hO;setPath(dO,[[0,-s*4.6,-6.8],[T*.8,hO.x,hO.z]]);
  const hC=pt(cD.x+s*.6,cD.z-.4);homes.dC=hC;
  const helper={helpC:'dC',helpK:'dK'}[v]||null;
  if(v==='shot')setPath(dH,[[0,s*4.8,-6.8],[T*.38,s*3.2,-3.0],[T*.8,s*2.2,-2.6],[T,s*2.45,-2.75]]);
  else setPath(dH,[[0,s*4.8,-6.8],[T*.38,s*4.4,-4.3],[T*.8,s*5.0,-5.4],[T,s*4.75,-5.2]]);
  if(helper==='dC')setPath(dC,[[0,-s*1,-2.8],[T*.55,hC.x,hC.z],[T*.95,s*2.3,-1.9]]);else setPath(dC,[[0,-s*1,-2.8],[T*.75,hC.x,hC.z]]);
  if(dK){const hK=homeOf(kD,.9,hD);homes.dK=hK;
    if(helper==='dK')setPath(dK,[[0,s*5.4,-1.4],[T*.55,hK.x,hK.z],[T*.95,s*4.2,-2.0]]);else setPath(dK,[[0,s*5.4,-1.4],[T*.75,hK.x,hK.z]]);}
  const cand=[];if(helper!=='dC')cand.push([dC,pt(s*2.3,-1.9)]);if(dK&&helper!=='dK')cand.push([dK,pt(s*4.2,-2.0)]);
  const fake=maybeFake(L,cand,homes,T);
  const ans={shot:'shot',drive:'drive',helpC:'pass:C',helpK:'pass:K'}[v];
  const WHY={shot:'Dein Verteidiger hat in der Zone ausgeholfen und kam viel zu spät zurück. Du hattest Platz und Zeit: Fangen und werfen!',
    drive:'Dein Verteidiger stand oben neben dir, nicht zwischen dir und dem Korb. Und keiner kam zur Hilfe. Der Weg zum Korb war frei!',
    helpC:'Der Verteidiger des Centers ist von der anderen Seite herübergekommen, um dich zu stoppen. Dadurch war dein Center frei.',
    helpK:'Der Verteidiger aus der Ecke ist dir entgegengekommen. Dadurch war dein Mitspieler in der Ecke frei.'};
  const RULE={shot:'Ist dein Verteidiger beim Fangen weit weg? Dann wirf!',drive:'Steht dein Verteidiger neben dir statt vor dir? Ab zum Korb!'};
  return{ans,helper,fake,camSide:s,feed:{from:'PG',t0:T*.5,t1:T*.8},why:WHY[v],rule:RULE[v]||'Wer dir entgegenkommt, lässt jemanden frei. Finde ihn!',
    notes:{drive:v==='shot'?'Dein Verteidiger stand in der Zone zwischen dir und dem Korb. Er hätte dich dort erwartet.':null}};
}

// --------- Flügel 2: Ohne Ball (Backdoor oder Ball fordern) ---------
function buildWCut(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',s<0?3:2),PG=addP('PG','off',1,{sel:false}),OW=addP('OW','off',s<0?2:3,{sel:false}),C=addP('C','off',5,{sel:false});
  const K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',4),dP=addP('dPG','def',6),dO=addP('dOW','def',8),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  GUARD={};
  const hD=pt(s*5.5,-6.8);setPath(H,[[0,s*5.0,-4.2],[T*.75,hD.x,hD.z]]);
  let pD=pt(s*rand(1.0,1.5),rand(-9.2,-8.6));
  if(v==='dribble'){const pM=pD;pD=pt(s*rand(3.0,3.4),rand(-8.4,-7.9));const tm=L>=2?T*.6:T*.35;
    setPath(PG,[[0,-s*.6,-12.4],[tm,lerp(-s*.6,pM.x,tm/(T*.8)),lerp(-12.4,pM.z,tm/(T*.8))],[T*.95,pD.x,pD.z]],true);
    setPath(dP,[[0,-s*.6,-11.1],[tm,lerp(-s*.6,pM.x,tm/(T*.8))-s*.15,lerp(-11.1,pM.z+1.1,tm/(T*.8))],[T*.95,pD.x-s*.35,pD.z+1.0]]);}
  else{setPath(PG,[[0,-s*.6,-12.4],[T*.8,pD.x,pD.z]],true);setPath(dP,[[0,-s*.6,-11.1],[T*.8,pD.x-s*.15,pD.z+1.1]]);}
  const oD=pt(-s*rand(5.6,6.2),rand(-5.0,-4.2));setPath(OW,[[0,-s*5.4,-7.6],[T*.8,oD.x,oD.z]]);const hO=homeOf(oD,1.4,pD);setPath(dO,[[0,-s*4.8,-7],[T*.8,hO.x,hO.z]]);
  const cD=pt(-s*rand(2.9,3.3),rand(-.9,-.4));setPath(C,[[0,-s*1.4,-3.6],[T*.7,cD.x,cD.z]]);setPath(dC,[[0,-s*1.0,-2.8],[T*.75,cD.x+s*.6,cD.z-.4]]);
  if(K){const kD=pt(-s*rand(6.6,6.9),rand(.3,.7));setPath(K,[[0,-s*6.4,-1.6],[T*.6,kD.x,kD.z]]);const hK=homeOf(kD,1.1,pD);setPath(dK,[[0,-s*5.6,-1.4],[T*.75,hK.x,hK.z]]);}
  const deny=pt(hD.x+(pD.x-hD.x)*.2,hD.z+(pD.z-hD.z)*.2+.25),sag=pt(s*2.6,-3.5);
  const fin=v==='deny'?deny:sag,oth=v==='deny'?sag:deny;let fake=false;
  if(v==='dribble'){const d=Math.hypot(hD.x,hD.z),bx=pD.x-hD.x,bz=pD.z-hD.z,bd=Math.hypot(bx,bz);
    const home=pt(hD.x-hD.x/d*.9+bx/bd*.6,hD.z-hD.z/d*.9+bz/bd*.6);setPath(dH,[[0,s*4.4,-3.6],[T*.75,hD.x-hD.x/d*1.2,hD.z-hD.z/d*1.2],[T,home.x,home.z]]);}
  else if(L>=2&&R()<(L===3?.7:.45)){fake=true;setPath(dH,[[0,s*4.4,-3.6],[T*.55,oth.x,oth.z],[T*.97,fin.x,fin.z]]);}
  else setPath(dH,[[0,s*4.4,-3.6],[T*.75,fin.x,fin.z]]);
  if(v==='dribble'){
    const outD=(choice,ok,finish)=>{
      if(choice==='drive'){H.finish='layup';later(.15,()=>passOk(H,finish));later(.35,()=>goTo(dH,[[.9,s*2.3,-3.2]]));}
      else{goTo(H,[[.45,s*4.9,-7.3]]);later(.15,()=>passBad(H,finish,dH));}};
    return{ans:'drive',helper:null,fake:false,camSide:s,outcome:outD,ballAt:'PG',
      why:'Der Aufbau ist auf dich zugedribbelt. Dein Verteidiger hat auf den Ball geschaut, nicht auf dich. Mach Platz und schneide hinter seinem Rücken zum Korb: Backdoor! Der Aufbau spielt dir den Ball in den Lauf.',
      labels:{drive:['↩','Backdoor-Cut'],shot:['✋','Ball fordern']},prompt:'Du hast keinen Ball. Wohin läufst du?',
      rule:'Dribbelt der Ballführer auf dich zu, mach ihm Platz: Schneide zum Korb!',
      notes:{shot:'Der Aufbau kam mit dem Ball zu dir. Bleibst du stehen, seid ihr zu zweit auf engem Raum, und dein Verteidiger fängt den Pass ab.'}};}
  const ans=v==='deny'?'drive':'shot';
  const why=v==='deny'?'Dein Verteidiger hat den Passweg zugestellt. Hinter seinem Rücken war alles frei: Backdoor zum Korb, und der Aufbau spielt dir den Ball in den Lauf!'
    :'Dein Verteidiger ist weit weg in die Zone gegangen. Wärst du zum Korb gelaufen, hätte er dort auf dich gewartet. Du warst frei: Ball fordern und werfen!';
  const outcome=(choice,ok,finish)=>{
    if(choice==='drive'){if(ok){H.finish='layup';later(.15,()=>passOk(H,finish));}
      else{goTo(H,[[.9,s*1.6,-1.9]],true);goTo(dH,[[.5,s*2.2,-2.6]]);later(.2,()=>passBad(H,finish,dH));}}
    else{if(ok){goTo(H,[[.45,s*5.1,-6.3]]);H.finish='shot';later(.15,()=>passOk(H,finish));}
      else{goTo(H,[[.45,s*5.2,-7.2]]);later(.15,()=>passBad(H,finish,dH));}}};
  return{ans,helper:null,fake,camSide:s,why,outcome,ballAt:'PG',
    labels:{drive:['↩','Backdoor-Cut'],shot:['✋','Ball fordern']},
    prompt:'Du hast keinen Ball. Wohin läufst du?',
    rule:v==='deny'?'Steht dein Verteidiger im Passweg, lauf hinter seinem Rücken zum Korb!':'Steht dein Verteidiger weit weg, fordere den Ball. Du bist frei!',
    notes:{drive:'Dein Verteidiger stand schon in der Zone. Beim Schneiden bist du direkt in ihn hineingelaufen.',shot:'Dein Verteidiger stand genau im Passweg. Der Pass zu dir wäre abgefangen worden.'}};
}

// --------- Flügel 3: Schnellangriff als Läufer ---------
function buildWBreak(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',s<0?3:2),PG=addP('PG','off',1,{name:'Aufbau',finish:'layup'}),OR=addP('OR','off',s<0?2:3,{name:'Läufer gegenüber',finish:'layup'});
  const C=addP('C','off',5,{sel:false}),K=M===5?addP('K','off',7,{sel:false}):null;
  const dA=addP('dA','def',8),dB=addP('dB','def',6),dH=addP('dH','def',4),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  [C,K,dH,dC,dK].forEach(p=>p&&(p.trail=true));
  GUARD={PG:dA,OR:dA};
  setPath(H,[[0,s*4.5,-21.5],[T,s*3.9,-6.0]],true);
  setPath(PG,[[0,s*.3,-22.4],[T*.45,s*.5,-15.6],[T,s*.3,-7.8]],true);
  setPath(OR,[[0,-s*4.4,-21],[T,-s*4.3,-5.2]],true);
  setPath(dH,[[0,s*3.2,-23.5],[T,s*3.6,-10.5]],true);setPath(C,[[0,-s*2,-25],[T,-s*1.8,-14.5]],true);setPath(dC,[[0,-s*2.6,-24.4],[T,-s*2.4,-13.8]],true);
  if(K){setPath(K,[[0,s*1.6,-25.6],[T,s*1.4,-15.4]],true);setPath(dK,[[0,s*2.2,-25],[T,s*2.0,-14.8]],true);}
  if(v==='drive'){setPath(dA,[[0,-s*1,-11.5],[T*.6,0,-8.8],[T,s*.4,-6.7]]);setPath(dB,[[0,s*1.2,-9.5],[T*.6,-s*1.6,-5.5],[T,-s*2.9,-3.6]]);GUARD={OR:dB,PG:dA};}
  else if(v==='stopPG'){setPath(dA,[[0,-s*1,-11.5],[T*.6,-s*1.4,-6.5],[T,-s*2.9,-3.4]]);setPath(dB,[[0,s*1.2,-9.5],[T*.6,s*2.2,-5.6],[T,s*3.0,-3.9]]);GUARD={OR:dA};}
  else{setPath(dA,[[0,-s*1,-11.5],[T*.6,0,-8.6],[T,s*.3,-6.5]]);setPath(dB,[[0,s*1.2,-9.5],[T*.6,s*2.2,-5.6],[T,s*3.0,-3.9]]);GUARD={PG:dA};}
  const ans={drive:'drive',stopPG:'pass:PG',stopOR:'pass:OR'}[v];
  const WHY={drive:'Kein Verteidiger hat sich dir in den Weg gestellt. Beide waren beim Aufbau und beim anderen Läufer. Freier Korbleger!',
    stopPG:'Ein Verteidiger hat dich gestoppt, der andere ist zum Läufer gegenüber gelaufen. Dein Aufbauspieler in der Mitte war ganz frei.',
    stopOR:'Ein Verteidiger hat dich gestoppt, der andere hat den Aufbau gestellt. Der Läufer auf der anderen Seite war frei.'};
  return{ans,helper:v==='drive'?null:'dB',fake:false,feed:{from:'PG',t0:T*.36,t1:T*.62},why:WHY[v],
    rule:'Im Schnellangriff: Stoppt dich keiner, mach den Korbleger. Stoppt dich einer, ist ein anderer frei!',shotNote:'Im Schnellangriff willst du einen leichten Korbleger, keinen weiten Wurf.'};
}

// ================= CENTER =================
// --------- Center 1: Ball am Brett (Low Post) ---------
function buildCPost(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',5),W=addP('W','off',s<0?3:2,{name:'Flügel'}),PG=addP('PG','off',1,{name:'Aufbau'}),OW=addP('OW','off',s<0?2:3,{name:'Flügel gegenüber',sel:false});
  const K=M===5?addP('K','off',7,{name:'Ecke gegenüber'}):null;
  const dH=addP('dH','def',9),dW=addP('dW','def',8),dP=addP('dPG','def',4),dO=addP('dOW','def',6),dK=M===5?addP('dK','def',10):null;
  GUARD={W:dW,PG:dP,OW:dO,K:dK};
  // Miniregeln: Doppeln ist verboten. Der Center dreht sich zur Mitte und zieht zum Korb, erst dann hilft ein zweiter Verteidiger aus.
  const hD=pt(s*2.75,-1.3),hE=pt(s*1.85,-1.6);setPath(H,[[0,s*1.4,-4.0],[T*.5,hD.x,hD.z],[T*.8,hD.x,hD.z],[T,hE.x,hE.z]]);
  setPath(dH,[[0,s*1.1,-3.1],[T*.5,s*2.05,-.95],[T*.8,s*2.05,-.95],[T,s*2.35,-.8]]);
  const wD=pt(s*rand(5.2,5.6),rand(-4.9,-4.3));setPath(W,[[0,s*5.9,-6.8],[T*.45,wD.x,wD.z]],true);
  const pD=pt(-s*rand(1.2,1.7),rand(-7.6,-7.1));setPath(PG,[[0,-s*.4,-9.6],[T*.6,pD.x,pD.z]]);
  const oD=pt(-s*rand(5.4,5.8),rand(-4.4,-3.6));setPath(OW,[[0,-s*5.4,-6.6],[T*.7,oD.x,oD.z]]);
  const homes={};
  const hW=homeOf(wD,1.0,wD);homes.dW=hW;const hP=homeOf(pD,1.2,hD);homes.dPG=hP;
  const helper={helpW:'dW',helpT:'dPG',helpK:'dK'}[v]||null;
  if(helper==='dW')setPath(dW,[[0,s*5.3,-6.0],[T*.5,hW.x,hW.z],[T*.75,lerp(hW.x,s*1.3,.35),lerp(hW.z,-1.0,.35)],[T,s*1.25,-1.0]]);else setPath(dW,[[0,s*5.3,-6.0],[T*.5,hW.x,hW.z]]);
  if(helper==='dPG')setPath(dP,[[0,-s*.4,-8.4],[T*.55,hP.x,hP.z],[T*.78,lerp(hP.x,s*1.15,.35),lerp(hP.z,-1.1,.35)],[T,s*1.15,-1.1]]);else setPath(dP,[[0,-s*.4,-8.4],[T*.6,hP.x,hP.z]]);
  const hO=homeOf(oD,2.0,hD);homes.dOW=hO;setPath(dO,[[0,-s*4.8,-6],[T*.7,hO.x,hO.z]]);
  if(K){const kD=pt(-s*rand(6.6,6.9),rand(.2,.6));setPath(K,[[0,-s*6.2,-1.8],[T*.6,kD.x,kD.z]]);const hK=homeOf(kD,1.6,hD);homes.dK=hK;
    if(helper==='dK')setPath(dK,[[0,-s*5.4,-1.4],[T*.55,hK.x,hK.z],[T*.78,lerp(hK.x,s*1.0,.4),lerp(hK.z,-.6,.4)],[T,s*1.0,-.6]]);else setPath(dK,[[0,-s*5.4,-1.4],[T*.7,hK.x,hK.z]]);}
  const cand=[];if(helper!=='dW')cand.push([dW,pt(s*2.4,-1.6)]);if(helper!=='dPG')cand.push([dP,pt(s*1.4,-2.2)]);
  const fake=maybeFake(L,cand,homes,T);
  const ans={drive:'drive',helpW:'pass:W',helpT:'pass:PG',helpK:'pass:K'}[v];
  const WHY={drive:'Du hast dich zur Mitte gedreht, und keiner kam zur Hilfe. Eins gegen eins am Korb: Mach den Korbleger!',
    helpW:'Als du zum Korb gezogen bist, hat der Verteidiger vom Flügel ausgeholfen. Dadurch stand dein Flügelspieler frei.',
    helpT:'Als du zum Korb gezogen bist, ist der Verteidiger vom Aufbau in die Zone gekommen. Dadurch war dein Aufbauspieler oben frei.',
    helpK:'Als du zum Korb gezogen bist, ist der Verteidiger aus der Ecke gegenüber ausgeholfen. Dein Mitspieler in der Ecke war frei.'};
  const dir=Math.hypot(.09,1);
  return{ans,helper,fake,feed:{from:'W',t0:T*.5,t1:T*.76},camFix:{x:s*.8,z:-6.6,dx:s*.09/dir,dz:1/dir},
    labels:{drive:['↻','Korbleger'],shot:null},why:WHY[v],
    rule:v==='drive'?'Allein mit deinem Verteidiger am Brett? Dreh dich und geh zum Korb!':'Hilft beim Zug zum Korb ein zweiter Verteidiger aus, ist einer deiner Mitspieler frei. Pass raus!'};
}

// --------- Center 2: Ball an der Freiwurflinie (High Post) ---------
function buildCHigh(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',5),PG=addP('PG','off',1,{sel:false}),W=addP('W','off',s<0?3:2,{name:'Flügel',finish:v==='backdoor'?'layup':'shot'}),OW=addP('OW','off',s<0?2:3,{name:'Flügel gegenüber'});
  const K=M===5?addP('K','off',7,{name:'Ecke gegenüber'}):null;
  const dH=addP('dH','def',9),dP=addP('dPG','def',4),dW=addP('dW','def',8),dO=addP('dOW','def',6),dK=M===5?addP('dK','def',10):null;
  GUARD={W:dW,OW:dO,K:dK};
  const hD=pt(s*.4,-4.7);setPath(H,[[0,s*2.4,-1.2],[T*.7,hD.x,hD.z]]);
  const pD=pt(-s*rand(2.6,3.2),rand(-8.4,-7.8));setPath(PG,[[0,-s*1.2,-11.4],[T*.5,pD.x,pD.z]]);setPath(dP,[[0,-s*1.2,-10.2],[T*.5,pD.x+s*.3,pD.z+1.1]]);
  const oD=pt(-s*rand(5.6,6.0),rand(-4.6,-3.8));setPath(OW,[[0,-s*5.6,-7],[T*.7,oD.x,oD.z]]);const hO=homeOf(oD,1.1,hD);setPath(dO,[[0,-s*5.0,-6.4],[T*.7,hO.x,hO.z]]);
  if(K){const kD=pt(-s*rand(6.6,6.9),rand(.2,.6));setPath(K,[[0,-s*6.2,-1.8],[T*.6,kD.x,kD.z]]);const hK=homeOf(kD,1.2,hD);setPath(dK,[[0,-s*5.4,-1.4],[T*.7,hK.x,hK.z]]);}
  const wD=pt(s*rand(5.5,5.8),rand(-5.4,-4.8));let fake=false;
  if(v==='backdoor'){setPath(W,[[0,s*5.8,-7.4],[T*.6,wD.x,wD.z],[T*.78,wD.x+s*.1,wD.z-.3],[T,s*4.3,-2.8]]);
    const dn=pt(wD.x+(hD.x-wD.x)*.17,wD.z+.1);setPath(dW,[[0,s*5.2,-6.6],[T*.6,dn.x,dn.z],[T,s*4.8,-4.0]]);}
  else{setPath(W,[[0,s*5.8,-7.4],[T*.6,wD.x,wD.z]]);const hW=homeOf(wD,1.0,hD);setPath(dW,[[0,s*5.2,-6.6],[T*.6,hW.x,hW.z]]);}
  if(v==='shot'){if(L>=2&&R()<(L===3?.7:.45)){fake=true;setPath(dH,[[0,s*1.9,-.6],[T*.7,s*.4,-3.7],[T,s*.35,-2.0]]);}else setPath(dH,[[0,s*1.9,-.6],[T*.7,s*.4,-2.2],[T,s*.35,-2.0]]);}
  else if(v==='drive')setPath(dH,[[0,s*1.9,-.6],[T*.6,s*1.4,-3.2],[T,s*1.55,-5.0]]);
  else setPath(dH,[[0,s*1.9,-.6],[T*.7,s*.4,-3.6],[T,s*.4,-3.85]]);
  const ans={shot:'shot',drive:'drive',backdoor:'pass:W'}[v];
  const WHY={shot:'Dein Verteidiger ist unten am Korb geblieben. An der Freiwurflinie hattest du viel Platz: Nimm den Wurf!',
    drive:'Dein Verteidiger stand neben dir, nicht vor dir. Die Zone war leer: ab zum Korb!',
    backdoor:'Der Verteidiger deines Flügelspielers stand im Passweg. Dein Mitspieler ist hinter seinem Rücken zum Korb geschnitten. Ein Pass in den Lauf, und er ist frei!'};
  return{ans,helper:v==='shot'?'dH':v==='drive'?null:'dH',fake,camSide:-s,feed:{from:'PG',t0:T*.42,t1:T*.72},why:WHY[v],
    rule:v==='shot'?'Viel Platz an der Freiwurflinie? Nimm den Wurf!':v==='drive'?'Steht dein Verteidiger neben dir, geh zum Korb!':'Läuft ein Mitspieler backdoor, spiel ihm den Ball in den Lauf!',
    notes:{shot:v==='backdoor'?'Dein Verteidiger stand direkt vor dir, und ein Mitspieler war ganz frei.':null}};
}

// --------- Center 3: Zum Korb abtauchen (ohne Ball) ---------
function buildCDive(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',5),PG=addP('PG','off',1,{sel:false,finish:'layup'}),W=addP('W','off',s<0?3:2,{sel:false}),OW=addP('OW','off',s<0?2:3,{sel:false});
  const K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',9),dP=addP('dPG','def',4),dW=addP('dW','def',8),dO=addP('dOW','def',6),dK=M===5?addP('dK','def',10):null;
  GUARD={};
  const hD=pt(s*3.3,-.5);setPath(H,[[0,s*3.0,-2.4],[T*.6,hD.x,hD.z]]);
  const pE=pt(s*rand(.7,1.1),-4.7);setPath(PG,[[0,s*.2,-10.6],[T*.45,s*.5,-7.6],[T,pE.x,pE.z]],true);
  setPath(dP,[[0,s*.2,-9.3],[T*.45,s*.6,-6.6],[T,pE.x-s*.3,pE.z-1.3]]);
  const wD=pt(s*rand(5.6,6.0),rand(-5.6,-5.0));setPath(W,[[0,s*5.8,-7.4],[T*.6,wD.x,wD.z]]);const hW=homeOf(wD,.9,pE);setPath(dW,[[0,s*5.2,-6.8],[T*.6,hW.x,hW.z]]);
  const oD=pt(-s*rand(5.4,5.9),rand(-5.0,-4.2));setPath(OW,[[0,-s*5.4,-7],[T*.7,oD.x,oD.z]]);const hO=homeOf(oD,1.0,pE);
  if(v==='helpW')setPath(dO,[[0,-s*4.8,-6.4],[T*.5,hO.x,hO.z],[T,s*.05,-3.5]]);else setPath(dO,[[0,-s*4.8,-6.4],[T*.7,hO.x,hO.z]]);
  if(K){const kD=pt(-s*rand(6.6,6.9),rand(.2,.6));setPath(K,[[0,-s*6.2,-1.8],[T*.6,kD.x,kD.z]]);const hK=homeOf(kD,1.0,pE);setPath(dK,[[0,-s*5.4,-1.4],[T*.7,hK.x,hK.z]]);}
  const help=pt(s*1.3,-3.3),stay=pt(s*2.55,-.35);let fake=false;
  const lateOrFake=L>=2&&R()<(L===3?.7:.45);
  if(v==='help'){if(lateOrFake){fake=true;setPath(dH,[[0,s*2.6,-1.6],[T*.8,s*2.5,-.6],[T,help.x,help.z]]);}else setPath(dH,[[0,s*2.6,-1.6],[T*.6,s*2.4,-.9],[T,help.x,help.z]]);}
  else{if(lateOrFake){fake=true;setPath(dH,[[0,s*2.6,-1.6],[T*.55,s*1.5,-2.8],[T*.97,stay.x,stay.z]]);}else setPath(dH,[[0,s*2.6,-1.6],[T*.6,stay.x,stay.z]]);}
  if(v==='helpW'){const dir=Math.hypot(.05,1);
    const outW=(choice,ok,finish)=>{
      if(choice==='shot'){goTo(H,[[.5,s*3.6,.2]]);goTo(PG,[[.2,PG.x,PG.z]]);later(.15,()=>passOk(OW,finish));later(.4,()=>goTo(dO,[[1.2,lerp(dO.x,OW.x,.7),lerp(dO.z,OW.z,.7)]]));}
      else{goTo(H,[[.6,s*1.0,-1.0]],true);goTo(dH,[[.5,s*.9,-1.7]]);later(.15,()=>blocked(PG,dO,finish,'Zu eng!'));}};
    return{ans:'shot',helper:null,fake,why:'Geholfen hat der Verteidiger vom Flügel gegenüber, nicht deiner. Dein Verteidiger ist bei dir geblieben. Bleibst du draußen, ist die Zone frei, und der Aufbau kann zum freien Flügel passen.',
      outcome:outW,ballAt:'PG',camFix:{x:s*1.8,z:-6.6,dx:-s*.05/dir,dz:1/dir},
      labels:{drive:['⤓','Zum Korb laufen'],shot:['✋','Platz lassen']},prompt:'Dein Aufbauspieler zieht zum Korb. Was machst du?',
      rule:'Schau auf deinen eigenen Verteidiger! Bleibt er bei dir, lass die Zone frei, auch wenn ein anderer aushilft.',
      notes:{drive:'Geholfen hat ein anderer Verteidiger, deiner ist bei dir geblieben. Als du zum Korb gelaufen bist, kam er mit, und in der Zone war es zu eng.'}};}
  const ans=v==='help'?'drive':'shot';
  const why=v==='help'?'Dein Verteidiger hat dich verlassen, um den Aufbau zu stoppen. Du warst frei: Lauf zum Korb, zeig die Hände, und du bekommst den Ball!'
    :'Dein Verteidiger ist bei dir geblieben. Der Aufbau hatte freie Bahn. Wärst du zum Korb gelaufen, hättest du ihm deinen Verteidiger in den Weg gebracht.';
  const outcome=(choice,ok,finish)=>{
    if(choice==='drive'){if(ok){goTo(PG,[[.25,PG.x,PG.z]]);H.finish='layup';later(.1,()=>passOk(H,finish));}
      else{goTo(H,[[.6,s*1.0,-1.0]],true);goTo(dH,[[.5,s*.9,-1.7]]);later(.15,()=>blocked(PG,dH,finish,'Zu eng!'));}}
    else{if(ok)layup(PG,()=>{flash('Korbleger!','#7ff0ad');sfx.good();finish(.7);});
      else blocked(PG,dH,finish,'Geblockt!');}};
  const dir=Math.hypot(.05,1);
  return{ans,helper:null,fake,why,outcome,ballAt:'PG',camFix:{x:s*1.8,z:-6.6,dx:-s*.05/dir,dz:1/dir},
    labels:{drive:['⤓','Zum Korb laufen'],shot:['✋','Platz lassen']},prompt:'Dein Aufbauspieler zieht zum Korb. Was machst du?',
    rule:v==='help'?'Hilft dein Verteidiger aus, lauf zum Korb und zeig die Hände!':'Bleibt dein Verteidiger bei dir, lass dem Ballführer die Zone frei.',
    notes:{drive:'Dein Verteidiger ist mitgelaufen. Jetzt standen zwei Spieler mehr in der Zone, und dein Aufbau kam nicht durch.',shot:'Dein Verteidiger hat dich allein gelassen. Wärst du zum Korb gelaufen, hättest du den Ball bekommen.'}};
}

// ================= DURCHBRUCH & KICK-OUT =================
// Du ziehst zum Korb. Entschieden wird erst in der Zone: Springt dir einer in den Weg, ist sein Mitspieler frei.
let kickComparison=null;
function buildDKick(v,T,L,M,from){
  const featured=from==='top'&&kickComparison?.version!=='before';
  const s=R()<.5?-1:1,wing=from==='wing';
  const H=addP('H','off',wing?(s<0?3:2):1);
  let hS,hE,mates;
  if(!wing){hS=pt(s*rand(.3,.8),-9.6);hE=pt(s*rand(.75,1.0),-3.5);
    mates=[['LW',3,'Flügel links',pt(rand(-6.3,-5.8),rand(-4.6,-3.8))],['RW',2,'Flügel rechts',pt(rand(5.8,6.3),rand(-4.6,-3.8))],['C',5,'Center',pt(-s*rand(2.7,3.0),rand(-.8,-.4)),'layup']];
    if(M===5)mates.push(['K',7,s<0?'Ecke links':'Ecke rechts',pt(s*rand(6.6,6.9),rand(.2,.6))]);}
  else{hS=pt(s*5.5,-6.9);hE=pt(s*1.75,-2.3);
    mates=[['TOP',1,'Aufbau oben',pt(-s*rand(.6,1.2),rand(-8.0,-7.4))],['OW',s<0?2:3,'Flügel gegenüber',pt(-s*rand(5.8,6.3),rand(-4.6,-3.8))],['C',5,'Center',pt(-s*rand(2.7,3.0),rand(-.8,-.4)),'layup']];
    if(M===5)mates.push(['K',7,'Ecke',pt(s*rand(6.6,6.9),rand(.2,.6))]);}
  const off={};mates.forEach(([r,n,name,e,fin])=>{off[r]=addP(r,'off',n,{name,finish:fin||'shot'});off[r].end=e;});
  const dH=addP('dH','def',4),defs={};mates.forEach(([r],i)=>{defs[r]=addP('d'+r,'def',[8,6,9,10][i]);});
  GUARD={};mates.forEach(([r])=>GUARD[r]=defs[r]);
  // Laufweg: kurz antäuschen, dann schnell in die Zone
  setPath(H,[[0,hS.x,hS.z],[T*.42,lerp(hS.x,hE.x,.16),lerp(hS.z,hE.z,.16)],[T,hE.x,hE.z]],true);H.dside=s;
  const dl=Math.hypot(hE.x,hE.z),tb=pt(-hE.x/dl,-hE.z/dl),d0=Math.hypot(hS.x,hS.z),tb0=pt(-hS.x/d0,-hS.z/d0);
  const sd=pt(-tb.z*s,tb.x*s); // seitlich zur Mitte, weg von der Kamera
  // Feste Kamera etwas weiter hinten: Du bist schon nah am Korb, die Schützen stehen breit verteilt
  const cf=wing?pt(hS.x*.8,hS.z*.8):pt(hE.x*.35,-7.4),cd=wing?tb0:pt(0,1),cs=pt(-cd.z*s,cd.x*s);
  // Geschlagener Verteidiger: erst vor dir, am Ende hinter dir auf der anderen Seite
  setPath(dH,[[0,hS.x+tb0.x*1.25,hS.z+tb0.z*1.25],[T*.42,lerp(hS.x,hE.x,.16)+tb0.x*.9-sd.x*.3,lerp(hS.z,hE.z,.16)+tb0.z*.9-sd.z*.3],[T,hE.x-cd.x*1.3-cs.x*.6,hE.z-cd.z*1.3-cs.z*.6]]);
  const hr={kickL:'LW',kickR:'RW',kickTop:'TOP',kickOW:'OW',dump:'C',kickK:'K'}[v]||null,helper=hr?'d'+hr:null;
  const spotOf=r=>{const e=off[r].end,dx=e.x-hE.x,dz=e.z-hE.z,lat=dx*-tb.z+dz*tb.x,sg=Math.abs(lat)<.4?-s:Math.sign(lat);
    return pt(hE.x+tb.x*1.05+(-tb.z)*sg*.75,hE.z+tb.z*1.05+tb.x*sg*.75);};
  const homes={};
  mates.forEach(([r])=>{const m=off[r],e=m.end,D=defs[r],st=pt(e.x,e.z-1.6);
    setPath(m,[[0,st.x,st.z],[T*.75,e.x,e.z]]);
    const h=r==='C'?pt(e.x+s*.55,e.z-.45):homeOf(e,.85,hE);homes[D.role]=h;
    const ds=r==='C'?pt(e.x+s*.3,e.z-.9):homeOf(st,.9,hS);
    if(helper===D.role){const sp=spotOf(r);
      if(featured){
        const plant=pt(lerp(h.x,sp.x,.12),lerp(h.z,sp.z,.12));
        D.plantTime=T*.57;
        setPath(D,[[0,ds.x,ds.z],[T*.43,h.x,h.z],[D.plantTime,plant.x,plant.z],[T*.84,sp.x,sp.z]]);
      }else setPath(D,[[0,ds.x,ds.z],[T*.5,h.x,h.z],[T*.96,sp.x,sp.z]]);
    }
    else setPath(D,[[0,ds.x,ds.z],[T*.7,h.x,h.z]]);});
  const cand=mates.filter(([r])=>'d'+r!==helper).map(([r])=>[defs[r],spotOf(r)]);
  const fake=maybeFake(L,cand,homes,T);
  const ans=v==='lay'?'drive':'pass:'+hr;
  const WHY={lay:'Du bist an deinem Verteidiger vorbeigezogen, und keiner ist dir in den Weg gesprungen. Freie Bahn: Mach den Korbleger!',
    dump:'Der Verteidiger des Centers ist dir unter dem Korb in den Weg gesprungen. Dadurch stand dein Center ganz allein. Kurzer Pass, leichter Korb!',
    kickL:'Der Verteidiger deines linken Flügelspielers ist dir in der Zone in den Weg gesprungen. Dadurch stand dein Mitspieler links frei für den Wurf. Pass raus!',
    kickR:'Der Verteidiger deines rechten Flügelspielers ist dir in der Zone in den Weg gesprungen. Dadurch stand dein Mitspieler rechts frei für den Wurf. Pass raus!',
    kickTop:'Der Verteidiger deines Aufbauspielers ist dir in den Weg gesprungen. Dadurch stand dein Aufbau oben frei für den Wurf. Pass raus!',
    kickOW:'Der Verteidiger vom Flügel gegenüber ist in die Zone gerückt, um dich zu stoppen. Dadurch stand dein Mitspieler auf der anderen Seite frei. Pass raus!',
    kickK:'Der Verteidiger aus der Ecke ist dir in den Weg gesprungen. Dadurch stand dein Mitspieler in der Ecke frei für den Wurf. Pass raus!'};
  const why=WHY[v];
  return{ans,helper,fake,featured,camSide:s,why,labels:{drive:LBL_DEF.drive,shot:null},camFix:{x:cf.x,z:cf.z,dx:cd.x,dz:cd.z},
    rule:v==='lay'?'Zieh zum Korb. Springt dir keiner in den Weg, mach den Korbleger!':'Zieh zum Korb. Springt dir einer in den Weg, pass zu dem, den er allein gelassen hat!',
    driveNote:'Ein Verteidiger ist dir in den Weg gesprungen. Da wärst du direkt hineingelaufen.',
    prompt:featured?'Lies die Hilfe in der Zone.':'Du ziehst zum Korb. Was machst du?'};
}

// ================= LANGER PASS =================
// Früh nach vorne schauen: Ist ein Läufer allein vorne, wirf den langen Pass.
// who='center': nach dem Rebound unter dem eigenen Korb, sonst kurzer Pass zum Aufbau an der Seite.
// who='pg': nach dem Ballgewinn, sonst selbst nach vorne dribbeln.
function buildLong(v,T,L,M,who){
  const s=R()<.5?-1:1,ctr=who==='center';
  const H=addP('H','off',ctr?5:1);
  const RL=addP('RL','off',3,{name:'Läufer links',finish:'layup'}),RR=addP('RR','off',2,{name:'Läufer rechts',finish:'layup'});
  const PG=ctr?addP('PG','off',1,{name:'Aufbau an der Seite'}):null;
  const TR=M===5?addP('TR','off',ctr?4:5,{sel:false}):null;
  const dH=addP('dH','def',ctr?9:4),dL=addP('dRL','def',8),dR=addP('dRR','def',6),dP=addP(ctr?'dPG':'dX','def',ctr?4:9),dT=M===5?addP('dTR','def',10):null;
  GUARD={RL:dL,RR:dR};if(PG)GUARD.PG=dP;
  [TR,dT].forEach(p=>p&&(p.trail=true));
  const zH=ctr?-23.2:-15.6,zR=ctr?-10.2:-6.4,run=ctr?11.5:10.5;
  if(ctr){setPath(H,[[0,s*.9,-24.4],[T*.55,s*1.2,-23.6],[T,s*1.3,zH]]);}
  else setPath(H,[[0,s*.5,-19.6],[T,s*.3,zH]],true);
  const fL=v==='longL',fR=v==='longR';
  const xr=ctr?4.3:4.4;
  setPath(RL,[[0,-xr,zR-run],[T,-xr-.2,zR+(fL?.4:0)]],true);setPath(RR,[[0,xr,zR-run-.3],[T,xr+.2,zR+(fR?.4:0)]],true);
  // Verteidiger beim Läufer: läuft mit und steht zwischen Läufer und Korb. Sonst weit hinten.
  const guard=(D,sg,free)=>{if(free){setPath(D,[[0,sg*(xr-.6),zR-run-1.5],[T,sg*(xr+.9),zR-7.4]],true);} // hängt hinten an der Seitenlinie, nicht im Passweg
    else{setPath(D,[[0,sg*(xr-1.0),zR-run+1.2],[T,sg*(xr-.75),zR+1.1]],true);}};
  guard(dL,-1,fL);guard(dR,1,fR);
  if(ctr){setPath(dH,[[0,-s*.2,-23.0],[T,-s*.4,zH+.6]]);
    const pS=pt(s*5.4,-20.4),pE=pt(s*5.0,-20.9);setPath(PG,[[0,pS.x,pS.z],[T*.7,pE.x,pE.z]]);
    if(v==='outlet')setPath(dP,[[0,s*3.2,-19.0],[T,s*1.4,-15.6]],true); // zurückgelaufen, der Aufbau ist frei
    else setPath(dP,[[0,s*4.4,-19.4],[T*.7,lerp(pE.x,H.path[2][1],.18),lerp(pE.z,zH,.18)+.35]]);} // stellt den kurzen Pass zu
  else{setPath(dH,[[0,s*.9,-21.0],[T,s*2.2,zH-3.6]],true);setPath(dP,[[0,-s*1.6,-22.4],[T,-s*1.4,zH-3.2]],true);}
  if(TR){setPath(TR,[[0,-s*2.2,ctr?-25:-21.6],[T,-s*2.0,zH-1.2]],true);setPath(dT,[[0,-s*2.8,ctr?-24.6:-21],[T,-s*2.6,zH-.8]],true);}
  const ans=fL?'pass:RL':fR?'pass:RR':ctr?'pass:PG':'drive';
  const side=fL?'links':'rechts';
  const why=fL||fR?`Dein Läufer ${side} ist an allen Verteidigern vorbeigesprintet. Vor ihm war nur noch der Korb. ${ctr?'Der lange Pass ist der schnellste Weg nach vorne!':'Ein langer Pass ist schneller als jedes Dribbling!'}`
    :ctr?'Beide Läufer waren gedeckt, ein langer Pass wäre abgefangen worden. Der Aufbau an der Seite war frei: kurzer Pass, und er bringt den Ball nach vorne.'
    :'Beide Läufer waren gedeckt, ein langer Pass wäre abgefangen worden. Vor dir war aber die Mitte frei: selbst nach vorne dribbeln!';
  const out={};
  if(ctr){out.outcome=(choice,ok,finish)=>{
    if(choice==='pass:PG'&&ok){ball.y=Math.max(1,ball.y);act(H,'pass',.4);const tf=passT(Math.hypot(PG.x-ball.x,PG.z-ball.z));
      fly({x:PG.x,y:1.2,z:PG.z},tf,passH(tf),()=>{ball.owner=PG;ball.hold=false;act(PG,'catch',.25);flash('Guter Pass!','#7ff0ad');sfx.good();
        goTo(PG,[[1.6,s*3.4,-13.5]],true);goTo(H,[[1.6,s*1.2,-17]]);finish(1.4);});}
    else if(choice.startsWith('pass:')){const Wp=role(choice.slice(5));if(ok)passOk(Wp,finish);else passBad(Wp,finish,GUARD[Wp.role]);}};}
  else out.outcome=(choice,ok,finish)=>{
    if(choice==='drive'&&ok){ball.hold=false;const sx=Math.sign(H.x)||1,tx=sx*.55,tz=-1.2,du=Math.hypot(H.x-tx,H.z-tz)/6.3;
      goTo(H,[[du,tx,tz]],true);goTo(dH,[[du,tx-sx*1.2,tz-4]]);later(du,()=>layShot(H,()=>{flash('Korbleger!','#7ff0ad');sfx.good();finish(.7);}));}
    else if(choice==='drive'){goTo(H,[[1.4,H.x,-9.6]],true);[dL,dR].forEach((D,i)=>goTo(D,[[1.2,(i?1:-1)*1.3,-7.2]]));goTo(fL?RL:RR,[[1.2,(fL?-1:1)*3.6,-3.6]]);
      later(1.35,()=>{G.slowT=.4;sfx.bad();flash('Verteidigung ist zurück','#ff7b72');finish(1.1);});}
    else{const Wp=role(choice.slice(5));if(ok)passOk(Wp,finish);else passBad(Wp,finish,GUARD[Wp.role]);}};
  return Object.assign(out,{ans,helper:ctr?null:(fL||fR?'dX':null),fake:false,hold:ctr,onBall:true,q:fL||fR?{t:'Wer war frei?',r:fL?'RL':'RR'}:ctr?{t:'Wer war frei?',r:'PG'}:{t:'Wo stand dein Verteidiger?',r:'dH'},camSide:-s,why,
    labels:ctr?{drive:null,shot:null}:{drive:['▲','Selbst dribbeln'],shot:null},
    prompt:ctr?'Rebound! Wohin passt du?':'Ballgewinn! Was machst du?',
    rule:fL||fR?'Ist ein Läufer allein vorne, wirf sofort den langen Pass!':ctr?'Sind die Läufer gedeckt, spiel den kurzen Pass zum freien Aufbau.':'Sind die Läufer gedeckt, dribbel selbst schnell nach vorne.',
    driveNote:'Selbst dribbeln dauert zu lange. Bis du vorne bist, ist die Verteidigung zurück. Der Ball fliegt schneller!',
    notes:{pass:fL||fR?'Dieser Pass ging zu einem gedeckten Mitspieler. Schau zuerst ganz nach vorne!':'Der Verteidiger lief direkt neben deinem Läufer. Der lange Pass wäre abgefangen worden.'}});
}

// ================= NEUE SPIELZÜGE (Prinzipien aus der DBB-Spielkonzeption, ohne Blöcke) =================
// Zuspiel ohne Wurf: Ball fliegt zu Wp, danach after()
function passTo(Wp,after){ball.y=Math.max(1,ball.y);act(ball.owner,'pass',.4);const tf=passT(Math.hypot(Wp.x-ball.x,Wp.z-ball.z));
  const[x,z]=Wp.path?evalPath(Wp.path,Wp.pt+tf,Wp.lin):[Wp.x,Wp.z];fly({x,y:1.2,z},tf,passH(tf),()=>{ball.owner=Wp;ball.hold=true;act(Wp,'catch',.25);after&&after();});}
// --------- Aufbau 5: Pass und geh (Give-and-go) oder Pass und raus ---------
function buildGive(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',1),W=addP('W','off',s<0?3:2,{sel:false,name:'Flügel'}),OW=addP('OW','off',s<0?2:3,{sel:false}),C=addP('C','off',5,{sel:false});
  const K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',4),dW=addP('dW','def',8),dO=addP('dOW','def',6),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  GUARD={};
  const hP=pt(s*rand(.7,1.2),rand(-8.3,-7.8)),hE=pt(hP.x+s*.15,hP.z+.35);
  setPath(H,[[0,s*.3,-11.6],[T*.4,hP.x,hP.z],[T,hE.x,hE.z]]);
  const wD=pt(s*rand(5.1,5.5),rand(-5.9,-5.3));setPath(W,[[0,s*5.7,-7.0],[T*.5,wD.x,wD.z]]);
  const hW=pt(wD.x-s*.5,wD.z+1.0);setPath(dW,[[0,s*5.1,-6.4],[T*.5,hW.x,hW.z]]);
  const oD=pt(-s*rand(5.5,6.0),rand(-4.8,-4.0));setPath(OW,[[0,-s*5.4,-7],[T*.7,oD.x,oD.z]]);const ho=homeOf(oD,1.6,hE);setPath(dO,[[0,-s*4.8,-6.4],[T*.7,ho.x,ho.z]]);
  const cD=pt(-s*rand(2.8,3.2),rand(-.8,-.3));setPath(C,[[0,-s*1.6,-3.4],[T*.7,cD.x,cD.z]]);setPath(dC,[[0,-s*1.2,-2.6],[T*.7,cD.x+s*.7,cD.z-.4]]);
  if(K){const kD=pt(-s*rand(6.6,6.9),rand(.2,.6));setPath(K,[[0,-s*6.2,-1.8],[T*.6,kD.x,kD.z]]);const hK=homeOf(kD,1.5,hE);setPath(dK,[[0,-s*5.4,-1.4],[T*.7,hK.x,hK.z]]);}
  const jump=pt(hE.x+s*1.45,hE.z+.1),stay=pt(hE.x+s*.25,hE.z+1.45);let fake=false;
  const fin=v==='cut'?jump:stay,oth=v==='cut'?stay:jump;
  if(L>=2&&R()<(L===3?.7:.45)){fake=true;setPath(dH,[[0,s*.3,-10.3],[T*.4,hP.x,hP.z+1.1],[T*.65,oth.x,oth.z],[T*.97,fin.x,fin.z]]);}
  else setPath(dH,[[0,s*.3,-10.3],[T*.4,hP.x,hP.z+1.1],[T*.75,fin.x,fin.z]]);
  const outcome=(choice,ok,finish)=>{
    if(choice==='drive'){if(ok){H.finish='layup';later(.2,()=>passOk(H,finish));later(.3,()=>goTo(dH,[[1.0,s*1.0,-3.0]]));}
      else{goTo(H,[[.8,s*.7,-4.2]],true);later(.25,()=>passBad(H,finish,dH));}}
    else{goTo(H,[[1.0,-s*2.4,-7.9]]);goTo(dH,[[1.0,lerp(dH.x,-s*2.0,.8),-6.9]]);
      if(ok)later(.35,()=>{goTo(dW,[[.9,s*2.6,-3.2]]);layup(W,()=>{flash('Korbleger!','#7ff0ad');sfx.good();finish(.7);});});
      else later(.6,()=>{goTo(dW,[[.4,lerp(dW.x,W.x,.7),lerp(dW.z,W.z,.7)]]);later(.2,()=>{dW.armsUp=1.2;act(dW,'block',.8);});
        shootFrom(W,false,()=>{flash('Chance verpasst','#ff7b72');sfx.bad();finish(.6);});});}};
  return{ans:v==='cut'?'drive':'shot',helper:null,fake,camSide:s,outcome,give:{to:'W',t0:T*.32,t1:T*.52},shotDir:'away',
    labels:{drive:['↩','Zum Korb schneiden'],shot:['→','Platz machen']},prompt:'Du hast gepasst. Wohin läufst du jetzt?',
    why:v==='cut'?'Nach deinem Pass hat dein Verteidiger zum Ball geschaut und ist zur Seite gesprungen. Der Weg zum Korb war frei: Schneide, und du bekommst den Ball zurück!'
      :'Dein Verteidiger ist zwischen dir und dem Korb geblieben. Also raus und Platz machen: Dein Verteidiger geht mit, und dein Flügelspieler hat Platz zum Korb.',
    rule:v==='cut'?'Pass und geh: Schaut dein Verteidiger zum Ball, schneide zum Korb!':'Pass und raus: Bleibt dein Verteidiger zwischen dir und dem Korb, mach Platz für deinen Mitspieler!',
    notes:{drive:'Dein Verteidiger stand zwischen dir und dem Korb. Der Pass zu dir wäre abgefangen worden.',shot:'Dein Verteidiger hat zum Ball geschaut. Hinter seinem Rücken war der Weg frei, und du hättest den Ball zurückbekommen.'}};
}
// --------- Flügel 4: Extra-Pass (nach dem Zuspiel aus dem Zug zum Korb) ---------
function buildXPass(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',s<0?3:2),PG=addP('PG','off',1,{name:'Aufbau'}),K=addP('K','off',4,{name:'Ecke'}),C=addP('C','off',5,{name:'Center',finish:'layup'});
  const OW=M===5?addP('OW','off',s<0?2:3,{name:'Flügel gegenüber'}):null;
  const dH=addP('dH','def',8),dP=addP('dPG','def',6),dK=addP('dK','def',10),dC=addP('dC','def',9),dO=M===5?addP('dOW','def',7):null;
  GUARD={PG:dP,K:dK,C:dC,OW:dO};
  const hD=pt(s*rand(5.2,5.5),rand(-4.8,-4.3));setPath(H,[[0,s*5.6,-5.6],[T*.5,hD.x,hD.z]]);
  const pIn=pt(s*rand(1.2,1.6),-2.7),pOut=pt(-s*1.2,-5.8);setPath(PG,[[0,s*1.2,-9.6],[T*.5,pIn.x,pIn.z],[T,pOut.x,pOut.z]]);
  setPath(dP,[[0,s*1.1,-8.4],[T*.5,pIn.x-s*.2,pIn.z-1.0],[T,pOut.x+s*.3,pOut.z+1.0]]);
  const kD=pt(s*rand(6.5,6.8),rand(.1,.5));setPath(K,[[0,s*6.6,-1.2],[T*.5,kD.x,kD.z]]);
  const kHome=pt(kD.x-s*.8,kD.z-.6),kHelp=pt(s*3.1,-.9);
  if(v==='close')setPath(dK,[[0,s*5.8,-1.0],[T*.45,kHelp.x,kHelp.z],[T,kHelp.x+s*.25,kHelp.z-.1]]);else setPath(dK,[[0,s*5.8,-1.0],[T*.45,kHelp.x,kHelp.z],[T*.85,kHome.x,kHome.z]]);
  const cD=pt(-s*rand(2.8,3.2),rand(-.8,-.3));setPath(C,[[0,-s*1.8,-3.0],[T*.6,cD.x,cD.z]]);setPath(dC,[[0,-s*1.4,-2.4],[T*.6,cD.x+s*.7,cD.z-.4]]);
  if(OW){const oD=pt(-s*rand(5.5,5.9),rand(-4.8,-4.2));setPath(OW,[[0,-s*5.6,-6],[T*.6,oD.x,oD.z]]);const ho=homeOf(oD,1.6,hD);setPath(dO,[[0,-s*5,-5.4],[T*.6,ho.x,ho.z]]);}
  const help=pt(s*2.7,-2.9);
  if(v==='open')setPath(dH,[[0,s*4.4,-4.6],[T*.45,help.x,help.z],[T,help.x-s*.1,help.z+.1]]);
  else if(v==='close')setPath(dH,[[0,s*4.4,-4.6],[T*.45,help.x,help.z],[T*.7,help.x,help.z],[T,hD.x-s*.85,hD.z+.75]]);
  else setPath(dH,[[0,s*4.4,-4.6],[T*.45,help.x,help.z],[T*.7,help.x,help.z],[T,hD.x-s*.55,hD.z+.2]]);
  const ans={open:'shot',close:'pass:K',fly:'drive'}[v];
  return{ans,helper:v==='close'?'dK':null,fake:false,camSide:s,feed:{from:'PG',t0:T*.5,t1:T*.72},
    why:{open:'Dein Verteidiger hat beim Zug des Aufbaus ausgeholfen und ist in der Zone geblieben. Du warst frei: Fangen und werfen!',
      close:'Dein Verteidiger ist zu dir herausgelaufen. Der Verteidiger aus der Ecke stand aber noch in der Zone. Ein Pass weiter, und dein Mitspieler in der Ecke war ganz frei: Extra-Pass!',
      fly:'Dein Verteidiger kam mit viel Schwung auf dich zu, und alle Mitspieler waren gedeckt. Ein schneller Schritt an ihm vorbei, und der Weg zum Korb war frei!'}[v],
    rule:{open:'Bleibt dein Verteidiger weg? Fangen und werfen!',close:'Frei ist gut, noch freier ist besser: Kommt dein Verteidiger zu dir, spiel den Extra-Pass!',fly:'Kommt dein Verteidiger angerannt und keiner ist frei? Zieh an ihm vorbei!'}[v],
    notes:{shot:v==='open'?null:'Dein Verteidiger war schon bei dir. Der Wurf wäre gestört worden.',pass:v==='open'?'Du warst selbst frei. Ein freier Wurf ist hier die beste Lösung.':null},
    q:v==='close'?{t:'Wer war frei?',r:'K'}:null};
}
// --------- Flügel 5: Einer gegen zwei (1 can't guard 2) ---------
function buildTwo(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',s<0?3:2),K=addP('K','off',4,{name:'Ecke'}),PG=addP('PG','off',1,{sel:false}),C=addP('C','off',5,{sel:false}),OW=M===5?addP('OW','off',s<0?2:3,{sel:false}):null;
  const dB=addP('dB','def',8),dH=addP('dH','def',6),dP=addP('dPG','def',4),dC=addP('dC','def',9),dO=M===5?addP('dOW','def',10):null;
  [PG,C,OW,dH,dP,dC,dO].forEach(p=>p&&(p.trail=true));
  GUARD={K:dB};
  const hD=pt(s*rand(4.4,4.8),rand(-6.0,-5.5));setPath(H,[[0,s*4.4,-20],[T,hD.x,hD.z]],true);
  const kD=pt(s*rand(6.3,6.6),rand(-.6,-.1));setPath(K,[[0,s*2.4,-19.5],[T*.55,s*5.4,-6.5],[T,kD.x,kD.z]]);
  setPath(PG,[[0,s*.2,-21],[T,s*.4,-13.2]],true);setPath(dP,[[0,s*.8,-22.4],[T,s*.9,-12.4]],true);
  setPath(dH,[[0,s*3.2,-23.5],[T,s*3.4,-11.2]],true);setPath(C,[[0,-s*2,-25],[T,-s*1.8,-14.5]],true);setPath(dC,[[0,-s*2.6,-24.4],[T,-s*2.4,-13.8]],true);
  if(OW){setPath(OW,[[0,-s*4.4,-23],[T,-s*4.5,-12.8]],true);setPath(dO,[[0,-s*3.8,-24],[T,-s*3.9,-12.0]],true);}
  const toYou=pt(hD.x-s*.6,hD.z+1.35),stayK=pt(kD.x-s*.9,kD.z-1.1),mid=pt(s*3.6,-2.4);
  const fin={toYou,stayK,middle:mid}[v];let fake=false;
  if(L>=2&&v!=='middle'&&R()<(L===3?.6:.4)){fake=true;const o=v==='toYou'?stayK:toYou;setPath(dB,[[0,s*2.0,-5.0],[T*.6,o.x,o.z],[T*.97,fin.x,fin.z]]);}
  else setPath(dB,[[0,s*2.0,-5.0],[T*.6,mid.x,mid.z],[T,fin.x,fin.z]]);
  const ans={toYou:'pass:K',stayK:'drive',middle:'shot'}[v];
  return{ans,helper:v==='stayK'?null:'dB',fake,camSide:s,feed:{from:'PG',t0:T*.3,t1:T*.6},
    why:{toYou:'Ein Verteidiger gegen zwei Angreifer: Er ist zu dir gekommen. Dadurch war dein Mitspieler in der Ecke frei!',
      stayK:'Der Verteidiger ist bei deinem Mitspieler in der Ecke geblieben. Vor dir war der Weg zum Korb frei!',
      middle:'Der Verteidiger ist tief in der Mitte zwischen euch geblieben. Er war weit weg von dir und hat den Weg zum Korb und die Ecke zugestellt. Du hattest Platz zum Werfen.'}[v],
    rule:v==='middle'?'Bleibt der Verteidiger tief zwischen euch, hast du Platz zum Werfen.':'Einer kann nicht zwei decken. Schau, wen er nimmt, und spiel den anderen!',
    notes:{drive:v==='middle'?'Der Verteidiger stand tief vor dem Korb und hätte dich dort erwartet.':null},
    q:v==='toYou'?{t:'Wer war frei?',r:'K'}:{t:'Wo stand der Verteidiger?',r:'dB'}};
}
// --------- Center 4: Rim Run im Schnellangriff ---------
function buildRimRun(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',5),PG=addP('PG','off',1,{sel:false}),W=addP('W','off',s<0?3:2,{sel:false}),OW=addP('OW','off',s<0?2:3,{sel:false}),K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',9),dP=addP('dPG','def',4),dW=addP('dW','def',8),dO=addP('dOW','def',6),dK=M===5?addP('dK','def',10):null;
  if(K){K.trail=true;dK.trail=true;}
  GUARD={};
  const hD=pt(s*rand(.8,1.2),rand(-7.6,-7.1));setPath(H,[[0,s*1.6,-23],[T,hD.x,hD.z]],true);
  setPath(PG,[[0,-s*.4,-24],[T,-s*.5,-10.6]],true);setPath(dP,[[0,-s*.3,-14],[T,-s*.4,-9.3]]);
  setPath(W,[[0,s*4.6,-22],[T,s*5.5,-6.8]],true);setPath(dW,[[0,s*4,-16],[T,s*4.6,-5.6]]);
  setPath(OW,[[0,-s*4.6,-22],[T,-s*5.5,-7.4]],true);setPath(dO,[[0,-s*4,-16],[T,-s*4.6,-6.2]]);
  if(K){setPath(K,[[0,s*.4,-26],[T,s*.6,-13.5]],true);setPath(dK,[[0,s*1,-26.5],[T,s*1.1,-12.8]],true);}
  if(v==="run")setPath(dH,[[0,s*2.6,-25],[T,hD.x+s*.8,hD.z-1.5]],true);
  else setPath(dH,[[0,s*.8,-18],[T*.8,s*.5,-3.2],[T,s*.45,-2.7]]);
  const outcome=(choice,ok,finish)=>{
    if(choice==='drive'){if(ok){H.finish='layup';later(.1,()=>passOk(H,finish));later(.2,()=>goTo(dH,[[1.1,s*.9,-2.2]]));}
      else{goTo(H,[[.7,s*.8,-3.6]],true);later(.2,()=>passBad(H,finish,dH));}}
    else{goTo(H,[[.35,s*1.3,-5.6]]);
      if(ok)later(.3,()=>passOk(H,finish));
      else{goTo(dH,[[.6,s*1.1,-4.6]]);later(.35,()=>passTo(H,()=>{dH.armsUp=1.2;act(dH,'block',.8);shootFrom(H,false,()=>{flash('Daneben','#ff7b72');sfx.bad();finish(.6);});}));}}};
  const dir=1;
  return{ans:v==='run'?'drive':'shot',helper:null,fake:false,outcome,ballAt:'PG',
    labels:{drive:['⤓','Zum Korb sprinten'],shot:['✋','Hinten bleiben']},prompt:'Schnellangriff! Wohin läufst du?',
    why:v==='run'?'Dein Verteidiger war hinter dir. Sprinte zum Korb, zeig die Hände, und der Aufbau passt dir den Ball in den Lauf!'
      :'Dein Verteidiger war schon vor dir in der Zone. Wärst du hineingelaufen, hätte er auf dich gewartet. Also hinten bleiben: An der Freiwurflinie warst du frei.',
    rule:v==='run'?'Ist dein Verteidiger hinter dir, sprinte zum Korb!':'Ist dein Verteidiger schon zurück, bleib hinten und biete dich an.',
    notes:{drive:'Dein Verteidiger stand schon in der Zone und hat den Pass abgefangen.',shot:'Dein Verteidiger war hinter dir. Als du stehen geblieben bist, hat er dich eingeholt.'}};
}

// ================= BALL BEWEGEN (FIBA Mini-Basketball: Ball umkehren, Flash-Cut, Space and Movement) =================
// --------- Aufbau 8: Ball umkehren ---------
// Der Ball kommt vom Flügel zurück zu dir nach oben. Die Abwehr steht noch auf der Seite, wo der Ball war.
function buildSwing(v,T,L,M){
  const s=R()<.5?-1:1; // Ball kommt von Seite s, umgekehrt wird zur Seite -s
  const H=addP('H','off',1),W1=addP('W1','off',s<0?3:2,{name:'Flügel'}),OW=addP('OW','off',s<0?2:3,{name:'Flügel gegenüber'}),C=addP('C','off',5,{name:'Center',finish:v==='gap'?'shot':'layup'});
  const K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',4),dW=addP('dW1','def',8),dO=addP('dOW','def',6),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  GUARD={W1:dW,OW:dO,C:dC};
  const wD=pt(s*rand(5.3,5.7),rand(-5.0,-4.4));setPath(W1,[[0,s*5.8,-6.8],[T*.3,wD.x,wD.z]]);
  setPath(dW,[[0,s*5.2,-6.0],[T*.3,wD.x-s*.5,wD.z+.8],[T*.75,wD.x-s*.8,wD.z-.15]]); // nach dem Pass: Passweg zurück zustellen
  const hS=pt(s*2.6,-9.6),hE=pt(s*rand(.35,.6),rand(-8.1,-7.7));
  setPath(H,[[0,hS.x,hS.z],[T*.6,lerp(hS.x,hE.x,.8),lerp(hS.z,hE.z,.8)],[T,hE.x,hE.z]]);
  const dFin=v==='swing'?pt(hE.x*.8,hE.z+1.15):v==='gap'?pt(hE.x+s*.4,hE.z+.8):pt(hE.x-s*1.0,hE.z+.25);
  setPath(dH,[[0,hS.x-s*.2,hS.z+1.2],[T*.6,lerp(hS.x,hE.x,.8),lerp(hS.z,hE.z,.8)+1.1],[T*.97,dFin.x,dFin.z]]);
  const oD=pt(-s*rand(5.4,5.8),rand(-5.0,-4.4));setPath(OW,[[0,-s*5.6,-6.8],[T*.5,oD.x,oD.z]]);
  const oHelp=pt(-s*rand(1.6,1.9),rand(-3.4,-2.9)),oHome=homeOf(oD,1.0,hE);
  if(v==='swing'){if(L>=2){const mid=pt(lerp(oHelp.x,oHome.x,.3),lerp(oHelp.z,oHome.z,.3));setPath(dO,[[0,oHelp.x,oHelp.z-.6],[T*.4,oHelp.x,oHelp.z],[T*.68,mid.x,mid.z],[T*.95,oHelp.x,oHelp.z]]);}
    else setPath(dO,[[0,oHelp.x,oHelp.z-.6],[T*.4,oHelp.x,oHelp.z]]);}
  else setPath(dO,[[0,oHelp.x,oHelp.z-.6],[T*.42,oHelp.x,oHelp.z],[L>=2?T*.95:T*.72,oHome.x,oHome.z]]);
  const cL=pt(-s*rand(2.7,3.0),rand(-.7,-.3));
  if(v==='gap'){const cF=pt(-s*rand(1.3,1.6),rand(-4.8,-4.5));setPath(C,[[0,cL.x,cL.z-.4],[T*.45,cL.x,cL.z],[T*.95,cF.x,cF.z]]);setPath(dC,[[0,cL.x+s*.6,cL.z-.9],[T*.5,cL.x+s*.6,cL.z-.5],[T,cL.x+s*.8,cL.z-1.0]]);}
  else{setPath(C,[[0,cL.x,cL.z-.4],[T*.6,cL.x,cL.z]]);setPath(dC,[[0,cL.x+s*.6,cL.z-.9],[T*.6,cL.x+s*.55,cL.z-.45]]);}
  if(K){const kD=pt(s*rand(6.6,6.9),rand(.2,.6));setPath(K,[[0,s*6.2,-1.6],[T*.6,kD.x,kD.z]]);const hK=homeOf(kD,.9,wD);setPath(dK,[[0,s*5.4,-1.4],[T*.6,hK.x,hK.z]]);}
  const ans={swing:'pass:OW',gap:'pass:C',drive:'drive'}[v];
  return{ans,helper:v==='drive'?null:'dH',fake:false,camSide:s,feed:{from:'W1',t0:T*.3,t1:T*.62},
    why:{swing:'Der Ball kam von der einen Seite, und die Verteidigung stand noch dort. Der Verteidiger von der anderen Seite war in der Zone. Ball umkehren: schnell auf die andere Seite, dort war dein Mitspieler frei!',
      gap:'Der Verteidiger von der anderen Seite war zurück bei seinem Mitspieler. Dafür ist dein Center zur Freiwurflinie gelaufen, genau in die Lücke zwischen den Verteidigern. Pass in die Lücke!',
      drive:'Dein Verteidiger ist zur Seite gesprungen, um den Pass auf die andere Seite zu stoppen. Er stand neben dir statt vor dir: Zieh an ihm vorbei zum Korb!'}[v],
    rule:{swing:'Steht die Abwehr auf einer Seite, spiel den Ball schnell auf die andere Seite!',gap:'Läuft ein Mitspieler in die Lücke zwischen zwei Verteidigern, spiel ihm den Ball!',drive:'Steht dein Verteidiger neben dir statt vor dir? Ab zum Korb!'}[v],
    driveNote:'Dein Verteidiger stand direkt vor dir, da war kein Weg frei.',
    notes:{shot:v==='drive'?'Dein Verteidiger stand neben dir, der Weg zum Korb war frei. Ein Korbleger ist viel sicherer als ein weiter Wurf.':'Von so weit draußen ist ein Wurf schwer, und ein Mitspieler war frei.'},
    q:v==='swing'?{t:'Wo stand der Verteidiger vom Flügel gegenüber?',r:'dOW'}:v==='gap'?{t:'Wer war frei?',r:'C'}:null};
}
// --------- Center 6: Flash-Cut (ohne Ball) ---------
// Dein Flügel wird bedrängt. Ist der Platz an der Freiwurflinie frei, lauf zum Ball. Steht dort schon jemand, bleib unten und lass Platz.
function buildCFlash(v,T,L,M){
  const s=R()<.5?-1:1; // Ball auf Seite s, du stehst unten auf der anderen Seite
  const H=addP('H','off',5),W=addP('W','off',s<0?3:2,{sel:false}),PG=addP('PG','off',1,{sel:false}),OW=addP('OW','off',s<0?2:3,{sel:false});
  const K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',9),dW=addP('dW','def',8),dP=addP('dPG','def',4),dO=addP('dOW','def',6),dK=M===5?addP('dK','def',10):null;
  GUARD={};
  const hD=pt(-s*rand(2.7,2.9),rand(-.7,-.4));setPath(H,[[0,-s*3.5,-1.8],[T*.6,hD.x,hD.z]]);
  const wD=pt(s*rand(5.4,5.7),rand(-5.2,-4.7));setPath(W,[[0,s*5.9,-7.2],[T*.5,wD.x,wD.z]]);
  setPath(dW,[[0,s*5.3,-6.4],[T*.5,wD.x-s*.3,wD.z+.95]]);
  const pD=pt(s*rand(2.0,2.4),rand(-9.4,-9.0));setPath(PG,[[0,s*.4,-10.6],[T*.6,pD.x,pD.z]]);
  setPath(dP,[[0,-s*.2,-9],[T*.6,lerp(pD.x,wD.x,.25),lerp(pD.z,wD.z,.25)+.45]]);
  const oD=pt(-s*rand(5.5,5.8),rand(-5.0,-4.5));setPath(OW,[[0,-s*5.6,-7.2],[T*.7,oD.x,oD.z]]);
  if(K){const kD=pt(s*rand(6.6,6.9),rand(.2,.6));setPath(K,[[0,s*6.2,-1.6],[T*.6,kD.x,kD.z]]);setPath(dK,[[0,s*5.4,-1.4],[T*.6,kD.x-s*.7,kD.z-.9]]);}
  const elbow=pt(s*1.5,-4.9),oHome=homeOf(oD,1.6,wD),oHelp=pt(s*rand(.6,.9),rand(-4.8,-4.4)),dLow=pt(hD.x+s*.6,hD.z+.25);
  setPath(dH,[[0,-s*3.0,-1.2],[T*.6,dLow.x,dLow.z]]);
  let fake=false;
  if(v==='flash'){if(L>=2&&R()<(L===3?.7:.45)){fake=true;setPath(dO,[[0,-s*5.0,-6.4],[T*.45,oHelp.x,oHelp.z],[T*.62,oHelp.x,oHelp.z],[T*.97,oHome.x,oHome.z]]);}
    else setPath(dO,[[0,-s*5.0,-6.4],[T*.7,oHome.x,oHome.z]]);}
  else{if(L>=2&&R()<(L===3?.7:.45))setPath(dO,[[0,-s*5.0,-6.4],[T*.6,oHome.x,oHome.z],[T*.97,oHelp.x,oHelp.z]]); // kommt spät: genau hinschauen
    else setPath(dO,[[0,-s*5.0,-6.4],[T*.4,oHome.x,oHome.z],[T*.85,oHelp.x,oHelp.z]]);}
  const outcome=(choice,ok,finish)=>{
    if(choice==='drive'){goTo(H,[[.6,elbow.x,elbow.z]]);
      if(ok){H.finish='shot';later(.25,()=>passOk(H,finish));later(.3,()=>goTo(dH,[[.9,lerp(dLow.x,elbow.x,.55),lerp(dLow.z,elbow.z,.55)+.5]]));}
      else later(.3,()=>passBad(H,finish,dO));}
    else{goTo(H,[[.4,hD.x,hD.z+.15]]);
      if(ok){later(.15,()=>passOk(OW,finish));later(.4,()=>goTo(dO,[[1.1,lerp(oHelp.x,oD.x,.6),lerp(oHelp.z,oD.z,.6)]]));}
      else later(.5,()=>{goTo(dW,[[.4,lerp(dW.x,W.x,.6),lerp(dW.z,W.z,.6)]]);later(.2,()=>{dW.armsUp=1.2;act(dW,'block',.8);});
        shootFrom(W,false,()=>{flash('Chance verpasst','#ff7b72');sfx.bad();finish(.6);});});}};
  const n=Math.hypot(.16,1);
  return{ans:v==='flash'?'drive':'shot',helper:null,fake,outcome,ballAt:'W',driveTo:elbow,shotDir:'stay',rel:['W','dW','OW','dOW'],camSide:-s,
    camFix:{x:-s*.9,z:-5.6,dx:s*.16/n,dz:1/n},
    labels:{drive:['↗','Flash zum Ball'],shot:['✋','Unten bleiben']},prompt:'Dein Flügel wird bedrängt. Was machst du?',
    why:v==='flash'?'Dein Verteidiger stand unten und hat auf den Ball geschaut. An der Freiwurflinie war alles frei: Flash-Cut zum Ball! Dort bekommst du den Pass und kannst werfen.'
      :'An der Freiwurflinie stand schon ein Helfer. Wärst du dorthin gelaufen, hätte er den Pass abgefangen. Also unten bleiben und Platz lassen: Der Helfer hat seinen Flügel allein gelassen, und der Pass geht zu ihm.',
    rule:v==='flash'?'Ist der Platz zwischen dir und dem Ball frei, lauf ihm entgegen: Flash-Cut!':'Steht dort schon jemand, lauf nicht auch noch hin. Bleib unten und lass Platz.',
    notes:{drive:'An der Freiwurflinie stand der Helfer. Du bist direkt zu ihm gelaufen, und er hat den Pass abgefangen.',shot:'Dein Flügel war bedrängt und brauchte Hilfe. Der Platz an der Freiwurflinie war frei, aber keiner kam zum Ball.'},
    q:v==='busy'?{t:'Wo stand der Verteidiger vom Flügel gegenüber?',r:'dOW'}:null};
}


// ================= CENTER: REBOUND UND RIM RUN MIT BALL =================
// --------- Center 7: Offensiv-Rebound ---------
// Dein Flügel wirft, der Ball prallt vom Ring zu dir (feed.miss, missBall in main.js). Steht keiner zwischen dir und dem Korb,
// geh sofort wieder hoch. Steht dein Verteidiger vor dir und ist ein zweiter zum Rebound unter den Korb gelaufen, ist draußen
// jemand frei: Pass raus. (Kein Doppeln: Der zweite läuft zum Ball am Ring, nicht zu dir.)
function buildCReb(v,T,L,M){
  const s=R()<.5?-1:1; // Werfer auf Seite s, du holst den Rebound auf der anderen Seite
  const H=addP('H','off',5),W=addP('W','off',s<0?3:2,{name:'Werfer'}),PG=addP('PG','off',1,{name:'Aufbau'}),OW=addP('OW','off',s<0?2:3,{name:'Flügel gegenüber'});
  const K=M===5?addP('K','off',7,{name:'Ecke'}):null;
  const dH=addP('dH','def',9),dW=addP('dW','def',8),dP=addP('dPG','def',4),dO=addP('dOW','def',6),dK=M===5?addP('dK','def',10):null;
  GUARD={W:dW,PG:dP,OW:dO,K:dK};
  // Zeitplan: Rebound bei t1; der Wurf startet so, dass der Ball etwa 0,55 s nach dem Ring bei dir ankommt
  const t1=T*.8,wD=pt(s*rand(5.3,5.7),rand(-5.0,-4.4)),t0=Math.max(.2,t1-.55-(.75+Math.hypot(wD.x,wD.z)*.04)-.24);
  setPath(W,[[0,wD.x+s*.3,wD.z-.7],[t0*.9,wD.x,wD.z]]);
  setPath(dW,[[0,wD.x-s*1.2,wD.z+1.3],[t0+.15,wD.x-s*.6,wD.z+.6],[T,wD.x-s*1.1,wD.z+1.2]]); // stört den Wurf, dann zwischen Werfer und Korb
  const pD=pt(-s*rand(2.2,2.6),rand(-7.6,-7.1));setPath(PG,[[0,-s*1.6,-9.4],[T*.6,pD.x,pD.z]]); // oben auf deiner Seite, nicht vor der Kamera
  const oD=pt(-s*rand(5.5,5.9),K?rand(-4.6,-4.0):rand(-3.9,-3.3));setPath(OW,[[0,-s*5.6,-6.6],[T*.6,oD.x,oD.z]]);
  let kD=null;if(K){kD=pt(-s*rand(6.5,6.8),rand(.1,.5));setPath(K,[[0,-s*6.3,-1.6],[T*.6,kD.x,kD.z]]);}
  const hP=homeOf(pD,1.2,wD),hO=homeOf(oD,1.1,wD),hK=kD&&homeOf(kD,1.0,wD),homes={dPG:hP,dOW:hO,dK:hK};
  const crash={kickO:'dOW',kickP:'dPG',kickK:'dK'}[v]||null,hR=pt(-s*rand(1.6,1.9),rand(-1.9,-1.5));
  setPath(H,[[0,-s*3.0,-2.7],[t0+.3,-s*2.9,-2.5],[t1,hR.x,hR.z]]);
  // Unter den Korb zum Rebound (nicht zu dir): auf der Werfer-Seite des Rings
  const spot={dOW:pt(s*.45,-1.4),dPG:pt(s*.3,-1.9),dK:pt(-s*.3,-.5)},st={dOW:pt(-s*5.0,-5.0),dPG:pt(-s*1.5,-8.3),dK:pt(-s*5.8,-1.2)};
  [[dO,'dOW'],[dP,'dPG'],[dK,'dK']].forEach(([D,r])=>{if(!D)return;const h=homes[r],sp=spot[r];
    if(r===crash)setPath(D,[[0,st[r].x,st[r].z],[t0+.2,h.x,h.z],[T*.95,sp.x,sp.z]]);else setPath(D,[[0,st[r].x,st[r].z],[T*.6,h.x,h.z]]);});
  if(v==='put')setPath(dH,[[0,s*.1,-3.0],[t0+.5,s*.2,-2.7],[T,s*.35,-3.5]]); // Helfer in der Mitte, kommt nicht rechtzeitig zurück
  else setPath(dH,[[0,-s*2.4,-1.6],[t0+.3,-s*2.3,-1.5],[T,hR.x*.6,hR.z*.6]]); // boxt aus: steht zwischen dir und dem Korb
  let fake=false;
  if(v==='put'){const cand=[[dO,spot.dOW],[dP,spot.dPG]];if(dK)cand.push([dK,spot.dK]);fake=maybeFake(L,cand,homes,T);}
  const n=Math.hypot(.04,1);
  const WHY={put:'Der Ball ist zu dir abgeprallt, und dein Verteidiger stand weit weg in der Mitte. Zwischen dir und dem Korb war niemand: Geh sofort wieder hoch und mach den Korbleger!',
    kickO:'Dein Verteidiger stand zwischen dir und dem Korb, und der Verteidiger vom Flügel gegenüber ist zum Rebound unter den Korb gelaufen. Unter dem Korb war es zu voll, aber draußen war dein Mitspieler frei.',
    kickP:'Dein Verteidiger stand zwischen dir und dem Korb, und der Verteidiger vom Aufbau ist zum Rebound unter den Korb gelaufen. Unter dem Korb war es zu voll, aber oben war dein Aufbauspieler frei.',
    kickK:'Dein Verteidiger stand zwischen dir und dem Korb, und der Verteidiger aus der Ecke ist zum Rebound unter den Korb gelaufen. Unter dem Korb war es zu voll, aber in der Ecke war dein Mitspieler frei.'};
  return{ans:{put:'drive',kickO:'pass:OW',kickP:'pass:PG',kickK:'pass:K'}[v],helper:v==='put'?null:'dH',fake,hold:true,rel:crash?[crash]:[],
    feed:{from:'W',t0,t1,miss:true},camFix:{x:s*.3,z:-6.6,dx:-s*.04/n,dz:1/n},camSide:s,
    labels:{drive:['▲','Korbleger'],shot:null},prompt:'Rebound! Was machst du jetzt?',why:WHY[v],
    rule:v==='put'?'Rebound und der Weg zum Korb ist frei? Geh sofort wieder hoch!':'Ist es unter dem Korb zu voll, pass raus! Draußen ist jemand frei.',
    driveNote:'Dein Verteidiger stand zwischen dir und dem Korb und hat auf dich gewartet.',
    notes:v==='put'?{pass:'Dieser Mitspieler war gedeckt. Du selbst standest frei direkt am Korb.'}:{}};
}

// --------- Center 8: Rim Run mit Ball ---------
// Schnellangriff: Du sprintest zum Korb, der Aufbau spielt dir den Ball in den Lauf (DBB-Spielkonzeption: Rim Run).
// Kommt keiner, Korbleger. Springt dir der Verteidiger eines Läufers in den Weg, ist sein Läufer frei.
function buildCRun(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',5),PG=addP('PG','off',1,{sel:false}),W=addP('W','off',s<0?3:2,{name:'Läufer',finish:'layup'}),OW=addP('OW','off',s<0?2:3,{name:'Läufer gegenüber',finish:'layup'});
  const K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',9),dP=addP('dPG','def',4),dW=addP('dW','def',8),dO=addP('dOW','def',6),dK=M===5?addP('dK','def',10):null;
  if(K){K.trail=true;dK.trail=true;}
  GUARD={W:dW,OW:dO};
  const hE=pt(s*rand(.5,.8),rand(-5.0,-4.6));setPath(H,[[0,s*1.3,-22.5],[T,hE.x,hE.z]],true);H.dside=-s;
  setPath(PG,[[0,-s*.5,-24.5],[T*.45,-s*.6,-15.4],[T,-s*.7,-13.6]],true);setPath(dP,[[0,-s*.3,-16],[T,-s*.5,-11.4]]);
  setPath(dH,[[0,s*2.3,-25],[T,hE.x+s*.9,hE.z-2.4]],true); // läuft hinterher
  const wE=pt(s*rand(4.6,4.9),rand(-4.6,-4.0)),oE=pt(-s*rand(4.6,4.9),rand(-4.9,-4.3));
  setPath(W,[[0,s*4.8,-21.5],[T,wE.x,wE.z]],true);setPath(OW,[[0,-s*4.8,-21.8],[T,oE.x,oE.z]],true);
  if(K){setPath(K,[[0,-s*.3,-26],[T,-s*.4,-14.6]],true);setPath(dK,[[0,-s*.9,-26.4],[T,-s*1.0,-14.0]],true);}
  const helper={helpW:'dW',helpO:'dOW'}[v]||null,lane=g=>pt(lerp(hE.x,0,.3)+g*.25,-2.4);
  const guard=(D,E,g)=>{const a=pt(g*3.6,-17.5),h=pt(E.x-g*.75,E.z+1.1),m=pt(lerp(a.x,h.x,.6),lerp(a.z,h.z,.6));
    if(D.role===helper){const l=lane(g);setPath(D,[[0,a.x,a.z],[T*.55,m.x,m.z],[T,l.x,l.z]]);}
    else setPath(D,[[0,a.x,a.z],[T*.6,m.x,m.z],[T,h.x,h.z]]);return h;};
  const hW=guard(dW,wE,s),hO=guard(dO,oE,-s);
  let fake=false; // täuschen: macht einen Schritt in deinen Weg und läuft zurück zu seinem Läufer
  if(v==='lay'&&L>=2&&R()<(L===3?.7:.45)){fake=true;const[D,h,g]=R()<.5?[dW,hW,s]:[dO,hO,-s],l=lane(g),a=pt(D.path[0][1],D.path[0][2]);
    setPath(D,[[0,a.x,a.z],[T*.5,lerp(a.x,h.x,.6),lerp(a.z,h.z,.6)],[T*.75,lerp(h.x,l.x,.55),lerp(h.z,l.z,.55)],[T,h.x,h.z]]);}
  const WHY={lay:'Du hast den Ball im Lauf bekommen, und die Verteidiger sind bei deinen Läufern geblieben. Vor dir war niemand: Mach den Korbleger!',
    helpW:'Der Verteidiger von deinem Läufer ist dir in den Weg gesprungen. Dadurch war dein Läufer frei.',
    helpO:'Der Verteidiger von deinem Läufer gegenüber ist dir in den Weg gesprungen. Dadurch war dein Läufer auf der anderen Seite frei.'};
  return{ans:{lay:'drive',helpW:'pass:W',helpO:'pass:OW'}[v],helper,fake,feed:{from:'PG',t0:T*.36,t1:T*.66},camSide:-s,
    prompt:'Rim Run! Du hast den Ball. Was machst du?',why:WHY[v],
    rule:'Im Schnellangriff: Stoppt dich keiner, mach den Korbleger. Stoppt dich einer, pass zum freien Läufer.',
    shotNote:'Im Schnellangriff willst du einen leichten Korbleger, keinen weiten Wurf.'};
}

// ================= FLÜGEL: PLATZ MACHEN UND BALL IN DER ECKE =================
// --------- Flügel 6: Mitspieler zieht zum Korb (ohne Ball) ---------
// Der Aufbau zieht, dein Verteidiger hilft aus. Lauf dorthin, wo der Helfer nicht ist:
// corner: Durchbruch zur Mitte, der Helfer steht oben → in die Ecke ausweichen.
// gap: Durchbruch auf deine Seite zur Grundlinie, der Helfer steht unten → hoch in die Lücke hinter dem Ball.
function buildWSpace(v,T,L,M){
  const s=R()<.5?-1:1,mid=v==='corner';
  const H=addP('H','off',s<0?3:2),PG=addP('PG','off',1,{sel:false}),OW=addP('OW','off',s<0?2:3,{sel:false}),C=addP('C','off',5,{sel:false});
  const K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',4),dP=addP('dPG','def',6),dO=addP('dOW','def',8),dC=addP('dC','def',9),dK=M===5?addP('dK','def',10):null;
  GUARD={};
  const hD=pt(s*rand(5.4,5.7),rand(-5.2,-4.8));setPath(H,[[0,s*5.7,-6.4],[T*.6,hD.x,hD.z]]);
  const p0=pt(s*rand(1.3,1.7),-9.4),pE=mid?pt(s*rand(.1,.4),rand(-3.8,-3.5)):pt(s*rand(3.4,3.7),rand(-1.8,-1.5));
  setPath(PG,[[0,p0.x,p0.z],[T*.4,lerp(p0.x,pE.x,.22),lerp(p0.z,pE.z,.22)],[T,pE.x,pE.z]],true);PG.dside=mid?s:-s;
  setPath(dP,[[0,p0.x,p0.z+1.2],[T*.4,lerp(p0.x,pE.x,.22)+s*.3,lerp(p0.z,pE.z,.22)+.8],[T,pE.x+(mid?-s*.6:-s*.9),pE.z-1.2]]); // geschlagen, hinter dem Aufbau
  const home=homeOf(hD,1.0,p0),help=mid?pt(s*2.4,-5.4):pt(s*4.3,-1.1);
  setPath(dH,[[0,s*5.0,-5.6],[T*.4,home.x,home.z],[T*.95,help.x,help.z]]);
  const oD=pt(-s*rand(5.5,5.9),rand(-5.0,-4.4));setPath(OW,[[0,-s*5.6,-6.6],[T*.6,oD.x,oD.z]]);const hO=homeOf(oD,1.4,pE);setPath(dO,[[0,-s*5.0,-6.0],[T*.7,hO.x,hO.z]]);
  const cD=pt(-s*rand(2.7,3.0),rand(-.8,-.4));setPath(C,[[0,-s*1.6,-3.2],[T*.6,cD.x,cD.z]]);setPath(dC,[[0,-s*1.2,-2.6],[T*.6,cD.x+s*.6,cD.z-.4]]);
  if(K){const kD=pt(-s*rand(6.5,6.8),rand(.1,.5));setPath(K,[[0,-s*6.2,-1.6],[T*.6,kD.x,kD.z]]);const hK=homeOf(kD,1.3,pE);setPath(dK,[[0,-s*5.4,-1.4],[T*.6,hK.x,hK.z]]);}
  const corner=pt(s*6.55,.15),gap=pt(s*4.6,-7.3);
  const outcome=(choice,ok,finish)=>{const tg=choice==='drive'?gap:corner;goTo(H,[[.7,tg.x,tg.z]]);
    if(ok){H.finish='shot';later(.3,()=>passOk(H,finish));later(.5,()=>goTo(dH,[[1.0,lerp(help.x,tg.x,.45),lerp(help.z,tg.z,.45)]]));}
    else later(.3,()=>passBad(H,finish,dH));};
  return{ans:mid?'shot':'drive',helper:null,fake:false,camSide:s,outcome,ballAt:'PG',driveTo:gap,shotTo:corner,rel:['PG','dPG'],
    labels:{drive:['↗','In die Lücke'],shot:['↘','In die Ecke']},camFix:{x:s*2.6,z:-9.8,dx:s*.12,dz:.99},prompt:'Dein Aufbau zieht zum Korb. Wohin läufst du?',
    q:{t:'Wo stand dein Verteidiger?',r:'dH'},
    why:mid?'Der Aufbau ist zur Mitte gezogen, und dein Verteidiger hat oben ausgeholfen. Weich in die Ecke aus: Dort ist viel Platz, und der Pass raus kommt an deinem Verteidiger vorbei.'
      :'Der Aufbau ist auf deine Seite zur Grundlinie gezogen, und dein Verteidiger hat unten ausgeholfen. In der Ecke wärst du im Weg. Geh hoch in die Lücke hinter dem Aufbau: Von dort bekommst du den Pass und hast Platz zum Werfen.',
    rule:mid?'Durchbruch zur Mitte? Weich in die Ecke aus!':'Durchbruch auf deine Seite? Geh hoch in die Lücke dahinter!',
    notes:{drive:'Dein Verteidiger hat oben ausgeholfen. Genau dorthin bist du gelaufen, und er hat den Pass abgefangen.',
      shot:'Dein Verteidiger hat unten an der Grundlinie ausgeholfen. In der Ecke warst du im Weg, und der Pass wurde abgefangen.'}};
}
// --------- Flügel 7: Ball in der Ecke ---------
// post: Der Verteidiger des Centers steht hinter ihm → Pass ans Brett. base: Dein Verteidiger steht oben, der Center macht Platz →
// Durchbruch an der Grundlinie. shot: Dein Verteidiger ist tief am Brett, der Center ist gedeckt → Wurf.
function buildWCorner(v,T,L,M){
  const s=R()<.5?-1:1;
  const H=addP('H','off',s<0?3:2),PG=addP('PG','off',1,{sel:false}),C=addP('C','off',5,{name:v==='base'?'Center':'Center am Brett',finish:'layup'}),OW=addP('OW','off',s<0?2:3,{sel:false});
  const K=M===5?addP('K','off',7,{sel:false}):null;
  const dH=addP('dH','def',4),dP=addP('dPG','def',6),dC=addP('dC','def',9),dO=addP('dOW','def',8),dK=M===5?addP('dK','def',10):null;
  GUARD={C:dC};
  const hD=pt(s*rand(6.5,6.7),rand(.05,.25));setPath(H,[[0,s*5.8,-3.4],[T*.55,hD.x,hD.z]]);
  const pD=pt(s*rand(3.9,4.3),rand(-7.0,-6.5));setPath(PG,[[0,s*2.6,-9.0],[T*.35,pD.x,pD.z]]);setPath(dP,[[0,s*2.4,-7.8],[T*.4,pD.x-s*.4,pD.z+1.0],[T,pD.x-s*.7,pD.z+1.3]]);
  const cB=pt(s*rand(2.5,2.7),rand(-1.3,-1.0)),cE=v==='base'?pt(s*rand(1.4,1.7),rand(-4.9,-4.6)):cB;
  if(v==='base')setPath(C,[[0,s*1.6,-2.6],[T*.35,cB.x,cB.z],[T*.55,cB.x,cB.z],[T,cE.x,cE.z]]);else setPath(C,[[0,s*1.6,-2.6],[T*.45,cB.x,cB.z]]);
  // Verteidiger des Centers: post = hinter ihm (zur Mitte, weg vom Ball), sonst zwischen ihm und dem Ball
  const[cb0,cb1]=unitV(hD.x-cE.x,hD.z-cE.z);
  const dCE=v==='post'?pt(cE.x-s*.8,cE.z-.15):pt(cE.x+cb0*.75,cE.z+cb1*.75-.1);
  if(v==='base')setPath(dC,[[0,s*1.2,-1.8],[T*.35,cB.x+cb0*.7,cB.z+cb1*.7],[T*.55,cB.x+cb0*.7,cB.z+cb1*.7],[T,dCE.x,dCE.z]]);
  else setPath(dC,[[0,s*1.2,-1.8],[T*.5,dCE.x,dCE.z]]);
  const dHE=v==='post'?pt(hD.x-s*.95,hD.z+.35):v==='base'?pt(hD.x-s*.65,hD.z-1.05):pt(s*4.0,-.45);
  setPath(dH,[[0,s*5.2,-3.2],[T*.55,lerp(s*5.2,dHE.x,.7),lerp(-3.2,dHE.z,.7)],[T,dHE.x,dHE.z]]);
  const oD=pt(-s*rand(5.5,5.9),rand(-5.0,-4.4));setPath(OW,[[0,-s*5.6,-6.6],[T*.6,oD.x,oD.z]]);const hO=homeOf(oD,1.6,hD);setPath(dO,[[0,-s*5.0,-6.0],[T*.7,hO.x,hO.z]]);
  if(K){const kD=pt(-s*rand(.6,1.0),rand(-8.4,-7.9));setPath(K,[[0,-s*1.4,-10],[T*.6,kD.x,kD.z]]);const hK=homeOf(kD,1.3,hD);setPath(dK,[[0,-s*1.2,-9],[T*.6,hK.x,hK.z]]);}
  const WHY={post:'Der Verteidiger des Centers stand hinter ihm, nicht zwischen ihm und dem Ball. Dein Center am Brett war frei: Pass rein, und er macht den Korbleger.',
    base:'Dein Verteidiger stand oben neben dir, und der Center hat dir unten Platz gemacht. Der Weg an der Grundlinie war frei: Zieh zum Korb!',
    shot:'Dein Verteidiger ist weit zurückgewichen und hat die Grundlinie zugestellt. Der Center war gedeckt. Du hattest viel Platz für den Wurf.'};
  return{ans:{post:'pass:C',base:'drive',shot:'shot'}[v],helper:v==='base'?null:'dH',fake:false,camSide:s,feed:{from:'PG',t0:T*.32,t1:T*.58},rel:['dH','C','dC'],
    labels:{drive:['▲','Grundlinie'],shot:LBL_DEF.shot},prompt:'Du hast den Ball in der Ecke. Was machst du?',why:WHY[v],
    rule:{post:'Center am Brett frei? Spiel den Ball rein!',base:'Grundlinie frei? Zieh an der Grundlinie zum Korb!',shot:'Viel Platz, und keiner ist frei? Nimm den Wurf!'}[v],
    driveNote:'Dein Verteidiger stand an der Grundlinie. Da war kein Weg frei.',
    notes:{shot:v==='shot'?null:'Dein Verteidiger stand nah bei dir. Der Wurf wäre gestört worden.',pass:'Der Verteidiger stand zwischen dem Center und dem Ball. Der Pass wäre abgefangen worden.'},
    q:v==='post'?{t:'Wer war frei?',r:'C'}:{t:'Wo stand dein Verteidiger?',r:'dH'}};
}
