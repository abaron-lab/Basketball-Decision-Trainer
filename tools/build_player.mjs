// Baut player.glb aus der „Universal Animation Library“ von Quaternius (CC0).
// Quelle: https://opengameart.org/content/universal-animation-library
//   (universal_animation_librarystandard.zip → Godot/AnimationLibrary_Godot_Standard.glb)
// Aufruf (einmalig, Ergebnis wird eingecheckt):
//   npm i @gltf-transform/core@3 @gltf-transform/functions@3 @gltf-transform/extensions@3
//   node tools/build_player.mjs <AnimationLibrary_Godot_Standard.glb> player.glb
// Was passiert:
//  - nur die Clips aus KEEP bleiben, umbenannt in kurze Namen
//  - Skalierungs- und Verschiebungsspuren fallen weg (außer Hüfte), Clips sind schon „in place“
//  - das Mannequin wird nach Körperteilen in Materialien geteilt (jersey, shorts, skin, sock, shoe),
//    damit das Spiel Trikot, Hose, Haut und Schuhe pro Spieler einfärben kann
//  - Geometrie und Animation werden quantisiert (KHR_mesh_quantization, braucht keinen Decoder)
import {NodeIO} from '@gltf-transform/core';
import {KHRMeshQuantization} from '@gltf-transform/extensions';
import {prune, dedup, quantize, resample} from '@gltf-transform/functions';

const [src, out] = process.argv.slice(2);
const KEEP = {Idle_Loop:'idle', Walk_Loop:'walk', Jog_Fwd_Loop:'jog', Sprint_Loop:'sprint',
  Crouch_Idle_Loop:'crouch', Crouch_Fwd_Loop:'crouchFwd', Jump_Loop:'jump', Dance_Loop:'dance'};
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
const doc = await io.read(src);
const root = doc.getRoot();

// Clips
for (const a of root.listAnimations()) {
  if (!KEEP[a.getName()]) { a.listChannels().forEach(c => c.dispose()); a.listSamplers().forEach(s => s.dispose()); a.dispose(); continue; }
  a.setName(KEEP[a.getName()]);
  for (const c of a.listChannels()) {
    const n = c.getTargetNode().getName(), p = c.getTargetPath();
    if (p === 'scale' || (p === 'translation' && n !== 'DEF-hips')) { c.getSampler().dispose(); c.dispose(); }
  }
}

// Körperteile
const REG = j => {
  j = j.replace('DEF-', '');
  if (/^spine|^shoulder/.test(j)) return 'jersey';
  if (/^hips|^thigh/.test(j)) return 'shorts';
  if (/^foot|^toe/.test(j)) return 'shoe';
  if (/^shin/.test(j)) return 'shin';
  return 'skin';
};
const skin = root.listSkins()[0], J = skin.listJoints().map(n => n.getName());
const mats = {};
// eigene Grundfarben, damit dedup() die Materialien nicht zusammenlegt (das Spiel färbt sie ohnehin neu ein)
const COL = {jersey: [.12, .37, .88, 1], shorts: [.1, .31, .75, 1], skin: [.78, .53, .26, 1], sock: [1, 1, 1, 1], shoe: [.15, .15, .15, 1]};
const mat = k => mats[k] || (mats[k] = doc.createMaterial(k).setBaseColorFactor(COL[k]).setRoughnessFactor(.6));
for (const mesh of root.listMeshes()) {
  // beide Teile des Mannequins (Körper und Gelenke) zu einem Satz Vertices zusammenlegen
  const prims = mesh.listPrimitives(), SEM = ['POSITION', 'NORMAL', 'JOINTS_0', 'WEIGHTS_0'];
  const data = Object.fromEntries(SEM.map(k => [k, []])), idx = [];
  const v = [], j = [], w = [];
  let base = 0;
  for (const prim of prims) {
    const n = prim.getAttribute('POSITION').getCount();
    for (const k of SEM) { const A = prim.getAttribute(k), e = []; for (let i = 0; i < n; i++) data[k].push(...A.getElement(i, e)); }
    const I = prim.getIndices(); for (let t = 0; t < I.getCount(); t++) idx.push(I.getScalar(t) + base);
    base += n;
  }
  const buf = root.listBuffers()[0], acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const P = acc('VEC3', new Float32Array(data.POSITION)), N = acc('VEC3', new Float32Array(data.NORMAL)),
    JT = acc('VEC4', new Uint8Array(data.JOINTS_0)), W = acc('VEC4', new Float32Array(data.WEIGHTS_0));
  const regOf = i => { JT.getElement(i, j); W.getElement(i, w); let b = 0; for (let k = 1; k < 4; k++) if (w[k] > w[b]) b = k;
    let r = REG(J[j[b]]); if (r === 'shin') { P.getElement(i, v); r = v[1] < .3 ? 'sock' : 'skin'; } return r; };
  const tris = {};
  for (let t = 0; t < idx.length; t += 3) {
    const ids = [idx[t], idx[t + 1], idx[t + 2]], rs = ids.map(regOf);
    const r = rs[1] === rs[2] ? rs[1] : rs[0];
    (tris[r] || (tris[r] = [])).push(...ids);
  }
  for (const [r, ids] of Object.entries(tris)) {
    const np = doc.createPrimitive().setMaterial(mat(r)).setAttribute('POSITION', P).setAttribute('NORMAL', N)
      .setAttribute('JOINTS_0', JT).setAttribute('WEIGHTS_0', W).setIndices(acc('SCALAR', new Uint16Array(ids)));
    mesh.addPrimitive(np);
  }
  for (const prim of prims) { mesh.removePrimitive(prim); prim.dispose(); }
}
for (const m of root.listMaterials()) if (!Object.values(mats).includes(m)) m.dispose();

await doc.transform(resample(), dedup(), prune(), quantize({quantizeNormal: 8, quantizePosition: 14}), prune());
await io.write(out, doc);
console.log('ok', out, root.listAnimations().map(a => a.getName()).join(','), Object.keys(mats).join(','));
