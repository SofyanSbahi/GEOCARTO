/* rc.4 — gestes tactiles du simulateur de profil (étape « Relevé ») : seuls les pointeurs « touch » sont pris en charge (la souris garde le
   comportement du bureau) ; appui bref = sélection, appui maintenu = loupe puis sélection précise, pincement = zoom ; aucune altitude n'est
   fournie par ces gestes (ils ne transmettent qu'une position). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.document = { createElement: () => ({ style: {}, setAttribute() { }, remove() { }, className: '' }) };
globalThis.requestAnimationFrame = () => 0; globalThis.cancelAnimationFrame = () => { };
const { attachTouch } = await import('../js/pages/profile-touch.js');

function rig() {
  const H = {}, calls = { select: [], zoom: [], pan: [] }; let Z = 1;
  const M = { cv: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 360, height: 250 }), setPointerCapture() { } }, box: { append() { } },
    zoom: () => Z, zoomAt: (z, x, y) => { Z = Math.min(4, Math.max(1, z)); calls.zoom.push(Z); }, panBy: (dx, dy) => calls.pan.push([dx, dy]),
    size: () => ({ w: 360, hh: 250 }), pos: e => ({ x: e.clientX / 3, y: e.clientY / 3 }), lens: () => ({ beginPath() { }, moveTo() { }, lineTo() { }, stroke() { } }) };
  const on = (t, e, f) => { H[e] = f; };
  attachTouch(M, { on, select: (p, q, o) => calls.select.push({ p, o }) });
  const ev = (type, id, x, y, pt = 'touch') => H[type]({ type, pointerId: id, pointerType: pt, clientX: x, clientY: y, preventDefault() { } });
  return { ev, calls, setZ: z => { Z = z; } };
}
const wait = ms => new Promise(r => setTimeout(r, ms));

test('la souris et le stylet sont ignorés (comportement du bureau inchangé)', () => {
  const { ev, calls } = rig(); ev('pointerdown', 1, 100, 100, 'mouse'); ev('pointerup', 1, 100, 100, 'mouse'); ev('pointerdown', 2, 100, 100, 'pen'); ev('pointerup', 2, 100, 100, 'pen');
  assert.equal(calls.select.length, 0);
});
test('appui bref : une sélection, non précise, à la position du doigt', () => {
  const { ev, calls } = rig(); ev('pointerdown', 1, 90, 60); ev('pointerup', 1, 90, 60);
  assert.equal(calls.select.length, 1); assert.deepEqual(calls.select[0].p, { x: 30, y: 20 }); assert.equal(calls.select[0].o.precise, false);
});
test('appui maintenu : loupe, puis sélection PRÉCISE au point visé (après déplacement)', async () => {
  const { ev, calls } = rig(); ev('pointerdown', 1, 90, 60); await wait(450); ev('pointermove', 1, 99, 66); ev('pointerup', 1, 99, 66);
  assert.equal(calls.select.length, 1); assert.equal(calls.select[0].o.precise, true); assert.deepEqual(calls.select[0].p, { x: 33, y: 22 });
});
test('glisser sans zoom : ni sélection ni déplacement ; avec zoom : déplacement de la carte', () => {
  let r = rig(); r.ev('pointerdown', 1, 50, 50); r.ev('pointermove', 1, 90, 50); r.ev('pointerup', 1, 90, 50); assert.equal(r.calls.select.length, 0); assert.equal(r.calls.pan.length, 0);
  r = rig(); r.setZ(2); r.ev('pointerdown', 1, 50, 50); r.ev('pointermove', 1, 90, 50); r.ev('pointermove', 1, 100, 60); r.ev('pointerup', 1, 100, 60);
  assert.equal(r.calls.select.length, 0); assert.ok(r.calls.pan.length >= 1);
});
test('pincement à deux doigts : zoom, jamais de sélection', () => {
  const { ev, calls } = rig(); ev('pointerdown', 1, 150, 100); ev('pointerdown', 2, 210, 100); ev('pointermove', 1, 120, 100); ev('pointermove', 2, 240, 100); ev('pointerup', 1, 120, 100); ev('pointerup', 2, 240, 100);
  assert.equal(calls.select.length, 0); assert.ok(calls.zoom.at(-1) > 1.9, `zoom ${calls.zoom.at(-1)}`);
});
test('le simulateur garde le gestionnaire souris inchangé et ignore le tactile dans celui-ci', () => {
  const src = fs.readFileSync(new URL('../js/pages/profile.js', import.meta.url), 'utf8');
  assert.match(src, /on\(M\.cv,'pointerdown',e=>\{if\(e\.pointerType==='touch'\)return;if\(pop\)/);
  assert.ok(!/bubble\([^)]*S\.cross\[bi\]\.z/.test(src), 'aucune bulle ne doit afficher l\'altitude avant la réponse');
});
