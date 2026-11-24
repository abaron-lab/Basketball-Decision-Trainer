// Erzeugt die gesprochenen Ansagen für das Spiel mit der ElevenLabs Text-to-Speech-API und legt sie gekürzt,
// auf gleiche Lautheit gebracht und klein (mono, 80 kbit/s) nach voice/. Ohne npm-Abhängigkeiten (Node 18+,
// eingebautes fetch), für das Kürzen braucht es ffmpeg.
//
// Die Texte stehen nur an einer Stelle: in index.html zwischen „// VOICE-START“ und „// VOICE-END“ (const VOICE).
// Ändert fem() aus index.html einen Text (Mädchen-Version), wird zusätzlich <id>_w mit dem umgestellten Text erzeugt.
//
// Aufruf:
//   export ELEVENLABS_API_KEY=...  oder Key allein in ~/.elevenlabs_key (chmod 600; nicht ins Repository!)
//   node tools/make_voice.mjs --list               nur zeigen, was erzeugt würde (Texte, Zeichen), ohne Anfrage
//   node tools/make_voice.mjs --test               eine einzige Anfrage (erster Text)
//   node tools/make_voice.mjs [--only bad,q_free_w] [--force] [--raw ORDNER]
//   node tools/make_voice.mjs --trim               nur kürzen/angleichen (Rohdateien → voice/)
//
// Rohdateien landen außerhalb des Repositorys (Standard: ~/voice_raw/basketball-iq), vorhandene werden übersprungen
// (--force erzeugt neu). Jede Anfrage verbraucht Zeichen aus dem Kontingent; im Free Plan gilt: Namensnennung
// („ElevenLabs“, siehe lizenzen.html), keine kommerzielle Nutzung, Stimmen aus der Voice Library nur mit bezahltem Plan.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const VOICE_ID = 'iP95p4xoKVk53GoZ742B';   // „Chris“ (ElevenLabs-Standardstimme, über eleven_multilingual_v2 auf Deutsch)
const MODEL = 'eleven_multilingual_v2';
const SETTINGS = { stability: 0.5, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true, speed: 0.95 };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const RAW = opt('--raw') || path.join(os.homedir(), 'voice_raw', 'basketball-iq');
const OUT = path.join(ROOT, 'voice');
if (path.resolve(RAW).startsWith(ROOT + path.sep)) { console.error('Rohdateien bitte außerhalb des Repositorys ablegen (--raw)'); process.exit(1); }

// Texte und fem() aus index.html holen
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const m = html.match(/\/\/ VOICE-START\s*\n\s*const VOICE=(\{[\s\S]*?\});\s*\n\s*\/\/ VOICE-END/);
if (!m) { console.error('VOICE-Liste in index.html nicht gefunden'); process.exit(1); }
const VOICE = new Function('return ' + m[1])();
const fm = html.match(/\nconst fem=\(\(\)=>\{[\s\S]*?\n\}\)\(\);/);
if (!fm) { console.error('fem() in index.html nicht gefunden'); process.exit(1); }
const fem = new Function(fm[0] + ';return fem;')();

// Zum Sprechen: ohne Satzzeichen am Ende einen Punkt anhängen (bessere Betonung)
const spoken = t => /[.!?:]$/.test(t) ? t : t + '.';
let jobs = [];
for (const [id, t] of Object.entries(VOICE)) {
  jobs.push({ id, text: spoken(t) });
  const w = fem(t);
  if (w !== t) jobs.push({ id: id + '_w', text: spoken(w) });
}
const only = (opt('--only') || '').split(',').filter(Boolean);
if (only.length) jobs = jobs.filter(j => only.includes(j.id));
if (flag('--test')) jobs = jobs.slice(0, 1);

if (flag('--list')) {
  for (const j of jobs) console.log(`${j.id.padEnd(10)} ${j.text}`);
  console.log(`${jobs.length} Dateien, ${jobs.reduce((s, j) => s + j.text.length, 0)} Zeichen`);
  process.exit(0);
}

const TARGET = -18;   // LUFS für alle Ansagen
function trim(id) {
  // 1. Stille vorn/hinten weg (kurzer Vor-/Nachlauf bleibt), 2. Lautheit messen (EBU R128), 3. feste Verstärkung auf
  // TARGET, Spitzen per Begrenzer auf -1,5 dBFS, kurz einblenden. (loudnorm streute bei kurzen Clips um bis zu 8 LU.)
  const src = path.join(RAW, id + '.mp3'), dst = path.join(OUT, id + '.mp3');
  const tmp = path.join(os.tmpdir(), `biq_voice_${process.pid}.wav`);
  const run = a => { const r = spawnSync('ffmpeg', a, { encoding: 'utf8' }); if (r.status !== 0) throw new Error(`ffmpeg ${id}: ${r.stderr}`); return r.stderr; };
  run(['-v', 'error', '-y', '-i', src, '-af', [
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04',
    'areverse', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08', 'areverse',
  ].join(','), '-ac', '1', '-ar', '44100', tmp]);
  const I = parseFloat((run(['-v', 'info', '-i', tmp, '-af', 'ebur128', '-f', 'null', '-']).match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold[\s\S]*$/) || [])[1]);
  const gain = Number.isFinite(I) ? Math.max(-20, Math.min(20, TARGET - I)) : 0;
  run(['-v', 'error', '-y', '-i', tmp, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.84:attack=3:release=60:level=false,afade=t=in:d=0.01`,
    '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '80k', dst]);
  fs.unlinkSync(tmp);
  return fs.statSync(dst).size;
}

async function gen(j) {
  const KEYFILE = path.join(os.homedir(), '.elevenlabs_key');
  const KEY = process.env.ELEVENLABS_API_KEY || (fs.existsSync(KEYFILE) ? fs.readFileSync(KEYFILE, 'utf8').trim() : '');
  if (!KEY) throw new Error('API-Key fehlt: ELEVENLABS_API_KEY setzen oder in ~/.elevenlabs_key ablegen');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: j.text, model_id: MODEL, language_code: 'de', voice_settings: SETTINGS, seed: 7 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(RAW, j.id + '.mp3'), buf);
  return buf.length;
}

fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
let fail = 0;
for (const j of jobs) {
  const raw = path.join(RAW, j.id + '.mp3');
  try {
    if (!flag('--trim') && (flag('--force') || !fs.existsSync(raw))) {
      const n = await gen(j);
      console.log(`${j.id.padEnd(10)} erzeugt (${(n / 1024).toFixed(0)} KB)  ${j.text}`);
    }
    if (fs.existsSync(raw)) console.log(`${j.id.padEnd(10)} → voice/${j.id}.mp3 (${(trim(j.id) / 1024).toFixed(1)} KB)`);
    else console.log(`${j.id.padEnd(10)} fehlt (keine Rohdatei)`);
  } catch (e) { fail++; console.error(`${j.id}: ${e.message}`); if (/HTTP 40[12]/.test(e.message)) break; }
}
if (fail) process.exit(1);
