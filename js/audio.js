// Geräusche: Aufnahmen aus sfx/, Mischpult mit Hall, synthetische Klänge, Publikum.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Sound =================
// Aufnahmen in sfx/: erstellt mit ElevenLabs Sound Effects (Free Plan: Namensnennung Pflicht, siehe lizenzen.html und INFO_HTML;
// kommerzielle Nutzung eingeschränkt). Hallengemurmel, Hupe, Signaltöne und Ersatzgeräusche entstehen mit Web Audio.
// Alles läuft über ein Mischpult (mix): Hallraum einer Sporthalle (Faltungshall mit berechneter Impulsantwort), Panorama nach
// Bildschirmposition, ferne Geräusche leiser/dumpfer/halliger (spat), am Ende ein Kompressor als Begrenzer gegen Übersteuern.
const TAPE_STOP=.85;
let AC=null,muted=store.get('pgt_mute')==='1';
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});if(AC){mix();loadSmp();vPreload();}return AC;}
// Echte Geräusche aus sfx/ (ElevenLabs, tools/make_sfx.mjs + tools/trim_sfx.sh): SMP_N = Anzahl Varianten je Geräusch.
// Geladen beim ersten ac() (Nutzer-Geste); fehlt eine Datei oder das Netz, bleibt der synthetische Ton (smp liefert false).
// Zufall hier nur über Math.random, nicht R (R ist für „Nochmal ansehen“ geseedet).
const SMP_N={tape:1,release:2,cheer:2,gasp:1,dribble:2,catch:3,squeak:3,step:2,swish:3,rim:3},SMP={},SMP_L={};let smpOn=false;
function loadSmp(){if(smpOn||!AC||!window.fetch)return;smpOn=true;
  const q=[];for(const k in SMP_N)for(let i=1;i<=SMP_N[k];i++)q.push([k,'sfx/'+k+i+'.mp3']);
  // nacheinander laden (schont langsame Verbindungen); fehlt die erste Datei eines Geräuschs, die übrigen überspringen
  prerender();const miss={},next=()=>{const j=q.shift();if(!j)return;const[k,u]=j;if(miss[k])return next();
    fetch(u).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>new Promise((ok,no)=>{const pr=AC.decodeAudioData(b,ok,no);if(pr&&pr.catch)pr.catch(no);}))
      .then(buf=>{buf.ng=k==='cheer'?1:normG(buf);(SMP[k]=SMP[k]||[]).push(buf);},()=>{if(!SMP[k])miss[k]=1;}).then(next);};next();}
// Lautheit angleichen: lautestes 30-ms-Fenster jeder Aufnahme auf -12 dBFS RMS (die Dateien sind nur auf Spitze normalisiert,
// dichte Geräusche wie Quietschen und Schritte klangen dadurch viel lauter als Netz oder Fangen). Lautstärken in sfx sind relativ dazu.
function normG(b){const d=b.getChannelData(0),w=Math.max(1,Math.round(b.sampleRate*.03));let m=0;
  for(let i=0;i<d.length;i+=w>>1){let q=0;const e=Math.min(d.length,i+w);for(let j=i;j<e;j++)q+=d[j]*d[j];m=Math.max(m,q/w);}
  return m>0?Math.min(3,.25/Math.sqrt(m)):1;}
// Mischpult
let MIX=null;
// Impulsantwort einer Sporthalle: frühe Reflexionen (Boden, Wände), dann ein Nachhall von ca. 1,6 s, der oben schneller dunkler wird
function gymIR(a){const sr=a.sampleRate,n=sr*1.7|0,b=a.createBuffer(2,n,sr);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);let lp=0;
    for(let i=0;i<n;i++){const t=i/sr;if(t<.014)continue;const k=Math.min(.94,.2+t*.55);lp+=(Math.random()*2-1-lp)*(1-k);
      d[i]=lp*Math.exp(-t*4.3)*Math.min(1,(t-.014)/.03)*(1+k);}
    [[.017,.55],[.026,.4],[.039,.32],[.054,.25],[.071,.2],[.093,.15]].forEach(([t,g],j)=>{const q=(t+(c?.0035*(j%3):.002*(j%2)))*sr|0;d[q]+=g*((j+c)%2?-1:1);});}
  return b;}
function mix(){const a=AC;if(MIX||!a)return MIX;
  // vin: Spracheingang, läuft unabhängig vom Feldton (court).
  const inp=a.createGain(),court=a.createGain(),vin=a.createGain();court.gain.value=G.phase==='feedback'||G.phase==='decide'?0:1;
  court.connect(a.destination);vin.connect(a.destination);MIX={inp,court,vin,rev:null,filter:null};
  try{const filter=a.createBiquadFilter(),comp=a.createDynamicsCompressor();
    filter.type='lowpass';filter.frequency.value=a.sampleRate/2;
    comp.threshold.value=-3;comp.knee.value=2;comp.ratio.value=20;comp.attack.value=.001;comp.release.value=.12;  // nur Begrenzer (tiefe Schwelle hebt in Chrome alles per Make-up-Gain an)
    inp.connect(filter).connect(comp).connect(court);
    const hp=a.createBiquadFilter(),cv=a.createConvolver(),wg=a.createGain();hp.type='highpass';hp.frequency.value=200;cv.buffer=gymIR(a);wg.gain.value=.55;
    hp.connect(cv).connect(wg).connect(inp);Object.assign(MIX,{rev:hp,filter});}
  catch(e){inp.disconnect();inp.connect(court);}
  return MIX;}
// Knoten ans Mischpult hängen: pan -1..1, wet = Anteil in den Hall, bus 'v' = Spracheingang (am stummen court vorbei, ohne Hall)
function route(n,pan,wet,bus){const a=AC,M=mix();let o=n;
  if(pan&&a.createStereoPanner){const P=a.createStereoPanner();P.pan.value=clamp(pan,-1,1);o.connect(P);o=P;}
  o.connect(bus==='v'?M.vin:M.inp);if(M.rev&&wet>0&&bus!=='v'){const g=a.createGain();g.gain.value=wet;o.connect(g).connect(M.rev);}}
// Raum: Lautstärke nach Abstand zur Kamera, Panorama nach Bildschirmposition, Hall- und Höhenverlust mit der Entfernung
const SPV=new T3.Vector3();
function spat(p){if(!p||!cam)return{v:1,pan:0,wet:.14,d:0};const d=Math.hypot(cam.position.x-p.x,cam.position.y-1,cam.position.z+p.z);
  SPV.set(p.x,1,-p.z).project(cam);return{v:clamp(1.25-d/22,.2,1),pan:SPV.z<1?clamp(SPV.x*.5,-.7,.7):0,wet:clamp(.1+d/45,.1,.5),d};}
function smp(k,v,pv,p,o){const a=AC,L=SMP[k];if(!a||!L||!L.length)return false;if(muted)return true;
  try{let i=Math.random()*L.length|0;if(L.length>1&&i===SMP_L[k])i=(i+1)%L.length;SMP_L[k]=i;const S=spat(p),b=L[i];
    const s=a.createBufferSource(),g=a.createGain();s.buffer=b;s.playbackRate.value=k==='tape'?b.duration/TAPE_STOP:1+(Math.random()*2-1)*(pv||.06);
    const level=v*(b.ng||1)*S.v*(.85+Math.random()*.3),at=a.currentTime+(o?.at||0);
    if(o?.attack){g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(level,at+o.attack);}
    else g.gain.value=level;
    let n=s.connect(g);
    if(S.d>7){const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=clamp(17000-S.d*420,3500,17000);n=g.connect(f);}
    route(n,S.pan,S.wet*(o&&o.wet!=null?o.wet:1));s.start(at);}catch(e){}return true;}
// Vorberechnete Publikumsgeräusche (einmal beim ersten ac()): Applaus (viele kurze Klatscher, Stereo) und ein „Oooh“
// (Stimmen mit Vokal-Formanten, Ton fällt am Ende ab). Fehlen sie noch, bleibt das alte Rauschen.
const PRE={};
function prerender(){const a=AC;if(!a||PRE.on)return;PRE.on=1;
  try{const sr=a.sampleRate,n=sr*2.6|0,b=a.createBuffer(2,n,sr),L=b.getChannelData(0),Rr=b.getChannelData(1);
    for(let c=0;c<520;c++){const t=Math.pow(Math.random(),1.6)*2.3,amp=(t<.15?t/.15:Math.pow(1-(t-.15)/2.2,1.3))*(.4+Math.random()*.6),i0=t*sr|0,
      len=sr*(.004+Math.random()*.01)|0,fc=.14+Math.random()*.22,pan=Math.random();let lp=0,hp=0,x0=0;
      for(let j=0;j<len*3&&i0+j<n;j++){const e=j<len*.08?j/(len*.08):Math.exp(-(j-len*.08)/(len*.5)),x=(Math.random()*2-1)*e;lp+=(x-lp)*fc;hp=.85*(hp+lp-x0);x0=lp;
        const y=hp*amp*.5;L[i0+j]+=y*(1-pan*.7);Rr[i0+j]+=y*(.3+pan*.7);}}
    PRE.clap=b;}catch(e){}
  try{const OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!OC)return;const sr=a.sampleRate,o=new OC(2,sr*1.6|0,sr);
    const bus=o.createGain();bus.gain.value=.5;bus.connect(o.destination);
    for(let v=0;v<16;v++){const f0=v<9?110+Math.random()*70:190+Math.random()*90,st=Math.random()*.08,os=o.createOscillator(),g=o.createGain(),P=o.createStereoPanner?o.createStereoPanner():null;
      os.type='sawtooth';os.frequency.setValueAtTime(f0*.96,st);os.frequency.linearRampToValueAtTime(f0*1.08,st+.3);os.frequency.linearRampToValueAtTime(f0*.78,1.4);
      g.gain.setValueAtTime(0,0);g.gain.linearRampToValueAtTime(.06,st+.18);g.gain.setValueAtTime(.06,.6);g.gain.exponentialRampToValueAtTime(.001,1.5);
      os.connect(g);let nd=g;if(P){P.pan.value=Math.random()*1.4-.7;g.connect(P);nd=P;}
      [[330+Math.random()*60,5,1],[720+Math.random()*120,7,.5],[2600,6,.08]].forEach(([fq,q,gg])=>{const f=o.createBiquadFilter(),h=o.createGain();f.type='bandpass';f.frequency.value=fq;f.Q.value=q;h.gain.value=gg*3;nd.connect(f).connect(h).connect(bus);});
      os.start(st);os.stop(1.55);}
    const pr=o.startRendering(),done=b=>{PRE.ooh=b;};if(pr&&pr.then)pr.then(done).catch(()=>{});else o.oncomplete=e=>done(e.renderedBuffer);}catch(e){}}
function playBuf(b,v,rate,wet){const a=AC;if(!a||muted||!b)return false;try{const s=a.createBufferSource(),g=a.createGain();s.buffer=b;s.playbackRate.value=rate||1;g.gain.value=v;s.connect(g);route(g,0,wet);s.start();}catch(e){}return true;}
// Synthetische Klänge, rund statt piepsig: Band-Stopp, Glockenton für richtig, weiches Abwärts für falsch, Hallenhupe
function osc(type,f,t,d){const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.start(t);o.stop(t+d+.05);return o;}
function env(t,a1,v,d,rel){const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a1);g.gain.setValueAtTime(v,t+Math.max(a1,d-rel));g.gain.linearRampToValueAtTime(0,t+d);return g;}
function bell(f,t,v){const a=AC;[[1,1,1.1],[2.01,.35,.6],[3.02,.14,.35],[4.1,.06,.25]].forEach(([m,g,d])=>{const o=osc('sine',f*m,t,d),e=a.createGain();
  e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(v*g,t+.006);e.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(e);route(e,0,.32);});}
function noiseBuf(d){const a=AC,b=a.createBuffer(1,a.sampleRate*d|0,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;return b;}
const SYN={
  // Band-Stopp: ein Stück Hallengeräusch (Publikum, falls schon berechnet, sonst Rauschen) wird von normalem Tempo auf Stillstand
  // abgebremst, dazu ein tiefer werdendes Brummen und ein sich schließender Tiefpass (Kassette/Video wird angehalten)
  tape(delay){const a=AC,t=a.currentTime+delay,d=TAPE_STOP,lp=a.createBiquadFilter(),g=a.createGain();lp.type='lowpass';lp.Q.value=.8;
    lp.frequency.setValueAtTime(7000,t);lp.frequency.exponentialRampToValueAtTime(160,t+d);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+.02);g.gain.setValueAtTime(1,t+d*.55);g.gain.linearRampToValueAtTime(0,t+d);lp.connect(g);route(g,0,.12);
    const src=a.createBufferSource(),sg=a.createGain(),B=BED&&(BED.r&&BED.r.buf||BED.g&&BED.g.buf);src.buffer=B||noiseBuf(1);
    src.playbackRate.setValueAtTime(1,t);src.playbackRate.exponentialRampToValueAtTime(.04,t+d);sg.gain.value=B?.45:.05;src.connect(sg).connect(lp);src.start(t,B?Math.random()*4:0);src.stop(t+d+.05);
    [[160,'sawtooth',.05],[80,'triangle',.08]].forEach(([f,ty,v])=>{const o=osc(ty,f,t,d),h=a.createGain();o.frequency.exponentialRampToValueAtTime(f*.12,t+d);h.gain.value=v;o.connect(h).connect(lp);});},
  good(){const t=AC.currentTime+.01;bell(880,t,.07);bell(1318.5,t+.1,.075);},
  bad(){const a=AC,t=a.currentTime+.01;[[392,0,.16],[311,.17,.36]].forEach(([f,dt,d])=>{const o=osc('triangle',f,t+dt,d),o2=osc('sine',f/2,t+dt,d),lp=a.createBiquadFilter(),g=a.createGain(),h=a.createGain();
    lp.type='lowpass';lp.frequency.value=1400;g.gain.setValueAtTime(0,t+dt);g.gain.linearRampToValueAtTime(.12,t+dt+.015);g.gain.exponentialRampToValueAtTime(.001,t+dt+d);
    if(dt)o.frequency.linearRampToValueAtTime(f*.94,t+dt+d);h.gain.value=.5;o.connect(lp);o2.connect(h).connect(lp);lp.connect(g);route(g,0,.25);});},
  buzz(){const a=AC,t=a.currentTime+.01,d=.75,lp=a.createBiquadFilter(),g=env(t,.01,.065,d,.06);lp.type='lowpass';lp.frequency.value=1700;lp.Q.value=.7;
    [[196,'sawtooth',1],[233,'sawtooth',.8],[392,'square',.25]].forEach(([f,ty,v])=>{const o=osc(ty,f,t,d),h=a.createGain();h.gain.value=v;o.connect(h).connect(lp);});lp.connect(g);route(g,0,.45);},
  pass(p){const a=AC,t=a.currentTime,S=spat(p),nz=a.createBufferSource(),bp=a.createBiquadFilter(),g=a.createGain();nz.buffer=noiseBuf(.2);bp.type='bandpass';bp.Q.value=1.2;
    bp.frequency.setValueAtTime(700,t);bp.frequency.exponentialRampToValueAtTime(2200,t+.16);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09*S.v,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+.19);
    nz.connect(bp).connect(g);route(g,S.pan,S.wet);nz.start(t);smp('catch',.16,.12,p,{wet:.6});},
};
function syn(k,p){if(!AC||muted)return;try{SYN[k](p);}catch(e){}}
let sqkT=0;
// Publikum im Hintergrund: Gemurmel aus ~24 synthetischen Stimmen (Puls + Rauschen durch zwei Formant-Resonatoren,
// Silben mit Pausen), einmal als 6-s-Schleife berechnet, zwei versetzte Wiedergaben. Lautstärke folgt G.excite, aus im Menü/stumm.
let BED=null;
// Zwei Schichten: ruhiges Gemurmel (immer) und Jubel (höhere Stimmen, lang gehaltene Rufe, kaum Pausen), eingeblendet nach G.excite und La-Ola.
// Schrittweise berechnet: höchstens ms Millisekunden pro Aufruf (Zeitscheiben), damit es auf dem Handy nicht ruckelt;
// perfAdapt misst währenddessen nicht (bedSt). Zustand der aktuellen Stimme liegt in st.c.
function bedInit(roar){const sr=AC.sampleRate;return{sr,roar,nv:roar?32:24,n:sr*6|0,fd:sr*.5|0,out:new Float32Array((sr*6|0)+(sr*.5|0)),v:0,c:null};}
function bedVoice(st,ms){const{sr,out,roar}=st,T=performance.now()+(ms||1e9);
  while(st.v<st.nv){if(!st.c)st.c={i:0,f0:roar?170+Math.random()*210:95+Math.random()*160,pan:.4+Math.random()*.6,ph:0,y1:0,y2:0,z1:0,z2:0,w1:0,w2:0,env:0,tgt:0,left:0,c1:0,c2:0,c3:0,g1:0,g2:0,g3:0,cons:0,hp1:0,nz0:0,gl:1};
    const C=st.c,v=st.v,f0=C.f0,pan=C.pan,r1=.982,r2=.978;let{i,ph,y1,y2,z1,z2,w1,w2,env,tgt,left,c1,c2,c3,g1,g2,g3,cons,hp1,nz0,gl}=C;
    for(;i<out.length;i++){
      if((i&2047)===0&&performance.now()>T)break;
      if(--left<=0){const talk=Math.random()<(roar?.97:.8)&&tgt===0;tgt=talk?.4+Math.random()*.6:0;
        left=sr*(talk?(roar?.25+Math.random()*.45:.08+Math.random()*.2):(roar?.02+Math.random()*.08:Math.random()<.15?.6+Math.random():.03+Math.random()*.15))|0;
        // Jubel: offene Vokale („aah“, „jaa“), Ton steigt beim Rufen etwas an
        const F1=roar?650+Math.random()*300:400+Math.random()*500,F2=roar?1100+Math.random()*700:1100+Math.random()*1500,F3=2400+Math.random()*900;gl=roar?1.15+Math.random()*.25:1;
        c1=2*r1*Math.cos(2*Math.PI*F1/sr);c2=2*r2*Math.cos(2*Math.PI*F2/sr);c3=2*.97*Math.cos(2*Math.PI*F3/sr);
        // Resonanzverstärkung ausgleichen (tiefe Formanten wären sonst viel lauter → dumpf)
        g1=(1-r1)*2*Math.sin(2*Math.PI*F1/sr);g2=(1-r2)*2*Math.sin(2*Math.PI*F2/sr);g3=.03*2*Math.sin(2*Math.PI*F3/sr);
        if(talk&&Math.random()<(roar?.3:.6))cons=sr*(.015+Math.random()*.035)|0;}
      env+=(tgt-env)*(roar?.002:.004);const pf=roar?1+(gl-1)*Math.min(1,env/.7):1;ph+=f0*pf*(1+(roar?.05:.03)*Math.sin(i/sr*(roar?6:5)+v))/sr;if(ph>=1)ph-=1;
      const nz=Math.random()*2-1,x=(ph<(roar?.05:.08)?1:0)*.7+nz*.3,a1=c1*y1-r1*r1*y2+x;y2=y1;y1=a1;const a2=c2*z1-r2*r2*z2+x;z2=z1;z1=a2;const a3=c3*w1-.9409*w2+x;w2=w1;w1=a3;
      // Konsonant (s/t/k): kurzes helles Rauschen (Hochpass erster Ordnung) am Silbenanfang
      let k=0;if(cons>0){cons--;hp1=.6*(hp1+nz-nz0);k=hp1*9;}nz0=nz;
      out[i]+=(a1*g1*.4+a2*g2*.4+a3*g3*.3+k*.012)*env*pan;}
    Object.assign(C,{i,ph,y1,y2,z1,z2,w1,w2,env,tgt,left,c1,c2,c3,g1,g2,g3,cons,hp1,nz0,gl});
    if(i<out.length)return false;st.v++;st.c=null;if(performance.now()>T)return st.v>=st.nv;}
  return true;}
function bedFinish(st){const a=AC,{sr,n,fd,out}=st;
  for(let i=0;i<fd;i++){const u=i/fd;out[i]=out[i]*u+out[n+i]*(1-u);}  // Schleife ohne Naht
  let m=0;for(let i=0;i<n;i++)m=Math.max(m,Math.abs(out[i]));const b=a.createBuffer(1,n,sr),ch=b.getChannelData(0);for(let i=0;i<n;i++)ch[i]=out[i]/(m||1)*.9;
  const g=a.createGain(),lp=a.createBiquadFilter(),hp=a.createBiquadFilter();g.gain.value=0;lp.type='lowpass';lp.frequency.value=6000;hp.type='highpass';hp.frequency.value=240;
  const tg=a.createGain();lp.connect(hp).connect(g).connect(tg);route(tg,0,.18);g.tg=tg;g.buf=b;g.srcs=[];
  [[1,0,-.45],[.94,2.7,.45]].forEach(([r,o,pn])=>{const s=a.createBufferSource();s.buffer=b;s.loop=true;s.playbackRate.value=r;let n=s;if(a.createStereoPanner){const P=a.createStereoPanner();P.pan.value=pn;n=s.connect(P);}n.connect(lp);s.start(0,o);g.srcs.push([s,r]);});
  return g;}
let bedSt=null;
function updBed(rdt){const a=AC;if(!a||a.state!=='running'||muted&&!BED||G.phase==='decide'||(G.phase==='approach'&&G.stopElapsed!==null))return;
  if(!BED||!BED.r){try{const roar=!!BED;bedSt=bedSt||bedInit(roar);if(bedVoice(bedSt,3)){const g=bedFinish(bedSt);bedSt=null;if(roar)BED.r=g;else BED={g,r:null,t:0,ex:0};}}catch(e){BED={g:null,r:1};}if(!BED||!BED.r)return;}
  if(!BED.g)return;
  BED.t-=rdt;if(BED.t>0)return;BED.t=.1;const on=!muted&&(G.phase==='approach'||G.phase==='outcome'),wave=gclock-G.wave>=0&&gclock-G.wave<3.4,ex=on?Math.max(G.excite,wave?.75:0):0;
  BED.g.gain.setTargetAtTime(on?.05+.03*ex:0,a.currentTime,on?.4:.25);
  BED.r.gain.setTargetAtTime(on?.32*ex:0,a.currentTime,ex>BED.ex?.12:.6);BED.ex=ex;}
// Blende den vollständigen Mix aus, einschließlich Hall und laufender Publikumsreaktionen.
function tape(stop,delay=0){const a=AC;if(!a)return;const t=a.currentTime+delay;
  const {court,filter}=mix(),end=t+(stop?TAPE_STOP:.045),g=court.gain;
  g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(stop?0:1,end);
  if(filter){const f=filter.frequency;f.cancelScheduledValues(t);f.setValueAtTime(f.value,t);f.exponentialRampToValueAtTime(stop?220:a.sampleRate/2,end);}
  [BED?.g,BED?.r].forEach(layer=>layer?.srcs?.forEach(([src,rate])=>{
    const p=src.playbackRate;p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);
    p.linearRampToValueAtTime(stop?0:rate,t+(stop?TAPE_STOP:.3));
  }));
}
function quietCourt(fade=0){
  if(!AC)return;
  const g=mix().court.gain,t=AC.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(fade?g.value:0,t);
  if(fade)g.linearRampToValueAtTime(0,t+fade);
}
function tone(f,d,type,v,f2,delay){const a=AC;if(!a||muted)return;try{const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(mix().inp);o.start(t);o.stop(t+d+.02);}catch(e){}}
function noise(d,v,hp){const a=AC;if(!a||muted)return;try{const b=a.createBuffer(1,a.sampleRate*d,a.sampleRate),ch=b.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*(1-i/ch.length);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='highpass';f.frequency.value=hp;g.gain.value=v;s.connect(f).connect(g).connect(mix().inp);s.start();}catch(e){}}
function crowdN(d,v,fq,att){const a=AC;if(!a||muted)return;try{const n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),ch=b.getChannelData(0);
  for(let i=0;i<n;i++){const t=i/n,e=t<att?t/att:Math.pow(1-(t-att)/(1-att),1.6);ch[i]=(Math.random()*2-1)*e*(.75+.25*Math.sin(i/a.sampleRate*40));}
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=fq;f.Q.value=.8;g.gain.value=v;s.connect(f).connect(g).connect(mix().inp);s.start();}catch(e){}}
const sfx={crowd:()=>{G.excite=Math.max(G.excite,.9);smp('cheer',1,.025,null,{wet:.3,at:.04,attack:.22})||playBuf(PRE.clap,1,.95+Math.random()*.1,.35)||crowdN(2.2,.5,1100,.12);},
  ooh:()=>smp('gasp',.7,.035,null,{wet:.45,at:.09})||playBuf(PRE.ooh,1.1,.92+Math.random()*.16,.4)||crowdN(1.1,.35,520,.3),
  dribble:p=>smp('dribble',.38,.06,p)||tone(120,.07,'sine',.18,60),catch:p=>smp('catch',.38,.08,p),bounce:(p,v=1)=>smp('dribble',.32*v,.1,p,{wet:1.4}),
  squeak:p=>{if(clock-sqkT<.9||Math.random()<.4)return;sqkT=clock;return smp('squeak',p===ROLE.H?.12:.08,.1,p);},step:(p,v)=>smp('step',v,.12,p,{wet:.5}),
  tape:delay=>smp('tape',.52,0,null,{wet:0,at:delay})||syn('tape',delay),swish:()=>smp('swish',.85,.05,ball,{wet:1.6})||noise(.35,.25,2500),good:()=>syn('good'),bad:()=>syn('bad'),buzz:()=>syn('buzz'),
  rim:()=>smp('rim',.65,.05,ball,{wet:1.8})||tone(330,.2,'triangle',.12,200),release:p=>smp('release',.33,.05,p),pass:p=>sfx.release(p||ball.owner)||syn('pass',p||ball.owner)};

