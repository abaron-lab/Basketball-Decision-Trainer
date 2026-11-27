// Kamera, Ablauf einer Runde (startRound bis resolve), Wurfkamera, Feedback mit Frage und Mini-Karte, Ergebnis.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Kamera =================
const CP={h:4,back:6,look:6,lookY:.9,side:.9};
let camDir={x:0,z:1},camPos=null,fit={f:600,px:0,py:0};
function camPose(hx,hz,dx,dz){
  const cs=G.sc?.camSide||1,rx=dz*cs,rz=-dx*cs;
  hz=Math.min(hz,-5.2);
  const featured=G.sc?.featured;
  // Beim Kick-out knapp neben der Schulter bleiben, damit die Hilfe nicht hinter der Spielfigur verschwindet.
  const side=featured?CP.side+.4:CP.side;
  const height=featured?CP.h-.35:CP.h;
  return{pos:[hx-dx*CP.back+rx*side,height,hz-dz*CP.back+rz*side],
    look:[hx+dx*CP.look+rx*side*.4,CP.lookY,hz+dz*CP.look+rz*side*.4]};
}
const tmpCam=new T3.PerspectiveCamera(50,1,.1,200);
function computeFit(){
  W=innerWidth;H=cv.clientHeight||innerHeight;fitPR();renderer.setSize(W,H,false);fxSize();
  const ctrl=$('bottom'),ch=ctrl.classList.contains('hidden')?170:ctrl.offsetHeight;
  const top=56+(G.sc&&passers().length?32:0),bot=H-ch-10,left=6,right=W-6,rw=right-left,rh=Math.max(120,bot-top);
  const t=clamp((rh/rw-.55)/1.1,0,1);
  CP.h=lerp(2.6,6.2,t);CP.back=lerp(4.8,8.0,t);CP.look=lerp(7,4,t);CP.side=lerp(.85,.6,t);
  const sc=G.sc;if(!sc)return;
  let mnx,mxx,mny,mxy,f;const v=new T3.Vector3();
  {
    const pose=camPose(sc.he.x,sc.he.z,sc.dir.x,sc.dir.z);
    tmpCam.position.copy(V(...pose.pos));tmpCam.lookAt(V(...pose.look));tmpCam.updateMatrixWorld();
    mnx=1e9;mxx=-1e9;mny=1e9;mxy=-1e9;
    sc.fitPts.forEach(p=>{v.copy(V(p[0],p[1],p[2])).applyMatrix4(tmpCam.matrixWorldInverse);const d=-v.z;if(d<1)return;const nx=v.x/d,ny=v.y/d;mnx=Math.min(mnx,nx);mxx=Math.max(mxx,nx);mny=Math.min(mny,ny);mxy=Math.max(mxy,ny);});
    f=Math.min(rw/(mxx-mnx),rh/(mxy-mny))*.93;f=Math.min(f,H*1.5);
  }
  let px=left+rw/2-f*(mnx+mxx)/2,py=top+rh/2+f*(mny+mxy)/2;const slack=rh-f*(mxy-mny);if(slack>0)py+=slack*(sc.featured?.06:.42);
  fit={f,px,py};applyFit();
}
function applyFit(){const{f,px,py}=fit;const Fw=2*Math.max(px,W-px),Fh=2*Math.max(py,H-py);
  cam.aspect=Fw/Fh;cam.fov=2*Math.atan(Fh/2/f)*180/Math.PI;cam.setViewOffset(Fw,Fh,Fw/2-px,Fh/2-py,W,H);cam.updateProjectionMatrix();}
function updCam(dt,snap){
  if(!Hd||!G.sc)return;const sc=G.sc,cf=sc.camFix;
  if(camMode&&(G.phase==='outcome'||G.phase==='feedback')){const m=camMode;m.t+=dt;
    // Hochformat: Blick folgt dem Ball (am Anfang ganz, zum Korb hin weniger), damit er schon beim Abwurf im Bild ist
    const fl=ball.fl,u=fl&&fl.shot?clamp(fl.t/fl.d,0,1):1,w=m.track?(fl&&fl.shot?.85-.5*u:.35):.15;
    const L=m.look,tgt=[lerp(L[0],ball.x,w),m.track?lerp(L[1],ball.y,w):Math.min(rimHeight()+.25,lerp(L[1],ball.y,w)),lerp(L[2],ball.z,w)],push=Math.min(.12,m.t*.05),pos=[m.pos[0]*(1-push),m.pos[1],m.pos[2]*(1-push)];
    if(m.snap){camPos={p:pos.slice(),l:tgt.slice()};m.snap=false;
      cam.clearViewOffset();cam.aspect=W/H;cam.fov=W<H?60:46;cam.updateProjectionMatrix();}
    const kp=1-Math.exp(-dt*6),kl=1-Math.exp(-dt*(m.track?14:9));for(let i=0;i<3;i++){camPos.p[i]=lerp(camPos.p[i],pos[i],kp);camPos.l[i]=lerp(camPos.l[i],tgt[i],kl);}
    cam.position.copy(V(...camPos.p));cam.lookAt(V(...camPos.l));return;}
  let hx=Hd.x,hz=Hd.z;const dl=Math.hypot(hx,hz)||1;let dx=-hx/dl,dz=-hz/dl;
  if(cf){hx=cf.x;hz=cf.z;dx=cf.dx;dz=cf.dz;}else if(dl<3.5){dx=sc.dir.x;dz=sc.dir.z;}
  const k=snap?1:1-Math.exp(-dt*4);camDir.x=lerp(camDir.x,dx,k);camDir.z=lerp(camDir.z,dz,k);const n=Math.hypot(camDir.x,camDir.z);camDir.x/=n;camDir.z/=n;
  const ref=G.phase==='outcome'&&!cf?pt(lerp(hx,ball.x,.25),lerp(hz,ball.z,.25)):pt(hx,hz);
  const pose=camPose(ref.x,ref.z,camDir.x,camDir.z);
  if(!camPos||snap)camPos={p:pose.pos.slice(),l:pose.look.slice()};
  const kp=snap?1:1-Math.exp(-dt*5);for(let i=0;i<3;i++){camPos.p[i]=lerp(camPos.p[i],pose.pos[i],kp);camPos.l[i]=lerp(camPos.l[i],pose.look[i],kp);}
  cam.position.copy(V(...camPos.p));cam.lookAt(V(...camPos.l));
}

// ================= Ablauf =================
function makeBag(){
  if(kickComparison)return [['dkick','lay'],['dkick','kickL']];
  if(window.__bag)return window.__bag.slice(); // nur für Tests
  const plays=G.plays.slice();for(let i=plays.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[plays[i],plays[j]]=[plays[j],plays[i]];}
  const bag=[],last={};
  for(let i=0;i<G.rounds;i++){const p=plays[i%plays.length];const vs=PLAYS[p].vars(G.mode,G.level);let v;do{v=vs[(Math.random()*vs.length)|0];}while(vs.length>1&&v===last[p]);last[p]=v;bag.push([p,v]);}
  for(let i=bag.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[bag[i],bag[j]]=[bag[j],bag[i]];}
  return bag;}
function startRound(){hush();
  G.round++;G.replay=false;
  const[p,v]=G.bag[G.round-1];G.sc=buildScenario(kickComparison?4173:(Math.random()*1e9)|0,p,v);
  beginApproach();showBanner(PLAYS[p].name,PLAYS[p].desc);
}
function beginApproach(){
  tape(false);FX.dof=0;G.stopElapsed=null;
  G.phase='approach';G.t=0;G.timers=[];G.choice=null;endCam();warmGL();G.ts=1;G.slowT=0;shooter=null;players.forEach(p=>p.act=null);
  computeFit();camDir=startDir();updCam(0,true);
  buildButtons();setControls(false);$('prompt').classList.remove('on');$('timer').classList.remove('on');$('vig').classList.remove('on');clearBubbles();
  $('kickSwitch').classList.add('hidden');
  updateHud();
}
function startDecide(){
  G.phase='decide';quietCourt();G.dStart=performance.now();G.t=0;
  G.snap=players.map(p=>({role:p.role,team:p.team,x:p.x,z:p.z,num:p.num,sel:p.sel,ball:ball.owner===p}));
  setControls(true);$('prompt').classList.add('on');$('vig').classList.add('on');
  $('timer').classList.toggle('on',!G.noLimit&&!G.replay);$('timerFill').style.transform='scaleX(1)';
  if(kickComparison&&!G.replay){
    const button=$('kickSwitch');
    button.textContent=kickComparison.version==='before'?'Nachher ansehen':'Vorher ansehen';
    button.classList.remove('hidden');
  }
  cam.updateMatrixWorld();updRing();posMe();makeBubbles();
  if(G.replay){const a=G.sc.ans;const b=document.querySelector(`.cb[data-c="${a}"]`);b&&b.classList.add('hint');
    if(a.startsWith('pass:')||a.startsWith('spot:')){const t=document.querySelector(a.startsWith('spot:')?`.tag[data-c="${a}"]`:`.tag[data-r="${a.slice(5)}"]`);t&&t.classList.add('hint');}
  }
}
function resolve(choice){
  if(G.phase!=='decide')return;
  const sc=G.sc,ok=choice===sc.ans,rt=(performance.now()-G.dStart)/1000;
  $('kickSwitch').classList.add('hidden');
  tape(false);G.phase='outcome';G.t=0;G.timers=[];G.choice=choice;
  setControls(false);$('prompt').classList.remove('on');$('timer').classList.remove('on');$('vig').classList.remove('on');clearBubbles();
  document.querySelectorAll('.hint').forEach(b=>b.classList.remove('hint'));
  if(!G.replay){let pts=0;
    if(ok){const bonus=G.noLimit?0:Math.round(50*clamp(1-rt/G.win,0,1));pts=Math.round((100+bonus)*(1+.1*Math.min(G.streak,5)));G.score+=pts;G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak);}
    else G.streak=0;
    const off=!!sc.outcome&&!sc.onBall,lz=lzOf(sc.play,sc.variant,sc.ans,off),lz2=lz2Of(sc,choice,lz,off);
    G.results.push({play:sc.play,ans:sc.ans,choice,ok,rt:choice?rt:null,pts,off:off&&!sc.def,def:!!sc.def,lz,lz2});updateHud();
    if(ok){vib(25);ptsPop('+'+pts);}else vib([40,60,40]);}
  animateOutcome(choice,ok);
}
function nearestDef(x,z,excl){let b=null,bd=1e9;players.forEach(p=>{if(p.team!=='def'||p===excl)return;const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=p;}});return b;}
function blocker(){const sc=G.sc;if(sc.helper&&role(sc.helper))return role(sc.helper);
  let b=null,bd=1e9;players.forEach(p=>{if(p.team!=='def')return;const ax=-Hd.x,az=-Hd.z,L=Math.hypot(ax,az),t=((p.x-Hd.x)*ax+(p.z-Hd.z)*az)/(L*L);if(t<.05||t>1)return;const qx=Hd.x+ax*t,qz=Hd.z+az*t,d=Math.hypot(p.x-qx,p.z-qz);if(d<bd){bd=d;b=p;}});return b||nearestDef(Hd.x,Hd.z);}
function act(p,k,d,o){if(p)p.act=Object.assign({k,t:0,d},o||{});if(p&&k==='catch')sfx.catch(p);if(p&&k==='pass'&&!o?.soundAtRelease)sfx.pass(p);}
let shooter=null;
function score(after){sfx.swish();netKick(ball.x*3,ball.z*3);G.excite=1;G.slowT=Math.max(G.slowT,.5);sfx.crowd();camFlash();
  if(G.phase==='outcome'&&!G.replay&&G.streak>=3)G.wave=gclock;
  // Der Werfer landet erst (Wurf/Korbleger zu Ende spielen), sonst fällt er aus der Luft direkt in den Jubel
  players.forEach(p=>{if(p.team==='off'){const A=p.act,rest=A&&/shoot|layup/.test(A.k)?Math.max(0,A.d-A.t):0;
      if(rest>0)later(rest,()=>{if(p.act===A||!p.act)act(p,'cheer',2.2,{dl:.05});});else act(p,'cheer',2.2,{dl:p===shooter?.15:.25+Math.random()*.4});}
    else if(Math.random()<.7)act(p,'sad',2.4);});
  fly({x:0,y:rimHeight()-.75,z:0},.2,0,()=>fly({x:rand(-.4,.4),y:.13,z:-.7},.35,.1,()=>after&&after()));}
function shootFrom(S,make,after){S.armsUp=1.3;ball.owner=S;ball.hold=true;act(S,'shoot',1.0);shooter=S;
  later(.24,()=>{const d=Math.hypot(S.x,S.z);rimCam(S);fly({x:0,y:rimHeight(),z:make?0:-.225},.75+d*.04,1.1+d*.13,()=>{
    if(make)score(()=>after&&after(true));else{sfx.rim();rimHit();G.slowT=.35;fly({x:rand(-2.5,2.5),y:.13,z:-2.6},.75,1.6,()=>after&&after(false));}},{shot:true});});}
// Korbleger mit der äußeren Hand: von rechts (x > 0) mit rechts werfen, links abspringen; von links umgekehrt (layupM).
// dside > 0 = Ball links.
function layShot(S,after){S.dside=S.x>0?-1:1;S.armsUp=1;act(S,'layup',.85);shooter=S;rimCam(S);
  // mit eigenem Korbleger-Clip: Ball bleibt bis zum Abwurf (0,28 s) in der Hand
  if(S.rig.glb&&S.rig.A.layup){ball.owner=S;ball.hold=true;later(.28,()=>fly({x:0,y:rimHeight(),z:0},.3,.28,()=>score(after),{shot:true}));}
  else{ball.owner=null;fly({x:0,y:rimHeight(),z:0},.46,.5,()=>score(after),{shot:true});}}
function layup(S,after){const sx=Math.sign(S.x)||1,tx=sx*.6,tz=-.9,d=Math.hypot(S.x-tx,S.z-tz),du=Math.max(.25,d/6.5);
  goTo(S,[[du,tx,tz]],true);later(du,()=>layShot(S,after));}
// Kamera-Moment: Schnitt auf eine tiefe Kamera neben dem Korb
let camMode=null;
function rimCam(S){if(G.phase!=='outcome')return;const d=Math.hypot(S.x,S.z)||1,ux=S.x/d,uz=S.z/d;
  let px=uz,pz=-ux;if(pz>0||(Math.abs(pz)<.05&&px*(S.x||1)>0)){px=-px;pz=-pz;}
  if(W>H*1.1){const qx=px-ux,qz=pz-uz,qn=Math.hypot(qx,qz)||1,Rw=6.3; // Querformat: seitlich an der Grundlinie, Werfer und Korb im Bild
    camMode={pos:[qx/qn*Rw,2.9,Math.min(-.6,qz/qn*Rw)],look:[S.x*.38,rimHeight()-1.05,S.z*.38],t:0,snap:true};}
  else{const Rr=Math.max(d<2.5?3.6:2.8,Math.min(5,1.5+d*.5));camMode={pos:[px*Rr+ux*.9,2.3,Math.min(-.6,pz*Rr+uz*.9)],look:[ux*.55,rimHeight()-.25,uz*.55],t:0,snap:true,track:true};}document.body.classList.add('cinema');}
function endCam(){camMode=null;document.body.classList.remove('cinema');}
function passOk(Wp,finish){ball.y=Math.max(1,ball.y);
  const passer=ball.owner,featured=kickComparison?.version!=='before'&&!!passer&&Wp.finish!=='layup';
  if(featured)passer.targetLook=Wp;
  act(passer,'pass',.4,{soundAtRelease:featured});
  const tf=passT(Math.hypot(Wp.x-ball.x,Wp.z-ball.z));
  if(Wp.finish==='layup'){const sx=Math.sign(Wp.x)||1,tx=sx*.6,tz=-.9,d=Math.hypot(Wp.x-tx,Wp.z-tz),du=Math.max(.5,d/6.5);goTo(Wp,[[du,tx,tz]],true);
    const[x,z]=evalPath(Wp.path,tf,true);
    fly({x,y:1.2,z},tf,passH(tf),()=>{ball.owner=Wp;ball.hold=true;act(Wp,'catch',.25);later(Math.max(.05,du-tf),()=>layShot(Wp,()=>{flash('Korbleger!','#7ff0ad');sfx.good();finish(.7);}));});}
  else{const deliver=()=>{
      const[x,z]=Wp.path?evalPath(Wp.path,Wp.pt+tf,Wp.lin):[Wp.x,Wp.z];
      if(featured)sfx.pass(passer);
      fly({x,y:1.2,z},tf,passH(tf),()=>{
        ball.owner=Wp;ball.hold=true;act(Wp,'catch',featured?.46:.25);
        if(featured){
          // Erst den Pass sichern, dann mit dem zweiten Schritt zum Korb ausrichten.
          if(G.sc.featured)flash(Wp.role==='K'?'Freie Ecke gefunden!':'Freien Flügel gefunden!','#7ff0ad');
          goTo(Wp,[[.14,x*.987,z*.987],[.32,x*.964,z*.964]],true);
          later(.14,()=>{Wp.targetLook=null;sfx.step(Wp,.15);});
          later(.32,()=>sfx.step(Wp,.24));
        }
        later(featured?.46:.18,()=>shootFrom(Wp,true,()=>{flash('Treffer!','#7ff0ad');sfx.good();finish(.7);}));
      });
    };
    if(featured){ball.hold=true;Wp.targetLook=passer;later(.14,deliver);}else deliver();}
  const D=GUARD[Wp.role];if(D)goTo(D,[[1.3,lerp(D.x,Wp.x,.75),lerp(D.z,Wp.z,.75)]]);}
function passBad(Wp,finish,D){ball.y=Math.max(1,ball.y);act(ball.owner,'pass',.4);
  const[tx,tz]=Wp.path?evalPath(Wp.path,Wp.pt+.4,Wp.lin):[Wp.x,Wp.z];
  const ix=lerp(ball.x,tx,.68),iz=lerp(ball.z,tz,.68);D=D||nearestDef(ix,iz,role('dH'))||nearestDef(ix,iz);
  goTo(D,[[.38,ix,iz-.1]]);
  fly({x:ix,y:1.2,z:iz},.42,.25,()=>{ball.owner=D;ball.hold=true;act(D,'catch',.4);G.slowT=.45;sfx.bad();flash('Abgefangen!','#ff7b72');goTo(D,[[1.6,ix*.4,-13]]);finish(1.2);});}
function blocked(S,B,finish,msg){const mx=lerp(S.x,B.x,.6),mz=Math.min(B.z-.2,lerp(S.z,0,.4));
  ball.hold=false;goTo(S,[[.55,lerp(S.x,mx,.75),lerp(S.z,mz,.75)-.3]],true);goTo(B,[[.45,mx,mz]]);
  later(.42,()=>act(B,'block',.85));
  later(.55,()=>{B.armsUp=1.2;G.slowT=.5;sfx.catch(B);sfx.bad();const sx=Math.sign(S.x)||1;fly({x:sx*6.5,y:.13,z:mz-2.5},.8,2.2,()=>{});flash(msg||'Geblockt!','#ff7b72');finish(1.3);});}
function animateOutcome(choice,ok){
  const sc=G.sc,finish=d=>later(d,showFeedback);
  if(choice===null&&sc.def){sfx.buzz();flash('Zu langsam!','#ff7b72');later(.5,()=>defRun(sc.slowRes,finish));return;}
  if(choice===null){sfx.buzz();flash('Zu langsam!','#ff7b72');
    goTo(role('dH'),[[.6,Hd.x,Math.min(Hd.z+1.4,-.5)]]);
    Object.entries(GUARD).forEach(([r,D])=>{if(!D||!role(r))return;const m=role(r),d=Math.hypot(m.x,m.z)||1;goTo(D,[[.8,m.x-m.x/d*.9,m.z-m.z/d*.9]]);});
    finish(1.5);return;}
  if(sc.outcome){sc.outcome(choice,ok,finish);return;}
  if(choice.startsWith('pass:')){const Wp=role(choice.slice(5));if(ok)passOk(Wp,finish);else passBad(Wp,finish);return;}
  if(choice==='drive'){
    if(ok){ball.hold=false;Hd.dside=-(Math.sign(Hd.x)||1);const sx=Math.sign(Hd.x)||1,tx=sx*.55,tz=-1.2,du=Math.max(.6,Math.hypot(Hd.x-tx,Hd.z-tz)/6.3);
      goTo(Hd,[[du,tx,tz]],true);const D=role('dH');goTo(D,[[du+.15,tx-sx*.7,tz-1.1]]);
      later(du,()=>layShot(Hd,()=>{flash('Korbleger!','#7ff0ad');sfx.good();finish(.7);}));}
    else blocked(Hd,blocker(),finish);
    return;}
  if(choice==='shot'){goTo(Hd,[[.1,Hd.x,Hd.z]]);
    if(ok)shootFrom(Hd,true,()=>{flash('Swish!','#7ff0ad');sfx.good();finish(.7);});
    else{const N=nearestDef(Hd.x-Hd.x*.2,Hd.z-Hd.z*.2);const d=Math.hypot(Hd.x,Hd.z);goTo(N,[[.4,Hd.x-Hd.x/d*.8,Hd.z-Hd.z/d*.8]]);
      later(.2,()=>{N.armsUp=1.2;act(N,'block',.8);});shootFrom(Hd,false,()=>{flash('Daneben','#ff7b72');sfx.bad();finish(.6);});}
  }
}

// ================= Feedback =================
function choiceName(c){const lb=G.sc.labels;if(c&&c.startsWith('spot:')){const sp=G.sc.spots.find(p=>'spot:'+p.id===c);return`Position ${sp.id}: ${sp.name}`;}if(c==='drive')return lb.drive[1]==='Zum Korb'?'Zum Korb ziehen':lb.drive[1];if(c==='shot')return lb.shot?lb.shot[1]:'Selbst werfen';if(c&&c.startsWith('pass:')){const p=role(c.slice(5));return'Pass: '+(p&&p.name?p.name:'Mitspieler');}return'';}
function wrongNote(sc,c){
  if(c&&c.startsWith('spot:')){const sp=sc.spots.find(p=>'spot:'+p.id===c);return sp&&sp.note||'';}
  if(c===null&&sc.def)return'Die Zeit war um, und du standest noch an der alten Stelle. In der Verteidigung musst du dich schon bewegen, während der Ball unterwegs ist.';
  const nk=c&&c.startsWith('pass:')?'pass':c;if(c&&sc.notes&&sc.notes[nk])return sc.notes[nk];
  if(c===null)return'Die Zeit war um, und die Verteidigung konnte sich wieder sortieren. Schnell entscheiden ist im Spiel genauso wichtig wie richtig entscheiden!';
  if(c==='drive')return sc.driveNote||(sc.ans==='shot'?'Dein Verteidiger stand tief in der Zone und hat dort auf dich gewartet.':'Im Weg stand ein Verteidiger, da wärst du direkt hineingelaufen.');
  if(c==='shot'){if(sc.shotNote)return sc.shotNote;const D=role('dH'),near=D&&Math.hypot(D.x-G.snap.find(p=>p.role==='H').x,D.z-G.snap.find(p=>p.role==='H').z)<2.3&&sc.helper==='dH';
    return near?'Dein Verteidiger stand zu nah, der Wurf wurde gestört.':sc.ans==='drive'?'Werfen ging zwar, aber ein freier Korbleger ist viel sicherer!':'Werfen ging zwar, aber ein Mitspieler war komplett frei. Das ist die einfachere Lösung.';}
  if(c.startsWith('pass:')){const p=role(c.slice(5));return`${p&&p.name?p.name:'Dieser Mitspieler'}: noch gedeckt, sein Verteidiger stand direkt bei ihm.`;}
  return'';}
function showFeedback(){
  G.phase='feedback';quietCourt(.7);const sc=G.sc,ch=G.choice,ok=ch===sc.ans;
  const r=G.results[G.results.length-1],kind=ok?'ok':ch===null?'slow':'bad';
  $('fbHead').className='fbhead '+kind;$('fbIco').innerHTML=`<use href="#i-${ok?'check':ch===null?'clock':'eye'}"/>`;
  // Kindgerecht (DBB-Leitfaden: Lernen durch Ausprobieren, Fragen statt Lösungen): kein Urteil „falsch“, kein Rot,
  // sondern eine Einladung, noch mal hinzuschauen. Die eigene Wahl war ein Versuch, die Lösung heißt „Noch besser“.
  $('fbTitle').textContent=ok?'Richtig!':ch===null?'Die Zeit ist um':'Schau noch mal hin';
  // Reaktionszeit nur bei richtiger Wahl: Nach einer falschen Wahl hilft sie nicht und verleitet eher zum schnellen Raten.
  $('fbPlay').textContent=PLAYS[sc.play].name+(G.replay?' · Wiederholung':ok&&r&&r.rt!=null?` · ${r.rt.toFixed(1).replace('.',',')} s`:'');
  const pts=!G.replay&&r&&r.pts;$('fbPts').textContent=pts?'+'+r.pts:'';$('fbPts').classList.toggle('hidden',!pts);
  // Weniger ist mehr (DBB: wenig reden, viel spielen): eine Zeile Wahl → Lösung, ein Erklärsatz, der Merksatz.
  // Alles Weitere steckt unter „Warum?“ (#fbMore), die Legende hinter „Was bedeuten die Farben?“.
  const fa=$('fbAns'),best=`<span class="best">${svgI('check')}<small>${ok?'Deine Wahl':ch?'Noch besser':'Beste Lösung'}</small><b></b></span>`;
  fa.innerHTML=(ok||!ch?'':`<span class="mine">${svgI('ball')}<b></b></span><span class="arr">→</span>`)+best;
  const bs=fa.querySelectorAll('b');if(ok||!ch)bs[0].textContent=choiceName(sc.ans);else{bs[0].textContent=choiceName(ch);bs[1].textContent=choiceName(sc.ans);}
  $('lgO').textContent=sc.def?'Angreifer':'Mitspieler';$('lgD').textContent=sc.def?'deine Mitspieler':'Verteidiger';
  // Legende in den Trikotfarben wie auf der Karte (drawMini: eigenes Team home, Gegner away)
  $('lgOc').style.background=TEAM[sc.def?'away':'home'].jersey;$('lgDc').style.background=TEAM[sc.def?'home':'away'].jersey;
  let wn=ok?'':wrongNote(sc,ch);if(!ok&&sc.fake)wn+=' Achtung: Ein Verteidiger hat nur so getan, als würde er helfen.';
  // Offen bleibt nur der Merksatz; die Erklärung zur Situation (sc.why) und was die eigene Wahl verhindert hat stehen unter „Warum?“.
  const mo=$('fbMore'),mp=$('fbMoreP');mo.open=false;mp.textContent='';
  const para=(h,t)=>{if(!t)return;const e=document.createElement('p');if(h){const b=document.createElement('b');b.textContent=h;e.append(b);}e.append(t);mp.append(e);};
  para('',sc.why);if(!ok)para(ch===null?'Warum zählt die Zeit?':`Warum nicht „${choiceName(ch)}“?`,wn);
  mo.classList.toggle('hidden',!mp.childNodes.length);
  $('fbRule').textContent=sc.rule;
  // Legende nur in den ersten Spielen offen, danach auf Antippen
  const lg=PROFILE.games<3;$('lgd').classList.toggle('hidden',!lg);$('lgBtn').classList.toggle('hidden',lg);
  $('fbQi').innerHTML='<use href="#i-help"/>';
  if(ok&&!G.replay)setTimeout(()=>confetti(40),150);
  $('nextBtn').innerHTML=(G.round>=G.rounds?(kickComparison?'Zum Vergleich':'Ergebnis'):'Weiter')+svgI('play','fill');
  // Fragen statt fertiger Lösungen (DBB-Leitfaden Minibasketball: Trainer helfen mit Fragen). Erst suchen lassen, dann erklären.
  const q=!ok&&!G.replay?quizOf(sc):null;G.quiz=q;$('fbQ').className='fbq'+(q?'':' hidden');
  $('feedback').querySelector('.card').classList.toggle('quiz',!!q);
  if(q){q.cursor=null;$('fbQt').textContent=q.t;$('fbQs').textContent='Tippe auf der Karte auf den richtigen Punkt. Mit Pfeiltasten auswählen, mit Enter bestätigen.';drawMini(ch,{quiz:true});
    say([ch===null?'Die Zeit ist um.':'Schau noch mal genau hin.',q.t,'Tippe auf der Karte auf den richtigen Punkt.'],.35);vRule(sc.rule);}
  else drawMini(ch);
  $('feedback').classList.remove('hidden');
}
function quizOf(sc){const has=r=>G.snap.some(p=>p.role===r);let q=sc.q;
  if(!q){if(sc.def)q={t:'Wo stand dein Gegenspieler?',r:'M'};
    else if(sc.ans.startsWith('pass:'))q=sc.helper&&sc.helper!=='dH'&&has(sc.helper)&&lzOf(sc.play,sc.variant,sc.ans,false)!=='ueberzahl'?{t:'Wer hat ausgeholfen?',r:sc.helper}:{t:'Wer war frei?',r:sc.ans.slice(5)};
    else q={t:'Wo stand dein Verteidiger?',r:'dH'};}
  return has(q.r)?q:null;}
function quizReveal(hit){const q=G.quiz;if(!q)return;G.quiz=null;
  $('fbQ').className='fbq '+(hit===true?'ok':hit===false?'no':'');if(hit===true)$('fbQi').innerHTML='<use href="#i-eye"/>';
  $('fbQt').textContent=hit===true?'Richtig erkannt!':hit===false?'Guter Versuch! Schau auf den Ring.':q.t;
  $('fbQs').textContent=hit===true?'Genau darauf kommt es an. Jetzt die ganze Lösung:':'Hier ist die Lösung:';
  $('feedback').querySelector('.card').classList.remove('quiz');drawMini(G.choice,{hl:q.r});
  if(hit===true)confetti(18);
  // Danach der Merksatz: das, was vom Spielzug hängen bleiben soll (Sprachdatei über VOICE, sonst still)
  say((hit===true?['Richtig erkannt!']:hit===false?['Guter Versuch! Schau auf den Ring.']:['Hier ist die Lösung:']).concat(G.sc.rule||[]),hit===true?.25:0);}
// Erst antworten, dann weiter: Kinder sollen die Frage nicht wegdrücken (DBB-Leitfaden: Fragen statt Lösungen).
// Weiter/Nochmal bleiben gesperrt, bis auf der Karte ein Spieler angetippt wurde; ein falscher Tipp zeigt auch die Lösung.
function quizNudge(t){const f=$('fbQ');t=t||'Erst die Frage beantworten: Tippe auf der Karte auf einen Spieler.';$('fbQs').textContent=t;say([t],.1);
  f.classList.remove('nudge');void f.offsetWidth;f.classList.add('nudge');}
$('mini').addEventListener('pointerdown',e=>{const q=G.quiz;if(!q||G.phase!=='feedback')return;const m=$('mini'),r=m.getBoundingClientRect(),k=Math.min(r.width/m.width,r.height/m.height);
  const x=(e.clientX-r.left-(r.width-m.width*k)/2)/k,y=(e.clientY-r.top-(r.height-m.height*k)/2)/k,M=miniMap();let best=null,bd=1e9;
  G.snap.forEach(p=>{if(p.z<-10.8&&!M.far)return;const d=Math.hypot(M.sx(p.x)-x,M.sz(p.z)-y);if(d<bd){bd=d;best=p;}});
  if(!best||bd>48){quizNudge('Tippe direkt auf einen Spieler.');return;}quizReveal(best.role===q.r);});
// Langer Pass: ganzes Feld auf schmalerer Zeichenfläche (368 px), sonst nur das Halbfeld (640 px)
function miniFar(){return!!(G.snap&&G.snap.some(p=>p.z<-10.8&&(p.role==='H'||p.sel)));}
// Halbfeld: Maßstab fest (wie früher bei 12,2 m Tiefe), der Ausschnitt endet aber knapp hinter dem tiefsten Spieler.
// Die Karte wird dadurch flacher und auf dem Handy breiter, die Spieler größer. Größe setzt drawMini, miniMap liest sie.
const MINI_ZR=446/12.2;
function miniDepth(){let d=8.6;(G.snap||[]).forEach(p=>{if(p.z>-10.8)d=Math.max(d,BASE-p.z+1.5);});(G.sc&&G.sc.spots||[]).forEach(sp=>d=Math.max(d,BASE-sp.z+1.3));return Math.min(12.2,d);}
function miniMap(){const m=$('mini'),far=miniFar(),w=far?368:640,h=m.height,zr=far?(h-34)/28.4:MINI_ZR,S=far?zr*1.3:w/15.6;return{sx:x=>w/2+x*S,sz:z=>26+(BASE-z)*zr,S,zr,far,w};}
function drawMini(choice,o){o=o||{};
  {const m=$('mini'),far=miniFar(),ww=far?368:640,hh=far?480:Math.round(34+miniDepth()*MINI_ZR);if(m.width!==ww)m.width=ww;if(m.height!==hh)m.height=hh;m.parentNode.style.setProperty('--ar',ww+'/'+hh);}
  const m=$('mini'),c=m.getContext('2d'),w=m.width,h=m.height,{S,zr,sx,sz,far}=miniMap();
  c.fillStyle=far?'#10141f':'#d29b5f';c.fillRect(0,0,w,h);
  if(far){c.fillStyle='#d29b5f';c.fillRect(sx(-HW),sz(BASE),2*HW*S,sz(-26.425)-sz(BASE));c.strokeStyle='#fff';c.lineWidth=3;
    c.beginPath();c.moveTo(sx(-HW),sz(-12.425));c.lineTo(sx(HW),sz(-12.425));c.stroke();c.beginPath();c.ellipse(sx(0),sz(-12.425),1.8*S,1.8*zr,0,0,7);c.stroke();
    c.fillStyle=COURT_ZONE;c.fillRect(sx(-2.45),sz(-20.625),4.9*S,sz(-26.425)-sz(-20.625));c.strokeRect(sx(-2.45),sz(-20.625),4.9*S,sz(-26.425)-sz(-20.625));
    c.strokeStyle='#ff6a1a';c.lineWidth=3;c.beginPath();c.arc(sx(0),sz(-24.85),6,0,7);c.stroke();}
  c.fillStyle='rgba(150,80,25,.18)';c.beginPath();c.moveTo(sx(-TC),sz(BASE));for(let i=0;i<=40;i++){const a=lerp(-TA,TA,i/40);c.lineTo(sx(Math.sin(a)*R3),sz(-Math.cos(a)*R3));}c.lineTo(sx(TC),sz(BASE));c.fill();
  c.fillStyle=COURT_ZONE;c.fillRect(sx(-2.45),sz(BASE),4.9*S,sz(-4.225)-sz(BASE));
  c.strokeStyle='#fff';c.lineWidth=3;c.strokeRect(sx(-2.45),sz(BASE),4.9*S,sz(-4.225)-sz(BASE));
  c.beginPath();c.moveTo(sx(-TC),sz(BASE));for(let i=0;i<=40;i++){const a=lerp(-TA,TA,i/40);c.lineTo(sx(Math.sin(a)*R3),sz(-Math.cos(a)*R3));}c.lineTo(sx(TC),sz(BASE));c.stroke();
  c.beginPath();c.ellipse(sx(0),sz(-4.225),1.8*S,1.8*zr,0,0,Math.PI*2);c.stroke();
  c.strokeStyle='#ff6a1a';c.lineWidth=4;c.beginPath();c.arc(sx(0),sz(0),8,0,7);c.stroke();
  c.strokeStyle='#222';c.lineWidth=5;c.beginPath();c.moveTo(sx(-.9),sz(.375));c.lineTo(sx(.9),sz(.375));c.stroke();
  const snap=G.snap,me=snap.find(p=>p.role==='H');
  const off=!!G.sc.outcome&&!G.sc.def&&!G.sc.onBall;
  const arrow=(a,col,dash)=>{if(a==='shot'&&off&&G.sc.shotDir!=='stay'&&!G.sc.shotTo){const bo=snap.find(p=>p.ball)||me,an=Math.atan2(sz(bo.z)-sz(me.z),sx(bo.x)-sx(me.x))+(G.sc.shotDir==='away'?Math.PI:0);
      c.strokeStyle=col;c.fillStyle=col;c.lineWidth=6;c.setLineDash(dash?[12,9]:[]);const x0=sx(me.x),y0=sz(me.z),ex=x0+Math.cos(an)*46,ey=y0+Math.sin(an)*46;
      c.beginPath();c.moveTo(x0+Math.cos(an)*20,y0+Math.sin(an)*20);c.lineTo(ex,ey);c.stroke();c.setLineDash([]);
      c.beginPath();c.moveTo(ex+Math.cos(an)*14,ey+Math.sin(an)*14);c.lineTo(ex+Math.cos(an+2.4)*14,ey+Math.sin(an+2.4)*14);c.lineTo(ex+Math.cos(an-2.4)*14,ey+Math.sin(an-2.4)*14);c.fill();return;}
    if(a==='shot'&&!G.sc.shotTo){c.strokeStyle=col;c.lineWidth=5;c.setLineDash(dash?[10,8]:[]);c.beginPath();c.arc(sx(me.x),sz(me.z),28,0,7);c.stroke();c.setLineDash([]);return;}
    let tg=a==='drive'?(G.sc.driveTo||{x:0,z:-.8}):a==='shot'?G.sc.shotTo:a.startsWith('spot:')?G.sc.spots.find(p=>'spot:'+p.id===a):snap.find(p=>p.role===a.slice(5));if(!tg)return;
    const x0=sx(me.x),y0=sz(me.z),x1=sx(tg.x),y1=sz(tg.z),an=Math.atan2(y1-y0,x1-x0),L=Math.hypot(x1-x0,y1-y0)-24,ex=x0+Math.cos(an)*L,ey=y0+Math.sin(an)*L;
    c.strokeStyle=col;c.fillStyle=col;c.lineWidth=6;c.setLineDash(dash?[12,9]:[]);c.beginPath();c.moveTo(x0+Math.cos(an)*20,y0+Math.sin(an)*20);c.lineTo(ex,ey);c.stroke();c.setLineDash([]);
    c.beginPath();c.moveTo(ex+Math.cos(an)*14,ey+Math.sin(an)*14);c.lineTo(ex+Math.cos(an+2.4)*14,ey+Math.sin(an+2.4)*14);c.lineTo(ex+Math.cos(an-2.4)*14,ey+Math.sin(an-2.4)*14);c.fill();};
  if(!o.quiz){if(choice&&choice!==G.sc.ans)arrow(choice,'#ff4d4d',true);
    arrow(G.sc.ans,'#16c060',false);}
  if(o.hl){const t=snap.find(p=>p.role===o.hl);if(t){c.strokeStyle='#ffd23d';c.lineWidth=5;c.setLineDash([9,7]);c.beginPath();c.arc(sx(t.x),sz(t.z),30,0,7);c.stroke();c.setLineDash([]);}}
  c.textAlign='center';c.textBaseline='middle';
  if(G.sc.spots)G.sc.spots.forEach(sp=>{const x=sx(sp.x),y=sz(sp.z);c.fillStyle='rgba(255,140,90,.35)';c.strokeStyle='#ff8a5a';c.lineWidth=3;c.beginPath();c.arc(x,y,15,0,7);c.fill();c.stroke();
    c.fillStyle='#fff';c.font='900 15px Nunito,Arial,sans-serif';c.fillText(sp.id,x,y+1);});
  snap.forEach(p=>{if(p.z<-10.8&&!far)return;const x=sx(p.x),y=sz(p.z),isMe=p===me,C=TEAM[p.team===me.team?'home':'away'];
    const numbered=isMe||p.team==='off';
    c.fillStyle=isMe?'#ffd23d':C.jersey;c.beginPath();c.arc(x,y,numbered?18:14,0,7);c.fill();c.strokeStyle=!isMe&&p.team===me.team?CLUB_NAVY:'#fff';c.lineWidth=numbered?3:2;c.stroke();
    if(numbered){c.fillStyle=isMe?'#201600':C.number;c.font='900 17px Nunito,Arial,sans-serif';c.fillText(isMe?'DU':p.num,x,y+1);}
    if(p.ball){c.fillStyle='#ff7a1a';c.strokeStyle='#3a1500';c.lineWidth=2;c.beginPath();c.arc(x+15,y-14,8,0,7);c.fill();c.stroke();}});
}

// ================= Ergebnis =================
function showSummary(){
  G.phase='summary';$('hud').classList.add('hidden');$('bottom').classList.add('hidden');
  const n=G.results.length,ok=G.results.filter(r=>r.ok).length;
  const rts=G.results.filter(r=>r.rt!=null).map(r=>r.rt),avg=rts.length?rts.reduce((a,b)=>a+b,0)/rts.length:0;
  $('sCorrect').textContent=`${ok}/${n}`;$('sRt').textContent=avg.toFixed(1).replace('.',',')+'s';$('sScore').textContent=G.score;
  const q=ok/n,role=(GIRL?{pg:'Spielmacherin',wing:'Flügelspielerin',center:'Centerin',def:'Verteidigerin',mix:'Spielerin'}:{pg:'Spielmacher',wing:'Flügelspieler',center:'Center',def:'Verteidiger',mix:'Spieler'})[G.pos];
  $('sumTitle').textContent=q===1?`${role}-Legende!`:q>=.8?`${GIRL?'Starke':'Starker'} ${role}!`:q>=.6?'Gut gemacht!':'Übung macht den Meister!';
  const st=q>=.9?3:q>=.7?2:q>=.4?1:0;$('sStars').innerHTML=[0,1,2].map(i=>svgI('star','fill'+(i<st?' on':''))).join('');
  $('sumTxt').textContent=q===1?'Alles richtig gelesen. Versuch das nächste Level!':q>=.8?'Du liest die Verteidigung schon richtig gut.':q>=.6?'Schon ordentlich. Achte besonders darauf, wer hilft.':'Schau dir die Tipps nochmal an und probier es gleich wieder.';
  const cat=[['Zum Korb (mit Ball)',r=>r.ans==='drive'&&!r.off],['Pass zum freien Mitspieler',r=>r.ans.startsWith('pass:')],['Selbst werfen',r=>r.ans==='shot'&&!r.off],['Ohne Ball: zum Korb laufen',r=>r.ans==='drive'&&r.off],['Ohne Ball: Ball fordern / Platz lassen',r=>r.ans==='shot'&&r.off]];
  const rowH=(label,rs)=>{if(!rs.length)return'';const k=rs.filter(r=>r.ok).length;return`<div class="br"><span>${label}</span><span style="color:${k===rs.length?'#7ff0ad':k?'#ffc83d':'#ff8a80'}">${k}/${rs.length}</span></div>`;};
  const played=[...new Set(G.results.map(r=>r.play))];
  $('sBreak').innerHTML='<div class="sec-t">Nach Lernziel</div>'+Object.keys(LZ).map(k=>rowH(svgI(LZ[k].i)+LZ[k].n,G.results.filter(r=>lzKeys(r).includes(k)))).join('')+
    '<div class="sec-t">Nach Spielzug</div>'+played.map(p=>rowH(PLAYS[p].name,G.results.filter(r=>r.play===p))).join('')+(G.results.some(r=>r.def)?'':'<div class="sec-t">Nach Entscheidung</div>'+cat.map(([l,f])=>rowH(l,G.results.filter(f))).join(''));
  const key=bestKey(),prev=+(store.get(key)||0);
  if(G.score>prev){store.set(key,G.score);$('sBest').innerHTML=svgI('star','fill')+(prev?`Neuer Rekord! (vorher ${prev})`:'Erster Rekord gesetzt!');if(st)setTimeout(()=>confetti(60),400);}
  else $('sBest').textContent=`Dein Rekord mit diesen Einstellungen: ${prev}`;
  const res=recordGame({n,ok,stars:st,mode:G.mode,level:G.level,record:G.score>prev&&prev>0,fast:G.results.some(r=>r.ok&&r.rt!=null&&r.rt<1)}),L=lvlOf(PROFILE.xp);
  $('sXpLv').textContent=L.name;$('sXpN').textContent='+'+res.xp+' XP';$('sXpBar').style.width='0';setTimeout(()=>$('sXpBar').style.width=(L.f*100)+'%',300);
  $('cardNum').textContent=PROFILE.num;
  if(res.neu.length||res.up)setTimeout(()=>showUnlock(res),900);
  const ng=nextGoal();$('sGoal').classList.toggle('hidden',!ng);
  if(ng)$('sGoal').innerHTML=`<span class="medal" style="--mc:${ng.b.c}">${svgI(ng.b.i)}</span><div><small>Nächstes Abzeichen</small><b>${ng.b.n}</b> · ${ng.pr.c} von ${ng.pr.g}${bpBar(ng.pr)}</div>`;
  G.nextLv=st===3&&G.level<3&&!G.theme?G.level+1:0;
  $('againBtn').innerHTML=G.nextLv?svgI('up')+'Weiter: '+LVN[G.nextLv-1]:svgI('replay')+'Nochmal';
  $('menuBtn').classList.toggle('ico',!!G.nextLv);$('menuBtn').innerHTML=svgI('home')+(G.nextLv?'':'Hauptmenü');
  if(G.first){G.first=false;G.rounds=10;}
  $('sSave').classList.toggle('hidden',!needSave());
  G.saved=false;$('nameIn').readOnly=false;$('nameIn').value=store.get('pgt_name')||'';$('saveBtn').disabled=false;$('saveBtn').innerHTML='Eintragen';$('nameRow').classList.remove('hidden');
  if(!autoScore())showBoardIn($('sBoard'),{pos:G.pos,mode:G.mode,level:G.level},null);
  $('summary').classList.remove('hidden');
}

