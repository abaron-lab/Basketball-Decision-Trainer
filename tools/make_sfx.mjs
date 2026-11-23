// Erzeugt Geräusche für das Spiel mit der ElevenLabs Sound-Effects-API (Text → Geräusch).
// Ohne Abhängigkeiten (Node 18+, eingebautes fetch). Danach mit tools/trim_sfx.sh kürzen und nach sfx/ legen.
//
// Aufruf:
//   export ELEVENLABS_API_KEY=...  oder Key allein in ~/.elevenlabs_key (chmod 600; nicht ins Repository!)
//   node tools/make_sfx.mjs --test           eine einzige Testanfrage (dribble1)
//   node tools/make_sfx.mjs [--only dribble,catch] [--force] [--out ORDNER]
//
// Die Rohdateien landen außerhalb des Repositorys (Standard: ~/sfx_raw/basketball-iq), vorhandene werden
// übersprungen (--force erzeugt neu). Jede Anfrage kostet Credits; im Free Plan gilt: Namensnennung
// („ElevenLabs“, siehe lizenzen.html), keine bzw. eingeschränkte kommerzielle Nutzung.
// Die API erlaubt duration_seconds ab 0,5 s; bei 0,5 s kamen oft fast stille Dateien heraus, deshalb
// mindestens 1 s anfragen und erst mit ffmpeg kürzen. Fast stille Rohdateien löschen und neu erzeugen.
import fs from 'fs';
import os from 'os';
import path from 'path';

// Pro Geräusch feste englische Texte (eine Variante pro Text). Name + Nummer = Dateiname (dribble1.mp3 …).
const SFX = {
  dribble: { dur: 1.0, inf: 0.7, texts: [
    'one basketball dribble hitting an indoor wooden court, short punchy bounce',
    'basketball dribble, one loud bounce on indoor wooden court, strong punchy impact, close up',
  ] },
  catch: { dur: 1.0, inf: 0.7, texts: [
    'hands catching a basketball, sharp slap of palms on leather ball, close up',
    'basketball caught with both hands, quick smack, isolated, no voice',
    'loud slap of two hands catching a basketball, sharp leather smack, close microphone',
  ] },
  squeak: { dur: 0.8, inf: 0.6, texts: [
    'basketball sneaker squeak on hardwood court, single sharp squeal from a quick cut',
    'short high pitched shoe squeak on indoor gym floor, one quick stop',
    'single sneaker chirp on a gym floor, short squeal, isolated',
  ] },
  step: { dur: 1.0, inf: 0.6, texts: [
    'a single footstep of a sneaker on an indoor hardwood basketball court, soft thud',
    'single light sneaker step on wooden gym floor, close up, isolated',
  ] },
  swish: { dur: 1.0, inf: 0.6, texts: [
    'basketball swish through a nylon net, nothing but net, clean',
    'ball dropping cleanly through a basketball net, soft swish sound',
    'basketball going through the hoop, net swish, isolated, no crowd',
  ] },
  rim: { dur: 1.0, inf: 0.6, texts: [
    'basketball hitting the metal rim, single clang, ring vibration',
    'ball bouncing off a basketball hoop rim, metallic clank',
    'basketball rim hit, short metal ring and rattle, isolated',
  ] },
};

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const OUT = opt('--out') || path.join(os.homedir(), 'sfx_raw', 'basketball-iq');
const KEYFILE = path.join(os.homedir(), '.elevenlabs_key');
const KEY = process.env.ELEVENLABS_API_KEY || (fs.existsSync(KEYFILE) ? fs.readFileSync(KEYFILE, 'utf8').trim() : '');
if (!KEY) { console.error('API-Key fehlt: ELEVENLABS_API_KEY setzen oder in ~/.elevenlabs_key ablegen'); process.exit(1); }
if (path.resolve(OUT).startsWith(path.resolve(path.dirname(new URL(import.meta.url).pathname), '..') + path.sep)) {
  console.error('Rohdateien bitte außerhalb des Repositorys ablegen (--out)'); process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const only = (opt('--only') || '').split(',').filter(Boolean);
let jobs = [];
for (const [name, s] of Object.entries(SFX)) {
  if (only.length && !only.includes(name)) continue;
  s.texts.forEach((text, i) => jobs.push({ file: `${name}${i + 1}.mp3`, text, dur: s.dur, inf: s.inf }));
}
if (flag('--test')) jobs = jobs.slice(0, 1);

async function gen(j) {
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: j.text, duration_seconds: j.dur, prompt_influence: j.inf }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(OUT, j.file), buf);
  return buf.length;
}

let ok = 0, fail = 0;
for (const j of jobs) {
  const f = path.join(OUT, j.file);
  if (fs.existsSync(f) && !flag('--force')) { console.log(`= ${j.file} (vorhanden)`); continue; }
  try { const n = await gen(j); ok++; console.log(`+ ${j.file}  ${(n / 1024).toFixed(1)} KB`); }
  catch (e) { fail++; console.error(`! ${j.file}  ${e.message}`); if (/HTTP 40[13]|authentication|quota/.test(e.message)) break; }
}
console.log(`${ok} erzeugt, ${fail} Fehler → ${OUT}`);
process.exit(fail ? 1 : 0);
