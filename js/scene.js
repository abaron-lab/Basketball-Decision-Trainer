// Renderer, Szene, Licht, Spielfeld, Halle (Tribünen, Publikum, Banden, Lichter) und Korb mit Netz.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Renderer, Szene =================
const cv=$('c');
const LITE=/[?&]lite\b/.test(location.search);
// Figuren-Look: Standard ist der dezente Comic-Look (neue Figuren + Toon-Licht + feine Linien, COMIC). ?look=stil = nur die neuen
// Figuren ohne Comic-Darstellung; ?look=klassisch = der alte Look (Mannequin-Figuren, PBR, Bloom).
const LOOK=(new URLSearchParams(location.search).get('look')||'comic').toLowerCase(),COMIC=LOOK==='comic',STIL=COMIC||LOOK==='stil';
// Handy/Tablet: weniger Pixel (DPR höchstens 1,5), kleinere Schattenkarte, keine Tiefenunschärfe
const MOBILE=(()=>{try{return matchMedia('(pointer:coarse)').matches;}catch(e){return false;}})();
const renderer=new T3.WebGLRenderer({canvas:cv,antialias:!LITE,powerPreference:'high-performance'});
// Pixel-Budget: Große Retina-Fenster (z. B. 2230×1220 bei DPR 2 = 10,9 Mio. Pixel) schafft die GPU mit Bildeffekten nicht in
// 16 ms, die Wurfkamera ruckelte. Höchstens PX_MAX echte Pixel; PR_CAP ist die Obergrenze (perfAdapt senkt sie). fitPR() in computeFit().
let PR_CAP=LITE?1:Math.min(MOBILE?1.5:2,window.devicePixelRatio||1);const PX_MAX=4.2e6;
renderer.setPixelRatio(PR_CAP);
function fitPR(){const pr=Math.max(1,Math.min(PR_CAP,Math.sqrt(PX_MAX/Math.max(1,W*H))));if(Math.abs(pr-renderer.getPixelRatio())>.01)renderer.setPixelRatio(pr);}
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T3.PCFSoftShadowMap;
renderer.outputEncoding=T3.sRGBEncoding;renderer.toneMapping=T3.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new T3.Scene();
scene.background=new T3.Color(0x05070d);scene.fog=new T3.Fog(0x05070d,34,80);
const cam=new T3.PerspectiveCamera(50,1,.1,200);
let W=innerWidth,H=cv.clientHeight||innerHeight;

// Licht
scene.add(new T3.HemisphereLight(0xcfdcff,0x3b2a1a,.62));
const sun=new T3.DirectionalLight(0xfff4e0,1.25);
sun.position.copy(V(5,24,-4));sun.target.position.copy(V(0,0,-9));scene.add(sun,sun.target);
sun.castShadow=!LITE&&!COMIC; // Comic: keine Schattenkarte, die weichen Flecken unter den Füßen reichen
sun.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);
Object.assign(sun.shadow.camera,{left:-15,right:15,top:22,bottom:-22,near:2,far:70});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;
const spots=[];[[-6,-3],[6,-3],[0,-16]].forEach(([x,z])=>{const s=new T3.SpotLight(0xffe7c4,.55,40,.7,.6,1.2);s.position.copy(V(x,16,z));s.target.position.copy(V(x*.5,0,z+2));scene.add(s,s.target);spots.push(s);});
{const rim=new T3.DirectionalLight(0xbfd4ff,STIL?.95:.45);rim.position.copy(V(0,7,9));rim.target.position.copy(V(0,1,-6));scene.add(rim,rim.target);}

// ================= Spielfeld =================
const CLUB_WHITE='#f5f3ee',CLUB_ORANGE='#ff6600',CLUB_NAVY='#19274a',COURT_ZONE='#77818a';
const BASE=1.575,HW=7.5,R3=6.75,TC=6.6,TA=Math.asin(TC/R3);
const XMIN=-9.5,XMAX=9.5,ZMIN=-27.8,ZMAX=3.4,PPM=56;
function courtTexture(featured=false){
  const w=Math.round((XMAX-XMIN)*PPM),h=Math.round((ZMAX-ZMIN)*PPM);
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  const X=x=>(x-XMIN)*PPM,Y=z=>(ZMAX-z)*PPM,r=mulberry(11);
  g.fillStyle='#8a8a80';g.fillRect(0,0,w,h);
  const x0=X(-HW),x1=X(HW),y0=Y(BASE),y1=Y(-26.425),pw=.19*PPM;
  for(let x=x0;x<x1;x+=pw){let y=y0+r()*-60;while(y<y1){const len=(1.4+r()*2.6)*PPM;const yy=Math.max(y,y0),hh=Math.min(y+len,y1)-yy;
    if(hh>0){g.fillStyle=`hsl(${28+r()*5},${52+r()*10}%,${57+r()*9}%)`;g.fillRect(x,yy,pw-1,hh-1);}y+=len;}}
  const sh=g.createLinearGradient(0,y0,0,y1);sh.addColorStop(0,'rgba(255,240,220,.10)');sh.addColorStop(.5,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(255,240,220,.08)');g.fillStyle=sh;g.fillRect(x0,y0,x1-x0,y1-y0);
  if(featured){
    // Warmes Parkett im Licht der Oberlichter, mit kühlem Rand außerhalb des Felds.
    g.fillStyle='#183845';
    g.fillRect(0,0,x0,h);g.fillRect(x1,0,w-x1,h);
    g.fillRect(x0,0,x1-x0,y0);g.fillRect(x0,y1,x1-x0,h-y1);
    g.save();g.beginPath();g.rect(x0,y0,x1-x0,y1-y0);g.clip();
    for(let z=0;z>-28;z-=5){
      const light=g.createLinearGradient(0,Y(z),PPM,Y(z-2));
      light.addColorStop(0,'rgba(255,237,191,0)');
      light.addColorStop(.5,'rgba(255,237,191,.25)');
      light.addColorStop(1,'rgba(255,237,191,0)');
      g.fillStyle=light;g.fillRect(x0,Y(z+6),x1-x0,16*PPM);
    }
    g.restore();
  }
  const half=(hz,d)=>{const bz=hz+BASE*d;
    g.beginPath();g.moveTo(X(-TC),Y(bz));for(let i=0;i<=48;i++){const a=lerp(-TA,TA,i/48);g.lineTo(X(Math.sin(a)*R3),Y(hz-d*Math.cos(a)*R3));}g.lineTo(X(TC),Y(bz));g.closePath();
    g.fillStyle='rgba(150,80,25,.18)';g.fill();
    g.fillStyle=featured?'rgba(17,75,83,.86)':COURT_ZONE;g.fillRect(X(-2.45),Math.min(Y(bz),Y(bz-5.8*d)),4.9*PPM,5.8*PPM);
    g.strokeStyle='#fff';g.lineWidth=.05*PPM;
    g.beginPath();g.moveTo(X(-TC),Y(bz));for(let i=0;i<=48;i++){const a=lerp(-TA,TA,i/48);g.lineTo(X(Math.sin(a)*R3),Y(hz-d*Math.cos(a)*R3));}g.lineTo(X(TC),Y(bz));g.stroke();
    g.strokeRect(X(-2.45),Math.min(Y(bz),Y(bz-5.8*d)),4.9*PPM,5.8*PPM);
    const fz=bz-5.8*d;g.beginPath();g.arc(X(0),Y(fz),1.8*PPM,0,Math.PI*2);g.stroke();
    g.beginPath();g.arc(X(0),Y(hz),1.25*PPM,d>0?Math.PI:0,d>0?Math.PI*2:Math.PI);g.stroke();
    for(const s of[-1,1])for(const k of[1.75,2.85,3.7,4.55])g.fillRect(X(s*2.45)-(s>0?0:.1*PPM),Y(bz-k*d)-2,.1*PPM,4);};
  half(0,1);half(-24.85,-1);
  g.strokeStyle='#fff';g.lineWidth=.05*PPM;g.strokeRect(x0,y0,x1-x0,y1-y0);
  g.beginPath();g.moveTo(x0,Y(-12.425));g.lineTo(x1,Y(-12.425));g.stroke();
  g.fillStyle='rgba(255,122,47,.85)';g.beginPath();g.arc(X(0),Y(-12.425),1.8*PPM,0,Math.PI*2);g.fill();g.stroke();
  g.fillStyle='#fff';g.font=`900 ${.95*PPM}px Nunito,Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('PG',X(0),Y(-12.425));
  g.save();g.font=`900 ${.55*PPM}px Arial,sans-serif`;g.fillStyle='rgba(255,255,255,.75)';
  g.translate(X(-8.5),Y(-6));g.rotate(-Math.PI/2);g.fillText('BASKETBALL IQ TRAINER',0,0);g.restore();
  g.save();g.font=`900 ${.55*PPM}px Arial,sans-serif`;g.fillStyle='rgba(255,255,255,.75)';
  g.translate(X(8.5),Y(-6));g.rotate(Math.PI/2);g.fillText('BASKETBALL IQ TRAINER',0,0);g.restore();
  const t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
const trainingFloor=courtTexture(true);
let comparisonFloor;
// ?look=stil: matterer Boden, sonst spiegelt sich ein Hallenlicht als großer weißer Fleck mitten im Bild (Bloom)
const floorMaterial=new T3.MeshStandardMaterial({map:trainingFloor,roughness:STIL?.48:.26,metalness:.05,envMapIntensity:1.1});
{const m=new T3.Mesh(new T3.PlaneGeometry(XMAX-XMIN,ZMAX-ZMIN),floorMaterial);
  m.rotation.x=-Math.PI/2;m.position.copy(V((XMIN+XMAX)/2,0,(ZMIN+ZMAX)/2));m.receiveShadow=true;scene.add(m);
  const f=new T3.Mesh(new T3.PlaneGeometry(90,110),new T3.MeshStandardMaterial({color:0x10141f,roughness:.9}));f.rotation.x=-Math.PI/2;f.position.copy(V(0,-.04,-10));f.receiveShadow=true;scene.add(f);}

// ================= Halle =================
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;t.userData.canvas=c;return t;}
{const walls=new T3.Mesh(new T3.BoxGeometry(80,34,110),new T3.MeshStandardMaterial({color:0x090c16,side:T3.BackSide,roughness:1}));walls.position.copy(V(0,15,-10));scene.add(walls);}
// Tribünen + Publikum
const fans=[];
const seatMat=new T3.MeshStandardMaterial({color:0x1a2340,roughness:.85});
function stand(axis,from,to,startD,sign){ // axis 'z': Reihe läuft entlang x, hinter Grundlinie; 'x': Seitentribüne
  const rows=11;
  for(let i=0;i<rows;i++){const h=.5+i*.55,d=startD+i*.9;
    let geo,pos;
    if(axis==='z'){geo=new T3.BoxGeometry(to-from,h,.9);pos=V((from+to)/2,h/2,d+.45);}
    else{geo=new T3.BoxGeometry(.9,h,to-from);pos=V(sign*(d+.45),h/2,(from+to)/2);}
    const m=new T3.Mesh(geo,seatMat);m.position.copy(pos);m.receiveShadow=true;scene.add(m);
    for(let s=from+.3;s<to-.3;s+=.62){if(Math.random()<.18)continue;const j=(Math.random()-.5)*.15;
      if(axis==='z')fans.push({x:s+j,y:h,z:d+.45});else fans.push({x:sign*(d+.45),y:h,z:s+j});}}
}
stand('z',-17,17,5.2,1);stand('x',-31,4.8,10.4,-1);stand('x',-31,4.8,10.4,1);
const FANC=[0x2f6fe4,0x2f6fe4,0x2f6fe4,0xe2453b,0xffffff,0xffc83d,0x1b1b1b,0x4caf50,0x9c27b0,0xff7a2f,0x87a3c9];
const SKINC=[0x8d5524,0xc68642,0xe0ac69,0xf1c27d,0x5c3a1e,0xffdbac];
function mergeGeo(list){let pos=[],nor=[],idx=[],off=0;
  list.forEach(([g,m])=>{const q=g.clone().applyMatrix4(m),p=q.attributes.position.array,n=q.attributes.normal.array;pos.push(...p);nor.push(...n);
    (q.index?Array.from(q.index.array):[...Array(p.length/3).keys()]).forEach(i=>idx.push(i+off));off+=p.length/3;});
  const o=new T3.BufferGeometry();o.setAttribute('position',new T3.Float32BufferAttribute(pos,3));o.setAttribute('normal',new T3.Float32BufferAttribute(nor,3));o.setIndex(idx);return o;}
const armGeo=(()=>{const c=new T3.CapsuleGeometry(.045,.3,3,6),M4=()=>new T3.Matrix4();
  return mergeGeo([-1,1].map(s=>[c,M4().makeTranslation(s*.13,0,0).multiply(M4().makeRotationZ(-s*.38)).multiply(M4().makeTranslation(0,.2,0))]));})();
const fanMat=new T3.MeshStandardMaterial({roughness:.8});
const fanBody=new T3.InstancedMesh(new T3.CapsuleGeometry(.17,.28,3,8),fanMat,fans.length);
const fanArms=new T3.InstancedMesh(armGeo,fanMat,fans.length);
const fanHead=new T3.InstancedMesh(new T3.SphereGeometry(.11,8,6),new T3.MeshStandardMaterial({roughness:.7}),fans.length);
{const col=new T3.Color();fans.forEach((f,i)=>{f.ph=Math.random()*6;f.sp=1+Math.random()*2;f.fan=Math.random();f.ang=Math.atan2(f.x,f.z+8);
  const c=FANC[(Math.random()*FANC.length)|0];fanBody.setColorAt(i,col.setHex(c));fanArms.setColorAt(i,col.setHex(SKINC[(Math.random()*SKINC.length)|0]));fanHead.setColorAt(i,col.setHex(SKINC[(Math.random()*SKINC.length)|0]));});
  scene.add(fanBody,fanArms,fanHead);}
// Schilder im Publikum
const signs=[];
{const TX=[['SUPER!','#ffc83d','#1a1300'],['LOS!','#2f6fe4','#fff'],['IQ!','#ffffff','#1f5fe0'],['TOP!','#ff7a2f','#fff'],['DEFENSE','#e2453b','#fff'],['GO TEAM','#2ecc71','#fff'],['★★★','#1b2a55','#ffc83d']];
  const mats=TX.map(([t,bg,fg])=>new T3.MeshStandardMaterial({map:canvasTex(256,150,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=10;g.strokeRect(5,5,w-10,h-10);
    g.fillStyle=fg;g.font=`900 ${t.length>5?52:78}px Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(t,w/2,h/2+4);}),roughness:.7,emissive:0xffffff,emissiveIntensity:.08,side:T3.DoubleSide}));
  const geo=new T3.PlaneGeometry(.78,.46),pool=fans.filter(f=>f.y<5.6),pk=mulberry(5);
  for(let i=0;i<22;i++){const f=pool[(pk()*pool.length)|0];if(f.sign)continue;f.sign=1;const m=new T3.Mesh(geo,mats[i%mats.length]);m.position.set(f.x,f.y+1.1,-f.z);m.lookAt(0,f.y+.6,6);scene.add(m);signs.push({m,f,ph:pk()*6});}}
const tmpM=new T3.Matrix4(),tmpS=new T3.Matrix4();
function updFans(t,ex,dt){const wv=t-G.wave,wOn=wv>=0&&wv<3.4,w=-3.3+wv*2.2;
  fans.forEach((f,i)=>{let b=Math.max(0,Math.sin(t*f.sp*(1+ex*1.6)+f.ph))*(.03+ex*.3*(.4+f.fan)),arms=ex*f.fan>.32?Math.min(1,ex*1.6):f.fan>.93?.35+.2*Math.sin(t*9+f.ph):0;
    if(wOn){const d=Math.abs(f.ang-w);if(d<.45){const k=1-d/.45;b+=.32*k;arms=Math.max(arms,k);}}
    tmpM.makeTranslation(f.x,f.y+.42+b,-f.z);fanBody.setMatrixAt(i,tmpM);tmpM.makeTranslation(f.x,f.y+.78+b,-f.z);fanHead.setMatrixAt(i,tmpM);
    tmpM.makeTranslation(f.x,f.y+.6+b,-f.z).multiply(tmpS.makeScale(1,Math.max(.02,arms),1));fanArms.setMatrixAt(i,tmpM);f.b=b;});
  fanBody.instanceMatrix.needsUpdate=true;fanHead.instanceMatrix.needsUpdate=true;fanArms.instanceMatrix.needsUpdate=true;
  signs.forEach(s=>{const up=ex>.25?.35:0;s.m.position.y=s.f.y+1.0+(s.f.b||0)+up+Math.sin(t*(2+ex*6)+s.ph)*(.03+ex*.08);s.m.rotation.z=Math.sin(t*1.7+s.ph)*(.05+ex*.2);});}
// LED-Banden
const ledTex=canvasTex(4096,96,(g,w,h)=>{g.fillStyle='#a2aaa0';g.fillRect(0,0,w,h);
  g.fillStyle='#77867b';g.fillRect(0,0,w,4);
  g.font='900 50px Arial,sans-serif';g.textBaseline='middle';const items=['BASKETBALL IQ TRAINER','LIES DIE VERTEIDIGUNG','WER HILFT, LÄSST JEMANDEN FREI'];
  const tw=items.reduce((a,s)=>a+g.measureText(s).width,0),gap=(w-tw)/items.length;let x=gap/2;
  items.forEach(s=>{g.fillStyle='#283532';g.fillText(s,x,h/2+3);x+=g.measureText(s).width+gap;});});
ledTex.wrapS=T3.RepeatWrapping;ledTex.repeat.set(1,1);
const ledMat=new T3.MeshStandardMaterial({map:ledTex,emissive:0xffffff,emissiveMap:ledTex,emissiveIntensity:.12,roughness:1});
[[V(0,.45,4.2),new T3.BoxGeometry(19,.9,.15)],[V(-9.4,.45,-11),new T3.BoxGeometry(.15,.9,30)],[V(9.4,.45,-11),new T3.BoxGeometry(.15,.9,30)]].forEach(([p,g])=>{const m=new T3.Mesh(g,ledMat);m.position.copy(p);scene.add(m);});
// Videowand
const vbTex=canvasTex(1024,440,()=>{});
function drawBoard(){const c=vbTex.userData.canvas,g=c.getContext('2d'),w=c.width,h=c.height;
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0a1636');gr.addColorStop(1,'#050a1c');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.textAlign='center';g.fillStyle='#ff8a3d';g.font='900 64px Arial,sans-serif';g.fillText('BASKETBALL IQ TRAINER',w/2,92);
  g.fillStyle='#fff';g.font='900 150px Arial,sans-serif';g.fillText(String(G.score),w/2,268);
  g.fillStyle='#9fb6ff';g.font='900 46px Arial,sans-serif';g.fillText(G.phase==='menu'?'BEREIT?':`${POS[G.pos].short.toUpperCase()}  ·  ${G.mode===5?'5 GEGEN 5':'4 GEGEN 4'}  ·  SPIELZUG ${Math.max(1,Math.min(G.round,G.rounds))}/${G.rounds}  ·  SERIE ${G.streak}`,w/2,370);
  vbTex.needsUpdate=true;}
{const fr=new T3.Mesh(new T3.BoxGeometry(9.4,4.3,.3),new T3.MeshStandardMaterial({color:0x111111,roughness:.5}));fr.position.copy(V(0,10.5,14.6));scene.add(fr);
  const sc=new T3.Mesh(new T3.PlaneGeometry(9,3.9),new T3.MeshBasicMaterial({map:vbTex,toneMapped:false}));sc.position.copy(V(0,10.5,14.44));scene.add(sc);}
// Deckenlichter
{const gt=canvasTex(128,128,(g,w)=>{const r=g.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,236,200,.55)');r.addColorStop(1,'rgba(255,220,160,0)');g.fillStyle=r;g.fillRect(0,0,w,w);});
  const sm=new T3.SpriteMaterial({map:gt,blending:T3.AdditiveBlending,depthWrite:false,transparent:true,fog:false,toneMapped:false});
  const fx=new T3.MeshBasicMaterial({color:0xfff6e0,toneMapped:false}); // nicht tonemappen: hell genug für den Bloom
  for(const x of[-8,-2.7,2.7,8])for(const z of[2,-6,-14,-22]){const s=new T3.Sprite(sm);s.scale.set(3.2,3.2,1);s.position.copy(V(x,16,z));scene.add(s);
    const b=new T3.Mesh(new T3.BoxGeometry(1.2,.2,.6),fx);b.position.copy(V(x,16.2,z));scene.add(b);}}

// Wimpel, LED-Ring oben, Lichtkegel, Fotoblitze
{const BN=[['FAIR','PLAY'],['TEAM','GEIST'],['LIES','DAS','SPIEL'],['IQ','100']];
  BN.forEach((ln,i)=>{const t=canvasTex(256,480,(g,w,h)=>{g.beginPath();g.moveTo(0,0);g.lineTo(w,0);g.lineTo(w,h);g.lineTo(w/2,h-70);g.lineTo(0,h);g.closePath();
      const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,i%2?'#c2410c':'#173a8a');gr.addColorStop(1,i%2?'#7c2d12':'#0b1f55');g.fillStyle=gr;g.fill();
      g.fillStyle='#ffc83d';g.fillRect(0,18,w,10);g.fillRect(0,h-130,w,8);g.fillStyle='#fff';g.font='900 64px Arial,sans-serif';g.textAlign='center';
      ln.forEach((l,j)=>g.fillText(l,w/2,120+j*76-(ln.length-2)*30));});
    const m=new T3.Mesh(new T3.PlaneGeometry(1.5,2.8),new T3.MeshStandardMaterial({map:t,alphaTest:.5,side:T3.DoubleSide,roughness:.8,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.25}));
    const x=[-8.4,-6.2,6.2,8.4][i];m.position.copy(V(x,12.6,14.1));m.rotation.y=Math.PI;scene.add(m);});
  [[V(0,6.7,15.3),new T3.BoxGeometry(34,.7,.15)],[V(-20.6,6.7,-13),new T3.BoxGeometry(.15,.7,36)],[V(20.6,6.7,-13),new T3.BoxGeometry(.15,.7,36)]].forEach(([p,g])=>{const m=new T3.Mesh(g,ledMat);m.position.copy(p);scene.add(m);});}
const beams=[];
{const bt=canvasTex(8,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,240,210,.9)');gr.addColorStop(1,'rgba(255,240,210,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  const geo=new T3.CylinderGeometry(.35,2.6,15,24,1,true);geo.translate(0,-7.5,0);
  [[-8,2],[8,2],[-8,-14],[8,-14],[-2.7,-22],[2.7,-22]].forEach(([x,z],i)=>{const m=new T3.Mesh(geo,new T3.MeshBasicMaterial({map:bt,color:0xffe6b8,transparent:true,opacity:.05,blending:T3.AdditiveBlending,depthWrite:false,side:T3.DoubleSide,fog:false}));
    m.position.copy(V(x,16,z));scene.add(m);beams.push({m,x,ph:i*1.3});});}
const flashes=[];
{const ft=canvasTex(64,64,(g,w)=>{const r=g.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.2,'rgba(220,235,255,.8)');r.addColorStop(1,'rgba(200,220,255,0)');g.fillStyle=r;g.fillRect(0,0,w,w);});
  for(let i=0;i<24;i++){const sp=new T3.Sprite(new T3.SpriteMaterial({map:ft,blending:T3.AdditiveBlending,depthWrite:false,transparent:true,fog:false,toneMapped:false}));sp.visible=false;sp.scale.setScalar(.9);scene.add(sp);flashes.push({sp,t:0});}}
let flashT=0,showT=0;
function camFlash(){flashT=1.6;showT=2.2;}
function updHall(dt,rdt){
  if(flashT>0){flashT-=dt;if(Math.random()<.55){const fl=flashes.find(q=>!q.sp.visible);if(fl){const f=fans[(Math.random()*fans.length)|0];fl.sp.position.set(f.x,f.y+1.1,-f.z);fl.sp.visible=true;fl.t=.07;}}}
  flashes.forEach(q=>{if(q.sp.visible){q.t-=rdt;if(q.t<=0)q.sp.visible=false;}});
  showT=Math.max(0,showT-dt);const on=Math.min(1,showT*1.5);
  beams.forEach(b=>{b.m.material.opacity=.045+on*.11;b.m.material.color.setHSL(.11-on*.04*Math.sin(gclock*3+b.ph),.9,.5+.25*(1-on));
    b.m.rotation.z=on*.35*Math.sin(gclock*2.4+b.ph);b.m.rotation.x=on*.25*Math.cos(gclock*2+b.ph);});
  spots.forEach((s,i)=>s.intensity=.55+on*.5*(.5+.5*Math.sin(gclock*8+i*2)));}
// ================= Korb =================
const NR=6,NS=20,netGeo=new T3.BufferGeometry();
{const pos=new Float32Array((NR+1)*(NS+1)*3),uv=new Float32Array((NR+1)*(NS+1)*2),idx=[];
  for(let r=0;r<=NR;r++)for(let i=0;i<=NS;i++){const k=r*(NS+1)+i;uv[k*2]=i/NS*7;uv[k*2+1]=1-r/NR*1.6;
    if(r<NR&&i<NS){const a=k,b=k+1,c=k+NS+1,d=k+NS+2;idx.push(a,c,b,b,c,d);}}
  netGeo.setAttribute('position',new T3.BufferAttribute(pos,3));netGeo.setAttribute('uv',new T3.BufferAttribute(uv,2));netGeo.setIndex(idx);}
const NET={st:0,stV:0,bu:0,buV:0,ox:0,oxV:0,oz:0,ozV:0,wob:0,rim:0};
function netKick(vx,vz){NET.stV+=3.2;NET.buV+=4.5;NET.oxV+=vx*.5;NET.ozV-=vz*.5;NET.wob=1;}
function rimHit(){NET.rim=1;NET.oxV+=rand(-1.5,1.5);NET.ozV+=rand(-1,1);NET.stV+=.8;NET.wob=.6;}
function updNet(dt,t){const N=NET;
  if(dt>0){for(const[x,v,k,c]of[['st','stV',140,7],['bu','buV',170,9],['ox','oxV',90,5],['oz','ozV',90,5]]){N[v]+=(-k*N[x]-c*N[v])*dt;N[x]+=N[v]*dt;}
    N.wob=Math.max(0,N.wob-dt*1.2);N.rim=Math.max(0,N.rim-dt*2.2);}
  const p=netGeo.attributes.position.array;let k=0;
  for(let r=0;r<=NR;r++){const f=r/NR,y=-f*.44*(1+N.st*f*.9),rad=lerp(.222,.128,f)*(1+N.bu*.55*Math.sin(Math.PI*f*.9))+.012*Math.sin(f*7+t*3)*f,
      ox=N.ox*f*f*.5,oz=N.oz*f*f*.5;
    for(let i=0;i<=NS;i++){const a=i/NS*Math.PI*2+(r%2)*.0,w=N.wob*.025*f*Math.sin(a*3+t*16);
      p[k++]=Math.cos(a)*(rad+w)+ox;p[k++]=y;p[k++]=Math.sin(a)*(rad+w)+oz;}}
  netGeo.attributes.position.needsUpdate=true;netGeo.computeVertexNormals();
  if(rimG){rimG.rotation.x=Math.sin(t*46)*N.rim*.06;rimG.rotation.z=Math.cos(t*39)*N.rim*.04;}}
const netTex=canvasTex(128,128,(g,w)=>{g.clearRect(0,0,w,w);g.strokeStyle='#fff';g.lineWidth=7;g.lineCap='round';
  g.beginPath();g.moveTo(0,0);g.lineTo(w,w);g.moveTo(w,0);g.lineTo(0,w);g.moveTo(-w/2,w/2);g.lineTo(w/2,w*1.5);g.moveTo(w/2,-w/2);g.lineTo(w*1.5,w/2);g.moveTo(w/2,w*1.5);g.lineTo(w*1.5,w/2);g.moveTo(-w/2,w/2);g.lineTo(w/2,-w/2);g.stroke();});
netTex.wrapS=netTex.wrapT=T3.RepeatWrapping;
const basketMount=new T3.Group();
let rimG=null,basketPost=null;
function rimHeight(){return rimG.position.y+basketMount.position.y;}
{const g=basketMount;
  const dark=new T3.MeshStandardMaterial({color:0x1d2433,roughness:.5,metalness:.4});
  const pad=new T3.MeshStandardMaterial({color:'#646e68',roughness:.85});
  const base=new T3.Mesh(new T3.BoxGeometry(1.5,1.1,2.2),pad);base.position.copy(V(0,.55,3.9));base.castShadow=true;scene.add(base);
  const post=new T3.Mesh(new T3.BoxGeometry(.28,3.4,.28),dark);post.position.copy(V(0,2.6,3.5));post.castShadow=true;scene.add(post);basketPost=post;
  const arm=new T3.Mesh(new T3.BoxGeometry(.2,.2,3.1),dark);arm.position.copy(V(0,3.55,1.95));arm.castShadow=true;g.add(arm);
  const glass=new T3.Mesh(new T3.BoxGeometry(1.8,1.05,.03),new T3.MeshStandardMaterial({color:0xe8f4ff,transparent:true,opacity:.28,roughness:.05,metalness:.1}));glass.position.copy(V(0,3.425,.375));g.add(glass);
  const wm=new T3.MeshStandardMaterial({color:0xffffff,roughness:.4}),om=new T3.MeshStandardMaterial({color:0xff5a1a,roughness:.4,emissive:0x331000});
  const bar=(w,h,x,y,m)=>{const b=new T3.Mesh(new T3.BoxGeometry(w,h,.04),m);b.position.copy(V(x,y,.36));g.add(b);};
  bar(1.84,.05,0,3.95,wm);bar(1.84,.05,0,2.9,wm);bar(.05,1.1,-.9,3.425,wm);bar(.05,1.1,.9,3.425,wm);
  bar(.59,.04,0,3.5,om);bar(.59,.04,0,3.07,om);bar(.04,.45,-.295,3.29,om);bar(.04,.45,.295,3.29,om);
  const bp=new T3.Mesh(new T3.BoxGeometry(1.84,.12,.08),pad);bp.position.copy(V(0,2.86,.39));g.add(bp);
  rimG=new T3.Group();rimG.position.set(0,3.05,0);g.add(rimG);
  const rim=new T3.Mesh(new T3.TorusGeometry(.225,.018,8,32),om);rim.rotation.x=Math.PI/2;rim.castShadow=true;rimG.add(rim);
  const con=new T3.Mesh(new T3.BoxGeometry(.12,.05,.16),om);con.position.copy(V(0,3.05,.29));g.add(con);
  const net=new T3.Mesh(netGeo,new T3.MeshStandardMaterial({map:netTex,alphaTest:.45,side:T3.DoubleSide,roughness:.9,emissive:0x333333}));rimG.add(net);
  scene.add(g);updNet(0,0);}

