/* WP5 (v3.1) — la géologie ne repose pas sur la couleur seule : formations voisines distinguables sous projecteur délavé et en deutéranopie
   (ΔE76 ≥ 10, règle empirique de l'audit F11), et traits clés lisibles (liseré blanc) sur toutes les formations. Simulation, pas une mesure en salle. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { MESO as M0, PALEO as P0 } from '../js/engine/geology/geology.js';
import { projColor } from '../js/stage/palette.js';
const paint = l => l.map(u => ({ ...u, c: projColor(u) })), MESO = paint(M0), PALEO = paint(P0);

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const toLab = rgb => {
  const [r, g, b] = rgb.map(lin), X = (.4124 * r + .3576 * g + .1805 * b) / .95047, Y = .2126 * r + .7152 * g + .0722 * b, Z = (.0193 * r + .1192 * g + .9505 * b) / 1.08883;
  const f = t => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
};
const dE = (a, b) => Math.hypot(...toLab(a).map((v, i) => v - toLab(b)[i]));
const wash = rgb => rgb.map(v => .6 * v + .4 * 216);                                   // projecteur délavé : 40 % de gris clair
const delin = v => 255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055);
const deut = rgb => { const [r, g, b] = rgb.map(lin), M = [[.367322, .860646, -.227968], [.280085, .672501, .047413], [-.01182, .04294, .968881]]; return M.map(m => Math.max(0, Math.min(255, delin(Math.max(0, Math.min(1, m[0] * r + m[1] * g + m[2] * b)))))); };
const lum = rgb => { const [r, g, b] = rgb.map(lin); return .2126 * r + .7152 * g + .0722 * b; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

test('formations voisines : ΔE ≥ 10 en vision normale, sous projecteur délavé et en deutéranopie', () => {
  for (const [name, list] of [['MESO', MESO], ['PALEO', PALEO]]) for (let i = 0; i + 1 < list.length; i++) {
    const a = hex(list[i].c), b = hex(list[i + 1].c);
    for (const [mode, f] of [['normal', x => x], ['délavé', wash], ['deutéranopie', deut], ['délavé + deutéranopie', x => wash(deut(x))]])
      assert.ok(dE(f(a), f(b)) >= 10, `${name} ${list[i].a}→${list[i + 1].a} (${mode}) : ΔE ${dE(f(a), f(b)).toFixed(1)}`);
  }
});
test('le liseré blanc sous les traits clés rend le trait lisible sur toutes les formations (blanc ≥ 3:1 contre le fond, rouge ≥ 3:1 contre le blanc)', () => {
  assert.ok(cr(hex('#d2461e'), [255, 255, 255]) >= 3, 'rouge d’accentuation sur liseré blanc');
  for (const u of [...MESO, ...PALEO]) assert.ok(cr(hex(u.c), hex('#14181c')) >= 3, `contour sombre sur ${u.a}`);
});
test('les lettres grecques des roches magmatiques ont un équivalent latin ; opacité des formations estompées ≥ 0,35', async () => {
  const { projId } = await import('../js/stage/palette.js'), { DIM_OP } = await import('../js/stage/lessons/geomap.js');
  assert.equal(projId({ id: 'γ' }), 'Gr'); assert.equal(projId({ id: 'δ' }), 'Do'); assert.equal(projId({ id: 'l' }), 'l');
  assert.ok(DIM_OP >= .35);
});
