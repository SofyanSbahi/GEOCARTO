/* Contrat des leçons Stage v2 : structure, textes présents, votes avec malentendus nommés, rythme de participation,
   figures sans NaN et sans texte sous la taille « dernier rang ». Tourne sous Node (aucun navigateur). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { t, nf, has } from '../js/stage/i18n.js';
import '../js/stage/lessons/fr.js';
import { LESSONS, TOPICS } from '../js/stage/lessons/index.js';
import { stepsOf, paramOf } from '../js/stage/lesson.js';
import * as K from '../js/stage/kit.js';
import { Gens } from '../js/engine/pedagogy/index.js';

const live = LESSONS.filter(l => !l.planned);
const key = (L, sc, k) => `${L.id}.${sc.id}.${k}`;
const X = (L, ctx, pi = 0, sc) => ({ t, nf, ctx, pi, scene: sc, lesson: L, rs: 1 });

test('les 11 thèmes sont couverts ou explicitement planifiés', () => {
  assert.equal(TOPICS.length, 11);
  TOPICS.forEach((tp, i) => { assert.equal(tp.n, i + 1); assert.ok(has('topic.' + tp.n) && has('topic.' + tp.n + '.d'), 'titre du thème ' + tp.n); assert.ok(tp.id || tp.legacy, 'thème sans source ' + tp.n); });
  for (const tp of TOPICS) if (tp.id) assert.ok(LESSONS.find(l => l.id === tp.id), 'leçon inconnue ' + tp.id);
});

for (const L of live) {
  test(`${L.id} : structure et textes`, () => {
    assert.ok(has(L.title));
    const ids = new Set();
    L.scenes.forEach(sc => {
      assert.ok(!ids.has(sc.id), 'scène en double ' + sc.id); ids.add(sc.id);
      assert.ok(K.KINDS[sc.kind], 'type inconnu ' + sc.kind);
      for (const k of ['claim', 'note', 'ask']) assert.ok(has(key(L, sc, k)), `texte manquant ${key(L, sc, k)}`);
      assert.ok(t(key(L, sc, 'claim')).split(/\s+/).length <= 8, 'idée de la scène trop longue : ' + sc.id);
      if (!sc.cap) assert.ok(has(key(L, sc, 'c0')), 'légende c0 manquante ' + sc.id);
      if (sc.kind === 'vote') {
        const v = sc.vote, ok = v.opts.filter(o => o.ok);
        assert.equal(ok.length, 1, 'un seul bon choix : ' + sc.id); assert.ok(v.opts.length >= 2 && v.opts.length <= 4);
        v.opts.forEach((o, i) => { if (!v.label) assert.ok(has(key(L, sc, 'o' + i)), 'option ' + i + ' ' + sc.id); if (!o.ok) { assert.ok(o.mis, 'malentendu non nommé ' + sc.id + ' ' + i); assert.ok(has('mis.' + o.mis) && has('mis.' + o.mis + '.why'), 'texte du malentendu ' + o.mis); } });
        assert.ok(v.solText || has(key(L, sc, 'sol')), 'correction manquante ' + sc.id);
        assert.ok(v.qText || v.draw || has(key(L, sc, 'q')), 'question manquante ' + sc.id);
        assert.ok(has(key(L, sc, 'c0')) && has(key(L, sc, 'c1')), 'légendes de vote ' + sc.id);
      }
      if (sc.practice && sc.practice.ch) assert.ok(Gens[sc.practice.ch], 'chapitre du moteur inconnu ' + sc.practice.ch);
    });
  });
  test(`${L.id} : rythme — une action de l’élève au moins toutes les ~7 minutes`, () => {
    let run = 0, mins = 0, worst = 0;
    L.scenes.forEach(sc => { if (K.ACTIVE.has(sc.kind)) { run = 0; mins = 0; } else { run++; mins += sc.min || 2; worst = Math.max(worst, mins); assert.ok(run <= 4, 'trop de séquences passives de suite avant ' + sc.id); } });
    assert.ok(worst <= 8, 'plus de 8 minutes sans participation : ' + worst);
    if (!L.prologue) assert.ok(L.scenes.filter(s => s.kind === 'vote').length >= 1, 'au moins un vote');
    assert.equal(L.scenes[L.scenes.length - 1].kind, 'recap');
  });
  test(`${L.id} : figures — pas de NaN, texte ≥ taille minimale, déterminisme`, () => {
    const ctx = L.setup ? L.setup(L.seed || 1) : {};
    L.scenes.forEach(sc => {
      if (!sc.fig && !(sc.vote && sc.vote.draw)) return;
      const pvs = sc.param ? sc.param.values.map((v, i) => i) : [0];
      for (const pi of pvs) for (let st = 0; st < stepsOf(sc, ctx); st++) {
        K.room(1); K.direction(true);
        const x = X(L, ctx, pi, sc), pv = paramOf(sc, pi), f = () => (sc.kind === 'vote' ? sc.vote.draw(st, x) : sc.fig(st, pv, x));
        const a = f(); assert.equal(a, f(), 'figure non déterministe ' + sc.id);
        assert.ok(!/NaN|undefined|Infinity/.test(a), `NaN/undefined dans ${L.id}.${sc.id} étape ${st}`);
        for (const m of a.matchAll(/font-size="([\d.]+)"/g)) assert.ok(+m[1] >= K.MIN - 1e-9, `texte trop petit (${m[1]}) dans ${L.id}.${sc.id}`);
        for (const m of a.matchAll(/stroke-width="([\d.]+)"/g)) assert.ok(+m[1] >= K.MIN_STROKE - 1e-9, `trait trop fin (${m[1]}) dans ${L.id}.${sc.id}`);
      }
      if (sc.cap) for (let st = 0; st < stepsOf(sc, ctx); st++) { const r = sc.cap(st, paramOf(sc, 0), X(L, ctx, 0, sc)); if (r) assert.ok(has(r[0]), 'clé de légende ' + r[0]); }
    });
  });
  test(`${L.id} : légendes ≤ 14 mots`, () => {
    L.scenes.forEach(sc => { if (sc.kind === 'vote' || sc.practice) return; for (let k = 0; k < 40; k++) { const kk = key(L, sc, 'c' + k); if (!has(kk)) continue; const w = t(kk).replace(/\*\*/g, '').replace(/\{\w+\}/g, 'x').split(/\s+/).length; assert.ok(w <= 14, `${kk} : ${w} mots`); } });
  });
}
test('profil : le moteur confirme la faute montrée dans la scène de diagnostic (p-regle) sur plusieurs graines', async () => {
  const { setup } = await import('../js/stage/lessons/profil.js');
  for (const sd of [4, 5, 12, 20, 33]) assert.ok(setup(sd).errs.includes('p-regle'), 'graine ' + sd);
});
test('profil : mêmes graines ⇒ même terrain et même trait (codes partageables avec l’espace élève)', async () => {
  const { setup } = await import('../js/stage/lessons/profil.js');
  const a = setup(12), b = setup(12); assert.equal(a.code, b.code); assert.deepEqual(a.A, b.A); assert.deepEqual(a.cross.map(c => c.z), b.cross.map(c => c.z));
});
test('votes : chaque option tient sur 2 lignes de 17 caractères (lisible sans débordement)', () => {
  for (const L of live) {
    const ctx = L.setup ? L.setup(L.seed || 1) : {};
    L.scenes.filter(s => s.kind === 'vote').forEach(sc => sc.vote.opts.forEach((o, i) => {
      const label = sc.vote.label ? sc.vote.label(i, X(L, ctx, 0, sc)) : t(key(L, sc, 'o' + i));
      assert.ok(K.wrap(label, 17).length <= 2, `${L.id}.${sc.id}.o${i} « ${label} » : ${K.wrap(label, 17).length} lignes`);
    }));
  }
});

/* Règle « 2 secondes » : à chaque étape, au plus 3 points focaux (étiquettes pleines, pastilles, grands chiffres) et 12 mots dans la figure.
   Les annotations « fade » / « rest » (qui reculent quand la suivante arrive) ne comptent plus. Un vote peut montrer autant d'objets que d'options. */
import { report, BUDGET } from '../tools/stage/focus_report.mjs';
test('budget d’attention : un seul centre d’attention à la fois', () => {
  const bad = report().filter(r => r.focal > r.budget || r.words > BUDGET.words);
  assert.deepEqual(bad.map(r => `${r.id}: ${r.focal} focaux, ${r.words} mots`), []);
});
