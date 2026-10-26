/* Thème 1 — ÉCHELLE. 8 scènes ≈ 17 min. Idée centrale : « 1 cm sur la carte = N cm sur le terrain » ; piège n°1 = les unités. */
import * as K from '../kit.js';
import { recapFig } from './mission.js';
const { C, txt, txtL, line, rect, circ, path, poly, g, arrow, at, badge, tag, lo } = K;

const dist = (m, nf) => m >= 1000 ? `${nf(m / 1000, 2)} km` : `${nf(m)} m`;
const house = (x, y, s = 3) => rect(x - s / 2, y - s / 2, s, s, { fill: C.ink }) ;
const ruler = (x, y, cm, u, o = {}) => rect(x, y, cm * u, 4.4, { fill: '#fff', stroke: C.ink, w: .6 }) + Array.from({ length: cm + 1 }, (_, i) => line(x + i * u, y, x + i * u, y + (i % 1 ? 2 : 4.4), { w: .5 })).join('') + (o.lab === false ? '' : Array.from({ length: cm + 1 }, (_, i) => txt(x + i * u, y + 7.6, String(i), { size: 3.6, w: 600 })).join(''));

export const echelle = {
  id: 'echelle', title: 'topic.1', seed: 12,
  scenes: [
    { id: 'hook', kind: 'hook', steps: 3, min: 1,
      fig: (st, p, X) => {
        const A = [22, 34], B = [44, 34];
        let o = rect(6, 8, 62, 50, { fill: '#f6f1e2', stroke: C.ink, w: .8, rx: 1 }) + txt(37, 14.5, X.t('echelle.map'), { size: 4 }) +
          line(A[0], A[1], B[0], B[1], { c: C.acc, w: .9 }) + circ(A[0], A[1], 1.8, { fill: C.ink }) + circ(B[0], B[1], 1.8, { fill: C.ink }) +
          txt(A[0], A[1] + 6, 'A', { size: 4.6 }) + txt(B[0], B[1] + 6, 'B', { size: 4.6 }) + tag(33, 25, '1 cm', { size: 5, fill: C.acc });
        o += at(st, 1, rect(86, 8, 68, 50, { fill: '#e9f1e4', stroke: C.ink, w: .8, rx: 1, dash: '2 1.5' }) + txt(120, 14.5, X.t('echelle.ground'), { size: 4 }) +
          circ(94, 34, 2, { fill: C.ink }) + circ(146, 34, 2, { fill: C.ink }) + arrow(70, 34, 84, 34, { c: C.mute, w: .7 }) +
          line(96, 34, 144, 34, { c: C.acc, w: .9, dash: '2 1.2' }) + txt(94, 41, 'A', { size: 4.6 }) + txt(146, 41, 'B', { size: 4.6 }));
        const yv = Math.max(27, 14.5 + 3.3 * K.fsz() + 7.5 * K.fsz() * .75 + .6);   /* sous l'intitulé « Sur le terrain », même agrandi (5:4, amphi) */
        o += at(st, 1, st === 1 ? tag(120, yv, '? m', { size: 7.5, fill: C.ink }) : '');
        o += at(st, 2, tag(120, yv, X.t('echelle.250'), { size: 7.5, fill: C.acc }) + tag(37, 50, '1 / 25 000', { size: 4.6, fill: C.ink }));
        return o;
      } },
    { id: 'ratio', kind: 'show', steps: 3, min: 3, param: { values: [10000, 25000, 50000, 100000], start: 1, label: (v, i, X) => '1 / ' + X.nf(v) },
      fig: (st, N, X) => {
        const cm = 4, u = 13, x0 = 14, real = cm * N / 100, rl = dist(real, X.nf);
        let o = txt(x0 + cm * u / 2, 8, `${cm} cm`, { size: 6.4 }) + ruler(x0, 12, cm, u) + circ(x0, 14.2, 1.6, { fill: C.acc }) + circ(x0 + cm * u, 14.2, 1.6, { fill: C.acc }) + txt(x0 + cm * u / 2, 28.5, X.t('echelle.map'), { size: 3.8, w: 600, fill: C.mute });
        o += at(st, 1, path(`M${x0} 17L${x0} 40M${x0 + cm * u} 17L150 40`, { stroke: C.mute, w: .5, dash: '1.5 1.5' }) + rect(x0, 40, 136, 6, { fill: C.pri, rx: 1 }) + tag(104, 47.5 + 8.4 * K.fsz() * .75, rl, { size: 8.4, fill: C.pri }) + txt(x0 + 1, 51.5, X.t('echelle.ground'), { size: 3.8, w: 600, fill: C.mute, anchor: 'start' }));   /* étiquette « terrain » à gauche : la valeur agrandie ne la recouvre plus */
        o += at(st, 2, rect(80, 2, 76, 28, { fill: C.soft, rx: 1.5 }) + txt(118, 9, 'D = d × N', { size: 6.6 }) + txt(118, 18, `${cm} cm × ${X.nf(N)}`, { size: 5, w: 600 }) + txt(118, 25.5, `= ${X.nf(cm * N)} cm = ${rl}`, { size: 5, fill: C.pri }));
        return o;
      } },
    { id: 'convert', kind: 'build', steps: 4, min: 3,
      fig: (st, p, X) => {
        const bx = i => 2 + i * 40, vals = ['8 cm', '80 000 cm', '800 m', '0,8 km'], ops = ['× 10 000', '÷ 100', '÷ 1 000'], col = [C.ink, C.blue, C.brown, C.pri];
        let o = txt(80, 8, X.t('echelle.q8'), { size: 5, w: 600, fill: C.mute });
        vals.forEach((v, i) => {
          o += at(st, i, rect(bx(i), 24, 34, 15, { fill: '#fff', stroke: col[i], w: 1, rx: 1.6 }) + txt(bx(i) + 17, 31.8, v, { size: 5.6, fill: col[i], w: 800 }));
          if (i) o += at(st, i, arrow(bx(i - 1) + 35, 31.5, bx(i) - 1, 31.5, { c: C.ink, w: .8, head: 2.4 }) + tag(bx(i) - 3, 18, ops[i - 1], { size: 4.2, fill: col[i] }), { rest: true });
        });
        o += at(st, 3, tag(80, 56, X.t('echelle.units'), { size: 5.4, fill: C.red }));
        return o;
      } },
    { id: 'v1', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 't-unite' }, { mis: 't-unite' }, { mis: 'e-div' }],
        draw: (st, X) => rect(6, 12, 80, 40, { fill: '#f6f1e2', stroke: C.ink, w: .7, rx: 1 }) + line(14, 34, 78, 34, { c: C.acc, w: 1 }) + circ(14, 34, 1.8, { fill: C.ink }) + circ(78, 34, 1.8, { fill: C.ink }) + tag(46, 26, '8 cm', { size: 6, fill: C.acc }) + tag(46, 46, '1 / 10 000', { size: 5.4, fill: C.ink }) + txt(46, 6, X.t('echelle.v1.top'), { size: 4.6 }) },
      q: 1 },
    { id: 'big', kind: 'show', steps: 3, min: 2,
      fig: (st, p, X) => {
        const houses = [[14, 22], [24, 20], [20, 34], [34, 30], [42, 20], [52, 28], [48, 40], [28, 44]], ch = [60, 16];
        let o = rect(4, 6, 72, 52, { fill: '#f6f1e2', stroke: C.ink, w: .8, rx: 1 }) + path('M4 48C20 44 40 50 76 40', { stroke: C.blue, w: 2.4 }) + path('M4 30L76 36', { stroke: C.mute, w: 1.6 }) +
          houses.map(([x, y]) => house(x, y, 4.2)).join('') + path(`M${ch[0]} ${ch[1] - 3.4}v6.8M${ch[0] - 2.2} ${ch[1] - 1}h4.4`, { stroke: C.ink, w: .9 }) + tag(18, 11, '1 / 10 000', { size: 4.4 });
        o += at(st, 1, rect(84, 6, 72, 52, { fill: '#f6f1e2', stroke: C.ink, w: .8, rx: 1 }) + path('M84 18C100 30 120 24 156 46', { stroke: C.blue, w: 1.4 }) + path('M84 52L156 14', { stroke: C.mute, w: 1 }) + path('M96 14L106 8L116 16M126 50L138 42L150 52', { stroke: C.brown, w: .9 }) +
          [[100, 36], [128, 28], [140, 48]].map(([x, y]) => circ(x, y, 1.7, { fill: C.ink })).join('') + tag(98, 11, '1 / 100 000', { size: 4.4 }));
        o += at(st, 2, txt(40, 63, X.t('echelle.big.l'), { size: 4.4, fill: C.pri }) + txt(120, 63, X.t('echelle.big.r'), { size: 4.4, fill: C.brown }));
        return o;
      } },
    { id: 'v2', kind: 'vote', min: 2, vote: { opts: [{ mis: 'e-inv' }, { mis: 'e-inv' }, { mis: 'e-inv' }, { ok: true }] }, q: 1 },
    { id: 'pr', kind: 'practice', min: 3, practice: { ch: 'echelle', seconds: 90 } },
    { id: 'recap', kind: 'recap', steps: 4, min: 1,
      fig: (st, p, X) => recapFig('echelle', st, X) }
  ]
};

export const FR = {
  'topic.1': 'Échelle', 'topic.1.d': 'Rapport carte / terrain, conversion d’unités',
  'echelle.map': 'Sur la carte', 'echelle.ground': 'Sur le terrain', 'echelle.250': '250 m', 'echelle.q8': '8 cm sur la carte au 1/10 000', 'echelle.units': 'Attention : les unités !',
  'echelle.v1.top': 'Distance réelle ?', 'echelle.big.l': 'Petit territoire, détaillé', 'echelle.big.r': 'Grand territoire, simplifié',
  'echelle.recap.r0': 'D = d × N', 'echelle.recap.r1': 'cm → m → km : on convertit', 'echelle.recap.r2': 'Petit nombre = grande échelle',
  'echelle.hook.claim': 'Une carte rétrécit le monde',
  'echelle.hook.c0': 'Sur la carte, deux villages sont distants de **1 cm**.',
  'echelle.hook.c1': 'Et sur le terrain ? Il manque une information.',
  'echelle.hook.c2': 'L’échelle la donne : ici **1 cm = 250 m**.',
  'echelle.hook.note': 'Faire deviner avant de révéler. Poser une règle de 1 cm sur le tableau.', 'echelle.hook.ask': 'À main levée : 25 m, 250 m ou 2,5 km ?',
  'echelle.ratio.claim': 'L’échelle est un rapport',
  'echelle.ratio.c0': 'Ici, 4 cm sur la carte. Changez l’échelle avec ↑ ↓.',
  'echelle.ratio.c1': 'Plus le dénominateur grandit, plus la distance réelle grandit.',
  'echelle.ratio.c2': '**D = d × N** : toujours en cm d’abord.',
  'echelle.ratio.note': 'Garder 4 cm fixe et faire défiler les 4 échelles : la carte ne change pas, le terrain si.', 'echelle.ratio.ask': 'Pour la même distance au sol, quelle carte est la plus petite ?',
  'echelle.convert.claim': 'Convertir sans se tromper',
  'echelle.convert.c0': 'On part de la mesure faite sur la carte.',
  'echelle.convert.c1': 'On multiplie par le dénominateur : le résultat est en **cm**.',
  'echelle.convert.c2': '100 cm = 1 m : on divise par **100**.',
  'echelle.convert.c3': '1 000 m = 1 km : on divise par **1 000**.',
  'echelle.convert.note': 'Révéler une case à la fois ; faire dire l’opération avant chaque flèche.', 'echelle.convert.ask': 'Pourquoi passer par les centimètres ?',
  'echelle.v1.claim': 'Votre réponse ?', 'echelle.v1.q': '8 cm au 1/10 000 : quelle distance réelle ?',
  'echelle.v1.c0': 'Réfléchissez 20 secondes, sans calculatrice.', 'echelle.v1.c1': 'Levez la main : A, B, C ou D ? (touches a b c d)',
  'echelle.v1.o0': '0,8 km', 'echelle.v1.o1': '8 km', 'echelle.v1.o2': '80 km', 'echelle.v1.o3': '80 m',
  'echelle.v1.sol': '8 × 10 000 = 80 000 cm = 800 m = 0,8 km.', 'echelle.v1.note': 'Compter les mains par option (touches a–d), puis révéler.', 'echelle.v1.ask': 'Qui a trouvé 8 km ? Quelle étape a sauté ?',
  'echelle.big.claim': 'Grande échelle ≠ grand nombre',
  'echelle.big.c0': '1/10 000 : un petit territoire, très détaillé.',
  'echelle.big.c1': '1/100 000 : un grand territoire, peu de détails.',
  'echelle.big.c2': 'Plus le nombre est **petit**, plus l’échelle est **grande**.',
  'echelle.big.note': 'Même taille de feuille, deux échelles : ce qui change, c’est la surface du terrain représentée.', 'echelle.big.ask': 'Pour repérer une maison : quelle carte choisir ?',
  'echelle.v2.claim': 'Laquelle est la plus grande ?', 'echelle.v2.q': 'Quelle carte a la plus grande échelle ?',
  'echelle.v2.c0': 'Pensez aux détails visibles sur la carte.', 'echelle.v2.c1': 'Votez : A, B, C ou D.',
  'echelle.v2.o0': '1 / 500 000', 'echelle.v2.o1': '1 / 100 000', 'echelle.v2.o2': '1 / 50 000', 'echelle.v2.o3': '1 / 5 000',
  'echelle.v2.sol': '1/5 000 : le plus petit dénominateur.', 'echelle.v2.note': 'Le piège classique : « grand nombre = grande échelle ».', 'echelle.v2.ask': 'Comment vérifier avec une maison ?',
  'echelle.pr.claim': 'À vous de calculer',
  'echelle.pr.c0': 'Lisez l’énoncé.', 'echelle.pr.c1': 'Calculez : le minuteur tourne.', 'echelle.pr.c2': 'Correction.', 'echelle.pr.note': 'Exercice tiré du même moteur que l’espace élève : nouveau tirage avec N.', 'echelle.pr.ask': 'Qui a trouvé la même chose ?',
  'echelle.recap.claim': 'À retenir',
  'echelle.recap.c0': 'Trois idées.', 'echelle.recap.note': 'Ne rien ajouter : laisser les élèves reformuler.', 'echelle.recap.ask': 'Quel piège évitez-vous maintenant ?',
  'mis.t-unite': 'Unité oubliée (cm → m → km)', 'mis.t-unite.why': '80 000 cm = 800 m = 0,8 km : deux conversions successives.',
  'mis.e-div': 'Mauvaise puissance de 10', 'mis.e-div.why': 'Passer de cm à m, c’est ÷ 100 — pas ÷ 1 000.',
  'mis.e-inv': 'Grand nombre = grande échelle', 'mis.e-inv.why': '1/5 000 est une fraction plus grande que 1/500 000.'
};
