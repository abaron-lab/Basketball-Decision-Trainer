// Sprachausgabe: Ansagen (VOICE, tools/make_voice.mjs liest die Liste zwischen VOICE-START und VOICE-END), Stummtaste, say/hush.
// Teil des Spiels: Alle Dateien in js/ sind normale Skripte (kein Build), Reihenfolge wie in index.html.

// ================= Sprachausgabe =================
// Feste Ansagen im Dialog nach einer falschen Entscheidung (Frage auf der Karte, Hinweise, Auflösung), gesprochen mit
// ElevenLabs (Stimme „Chris“, tools/make_voice.mjs liest genau diese Liste zwischen VOICE-START und VOICE-END).
// Schlüssel = Datei voice/<id>.mp3; ändert fem() den Text (Mädchen-Version), gibt es zusätzlich voice/<id>_w.mp3.
// Abgespielt wird über den Text, den das Spiel ohnehin anzeigt (say(['Wer war frei?', …])); unbekannte Texte und
// fehlende Dateien bleiben still. Nichts wird zur Laufzeit bei ElevenLabs geholt.
// VOICE-START
const VOICE={
  look:'Schau noch mal genau hin.',time:'Die Zeit ist um.',
  q_free:'Wer war frei?',q_help:'Wer hat ausgeholfen?',q_def:'Wo stand dein Verteidiger?',q_opp:'Wo stand dein Gegenspieler?',
  q_opp2:'Wo war dein Gegenspieler?',q_ball:'Wo war der Ball?',q_bh:'Wo war der Ballführer?',q_had:'Wer hatte den Ball?',
  q_thedef:'Wo stand der Verteidiger?',q_dow:'Wo stand der Verteidiger vom Flügel gegenüber?',
  q_thru:'Wer war durch?',q_pass:'Wohin ging der Pass?',q_safe:'Wer sicherte schon euren Korb?',
  tap:'Tippe auf der Karte auf den richtigen Punkt.',nudge:'Erst die Frage beantworten: Tippe auf der Karte auf einen Spieler.',
  nudge2:'Tippe direkt auf einen Spieler.',
  hit:'Richtig erkannt!',hit2:'Genau darauf kommt es an. Jetzt die ganze Lösung:',
  miss:'Guter Versuch! Schau auf den Ring.',sol:'Hier ist die Lösung:',
  // Merksätze (sc.rule), vorgelesen nach dem Antippen der Lösung (quizReveal). Text muss genau dem Merksatz im Builder entsprechen.
  r_top_drive:'Freie Bahn? Dann geh zum Korb!',
  r_top_helpl:'Wer hilft, lässt jemanden frei. Schau, woher die Hilfe kommt!',
  r_top_sag:'Viel Platz, und keiner ist frei? Nimm den Wurf!',
  r_break_drive:'Im Schnellangriff: Stoppt dich keiner, mach den Korbleger. Stoppt dich einer, pass zum freien Läufer.',
  r_wing_helptop:'Wer dir entgegenkommt, lässt jemanden frei. Finde ihn!',
  r_give_cut:'Pass und geh: Schaut dein Verteidiger zum Ball, schneide zum Korb!',
  r_give_stay:'Pass und raus: Bleibt dein Verteidiger zwischen dir und dem Korb, mach Platz für deinen Mitspieler!',
  r_backdoor_cut:'Steht der Verteidiger im Passweg, schneidet dein Mitspieler hinten rum. Spiel ihm den Ball in den Lauf!',
  r_backdoor_gap:'Wer hilft, lässt jemanden frei. Manchmal bist du das selbst: Ist der Weg frei, geh zum Korb!',
  r_backdoor_helpc:'Wer hilft, lässt jemanden frei.',
  r_wcatch_shot:'Ist dein Verteidiger beim Fangen weit weg? Dann wirf!',
  r_wcatch_drive:'Steht dein Verteidiger neben dir statt vor dir? Ab zum Korb!',
  r_wcut_deny:'Steht dein Verteidiger im Passweg, lauf hinter seinem Rücken zum Korb!',
  r_wcut_sag:'Steht dein Verteidiger weit weg, fordere den Ball. Du bist frei!',
  r_wcut_dribble:'Dribbelt der Ballführer auf dich zu, mach ihm Platz: Schneide zum Korb!',
  r_wbreak_drive:'Im Schnellangriff: Stoppt dich keiner, mach den Korbleger. Stoppt dich einer, ist ein anderer frei!',
  r_xpass_open:'Bleibt dein Verteidiger weg? Fangen und werfen!',
  r_xpass_close:'Frei ist gut, noch freier ist besser: Kommt dein Verteidiger zu dir, spiel den Extra-Pass!',
  r_xpass_fly:'Kommt dein Verteidiger angerannt und keiner ist frei? Zieh an ihm vorbei!',
  r_two_toyou:'Einer kann nicht zwei decken. Schau, wen er nimmt, und spiel den anderen!',
  r_two_middle:'Bleibt der Verteidiger tief zwischen euch, hast du Platz zum Werfen.',
  r_cpost_drive:'Allein mit deinem Verteidiger am Brett? Dreh dich und geh zum Korb!',
  r_cpost_helpw:'Hilft beim Zug zum Korb ein zweiter Verteidiger aus, ist einer deiner Mitspieler frei. Pass raus!',
  r_chigh_shot:'Viel Platz an der Freiwurflinie? Nimm den Wurf!',
  r_chigh_drive:'Steht dein Verteidiger neben dir, geh zum Korb!',
  r_chigh_backdoor:'Läuft ein Mitspieler backdoor, spiel ihm den Ball in den Lauf!',
  r_cdive_help:'Hilft dein Verteidiger aus, lauf zum Korb und zeig die Hände!',
  r_cdive_stay:'Bleibt dein Verteidiger bei dir, lass dem Ballführer die Zone frei.',
  r_cdive_helpw:'Schau auf deinen eigenen Verteidiger! Bleibt er bei dir, lass die Zone frei, auch wenn ein anderer aushilft.',
  r_dball_wing:'Am Ball: zwischen Gegenspieler und Korb, eine Armlänge Abstand.',
  r_dpass_wing:'Ein Pass weg: Ball, du, Gegenspieler. Eine Hand im Passweg, höchstens zwei Schritte weg.',
  r_dhelp_wing:'Zwei Pässe weg: ab in die Zone, Ball und Gegenspieler im Blick.',
  r_drot_top:'Ist der Ballführer durch, hilf aus und stell dich in den Weg!',
  r_dclose_wing:'Ball zu deinem Gegenspieler? Zurück, abstoppen, Hände hoch!',
  r_djump_away:'Bei jedem Pass mitgehen: Geht der Ball weg, ab in die Zone. Kommt er näher, zurück in den Passweg.',
  r_dback_first:'Zurück in die Abwehr: erst den Korb sichern, dann den Ball stoppen, dann deinen Gegenspieler finden.',
  r_rimrun_run:'Ist dein Verteidiger hinter dir, sprinte zum Korb!',
  r_rimrun_back:'Ist dein Verteidiger schon zurück, bleib hinten und biete dich an.',
  r_dkick_lay:'Zieh zum Korb. Springt dir keiner in den Weg, mach den Korbleger!',
  r_dkick_kickl:'Zieh zum Korb. Springt dir einer in den Weg, pass zu dem, den er allein gelassen hat!',
  r_plong_longl:'Ist ein Läufer allein vorne, wirf sofort den langen Pass!',
  r_plong_drive:'Sind die Läufer gedeckt, dribbel selbst schnell nach vorne.',
  r_clong_outlet:'Sind die Läufer gedeckt, spiel den kurzen Pass zum freien Aufbau.',
  r_swing_swing:'Steht die Abwehr auf einer Seite, spiel den Ball schnell auf die andere Seite!',
  r_swing_gap:'Läuft ein Mitspieler in die Lücke zwischen zwei Verteidigern, spiel ihm den Ball!',
  r_cflash_flash:'Ist der Platz zwischen dir und dem Ball frei, lauf ihm entgegen: Flash-Cut!',
  r_cflash_busy:'Steht dort schon jemand, lauf nicht auch noch hin. Bleib unten und lass Platz.',
  r_creb_put:'Rebound und der Weg zum Korb ist frei? Geh sofort wieder hoch!',
  r_creb_kick:'Ist es unter dem Korb zu voll, pass raus! Draußen ist jemand frei.',
  r_dcut_cut:'Bei jedem Schnitt mitgehen und den Ball sehen. Hand in den Passweg!',
  r_dtwo_early:'Allein gegen zwei: Korb schützen, zwischen beiden stehen, erst spät zum Ball.'
};
// VOICE-END
const VOICE_ID={};for(const k in VOICE)VOICE_ID[VOICE[k]]=k;
// Eigene Stummtaste für Sprache (getrennt von den Geräuschen), gespeichert unter pgt_voice
let voiceOn=store.get('pgt_voice')!=='0';
const VBUF={};let VQ=null,VSEQ=0;
function vFile(t){const id=VOICE_ID[t];if(!id)return null;return GIRL&&fem(t)!==t?id+'_w':id;}
function vLoad(id){if(VBUF[id])return VBUF[id];
  return VBUF[id]=(window.fetch?fetch('voice/'+id+'.mp3'):Promise.reject()).then(r=>r.ok?r.arrayBuffer():Promise.reject())
    .then(b=>new Promise((ok,no)=>{const pr=AC.decodeAudioData(b,ok,no);if(pr&&pr.catch)pr.catch(no);})).catch(()=>{VBUF[id]=null;return null;});}
// feste Dialogsätze vorab laden (klein, nacheinander), sobald es Ton gibt. Merksätze (r_…) nicht: Davon braucht ein Spiel
// nur ein, zwei; vRule() holt den passenden, sobald die Auswertung mit Frage erscheint (spart gut 1,7 MB mobile Daten).
let vPre=false;function vPreload(){if(vPre||!AC||!voiceOn)return;vPre=true;const q=Object.keys(VOICE).filter(k=>!k.startsWith('r_')).map(k=>vFile(VOICE[k]));
  const next=()=>{const id=q.shift();if(id)Promise.resolve(vLoad(id)).then(next);};next();}
function vRule(t){if(!AC||!voiceOn||!t)return;const id=vFile(t);if(id)vLoad(id);}
// Laufende Ansage abbrechen (neue Ansage, Antippen, Taste, neue Runde)
function hush(){VSEQ++;if(VQ){try{VQ.stop();}catch(e){}VQ=null;}}
// Texte nacheinander sprechen (kurze Pause dazwischen); delay = Sekunden bis zum Start
function say(texts,delay){hush();if(!voiceOn)return;const a=ac();if(!a)return;const my=VSEQ,ids=texts.map(vFile).filter(Boolean);if(!ids.length)return;
  Promise.all(ids.map(vLoad)).then(bufs=>{if(my!==VSEQ)return;bufs=bufs.filter(Boolean);let t0=a.currentTime+(delay||0);
    const play=i=>{if(my!==VSEQ)return;if(i>=bufs.length){VQ=null;return;}
      try{const s=a.createBufferSource(),g=a.createGain();s.buffer=bufs[i];g.gain.value=.9;s.connect(g);route(g,0,.06,'v');
        s.onended=()=>{if(my===VSEQ)setTimeout(()=>play(i+1),220);};VQ=s;s.start(i?0:t0);}catch(e){VQ=null;}};
    play(0);});}
addEventListener('pointerdown',()=>{if(VQ)hush();},true);
