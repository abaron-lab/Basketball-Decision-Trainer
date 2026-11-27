// Spielschleife (update/draw), Bildeffekte, Leistungsanpassung, Start und Test-Haken.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Loop =================
let last=performance.now(),clock=0,gclock=0;
// Zuspiel im Anlauf: Der Ball kommt zur geplanten Zeit t1 an. Er fliegt aber nur so lange, wie ein Pass dieser Länge braucht
// (passT), der Passgeber spielt ihn also erst kurz vorher (früher dauerte jeder Pass t1−t0 ≈ 1 s, auch über 5 m).
function feedBall(sc){
  if(sc.give&&!sc.gave&&G.t>=sc.give.t0){const g=sc.give,Wp=role(g.to),[x,z]=evalPath(Wp.path,g.t1,Wp.lin),tf=passT(Math.hypot(x-ball.x,z-ball.z));
    if(G.t>=g.t1-tf){sc.gave=true;
      act(ball.owner,'pass',.4);ball.hold=false;ball.y=Math.max(1,ball.y);fly({x,y:1.15,z},Math.max(.2,g.t1-G.t),passH(tf),()=>{ball.owner=Wp;ball.hold=true;act(Wp,'catch',.25);});}}
  if(!sc.feed||sc.fed||G.t<sc.feed.t0)return;
  if(sc.feed.miss){missBall(sc);return;}
  const f=sc.feed,[x,z]=evalPath(Hd.path,f.t1,Hd.lin),moving=Hd.path[Hd.path.length-1][0]>f.t1+.1,tf=passT(Math.hypot(x-ball.x,z-ball.z));
  if(G.t<f.t1-tf)return;sc.fed=true;
  act(ball.owner,'pass',.4);ball.hold=false;ball.y=Math.max(1,ball.y);fly({x,y:1.15,z},Math.max(.2,f.t1-G.t),passH(tf),()=>{ball.owner=Hd;ball.hold=!moving;act(Hd,'catch',.25);});}
// Fehlwurf im Anlauf (feed.miss, Offensiv-Rebound): Der Ballführer wirft bei t0, der Ball prallt vom Ring ab und kommt bei t1
// beim eigenen Spieler an. Der springt kurz vorher hoch (Block-Bewegung, Arme oben) und holt den Ball aus der Luft.
function missBall(sc){const f=sc.feed;
  if(!f.st){f.st=1;const S=ball.owner;S.armsUp=1.3;ball.hold=true;act(S,'shoot',1.0);return;}
  if(f.st===1&&G.t>=f.t0+.24){f.st=2;const S=ball.owner,d=Math.hypot(S.x,S.z),[x,z]=evalPath(Hd.path,f.t1,Hd.lin);
    fly({x:0,y:rimHeight(),z:-.225},.75+d*.04,1.1+d*.13,()=>{sfx.rim();rimHit();
      fly({x,y:2.05,z},Math.max(.3,f.t1-G.t),.8,()=>{ball.owner=Hd;ball.hold=true;sfx.catch(Hd);});},{shot:true});}
  if(f.st===2&&G.t>=f.t1-.3){sc.fed=true;Hd.armsUp=1;act(Hd,'block',.62);}}
// Lineare Bremskurve: In TAPE_STOP Sekunden verstreicht noch eine halbe TAPE_STOP an Spielzeit.
function approachDt(rdt,raw){const start=G.sc.T-TAPE_STOP/2;
  if(G.stopElapsed===null&&G.t+rdt<start)return rdt;
  const lead=G.stopElapsed===null?Math.max(0,start-G.t):0;
  if(G.stopElapsed===null){G.stopElapsed=0;sfx.tape(lead);tape(true,lead);}
  G.stopElapsed=Math.min(TAPE_STOP,G.stopElapsed+raw-lead);
  const u=G.stopElapsed/TAPE_STOP;
  return Math.max(0,start+TAPE_STOP*u*(1-u/2)-G.t);
}
function update(rdt,raw=rdt){
  updBed(rdt);
  if(G.phase==='decide'){
    const elapsed=(performance.now()-G.dStart)/1000;
    if(G.replay){if(elapsed>=1.8)resolve(G.sc.ans);}
    else if(!G.noLimit){
      $('timerFill').style.transform=`scaleX(${clamp(1-elapsed/G.win,0,1)})`;
      if(elapsed>=G.win)resolve(null);
    }
    return;
  }
  // Zeitlupe bei Würfen, Blocks und Ballgewinnen
  let tsT=1;if(G.phase==='outcome'){if(ball.fl&&ball.fl.shot&&ball.fl.t/ball.fl.d>.42)tsT=.3;if(G.slowT>0){G.slowT-=rdt;tsT=Math.min(tsT,.32);}}
  G.ts=lerp(G.ts,tsT,1-Math.exp(-rdt*(tsT<G.ts?18:6)));
  const dt=G.phase==='approach'?approachDt(rdt,raw):rdt*G.ts;
  const sceneDt=G.phase==='approach'&&G.stopElapsed!==null?dt:rdt;
  clock+=sceneDt;gclock+=dt;G.excite=Math.max(0,G.excite-dt*.45);ledTex.offset.x+=dt*.03;
  const sc=G.sc;if(!sc)return;
  let pdt=dt;
  if(G.phase==='approach'||G.phase==='menu'){G.t+=dt;feedBall(sc);
    if(Hd.cross){const s=clamp((G.t-sc.T*.5)/(sc.T*.1),0,1);Hd.dside=lerp(-Hd.cross,Hd.cross,s);}
    if(G.phase==='menu'&&G.t>sc.T+1.4)demo();}
  else if(G.phase==='feedback'||G.phase==='summary')pdt=0;
  if(G.phase==='outcome'){G.t+=dt;const due=G.timers.filter(t=>t.t<=G.t);G.timers=G.timers.filter(t=>t.t>G.t);due.forEach(t=>t.fn());}
  players.forEach(p=>updP(p,pdt));
  if(ball.owner)ball.owner.drib+=dt*(G.phase==='feedback'||G.phase==='summary'?0:7.5);
  updBall(G.phase==='feedback'||G.phase==='summary'?0:dt);
  players.forEach(p=>poseP(p,dt));
  BL.x=ball.x;BL.y=ball.y;BL.z=ball.z;
  updRing();posMe();
  updNet(dt,gclock);updFans(gclock,G.excite,dt);updTrail(dt);updHall(dt,sceneDt);updCam(sceneDt,false);
  if(G.phase==='approach'&&G.stopElapsed===TAPE_STOP)startDecide();
  else if(bubbles.length)posBubbles();
}
// ================= Bildeffekte =================
// Bloom: Hallenlichter, Anzeigetafel, Fotoblitze und die Leuchtspur des Balls strahlen (Fernseh-Look).
// Tiefenunschärfe (Bokeh) nur in der Wurfkamera (camMode), scharf ist der Werfer bzw. der Ball; im Entscheidungsmoment
// nie, damit nichts unruhig wird. Über EffectComposer (Module am Ende der Seite). Aus mit ?lite oder ?fx=0, ohne WebGL2
// und auf langsamen Geräten (perfCheck; ?fx=1 lässt sie dort an). Fehlt etwas, wird wie bisher direkt gerendert.
const FX={on:false,want:(!LITE||COMIC)&&!/[?&]fx=0\b/.test(location.search),force:/[?&]fx=1\b/.test(location.search),dof:0,ap:.005,mb:.009};
window.initFX=function(M){
  if(!FX.want||FX.on||!renderer.capabilities.isWebGL2)return;
  try{const ex=renderer.extensions,hf=ex.has('EXT_color_buffer_float')||ex.has('EXT_color_buffer_half_float');
    // Nur die Szene braucht MSAA. Eigenes Ziel dafür (4× MSAA, HalfFloat; stencilBuffer:true → 24-Bit-Tiefe, sonst nimmt three.js
    // nur 16 Bit: Boden und Untergrund flimmern als Streifen ineinander). Die Zwischenbilder des Composers sind einfache Puffer:
    // Hätten sie ebenfalls MSAA (EffectComposer klont sein Ziel), schreibt jeder Vollbild-Schritt (Unschärfe, Bloom) in einen
    // 4-fach-Puffer und löst ihn wieder auf. Das kostete auf Retina-Fenstern so viel, dass die Wurfkamera ruckelte.
    const ty=hf?T3.HalfFloatType:T3.UnsignedByteType;
    const srt=new T3.WebGLRenderTarget(W,H,{type:ty,samples:COMIC?0:4,stencilBuffer:true}); // Comic: Tuschelinien statt MSAA
    // Tiefe als Textur (wird beim Auflösen des MSAA-Bildes mitkopiert): die Tiefenunschärfe liest sie direkt,
    // statt die ganze Halle ein zweites Mal mit Tiefen-Material zu rendern
    srt.depthTexture=new T3.DepthTexture(W,H,T3.UnsignedInt248Type);srt.depthTexture.format=T3.DepthStencilFormat;
    const rt=new T3.WebGLRenderTarget(W,H,{type:ty,depthBuffer:false});
    const C=new M.EffectComposer(renderer,rt);
    const cp=new M.ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){gl_FragColor=texture2D(tDiffuse,vUv);}'});
    C.addPass({enabled:true,needsSwap:true,clear:false,renderToScreen:false,setSize:(w,h)=>srt.setSize(w,h),dispose(){},
      render(r,wb){r.setRenderTarget(srt);r.render(scene,cam);cp.render(r,wb,srt);}});
    if(COMIC){
      // Ein einziger Vollbild-Schritt statt Bloom + Tiefenunschärfe + Gamma: Linien, Rasterpunkte, Druckversatz
      const cm=new M.ShaderPass(COMIC_FX);cm.uniforms.tDepth.value=srt.depthTexture;C.addPass(cm);
      Object.assign(FX,{C,comic:cm,on:true,bokeh:false});fxSize();
      const gl=renderer.getContext();renderer.setRenderTarget(srt);const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;renderer.setRenderTarget(null);
      if(!ok)throw new Error('Framebuffer');C.render(0);warmGL();return;}
    const bok=new M.BokehPass(scene,cam,{focus:6,aperture:0,maxblur:.008});bok.enabled=false;bok.needsSwap=true;C.addPass(bok); // in r149 sonst nur als letzter Pass
    bok.materialBokeh.defines.DEPTH_PACKING=0;bok.materialBokeh.needsUpdate=true;bok.renderTargetDepth.dispose();bok.setSize=()=>{};
    bok.render=function(r,wb,rb){const u=this.uniforms;u.tColor.value=rb.texture;u.tDepth.value=srt.depthTexture;u.nearClip.value=cam.near;u.farClip.value=cam.far;
      r.setRenderTarget(this.renderToScreen?null:wb);this.fsQuad.render(r);};
    const bl=new M.UnrealBloomPass(new T3.Vector2(W,H),.5,.45,.9);C.addPass(bl);
    // Bloom in höchstens 1280 Pixel Breite rechnen (er ist ohnehin weich); in voller Retina-Auflösung kostete er ~24 ms pro Bild
    const blSize=bl.setSize.bind(bl);bl.setSize=(w,h)=>{const k=Math.min(1,1280/w);blSize(Math.round(w*k),Math.round(h*k));};
    C.addPass(new M.ShaderPass(M.GammaCorrectionShader));
    Object.assign(FX,{C,bok,bl,on:true,bokeh:!MOBILE||FX.force});fxSize();
    // Prüfen, ob das Gerät in die Zwischenbilder rendern kann, sonst ohne Effekte weiter
    const gl=renderer.getContext();const ok=[srt,rt].every(t=>{renderer.setRenderTarget(t);return gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;});renderer.setRenderTarget(null);
    if(!ok)throw new Error('Framebuffer');
    // Shader schon jetzt übersetzen (Tiefenunschärfe, Fotoblitze), sonst hängt das erste Bild der Wurfkamera
    bok.enabled=true;C.render(0);bok.enabled=false;warmGL();
  }catch(e){console.warn('Bildeffekte aus',e);FX.on=false;}};
// Alle Shader vorab übersetzen, auch für Verstecktes und für Dinge außerhalb des Blickfelds (Tribüne hinter dem Korb,
// die erst die Wurfkamera zeigt). Sonst hängt das erste Bild nach dem Schnitt. Läuft bei jedem Rundenstart, weil sich nach
// perfCheck/perfAdapt (Schatten aus) die Shader ändern; ist schon alles übersetzt, kostet es kaum etwas.
function warmGL(){const hid=[];try{scene.traverse(o=>{if(!o.visible){o.visible=true;hid.push(o);}});renderer.compile(scene,cam);}catch(e){}hid.forEach(o=>o.visible=false);}
function fxSize(){if(!FX.on)return;FX.C.setPixelRatio(renderer.getPixelRatio());FX.C.setSize(W,H);}
// Comic-Schritt (dezent, die Entscheidung bleibt im Vordergrund): Linien aus der Tiefe (Laplace von 1/z: auf ebenen Flächen
// null, an Kanten groß) und an starken Farbkanten, in einer dunklen Fassung der Farbe darunter statt Schwarz. Stärke und Breite
// nach Bildschirmgröße einer Figur (1,6 m in Pixeln bei dieser Tiefe): kleine Figuren (Handy, weit weg) nur ein Hauch Umriss,
// sonst wirken sie fast schwarz. Feine Rasterpunkte nur in tiefen Schatten naher Figuren; Halle und Boden bleiben ruhig.
const COMIC_FX={uniforms:{tDiffuse:{value:null},tDepth:{value:null},res:{value:new T3.Vector2(1,1)},dpr:{value:1},ppm:{value:500},near:{value:.1},far:{value:200}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse,tDepth;uniform vec2 res;uniform float dpr,near,far,ppm;varying vec2 vUv;
  float vz(vec2 uv){float z=texture2D(tDepth,uv).x*2.-1.;return 2.*near*far/(far+near-z*(far-near));}
  vec3 srgb(vec3 c){c=max(c,0.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
  float lu(vec2 uv){return dot(srgb(texture2D(tDiffuse,uv).rgb),vec3(.299,.587,.114));}
  void main(){vec2 px=1./res;float s=max(1.,dpr)*1.1;
    float c=vz(vUv),ic=1./c;
    float fig=1.6*ppm/c,big=smoothstep(50.,200.,fig),lw=s*(.6+.4*big),far1=smoothstep(16.,32.,c);
    vec2 dx=vec2(px.x*lw,0.),dy=vec2(0.,px.y*lw);
    float lap=abs(1./vz(vUv+dx)+1./vz(vUv-dx)+1./vz(vUv+dy)+1./vz(vUv-dy)-4.*ic)/ic;
    float edge=smoothstep(.02,.06,lap)*(1.-far1)*(.2+.55*big);
    float gx=lu(vUv+dx)-lu(vUv-dx),gy=lu(vUv+dy)-lu(vUv-dy);
    edge=max(edge,smoothstep(.32,.55,length(vec2(gx,gy)))*.4*(1.-far1)*big);
    vec3 col=srgb(texture2D(tDiffuse,vUv).rgb);
    float l=dot(col,vec3(.299,.587,.114));col=clamp(mix(vec3(l),col,1.08),0.,1.);
    vec2 p=mat2(.7071,.7071,-.7071,.7071)*gl_FragCoord.xy/(3.*s);
    float r=sqrt(clamp((.3-l)/.3,0.,1.))*.42,dots=1.-smoothstep(r-.08,r+.08,length(fract(p)-.5));
    col=mix(col,col*.62,dots*.45*big*(1.-far1));
    col=mix(col,col*vec3(.36,.34,.44),edge);
    gl_FragColor=vec4(col,1.);}`};
const _fp=new T3.Vector3();
function draw(rdt){
  if(!FX.on){renderer.render(scene,cam);return;}
  if(FX.comic){const u=FX.comic.uniforms,pr=renderer.getPixelRatio();u.res.value.set(W*pr,H*pr);u.dpr.value=pr;u.ppm.value=cam.projectionMatrix.elements[5]*H*pr*.5;u.near.value=cam.near;u.far.value=cam.far;FX.C.render(rdt);return;}
  // Tiefenunschärfe: nur in der Wurfkamera einblenden; Fokus auf dem Werfer, solange der Ball in der Hand ist, dann auf dem Ball
  const cine=!!camMode&&(G.phase==='outcome'||G.phase==='feedback');FX.dof=lerp(FX.dof,cine?1:0,1-Math.exp(-(rdt||.016)*(cine?5:12)));
  const bk=FX.bok;bk.enabled=FX.bokeh&&FX.dof>.02;
  if(bk.enabled){const S=shooter&&ball.owner===shooter?shooter:null;if(S)_fp.set(S.x,1.5+(S.jy||0),-S.z);else _fp.set(ball.x,ball.y,-ball.z);
    const d=cam.position.distanceTo(_fp);bk.uniforms.focus.value=lerp(bk.uniforms.focus.value,d,bk.uniforms.aperture.value>0?.25:1);
    bk.uniforms.aperture.value=FX.ap*FX.dof;bk.uniforms.maxblur.value=FX.mb*FX.dof;}
  // Bloom: kräftiger bei der Lichtshow nach einem Treffer
  FX.bl.strength=.45+.35*Math.min(1,showT*1.5);
  FX.C.render(rdt);}
// Schwache Geräte: nach dem Start Bildeffekte, Schatten und Auflösung automatisch reduzieren
let perfN=0,perfSum=0,perfDone=LITE;
function perfCheck(dt){if(perfDone)return;perfN++;if(perfN<30)return;perfSum+=dt;if(perfN>=120){perfDone=true;const a=perfSum/90;
  if(a>.03&&FX.on&&!FX.force){FX.on=false;if(a>.045){sun.castShadow=false;warmGL();PR_CAP=1;computeFit();}}
  else if(a>.045){sun.castShadow=false;warmGL();PR_CAP=1;computeFit();}}}
// Laufend nachregeln: Ist das Spiel (nicht das Menü) über ~30 Bilder zu langsam, eine Stufe herunter, dann wieder messen.
// Reihenfolge: Tiefenunschärfe → Auflösung (bis 1,25) → Bildeffekte → Schatten und Auflösung 1. Nie wieder hoch (kein Flackern).
// Zusätzlich zählen verpasste Bilder (> 25 ms, bei 60 Hz ein doppeltes Bild): Ruckelt es nur jedes 3.–5. Bild, bleibt der
// Durchschnitt unter 22 ms, man sieht es aber deutlich (Wurfkamera). Ab 4 von 30 gilt das als zu langsam.
let adN=0,adS=0,adL=0;
function perfAdapt(raw){if(LITE||FX.force||bedSt||!/approach|decide|outcome|feedback/.test(G.phase)||raw>.25||document.hidden)return;
  adN++;adS+=raw;if(raw>.025)adL++;if(adN<30)return;const a=adS/adN,L=adL;adN=0;adS=0;adL=0;const pr=renderer.getPixelRatio();
  if(a<.022&&L<4)return;
  if(FX.on&&FX.bokeh&&camMode){FX.bokeh=false;return;}
  if(pr>1.25&&(a>.024||L>=4)){PR_CAP=Math.max(1.25,pr-.25);computeFit();return;}
  if(FX.on&&(a>.028||L>=6)){FX.on=false;return;}
  if(a>.04&&(sun.castShadow||pr>1)){sun.castShadow=false;warmGL();PR_CAP=1;computeFit();}}
window.__perf=()=>({pr:renderer.getPixelRatio(),fx:FX.on,bokeh:!!FX.bokeh,shadow:sun.castShadow});
function frame(now){const raw=(now-last)/1000,dt=Math.min(.05,raw);last=now;if(G.phase!=='decide'){perfCheck(raw);perfAdapt(raw);}try{update(dt,raw);if(!CARD.on||W>560)draw(dt);cardFrame();}catch(e){console.error(e);}requestAnimationFrame(frame);}
if(!LITE&&!COMIC){try{const pm=new T3.PMREMGenerator(renderer);scene.position.set(0,-2.2,-7);scene.updateMatrixWorld(true);
  scene.environment=pm.fromScene(scene,.03,.1,120).texture;scene.position.set(0,0,0);scene.updateMatrixWorld(true);pm.dispose();
  }catch(e){scene.position.set(0,0,0);}}
toonify(scene);demo();drawBoard();refreshBest();computeFit();
$('loading').classList.add('hidden');$('menu').classList.remove('hidden');renderStrip();
if(new URLSearchParams(location.search).get('kickout')==='vergleich')$('kickCompare').showModal();else startFlow();
try{if('serviceWorker'in navigator&&location.protocol==='https:'&&window.top===window&&!/claude/.test(location.hostname))navigator.serviceWorker.register('sw.js').catch(()=>{});}catch(e){}
requestAnimationFrame(frame);
if(onlineOn())flushPending().catch(()=>{});
window.__snd={voice:{say,hush,fem,VOICE,VBUF,file:vFile,playing:()=>!!VQ,on:()=>voiceOn},SMP,sfx,PRE,mute:v=>{muted=v;},ac,mixer:()=>MIX,sqr:()=>{sqkT=-9;},use:c=>{const o=AC;AC=c;MIX=null;sqkT=-9;for(const k in PRE)delete PRE[k];if(c){mix();prerender();}return o;},bed:()=>BED&&BED.g?[BED.g.gain.value,BED.r&&BED.r.gain?BED.r.gain.value:null]:null}; // nur für Tests: geladene Geräusche
window.__ff=t=>{for(let i=0;i<Math.ceil(t/.05);i++)update(.05);draw(.05);};window.__fx=FX; // nur für Tests: Spielzeit vorspulen
window.__cam=cam;window.__G=G;window.__players=()=>players;window.__glb=()=>GLB.ok;window.__scene=scene;window.__card=CARD;window.__net=NET;window.__ball=ball;
window.__GLB=()=>GLB;window.__rig=(t,n,l,g)=>{setGirl(g);return (GLB.ok?makeGLBRig:makeRig)(t==='off'?'home':'away',n,l);};window.__setGirl=setGirl;window.__miniMap=miniMap; // nur für Tests (Figuren-Aufstellung, Frage auf der Mini-Karte)
