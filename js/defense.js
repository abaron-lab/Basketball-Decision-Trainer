// Spielzüge in der Abwehr: Positionen A/B/C (mkSpots), Ergebnisse (defRun) und Builder.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= VERTEIDIGUNG (Mann-Mann, nach DBB-Miniregeln und MMV-Kriterien) =================
// Du bist Verteidiger H, dein Gegenspieler ist M. Im Entscheidungsmoment tippst du eine von drei Positionen an.
const unitV=(x,z)=>{const d=Math.hypot(x,z)||1;return[x/d,z/d];};
function mkSpots(list){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=(R()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];}a.forEach((p,i)=>p.id='ABC'[i]);return a;}
function others(list,ref){list.forEach(([r,num,dn,x,z])=>{const o=addP(r,'off',num,{sel:false}),d=addP('d'+r,'def',dn),h=homeOf(pt(x,z),1.2,ref);
  setPath(o,[[0,x,z-1.2],[1.2,x,z]]);setPath(d,[[0,h.x,h.z-1.0],[1.3,h.x,h.z]]);});}
function defRet(good,spots,o){return Object.assign({ans:'spot:'+good.id,spots,def:true,helper:null,fake:false,labels:{drive:null,shot:null},prompt:'Wo stellst du dich hin? Tippe auf eine Position.',
  outcome:defOutcome,rel:['M','B'],notes:{}},o);}
// --------- Abwehr 1: Gegenspieler mit Ball ---------
function buildDBall(v,T,L,M5){
  const s=R()<.5?-1:1,top=v==='top',corner=v==='corner';
  const H=addP('H','def',5),Mp=addP('M','off',top?1:corner?4:(s<0?3:2),{sel:false}),B=addP('B','off',top||corner?(s<0?3:2):1,{sel:false}),dB=addP('dB','def',6);
  const m=top?pt(s*rand(.6,1.1),rand(-7.9,-7.4)):corner?pt(s*rand(6.4,6.7),rand(.0,.4)):pt(s*rand(5.0,5.4),rand(-5.0,-4.4));
  const b=top?pt(-s*rand(5.2,5.6),rand(-5.0,-4.4)):corner?pt(s*rand(4.6,5.0),rand(-6.6,-6.0)):pt(-s*rand(.6,1.1),rand(-8.6,-8.0));
  setPath(Mp,[[0,m.x+(top?0:corner?-s*.5:s*.6),m.z-(top?1.4:corner?1.9:2.2)],[T*.55,m.x,m.z]]);setPath(B,[[0,b.x,b.z-1.2],[T*.3,b.x,b.z]]);
  const hb=homeOf(b,1.1,m);setPath(dB,[[0,hb.x,hb.z-1.1],[T*.3,hb.x,hb.z]]);
  const h0=top?pt(m.x*.6,-4.4):corner?pt(s*3.9,-1.9):pt(s*2.7,-2.8),h1=top?pt(m.x*.7,-4.7):corner?pt(s*4.3,-1.6):pt(s*3.0,-3.1);setPath(H,[[0,h0.x,h0.z],[T,h1.x,h1.z]]);
  if(corner)others(M5===5?[['C',5,9,-s*2.9,-.5],['O',1,8,-s*1.0,-8.0],['K',7,10,-s*5.4,-4.6]]:[['C',5,9,-s*2.9,-.5],['O',1,8,-s*1.0,-8.0]],m);
  else others(M5===5?[['C',5,9,-s*2.9,-.5],['K',7,10,top?s*6.6:-s*6.6,.3],['O',top?(s<0?2:3):4,8,top?s*5.4:-s*5.2,top?-4.6:-4.8]]:[['C',5,9,-s*2.9,-.5],['O',top?(s<0?2:3):4,8,top?s*5.4:s*6.5,top?-4.6:.2]],m);
  const[u0,u1]=unitV(-m.x,-m.z),px=-u1*s,pz=u0*s;
  const good={x:m.x+u0*1.05,z:m.z+u1*1.05,name:'zwischen ihm und dem Korb',res:'stopDrive'},far={x:m.x+u0*3.6,z:m.z+u1*3.6,name:'weit weg in der Zone',res:'openShot',note:'Du warst zu weit weg. Dein Gegenspieler konnte in Ruhe werfen.'},
    side={x:m.x+u0*.15+px*1.25,z:m.z+u1*.15+pz*1.25,name:'neben ihm',res:'driveM',note:'Du standest neben ihm, nicht zwischen ihm und dem Korb. Der Weg zum Korb war frei.'};
  const spots=mkSpots([good,far,side]);
  return defRet(good,spots,{ballAt:'B',give:{to:'M',t0:T*.42,t1:T*.68},slowRes:'openShot',camFix:corner?{x:s*3.2,z:-10.2,dx:s*.196,dz:.98}:{x:m.x*.45,z:-10.2,dx:m.x*.012,dz:1},q:{t:'Wer hatte den Ball?',r:'M'},
    why:corner?'Dein Gegenspieler hat den Ball in der Ecke. Stell dich zwischen ihn und den Korb, etwa eine Armlänge entfernt. Dann ist auch der Weg an der Grundlinie zu.':'Dein Gegenspieler hat den Ball. Stell dich zwischen ihn und den Korb, etwa eine Armlänge entfernt: nah genug, um einen Wurf zu stören, weit genug, um einen Durchbruch zu verhindern.',
    rule:'Am Ball: zwischen Gegenspieler und Korb, eine Armlänge Abstand.'});
}
// --------- Abwehr 2: Ein Pass entfernt ---------
function buildDPass(v,T,L,M5){
  const s=R()<.5?-1:1,top=v==='top',post=v==='post';
  const H=addP('H','def',5),Mp=addP('M','off',post?5:top?1:(s<0?3:2),{sel:false}),B=addP('B','off',top||post?(s<0?3:2):1,{sel:false}),dB=addP('dB','def',6);
  const m=post?pt(s*rand(2.5,2.8),rand(-1.5,-1.0)):top?pt(-s*rand(.3,.7),rand(-8.0,-7.5)):pt(s*rand(5.2,5.6),rand(-5.0,-4.4));
  const b=top||post?pt(s*rand(5.1,5.5),rand(-5.0,-4.4)):pt(s*rand(.4,.9),rand(-8.4,-7.8));
  setPath(Mp,[[0,m.x,m.z-1.0],[T*.6,m.x,m.z]]);setPath(B,[[0,b.x-s*.4,b.z-1.6],[T*.7,b.x,b.z]]);
  const hb=homeOf(b,1.1,m);setPath(dB,[[0,hb.x-s*.3,hb.z-1.5],[T*.7,hb.x,hb.z]]);
  const[u0,u1]=unitV(-m.x,-m.z),[b0,b1]=unitV(b.x-m.x,b.z-m.z);
  const h0=pt(m.x+u0*.6-b0*.4,m.z+u1*.6-b1*.4);setPath(H,[[0,h0.x,h0.z-1.0],[T*.8,h0.x,h0.z]]);
  if(post)others(M5===5?[['T',1,9,-s*.8,-8.0],['O',s<0?2:3,8,-s*5.4,-4.6],['K',7,10,-s*6.6,.3]]:[['T',1,9,-s*.8,-8.0],['O',s<0?2:3,8,-s*5.4,-4.6]],b);
  else others(M5===5?[['C',5,9,-s*2.9,-.5],['K',7,10,-s*6.6,.3],['O',4,8,top?-s*5.4:-s*5.3,top?-4.6:-4.8]]:[['C',5,9,-s*2.9,-.5],['O',4,8,top?-s*5.4:-s*5.3,top?-4.6:-4.8]],b);
  const good=post?{x:m.x+u0*.25+b0*.9,z:m.z+u1*.25+b1*.9,name:'seitlich vor ihm, Hand im Passweg',res:'steal'}:{x:m.x+u0*.85+b0*.95,z:m.z+u1*.85+b1*.95,name:'Hand im Passweg',res:'steal'},
    far=post?{x:m.x+u0*.95,z:m.z+u1*.95,name:'hinter ihm, zum Korb hin',res:'passDrive',note:'Hinter ihm war der Passweg offen. Er hat den Ball am Brett bekommen und sich zum Korb gedreht.'}
      :{x:m.x+u0*3.7,z:m.z+u1*3.7,name:'tief in der Zone',res:'passShot',note:'Ein Pass vom Ball entfernt darfst du nur etwa zwei Schritte weg. Du warst zu weit weg, und er hat in Ruhe geworfen.'},
    wrong={x:m.x-b0*1.05+u0*.35,z:m.z-b1*1.05+u1*.35,name:'auf der falschen Seite',res:'passDrive',note:'Du standest auf der Seite weg vom Ball. Der Passweg war offen, und er ist gleich zum Korb gezogen.'};
  const spots=mkSpots([good,far,wrong]);
  return defRet(good,spots,{ballAt:'B',slowRes:'passDrive',camFix:post?{x:s*2.2,z:-9.6,dx:0,dz:1}:{x:(m.x+b.x)*.3,z:-10.2,dx:(m.x+b.x)*.008,dz:1},q:{t:'Wo war der Ball?',r:'B'},
    why:post?'Dein Gegenspieler steht am Brett, der Ball ist am Flügel. Er ist nur einen Pass entfernt. Stell dich seitlich vor ihn, zum Ball hin, mit einer Hand im Passweg. Stehst du hinter ihm, bekommt er den Ball und dreht sich zum Korb.':'Dein Gegenspieler ist einen Pass vom Ball entfernt. Stell dich etwas zum Ball hin und zwischen ihn und den Korb, mit einer Hand im Passweg. So siehst du Ball und Gegenspieler.',
    rule:'Ein Pass weg: Ball, du, Gegenspieler. Eine Hand im Passweg, höchstens zwei Schritte weg.'});
}
// --------- Abwehr 3: Zwei Pässe entfernt (Helfer) ---------
function buildDHelp(v,T,L,M5){
  const s=R()<.5?-1:1,corner=v==='corner',top=v==='top'; // top: Ball in der Ecke gegenüber, Gegenspieler oben
  const H=addP('H','def',5),Mp=addP('M','off',top?1:corner?4:(s<0?3:2),{sel:false}),B=addP('B','off',top?4:corner?(s<0?3:2):1,{sel:false}),dB=addP('dB','def',6);
  const m=top?pt(s*rand(2.8,3.2),rand(-7.8,-7.3)):corner?pt(s*rand(6.4,6.8),rand(.0,.5)):pt(s*rand(5.3,5.7),rand(-4.8,-4.2)),b=top?pt(-s*rand(6.4,6.7),rand(.0,.4)):pt(-s*rand(5.0,5.4),rand(-5.0,-4.4));
  setPath(Mp,[[0,m.x,m.z-1.2],[T*.6,m.x,m.z]]);setPath(B,top?[[0,-s*5.2,-5.0],[T*.75,b.x,b.z]]:[[0,-s*1.6,-8.6],[T*.75,b.x,b.z]]);
  const hb=homeOf(b,1.1,b);setPath(dB,top?[[0,-s*4.6,-4.4],[T*.75,hb.x,hb.z]]:[[0,-s*1.4,-7.4],[T*.75,hb.x,hb.z]]);
  const[u0,u1]=unitV(-m.x,-m.z),h0=pt(m.x+u0*.8,m.z+u1*.8);setPath(H,[[0,h0.x,h0.z-.8],[T*.7,h0.x,h0.z]]);
  if(top)others(M5===5?[['W',s<0?2:3,8,-s*5.4,-4.8],['C',5,9,s*2.8,-.4],['K',7,10,s*5.6,-4.4]]:[['W',s<0?2:3,8,-s*5.4,-4.8],['C',5,9,s*2.8,-.4]],b);
  else others(M5===5?[['C',5,9,-s*2.8,-.4],['T',corner?1:(s<0?2:3),8,s*.8,-8.0],['K',7,10,-s*6.6,.3]]:[['C',5,9,-s*2.8,-.4],['T',corner?1:4,8,s*.9,-8.0]],b);
  const good={x:top?-s*.3:corner?s*1.0:s*1.3,z:top?-3.5:corner?-1.4:-2.9,name:'Helfer in der Zone',res:'stopDrive'},
    glued={x:m.x+u0*.7,z:m.z+u1*.7,name:'direkt bei ihm',res:'driveB',note:'Zwei Pässe vom Ball entfernt wirst du als Helfer gebraucht. Weil du außen bei deinem Gegenspieler warst, hatte der Ballführer freie Bahn.'},
    dbl={x:b.x+s*1.1,z:top?b.z-.6:b.z+.7,name:'beim Ballführer',res:'passShot',note:'Zu zweit auf den Ballführer gehen heißt Doppeln. Das ist im Minibasketball verboten, und dein Gegenspieler war ganz frei.'};
  const spots=mkSpots([good,glued,dbl]);
  return defRet(good,spots,{ballAt:'B',slowRes:'driveB',camFix:{x:0,z:top?-11.4:-10.4,dx:0,dz:1},q:{t:'Wo war der Ball?',r:'B'},
    why:top?'Der Ball ist in der Ecke auf der anderen Seite. Dein Gegenspieler oben ist zwei Pässe vom Ball entfernt. Dann stellst du dich als Helfer in die Zone. Zieht der Ballführer zum Korb, bist du schon da.':'Dein Gegenspieler ist zwei Pässe vom Ball entfernt. Dann stellst du dich als Helfer in die Zone. Zieht der Ballführer zum Korb, bist du schon da.',
    rule:'Zwei Pässe weg: ab in die Zone, Ball und Gegenspieler im Blick.'});
}
// --------- Abwehr 4: Aushelfen, wenn der Ballführer durch ist ---------
function buildDRot(v,T,L,M5){
  if(v==='base')return buildDRotBase(T,L,M5);
  const s=R()<.5?-1:1,mid=v==='mid';
  const H=addP('H','def',5),Mp=addP('M','off',s<0?3:2,{sel:false}),B=addP('B','off',1,{sel:false}),dB=addP('dB','def',6);
  const m=pt(s*rand(5.2,5.6),rand(-5.0,-4.4)),b0=mid?pt(-s*1.4,-8.4):pt(s*.4,-8.6),b=mid?pt(s*rand(.0,.4),rand(-3.9,-3.5)):pt(s*rand(1.2,1.5),rand(-4.1,-3.7));
  setPath(Mp,[[0,m.x,m.z-1.0],[T*.6,m.x,m.z]]);setPath(B,[[0,b0.x,b0.z],[T*.35,lerp(b0.x,b.x,.3),lerp(b0.z,b.z,.3)],[T,b.x,b.z]],true);
  setPath(dB,[[0,b0.x,b0.z+1.1],[T*.35,lerp(b0.x,b.x,.3)-s*.2,lerp(b0.z,b.z,.3)+.9],[T,b.x-s*.3,b.z-1.4]]);
  const[u0,u1]=unitV(-m.x,-m.z),h0=pt(m.x+u0*1.4-s*.6,m.z+u1*1.4-.3);setPath(H,[[0,h0.x,h0.z-.8],[T*.6,h0.x,h0.z]]);
  others(M5===5?[['C',5,9,-s*2.8,-.4],['O',4,8,-s*5.4,-4.6],['K',7,10,-s*6.6,.3]]:[['C',5,9,-s*2.8,-.4],['O',4,8,-s*5.4,-4.6]],b);
  const[v0,v1]=unitV(-b.x,-b.z);
  const good={x:b.x+v0*1.3,z:b.z+v1*1.3,name:'dem Ballführer in den Weg',res:'stopDrive'},
    stay={x:m.x+u0*.8,z:m.z+u1*.8,name:'bei deinem Gegenspieler',res:'driveB',note:'Der Ballführer war an seinem Verteidiger vorbei. Weil keiner ausgeholfen hat, hatte er freie Bahn zum Korb.'},
    chase={x:b.x-v0*1.0+s*.7,z:b.z-v1*1.0,name:'hinter dem Ballführer',res:'driveB',note:'Hinter dem Ballführer kannst du ihn nicht mehr stoppen. Stell dich vor ihn, zwischen ihn und den Korb.'};
  const spots=mkSpots([good,stay,chase]);
  return defRet(good,spots,{ballAt:'B',slowRes:'driveB',camFix:{x:s*.8,z:-10.2,dx:0,dz:1},q:{t:'Wer war durch?',r:'B'},
    why:'Der Ballführer ist an seinem Verteidiger vorbeigezogen. Jetzt hilfst du aus: Stell dich ihm in den Weg, bevor er am Korb ist. Danach schnell zurück zu deinem Gegenspieler.',
    rule:'Ist der Ballführer durch, hilf aus und stell dich in den Weg!'});
}
// Aushelfen an der Grundlinie: Der Ballführer zieht vom Flügel an der Grundlinie vorbei. Du bist der Helfer unten auf der anderen Seite.
function buildDRotBase(T,L,M5){
  const s=R()<.5?-1:1; // Ball auf Seite s, dein Gegenspieler auf der anderen Seite (4 gegen 4 am Flügel, 5 gegen 5 in der Ecke)
  const H=addP('H','def',5),Mp=addP('M','off',M5===5?4:(s<0?2:3),{sel:false}),B=addP('B','off',s<0?3:2,{sel:false}),dB=addP('dB','def',6);
  const m=M5===5?pt(-s*rand(6.4,6.7),rand(.0,.4)):pt(-s*rand(5.2,5.6),rand(-5.0,-4.4));
  const b0=pt(s*rand(5.1,5.5),rand(-5.4,-4.8)),b=pt(s*rand(3.0,3.3),rand(-.8,-.5));
  setPath(Mp,[[0,m.x,m.z-1.0],[T*.6,m.x,m.z]]);
  setPath(B,[[0,b0.x,b0.z],[T*.35,lerp(b0.x,b.x,.25),lerp(b0.z,b.z,.25)],[T,b.x,b.z]],true);
  setPath(dB,[[0,b0.x-s*.9,b0.z+.6],[T*.35,lerp(b0.x,b.x,.25)-s*.7,lerp(b0.z,b.z,.25)+.1],[T,b.x+s*.2,b.z-1.6]]); // auf der hohen Seite geschlagen
  const h0=M5===5?pt(-s*1.3,-1.4):pt(-s*1.2,-2.5);setPath(H,[[0,h0.x-s*.4,h0.z-.8],[T*.6,h0.x,h0.z]]);
  // Kein anderer Verteidiger steht unten: Der Center ist oben an der Freiwurflinie.
  others(M5===5?[['C',5,9,-s*1.4,-5.0],['O',1,8,s*.4,-8.4],['K',7,10,-s*5.4,-4.6]]:[['C',5,9,-s*1.4,-5.0],['O',1,8,s*.4,-8.4]],b0);
  const[u0,u1]=unitV(-m.x,-m.z),[v0,v1]=unitV(-b.x,-b.z);
  const good={x:b.x+v0*1.3,z:b.z+v1*1.3,name:'an der Grundlinie in den Weg',res:'stopDrive'},
    stay={x:m.x+u0*.8,z:m.z+u1*.8,name:'bei deinem Gegenspieler',res:'driveB',note:'Der Ballführer war an der Grundlinie an seinem Verteidiger vorbei. Weil keiner ausgeholfen hat, hatte er freie Bahn zum Korb.'},
    chase={x:b.x-v0*.6,z:b.z-1.3,name:'hinter dem Ballführer',res:'driveB',note:'Hinter dem Ballführer kannst du ihn nicht mehr stoppen. Stell dich vor ihn, zwischen ihn und den Korb.'};
  const spots=mkSpots([good,stay,chase]);
  return defRet(good,spots,{ballAt:'B',slowRes:'driveB',camFix:{x:s*.6,z:-10.2,dx:0,dz:1},q:{t:'Wer war durch?',r:'B'},
    why:'Der Ballführer ist an der Grundlinie an seinem Verteidiger vorbeigezogen. Du warst der Helfer unten auf der anderen Seite. Stell dich ihm an der Grundlinie in den Weg, bevor er am Korb ist. Danach schnell zurück zu deinem Gegenspieler.',
    rule:'Ist der Ballführer durch, hilf aus und stell dich in den Weg!'});
}
// --------- Abwehr 5: Zurück zum Gegenspieler (Close-out) ---------
function buildDClose(v,T,L,M5){
  const s=R()<.5?-1:1,corner=v==='corner',top=v==='top'; // top: Gegenspieler oben, der Ball kommt vom Flügel gegenüber
  const H=addP('H','def',5),Mp=addP('M','off',top?1:corner?4:(s<0?3:2),{sel:false}),B=addP('B','off',top?(s<0?2:3):corner?(s<0?3:2):1,{sel:false}),dB=addP('dB','def',6);
  const m=top?pt(s*rand(.6,1.0),rand(-8.6,-8.1)):corner?pt(s*rand(6.4,6.8),rand(.0,.4)):pt(s*rand(5.2,5.6),rand(-5.0,-4.4));
  const b=top?pt(-s*rand(5.0,5.4),rand(-5.0,-4.4)):corner?pt(s*rand(4.6,5.0),rand(-6.6,-6.0)):pt(-s*rand(.4,.9),rand(-8.4,-7.8));
  setPath(Mp,[[0,m.x,m.z-1.0],[T*.5,m.x,m.z]]);setPath(B,[[0,b.x,b.z-1.4],[T*.4,b.x,b.z]]);
  const hb=homeOf(b,1.0,b);setPath(dB,[[0,hb.x,hb.z-1.3],[T*.4,hb.x,hb.z]]);
  const h0=top?pt(-s*.2,-3.6):corner?pt(s*1.5,-1.6):pt(s*1.6,-2.6);setPath(H,[[0,h0.x+s*.3,h0.z-.6],[T*.5,h0.x,h0.z]]);
  if(top)others(M5===5?[['C',5,9,-s*2.8,-.4],['O',s<0?3:2,8,s*5.4,-4.6],['K',7,10,-s*6.6,.3]]:[['C',5,9,-s*2.8,-.4],['O',s<0?3:2,8,s*5.4,-4.6]],b);
  else others(M5===5?[['C',5,9,-s*2.8,-.4],['O',corner?1:4,8,corner?-s*1.0:-s*5.4,corner?-8.0:-4.6],['K',7,10,-s*6.6,.3]]:[['C',5,9,-s*2.8,-.4],['O',corner?1:4,8,corner?-s*1.0:-s*5.4,corner?-8.0:-4.6]],b);
  const[u0,u1]=unitV(-m.x,-m.z),px=-u1*s,pz=u0*s;
  const good={x:m.x+u0*1.1,z:m.z+u1*1.1,name:'eine Armlänge vor ihm',res:'goodClose'},
    stay={x:h0.x,z:h0.z,name:'in der Zone bleiben',res:'openShot',note:'Der Ball war bei deinem Gegenspieler, und du warst noch in der Zone. Er konnte frei werfen.'},
    over={x:m.x-u0*.35+px*1.0,z:m.z-u1*.35+pz*1.0,name:'zu weit, an ihm vorbei',res:'driveM',note:'Du bist zu weit gelaufen. Er musste nur an dir vorbei zum Korb ziehen.'};
  const spots=mkSpots([good,stay,over]);
  return defRet(good,spots,{ballAt:'B',give:{to:'M',t0:T*.5,t1:T*.78},slowRes:'openShot',camFix:top?{x:s*.4,z:-13.4,dx:0,dz:1}:{x:s*1.2,z:-10.2,dx:0,dz:1},q:{t:'Wohin ging der Pass?',r:'M'},
    why:'Der Ball ging zu deinem Gegenspieler. Lauf schnell zurück und stopp eine Armlänge vor ihm, zwischen ihm und dem Korb. Hände hoch!',
    rule:'Ball zu deinem Gegenspieler? Zurück, abstoppen, Hände hoch!'});
}
// --------- Abwehr 6: Mitgehen beim Pass (FIBA: jump to the ball) ---------
// Der Ball wird gepasst. Danach ist dein Gegenspieler weiter weg vom Ball (ab in die Zone) oder näher dran (zurück in den Passweg).
function buildDJump(v,T,L,M5){
  const s=R()<.5?-1:1,away=v==='away';
  const H=addP('H','def',5),Mp=addP('M','off',s<0?3:2,{sel:false}),B=addP('B','off',away?1:(s<0?2:3),{sel:false}),dB=addP('dB','def',6);
  const O=addP('O','off',away?(s<0?2:3):1,{sel:false}),dO=addP('dO','def',8);
  const m=pt(s*rand(5.2,5.6),rand(-5.0,-4.4));
  const b=away?pt(s*rand(.3,.8),rand(-8.2,-7.7)):pt(-s*rand(5.2,5.6),rand(-5.0,-4.4));
  const o=away?pt(-s*rand(5.2,5.6),rand(-5.0,-4.4)):pt(s*rand(.4,.9),rand(-8.2,-7.7));
  setPath(Mp,[[0,m.x,m.z-1.0],[T*.5,m.x,m.z]]);setPath(B,[[0,b.x,b.z-1.2],[T*.35,b.x,b.z]]);setPath(O,[[0,o.x,o.z-1.0],[T*.45,o.x,o.z]]);
  const hb=homeOf(b,1.1,b),sag=pt(lerp(b.x,o.x,.3),lerp(b.z,o.z,.3)+1.5);setPath(dB,[[0,hb.x,hb.z-1.1],[T*.35,hb.x,hb.z],[T*.55,hb.x,hb.z],[T*.95,sag.x,sag.z]]);
  const[ob0,ob1]=unitV(b.x-o.x,b.z-o.z),[ou0,ou1]=unitV(-o.x,-o.z),oDeny=pt(o.x+ou0*.7+ob0*.9,o.z+ou1*.7+ob1*.9),oHome=pt(o.x+ou0*1.1,o.z+ou1*1.1);
  setPath(dO,[[0,oDeny.x,oDeny.z-1],[T*.4,oDeny.x,oDeny.z],[T*.55,oDeny.x,oDeny.z],[T*.88,oHome.x,oHome.z]]);
  const[u0,u1]=unitV(-m.x,-m.z),[b0,b1]=unitV(b.x-m.x,b.z-m.z),[n0,n1]=unitV(o.x-m.x,o.z-m.z);
  const hDen=pt(m.x+u0*.85+b0*.95,m.z+u1*.85+b1*.95),hHelp=pt(s*rand(1.1,1.4),rand(-3.1,-2.7)),h0=away?hDen:hHelp;
  setPath(H,[[0,h0.x,h0.z-.8],[T*.4,h0.x,h0.z]]);
  others(M5===5?[['C',5,9,-s*2.8,-.4],['K',7,10,-s*6.6,.3]]:[['C',5,9,-s*2.8,-.4]],o);
  let good,spots;
  if(away){good={x:s*rand(.8,1.0),z:-2.7,name:'Helfer in der Zone',res:'stopDrive'};
    spots=mkSpots([good,{x:hDen.x,z:hDen.z,name:'im alten Passweg',res:'driveB',note:'Der Ball war auf der anderen Seite. Du standest noch im alten Passweg, und in der Zone hat keiner geholfen.'},
      {x:o.x+s*1.1,z:o.z+.7,name:'beim Ballführer',res:'passShot',note:'Zu zweit auf den Ballführer gehen heißt Doppeln. Das ist im Minibasketball verboten, und dein Gegenspieler war ganz frei.'}]);}
  else{good={x:m.x+u0*.85+n0*.95,z:m.z+u1*.85+n1*.95,name:'Hand im Passweg',res:'steal'};
    spots=mkSpots([good,{x:hHelp.x,z:hHelp.z,name:'in der Zone bleiben',res:'passShot',note:'Der Ball war jetzt nur noch einen Pass entfernt. In der Zone warst du zu weit weg, und dein Gegenspieler hat in Ruhe geworfen.'},
      {x:m.x-n0*1.05+u0*.35,z:m.z-n1*1.05+u1*.35,name:'auf der falschen Seite',res:'passDrive',note:'Du standest auf der Seite weg vom Ball. Der Passweg war offen, und er ist gleich zum Korb gezogen.'}]);}
  return defRet(good,spots,{ballAt:'B',give:{to:'O',t0:T*.5,t1:T*.78},rel:['M','B','O'],slowRes:away?'driveB':'passShot',camFix:{x:away?0:s*1.3,z:-10.4,dx:0,dz:1},q:{t:'Wohin ging der Pass?',r:'O'},
    why:away?'Der Ball ging auf die andere Seite. Jetzt ist dein Gegenspieler zwei Pässe vom Ball entfernt. Geh mit: ab in die Zone als Helfer. Zieht der neue Ballführer zum Korb, bist du schon da.'
      :'Der Ball kam zu dem Spieler neben deinem Gegenspieler. Jetzt ist er nur noch einen Pass entfernt. Raus aus der Zone und zurück in den Passweg: Ball, du, Gegenspieler.',
    rule:'Bei jedem Pass mitgehen: Geht der Ball weg, ab in die Zone. Kommt er näher, zurück in den Passweg.'});
}
// --------- Abwehr 7: Zurück in die Abwehr (Umschalten nach Ballverlust) ---------
// DBB-Spielkonzeption (Transition-Verteidigung) und FIBA: erst den Korb sichern, dann den Ball stoppen, dann den Gegenspieler finden.
function buildDBack(v,T,L,M5){
  const s=R()<.5?-1:1;
  const H=addP('H','def',5),Mp=addP('M','off',s<0?3:2,{sel:false}),B=addP('B','off',1,{sel:false}),dB=addP('dB','def',6);
  const O=addP('O','off',s<0?2:3,{sel:false}),dO=addP('dO','def',8),C=addP('C','off',5,{sel:false}),dC=addP('dC','def',9);
  const K=M5===5?addP('K','off',7,{sel:false}):null,dK=M5===5?addP('dK','def',10):null;
  [C,dC,K,dK].forEach(p=>p&&(p.trail=true));
  setPath(C,[[0,-s*1.6,-25],[T,-s*1.4,-15.6]],true);setPath(dC,[[0,-s*2.2,-25.6],[T,-s*2.0,-16.4]],true);
  if(K){setPath(K,[[0,s*1.0,-26],[T,s*1.2,-16.6]],true);setPath(dK,[[0,s*1.6,-26.6],[T,s*1.8,-17.4]],true);}
  let good,spots,slowRes,q,why,rel=['M','B','dB','dO'];
  if(v==='first'){
    const b=pt(-s*rand(.6,.9),-10.0),m=pt(s*rand(3.8,4.1),rand(-8.4,-8.0));
    setPath(B,[[0,s*.4,-21.5],[T,b.x,b.z]],true);setPath(dB,[[0,s*.2,-23.4],[T,b.x+s*.5,b.z-3.0]],true);dB.trail=true;
    setPath(Mp,[[0,s*3.6,-21],[T,m.x,m.z]],true);setPath(H,[[0,s*2.0,-20.4],[T,s*1.2,-7.0]],true);
    setPath(O,[[0,-s*4.2,-21.5],[T,-s*4.6,-11.4]],true);setPath(dO,[[0,-s*3.6,-23.4],[T,-s*3.9,-13.6]],true);dO.trail=true;
    good={x:s*.35,z:-1.9,name:'unter dem Korb',res:'stopDrive'};
    spots=mkSpots([good,{x:b.x+s*.9,z:b.z+.9,name:'beim Ballführer',res:'driveM',note:'Du bist zum Ball gelaufen. Der Ballführer hat einfach nach vorne gepasst, und unter dem Korb war keiner.'},
      {x:m.x-s*.7,z:m.z+.9,name:'bei deinem Gegenspieler',res:'driveB',note:'Du bist mit deinem Gegenspieler an die Seite gelaufen. Der Korb war leer, und der Ballführer hatte freie Bahn.'}]);
    slowRes='driveB';q={t:'Wo war der Ballführer?',r:'B'};rel=['M','B'];
    why='Ballverlust! Du warst als Erster zurück, und unter eurem Korb stand noch keiner. Dann sicherst du zuerst den Korb: Sprint unter den Korb. Um Ball und Gegenspieler kümmerst du dich danach.';}
  else if(v==='ball'){
    const b=pt(s*rand(.1,.4),-9.4);
    setPath(B,[[0,s*.3,-21.6],[T,b.x,b.z]],true);setPath(dB,[[0,-s*.4,-23],[T,b.x+s*.5,-12.2]],true);dB.trail=true;
    setPath(O,[[0,-s*4.0,-19.8],[T,-s*4.6,-5.6]],true);setPath(dO,[[0,-s*1.8,-15.5],[T,-s*.7,-1.9]],true);
    setPath(H,[[0,s*3.6,-19.5],[T,s*2.3,-8.3]],true);setPath(Mp,[[0,s*4.3,-23.2],[T,s*4.6,-10.6]],true);
    good={x:b.x*.5,z:b.z+1.7,name:'vor dem Ballführer',res:'stopDrive'};
    spots=mkSpots([good,{x:s*.8,z:-1.7,name:'unter dem Korb',res:'pullB',note:'Unter dem Korb stand schon dein Mitspieler. Der Ballführer konnte ungestört bis zur Freiwurflinie dribbeln und werfen.'},
      {x:s*4.0,z:-10.0,name:'bei deinem Gegenspieler',res:'driveB',note:'Dein Gegenspieler war noch hinten. Vor dem Ballführer stand keiner, und er ist bis zum Korb durchgezogen.'}]);
    slowRes='pullB';q={t:'Wer sicherte schon euren Korb?',r:'dO'};
    why='Unter eurem Korb stand schon ein Mitspieler. Vor dem Ballführer war aber keiner, sein Verteidiger war noch hinten. Dann stoppst du den Ball: Stell dich ihm in den Weg. Das ist kein Doppeln, denn du bist der Einzige am Ball.';}
  else{
    const b=pt(-s*rand(.3,.5),-8.6),m=pt(s*rand(4.8,5.1),rand(-5.6,-5.1));
    setPath(B,[[0,-s*.5,-20],[T*.8,b.x,b.z-.4],[T,b.x,b.z]],true);setPath(dB,[[0,-s*.2,-17.8],[T*.8,b.x+s*.1,b.z+.9],[T,b.x+s*.1,b.z+1.25]],true);
    setPath(O,[[0,-s*4.2,-19],[T,-s*4.8,-5.0]],true);setPath(dO,[[0,-s*1.5,-14],[T,-s*1.2,-2.4]],true);
    setPath(H,[[0,s*1.6,-17.6],[T,s*1.0,-3.0]],true);setPath(Mp,[[0,s*4.0,-20.5],[T,m.x,m.z]],true);
    const[u0,u1]=unitV(-m.x,-m.z);
    good={x:m.x+u0*1.1,z:m.z+u1*1.1,name:'eine Armlänge vor ihm',res:'goodClose'};
    spots=mkSpots([good,{x:b.x+s*1.0,z:b.z+.7,name:'auch beim Ballführer',res:'passShot',note:'Der Ballführer war schon gestoppt. Zu zweit auf ihn gehen heißt Doppeln. Das ist im Minibasketball verboten, und dein Gegenspieler war ganz frei.'},
      {x:s*1.0,z:-3.0,name:'unter dem Korb bleiben',res:'openShot',note:'Unter dem Korb stand schon dein Mitspieler. Dein Gegenspieler war allein außen und konnte frei werfen.'}]);
    slowRes='openShot';q={t:'Wo war dein Gegenspieler?',r:'M'};
    why='Der Korb war gesichert, und der Ballführer wurde von seinem Verteidiger gestoppt. Jetzt suchst du deinen Gegenspieler: Lauf zu ihm und stopp eine Armlänge vor ihm, zwischen ihm und dem Korb.';}
  return defRet(good,spots,{ballAt:'B',rel,slowRes,camFix:{x:0,z:-14.6,dx:0,dz:1},q,why,prompt:'Zurück in die Abwehr! Wohin läufst du?',
    rule:'Zurück in die Abwehr: erst den Korb sichern, dann den Ball stoppen, dann deinen Gegenspieler finden.'});
}
// --------- Abwehr 8: Backdoor verteidigen ---------
// Du stehst mit der Hand im Passweg. cut: Dein Gegenspieler schneidet hinter deinem Rücken zum Korb, du gehst mit und bleibst
// zwischen ihm und dem Ball. fake: Er täuscht den Schnitt nur an und kommt zurück zum Ball, du gehst zurück in den Passweg.
function buildDCut(v,T,L,M5){
  const s=R()<.5?-1:1,cut=v==='cut';
  const H=addP('H','def',5),Mp=addP('M','off',s<0?3:2,{sel:false}),B=addP('B','off',1,{sel:false}),dB=addP('dB','def',6);
  const m=pt(s*rand(5.2,5.6),rand(-5.0,-4.4)),b=pt(s*rand(.4,.9),rand(-8.4,-7.8));
  setPath(B,[[0,b.x-s*.3,b.z-1.6],[T*.6,b.x,b.z]]);const hb=homeOf(b,1.1,m);setPath(dB,[[0,hb.x-s*.3,hb.z-1.5],[T*.6,hb.x,hb.z]]);
  const[u0,u1]=unitV(-m.x,-m.z),[b0,b1]=unitV(b.x-m.x,b.z-m.z),deny=pt(m.x+u0*.85+b0*.95,m.z+u1*.85+b1*.95);
  let me,good,spots;
  if(cut){me=pt(s*rand(2.6,2.9),rand(-2.6,-2.2));
    setPath(Mp,[[0,m.x,m.z-1.0],[T*.42,m.x,m.z],[T*.55,m.x-s*.15,m.z-.35],[T,me.x,me.z]]); // ein Schritt zum Ball, dann hinten rum zum Korb
    setPath(H,[[0,deny.x,deny.z-.8],[T*.42,deny.x,deny.z],[T*.6,deny.x-s*.05,deny.z-.25],[T,deny.x,deny.z-.15]]); // geht auf die Täuschung ein
    const[c0,c1]=unitV(b.x-me.x,b.z-me.z),[r0,r1]=unitV(-me.x,-me.z);
    good={x:me.x+c0*1.0+r0*.55,z:me.z+c1*1.0+r1*.55,name:'mitlaufen, zwischen ihm und dem Ball',res:'steal'};
    spots=mkSpots([good,{x:deny.x,z:deny.z-.15,name:'im alten Passweg',res:'passDrive',note:'Dein Gegenspieler war schon hinter dir. Im alten Passweg warst du zu weit weg, und er hat den Pass in den Lauf bekommen.'},
      {x:me.x-c0*.9-r0*.5,z:me.z-c1*.9-r1*.5,name:'hinter ihm her',res:'passDrive',note:'Hinter ihm hast du den Ball nicht gesehen. Der Pass ging an dir vorbei zu ihm.'}]);}
  else{me=pt(m.x+s*.1,m.z-.5);const low=pt(m.x-s*1.4,m.z+1.8);
    setPath(Mp,[[0,m.x,m.z-1.0],[T*.38,m.x,m.z],[T*.68,low.x,low.z],[T,me.x,me.z]]); // täuscht den Schnitt an und kommt zurück
    const sag=pt(s*3.0,-2.7);setPath(H,[[0,deny.x,deny.z-.8],[T*.38,deny.x,deny.z],[T*.8,sag.x,sag.z],[T,sag.x,sag.z]]);
    const[r0,r1]=unitV(-me.x,-me.z),[n0,n1]=unitV(b.x-me.x,b.z-me.z);
    good={x:me.x+r0*.85+n0*.95,z:me.z+r1*.85+n1*.95,name:'zurück in den Passweg',res:'steal'};
    spots=mkSpots([good,{x:sag.x-s*.3,z:sag.z+.2,name:'in der Zone bleiben',res:'passShot',note:'Dein Gegenspieler ist zurück nach außen gelaufen. In der Zone warst du zu weit weg, und er hat in Ruhe geworfen.'},
      {x:me.x-n0*1.05+r0*.35,z:me.z-n1*1.05+r1*.35,name:'auf der falschen Seite',res:'passDrive',note:'Du standest auf der Seite weg vom Ball. Der Passweg war offen, und er ist gleich zum Korb gezogen.'}]);}
  others(M5===5?[['C',5,9,-s*2.9,-.5],['K',7,10,-s*6.6,.3],['O',4,8,-s*5.3,-4.8]]:[['C',5,9,-s*2.9,-.5],['O',4,8,-s*5.3,-4.8]],b);
  return defRet(good,spots,{ballAt:'B',slowRes:cut?'passDrive':'passShot',camFix:{x:m.x*.4,z:-10.2,dx:m.x*.01,dz:1},q:{t:'Wo war dein Gegenspieler?',r:'M'},
    why:cut?'Dein Gegenspieler ist hinter deinem Rücken zum Korb geschnitten: Backdoor! Lauf sofort mit, bleib zwischen ihm und dem Ball und schau zum Ball. Mit der Hand im Passweg fängst du den Pass ab.'
      :'Dein Gegenspieler hat den Schnitt zum Korb nur angetäuscht und ist zurück nach außen gelaufen. Geh mit ihm zurück in den Passweg: Ball, du, Gegenspieler.',
    rule:'Bei jedem Schnitt mitgehen und den Ball sehen. Hand in den Passweg!'});
}
// --------- Abwehr 9: Unterzahl 1 gegen 2 ---------
// Schnellangriff gegen dich: Ballführer und dein Gegenspieler (Läufer außen) gegen dich allein, deine Mitspieler laufen hinterher.
// early: Der Ballführer ist noch weit weg: Korb schützen, zwischen beiden stehen. late: Er zieht schon zum Korb: jetzt in den Weg.
function buildDTwo(v,T,L,M5){
  const s=R()<.5?-1:1,early=v==='early'; // dein Gegenspieler läuft auf Seite s
  const H=addP('H','def',5),Mp=addP('M','off',s<0?3:2,{sel:false}),B=addP('B','off',1,{sel:false}),dB=addP('dB','def',6);
  const O=addP('O','off',s<0?2:3,{sel:false}),dO=addP('dO','def',8),C=addP('C','off',5,{sel:false}),dC=addP('dC','def',9);
  const K=M5===5?addP('K','off',4,{sel:false}):null,dK=M5===5?addP('dK','def',10):null;
  [dB,O,dO,C,dC,K,dK].forEach(p=>p&&(p.trail=true));
  let b,m,good,spots;
  if(early){b=pt(-s*rand(.3,.6),rand(-9.8,-9.3));m=pt(s*rand(4.6,5.0),rand(-7.6,-7.0));
    setPath(B,[[0,-s*.2,-21],[T,b.x,b.z]],true);setPath(Mp,[[0,s*4.4,-20.5],[T,m.x,m.z]],true);
    setPath(H,[[0,s*.9,-11.5],[T,s*.8,-4.6]],true);
    good={x:lerp(b.x,m.x,.42)*.5,z:-3.4,name:'zwischen beiden vor dem Korb',res:'delay'};
    spots=mkSpots([good,{x:b.x+s*.2,z:b.z+1.4,name:'beim Ballführer',res:'passDrive',note:'Du bist zu früh zum Ballführer gelaufen. Ein Pass zu deinem Gegenspieler, und er hatte freie Bahn zum Korb.'},
      {x:m.x-s*.6,z:m.z+1.1,name:'bei deinem Gegenspieler',res:'driveB',note:'Du warst außen bei deinem Gegenspieler. Vor dem Korb stand keiner, und der Ballführer hatte freie Bahn.'}]);}
  else{b=pt(-s*rand(.2,.5),rand(-5.6,-5.2));m=pt(s*rand(4.7,5.1),rand(-4.0,-3.4));
    setPath(B,[[0,-s*.3,-17.5],[T*.55,-s*.4,-9.6],[T,b.x,b.z]],true);setPath(Mp,[[0,s*4.4,-17],[T,m.x,m.z]],true);
    setPath(H,[[0,s*1.0,-7.0],[T*.6,s*.9,-3.4],[T,s*.8,-3.0]]);
    const[v0,v1]=unitV(-b.x,-b.z);
    good={x:b.x+v0*1.25,z:b.z+v1*1.25,name:'dem Ballführer in den Weg',res:'stopDrive'};
    spots=mkSpots([good,{x:s*.25,z:-.9,name:'unter dem Korb',res:'pullB',note:'Du bist unter dem Korb geblieben. Der Ballführer stand frei an der Freiwurflinie und konnte in Ruhe werfen.'},
      {x:m.x-s*.7,z:m.z+.8,name:'bei deinem Gegenspieler',res:'driveB',note:'Du warst außen bei deinem Gegenspieler. Der Ballführer war schon an der Freiwurflinie und hatte freie Bahn zum Korb.'}]);}
  const zb=b.z-(early?9:8);setPath(dB,[[0,b.x-s*.6,zb-6],[T,b.x-s*.5,zb]],true);
  setPath(O,[[0,-s*4.2,zb-7.5],[T,-s*4.4,zb-1.5]],true);setPath(dO,[[0,-s*3.6,zb-8.5],[T,-s*3.8,zb-2.6]],true);
  setPath(C,[[0,s*1.6,zb-9],[T,s*1.5,zb-3]],true);setPath(dC,[[0,s*2.2,zb-10],[T,s*2.1,zb-4]],true);
  if(K){setPath(K,[[0,-s*1.4,zb-10.5],[T,-s*1.3,zb-4.5]],true);setPath(dK,[[0,-s*1.9,zb-11.5],[T,-s*1.8,zb-5.5]],true);}
  return defRet(good,spots,{ballAt:'B',slowRes:'driveB',camFix:early?{x:s*1.0,z:-12.6,dx:0,dz:1}:{x:s*1.6,z:-10.6,dx:0,dz:1},q:{t:'Wo war der Ballführer?',r:'B'},
    prompt:'Allein gegen zwei! Wo stellst du dich hin?',
    why:early?'Zwei Angreifer gegen dich allein, und der Ballführer war noch weit weg. Dann schützt du zuerst den Korb und stellst dich zwischen beide. So störst du beide und gewinnst Zeit, bis deine Mitspieler zurück sind.'
      :'Zwei Angreifer gegen dich allein. Du hast zwischen beiden gewartet, und jetzt ist der Ballführer bis zur Freiwurflinie gekommen. Jetzt ist es Zeit: Stell dich ihm in den Weg. Das ist kein Doppeln, denn du bist der Einzige am Ball.',
    rule:'Allein gegen zwei: Korb schützen, zwischen beiden stehen, erst spät zum Ball.'});
}
function defCheer(){sfx.crowd();players.forEach(p=>{if(p.team==='def')act(p,'cheer',2.2,{dl:Math.random()*.3});else if(Math.random()<.6)act(p,'sad',2.2);});}
function defOutcome(choice,ok,finish){const sc=G.sc,sp=sc.spots.find(p=>'spot:'+p.id===choice);
  goTo(Hd,[[.45,sp.x,sp.z]]);later(.45,()=>defRun(sp.res,finish));}
function defRun(res,finish){const Mp=role('M'),Hb=ball.owner||role('B'),H=Hd;
  const bad=()=>{flash('Korb für die anderen','#ff7b72');sfx.bad();finish(.7);},good=t=>{flash(t,'#7ff0ad');sfx.good();defCheer();};
  const withM=fn=>ball.owner===Mp?fn():passTo(Mp,fn);
  if(res==='stopDrive'){const D=Hb,tx=lerp(D.x,H.x,.75),tz=lerp(D.z,H.z,.75)-.35,du=Math.max(.45,Math.hypot(tx-D.x,tz-D.z)/6.5);goTo(D,[[du,tx,tz]],true);later(du-.05,()=>{act(H,'block',.6);H.armsUp=1;ball.owner=H;ball.hold=true;G.slowT=.45;good('Gestoppt!');finish(1.2);});}
  else if(res==='steal'){const ix=lerp(Hb.x,Mp.x,.6),iz=lerp(Hb.z,Mp.z,.6);act(Hb,'pass',.4);goTo(H,[[.32,ix,iz-.1]]);
    fly({x:ix,y:1.2,z:iz},.4,.25,()=>{ball.owner=H;ball.hold=true;act(H,'catch',.4);G.slowT=.45;good('Abgefangen!');goTo(H,[[1.6,ix*.4,-12]]);finish(1.2);});}
  else if(res==='stopShot'||res==='goodClose')withM(()=>{H.armsUp=1.2;act(H,'block',.8);shootFrom(Mp,false,()=>{good('Gut verteidigt!');finish(.7);});});
  else if(res==='openShot')withM(()=>shootFrom(Mp,true,bad));
  else if(res==='passShot')withM(()=>shootFrom(Mp,true,bad));
  else if(res==='driveM'||res==='passDrive')withM(()=>layup(Mp,bad));
  else if(res==='delay'){const D=Hb,sx=D.x,sz=D.z+1.0;goTo(D,[[.9,sx,sz]]); // Ballführer bremst ab, deine Mitspieler kommen zurück
    goTo(H,[[.6,lerp(H.x,sx,.25),lerp(H.z,sz,.25)]]);
    players.forEach(p=>{if(p.team!=='def'||p===H)return;const tx=p.role==='dB'?sx-Math.sign(sx||1)*.3:p.x*.8,tz=p.role==='dB'?sz+1.2:Math.min(-2.5,p.z+6.5);goTo(p,[[1.1,tx,tz]]);});
    players.forEach(p=>{if(p.team==='off'&&p!==D&&p!==Mp)goTo(p,[[1.1,p.x,p.z+4.5]]);});
    later(1.0,()=>{G.slowT=.4;good('Zeit gewonnen!');finish(1.1);});}
  else if(res==='pullB'){const D=Hb,tx=D.x*.4,tz=-5.3,du=Math.max(.5,Math.hypot(tx-D.x,tz-D.z)/6);goTo(D,[[du,tx,tz]],true);later(du,()=>shootFrom(D,true,bad));}
  else layup(Hb,bad);}

const POS={pg:{name:'Aufbau (Point Guard)',short:'Aufbau',num:1,at:[30,37]},wing:{name:'Flügel',short:'Flügel',num:3,at:[11,27]},center:{name:'Center',short:'Center',num:5,at:[14.5,12.5]},def:{name:'Verteidigung',short:'Abwehr',num:'V',at:[30,26],red:true},mix:{name:'Trainingsthema',short:'Thema',num:'T',at:[30,26]}};
