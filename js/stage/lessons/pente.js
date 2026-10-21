/* Thème 7 — PENTE. 8 scènes ≈ 19 min. Idée centrale : p = H / D × 100 ; courbes serrées ⇔ pente forte (même équidistance). */
import * as K from '../kit.js';
import { recapFig } from './mission.js';
const { C, txt, line, rect, circ, path, poly, g, arrow, at, badge, tag, lo } = K;
const deg = p => Math.atan(p / 100) * 180 / Math.PI;
const tri = (x, y, w, h, o = {}) => poly([[x, y], [x + w, y], [x + w, y - h]], { close: true, fill: o.fill || '#fdf3e3', stroke: C.ink, w: .8 });

export const pente = {
  id: 'pente', title: 'topic.7', seed: 3,
  scenes: [
    { id: 'hook', kind: 'hook', steps: 3, min: 1,
      fig: (st, p, X) => {
        let o = poly([[30, 6], [54, 50], [6, 50]], { close: true, fill: '#fff', stroke: C.red, w: 2.6 }) + txt(30, 38, '10 %', { size: 8.4, w: 800 });
        o += at(st, 1, tri(80, 52, 66, 6.6) + line(80, 52, 146, 52, { c: C.ink, w: .8 }) + txt(113, 57.6, '100 m', { size: 5, w: 800 }) + txt(144, 58, '10 m', { size: 4.6, anchor: 'end', w: 800, fill: C.acc }) + line(146, 52, 146, 45.4, { c: C.acc, w: 1.2 }));
        o += at(st, 2, tag(113, 28, 'p = 10 / 100 = 10 %', { size: 5.4, fill: C.ink }));
        return o;
      } },
    { id: 'tri', kind: 'show', steps: 4, min: 3, param: { values: [10, 25, 50, 100], start: 2, label: (v, i, X) => 'H = ' + v + ' m' },
      fig: (st, H, X) => {
        const D = 200, w = 90, h = H / D * w, x0 = 12, y0 = 58, p = H / D * 100;
        let o = line(x0, y0, x0 + w, y0, { c: C.ink, w: .9 }) + txt(x0 + w / 2, y0 + 5.6, 'D = 200 m', { size: 5.2, w: 800 });
        o += at(st, 1, tri(x0, y0, w, h) + line(x0 + w, y0, x0 + w, y0 - h, { c: C.acc, w: 1.3 }) + txt(x0 + w + 2, y0 - h / 2, 'H = ' + H + ' m', { size: 5.2, anchor: 'start', fill: C.acc, w: 800 }));
        o += at(st, 2, rect(5, 4, 47, 32, { fill: C.soft, rx: 2 }) + txt(28.5, 10.4, 'p = H ÷ D × 100', { size: 4.2, w: 800 }) + txt(28.5, 18.6, `${H} ÷ 200 × 100`, { size: 4.4, w: 600 }) + txt(28.5, 29, '= ' + X.nf(p, 1) + ' %', { size: 8, fill: C.acc, w: 800 }));
        o += at(st, 3, path(`M${x0 + 14} ${y0}A14 14 0 0 0 ${x0 + 14 - 14 * (1 - Math.cos(Math.atan(h / w)))} ${y0 - 14 * Math.sin(Math.atan(h / w))}`, { stroke: C.blue, w: .9 }) + tag(x0 + 23, y0 - 5, '≈ ' + X.nf(deg(p), 1) + '°', { size: 4.6, fill: C.blue }));
        return o;
      } },
    { id: 'fan', kind: 'show', steps: 4, min: 2,
      fig: (st, p, X) => {
        const O = [10, 62], rows = [[10, C.green], [50, C.blue], [100, C.brown], [200, C.red]];
        let o = line(O[0], O[1], 150, O[1], { c: C.ink, w: .8 });
        rows.forEach(([pc, col], i) => {
          const a = Math.atan(pc / 100), L = [100, 90, 70, 44][i], x = O[0] + L * Math.cos(a), y = O[1] - L * Math.sin(a);
          o += at(st, i, line(O[0], O[1], x, y, { c: col, w: 1.2 }) + tag(x + 2, y + (i === 3 ? 0 : -1), `${pc} % = ${X.nf(deg(pc), 1)}°`, { size: 4.6, fill: col, anchor: 'start' }), { rest: true });
        });
        o += at(st, 2, rect(110, 36, 46, 14, { fill: '#fff6d6', stroke: C.ink, w: .6, rx: 2 }) + txt(133, 43, X.t('pente.not'), { size: 4.4, w: 800 }));
        return o;
      } },
    { id: 'v1', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 't-penteinv' }, { mis: 't-fraction' }, { mis: 't-pentedeg' }],
        draw: (st, X) => tri(8, 56, 70, 17.5) + line(78, 56, 78, 38.5, { c: C.acc, w: 1.2 }) + txt(43, 62.5, 'D = 200 m', { size: 5, w: 800 }) + txt(43, 8, X.t('pente.v1.top'), { size: 5, w: 800 }) + txt(76, 32, 'H = 50 m', { size: 5, w: 800, anchor: 'end', fill: C.acc }) },
      q: 1 },
    { id: 'space', kind: 'show', steps: 3, min: 3, param: { values: [10, 25, 50], start: 1, label: (v, i, X) => X.t('pente.pp', { p: v }) },
      fig: (st, p, X) => {
        const tn = p / 100, x0 = 10, yb = 40, eq = 4;
        const yAt = x => yb - tn * (x - x0), xLim = Math.min(150, x0 + (yb - 6) / tn);
        let o = path(`M${x0} ${yb}L${xLim} ${yAt(xLim)}`, { stroke: C.brown, w: 1.6 }) + txt(150, 3.8, 'Éq = 20 m', { size: 4.4, anchor: 'end', w: 800, fill: C.mute });
        const xs = [];
        for (let k = 0; ; k++) { const y = yb - k * eq; if (y < 6) break; xs.push([x0 + k * eq / tn, y]); }
        xs.forEach(([x, y], k) => { o += line(x0, y, 150, y, { c: C.line, w: .35, dash: '1.2 1.2' }); if (x <= 150) o += circ(x, y, 1, { fill: C.brown }); });
        o += rect(10, 56, 140, 3, { fill: C.soft, rx: 1 });
        o += at(st, 1, xs.filter(([x]) => x <= 150).map(([x, y]) => line(x, y, x, 57.5, { c: C.brown, w: .5, dash: '1.2 1.2' }) + line(x, 54.5, x, 61.5, { c: C.brown, w: .9 })).join('') + txt(150, 66.4, X.t('pente.plan'), { size: 3.6, anchor: 'end', w: 700, fill: C.mute }));
        const dm = Math.round(20 / tn);
        o += at(st, 2, rect(92, 33, 62, 19.5, { fill: '#fff6d6', stroke: C.ink, w: .6, rx: 2 }) + txt(123, 38.8, `d = 20 ÷ ${X.nf(p / 100, 2)}`, { size: 4.6, w: 800 }) + txt(123, 46.6, `= ${X.nf(dm)} m`, { size: 5.6, w: 800, fill: C.acc }));
        return o;
      } },
    { id: 'v2', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 't-milieu' }, { mis: 't-inv' }, { mis: 't-eq' }],
        draw: (st, X) => {
          let o = rect(6, 12, 78, 46, { fill: '#f6f1e2', stroke: C.ink, w: .7, rx: 1 });
          [[9, 28, 3.3], [28, 54, 6.4], [54, 82, 12]].forEach(([a, b, s], z) => { for (let x = a + s / 2; x < b; x += s) o += path(`M${x} 13Q${x + 2} 35 ${x} 57`, { stroke: C.brown, w: .55 }); o += badge((a + b) / 2, 64, String(z + 1), { r: 2.8, fill: C.ink, size: 4 }); });
          return o + txt(45, 6, X.t('pente.v2.top'), { size: 4.4, w: 800 });
        } },
      q: 1 },
    { id: 'pr', kind: 'practice', min: 3, practice: { ch: 'pente', seconds: 90 } },
    { id: 'recap', kind: 'recap', steps: 4, min: 1,
      fig: (st, p, X) => recapFig('pente', st, X) }
  ]
};
export const FR = {
  'topic.7': 'Pente', 'topic.7.d': 'p = H/D, pourcentage et degrés, espacement des courbes',
  'pente.not': '100 % ≠ 100°', 'pente.pp': 'Pente {p} %', 'pente.plan': 'vue du dessus (la carte)', 'pente.v1.top': 'H = 50 m, D = 200 m', 'pente.v2.top': 'Pente la plus forte ?',
  'pente.recap.r0': 'p (%) = H ÷ D × 100', 'pente.recap.r1': '100 % = 45° (pas 100°)', 'pente.recap.r2': 'Courbes serrées = pente forte',
  'pente.hook.claim': 'Que dit ce panneau ?',
  'pente.hook.c0': 'Panneau « 10 % » : est-ce raide ?',
  'pente.hook.c1': 'Sur **100 m** à l’horizontale, la route monte de **10 m**.',
  'pente.hook.c2': 'Pente = **dénivelée ÷ distance**.',
  'pente.hook.note': 'Montrer la photo d’un vrai panneau si possible.', 'pente.hook.ask': 'À quel angle correspond 10 % ?',
  'pente.tri.claim': 'La pente en pourcentage',
  'pente.tri.c0': '**D** : la distance horizontale entre deux points.',
  'pente.tri.c1': '**H** : la dénivelée (différence d’altitude).',
  'pente.tri.c2': '**p = H ÷ D × 100.** Changez H avec ↑ ↓.',
  'pente.tri.c3': 'En degrés, c’est un autre nombre.',
  'pente.tri.note': 'Garder D = 200 m ; ne faire varier que H.', 'pente.tri.ask': 'Que devient p si D double ?',
  'pente.fan.claim': 'Pourcentage et degrés',
  'pente.fan.c0': '10 % : à peine 6°.', 'pente.fan.c1': '50 % : environ 27°.', 'pente.fan.c2': '**100 % = 45°**, pas 100°.', 'pente.fan.c3': '200 % : plus raide que 45°, tout à fait possible.',
  'pente.fan.note': 'Insister : le pourcentage n’est pas borné à 100.', 'pente.fan.ask': 'Un mur vertical, c’est quelle pente ?',
  'pente.v1.claim': 'Calculez la pente', 'pente.v1.q': 'H = 50 m, D = 200 m : pente ?',
  'pente.v1.c0': 'Calcul mental, 20 secondes.', 'pente.v1.c1': 'Votez : A, B, C ou D.',
  'pente.v1.o0': '25 %', 'pente.v1.o1': '400 %', 'pente.v1.o2': '0,25 %', 'pente.v1.o3': '14°',
  'pente.v1.sol': '50 ÷ 200 × 100 = 25 %.', 'pente.v1.note': 'Chaque mauvaise réponse correspond à une erreur de méthode précise.', 'pente.v1.ask': 'Qui a divisé D par H ?',
  'pente.space.claim': 'Les courbes se rapprochent',
  'pente.space.c0': 'De côté : le terrain coupé tous les **20 m** de hauteur.',
  'pente.space.c1': 'Vu du dessus : ces coupes deviennent les **courbes de niveau**.',
  'pente.space.c2': 'Plus c’est raide, plus c’est serré : **d = Éq ÷ p**.',
  'pente.space.note': 'Faire défiler 10 → 25 → 50 % avec ↑ ↓ en commentant la bande du bas.', 'pente.space.ask': 'Et si l’équidistance double ?',
  'pente.v2.claim': 'Où est-ce le plus raide ?', 'pente.v2.q': 'Où la pente est-elle la plus forte ?',
  'pente.v2.c0': 'Même équidistance partout.', 'pente.v2.c1': 'Votez : A, B, C ou D.',
  'pente.v2.o0': 'Zone 1 (serrées)', 'pente.v2.o1': 'Zone 2', 'pente.v2.o2': 'Zone 3 (espacées)', 'pente.v2.o3': 'On ne peut pas savoir',
  'pente.v2.sol': 'Zone 1 : courbes serrées ⇒ pente forte.', 'pente.v2.note': 'Le malentendu « espacées = raide » vient d’un mauvais modèle mental du plan.', 'pente.v2.ask': 'Que se passe-t-il à la verticale d’une falaise ?',
  'pente.pr.claim': 'À vous de calculer', 'pente.pr.c0': 'Lisez l’énoncé.', 'pente.pr.c1': 'Calculez : le minuteur tourne.', 'pente.pr.c2': 'Correction.', 'pente.pr.note': 'Même moteur d’exercices que l’espace élève.', 'pente.pr.ask': 'Qui a obtenu 25 % du premier coup ?',
  'pente.recap.claim': 'À retenir', 'pente.recap.c0': 'Trois idées.', 'pente.recap.note': 'Faire reformuler.', 'pente.recap.ask': 'Quelle pente pour 45° ?',
  'mis.t-penteinv': 'Rapport inversé (D ÷ H)', 'mis.t-penteinv.why': 'La pente est H ÷ D : la hauteur au numérateur.',
  'mis.t-fraction': '« × 100 » oublié', 'mis.t-fraction.why': '50 ÷ 200 = 0,25 : pour un pourcentage, il faut × 100.',
  'mis.t-pentedeg': 'Pourcentage pris pour des degrés', 'mis.t-pentedeg.why': '25 % ≈ 14° : deux unités différentes.',
  'mis.t-milieu': 'Zone « moyenne » choisie par prudence', 'mis.t-milieu.why': 'Comparer l’espacement, pas viser le milieu.',
  'mis.t-inv': 'Courbes espacées = pente forte', 'mis.t-inv.why': 'Espacées = grande distance pour 20 m de hauteur = pente faible.',
  'mis.t-eq': 'Équidistance supposée variable', 'mis.t-eq.why': 'L’équidistance est constante sur une carte : on peut comparer.'
};
