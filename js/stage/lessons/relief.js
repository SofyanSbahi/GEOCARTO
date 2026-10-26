/* Thèmes 4, 5, 6 et 8 — COURBES DE NIVEAU · ÉQUIDISTANCE · POINTS COTÉS · FORMES DU RELIEF (une seule lecture de carte, vécue en quatre temps).
   Démarrages : thème 4 = scène 1, thème 5 = scène 3, thème 6 = scène 5, thème 8 = scène 7. */
import * as K from '../kit.js';
import { recapFig } from './mission.js';
import { mapSvg, levelPaths, fillBox } from './maps.js';
import { demFromForm, sample } from '../../engine/terrain/index.js';
const { C, txt, txtL, line, rect, circ, path, g, arrow, at, badge, tag, lo } = K;
const cache = new Map();
const dem = (f, base = 200, relief = 400) => { const k = f + base + relief; if (!cache.has(k)) cache.set(k, demFromForm(f, { base, relief, slope: 1, scaleN: 25000 })); return cache.get(k); };
const BIG = { x: 2, y: .5, w: 100, h: 68.9 }, MID = { x: 4, y: 6, w: 86, h: 59.1 }, PLAN = { x: 98, y: 13, w: 58, h: 39.9 };
const FORMS = ['colline', 'cuvette', 'col', 'vallee', 'crete'];
const near = (chains, p) => { let best = null; for (const ch of chains) for (const q of ch) { const dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (!best || dd < best.d) best = { d: dd, q }; } return best; };
const POS = [{ x: 52, y: 34 }, { x: 98, y: 70 }, { x: 36, y: 84 }];

export const relief = {
  id: 'relief', title: 'topic.4', seed: 1,
  scenes: [
    { id: 'planes', kind: 'hook', min: 3, steps: 8,
      cap: (st) => st === 0 ? ['relief.planes.c0'] : ['relief.planes.pt', { z: 200 + st * 50 }],
      fig: (st, p, X) => {
        const d = dem('colline'), row = 55, lv = levelPaths(d, 50, PLAN);
        const SX = c => 5 + c * 68 / 159, SY = z => 54 - (z - 200) / 400 * 44;
        let sil = ''; for (let c = 0; c < 160; c += 2) sil += (c ? 'L' : 'M') + SX(c).toFixed(1) + ' ' + SY(sample(d, c, row)).toFixed(1);
        let o = path(sil + `L${SX(158)} 54L${SX(0)} 54Z`, { fill: '#f1e3cf', stroke: C.brown, w: .8 }) + fillBox(PLAN) + tag(39, 61, X.t('relief.side'), { size: 3.8, fill: C.mute }) + tag(127, 61, X.t('relief.top'), { size: 3.8, fill: C.mute });
        for (let k = 1; k <= Math.min(7, st); k++) {
          const z = 200 + k * 50, cur = k === st, y = SY(z), col = cur ? C.acc : C.brown;
          o += line(5, y, 76, y, { c: col, w: cur ? .8 : .45, dash: '1.6 1.2' }) + txt(77.5, y, String(z), { size: 3.6, anchor: 'start', w: 800, fill: col });
          const xs = []; let prev = sample(d, 0, row); for (let c = 1; c < 160; c++) { const v = sample(d, c, row); if ((prev - z) * (v - z) < 0) xs.push(c); prev = v; }
          xs.forEach(c => { o += circ(SX(c), y, cur ? 1.5 : 1, { fill: col }); });
          const L = lv.find(l => l.level === z); if (L) { o += path(L.d, { stroke: col, w: cur ? .9 : .5 }); const top = L.chains.flat().reduce((m, q) => q[1] < m[1] ? q : m, [0, 99]); if (cur) o += txt(top[0], top[1] - 1.6, String(z), { size: 3.4, w: 800, fill: col }); }
        }
        return o;
      } },
    { id: 'v-def', kind: 'vote', min: 2, vote: { opts: [{ ok: true }, { mis: 't-pente' }, { mis: 't-dist' }, { mis: 't-veg' }],
      draw: (st, X) => { const d = dem('colline'), lv = levelPaths(d, 100, MID); return fillBox(MID) + lv.map(l => path(l.d, { stroke: l.level === 400 ? C.acc : C.brown, w: l.level === 400 ? 1.1 : .5 })).join('') + K.tagFit(47, 4, X.t('relief.v1.top'), 84, { size: 4.4, fill: C.ink }); } } },
    { id: 'eq', kind: 'show', min: 3, steps: 3, param: { values: [100, 50, 25, 10], start: 1, label: (v) => 'Éq ' + v + ' m' },
      fig: (st, eq, X) => {
        const d = dem('colline'), n = levelPaths(d, eq, BIG).length;
        let o = mapSvg(d, eq, BIG, { labels: st >= 0 });
        o += at(st, 1, rect(108, 12, 48, 26, { fill: C.soft, rx: 2 }) + txt(132, 18.4, X.t('relief.eq.l'), { size: 4, w: 700, fill: C.mute }) + txt(132, 28.6, `${eq} m`, { size: 9.4, w: 800, fill: C.acc }));
        o += at(st, 1, txt(132, 46, X.t('relief.eq.n', { n }), { size: 4.8, w: 800 }));
        o += at(st, 2, tag(132, 58, X.t('relief.eq.tr'), { size: 4, fill: C.ink }));
        return o;
      } },
    { id: 'v-eq', kind: 'vote', min: 2, vote: { opts: [{ ok: true }, { mis: 'e-diff' }, { mis: 'e-n' }, { mis: 'e-moy' }],
      draw: (st, X) => { let o = ''; for (let i = 0; i <= 6; i++) o += line(14, 12 + i * 8, 72, 12 + i * 8, { c: i === 0 || i === 6 ? C.ink : C.brown, w: i === 0 || i === 6 ? .8 : .45 }); o += txt(12, 12, '400', { size: 4.4, anchor: 'end', w: 800 }) + txt(12, 60, '340', { size: 4.4, anchor: 'end', w: 800 }) + path('M78 12v48M75.5 12h5M75.5 60h5', { stroke: C.acc, w: .8 }) + txt(80, 36, X.t('relief.v2.six'), { size: 4.4, anchor: 'start', w: 800, fill: C.acc }) + txt(44, 5, X.t('relief.v2.top'), { size: 4.4, w: 800 }); return o; } } },
    { id: 'spot', kind: 'show', min: 4, steps: 4, param: { values: POS, start: 0, label: (v, i, X) => X.t('relief.pt', { n: i + 1 }) },
      fig: (st, P, X) => {
        const d = dem('colline'), eq = 50, lv = levelPaths(d, eq, BIG), z = sample(d, P.x, P.y), lo_ = Math.floor(z / eq) * eq, hi_ = lo_ + eq;
        const pp = [BIG.x + P.x * BIG.w / (d.W - 1), BIG.y + P.y * BIG.h / (d.H - 1)], A = lv.find(l => l.level === lo_), B = lv.find(l => l.level === hi_);
        let o = fillBox(BIG) + lv.map(l => path(l.d, { stroke: '#a9692f', w: .32 })).join('');
        const nA = A && near(A.chains, pp), nB = B && near(B.chains, pp), d1 = nA ? nA.d : 1, d2 = nB ? nB.d : 1, est = Math.round((lo_ + eq * d1 / (d1 + d2)) / 5) * 5;
        o += at(st, 1, [[A, lo_, C.blue], [B, hi_, C.green]].map(([L, lev, col]) => L ? path(L.d, { stroke: col, w: 1.2 }) : '').join(''), { rest: true });
        o += st === 1 ? tag(131, 20, `${hi_} m`, { size: 5.4, fill: C.green }) + tag(131, 32, `${lo_} m`, { size: 5.4, fill: C.blue }) : '';
        o += circ(pp[0], pp[1], 1.9, { fill: C.acc, stroke: '#fff', w: .5 }) + tag(pp[0] + 5.5, pp[1] - 1, 'P', { size: 4.2, fill: C.acc });
        o += at(st, 2, rect(106, 12, 50, 30, { fill: C.soft, rx: 2 }) + txt(131, 18, `${lo_} m  ↔  ${hi_} m`, { size: 4, w: 800 }) + txt(131, 25.4, X.t('relief.spot.ratio', { a: X.nf(d1 / (d1 + d2) * 100), }), { size: 3.8, w: 700, fill: C.mute }) + txt(131, 35.6, `P ≈ ${est} m`, { size: 7.6, w: 800, fill: C.acc }), { rest: true });
        o += at(st, 3, tag(131, 52, X.t('relief.spot.exact', { z: X.nf(z, 0) }), { size: 4, fill: C.ink }));
        return o;
      } },
    { id: 'v-spot', kind: 'vote', min: 2, vote: { opts: [{ ok: true }, { mis: 'e-bas' }, { mis: 'e-haut' }, { mis: 'e-mid' }],
      draw: (st, X) => line(18, 20, 86, 20, { c: C.brown, w: .9 }) + line(18, 50, 86, 50, { c: C.brown, w: .9 }) + txt(15, 20, '300', { size: 4.4, anchor: 'end', w: 800 }) + txt(15, 50, '350', { size: 4.4, anchor: 'end', w: 800 }) + circ(46, 26, 1.9, { fill: C.acc }) + tag(53, 26, 'P', { size: 4.4, fill: C.acc }) + txt(46, 62, X.t('relief.v3.top'), { size: 4.2, w: 800 }) + path('M30 20v6M30 26h12', { stroke: C.mute, w: .5, dash: '1 1' }) } },
    { id: 'forms', kind: 'show', min: 4, steps: 3, param: { values: FORMS, start: 0, label: (v, i, X) => X.t('relief.form.n', { n: i + 1, m: FORMS.length }) },
      fig: (st, f, X) => {
        const d = dem(f);
        let o = mapSvg(d, 50, BIG, { labels: true });
        o += at(st, 1, tag(132, 14, X.t('relief.form.q'), { size: 6, fill: C.ink }));
        o += at(st, 2, rect(106, 22, 52, 34, { fill: '#fff6d6', stroke: C.ink, w: .6, rx: 2 }) + txt(132, 29, X.t('relief.form.' + f), { size: 6.2, w: 800, fill: C.acc }) + K.txtL(132, 36.6, K.wrap(X.t('relief.rule.' + f), 17), { size: 3.8, lh: 4.6, w: 700 }));
        return o;
      } },
    { id: 'v-form', kind: 'vote', min: 2, vote: { opts: [{ mis: 't-fermee' }, { ok: true }, { mis: 't-col' }, { mis: 't-vallee' }],
      draw: (st, X) => mapSvg(dem('cuvette'), 50, { x: 4, y: 8, w: 82, h: 56.4 }, { labels: true }) + K.tagFit(45, 4.4, X.t('relief.v4.top'), 84, { size: 4.2, fill: C.ink }) } },
    { id: 'pr', kind: 'practice', min: 3, practice: { ch: 'courbes', seconds: 75 } },
    { id: 'recap', kind: 'recap', steps: 4, min: 1,
      fig: (st, p, X) => recapFig('relief', st, X) }
  ]
};
export const FR = {
  'topic.4': 'Courbes de niveau', 'topic.5': 'Équidistance', 'topic.6': 'Points cotés', 'topic.8': 'Formes du relief',
  'relief.side': 'vue de côté', 'relief.top': 'vue du dessus', 'relief.v1.top': 'La courbe rouge relie…', 'relief.eq.l': 'Équidistance', 'relief.eq.n': '{n} courbes', 'relief.eq.tr': 'Détail ↔ lisibilité',
  'relief.v2.top': 'Entre 340 m et 400 m', 'relief.v2.six': '6 intervalles', 'relief.pt': 'Point {n}', 'relief.spot.ratio': 'distance : {a} % du bas', 'relief.spot.exact': 'altitude exacte : {z} m',
  'relief.v3.top': 'P plus près de la courbe 350', 'relief.form.n': 'Forme {n} / {m}', 'relief.form.q': 'Quelle forme ?', 'relief.v4.top': 'Valeurs : 250 puis 500',
  'relief.form.colline': 'Colline', 'relief.form.cuvette': 'Cuvette', 'relief.form.col': 'Col', 'relief.form.vallee': 'Vallée', 'relief.form.crete': 'Crête',
  'relief.rule.colline': 'Courbes fermées, altitudes qui croissent vers le centre.', 'relief.rule.cuvette': 'Courbes fermées, altitudes qui décroissent vers le centre.',
  'relief.rule.col': 'Entre deux sommets : deux sommets, deux creux opposés.', 'relief.rule.vallee': 'Courbes en V pointant vers l’amont.', 'relief.rule.crete': 'Courbes en V pointant vers l’aval.',
  'relief.recap.r0': 'Courbe = même altitude', 'relief.recap.r1': 'Éq = écart entre courbes', 'relief.recap.r2': 'Valeurs avant formes',
  'relief.planes.claim': 'Une courbe, une altitude',
  'relief.planes.c0': 'Coupons la colline par des plans horizontaux.',
  'relief.planes.pt': 'Plan à **{z} m** : sa trace sur la carte est une courbe.',
  'relief.planes.note': 'Avancer plan par plan ; faire annoncer la forme de la trace avant de l’afficher.', 'relief.planes.ask': 'Que se passe-t-il pour un plan à 650 m ?',
  'relief.v-def.claim': 'Que relie la courbe rouge ?', 'relief.v-def.q': 'Une courbe de niveau relie des points…',
  'relief.v-def.c0': 'Regardez la courbe rouge.', 'relief.v-def.c1': 'Votez : A, B, C ou D.',
  'relief.v-def.o0': 'de même altitude', 'relief.v-def.o1': 'de même pente', 'relief.v-def.o2': 'à même distance du sommet', 'relief.v-def.o3': 'de même végétation',
  'relief.v-def.sol': 'Une courbe relie les points de même altitude.', 'relief.v-def.note': 'Piège : confondre courbe et ligne de pente.', 'relief.v-def.ask': 'Marche-t-on en montée le long d’une courbe ?',
  'relief.eq.claim': 'L’équidistance : un choix',
  'relief.eq.c0': 'Même colline. Changez l’équidistance avec ↑ ↓.', 'relief.eq.c1': 'Éq = **écart d’altitude** entre deux courbes voisines.', 'relief.eq.c2': 'Plus Éq est **petite**, plus la carte est détaillée.',
  'relief.eq.note': 'Faire défiler 100 → 10 m en commentant le nombre de courbes.', 'relief.eq.ask': 'Pourquoi ne pas toujours prendre Éq = 5 m ?',
  'relief.v-eq.claim': 'Quelle est l’équidistance ?', 'relief.v-eq.q': 'Quelle est l’équidistance ?',
  'relief.v-eq.c0': '340 m à 400 m, 6 intervalles.', 'relief.v-eq.c1': 'Votez : A, B, C ou D.',
  'relief.v-eq.o0': '10 m', 'relief.v-eq.o1': '60 m', 'relief.v-eq.o2': '6 m', 'relief.v-eq.o3': '56,7 m',
  'relief.v-eq.sol': '(400 − 340) ÷ 6 = 10 m.', 'relief.v-eq.note': 'Les erreurs reviennent à oublier de diviser.', 'relief.v-eq.ask': 'Combien de courbes entre 340 et 400 ?',
  'relief.spot.claim': 'Estimer une altitude',
  'relief.spot.c0': 'Point **P** sur la carte. Changez de point avec ↑ ↓.', 'relief.spot.c1': 'On l’encadre par les deux courbes voisines.', 'relief.spot.c2': 'On estime selon la **proximité** de chaque courbe.', 'relief.spot.c3': 'Le MNT donne la valeur exacte : proche de l’estimation.',
  'relief.spot.note': 'Faire estimer à voix haute avant l’étape 3.', 'relief.spot.ask': 'Quelle marge d’erreur accepte-t-on ?',
  'relief.v-spot.claim': 'Quelle altitude pour P ?', 'relief.v-spot.q': 'P entre 300 m et 350 m, plus près de 350 m. Altitude ?',
  'relief.v-spot.c0': 'Pensez à la distance aux deux courbes.', 'relief.v-spot.c1': 'Votez : A, B, C ou D.',
  'relief.v-spot.o0': '≈ 340 m', 'relief.v-spot.o1': '300 m', 'relief.v-spot.o2': '350 m', 'relief.v-spot.o3': '325 m',
  'relief.v-spot.sol': 'Plus près de 350 : on estime ≈ 340 m.', 'relief.v-spot.note': 'On ne prend pas la valeur de la courbe voisine.', 'relief.v-spot.ask': 'Et si P était au milieu ?',
  'relief.forms.claim': 'Reconnaître une forme',
  'relief.forms.c0': 'Lisez la carte, **valeurs comprises**. ↑ ↓ change de forme.', 'relief.forms.c1': 'Prédisez la forme avant la réponse.', 'relief.forms.c2': 'Les altitudes décident entre deux formes proches.',
  'relief.forms.note': 'Prédire → R : ne jamais montrer le nom d’emblée.', 'relief.forms.ask': 'Qu’est-ce qui distingue colline et cuvette ?',
  'relief.v-form.claim': 'Colline ou cuvette ?', 'relief.v-form.q': 'Quelle forme ?',
  'relief.v-form.c0': 'Lisez les altitudes, pas les cercles.', 'relief.v-form.c1': 'Votez : A, B, C ou D.',
  'relief.v-form.o0': 'Colline', 'relief.v-form.o1': 'Cuvette', 'relief.v-form.o2': 'Col', 'relief.v-form.o3': 'Vallée',
  'relief.v-form.sol': 'Altitudes décroissantes vers le centre : cuvette.', 'relief.v-form.note': 'Le malentendu typique : « courbes fermées = colline ».', 'relief.v-form.ask': 'Quelle valeur au centre ?',
  'relief.pr.claim': 'À vous de calculer', 'relief.pr.c0': 'Lisez l’énoncé.', 'relief.pr.c1': 'Calculez : le minuteur tourne.', 'relief.pr.c2': 'Correction.', 'relief.pr.note': 'Même moteur d’exercices que l’espace élève.', 'relief.pr.ask': 'Qui a divisé par 6 ?',
  'relief.recap.claim': 'À retenir', 'relief.recap.c0': 'Trois idées.', 'relief.recap.note': 'Faire reformuler.', 'relief.recap.ask': 'Que lit-on avant la forme ?',
  'mis.t-pente': 'Pente confondue avec altitude', 'mis.t-pente.why': 'Sur une courbe on ne monte ni ne descend : l’altitude est constante.',
  'mis.t-dist': 'Distance au sommet', 'mis.t-dist.why': 'Les courbes ne sont pas des cercles de même rayon.',
  'mis.t-veg': 'Couleur lue comme altitude', 'mis.t-veg.why': 'La végétation est un autre calque de la carte.',
  'mis.e-diff': 'Écart total pris pour l’équidistance', 'mis.e-diff.why': '60 m = 6 intervalles : il faut diviser.',
  'mis.e-n': 'Nombre d’intervalles pris pour Éq', 'mis.e-n.why': '6 intervalles ≠ 6 m : on divise l’écart d’altitude.',
  'mis.e-moy': 'Division par un autre nombre', 'mis.e-moy.why': '60 ÷ 6 = 10 exactement.',
  'mis.e-bas': 'Altitude de la courbe inférieure', 'mis.e-bas.why': 'P n’est pas sur la courbe 300 : elle en est éloignée.',
  'mis.e-haut': 'Altitude de la courbe supérieure', 'mis.e-haut.why': 'P est près de 350 mais pas dessus.',
  'mis.e-mid': 'Moyenne par prudence', 'mis.e-mid.why': 'La proximité compte : plus près de 350 ⇒ plus de 325.',
  'mis.t-fermee': 'Courbes fermées = colline', 'mis.t-fermee.why': 'Fermées dans les deux cas : seules les altitudes tranchent.',
  'mis.t-col': 'Col pris pour une forme fermée', 'mis.t-col.why': 'Un col a deux sommets et deux creux opposés.',
  'mis.t-vallee': 'Vallée sans V', 'mis.t-vallee.why': 'Une vallée a des courbes en V, pas des courbes fermées.'
};
