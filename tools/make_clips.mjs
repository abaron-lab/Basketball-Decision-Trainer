// Baut eigene Basketball-Bewegungen als Keyframe-Clips für das Mannequin in player.glb:
// Sprungwurf, Korbleger (rechts/links), Brustpass, Überkopfpass, Fangen und Block.
// In Mixamo gibt es diese Bewegungen nicht, deshalb sind sie hier von Hand beschrieben.
//
// Aufruf (im Ordner mit three@0.149.0 und @gltf-transform/{core,extensions,functions} v3):
//   node tools/make_clips.mjs player.glb [ausgabe.glb]
//
// Verfahren: Jede Bewegung ist eine Folge von Schlüsselposen in Figur-Koordinaten (Meter, x = links der
// Figur, y = oben, z = vorn, Boden bei y = 0). Eine Pose beschreibt Hüfte (Absenken, Neigung), Oberkörper,
// Kopf, Fußgelenke, Handgelenke samt Handstellung (Handfläche N, Finger F) und den Ball. Zwischen den
// Posen wird pro Wert monoton kubisch interpoliert (keine Überschwinger), dann wird jedes Bild mit
// Zwei-Knochen-IK für Arme und Beine gelöst. Hände mit b = 1 greifen den Ball: Das Handgelenk liegt dann
// so, dass die Handfläche an der Balloberfläche liegt.
// Der Ball ist der zusätzliche Knoten „BALL“ (Kind von „Rig“): Das Spiel setzt den Ball an seine Position,
// solange er in den Händen liegt. Die Sprunghöhe steckt NICHT in den Clips, sie kommt wie bisher aus dem
// Spiel (actJY in index.html); die Clips sind darauf abgestimmt (Füße in der Luft, Landung).
// Mit mirror:true entsteht eine gespiegelte Fassung <name>M (andere Hand).
import fs from 'fs';
globalThis.self = globalThis; globalThis.window = globalThis;
globalThis.document = { createElementNS: () => ({ style: {}, addEventListener() {}, removeEventListener() {} }), createElement: () => ({ style: {} }) };
const THREE = await import('three');
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
const { NodeIO } = await import('@gltf-transform/core');
const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
const { resample, prune } = await import('@gltf-transform/functions');
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const [inGlb, outArg] = process.argv.slice(2);
const outGlb = outArg || inGlb;
if (!inGlb) { console.error('Aufruf: node tools/make_clips.mjs player.glb [ausgabe.glb]'); process.exit(1); }

// ---------------------------------------------------------------- Bewegungen
// Werte (fehlt einer in einer Pose, gilt der vorige):
//  hy Hüfte absenken, hx/hz Hüfte verschieben, hp/hr/hw Hüfte neigen/kippen/drehen (rad, hp > 0 = nach vorn)
//  sp/sr/sw Oberkörper neigen/kippen/drehen (auf drei Wirbel verteilt), np Kopf neigen, hdw Kopf drehen
//  B Ball [x,y,z]
//  Lf/Rf Fußgelenk [x,y,z], Lfp/Rfp Fußspitze nach unten (rad), Lt/Rt Zehen flach am Boden (0..1)
//  Lb/Rb Hand am Ball (0..1), LP/RP Handgelenk frei [x,y,z], LN/RN Handfläche zeigt nach, LF/RF Finger zeigen nach,
//  LE/RE Ellbogen zeigt (Richtung ab Schulter), Lsh/Rsh Schulter heben (rad)
const STAND = {
  hy: .04, hx: 0, hz: 0, hp: .04, hr: 0, hw: 0, sp: .04, sr: 0, sw: 0, np: 0, hdw: 0,
  B: [0, 1.15, .32],
  Lf: [.14, .104, .0], Rf: [-.14, .104, .04], Lfp: 0, Rfp: 0, Lt: 1, Rt: 1,
  Lb: 0, Rb: 0, LP: [.22, .98, .18], RP: [-.22, .98, .18],
  LN: [-1, 0, 0], RN: [1, 0, 0], LF: [0, -.3, 1], RF: [0, -.3, 1],
  LE: [1, -.6, -.4], RE: [-1, -.6, -.4], Lsh: 0, Rsh: 0,
};
const HOLD = { Lb: 1, Rb: 1, LN: [-1, 0, .05], RN: [1, 0, .05], LF: [0, .55, .85], RF: [0, .55, .85], LE: [1, -.7, -.2], RE: [-1, -.7, -.2] };

export const CLIPS = {
  // Sprungwurf, rechte Hand. Im Spiel 1,0 s; Absprung bei 0,14 s, Abwurf bei 0,24 s (shootFrom), Landung bei 0,62 s.
  shot: { d: 1.0, keys: [
    { t: 0, ...HOLD, B: [-.02, 1.15, .32], hy: .06, Rf: [-.15, .104, .08], Lf: [.13, .104, -.02] },
    { t: .10, hy: .17, hp: .2, sp: .1, np: -.05, B: [-.05, 1.05, .32] },
    { t: .14, hy: -.05, hp: .02, sp: -.02, Lfp: .55, Rfp: .55, Lf: [.12, .19, -.04], Rf: [-.14, .19, .06], Lt: 1, Rt: 1,
      B: [-.08, 1.6, .25], RN: [.35, .65, .6], RF: [.05, .7, -.6], RE: [-.2, -.5, 1], LN: [-1, 0, .1], LF: [0, .9, .3], LE: [1, -.3, .3], Rsh: .1 },
    { t: .19, Lt: 0, Rt: 0, Lfp: .7, Rfp: .7, Lf: [.11, .14, -.06], Rf: [-.13, .14, .04], np: -.07,
      B: [-.09, 1.9, .2], RN: [.12, .93, .3], RF: [0, .3, -.95], RE: [-.15, -.6, 1], Rsh: .2 },
    { t: .24, B: [-.09, 2.1, .28], RN: [.05, .8, .6], RF: [0, .6, -.8], Rsh: .3, Lb: 1 },
    { t: .27, Rb: 0, Lb: 0, RP: [-.12, 2.1, .36], RN: [0, .1, 1], RF: [0, .99, -.1], LP: [.17, 1.8, .26], LN: [-1, 0, .1], LF: [0, .95, .25] },
    { t: .34, RP: [-.11, 2.14, .44], RN: [0, -.7, -.7], RF: [0, -.7, .7], Rsh: .3, LP: [.2, 1.72, .28], LN: [-.8, 0, .6] },
    { t: .58, Lf: [.12, .15, -.04], Rf: [-.14, .15, .06], Lfp: .45, Rfp: .45, hy: -.03 },
    { t: .64, Lf: [.14, .104, -.02], Rf: [-.15, .104, .08], Lfp: 0, Rfp: 0, Lt: 1, Rt: 1, hy: .1, hp: .14, np: -.1 },
    { t: .72, hy: .15, hp: .2, sp: .08, RP: [-.15, 1.75, .38], LP: [.2, 1.55, .3], Rsh: .15 },
    { t: 1.0, hy: .05, hp: .05, sp: .04, np: 0, RP: [-.22, 1.05, .2], LP: [.22, 1.0, .18], RN: [1, 0, 0], RF: [0, -.3, 1], LN: [-1, 0, 0], LF: [0, -.3, 1],
      RE: [-1, -.6, -.4], LE: [1, -.6, -.4], Rsh: 0 },
  ] },
  // Korbleger mit der rechten Hand, Absprung links, rechtes Knie hoch. Im Spiel 0,85 s, Sprung ab 0 s,
  // Abwurf bei 0,28 s (layShot), Landung bei 0,62 s. layupM = linke Hand.
  layup: { d: .85, mirror: true, keys: [
    { t: 0, ...HOLD, hy: .12, hp: .22, sp: .08, np: -.1, B: [-.08, 1.2, .3],
      Lf: [.1, .104, .06], Rf: [-.1, .22, -.28], Rfp: .5, Rt: 0, Lt: 1 },
    { t: .12, hy: -.02, hp: .05, sp: -.02, np: -.2, Lf: [.1, .1, -.12], Lfp: .75, Lt: 0, Rf: [-.11, .44, .22], Rfp: .3,
      B: [-.12, 1.65, .3], RN: [.4, .8, .1], RF: [0, .1, -1], RE: [-.4, -.5, 1], Rsh: .15 },
    { t: .28, B: [-.16, 2.32, .36], RN: [0, .97, .1], RF: [0, -.1, 1], Rsh: .35, LN: [-1, 0, .2], LF: [0, .9, .4],
      Lf: [.1, .2, -.12], Rf: [-.11, .5, .26] },
    { t: .31, Rb: 0, Lb: 0, RP: [-.15, 2.2, .38], LP: [.32, 1.15, .24], LN: [-.3, 0, 1], LF: [0, 1, 0], LE: [1, -.4, 0] },
    { t: .45, RP: [-.15, 2.15, .36], RN: [0, .3, .95], RF: [0, .95, -.3], Rf: [-.12, .36, .16], Lf: [.11, .18, -.06], Lfp: .5, Rfp: .45, np: -.12 },
    { t: .62, Lf: [.13, .104, -.02], Rf: [-.13, .104, .06], Lfp: 0, Rfp: 0, Lt: 1, Rt: 1, hy: .08, hp: .12 },
    { t: .7, hy: .16, hp: .2, sp: .08, RP: [-.25, 1.5, .3], LP: [.25, 1.3, .25], Rsh: 0, np: 0 },
    { t: .85, hy: .06, hp: .06, sp: .04, RP: [-.22, 1.05, .2], LP: [.22, 1.0, .18], RN: [1, 0, 0], RF: [0, -.3, 1], LN: [-1, 0, 0], LF: [0, -.3, 1],
      RE: [-1, -.6, -.4], LE: [1, -.6, -.4] },
  ] },
  // Brustpass: Der Ball fliegt im Spiel schon bei 0 s los, die Arme stoßen nach vorn, Daumen zeigen am Ende nach unten.
  pass: { d: .4, keys: [
    { t: 0, ...HOLD, B: [0, 1.2, .3], hy: .07, hp: .06, sp: .04, Lb: .6, Rb: .6, LP: [.13, 1.18, .3], RP: [-.13, 1.18, .3], LE: [1, -.5, -.3], RE: [-1, -.5, -.3] },
    { t: .1, Lb: 0, Rb: 0, LP: [.1, 1.25, .58], RP: [-.1, 1.25, .58], LN: [.7, -.1, .7], RN: [-.7, -.1, .7], LF: [-.5, -.3, .8], RF: [.5, -.3, .8],
      hp: .16, sp: .1, hy: .09, hz: .04, Lf: [.14, .104, .02], Rf: [-.14, .104, .06] },
    { t: .2, LP: [.12, 1.2, .56] },
    { t: .4, hy: .05, hp: .06, sp: .04, hz: 0, LP: [.2, 1.02, .25], RP: [-.2, 1.02, .25], LN: [-1, 0, .2], RN: [1, 0, .2], LF: [0, -.3, 1], RF: [0, -.3, 1] },
  ] },
  // Überkopfpass für lange Pässe (über 9 m)
  passO: { d: .4, keys: [
    { t: 0, ...HOLD, hy: .07, hp: -.06, sp: -.08, np: -.08, Lb: .5, Rb: .5, B: [0, 1.4, .22], LP: [.13, 1.45, .2], RP: [-.13, 1.45, .2],
      LN: [-.9, .1, .4], RN: [.9, .1, .4], LF: [0, .8, .6], RF: [0, .8, .6], LE: [1, -.2, .3], RE: [-1, -.2, .3], Lsh: .15, Rsh: .15 },
    { t: .12, Lb: 0, Rb: 0, hp: .16, sp: .12, np: .02, hy: .1, hz: .05, LP: [.12, 1.82, .52], RP: [-.12, 1.82, .52], LN: [.3, -.5, .8], RN: [-.3, -.5, .8],
      LF: [-.2, .8, .5], RF: [.2, .8, .5], Lsh: .3, Rsh: .3, LE: [1, -.3, .3], RE: [-1, -.3, .3] },
    { t: .22, LF: [-.1, -.3, .95], RF: [.1, -.3, .95], LN: [.2, -.9, -.3], RN: [-.2, -.9, -.3] },
    { t: .4, hp: .06, sp: .04, np: 0, hy: .05, hz: 0, LP: [.22, 1.1, .25], RP: [-.22, 1.1, .25], LN: [-1, 0, .2], RN: [1, 0, .2], LF: [0, -.3, 1], RF: [0, -.3, 1],
      Lsh: 0, Rsh: 0, LE: [1, -.6, -.4], RE: [-1, -.6, -.4] },
  ] },
  // Fangen: Hände zeigen dem Ball entgegen, dann zur Brust ziehen und leicht in die Knie (endet in der Haltepose des Spiels)
  catch: { d: .4, keys: [
    { t: 0, ...HOLD, B: [0, 1.24, .5], LN: [-.8, 0, .6], RN: [.8, 0, .6], LF: [0, .9, .2], RF: [0, .9, .2], hy: .05, LE: [1, -.5, .2], RE: [-1, -.5, .2] },
    { t: .14, B: [0, 1.17, .36], hy: .11, hp: .1, sp: .06, LN: [-1, 0, .05], RN: [1, 0, .05], LF: [0, .55, .85], RF: [0, .55, .85] },
    { t: .4, B: [0, 1.18, .33], hy: .06, hp: .05, sp: .04, LE: [1, -.7, -.2], RE: [-1, -.7, -.2] },
  ] },
  // Block / Arme hoch: beidbeiniger Sprung (Spiel: Sprung bis 0,62 s), Hände senkrecht nach oben
  block: { d: .8, keys: [
    { t: 0, hy: .12, hp: .12, sp: .06, LP: [.22, 1.5, .25], RP: [-.22, 1.5, .25], LN: [0, 0, 1], RN: [0, 0, 1], LF: [0, 1, 0], RF: [0, 1, 0],
      LE: [1, -.3, .2], RE: [-1, -.3, .2], Lf: [.15, .104, .0], Rf: [-.15, .104, .02] },
    { t: .08, hy: -.04, hp: 0, sp: -.06, np: -.15, Lfp: .6, Rfp: .6, Lt: 0, Rt: 0, Lf: [.13, .17, -.04], Rf: [-.13, .17, -.02],
      LP: [.2, 2.25, .14], RP: [-.2, 2.25, .14], Lsh: .4, Rsh: .4, LE: [1, 0, 0], RE: [-1, 0, 0] },
    { t: .3, Lf: [.13, .26, -.1], Rf: [-.13, .26, -.08], hy: .02, LP: [.19, 2.3, .16], RP: [-.19, 2.3, .16] },
    { t: .56, Lf: [.14, .15, -.02], Rf: [-.14, .15, 0], hy: -.03 },
    { t: .64, Lf: [.15, .104, .0], Rf: [-.15, .104, .02], Lfp: 0, Rfp: 0, Lt: 1, Rt: 1, hy: .13, hp: .12, LP: [.22, 2.05, .2], RP: [-.22, 2.05, .2] },
    { t: .8, hy: .06, hp: .05, np: 0, LP: [.24, 2.0, .2], RP: [-.24, 2.0, .2], Lsh: .3, Rsh: .3 },
  ] },
};

// ---------------------------------------------------------------- Interpolation
// monotone kubische Hermite-Interpolation (Fritsch–Carlson) über die Schlüsselposen
function track(ts, vs) {
  const n = ts.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return t => {
    if (t <= ts[0]) return vs[0]; if (t >= ts[n - 1]) return vs[n - 1];
    let i = 0; while (t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}
function sampler(keys) {
  const full = []; let cur = { ...STAND };
  for (const k of keys) { cur = { ...cur, ...k }; full.push(cur); }
  const ts = full.map(k => k.t), fn = {};
  for (const key in STAND) {
    if (Array.isArray(STAND[key])) { const c = [0, 1, 2].map(j => track(ts, full.map(k => k[key][j]))); fn[key] = t => c.map(f => f(t)); }
    else fn[key] = track(ts, full.map(k => k[key]));
  }
  return t => Object.fromEntries(Object.entries(fn).map(([k, f]) => [k, f(t)]));
}
const NEG = new Set(['hx', 'hr', 'hw', 'sr', 'sw', 'hdw']);
function mirrorPose(P) {
  const o = {};
  for (const k in P) {
    let nk = k, v = P[k];
    if (/^[LR]/.test(k) && k.length <= 3 && k !== 'B') nk = (k[0] === 'L' ? 'R' : 'L') + k.slice(1);
    if (Array.isArray(v)) v = [-v[0], v[1], v[2]];
    else if (NEG.has(k)) v = -v;
    o[nk] = v;
  }
  return o;
}

// ---------------------------------------------------------------- Skelett
const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const glbBuf = fs.readFileSync(inGlb);
const gl = await new Promise((res, rej) => new GLTFLoader().parse(ab(glbBuf), '', res, rej));
const scene = gl.scene; scene.updateMatrixWorld(true);
const bones = []; scene.traverse(n => { if (n.isBone) bones.push(n); });
const B = n => scene.getObjectByName('DEF-' + n);
const restQ = new Map(bones.map(b => [b, b.quaternion.clone()])), restP = new Map(bones.map(b => [b, b.position.clone()]));
const hips = B('hips'), restHipsW = hips.getWorldPosition(V());
const restW = n => B(n).getWorldQuaternion(new THREE.Quaternion());
const footRestW = { L: restW('footL'), R: restW('footR') }, toeRestW = { L: restW('toeL'), R: restW('toeR') };
// Finger: entspannt wie in der Grundstellung (Mixamo „Idle“), sonst die Ruhepose
const fingers = bones.filter(b => /f_|thumb/.test(b.name)), fingerQ = new Map();
{ const c = gl.animations.find(a => a.name === 'ready') || gl.animations.find(a => a.name === 'idle');
  const mx = new THREE.AnimationMixer(scene); const a = mx.clipAction(c); a.play(); a.time = 0; mx.update(0);
  fingers.forEach(f => fingerQ.set(f, f.quaternion.clone())); mx.stopAllAction(); mx.uncacheRoot(scene); }

const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _m = new THREE.Matrix4();
function rotW(bone, q) { const pq = bone.parent.getWorldQuaternion(_q3); bone.quaternion.premultiply(_q2.copy(pq).invert().multiply(q).multiply(pq)); bone.updateMatrixWorld(true); }
function setW(bone, q) { const pq = bone.parent.getWorldQuaternion(_q3); bone.quaternion.copy(_q2.copy(pq).invert().multiply(q)); bone.updateMatrixWorld(true); }
const qE = (p, y, r) => new THREE.Quaternion().setFromEuler(new THREE.Euler(p, y, r, 'YXZ'));
function ik2(up, lo, end, T, pole) {
  const S = up.getWorldPosition(V()), E = lo.getWorldPosition(V()), H = end.getWorldPosition(V());
  const la = S.distanceTo(E), lb = E.distanceTo(H), d = Math.min(Math.max(S.distanceTo(T), Math.abs(la - lb) + .01), la + lb - .002);
  const u = V().subVectors(S, E), v = V().subVectors(H, E), th0 = u.angleTo(v), th1 = Math.acos(Math.min(1, Math.max(-1, (la * la + lb * lb - d * d) / (2 * la * lb))));
  let n = u.clone().cross(v); if (n.lengthSq() < 1e-8) n = V().subVectors(T, S).cross(V().subVectors(pole, S));
  if (n.lengthSq() > 1e-10) rotW(lo, new THREE.Quaternion().setFromAxisAngle(n.normalize(), th1 - th0));
  end.getWorldPosition(H);
  rotW(up, new THREE.Quaternion().setFromUnitVectors(V().subVectors(H, S).normalize(), V().subVectors(T, S).normalize()));
  lo.getWorldPosition(E); const ax = V().subVectors(T, S).normalize(), e = V().subVectors(E, S), pv = V().subVectors(pole, S);
  e.addScaledVector(ax, -e.dot(ax)); pv.addScaledVector(ax, -pv.dot(ax));
  if (e.lengthSq() > 1e-6 && pv.lengthSq() > 1e-6) { let a = e.angleTo(pv); if (ax.dot(e.clone().cross(pv)) < 0) a = -a; rotW(up, new THREE.Quaternion().setFromAxisAngle(ax, a)); }
}
// Hand ausrichten: Finger (lokal +Y) nach F, Handfläche nach N (links lokal +X, rechts lokal −X)
function handQ(side, N, F) {
  const f = V(...F).normalize(), n = V(...N); n.addScaledVector(f, -n.dot(f)).normalize();
  const x = side === 'L' ? n : n.clone().negate(), z = V().crossVectors(x, f);
  return new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(x, f, z));
}
const PALM = .145, FING = .07;   // Handgelenk → Ballmitte: Handfläche liegt am Ball (Radius 0,122 m)

function solve(P) {
  for (const b of bones) { b.quaternion.copy(restQ.get(b)); b.position.copy(restP.get(b)); }
  fingers.forEach(f => f.quaternion.copy(fingerQ.get(f)));
  scene.updateMatrixWorld(true);
  hips.position.copy(hips.parent.worldToLocal(restHipsW.clone().add(V(P.hx, -P.hy, P.hz))));
  hips.updateMatrixWorld(true);
  rotW(hips, qE(P.hp, P.hw, P.hr));
  [['spine001', .3], ['spine002', .35], ['spine003', .35]].forEach(([n, f]) => rotW(B(n), qE(P.sp * f, P.sw * f, P.sr * f)));
  rotW(B('neck'), qE(P.np * .4, P.hdw * .4, 0)); rotW(B('head'), qE(P.np * .6, P.hdw * .6, 0));
  const ball = V(...P.B);
  for (const s of ['L', 'R']) {
    const sg = s === 'L' ? 1 : -1;
    rotW(B('shoulder' + s), qE(0, 0, sg * P[s + 'sh']));
    const N = V(...P[s + 'N']).normalize(), F = V(...P[s + 'F']).normalize();
    const fo = F.clone().addScaledVector(N, -F.dot(N)).normalize();
    const onBall = ball.clone().addScaledVector(N, -PALM).addScaledVector(fo, -FING);
    const T = V(...P[s + 'P']).lerp(onBall, Math.min(1, Math.max(0, P[s + 'b'])));
    const S = B('upper_arm' + s).getWorldPosition(V());
    ik2(B('upper_arm' + s), B('forearm' + s), B('hand' + s), T, S.clone().add(V(...P[s + 'E'])));
    setW(B('hand' + s), handQ(s, P[s + 'N'], P[s + 'F']));
    // Beine
    const th = B('thigh' + s), K = th.getWorldPosition(V());
    ik2(th, B('shin' + s), B('foot' + s), V(...P[s + 'f']), K.clone().add(V(sg * .15, -.3, 1)));
    const fq = qE(P[s + 'fp'], sg * .12, 0).multiply(footRestW[s]);
    setW(B('foot' + s), fq);
    const tq = qE(0, sg * .12, 0).multiply(toeRestW[s]);
    setW(B('toe' + s), fq.clone().multiply(footRestW[s].clone().invert()).multiply(toeRestW[s]).slerp(tq, Math.min(1, Math.max(0, P[s + 't']))));
  }
  return ball;
}

// ---------------------------------------------------------------- Schreiben
const FPS = 30;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.readBinary(new Uint8Array(glbBuf));
const root = doc.getRoot(), buf = root.listBuffers()[0];
const san = n => THREE.PropertyBinding.sanitizeNodeName(n);
const nodeBy = Object.fromEntries(root.listNodes().map(n => [san(n.getName()), n]));
let ballNode = nodeBy.BALL;
if (!ballNode) {
  ballNode = doc.createNode('BALL').setTranslation(STAND.B);
  (nodeBy.Rig || root.listScenes()[0].listChildren()[0]).addChild(ballNode);
}
const made = [];
for (const [name, cfg] of Object.entries(CLIPS)) {
  const at = sampler(cfg.keys);
  for (const mirror of cfg.mirror ? [false, true] : [false]) {
    const nm = name + (mirror ? 'M' : '');
    root.listAnimations().filter(a => a.getName() === nm).forEach(a => a.dispose());
    const n = Math.round(cfg.d * FPS) + 1, times = new Float32Array(n);
    const rot = new Map(bones.map(b => [b, new Float32Array(n * 4)])), hp = new Float32Array(n * 3), bp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = Math.min(cfg.d, i / FPS); times[i] = t;
      let P = at(t); if (mirror) P = mirrorPose(P);
      const ball = solve(P);
      for (const b of bones) {
        const q = b.quaternion.clone().normalize(), arr = rot.get(b);
        if (i && q.dot(_q1.fromArray(arr, (i - 1) * 4)) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
        q.toArray(arr, i * 4);
      }
      hips.position.toArray(hp, i * 3); ball.toArray(bp, i * 3);
    }
    const anim = doc.createAnimation(nm);
    const inp = doc.createAccessor().setType('SCALAR').setArray(times).setBuffer(buf);
    const add = (node, path, arr, type) => {
      const s = doc.createAnimationSampler().setInput(inp).setOutput(doc.createAccessor().setType(type).setArray(arr).setBuffer(buf)).setInterpolation('LINEAR');
      anim.addSampler(s).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(s));
    };
    for (const b of bones) if (b.name !== 'root') add(nodeBy[b.name], 'rotation', rot.get(b), 'VEC4');
    add(nodeBy[hips.name], 'translation', hp, 'VEC3');
    add(ballNode, 'translation', bp, 'VEC3');
    made.push(nm);
    console.log(nm.padEnd(8), cfg.d.toFixed(2) + ' s', n, 'Bilder');
  }
}
await doc.transform(resample({ tolerance: 1e-4 }), prune({ keepLeaves: true }));
for (const an of root.listAnimations()) {
  if (!made.includes(an.getName())) continue;
  for (const ch of an.listChannels()) {
    if (ch.getTargetPath() !== 'rotation') continue;
    const acc = ch.getSampler().getOutput(), f = acc.getArray();
    if (f instanceof Float32Array) acc.setArray(Int16Array.from(f, v => Math.round(Math.max(-1, Math.min(1, v)) * 32767))).setNormalized(true);
  }
}
fs.writeFileSync(outGlb, await io.writeBinary(doc));
console.log('geschrieben:', outGlb, (fs.statSync(outGlb).size / 1024).toFixed(0) + ' KB');
