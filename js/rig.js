// Spielerfiguren: alte Figuren (makeRig), Figur aus player.glb (makeGLBRig, Clips, IK, Füße, Hals), Haare, Gesicht, Comic-Kopf, Markierung des eigenen Spielers, Kontaktschatten, Ball-Modell.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Spieler-Modell =================
const GEO={thigh:new T3.CapsuleGeometry(.068,.3,4,10),shin:new T3.CapsuleGeometry(.056,.28,4,10),uarm:new T3.CapsuleGeometry(.05,.2,4,8),farm:new T3.CapsuleGeometry(.043,.19,4,8),hand:new T3.SphereGeometry(.053,10,8),
  chest:new T3.CylinderGeometry(.24,.2,.58,18),shorts:new T3.CylinderGeometry(.21,.25,.38,18),neck:new T3.CylinderGeometry(.055,.062,.12,10),head:new T3.SphereGeometry(.118,20,16),
  hair:new T3.SphereGeometry(.124,20,10,0,Math.PI*2,0,Math.PI*.5),afro:new T3.SphereGeometry(.158,20,12,0,Math.PI*2,0,Math.PI*.54),pony:new T3.CapsuleGeometry(.038,.13,4,8),bun:new T3.SphereGeometry(.062,12,10),
  long:new T3.SphereGeometry(.125,20,12,Math.PI,Math.PI,0,Math.PI*.78),plait:new T3.CapsuleGeometry(.03,.12,4,8),
  shoe:new T3.CapsuleGeometry(.062,.17,4,10),sole:new T3.BoxGeometry(.13,.035,.3),sock:new T3.CylinderGeometry(.06,.06,.13,10),num:new T3.PlaneGeometry(.26,.26),
  eye:new T3.SphereGeometry(.014,6,6),ear:new T3.SphereGeometry(.028,8,6),nose:new T3.SphereGeometry(.019,8,6),brow:new T3.BoxGeometry(.046,.011,.012),
  collar:new T3.TorusGeometry(.09,.018,6,18),band:new T3.CylinderGeometry(.22,.22,.05,18,1,true),hband:new T3.CylinderGeometry(.126,.126,.036,20,1,true),wband:new T3.CylinderGeometry(.05,.05,.07,10,1,true),
  delt:new T3.SphereGeometry(.066,10,8),tie:new T3.TorusGeometry(.03,.012,6,14),lash:new T3.BoxGeometry(.022,.006,.006),curtain:new T3.CapsuleGeometry(.05,.12,4,14),stripe:new T3.BoxGeometry(.02,.34,.07),side:new T3.BoxGeometry(.018,.46,.09)};
const MAT={},matC=(k,o)=>MAT[k]||(MAT[k]=new T3.MeshStandardMaterial(Object.assign({envMapIntensity:.55},o)));
const TEAM={
  home:{jersey:CLUB_WHITE,trim:CLUB_ORANGE,collar:CLUB_NAVY,number:'#c84c0c',shorts:CLUB_NAVY,shoe:0xffffff,sole:CLUB_NAVY},
  away:{jersey:CLUB_NAVY,trim:CLUB_ORANGE,collar:CLUB_ORANGE,number:CLUB_ORANGE,shorts:CLUB_NAVY,shoe:0x262626,sole:0xffffff}
};
const HAIRC=[0x161616,0x3a2414,0x6b4423,0xc9a15b,0xa8481c,0x0d0d0d];
const HAIRS=['Kurz','Locken','Zopf','Dutt','Stirnband','Zöpfe','Lang','Flechtzopf'];
// Mitspieler und Gegner: in der Mädchen-Version eher lange Haare (Zopf, Flechtzopf, Zöpfe, offen, Dutt), sonst wie bisher
const HAIR_W=[[2,3],[7,2],[5,1.5],[6,1.5],[3,1.5],[1,1]];
function randHair(r){if(!GIRL)return r()<.5?0:(r()*5)|0;let x=r()*HAIR_W.reduce((a,w)=>a+w[1],0);for(const[h,w]of HAIR_W){if((x-=w)<0)return h;}return 2;}
// Haare am Kopf-Anker (alte Figur und player.glb): Kopfmitte = 0, Gesicht nach +z.
// hsc = Skalierung des Kopf-Ankers (player.glb: schmaler Kopf). Zöpfe hängen an zwei Gruppen: außen hebt die Skalierung
// wieder auf, innen dreht swayHair() den Zopf (hängt nach unten, schwingt beim Laufen). Rückgabe: Liste der Zopf-Gelenke.
const TIES=[0xff5fa2,0xffd23d,0xffffff,0x9b6bff,0x2ec4b6];
function addHair(M,head,hs,hm,tm,cs,hsc,tie){
  const sw=[];
  // Zopf aus verjüngten Kugeln entlang -y (Meter, unverzerrt), Haargummi oben
  const tail=(x,y,z,len,r0,r1,n,th,side,braid,wide)=>{const o=new T3.Group();o.position.set(x,y,z);if(hsc)o.scale.set(1/hsc.x,1/hsc.y,1/hsc.z);head.add(o);
    const pv=new T3.Group();pv.rotation.set(th,0,side*.25);o.add(pv);
    if(tie&&!wide)M(GEO.tie,tie,pv,0,-.005,0).rotation.x=Math.PI/2;
    if(wide)M(GEO.curtain,hm,pv,0,-len*.5,0).scale.set(wide,len/.22,.5);
    else for(let i=0;i<n;i++){const u=i/(n-1),r=r0+(r1-r0)*u,b=M(GEO.bun,hm,pv,0,-.03-u*len,0);b.scale.set(r/.062,(braid?.75:1.6)*len/n/.062,r/.062*.9);}
    sw.push({pv,th,side});return pv;};
  if(hs===1){const a=M(GEO.afro,hm,head,0,.048,-.018);a.rotation.x=-.42;a.scale.set(1,.92,1);return sw;}
  const hr=M(GEO.hair,hm,head,0,.02,-.004);hr.rotation.x=-.43;if(cs)hr.scale.setScalar(cs);
  // Zopf: hoch am Hinterkopf, bis zwischen die Schultern
  if(hs===2){M(GEO.bun,hm,head,0,.06,-.105).scale.setScalar(.7);tail(0,.07,-.13,.24,.042,.022,6,.55,0);}
  if(hs===3){M(GEO.bun,hm,head,0,.15,-.05).scale.setScalar(1.25);if(tie){const t=M(GEO.tie,tie,head,0,.115,-.04);t.rotation.x=-.4;}}
  if(hs===4){const b=M(GEO.hband,tm,head,0,.045,-.005);b.rotation.x=-.39;}
  // Zöpfe: zwei Zöpfe links und rechts hinter den Ohren
  if(hs===5)for(const s of[-1,1]){M(GEO.bun,hm,head,s*.1,.02,-.06).scale.setScalar(.5);tail(s*.105,0,-.07,.17,.03,.018,5,.25,s,true);}
  // offen: lange Haare bis auf die Schultern
  if(hs===6){const l=M(GEO.long,hm,head,0,-.033,-.022);l.scale.set(1.04,1.4,1.05);tail(0,-.02,-.095,.2,0,0,0,.12,0,false,2.1);}
  // Flechtzopf: tief am Hinterkopf, lang und geflochten
  if(hs===7){M(GEO.bun,hm,head,0,.0,-.118).scale.setScalar(.62);tail(0,-.02,-.125,.3,.038,.02,8,.3,0,true);}
  return sw;}
// Gesicht: Mädchen mit Wimpern und etwas feineren, geschwungenen Augenbrauen
function addFace(M,head,km,em,bm,ze,zb,zn){
  // ?look=stil: große Augen mit Weiß, Pupille und Lichtpunkt (Gesichter auch auf dem Handy lesbar)
  if(STIL){const wm=matC('eyeW',{color:0xf4f1ea,roughness:.35}),hl=matC('eyeH',{color:0xffffff,emissive:0xffffff,emissiveIntensity:.8});
    for(const s of[-1,1]){M(GEO.eye,wm,head,s*.041,.017,ze-.007).scale.set(1.75,2.05,.75);
      M(GEO.eye,em,head,s*.04,.014,ze+.002).scale.set(1.05,1.25,.7);M(GEO.eye,hl,head,s*.04+.005,.022,ze+.009).scale.setScalar(.3);}
    // kleiner Mund (Bogen nach unten offen = Lächeln), sonst wirken die Gesichter leer
    const mo=M(GEO.mouth||(GEO.mouth=new T3.TorusGeometry(.019,.0042,5,12,Math.PI)),em,head,0,-.046,zn-.003);mo.rotation.z=Math.PI;mo.scale.set(1,.75,1.6);}
  else{M(GEO.eye,em,head,-.04,.015,ze);M(GEO.eye,em,head,.04,.015,ze);}
  if(GIRL){for(const s of[-1,1]){const l=M(GEO.lash,em,head,s*.056,.024,ze-.004);l.rotation.z=s*.55;const b=M(GEO.brow,bm,head,s*.042,.05,zb);b.scale.set(1.05,.7,1);b.rotation.z=-s*.22;}
    M(GEO.nose,km,head,0,-.014,zn-.002).scale.setScalar(.8);}
  else{M(GEO.brow,bm,head,-.042,.045,zb).rotation.z=.12;M(GEO.brow,bm,head,.042,.045,zb).rotation.z=-.12;M(GEO.nose,km,head,0,-.012,zn);}}
// Zöpfe schwingen: hängen nach unten (unabhängig von der Kopfhaltung), fliegen beim Laufen nach hinten,
// wippen im Schrittrhythmus und schwingen bei Drehungen zur Seite (gedämpfte Feder).
const _sq=new T3.Quaternion(),_se=new T3.Euler();
function swayHair(p,dt){const r=p.rig,H=r.sway;if(!H||!H.length||!r.root.visible)return;const c=r.cur;
  const a=p.ang,lx=Math.cos(a),lz=Math.sin(a),fx=Math.sin(a),fz=-Math.cos(a),s=p.spd||0;
  const vf=(p.vx||0)*fx+(p.vz||0)*fz,vl=(p.vx||0)*lx+(p.vz||0)*lz,da=wrapA(a-(c.sa0===undefined?a:c.sa0))/Math.max(dt,1e-3);c.sa0=a;
  const ph=r.glb?r.ph:(p.ph||0)/(Math.PI*2),bob=Math.sin(ph*Math.PI*4)*.1*clamp(s/3,0,1);
  const tX=clamp(vf*.1,-.25,.55)+bob+(p.jy>.05?-.25:0),tZ=clamp(-vl*.07-da*.06,-.5,.5),k=Math.min(1,dt*60);
  c.sx=(c.sx||0)+(((tX-(c.px||0))*90-(c.sx||0)*9)*dt);c.px=(c.px||0)+c.sx*dt;
  c.sz=(c.sz||0)+(((tZ-(c.pz||0))*70-(c.sz||0)*8)*dt);c.pz=(c.pz||0)+c.sz*dt;
  r.root.updateMatrixWorld(true);r.root.getWorldQuaternion(_q1);
  for(const h of H){const par=h.pv.parent;par.getWorldQuaternion(_q2);
    _se.set(h.th+c.px*(h.side?.7:1),0,h.side*.25+c.pz);_sq.setFromEuler(_se);
    h.pv.quaternion.copy(_q2.invert().multiply(_q1).multiply(_sq));}}
const numMats={};
function numMat(team,n){const k=team+n;if(numMats[k])return numMats[k];const t=canvasTex(128,128,(g,w)=>{g.fillStyle=TEAM[team].number;g.font=`900 ${String(n).length>1?78:96}px Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(n,w/2,w/2+6);});
  // Comic: keine Tiefe schreiben, sonst zeichnet die Linien-Erkennung den Rand der durchsichtigen Fläche als Rechteck
  return numMats[k]=new T3.MeshStandardMaterial({map:t,transparent:true,roughness:.6,depthWrite:!COMIC});}
function randLook(){const r=Math.random,si=(r()*SKINC.length)|0;return{skin:si,hair:randHair(r),hairC:(si<1||si===4)?(r()<.7?0:1):(r()*HAIRC.length)|0,wrist:r()<.35};}
// ?look=comic: alle Standard-Materialien als Toon-Material (wenige weiche Lichtstufen, keine Spiegelungen, billiger als PBR).
// Farbe, Textur, Leuchten und eigene Shader-Teile (Trikotstreifen) bleiben; Deckkraft/Leuchtstärke folgen dem Original.
const TOON_G=(()=>{const t=new T3.DataTexture(new Uint8Array([128,150,196,232,246]),5,1,T3.RedFormat);t.minFilter=t.magFilter=T3.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;})();
const toonC=new Map();
function toonMat(m){if(!m||!m.isMeshStandardMaterial)return m;let t=toonC.get(m);if(t)return t;
  t=new T3.MeshToonMaterial({gradientMap:TOON_G,map:m.map,emissiveMap:m.emissiveMap,alphaMap:m.alphaMap,transparent:m.transparent,alphaTest:m.alphaTest,
    side:m.side,depthWrite:m.depthWrite,toneMapped:m.toneMapped,vertexColors:m.vertexColors,fog:m.fog});
  t.name=m.name;t.color=m.color;t.emissive=m.emissive;t.polygonOffset=m.polygonOffset;t.polygonOffsetFactor=m.polygonOffsetFactor;t.polygonOffsetUnits=m.polygonOffsetUnits;
  for(const k of['opacity','emissiveIntensity','visible'])Object.defineProperty(t,k,{get:()=>m[k],set:v=>{m[k]=v;},configurable:true});
  if(m.onBeforeCompile!==T3.Material.prototype.onBeforeCompile)t.onBeforeCompile=m.onBeforeCompile;
  if(m.customProgramCacheKey!==T3.Material.prototype.customProgramCacheKey)t.customProgramCacheKey=m.customProgramCacheKey;
  toonC.set(m,t);return t;}
function toonify(o){
  if(!COMIC)return o;o.traverse(x=>{if(x.material)x.material=Array.isArray(x.material)?x.material.map(toonMat):toonMat(x.material);});return o;}
function makeRig(team,num,look){
  const C=TEAM[team],L=look||randLook(),si=L.skin;
  const jm=matC('j'+team,{color:C.jersey,roughness:.55}),sm=matC('s'+team,{color:C.shorts,roughness:.6}),tm=matC('t',{color:0xffffff,roughness:.5}),trim=matC('trim'+team,{color:C.trim,roughness:.55}),
    km=matC('k'+si,{color:SKINC[si],roughness:.55}),shm=matC('sh'+team,{color:C.shoe,roughness:.4}),slm=matC('sl'+team,{color:C.sole,roughness:.5}),
    hm=matC('h'+L.hairC,{color:HAIRC[L.hairC],roughness:.9}),em=matC('eye',{color:0x111111}),bm=matC('b'+L.hairC,{color:new T3.Color(HAIRC[L.hairC]).multiplyScalar(.7),roughness:.9});
  const M=(g,m,parent,x=0,y=0,z=0)=>{const o=new T3.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
  const root=new T3.Group(),hips=new T3.Group();hips.position.y=.95;root.add(hips);
  const sh=M(GEO.shorts,sm,hips,0,-.06,0);sh.scale.z=.78;
  const bd=M(GEO.band,trim,hips,0,.11,0);bd.scale.z=.8;
  for(const s of[-1,1]){const st=M(GEO.stripe,trim,hips,s*.226,-.07,0);st.rotation.z=s*.1;}
  const torso=new T3.Group();torso.position.y=.06;hips.add(torso);
  const gs=GIRL?.86:1; // Mädchen: schmalere Schultern, dünnere Arme
  const ch=M(GEO.chest,jm,torso,0,.29,0);ch.scale.z=.64;ch.scale.x=GIRL?.9:1;
  for(const s of[-1,1]){const sd=M(GEO.side,trim,torso,s*.217*(GIRL?.9:1),.27,0);sd.rotation.z=s*.07;}
  const col=M(GEO.collar,matC('collar'+team,{color:C.collar,roughness:.55}),torso,0,.57,0);col.rotation.x=Math.PI/2;col.scale.y=.8;
  M(GEO.neck,km,torso,0,.62,0);
  const head=new T3.Group();head.position.y=.76;torso.add(head);
  const hd=M(GEO.head,km,head);hd.scale.set(1,1.1,1);
  M(GEO.ear,km,head,-.116,0,0).scale.set(.6,1,1);M(GEO.ear,km,head,.116,0,0).scale.set(.6,1,1);
  addFace(M,head,km,em,bm,.108,.108,.118);
  const sway=addHair(M,head,L.hair,hm,tm,0,null,matC('tie'+num%TIES.length,{color:TIES[num%TIES.length],roughness:.5}));
  const nf=new T3.Mesh(GEO.num,numMat(team,num));nf.position.set(0,.32,.158);torso.add(nf);nf.scale.setScalar(.75);
  const nb=new T3.Mesh(GEO.num,numMat(team,num));nb.position.set(0,.3,-.158);nb.rotation.y=Math.PI;torso.add(nb);
  const shL=[],elL=[],hipL=[],knL=[];
  for(const s of[-1,1]){
    const shg=new T3.Group();shg.position.set(s*(GIRL?.245:.27),.5,0);torso.add(shg);
    M(GEO.delt,km,shg,0,-.02,0).scale.setScalar(gs*.95);
    M(GEO.uarm,km,shg,0,-.15,0).scale.set(gs,1,gs);const el=new T3.Group();el.position.y=-.3;shg.add(el);M(GEO.farm,km,el,0,-.13,0).scale.set(gs,1,gs);M(GEO.hand,km,el,0,-.29,0);
    if(L.wrist&&s>0)M(GEO.wband,tm,el,0,-.23,0);
    shL.push(shg);elL.push(el);
    const hp=new T3.Group();hp.position.set(s*.105,-.09,0);hips.add(hp);
    M(GEO.thigh,km,hp,0,-.21,0);const kn=new T3.Group();kn.position.y=-.42;hp.add(kn);
    M(GEO.shin,km,kn,0,-.18,0);M(GEO.sock,tm,kn,0,-.3,0);
    const so=M(GEO.shoe,shm,kn,0,-.39,.05);so.rotation.x=Math.PI/2;so.scale.set(1.05,1,.85);M(GEO.sole,slm,kn,0,-.43,.05);
    hipL.push(hp);knL.push(kn);}
  toonify(root);
  return{root,hips,torso,head,sh:shL,el:elL,hip:hipL,kn:knL,cur:{},sway};
}

// ================= Figur aus player.glb =================
// Mannequin aus der „Universal Animation Library“ von Quaternius (CC0), gebaut mit tools/build_player.mjs.
// Einmal geladen über GLTFLoader (Modul am Ende der Seite), jeder Spieler bekommt einen Klon (SkeletonUtils.clone)
// mit eigenem AnimationMixer. Beine und Körper kommen aus den Clips, die Arme greifen per IK zum Ball,
// der Kopf schaut zum Ball. Ohne Datei/Netz oder mit ?rig=alt bleiben die alten Figuren (makeRig/poseP).
const GLB={ok:false,want:!/[?&]rig=alt\b/.test(location.search)};
window.initGLB=function(GLTFLoader,skClone){
  if(!GLB.want||GLB.ok)return;
  new GLTFLoader().load('player.glb',g=>{
    GLB.src=g.scene;GLB.clips={};g.animations.forEach(a=>GLB.clips[a.name]=a);GLB.clone=skClone;GLB.ok=true;
    // Oberkörper-Fassungen von Pass und Fangen: Im Laufen laufen die Beine weiter
    // Dribbeln im Gehen: nur der Oberkörper aus dem Dribbel-Clip, die Beine laufen mit (sonst schleifen die Füße)
    ['pass','passO','catch','dribble','dribbleM'].forEach(n=>{const c=GLB.clips[n];if(c)GLB.clips[n+'U']=new T3.AnimationClip(n+'U',c.duration,c.tracks.filter(t=>UPPER.test(t.name)));});
    if(G.phase==='menu')demo();if(CARD.on)cardRig();
  },undefined,e=>console.warn('player.glb nicht geladen, alte Figuren',e));};
const LOCO=[['idle',0],['walk',1.4],['jog',3.2],['sprint',5.8]],STRIDE={walk:1.4,jog:2.9,sprint:4.1,jogBack:1.75,runBack:1.85,sadWalk:1.1,backD:.8};
// Zusätzliche Clips aus Mixamo (tools/add_mixamo.mjs): dribble/dribbleM (rechte/linke Hand), ready (Grundstellung),
// jogBack/runBack (rückwärts), cheer/clap (Jubel), sadWalk. Fehlen sie, laufen die alten Clips weiter.
const CHEERS=['cheer','clap','cheer'];
// Eigene Clips für Aktionen (tools/make_clips.mjs): Sprungwurf, Korbleger (layupM = linke Hand), Pass, Überkopfpass
// (lange Pässe), Fangen, Block. Der Knoten BALL zeigt, wo der Ball in den Händen liegt; das Spiel setzt den Ball
// dorthin, solange der Spieler ihn hält (Wurf bis zum Abwurf, Korbleger bis zum Abwurf, Fangen).
const ACTC={shoot:'shot',layup:'layup',block:'block',pass:'pass',catch:'catch'},ACT_ALL=['shot','layup','layupM','block','pass','passO','catch','passU','passOU','catchU'];
const UPPER=/spine|neck|head|shoulder|arm|hand|f_|thumb|BALL/,BL={x:0,y:0,z:0};
const _v1=new T3.Vector3(),_v2=new T3.Vector3(),_v3=new T3.Vector3(),_v4=new T3.Vector3(),_v5=new T3.Vector3(),
  _q1=new T3.Quaternion(),_q2=new T3.Quaternion(),_q3=new T3.Quaternion(),UPV=new T3.Vector3(0,1,0);
function makeJersey(team,num){const kit=TEAM[team];
  // ?look=stil: Trikotstoff mit Glanz an den Kanten (sheen) und offener Innenseite (Armausschnitt, Saum)
  const material=STIL?new T3.MeshPhysicalMaterial({color:kit.jersey,roughness:.72,envMapIntensity:.45,sheen:1,sheenRoughness:.45,sheenColor:new T3.Color(.42,.42,.46),side:T3.DoubleSide})
    :new T3.MeshStandardMaterial({color:kit.jersey,roughness:.55,envMapIntensity:.55});
  const trim=new T3.Color(kit.trim),collar=new T3.Color(kit.collar);
  // ?look=stil: glatter Schnitt im Shader; der Stoff gewinnt dicht an der Haut gegen die Haut darunter
  if(STIL){material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-2;}
  material.customProgramCacheKey=()=>'jersey'+(STIL?'S':'')+(num===undefined?'':'N'); // gleicher Code, anderer Shader je nach Nummer
  material.onBeforeCompile=shader=>{
    if(STIL)CUT_GLSL(shader);
    // Die Position im Ruhemodell hält Seitenstreifen und Kragen bei der Animation auf dem Trikot.
    shader.uniforms.clubTrim={value:trim};
    shader.uniforms.clubCollar={value:collar};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 jerseyRest;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\njerseyRest = position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 jerseyRest;\nuniform vec3 clubTrim;\nuniform vec3 clubCollar;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        float lateral = abs(jerseyRest.x);
        float depth = abs(jerseyRest.z + 0.025);
        float side = depth / max(lateral, 0.001);
        float stripe = (1.0 - smoothstep(0.19, 0.28, side))
          * smoothstep(0.13, 0.16, jerseyRest.y) * (1.0 - smoothstep(0.46, 0.49, jerseyRest.y));
        float neckHeight = 0.51 + 0.5 * lateral;
        float collarBand = (1.0 - smoothstep(0.012, 0.022, abs(jerseyRest.y - neckHeight)))
          * smoothstep(0.035, 0.065, depth) * (1.0 - smoothstep(0.13, 0.17, lateral));
        diffuseColor.rgb = mix(mix(diffuseColor.rgb, clubTrim, stripe), clubCollar, collarBand);`+(num===undefined?'':`
        // Rückennummer und Brustnummer liegen auf dem Stoff (Projektion in Ruhekoordinaten), statt als flache Tafel davor
        vec2 nF=vec2(jerseyRest.x-numF.x,jerseyRest.y-numF.y)/numF.z+.5,nB=vec2(numB.x-jerseyRest.x,jerseyRest.y-numB.y)/numB.z+.5;
        vec2 nUV=jerseyRest.z>numZ?nF:nB;
        if(nUV.x>0.&&nUV.x<1.&&nUV.y>0.&&nUV.y<1.){vec4 nc=texture2D(numTex,nUV);diffuseColor.rgb=mix(diffuseColor.rgb,nc.rgb,nc.a);}`));
    if(num!==undefined){shader.uniforms.numTex={value:numMat(team,num).map};shader.uniforms.numF={value:NUMP.f};shader.uniforms.numB={value:NUMP.b};shader.uniforms.numZ={value:NUMP.z};
      shader.fragmentShader=shader.fragmentShader.replace('uniform vec3 clubCollar;','uniform vec3 clubCollar;\nuniform sampler2D numTex;uniform vec3 numF;uniform vec3 numB;uniform float numZ;');}
  };
  return material;}
const glbJerseys=Object.fromEntries(Object.keys(TEAM).map(team=>[team,makeJersey(team)]));
// ?look=stil: Trikot je Spieler mit aufgedruckter Nummer. Lage in Ruhekoordinaten des Trikots wie bei den alten Nummern-Tafeln
// (Brust 1,30 m, Rücken 1,32 m; Breite 0,19 bzw. 0,21 m), Vorder- und Rückseite getrennt an der Körpermitte. Die Punkte im
// Netz sind quantisiert (gltfpack, Bereich ±1), deshalb Welt → Netz über einen Knochen in der Ruhepose.
const NUMP={},jerseyNums={};
function jerseyNum(team,num){const k=team+'_'+num;if(jerseyNums[k])return jerseyNums[k];
  if(!NUMP.f){let J=null;GLB.src.traverse(o=>{if(o.isSkinnedMesh&&o.material.name==='jersey')J=o;});GLB.src.updateMatrixWorld(true);
    const sk=J.skeleton,bi=sk.bones.findIndex(b=>/spine003/.test(b.name)),
      m=new T3.Matrix4().multiplyMatrices(sk.bones[bi].matrixWorld,sk.boneInverses[bi]).invert(),sc=new T3.Vector3().setFromMatrixScale(m).x,f=new T3.Vector3(0,1.30,.15).applyMatrix4(m),b=new T3.Vector3(0,1.32,-.18).applyMatrix4(m),z=new T3.Vector3(0,1.3,-.025).applyMatrix4(m);
    NUMP.f=new T3.Vector3(f.x,f.y,.26*.72*sc);NUMP.b=new T3.Vector3(b.x,b.y,.26*.8*sc);NUMP.z=z.z;}
  return jerseyNums[k]=makeJersey(team,num);}
// Farben in Ruhekoordinaten: Die Besätze bleiben auch bei gebeugten Knien am Stoff.
function kitMaterial(team,part,color,roughness,pattern){
  const material=matC(part+team,{color,roughness});
  const cut=STIL&&part==='shoe'; // ?look=stil: glatter Schuhrand (cut aus partIdx), Schuh liegt über Socke und Haut
  material.customProgramCacheKey=()=>part+(cut?'C':'');
  if(cut){material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-2;}
  material.onBeforeCompile=shader=>{
    if(cut)CUT_GLSL(shader);
    shader.uniforms.kitAccent={value:new T3.Color(TEAM[team].trim)};
    shader.vertexShader='varying vec3 kitRest;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nkitRest=position;');
    shader.fragmentShader='varying vec3 kitRest; uniform vec3 kitAccent;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+pattern);
  };
  return material;
}
const teamGear=Object.fromEntries(Object.entries(TEAM).map(([team,kit])=>[team,{
  shorts:kitMaterial(team,'shorts',kit.shorts,.82,`
    float panel=(1.0-smoothstep(.035,.06,abs(kitRest.z+.027)))*smoothstep(.08,.14,abs(kitRest.x));
    float hem=1.0-smoothstep(.008,.018,abs(kitRest.y+.385));
    diffuseColor.rgb=mix(diffuseColor.rgb,kitAccent,max(panel*.85,hem));`),
  shoe:kitMaterial(team,'shoe',kit.shoe,.5,`
    float sole=1.0-smoothstep(-.917,-.903,kitRest.y);
    float heel=(1.0-smoothstep(-.085,-.06,kitRest.z))*smoothstep(-.91,-.88,kitRest.y);
    diffuseColor.rgb=mix(mix(diffuseColor.rgb,kitAccent,heel),vec3(.74),sole);`)
}]));
// ?look=stil: weite Hose mit Farbstreifen am Saum (Attribut hemU: 0 an der Hüfte, 1 am Saum, aus youthGeo) und an der Seite
function stilSock(){if(MAT.sockS)return MAT.sockS;const m=matC('sockS',{color:0xffffff,roughness:.5});
  m.customProgramCacheKey=()=>'stilSock';m.onBeforeCompile=CUT_GLSL;return m;}
function stilShorts(team){const k='shortsS'+team;if(MAT[k])return MAT[k];const m=matC(k,{color:TEAM[team].shorts,roughness:.82,side:T3.DoubleSide});
  m.customProgramCacheKey=()=>'stilShorts';m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-2;
  m.onBeforeCompile=sh=>{CUT_GLSL(sh);sh.uniforms.kitAccent={value:new T3.Color(TEAM[team].trim)};
    sh.vertexShader='attribute float hemU;varying float vHem;varying vec3 kitRest;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHem=hemU;kitRest=position;');
    sh.fragmentShader='varying float vHem;varying vec3 kitRest;uniform vec3 kitAccent;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float hem=smoothstep(.885,.9,vHem)*(1.-smoothstep(.945,.96,vHem));
      float panel=(1.0-smoothstep(.035,.06,abs(kitRest.z+.027)))*smoothstep(.08,.14,abs(kitRest.x))*step(.02,vHem);
      diffuseColor.rgb=mix(diffuseColor.rgb,kitAccent,max(hem,panel*.85));`);};
  return m;}
function makeGLBRig(team,num,look){
  const C=TEAM[team],L=look||randLook(),si=L.skin;
  // ?look=stil: Haut etwas weicher, mit warmem Eigenleuchten (wirkt wie Licht, das in die Haut fällt, statt Plastik)
  const MT={jersey:STIL&&partIdx()?jerseyNum(team,num):glbJerseys[team],shorts:STIL&&partIdx()?stilShorts(team):teamGear[team].shorts,skin:STIL?matC('ks'+si,{color:SKINC[si],roughness:.62,emissive:new T3.Color(SKINC[si]).multiplyScalar(COMIC?.02:.09),envMapIntensity:.35}):matC('k'+si,{color:SKINC[si],roughness:.55}),
    sock:STIL&&partIdx()?stilSock():matC('t',{color:0xffffff,roughness:.5}),shoe:teamGear[team].shoe};
  const hm=matC('h'+L.hairC,{color:HAIRC[L.hairC],roughness:.9}),em=matC('eye',{color:0x111111}),bm=matC('b'+L.hairC,{color:new T3.Color(HAIRC[L.hairC]).multiplyScalar(.7),roughness:.9}),tm=MT.sock;
  const root=new T3.Group(),body=GLB.clone(GLB.src);root.add(body);
  const B={};
  const gg=youthGeo(GIRL);
  body.traverse(o=>{if(o.isMesh){o.material=MT[o.material.name]||MT.skin;if(gg&&gg[o.geometry.uuid])o.geometry=gg[o.geometry.uuid];o.castShadow=true;o.frustumCulled=false;}if(o.isBone)B[o.name.replace('DEF-','')]=o;});
  root.updateMatrixWorld(true);
  // Anker an einem Knochen, ausgerichtet wie die ganze Figur (für Haare, Gesicht, Nummer)
  const anchor=(bone,x,y,z)=>{const a=new T3.Group();bone.add(a);a.quaternion.copy(bone.getWorldQuaternion(_q1).invert());a.position.copy(bone.worldToLocal(_v1.set(x,y,z)));return a;};
  const M=(g,m,parent,x=0,y=0,z=0)=>{const o=new T3.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
  const head=anchor(B.head,0,HEADC.y,HEADC.z);let sway;
  if(STIL&&partIdx()){
    // ?look=stil/comic/lowpoly: eigener runder Comic-Kopf statt des langen Mannequin-Kopfs (dessen Dreiecke blendet partIdx
    // aus): großer Hinterkopf, schmales Kinn, Ohren. Frisuren und Gesicht wie bei den alten Figuren (Kugelkopf, r .118).
    M(headGeo(),MT.skin,head);for(const sx of[-1,1])M(GEO.ear,MT.skin,head,sx*.112,-.004,-.004).scale.set(.55,.95,.9);
    addFace(M,head,MT.skin,em,bm,.106,.106,.116);
    sway=addHair(M,head,L.hair,hm,tm,1.03,null,matC('tie'+num%TIES.length,{color:TIES[num%TIES.length],roughness:.5}));}
  else{head.scale.set(.75,1.12,.97);
    addFace(M,head,MT.skin,em,bm,.112,.11,.118);
    // Kappe etwas größer, sonst schaut der Mannequin-Kopf oben durch
    sway=addHair(M,head,L.hair,hm,tm,1.08,head.scale,matC('tie'+num%TIES.length,{color:TIES[num%TIES.length],roughness:.5}));}
  const chest=anchor(B.spine003,0,1.30,0);
  const cz=STIL?.026:0; // weites Trikot: Nummer sitzt weiter außen
  if(!(STIL&&partIdx())){ // ?look=stil: Nummer auf dem Trikot (jerseyNum)
    const nf=new T3.Mesh(GEO.num,numMat(team,num));nf.position.set(0,0,.14+cz);nf.scale.setScalar(.72);chest.add(nf);
    const nb=new T3.Mesh(GEO.num,numMat(team,num));nb.position.set(0,.02,-.175-cz);nb.rotation.y=Math.PI;nb.scale.setScalar(.8);chest.add(nb);}
  // ?look=stil: Kinder-Proportionen, größerer Kopf (nach dem Setzen der Anker, damit Gesicht und Haare mitwachsen)
  if(STIL){B.head.scale.setScalar(HEADC.s);B.neck&&B.neck.scale.set(.96,1,.96);}
  const mx=new T3.AnimationMixer(body),A={};
  for(const k in GLB.clips){const a=mx.clipAction(GLB.clips[k]);a.play();a.timeScale=0;a.setEffectiveWeight(0);A[k]=a;}
  const arm=s=>{const k=s>0?'L':'R';return{s,up:B['upper_arm'+k],lo:B['forearm'+k],hand:B['hand'+k]};};
  toonify(root);
  const r={glb:true,root,body,B,mx,A,headA:head,chestA:chest,arms:[arm(-1),arm(1)],ph:0,cur:{},ballN:body.getObjectByName('BALL'),sway};
  // Bezug für calmNeck aus der Grundstellung (die Ruhepose des Mannequins steht anders als alle Clips)
  const nc=A.ready||A.idle;if(nc&&B.head&&B.spine003){nc.setEffectiveWeight(1);nc.time=0;mx.update(0);root.updateMatrixWorld(true);r.nref=neckRef(r).o;nc.setEffectiveWeight(0);}
  return r;
}
// Mädchen-Figur: Der Mannequin ist ein muskulöser Erwachsener. Für Mädchen einmal eine schlankere Fassung der Geometrie
// berechnen (in der Ruhepose): Punkte werden je nach Knochen-Gewicht zur Knochenachse gezogen, also schmalere Schultern,
// dünnere Ober- und Unterarme, schmalere Brust und Beine, Becken etwas breiter. Gilt auch für Trikot und Hose.
const GIRL_F={shoulder:['upper_arm',.55],upper_arm:['forearm',.66],forearm:['hand',.78],neck:['head',.8],spine003:['neck',.8],spine002:['spine003',.87],
  spine001:['spine002',.94],hips:['spine001',1.06],thigh:['shin',.9],shin:['foot',.9]};
const GC=['getX','getY','getZ','getW'];
const YOUTH_F={...GIRL_F,shoulder:['upper_arm',.77],upper_arm:['forearm',.8],forearm:['hand',.86],
  spine003:['neck',.9],spine002:['spine003',.94],hips:['spine001',1],thigh:['shin',.95]};
// Comic-Kopf: Mitte in der Ruhepose (Welt), Kopfknochen-Faktor (?look=stil) und Form wie headGeo, als Abstand zur Oberfläche
// (ungefähr Meter, > 0 = außen). Für den Übergang Hals → Kopf in youthGeo.
const HEADC={y:1.70,z:.005,s:1.16,r:.118},NECKR={rx:.043,rz:.047,z:-.03,y0:1.505,y1:1.56};
function headDist(p,C){const R=HEADC.r,S=HEADC.s,x=(p.x-C.x)/S,y=(p.y-C.y)/S,z=(p.z-C.z)/S,lo=y<0,t=Math.min(1,Math.abs(y)/(lo?R*1.06:R)),a=Math.pow(t,1.5);
  const sx=R*(lo?1-.24*a:1.04),sy=R*(lo?1.06:1),sz=R*(lo?1-.12*a:1.03)*(z>0?.95:1);return(Math.hypot(x/sx,y/sy,z/sz)-1)*R*S;}
// ?look=stil: Der Mannequin-Kopf fällt weg (partIdx). Der obere Rand des Halses endete dann 2–5 cm unter dem Comic-Kopf
// (Nacken, unter dem Kinn), der Kopf saß wie auf einem Stab. Hier wandern die Punkte am Rand (viel Kopf-Gewicht) nach oben
// bis in den Kopf und hängen danach nur noch am Kopf (bleiben auch beim Drehen drin). Die Punkte darunter folgen weich
// (Verschiebung über die Nachbarn ausgeglichen, Punkte ohne Kopf-Gewicht bleiben): Der Hals bleibt so dick, läuft aber ohne
// Zacken in den Kopf.
function neckBlend(g,o,hi,NF){const pos=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,I=g.index,n=pos.count;
  const W=new Float32Array(n),use=new Uint8Array(n),p=[],D=[],nb=new Map(),B=o.bindMatrix,Bi=o.bindMatrixInverse;
  for(let t=0;t<I.count;t++)use[I.getX(t)]=1;
  // Punkte an Nähten (gleiche Lage, eigene Normale/UV) zusammenfassen, sonst reißt der Hals dort auf
  const R=new Int32Array(n).fill(-1),key=new Map(),k3=new T3.Vector3();
  for(let i=0;i<n;i++){if(!use[i])continue;k3.fromBufferAttribute(pos,i);const k=Math.round(k3.x*2e3)+','+Math.round(k3.y*2e3)+','+Math.round(k3.z*2e3);
    if(!key.has(k))key.set(k,i);R[i]=key.get(k);}
  const top=new Uint8Array(n); // vom Kopfknochen dominiert: gehört in den Kopf
  // Hals schlanker: Der Mannequin-Hals wird oben (Kieferansatz) 15 cm breit und 16 cm tief, unter dem Comic-Kopf wirkte
  // er wie eine Halskrause. Über dem Kragen weich auf eine Ellipse um die Halsachse (NECKR) ziehen; der Kragen bleibt.
  const ni=o.skeleton.bones.findIndex(b=>b.name.replace('DEF-','')==='neck'),q0=new T3.Vector3();
  for(let i=0;i<n;i++){if(R[i]!==i)continue;let nh=0;for(let k=0;k<4;k++){const b=si[GC[k]](i);if(b===hi||b===ni)nh+=sw[GC[k]](i);}if(nh<=0)continue;
    q0.fromBufferAttribute(pos,i).applyMatrix4(B).applyMatrix4(NF.M);const ram=smooth(clamp((q0.y-NECKR.y0)/(NECKR.y1-NECKR.y0),0,1))*smooth(clamp(nh/.6,0,1));if(ram<=0)continue;
    const dx=q0.x/NECKR.rx,dz=(q0.z-NECKR.z)/NECKR.rz,e=Math.hypot(dx,dz);if(e<=.75)continue;
    const e2=.75+.25*Math.tanh((e-.75)/.25),f=1+(e2/e-1)*ram;q0.x*=f;q0.z=NECKR.z+(q0.z-NECKR.z)*f;
    q0.applyMatrix4(NF.Mi).applyMatrix4(Bi);for(let j=0;j<n;j++)if(R[j]===i)pos.setXYZ(j,q0.x,q0.y,q0.z);}
  for(let i=0;i<n;i++){if(R[i]!==i)continue;let mw=0,mb=-1;for(let k=0;k<4;k++){const w=sw[GC[k]](i),b=si[GC[k]](i);if(b===hi)W[i]+=w;if(w>mw){mw=w;mb=b;}}top[i]=mb===hi;
    if(W[i]>0){p[i]=new T3.Vector3().fromBufferAttribute(pos,i).applyMatrix4(B).applyMatrix4(NF.M);D[i]=new T3.Vector3();nb.set(i,new Set());}}
  for(let t=0;t<I.count;t+=3){const a=[R[I.getX(t)],R[I.getX(t+1)],R[I.getX(t+2)]];for(const x of a)if(nb.has(x))for(const y of a)if(y!==x)nb.get(x).add(y);}
  const T=new T3.Vector3(NF.C.x,NF.C.y-.05,NF.C.z),dv=new T3.Vector3(),q=new T3.Vector3(),e=new T3.Vector3(),fix=new Set();
  const up=new T3.Vector3(0,1,0);
  for(const [i] of nb){if(W[i]<.5&&!top[i])continue;fix.add(i);const w=W[i];
    // Abstand zur Kopfoberfläche (16 mm Rand), wenn der Punkt um u in Richtung dir läge; der Kopfknochen wächst um HEADC.s
    const out=(dir,u)=>{q.copy(p[i]).addScaledVector(dir,u);q.addScaledVector(e.copy(q).sub(NF.Ph),w*(HEADC.s-1));return headDist(q,NF.C)+.016;};
    // erst senkrecht nach oben (der Hals trifft dann steil auf den Kopf, die Kante bleibt glatt), sonst Richtung T
    const enter=(dir,max,st)=>{if(out(dir,0)<=0)return 0;for(let u=st;u<=max;u+=st)if(out(dir,u)<=0){let lo=u-st,h=u;for(let it=0;it<10;it++){const m=(lo+h)/2;if(out(dir,m)>0)lo=m;else h=m;}return h;}return -1;};
    let u=enter(up,.16,.004);if(u>=0)D[i].copy(up).multiplyScalar(u);
    else{dv.subVectors(T,p[i]);u=enter(dv,1,.02);D[i].copy(dv).multiplyScalar(u<0?1:u);}}
  // unten (wenig Kopf-Gewicht, Halsausschnitt) bleibt alles, wo es ist, sonst klafft der Kragen
  const pin=i=>W[i]<.2||p[i].y<NF.Pn.y+.03;
  for(let it=0;it<80;it++)for(const [i,N] of nb){if(fix.has(i)||pin(i))continue;e.set(0,0,0);for(const j of N)if(D[j])e.add(D[j]);D[i].copy(e).divideScalar(N.size);}
  for(let i=0;i<n;i++){const r=R[i];if(r<0||!nb.has(r))continue;q.copy(p[r]).add(D[r]).applyMatrix4(NF.Mi).applyMatrix4(Bi);pos.setXYZ(i,q.x,q.y,q.z);
    if(fix.has(r)){si.setXYZW(i,hi,0,0,0);sw.setXYZW(i,1,0,0,0);}}}
function youthGeo(girl){
  const key=(girl?'girlGeometry':'boyGeometry')+(STIL?'S':''), factors=girl?GIRL_F:YOUTH_F;
  if(GLB[key])return GLB[key];
  const gg=GLB[key]={};GLB.src.updateMatrixWorld(true);
  // ?look=stil: Punkte, die Trikot und Haut gemeinsam haben (Hals, Armausschnitt): dort liegt das Trikot an, sonst sähe man
  // die Dreieckskante als Zacken. Neuaufteilung: partIdx; Saumstreifen: Attribut hemU und stilShorts.
  const PI_=STIL?partIdx():null;

  const v=new T3.Vector3(),d=new T3.Vector3(),ab=new T3.Vector3(),pr=new T3.Vector3();
  GLB.src.traverse(o=>{if(!o.isSkinnedMesh||gg[o.geometry.uuid])return;const sk=o.skeleton,nm=sk.bones.map(b=>b.name.replace('DEF-',''));
    const P=sk.boneInverses.map(m=>new T3.Vector3().setFromMatrixPosition(m.clone().invert()));
    const spec=nm.map(n=>{const m=n.match(/^(.*?)([LR]?)$/),f=factors[m[1]];if(!f)return null;const t=nm.indexOf(f[0]+m[2]);return t<0?null:{a:P[nm.indexOf(n)],b:P[t],f:f[1]};});
    const g=o.geometry.clone(),pos=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,inv=o.bindMatrixInverse;
    // ?look=stil: Trikot und Hose stehen als weiter Stoff vom Körper ab, nach außen weg von der Körperachse (Beinachse bzw.
    // senkrechte Achse durch den Rumpf; nicht entlang der Normalen, die reißen an harten Kanten auf). Die Hose wird zum Knie
    // hin immer weiter, das Trikot unten weiter und etwas länger, damit es über den Hosenbund fällt.
    const part=STIL&&o.material&&o.material.name,nv=new T3.Vector3(),q=new T3.Vector3();
    const by=n=>{const k=nm.indexOf(n);return k<0?0:P[k].y;},hipY=by('hips'),chestY=by('spine002');
    const legs=['L','R'].map(k=>({a:P[nm.indexOf('thigh'+k)],b:P[nm.indexOf('shin'+k)],k})).filter(l=>l.a&&l.b),shins=['L','R'].map(k=>({a:P[nm.indexOf('shin'+k)],b:P[nm.indexOf('foot'+k)]})).filter(l=>l.a&&l.b),cz=(P[nm.indexOf('spine001')]||new T3.Vector3()).z;
    let edge=null,near=null;
    // ?look=stil: Übergang Hals → Comic-Kopf (neckBlend)
    const hi=PI_&&part==='skin'?nm.indexOf('head'):-1,NF=hi>=0&&{M:sk.bones[hi].matrixWorld.clone().multiply(sk.boneInverses[hi])};
    if(NF){NF.Mi=NF.M.clone().invert();NF.Ph=P[hi].clone().applyMatrix4(NF.M);NF.Pn=P[nm.indexOf('neck')].clone().applyMatrix4(NF.M);NF.C=new T3.Vector3(0,HEADC.y,HEADC.z).sub(NF.Ph).multiplyScalar(HEADC.s).add(NF.Ph);}
    if(PI_&&PI_[part])g.setIndex(PI_[part].clone());
    if(PI_&&PI_.cut[part])g.setAttribute('cut',new T3.BufferAttribute(PI_.cut[part],1));
    // Trikot liegt an Hals und Armausschnitt an (Abstand zum Schnitt, hug), sonst steht es als weiter Stoff ab
    if(part==='jersey'&&PI_)near=i=>Math.max(0,PI_.hug[i]);
    let leg=-1,legT=0;const hemU=part==='shorts'&&PI_?new Float32Array(pos.count):null; // Saumstreifen im Shader (stilShorts)
    for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(o.bindMatrix);d.set(0,0,0);
      leg=-1;
      if(part==='shorts'&&legs.length){let best=1e9,tt=0;
        for(let j=0;j<legs.length;j++){const l=legs[j];ab.subVectors(l.b,l.a);const u=clamp(pr.subVectors(v,l.a).dot(ab)/ab.lengthSq(),0,1);q.copy(l.a).addScaledVector(ab,u);const dd=v.distanceTo(q);if(dd<best){best=dd;tt=u;leg=j;nv.subVectors(v,q);}}
        // oben (Hüfte) waagerecht von der Rumpfachse weg, zum Bein hin von der Beinachse weg, bis zum Saum immer weiter
        const hip=1-smooth(clamp(tt/.25,0,1));nv.normalize().lerp(q.set(v.x,0,v.z-cz).normalize(),hip).normalize();
        const ht=PI_?PI_.hemT[leg]:SH_CUT;
        legT=tt;d.addScaledVector(nv,.018+.05*Math.pow(Math.min(tt,ht),1.15));}
      else if(part==='sock'&&shins.length){ // Socke am Bund 3 mm über der Haut
        let best=1e9,bu=0;for(const l of shins){ab.subVectors(l.b,l.a);const u=clamp(pr.subVectors(v,l.a).dot(ab)/ab.lengthSq(),0,1);q.copy(l.a).addScaledVector(ab,u);const dd=v.distanceTo(q);if(dd<best){best=dd;bu=u;nv.subVectors(v,q);}}
        // nur am Bund (dort liegt noch Haut darunter); weiter unten nicht, sonst sticht die Socke oben aus dem Schuh
        d.addScaledVector(nv.normalize(),.003*(1-smooth(clamp((bu-PI_.sockT)/.12,0,1))));}
      else if(part==='jersey'){const t=clamp((chestY-v.y)/(chestY-hipY),0,1);nv.set(v.x,0,v.z-cz).normalize();
        const f=near?.04+.96*smooth(clamp(near(i)/.11,0,1)):1;
        d.addScaledVector(nv,(.024+.03*smooth(t))*f);}
      for(let k=0;k<4;k++){const w=sw[GC[k]](i),S=w&&spec[si[GC[k]](i)];if(!S)continue;
        ab.subVectors(S.b,S.a);const t=clamp(pr.subVectors(v,S.a).dot(ab)/ab.lengthSq(),0,1);pr.copy(S.a).addScaledVector(ab,t);
        d.addScaledVector(pr.subVectors(v,pr),w*(S.f-1));}
      if(hemU)hemU[i]=leg>=0?clamp(legT/PI_.hemT[leg],0,1.3):0;
      v.add(d).applyMatrix4(inv);pos.setXYZ(i,v.x,v.y,v.z);}
    if(hemU)g.setAttribute('hemU',new T3.BufferAttribute(hemU,1));
    if(NF)neckBlend(g,o,hi,NF);
    pos.needsUpdate=true;g.computeBoundingSphere();gg[o.geometry.uuid]=g;});
  return gg;}
// ?look=stil: Hose, Trikot und Haut sauber neu aufteilen. Die Teilung nach Knochen-Gewicht (build_player.mjs) folgt den
// Dreiecken und gibt ausgefranste Kanten (Knie, Schulter, Hals), die die Comic-Linien noch betonen. Hier entscheidet die Lage:
// Bein = Anteil entlang des Oberschenkels (Hüfte 0, Knie 1, Schnitt bei SH_CUT); Rumpf = Armausschnitt vor dem Schultergelenk
// (Anteil entlang des Oberarms) und Halsausschnitt unter dem Halsansatz. Die Ringe der Glieder stehen quer zum Knochen, der
// Schnitt folgt deshalb einem Ring. Alle Teile teilen sich dieselben Punkte (gleiche Accessoren); Ergebnis: Index je Teil.
// Comic-Kopf: Kugel (r .118 wie GEO.head), unten zum Kinn schmaler, oben etwas breiter, Gesicht leicht flacher.
function headGeo(){if(GEO.cHead)return GEO.cHead;const g=new T3.SphereGeometry(.118,32,24),p=g.attributes.position;
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const t=y/.118;
    if(t<0){const k=1-.24*Math.pow(-t,1.5);x*=k;z*=1-.12*Math.pow(-t,1.5);y*=1.06;}else{x*=1.04;z*=1.03;}
    if(z>0)z*=.95;p.setXYZ(i,x,y,z);}
  g.computeVertexNormals();return GEO.cHead=g;}
const SH_CUT=.97; // Hosenlänge: Anteil des Oberschenkels (Hüfte 0, Knie 1)
function partIdx(){if(GLB.part!==undefined)return GLB.part;GLB.part=null;
  const ms={};GLB.src.traverse(o=>{if(o.isSkinnedMesh)ms[o.material.name]=o;});const S=ms.shorts,K=ms.skin,J=ms.jersey,SO=ms.sock,SH=ms.shoe;
  if(!S||!K||!J)return null;const pos=K.geometry.attributes.position;if([S,J,SO,SH].some(m=>m&&m.geometry.attributes.position!==pos))return null;
  const sk=K.skeleton,nm=sk.bones.map(b=>b.name.replace('DEF-','')),P=sk.boneInverses.map(m=>new T3.Vector3().setFromMatrixPosition(m.clone().invert()));
  const seg=(a,b)=>['L','R'].map(k=>({a:P[nm.indexOf(a+k)],b:P[nm.indexOf(b+k)]}));const legs=seg('thigh','shin'),arms=seg('upper_arm','forearm'),shins=seg('shin','foot');
  const neck=P[nm.indexOf('neck')],hipB=P[nm.indexOf('hips')],sp1=P[nm.indexOf('spine001')];if([...legs,...arms,...shins].some(l=>!l.a||!l.b)||!neck||!hipB||!sp1)return null;
  const hemY=hipB.y+(sp1.y-hipB.y)*.2; // Trikotsaum: gerade, knapp über der Hüfte (fällt über den Hosenbund)
  const si=K.geometry.attributes.skinIndex,sw=K.geometry.attributes.skinWeight,n=pos.count;
  const dom=i=>{let b=0,bw=-1;for(let k=0;k<4;k++){const w=sw[GC[k]](i);if(w>bw){bw=w;b=si[GC[k]](i);}}return nm[b];};
  const c=new T3.Vector3(),v=new T3.Vector3(),ab=new T3.Vector3();
  const along=L=>{let best=1e9,tt=0;for(const l of L){ab.subVectors(l.b,l.a);const u=v.subVectors(c,l.a).dot(ab)/ab.lengthSq();
    const q=c.distanceTo(v.copy(l.a).addScaledVector(ab,clamp(u,0,1)));if(q<best){best=q;tt=u;}}return tt;};
  const len=L=>L[0].a.distanceTo(L[0].b),lT=len(legs),lA=len(arms),lS=len(shins);
  // Socke: Schnitt in der Mitte der alten Kante (Punkte, die Socke und Haut gemeinsam haben)
  const dn=new Array(n);for(let i=0;i<n;i++)dn[i]=dom(i);
  let sockT=.62;if(SO){const ks=new Set(),ss=new Set(),I=SO.geometry.index,IK=K.geometry.index;for(let t=0;t<I.count;t++)ss.add(I.getX(t));for(let t=0;t<IK.count;t++)ks.add(IK.getX(t));
    let sum=0,m=0;for(const i of ss)if(ks.has(i)){c.fromBufferAttribute(pos,i).applyMatrix4(K.bindMatrix);sum+=along(shins);m++;}if(m)sockT=sum/m;}
  // Schuhrand ebenso (Punkte, die Schuh und Socke gemeinsam haben)
  let shoeT=.93;if(SH&&SO){const hs=new Set(),os=new Set(),I=SH.geometry.index,IO=SO.geometry.index;for(let t=0;t<I.count;t++)hs.add(I.getX(t));for(let t=0;t<IO.count;t++)os.add(IO.getX(t));
    let sum=0,m=0;for(const i of hs)if(os.has(i)){c.fromBufferAttribute(pos,i).applyMatrix4(K.bindMatrix);sum+=along(shins);m++;}if(m)shoeT=sum/m;}
  // Schnitt-Felder je Punkt (ungefähr in Metern, > 0 = innen). Der Shader verwirft Pixel mit Wert < 0: Die Kante folgt dann
  // nicht mehr den Dreiecken (Zacken), sondern verläuft glatt durch sie hindurch.
  const cut={shorts:new Float32Array(n),jersey:new Float32Array(n),sock:new Float32Array(n),shoe:new Float32Array(n)},hug=new Float32Array(n);
  for(let i=0;i<n;i++){c.fromBufferAttribute(pos,i).applyMatrix4(K.bindMatrix);const y=c.y,tl=along(legs),ta=along(arms),ts=along(shins);
    cut.shorts[i]=Math.min(hemY+.04-y,(SH_CUT-tl)*lT);
    hug[i]=Math.min(neck.y+.02-y,(-.02-ta)*lA);cut.jersey[i]=Math.min(hug[i],y-hemY);
    cut.sock[i]=(ts-sockT)*lS;cut.shoe[i]=(ts-shoeT)*lS;}
  const out={shorts:[],skin:[],jersey:[],sock:[],shoe:[]},src=[[S,'shorts'],[K,'skin'],[J,'jersey']];if(SO)src.push([SO,'sock']);if(SH&&SO)src.push([SH,'shoe']);
  for(const [m,own] of src){const I=m.geometry.index;
    for(let t=0;t<I.count;t+=3){const ids=[I.getX(t),I.getX(t+1),I.getX(t+2)],ns=ids.map(i=>dn[i]);
      if(ns.every(x=>x==='head'))continue; // eigener Comic-Kopf (headGeo) ersetzt den Mannequin-Kopf
      const any=k=>ids.some(i=>cut[k][i]>0),all=k=>ids.every(i=>cut[k][i]>0);
      // Stoff bekommt jedes Dreieck, das den Schnitt berührt; Haut alles, was nicht ganz unter Stoff liegt
      let inside=false;
      if(own==='shoe'){out.shoe.push(...ids);if(!all('shoe'))out.sock.push(...ids);continue;} // oben weggeschnitten: Socke darunter
      if(own==='sock'||own==='skin'&&SH&&SO&&ns.every(x=>/^(shin|foot|toe)/.test(x)))if(any('shoe'))out.shoe.push(...ids);
      if(own==='sock'){out.sock.push(...ids);if(!all('sock'))out.skin.push(...ids);continue;} // oben weggeschnitten: Haut darunter
      if(ns.every(x=>/^(hips|spine)/.test(x))){if(any('jersey')){out.jersey.push(...ids);inside=all('jersey');}
        if(any('shorts')){out.shorts.push(...ids);inside=inside||all('shorts');}}
      else if(ns.every(x=>/^(hips|thigh|shin)/.test(x))){if(any('shorts')){out.shorts.push(...ids);inside=all('shorts');}
        if(SO&&ns.every(x=>/^(shin|foot)/.test(x))&&any('sock')){out.sock.push(...ids);inside=inside||all('sock');}}
      else if(SO&&ns.every(x=>/^(shin|foot)/.test(x))&&any('sock')){out.sock.push(...ids);inside=all('sock');}
      else if(ns.every(x=>/^(spine|shoulder|upper_arm|neck|breast)/.test(x))&&any('jersey')){out.jersey.push(...ids);inside=all('jersey');}
      if(!inside)out.skin.push(...ids);}}
  const mk=a=>new T3.BufferAttribute(pos.count>65535?new Uint32Array(a):new Uint16Array(a),1);
  return GLB.part={hemT:[SH_CUT,SH_CUT],hug,cut,sockT,shorts:mk(out.shorts),skin:mk(out.skin),jersey:mk(out.jersey),sock:SO?mk(out.sock):null,shoe:SH&&SO?mk(out.shoe):null};}
// Stoff-Schnitt im Shader (Attribut cut aus partIdx): Pixel außerhalb verwerfen
const CUT_GLSL=sh=>{sh.vertexShader='attribute float cut;varying float vCut;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCut=cut;');
  sh.fragmentShader='varying float vCut;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vCut<0.)discard;');};
// Zwei-Knochen-IK: Handgelenk zu T (Welt), Ellbogen Richtung pole, mit Gewicht w über die Clip-Pose geblendet
function rotWorld(bone,q){const pq=bone.parent.getWorldQuaternion(_q3);bone.quaternion.premultiply(_q2.copy(pq).invert().multiply(q).multiply(pq));bone.updateMatrixWorld(true);}
// wie rotWorld, aber ohne die Kinder sofort zu aktualisieren (danach einmal updateMatrixWorld)
function rotWorldN(bone,q){const pq=bone.parent.getWorldQuaternion(_q3);bone.quaternion.premultiply(_q2.copy(pq).invert().multiply(q).multiply(pq));}
function ik2(a,T,pole,w){
  if(w<.002)return;const{up,lo,hand}=a,u0=up.quaternion.clone(),l0=lo.quaternion.clone();
  const S=up.getWorldPosition(_v1),E=lo.getWorldPosition(_v2),H=hand.getWorldPosition(_v3);
  const la=S.distanceTo(E),lb=E.distanceTo(H),d=clamp(S.distanceTo(T),Math.abs(la-lb)+.01,la+lb-.005);
  const u=_v4.subVectors(S,E),v=_v5.subVectors(H,E),th0=u.angleTo(v),th1=Math.acos(clamp((la*la+lb*lb-d*d)/(2*la*lb),-1,1));
  const n=u.clone().cross(v);if(n.lengthSq()<1e-8)n.subVectors(T,S).cross(_v4.subVectors(pole,S));
  if(n.lengthSq()>1e-10){rotWorld(lo,_q2.setFromAxisAngle(n.normalize(),th1-th0).clone());}
  hand.getWorldPosition(H);
  rotWorld(up,new T3.Quaternion().setFromUnitVectors(_v4.subVectors(H,S).normalize(),_v5.subVectors(T,S).normalize()));
  // Ellbogen zur Pole-Richtung drehen
  lo.getWorldPosition(E);const ax=_v4.subVectors(T,S).normalize(),e=_v5.subVectors(E,S),pv=new T3.Vector3().subVectors(pole,S);
  e.addScaledVector(ax,-e.dot(ax));pv.addScaledVector(ax,-pv.dot(ax));
  if(e.lengthSq()>1e-6&&pv.lengthSq()>1e-6){let ang=e.angleTo(pv);if(ax.dot(e.clone().cross(pv))<0)ang=-ang;rotWorld(up,_q2.setFromAxisAngle(ax,ang).clone());}
  if(w<.999){up.quaternion.slerpQuaternions(u0,up.quaternion.clone(),w);lo.quaternion.slerpQuaternions(l0,lo.quaternion.clone(),w);up.updateMatrixWorld(true);}
}
// Füße am Boden festhalten: Die Clips passen nie genau zum Weg der Figur (anderes Tempo, Drehen auf der Stelle,
// Hüftdrehung beim Seitwärtslaufen, Überblenden). Steht ein Fuß im Clip auf dem Boden (Knöchel unten = flach,
// sonst Fußspitze unten), merkt sich der Fuß (ox, oz) den Abstand zwischen Clip-Fuß und dem Punkt, an dem er aufgesetzt hat;
// Zwei-Knochen-IK zieht das Bein dorthin, der Fuß behält die Drehung aus dem Clip. Wird der Abstand zu groß, rutscht
// der Punkt mit (beim Laufen) bzw. macht die Figur im Stand einen kleinen Schritt (beim Drehen auf der Stelle).
// Nach dem Abheben baut sich der Abstand in einer S-Kurve ab (FOOT.rel Sekunden).
const FOOT={flat:.135,toe:.05,drag:.2,step:.13,stepT:.2,lift:.07,rel:.22};
const _fA=new T3.Vector3(),_fT=new T3.Vector3(),_fK=new T3.Vector3(),_fH=new T3.Vector3(),_fP=new T3.Vector3(),_fQ=new T3.Quaternion(),_fQ2=new T3.Quaternion();
function footIK(p,r,c,dt,s,busy){
  if(!r.legs)r.legs=['L','R'].map(k=>({k,up:r.B['thigh'+k],lo:r.B['shin'+k],hand:r.B['foot'+k],toe:r.B['toe'+k]}));
  if(!r.legs[0].up||!r.legs[0].toe)return;
  const F=c.feet||(c.feet=r.legs.map(()=>({ox:0,oz:0,m:'',lx:0,lz:0,st:-1})));
  // Sprung im Weg (neue Runde, Wiederholung): nichts festhalten
  const jump=c.fx!==undefined&&Math.hypot(p.x-c.fx,p.z-c.fz)>.6;c.fx=p.x;c.fz=p.z;
  if(jump){F.forEach(f=>{f.ox=f.oz=0;f.m='';f.st=-1;});return;}
  const calm=s<.6&&!busy&&!(p.act&&/pass|catch/.test(p.act.k));
  // Laufrichtung im Körper-Koordinatensystem (Spiel: x, z → three: x, −z), mit der Drehung der Figur
  const ca=Math.cos(r.root.rotation.y),sa=Math.sin(r.root.rotation.y),wx=p.vx||0,wz=-(p.vz||0),bx=ca*wx-sa*wz,bz=sa*wx+ca*wz,bs=Math.hypot(bx,bz);
  for(let i=0;i<2;i++){const L=r.legs[i],f=F[i],o=F[1-i];
    L.hand.getWorldPosition(_fA);L.toe.getWorldPosition(_fT);
    // Schwungbein: Der Clip bewegt den Fuß (relativ zur Figur) in Laufrichtung bzw. im Stand überhaupt merklich
    const lo=r.root.worldToLocal(_fK.copy(_fA));
    if(f.px!==undefined&&dt>0){const vx=(lo.x-f.px)/dt,vz=(lo.z-f.pz)/dt,q=1-Math.exp(-dt*30);f.vx=lerp(f.vx||0,vx,q);f.vz=lerp(f.vz||0,vz,q);}
    f.px=lo.x;f.pz=lo.z;
    const along=bs>.3?(f.vx*bx+f.vz*bz)/bs:Math.hypot(f.vx||0,f.vz||0),swing=along>(bs>.3?.45:.6);
    const flat=!swing&&_fA.y<FOOT.flat&&_fT.y<FOOT.toe,toe=!swing&&!flat&&_fT.y<FOOT.toe*.8,m=flat?'f':toe?'t':'';
    const P=flat?_fA:_fT;
    if(f.st>=0){ // kleiner Schritt: Abstand weich auf null, Fuß im Bogen
      f.st+=dt/FOOT.stepT;const u=Math.min(1,f.st),e=1-u*u*(3-2*u);f.ox=f.sx*e;f.oz=f.sz*e;
      if(u>=1){f.st=-1;f.m=m;f.lx=P.x;f.lz=P.z;f.ox=f.oz=0;}}
    else if(m){
      if(m!==f.m){f.lx=P.x+f.ox;f.lz=P.z+f.oz;f.m=m;}
      f.ox=f.lx-P.x;f.oz=f.lz-P.z;const d=Math.hypot(f.ox,f.oz);
      if(calm&&d>FOOT.step&&o.st<0&&(d>=Math.hypot(o.ox,o.oz)||!o.m)){f.st=0;f.sx=f.ox;f.sz=f.oz;}
      else if(d>FOOT.drag){const q=FOOT.drag/d;f.ox*=q;f.oz*=q;f.lx=P.x+f.ox;f.lz=P.z+f.oz;}}
    else{ // abgehoben: Abstand in einer weichen S-Kurve abbauen (sonst springt das Knie im ersten Bild nach vorn)
      if(f.m||f.rt===undefined){f.m='';f.rt=0;f.rx=f.ox;f.rz=f.oz;}
      f.rt=Math.min(1,f.rt+dt/FOOT.rel);const e=1-f.rt*f.rt*(3-2*f.rt);f.ox=f.rx*e;f.oz=f.rz*e;}
    // Schwungbein, das im Clip-Gemisch über den Boden schleift (Überblenden, flacher Seitschritt): etwas anheben
    f.h=lerp(f.h||0,swing?FOOT.lift*.8*clamp((along-.3)/1.2,0,1):0,1-Math.exp(-dt*18));
    const lift=(f.st>=0?FOOT.lift*Math.sin(Math.PI*Math.min(1,f.st)):0)+Math.max(0,f.h-Math.max(0,_fA.y-.104));
    if(Math.abs(f.ox)+Math.abs(f.oz)+lift<.002)continue;
    // Ziel des Knöchels; Knie bleibt in seiner Ebene (Pole vor dem Knie)
    L.hand.getWorldQuaternion(_fQ);
    const T=_fP.set(_fA.x+f.ox,_fA.y+lift,_fA.z+f.oz);
    L.up.getWorldPosition(_fH);L.lo.getWorldPosition(_fK);
    const pole=_fK.clone().addScaledVector(_fK.clone().sub(_fH.clone().add(_fA).multiplyScalar(.5)).normalize(),.6);
    ik2(L,T.clone(),pole,1);
    L.hand.quaternion.copy(L.lo.getWorldQuaternion(_fQ2).invert().multiply(_fQ));L.hand.updateMatrixWorld(true);}
}
// Sprunghöhe der Aktionen (wie poseP)
function actJY(p){const A=p.act;if(!A)return 0;const t=A.t;
  if(A.k==='shoot'){if(t<.14)return 0;return .34*Math.sin(Math.PI*clamp((t-.14)/.48,0,1));}
  if(A.k==='layup')return .48*Math.sin(Math.PI*clamp(t/.62,0,1));
  if(A.k==='block')return .42*Math.sin(Math.PI*clamp(t/.62,0,1));
  return 0;}
// Hals ruhig halten: Der Mixamo-Jubel wirft den Kopf in den Nacken, Korbleger und Jubel ziehen die Schultern hoch. Beim Mannequin
// zieht das die Haut vom Schulterdach bis unters Kinn (breiter Keil statt Hals), der große Comic-Kopf kippt sichtbar nach hinten.
// Deshalb nach dem Mischen der Clips: Schulter höchstens NECK.sh (rad) höher als in der Grundstellung, Gesicht höchstens NECK.up
// weiter nach oben (gegen die Brust gemessen). Nach unten schauen (Dribbeln) und Schultern nach vorn bleiben unverändert.
const NECK={sh:.1,up:.12};
function neckRef(r){const c=r.chestA.getWorldQuaternion(_q1),cu=_v1.set(0,1,0).applyQuaternion(c).clone(),o={};
  for(const s of['L','R']){const sh=r.B['shoulder'+s],ua=r.B['upper_arm'+s];if(!sh||!ua)continue;
    const d=ua.getWorldPosition(_v2).sub(sh.getWorldPosition(_v3)).normalize();o['e'+s]=Math.asin(clamp(d.dot(cu),-1,1));}
  const hf=_v2.set(0,0,1).applyQuaternion(r.headA.getWorldQuaternion(_q1));o.h=Math.asin(clamp(hf.dot(cu),-1,1));return{cu,o};}
const _nv=new T3.Vector3(),_nt=new T3.Vector3(),_nc=new T3.Vector3(),_nq=new T3.Quaternion();
// Vektor d (normiert) so drehen, dass er gegen die Achse cu höchstens den Winkel lim hat
function capElev(bone,d,cu,lim){const e=Math.asin(clamp(d.dot(cu),-1,1));if(e<=lim)return;
  _nt.copy(d).addScaledVector(cu,-d.dot(cu));if(_nt.lengthSq()<1e-8)return;_nt.normalize().multiplyScalar(Math.cos(lim)).addScaledVector(cu,Math.sin(lim));
  rotWorld(bone,_nq.setFromUnitVectors(d,_nt));}
function calmNeck(r){if(!r.nref||window.__neckOff)return;r.root.updateMatrixWorld(true);
  const cu=_nc.set(0,1,0).applyQuaternion(r.chestA.getWorldQuaternion(_q1)),R=r.nref;
  for(const s of['L','R']){const sh=r.B['shoulder'+s],ua=r.B['upper_arm'+s];if(!sh||!ua)continue;
    capElev(sh,_nv.copy(ua.getWorldPosition(_v2)).sub(sh.getWorldPosition(_v3)).normalize(),cu,R['e'+s]+NECK.sh);}
  capElev(r.B.head,_nv.set(0,0,1).applyQuaternion(r.headA.getWorldQuaternion(_q1)),cu,R.h+NECK.up);}
function poseGLB(p,dt){
  const r=p.rig,c=r.cur,k=1-Math.exp(-dt*12),def=p.team==='def';
  faceP(p,dt);
  let A=p.act;if(A){A.t+=dt;if(A.t>=A.d){p.act=null;A=null;}}
  const jy=actJY(p);p.jy=jy;r.root.position.y=jy;
  // Beine/Körper: Clips nach Tempo überblenden, gemeinsamer Schrittzyklus gegen Fußrutschen
  const s=p.spd,W={};LOCO.forEach(([n])=>W[n]=0);const has=n=>!!r.A[n];
  if(s<=0)W.idle=1;else{let i=0;while(i<LOCO.length-1&&s>LOCO[i+1][1])i++;
    if(i>=LOCO.length-1)W.sprint=1;else{const u=clamp((s-LOCO[i][1])/(LOCO[i+1][1]-LOCO[i][1]),0,1);W[LOCO[i][0]]=1-u;W[LOCO[i+1][0]]=u;}}
  // Laufrichtung relativ zur Blickrichtung (Verteidiger schauen immer zum Ball): rückwärts → Rückwärts-Clips,
  // seitlich → Hüfte in Laufrichtung drehen, Oberkörper dreht zurück
  const a=p.ang,lx=Math.cos(a),lz=Math.sin(a),fx=Math.sin(a),fz=-Math.cos(a);
  const busy=A&&/shoot|layup|block|cheer|sad/.test(A.k);
  let yawT=0,slideWeight=0;
  const sideways=p.vx*lx+p.vz*lz;
  if(s>.35&&!busy){const rel=Math.atan2(p.vx*lx+p.vz*lz,p.vx*fx+p.vz*fz),ar=Math.abs(rel);
    if(def&&has('slide')&&has('slideM')){
      const across=Math.abs(Math.sin(rel));
      slideWeight=smooth(clamp((across-.62)/.30,0,1))*smooth(clamp((s-.15)/.55,0,1))*(1-smooth(clamp((s-1.8)/1.2,0,1)));
    }
    if(has('jogBack')){if(ar>1.9)c.bm=1;else if(ar<1.6)c.bm=0;}
    yawT=clamp(c.bm?wrapA(rel-Math.PI):rel,-1,1)*clamp((s-.35)/.6,0,1);}
  else if(busy)c.bm=0;
  yawT*=1-slideWeight;
  // Am Standbein entscheidet der zurückgelegte Seitenweg über die Clip-Phase.
  c.slidePhase=((c.slidePhase||0)+dt*sideways/.64)%1;
  const phase=(c.slidePhase+1)%1;
  c.bk=lerp(c.bk||0,c.bm||0,1-Math.exp(-dt*8));
  const mv=W.walk+W.jog+W.sprint,ub=clamp((s-2.6)/1.4,0,1);
  W.jogBack=mv*c.bk*(1-ub);W.runBack=mv*c.bk*ub;W.walk*=1-c.bk;W.jog*=1-c.bk;W.sprint*=1-c.bk;
  // Verteidiger rückwärts: tief in Abwehrhaltung (eigener Clip backD), erst bei hohem Tempo aufrecht rückwärts laufen
  const bd=def&&has('backD')?1-clamp((s-1.7)/.8,0,1):0;W.backD=(W.jogBack+W.runBack)*bd;W.jogBack*=1-bd;W.runBack*=1-bd;
  // traurig und unterwegs: sadWalk statt normalem Gehen
  const sadMv=A&&A.k==='sad'&&has('sadWalk')?clamp((s-.3)/.5,0,1):0;
  if(sadMv){W.sadWalk=(W.walk+W.jog+W.sprint+W.jogBack+W.runBack)*sadMv;for(const n of['walk','jog','sprint','jogBack','runBack'])W[n]*=1-sadMv;}
  let sw=0,sl=0;for(const n of['walk','jog','sprint','jogBack','runBack','sadWalk','backD'])if(W[n]){sw+=W[n]*STRIDE[n];sl+=W[n];}
  const driving=kickComparison?.version!=='before'&&G.phase==='approach'&&ball.owner===p&&!ball.hold;
  // Beim langsamen Andribbeln mischt der Gehclip mit der Grundstellung:
  // Seine kürzeren Schritte brauchen entsprechend weniger Weg pro Zyklus.
  const stride=sl>.001?sw/sl:STRIDE.walk;
  // Weg, den die Figur in diesem Bild wirklich zurücklegt (p.spd ist geglättet und hinkt hinterher)
  const distance=driving||p.path&&dt>0?(p.travel||0):dt*s;
  r.ph=(r.ph+distance/(driving?stride*Math.max(.35,sl):stride))%1;
  // Ballführer: Dribbel-Clip (Hand passend zur Ballseite), Takt an den Ball gekoppelt
  const sb=p.dside>0?1:-1;
  const drib=(!driving||p.travel===0)&&ball.owner===p&&!ball.hold&&has('dribble')&&!(A&&/shoot|layup|pass/.test(A.k))?1-clamp((s-.6)/1.6,0,1):0;
  let cr=(def&&s<3.5&&!(p.armsUp>0)?.42:(p===Hd&&ball.owner===p&&!drib?.14:0))*(1-W.backD);
  // im Stand der ganze Dribbel-Clip, in Bewegung nur sein Oberkörper (dribbleU)
  const dmv=has('dribbleU')?clamp((s-.25)/.5,0,1):0,dF=drib*(1-dmv),dU=drib*dmv;if(A&&/shoot|layup|block|cheer/.test(A.k))cr=0;
  const air=clamp(jy/.12,0,1),cheer=A&&A.k==='cheer'&&A.t>=(A.dl||0)?1:0;
  if(cheer&&!c.ck)c.ck=CHEERS.filter(has)[(p.num+(G.round||0))%CHEERS.filter(has).length]||'dance';if(!cheer)c.ck=null;
  const idleN=has('ready')?'ready':'idle';
  const tw={idle:0,ready:0,walk:W.walk,jog:W.jog,sprint:W.sprint,jogBack:W.jogBack,runBack:W.runBack,sadWalk:W.sadWalk||0,backD:W.backD,
    crouch:cr*(1-clamp(s/1.5,0,1)),crouchFwd:cr*clamp(s/1.5,0,1)*(1-c.bk),jump:air,dance:0,cheer:0,clap:0,dribble:0,dribbleM:0};
  tw[idleN]=W.idle;if(cheer)tw[c.ck]=1;if(dF)tw[sb>0?'dribbleM':'dribble']=dF;
  const keep=(1-air)*(1-cheer);
  for(const n of['idle','ready','walk','jog','sprint','jogBack','runBack','sadWalk'])tw[n]*=(1-cr)*(1-dF)*keep;
  tw.backD*=(1-dF)*keep;tw.crouch*=(1-dF)*keep;tw.crouchFwd*=(1-dF)*keep;tw.dribble*=keep;tw.dribbleM*=keep;tw.jump*=(1-cheer);
  for(const n in tw)tw[n]*=1-slideWeight;
  tw.slide=sideways>=0?slideWeight:0;
  tw.slideM=sideways<0?slideWeight:0;
  for(const n in tw){c['w_'+n]=c['w_'+n]===undefined?tw[n]:lerp(c['w_'+n],tw[n],k);}
  let sum=0;for(const n in tw)if(r.A[n])sum+=c['w_'+n];
  c.it=(c.it||0)+dt;c.dt2=cheer?(c.dt2||0)+dt:0;
  // Aktions-Clip: schnell einblenden, nach dem Ende kurz ausblenden (letztes Bild bleibt stehen).
  // Ganzkörper ersetzt die übrigen Clips; Pass/Fangen im Laufen nur als Oberkörper (Gewicht obendrauf).
  let cl=A&&ACTC[A.k];if(cl==='layup'&&sb>0)cl='layupM';
  if(cl==='pass'&&ball.fl&&Math.hypot(ball.fl.b.x-ball.fl.a.x,ball.fl.b.z-ball.fl.a.z)>9&&(!c.la||c.la!==A))cl='passO';
  if(cl&&!has(cl))cl=null;
  // Die zuletzt sichtbare Armhaltung enthält bereits die Dribbel-IK.
  // Beim Aufnehmen des Balls von genau dieser Haltung in den Wurfclip überblenden.
  const layupClip=cl==='layup'||cl==='layupM';
  if(A!==c.la)c.layupStart=layupClip?r.arms.map(ar=>
    [ar.up,ar.lo,ar.hand].map(bone=>bone.quaternion.clone())):null;
  if(A!==c.la){c.la=A;if(cl){c.ac=(/pass|catch/.test(cl)&&s>.7)?cl+'U':cl;if(!has(c.ac))c.ac=cl;}}
  if(cl){c.at=clamp(A.t/A.d,0,1);}
  // Bei aktivem Clip das volle Gewicht bis zum Ende halten.
  c.aw=cl?Math.min(1,(c.aw||0)+dt/.06):Math.max(0,(c.aw||0)-dt/.15);
  const up=c.ac&&/U$/.test(c.ac),fa=up?0:c.aw,ua=up?Math.min(c.aw,.97):0;
  const db=((p.drib||0)/Math.PI)%3;   // Ball oben bei ganzen Zahlen; der Clip enthält drei Dribblings
  for(const n in tw){const an=r.A[n];if(!an)continue;an.setEffectiveWeight(c['w_'+n]/Math.max(sum,.001)*(1-fa));const D=an.getClip().duration;
    if(n==='slide'||n==='slideM'){an.time=(n==='slide'?phase:1-phase)*D;continue;}
    an.time=n==='idle'||n==='ready'||n==='crouch'||n==='jump'?(c.it+p.ph)%D:/dance|cheer|clap/.test(n)?c.dt2%D:/dribble/.test(n)?db*D/3:r.ph*D;}
  for(const n of ACT_ALL){const an=r.A[n];if(!an)continue;const on=n===c.ac&&c.aw>0;an.setEffectiveWeight(on?(up?ua/(1-ua):fa):0);if(on)an.time=(c.at||0)*an.getClip().duration;}
  for(const n of['dribbleU','dribbleMU']){const an=r.A[n];if(!an)continue;const w=(n==='dribbleMU')===(sb>0)?dU*keep*(1-fa)*(1-ua):0;
    c['w_'+n]=lerp(c['w_'+n]||0,Math.min(w,.9),k);an.setEffectiveWeight(c['w_'+n]/(1-c['w_'+n]));an.time=db*an.getClip().duration/3;}
  r.mx.update(0);calmNeck(r);
  // seitlich laufen: Hüfte dreht in Laufrichtung, Wirbelsäule dreht zurück, damit die Brust zum Ball zeigt
  c.hyw=lerp(c.hyw||0,yawT,1-Math.exp(-dt*10));
  if(Math.abs(c.hyw)>.01){r.root.updateMatrixWorld(true);rotWorldN(r.B.hips,_q1.setFromAxisAngle(UPV,c.hyw));
    rotWorldN(r.B.spine001,_q1.setFromAxisAngle(UPV,-c.hyw*.4));rotWorldN(r.B.spine002,_q1.setFromAxisAngle(UPV,-c.hyw*.3));rotWorldN(r.B.spine003,_q1.setFromAxisAngle(UPV,-c.hyw*.3));}
  r.root.updateMatrixWorld(true);
  footIK(p,r,c,dt,s,busy);
  // Ball in den Händen: an den Knoten BALL des Aktions-Clips, weich vom zuletzt gezeigten Platz aus
  if(r.ballN&&c.aw>0&&A&&/shoot|layup|catch/.test(A.k)&&ball.owner===p&&ball.hold&&!ball.fl){
    if(!c.ab){c.ab=0;c.b0=[BL.x,BL.y,BL.z];}c.ab=Math.min(1,c.ab+dt/.08);
    const v=r.ballN.getWorldPosition(_v1),e=smooth(c.ab)*c.aw;
    ball.x=lerp(c.b0[0],v.x,e);ball.y=lerp(c.b0[1],v.y,e);ball.z=lerp(c.b0[2],-v.z,e);ballMesh.position.set(ball.x,ball.y,-ball.z);}
  else c.ab=0;
  // Arme: Ziele in Spielkoordinaten (x, y, z) relativ zur Blickrichtung
  const loc=(sx,y,f)=>[p.x+lx*sx+fx*f,y,p.z+lz*sx+fz*f];
  const T=[null,null];let track=false;
  const onBall=sd=>[ball.x+lx*sd*.16-fx*.03,ball.y-.02,ball.z+lz*sd*.16-fz*.03];
  if(A&&A.k==='block'||p.armsUp>0&&(def||!has('shot'))){T[0]=loc(-.24,2.2+jy,.18);T[1]=loc(.24,2.2+jy,.18);}
  else if(A&&A.k==='shoot'){if(ball.owner===p){track=true;T[sb>0?1:0]=[ball.x-fx*.08,ball.y-.1,ball.z-fz*.08];T[sb>0?0:1]=onBall(-sb);}
    else{T[sb>0?1:0]=loc(sb*.14,2.25+jy,.38);T[sb>0?0:1]=loc(-sb*.22,1.85+jy,.25);}}
  else if(A&&A.k==='layup'){T[sb>0?1:0]=ball.owner===p?(track=true,[ball.x,ball.y-.1,ball.z]):loc(sb*.14,2.3+jy,.3);}
  else if(A&&A.k==='pass'&&ball.owner!==p){T[0]=loc(-.16,1.3,.62);T[1]=loc(.16,1.3,.62);}
  else if(p.targetLook&&ball.fl&&!A){T[0]=loc(-.22,1.32,.52);T[1]=loc(.22,1.32,.52);}
  else if(A&&A.k==='catch'){if(kickComparison?.version!=='before'&&ball.owner===p){track=true;T[0]=onBall(-1);T[1]=onBall(1);}
    else{T[0]=loc(-.15,1.22,.45);T[1]=loc(.15,1.22,.45);}}
  else if(A&&(A.k==='cheer'||A.k==='sad')){}
  else if(ball.owner===p&&ball.hold){track=true;T[0]=onBall(-1);T[1]=onBall(1);}
  else if(ball.owner===p){track=true;const i=sb>0?1:0;T[i]=[ball.x,Math.max(ball.y+.19,.72),ball.z];if(drib<.5)T[1-i]=loc(-sb*.34,1.05,.32);}
  else if(def&&s<3.5){T[0]=loc(-.62,1.12,.22);T[1]=loc(.62,1.12,.22);}
  else if(!def&&s<1.2&&p!==Hd){T[0]=loc(-.2,1.2,.36);T[1]=loc(.2,1.2,.36);}
  for(let i=0;i<2;i++){const ar=r.arms[i],sd=ar.s,t=T[i],wk='aw'+i,tk='at'+i;
    c[wk]=lerp(c[wk]||0,t?1:0,1-Math.exp(-dt*(t?14:6)));
    if(t){const kk=track?1:1-Math.exp(-dt*16);if(!c[tk])c[tk]=t.slice();else for(let j=0;j<3;j++)c[tk][j]=lerp(c[tk][j],t[j],kk);}
    if(layupClip){
      const blend=smooth(clamp(A.t/.14,0,1));
      if(blend<1)[ar.up,ar.lo,ar.hand].forEach((bone,j)=>
        bone.quaternion.slerp(c.layupStart[i][j],1-blend));
      continue;
    }
    const iw=c[wk]*(1-(c.aw||0));if(!c[tk]||iw<.002)continue;
    const tt=c[tk],pl=loc(sd*.7,.6,-.35);
    ik2(ar,_v1.set(tt[0],tt[1],-tt[2]).clone(),new T3.Vector3(pl[0],pl[1]+jy,-pl[2]),iw);}
  // Kopf zum Ball, traurig: Kopf und Oberkörper nach vorn
  const want=ball.owner===p?0:clamp(wrapA(angTo(ball.x-p.x,ball.z-p.z)-p.ang),-.9,.9);c.hy=c.hy===undefined?want:lerp(c.hy,want,k*.6);
  rotWorld(r.B.head,_q1.setFromAxisAngle(UPV,c.hy).clone());
  const sad=A&&A.k==='sad'?1:0;c.sad=lerp(c.sad||0,sad,k);
  if(c.sad>.01){const ax=new T3.Vector3(lx,0,-lz);rotWorld(r.B.spine003,_q1.setFromAxisAngle(ax,.35*c.sad).clone());rotWorld(r.B.head,_q1.setFromAxisAngle(ax,.45*c.sad).clone());}
}
// Markierung des eigenen Spielers: gelber Ring mit dunklem Rand (auch auf hellem Parkett gut sichtbar),
// im Entscheidungsmoment zusätzlich eine Welle nach außen. Dazu das Schild „DU“ über dem Kopf (#meTag, posMe).
const ring=new T3.Group();ring.position.y=.012;scene.add(ring);
const ringM=(r0,r1,col,op,ro)=>{const m=new T3.Mesh(new T3.RingGeometry(r0,r1,56).rotateX(-Math.PI/2),new T3.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false}));m.renderOrder=ro;ring.add(m);return m;};
const ringEdge=ringM(.45,.73,0x000000,.32,2),ringIn=ringM(.5,.68,0xffd23d,1,3),ringWave=ringM(.6,.68,0xffd23d,0,3);ringWave.position.y=.002;
function updRing(){ring.position.x=Hd.x;ring.position.z=-Hd.z;const dec=G.phase==='decide';
  ringIn.material.opacity=dec?.8+.2*Math.sin(clock*8):1;
  const w=dec?(clock*.9)%1:1;ringWave.scale.setScalar(1+w*.9);ringWave.material.opacity=dec?.75*(1-w):0;}
// ================= Kontaktschatten =================
// Weiche Flecken unter Körper und Füßen. Billig und auch dort sichtbar, wo die Sonne keine Schatten wirft
// (?lite, schwache Geräte über perfCheck). Fuß angehoben oder Sprung → Fleck kleiner und heller.
const blobTex=canvasTex(64,64,(g,w)=>{const r=g.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);r.addColorStop(0,'#fff');r.addColorStop(.45,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,w);});
blobTex.encoding=T3.LinearEncoding;
const blobGeo=new T3.PlaneGeometry(1,1).rotateX(-Math.PI/2);
function blob(){const m=new T3.Mesh(blobGeo,new T3.MeshBasicMaterial({color:0x000000,alphaMap:blobTex,transparent:true,depthWrite:false}));m.renderOrder=1;m.position.y=.006;scene.add(m);return m;}
const _bh=new T3.Vector3(),_bt=new T3.Vector3();
function updBlobs(p){const r=p.rig,bl=p.blobs,vis=r.root.visible,sh=sun.castShadow;
  bl.forEach(b=>b.visible=vis);if(!vis)return;
  const h=p.jy||0,fade=1-clamp(h/.6,0,.75),b=bl[0];
  b.position.set(p.x,.005,-p.z);b.rotation.y=p.ang;b.scale.set(.78*(1+h),1,.6*(1+h));b.material.opacity=(sh?.2:.34)*fade;
  if(!r.glb)r.root.updateMatrixWorld(true);
  for(let i=0;i<2;i++){let lift;
    if(r.glb){const k=r.arms[i].s>0?'L':'R';r.B['foot'+k].getWorldPosition(_bh);r.B['toe'+k].getWorldPosition(_bt);lift=Math.max(0,Math.min(_bh.y-.1,_bt.y-.015));}
    else{r.kn[i].localToWorld(_bh.set(0,-.43,-.07));r.kn[i].localToWorld(_bt.set(0,-.43,.17));lift=Math.max(0,Math.min(_bh.y,_bt.y)-.03);}
    const f=bl[1+i],g=1+lift*1.6;f.position.set((_bh.x+_bt.x)/2,.006,(_bh.z+_bt.z)/2);f.rotation.y=Math.atan2(_bt.x-_bh.x,_bt.z-_bh.z);
    f.scale.set(.17*g,1,.36*g);f.material.opacity=(sh?.42:.58)*clamp(1-lift/.25,0,1);}
}

// ================= Ball =================
const ballTex=canvasTex(256,128,(g,w,h)=>{g.fillStyle='#e0661c';g.fillRect(0,0,w,h);for(let i=0;i<1400;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.12})`;g.fillRect(Math.random()*w,Math.random()*h,2,2);}
  g.strokeStyle='#1d0c02';g.lineWidth=5;g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.moveTo(w/4,0);g.lineTo(w/4,h);g.moveTo(w*3/4,0);g.lineTo(w*3/4,h);g.stroke();
  g.beginPath();for(let x=0;x<=w;x+=4)g.lineTo(x,h/2+Math.sin(x/w*Math.PI*2)*h*.38);g.stroke();});
const ballMesh=new T3.Mesh(new T3.SphereGeometry(.122,28,20),new T3.MeshStandardMaterial({map:ballTex,roughness:.65}));ballMesh.castShadow=true;scene.add(ballMesh);
const ball={x:0,y:1,z:0,owner:null,hold:false,fl:null,free:null,spin:0};

