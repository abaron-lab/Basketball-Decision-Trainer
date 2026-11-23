// Überträgt Mixamo-Animationen (FBX, Standardfigur „Y Bot“) auf das Mannequin in player.glb.
//
// Aufruf (im Ordner mit three@0.149.0 und @gltf-transform/{core,extensions,functions} v3):
//   node tools/add_mixamo.mjs <ordner-mit-fbx> player.glb [ausgabe.glb] [--all]
//
// Die FBX-Rohdateien gehören NICHT ins Repository (Mixamo-Lizenz: Weitergabe der Originaldateien
// nicht erlaubt). Im Spiel landen nur die umgerechneten Bewegungen in player.glb.
// Erwartet wird u. a. Idle.fbx „With Skin“ (liefert die Ruhepose des Mixamo-Skeletts), die
// übrigen Dateien „Without Skin“, 30 fps, „In Place“ wo angeboten.
//
// Verfahren: Beide Skelette stehen in T-Pose und schauen nach +Z. Für jeden Knochen gilt dann
//   Welt_Ziel(t) = Welt_Quelle(t) · Welt_Quelle(Ruhe)⁻¹ · Welt_Ziel(Ruhe)
// und lokal = Welt_Eltern(t)⁻¹ · Welt_Ziel(t). Die Hüfte wird nur in der Höhe übernommen
// (skaliert auf die Beinlänge), waagerechte Bewegung wird entfernt: Laufwege steuert das Spiel.
// Mit mirror:true entsteht zusätzlich eine gespiegelte Fassung (links ↔ rechts), z. B. Dribbeln
// mit der anderen Hand.
import fs from 'fs';
import path from 'path';
globalThis.self = globalThis; globalThis.window = globalThis;
globalThis.document = { createElementNS: () => ({ style: {}, addEventListener() {}, removeEventListener() {} }), createElement: () => ({ style: {} }) };
const THREE = await import('three');
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
const { NodeIO } = await import('@gltf-transform/core');
const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
const { resample, prune } = await import('@gltf-transform/functions');

const [dir, inGlb, outArg] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const ALL = process.argv.includes('--all');
const outGlb = outArg || inGlb;
if (!dir || !inGlb) { console.error('Aufruf: node tools/add_mixamo.mjs <fbx-ordner> player.glb [ausgabe.glb] [--all]'); process.exit(1); }

// Datei → Clipname im Spiel. t:[von,bis] schneidet zu (Sekunden), mirror erzeugt <name>M.
export const CLIPS = [
  { file: 'Dribble.fbx', name: 'dribble', mirror: true },   // rechte Hand, gespiegelt: dribbleM = linke Hand
  { file: 'Idle.fbx', name: 'ready' },                      // Grundstellung, leicht in den Knien
  { file: 'Jog Backward.fbx', name: 'jogBack' },
  { file: 'Running Backward.fbx', name: 'runBack' },
  { file: 'Cheering.fbx', name: 'cheer' },
  { file: 'Clapping.fbx', name: 'clap' },
  { file: 'Sad Walk.fbx', name: 'sadWalk' },
];

// Mixamo → Rigify-Knochen des Mannequins (Namen wie in der glb-Datei)
const MAP = { Hips: 'DEF-hips', Spine: 'DEF-spine.001', Spine1: 'DEF-spine.002', Spine2: 'DEF-spine.003', Neck: 'DEF-neck', Head: 'DEF-head' };
for (const [s, t] of [['Left', 'L'], ['Right', 'R']]) {
  Object.assign(MAP, {
    [s + 'Shoulder']: `DEF-shoulder.${t}`, [s + 'Arm']: `DEF-upper_arm.${t}`, [s + 'ForeArm']: `DEF-forearm.${t}`, [s + 'Hand']: `DEF-hand.${t}`,
    [s + 'UpLeg']: `DEF-thigh.${t}`, [s + 'Leg']: `DEF-shin.${t}`, [s + 'Foot']: `DEF-foot.${t}`, [s + 'ToeBase']: `DEF-toe.${t}`,
  });
  for (const [f, g] of [['Index', 'f_index'], ['Middle', 'f_middle'], ['Ring', 'f_ring'], ['Pinky', 'f_pinky'], ['Thumb', 'thumb']])
    for (let i = 1; i <= 3; i++) MAP[`${s}Hand${f}${i}`] = `DEF-${g}0${i}.${t}`;
}
const san = n => THREE.PropertyBinding.sanitizeNodeName(n);
const mirrorName = n => n.replace(/Left|Right/, m => (m === 'Left' ? 'Right' : 'Left'));

const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const loadFBX = f => new FBXLoader().parse(ab(fs.readFileSync(path.join(dir, f))), '');

// Quelle: Ruhepose aus Idle.fbx (mit Skin)
const src = loadFBX('Idle.fbx');
src.updateMatrixWorld(true);
const sBone = {};
src.traverse(n => { if (n.isBone && !sBone[n.name.replace('mixamorig', '')]) sBone[n.name.replace('mixamorig', '')] = n; });
const sRest = {}, sHipsY = sBone.Hips.getWorldPosition(new THREE.Vector3()).y;
for (const k in MAP) sRest[k] = sBone[k].getWorldQuaternion(new THREE.Quaternion());

// Ziel: Mannequin aus player.glb
const glbBuf = fs.readFileSync(inGlb);
const gl = await new Promise((res, rej) => new GLTFLoader().parse(ab(glbBuf), '', res, rej));
gl.scene.updateMatrixWorld(true);
const tBones = [];
gl.scene.traverse(n => { if (n.isBone) tBones.push(n); });   // Eltern vor Kindern
const tRestW = new Map(), tRestL = new Map();
for (const b of tBones) { tRestW.set(b, b.getWorldQuaternion(new THREE.Quaternion())); tRestL.set(b, b.quaternion.clone()); }
const tByName = Object.fromEntries(tBones.map(b => [b.name, b]));
const inv = Object.fromEntries(Object.entries(MAP).map(([s, t]) => [san(t), s]));
const tHips = tByName[san('DEF-hips')];
const tHipsY = tHips.getWorldPosition(new THREE.Vector3()).y;
const hipsParentInv = tHips.parent.matrixWorld.clone().invert();
const parentRestW = b => (b.parent && b.parent.isBone ? null : b.parent.getWorldQuaternion(new THREE.Quaternion()));

const FPS = 30, S = tHipsY / sHipsY;
const mq = q => new THREE.Quaternion(q.x, -q.y, -q.z, q.w);    // Spiegelung an der Ebene x = 0
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), va = new THREE.Vector3(), vb = new THREE.Vector3();

function bake(clip, cfg, mirror) {
  const mixer = new THREE.AnimationMixer(src);
  const act = mixer.clipAction(clip); act.play();
  const t0 = cfg.t ? cfg.t[0] : 0, t1 = cfg.t ? Math.min(cfg.t[1], clip.duration) : clip.duration;
  const n = Math.max(2, Math.round((t1 - t0) * FPS) + 1);
  const frames = [];
  for (let i = 0; i < n; i++) {
    act.time = t0 + (t1 - t0) * i / (n - 1); mixer.update(0); src.updateMatrixWorld(true);
    const w = {};
    for (const k in MAP) {
      const sk = mirror ? mirrorName(k) : k;
      qa.copy(sBone[sk].getWorldQuaternion(qa)).multiply(qb.copy(sRest[sk]).invert());   // Welt-Änderung gegenüber Ruhe
      w[k] = mirror ? mq(qa) : qa.clone();
    }
    const hp = sBone.Hips.getWorldPosition(new THREE.Vector3());
    const ft = sBone.LeftFoot.getWorldPosition(va).add(sBone.RightFoot.getWorldPosition(vb)).multiplyScalar(.5).clone();
    if (mirror) { hp.x = -hp.x; ft.x = -ft.x; }
    frames.push({ w, hp, ft });
  }
  // waagerecht: Mitte zwischen den Füßen im Mittel auf den Ursprung, Hüfte relativ dazu
  const mx = frames.reduce((a, f) => a + f.ft.x, 0) / n, mz = frames.reduce((a, f) => a + f.ft.z, 0) / n;
  const times = new Float32Array(n), tracks = {};
  for (const b of tBones) tracks[b.name] = new Float32Array(n * 4);
  const hips = new Float32Array(n * 3);
  const W = new Map();
  frames.forEach((f, i) => {
    times[i] = i / FPS;
    for (const b of tBones) {
      const k = inv[b.name];
      const pw = b.parent && b.parent.isBone ? W.get(b.parent) : parentRestW(b);
      let w;
      if (k) w = f.w[k].clone().multiply(tRestW.get(b));
      else w = pw.clone().multiply(tRestL.get(b));
      W.set(b, w);
      const l = pw.clone().invert().multiply(w).normalize();
      if (i && l.dot(qa.fromArray(tracks[b.name], (i - 1) * 4)) < 0) l.set(-l.x, -l.y, -l.z, -l.w);   // gleiche Hemisphäre
      l.toArray(tracks[b.name], i * 4);
    }
    va.set((f.hp.x - mx) * S, f.hp.y * S, (f.hp.z - mz) * S);
    if (cfg.stripXZ) { va.x = (f.hp.x - f.ft.x) * S; va.z = (f.hp.z - f.ft.z) * S; }   // Clips mit Ortswechsel
    va.applyMatrix4(hipsParentInv).toArray(hips, i * 3);
  });
  return { times, tracks, hips };
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.readBinary(new Uint8Array(glbBuf));
const root = doc.getRoot(), buf = root.listBuffers()[0];
const nodeBy = Object.fromEntries(root.listNodes().map(n => [san(n.getName()), n]));
const list = ALL
  ? fs.readdirSync(dir).filter(f => f.endsWith('.fbx')).sort().map(f => ({ file: f, name: 'mx_' + f.replace(/\W+/g, '_').replace(/_fbx$/, '') }))
  : CLIPS;
for (const cfg of list) {
  if (!fs.existsSync(path.join(dir, cfg.file))) { console.warn('fehlt:', cfg.file); continue; }
  const clip = loadFBX(cfg.file).animations[0];
  for (const mirror of cfg.mirror ? [false, true] : [false]) {
    const name = cfg.name + (mirror ? 'M' : '');
    root.listAnimations().filter(a => a.getName() === name).forEach(a => a.dispose());
    const { times, tracks, hips } = bake(clip, cfg, mirror);
    const anim = doc.createAnimation(name);
    const inp = doc.createAccessor().setType('SCALAR').setArray(times).setBuffer(buf);
    const add = (node, pathName, arr, type) => {
      const s = doc.createAnimationSampler().setInput(inp).setOutput(doc.createAccessor().setType(type).setArray(arr).setBuffer(buf)).setInterpolation('LINEAR');
      anim.addSampler(s).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(pathName).setSampler(s));
    };
    for (const b of tBones) if (inv[b.name] || b === tHips) add(nodeBy[b.name], 'rotation', tracks[b.name], 'VEC4');
    add(nodeBy[tHips.name], 'translation', hips, 'VEC3');
    console.log(name.padEnd(12), (times[times.length - 1]).toFixed(2) + ' s', times.length, 'Bilder');
  }
}
await doc.transform(resample({ tolerance: 1e-4 }), prune());
// Drehungen als normierte 16-Bit-Werte speichern (glTF erlaubt das für rotation), halbiert die Größe
const names = new Set(list.flatMap(c => (c.mirror ? [c.name, c.name + 'M'] : [c.name])));
for (const an of root.listAnimations()) {
  if (!names.has(an.getName())) continue;
  for (const ch of an.listChannels()) {
    if (ch.getTargetPath() !== 'rotation') continue;
    const acc = ch.getSampler().getOutput(), f = acc.getArray();
    if (!(f instanceof Float32Array)) continue;
    acc.setArray(Int16Array.from(f, v => Math.round(Math.max(-1, Math.min(1, v)) * 32767))).setNormalized(true);
  }
}
fs.writeFileSync(outGlb, await io.writeBinary(doc));
console.log('geschrieben:', outGlb, (fs.statSync(outGlb).size / 1024).toFixed(0) + ' KB');
