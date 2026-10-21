/* Thème 11 — COUPES GÉOLOGIQUES. 12 scènes ≈ 36 min. Idée centrale : une coupe n'est pas dessinée, elle est RAISONNÉE :
   la surface donne les points de départ (où la trace A→B coupe chaque contact), le pendage donne la direction de chaque contact en profondeur
   (pendage APPARENT, car la coupe n'est pas forcément perpendiculaire à la direction), les contacts sont parallèles, puis on colorie.
   On ne montre jamais la coupe finie d'emblée : on la construit pas à pas, puis le moteur trace la coupe exacte et on compare (correction progressive).
   Tout vient du moteur Géologie (coupe exacte, points de contact en surface, pendage apparent). */
import * as K from '../kit.js';
import { geoMapSvg, mapPt, azArrow, callout, toward, top, legendSvg } from './geomap.js';
import { missionGeo, tabGeo, exoGeo, galerie, TAB_AB, EXO_AB, midLine } from './geoworld.js';
import * as S from './geosection.js';
import { apparentDip } from '../../engine/geology/index.js';
import { recapFig } from './mission.js';
const { C, txt, line, rect, circ, path, poly, arrow, at, badge, tag } = K;

const RAD = Math.PI / 180, SEC = { x: 10, y: 3, w: 144, h: 50 };
const bot = (label, o = {}) => callout(80, 61, label, { w: 122, lines: 2, size: 5.4, ...o });
const sense = (S0, dipAz) => Math.cos((dipAz - S0.az) * RAD) >= 0 ? 1 : -1;       // +1 : les contacts descendent vers B (à droite)
const ms = () => { const M = missionGeo(); return { M, s: S.sectionOf(M, M.A, M.B) }; };
const ab = (F, s, quiet = true) => { const y = F.box.y + F.box.h + 3.4; return badge(F.X(0), y, 'A', { r: 2.6, fill: C.acc, quiet }) + badge(F.X(s.L), y, 'B', { r: 2.6, fill: C.acc, quiet }); };
const lines = (s, F, a, sn, o = {}) => s.cps.map(c => S.dipLine(F, c, typeof a === 'function' ? a(c) : a, sn, o)).join('');
const sky = '#ffffff';

export const coupe = {
  id: 'coupe', title: 'topic.11', seed: 4,
  scenes: [
    { id: 'hook', kind: 'hook', steps: 3, min: 1,
      fig: (st, p, X) => {
        const { s } = ms(), F = S.frame(s, SEC);
        let o = S.groundFill(s, F) + (st >= 1 ? S.stripSvg(s, F) + S.contactDots(s, F) : path(S.terrainD(s, F), { stroke: C.ink, w: .9 })) + ab(F, s) + S.frameRect(F);
        o += st === 2 ? txt(F.X(s.L / 2), F.box.y + F.box.h * .72, '?', { size: 15, w: 800, fill: C.acc }) : '';
        return o + (st === 0 ? bot(X.t('coupe.hook.t0')) : st === 1 ? bot(X.t('coupe.hook.t1')) : bot(X.t('coupe.hook.t2'), { fill: C.acc }));
      } },
    { id: 'v1', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 'g-coupe-sens' }, { mis: 'g-coupe-vert' }, { mis: 'g-coupe-horiz' }],
        draw: (st, X) => {
          const { M, s } = ms(), box = { x: 4, y: 26, w: 82, h: 36 }, F = S.frame(s, box), ins = { x: 60, y: 2, w: 26, h: 17.9 }, a = mapPt(M, ins, M.A), b = mapPt(M, ins, M.B), c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          const f = K.fit(X.t('coupe.v1.top', { dip: M.dip, dir: toward(M.dipAz) }), 52, 4.8, 3);
          return S.groundFill(s, F) + S.stripSvg(s, F, { w: 2 }) + S.contactDots(s, F, 1.1) + S.frameRect(F) + ab(F, s) +
            geoMapSvg(M, ins, {}) + line(a[0], a[1], b[0], b[1], { c: C.ink, w: .9 }) + azArrow(c[0], c[1], M.dipAz, 6, { c: C.acc, w: 1.2, head: 2.4 }) +
            K.txtL(4, 5.2, f.lines, { size: f.size, lh: f.size * 1.2, anchor: 'start', w: 800, fixed: true });
        } },
      q: 1 },
    { id: 'horiz', kind: 'build', steps: 4, min: 2,
      fig: (st, p, X) => {
        const T = tabGeo(), m = missionGeo().m, s = S.sectionOf(T, TAB_AB.A, TAB_AB.B), F = S.frame(s, SEC);
        let o = S.groundFill(s, F);
        if (st >= 2) o += S.clipped(s, F, T.levels.map(z => line(F.box.x, F.Z(z), F.box.x + F.box.w, F.Z(z), { c: C.ink, w: .7, dash: '2 1.4' })).join(''), { ground: true });
        if (st >= 3) o += S.clipped(s, F, S.regionsSvg(s, F, { labels: false }), { ground: true });
        o += S.stripSvg(s, F) + S.contactDots(s, F, 1) + S.frameRect(F) + ab(F, s);
        if (st >= 1) o += T.levels.map(z => txt(F.box.x + 1, F.Z(z) - 1.6, String(z), { size: 4.2, w: 800, anchor: 'start', halo: true })).join('');
        return o + [bot(X.t('coupe.horiz.t0')), bot(X.t('coupe.horiz.t1')), bot(X.t('coupe.horiz.t2')), bot(X.t('coupe.horiz.t3'), { fill: C.pri })][st];
      } },
    { id: 'mono', kind: 'build', steps: 6, min: 5,
      fig: (st, p, X) => {
        const { M, s } = ms(), F = S.frame(s, SEC), sn = sense(M, M.dipAz), a = M.apparent, c0 = s.cps[0];
        let o = S.groundFill(s, F);
        if (st >= 4) o += S.clipped(s, F, S.regionsSvg(s, F, { labels: st >= 5 }), { ground: true });
        o += S.clipped(s, F, (st >= 2 ? S.dipLine(F, c0, a, sn, { c: C.acc, w: 1.7 }) : '') + (st >= 3 ? s.cps.slice(1).map(c => S.dipLine(F, c, a, sn, { c: st >= 4 ? C.ink : C.acc, w: 1.3 })).join('') : '') +
          (st >= 5 ? s.cps.map(c => { const u = c.from, v = c.to; return path(S.contactD(s, F, Math.min(u, v), Math.max(u, v)), { stroke: '#fff', w: .8, dash: '1.6 1.4' }); }).join('') : ''), { ground: true });
        o += S.stripSvg(s, F) + S.contactDots(s, F, 1.1) + S.frameRect(F) + ab(F, s);
        if (st === 2) o += tag(F.X(c0.s) + (sn > 0 ? 22 : -22), F.Z(c0.z) + 9, `${X.nf(a, 0)}°`, { size: 5, fill: C.acc });
        const e = st >= 5 ? Math.abs((S.exactAngle(s, s.cps[1].from, s.cps[1].to) || a) - a) : 0;
        return o + [bot(X.t('coupe.mono.t0')), bot(X.t('coupe.mono.t1', { d: M.dip, b: X.nf(Math.abs(((M.dipAz - M.az + 540) % 360) - 180), 0), a: X.nf(a, 0) })), bot(X.t('coupe.mono.t2', { a: X.nf(a, 0) }), { fill: C.acc }), bot(X.t('coupe.mono.t3')), bot(X.t('coupe.mono.t4')), bot(X.t('coupe.mono.t5', { e: X.nf(e, 1) }), { fill: C.pri })][st];
      } },
    { id: 'v2', kind: 'vote', min: 3,
      vote: { opts: [{ ok: true }, { mis: 'g-coupe-fort' }, { mis: 'g-coupe-fan' }, { mis: 'g-coupe-ok' }],
        draw: (st, X) => {
          const { M, s } = ms(), box = { x: 4, y: 20, w: 82, h: 40 }, F = S.frame(s, box), sn = sense(M, M.dipAz);
          let o = S.groundFill(s, F) + S.stripSvg(s, F, { w: 2 }) + S.contactDots(s, F, 1.1) + lines(s, F, M.apparent, -sn, { c: C.ink, w: 1 });
          if (st >= 2) o += lines(s, F, M.apparent, sn, { c: C.green, w: 1.6, dash: '2 1.4' });
          return o + S.frameRect(F) + top(X.t('coupe.v2.top'));
        } },
      q: 1 },
    { id: 'erreurs', kind: 'show', steps: 4, min: 2,
      fig: (st, p, X) => {
        const { M, s } = ms(), F = S.frame(s, SEC), sn = sense(M, M.dipAz), a = M.apparent;
        let o = S.groundFill(s, F) + S.clipped(s, F, S.regionsSvg(s, F, { op: st === 0 ? 1 : .3, lineOp: st === 0 ? 1 : .25 }), { ground: true });
        o += S.clipped(s, F, (st === 1 ? lines(s, F, a, -sn, { c: C.red, w: 1.6, dash: '2.4 1.4' }) : st === 2 ? lines(s, F, c => 14 + 16 * (c.s / s.L) * 2, sn, { c: C.red, w: 1.6, dash: '2.4 1.4' }) : st === 3 ? lines(s, F, 0, sn, { c: C.red, w: 1.6, dash: '2.4 1.4' }) : ''), { ground: true });
        o += S.stripSvg(s, F) + S.contactDots(s, F, 1.1) + S.frameRect(F) + ab(F, s);
        return o + [bot(X.t('coupe.erreurs.t0'), { fill: C.pri }), bot(X.t('coupe.erreurs.t1'), { fill: C.red }), bot(X.t('coupe.erreurs.t2'), { fill: C.red }), bot(X.t('coupe.erreurs.t3'), { fill: C.red })][st];
      } },
    { id: 'apparent', kind: 'show', steps: 4, min: 3,
      fig: (st, p, X) => {
        const dip = 45, beta = 60, app = apparentDip(dip, 90, 90 - beta), R = Math.PI / 180;
        let o = rect(5, 4, 66, 46, { fill: C.soft, stroke: C.ink, w: .5, rx: 2 }) + line(38, 6, 38, 48, { c: C.acc, w: 1.3 }) + arrow(38, 27, 54, 27, { c: C.ink, w: 1.3, head: 3.4 }) + txt(58.2, 27, `${dip}°`, { size: 4.4, w: 800, anchor: 'start' });
        const AB = [[14, 38], [62, 38]], CD = [[20, 46], [20 + 44 * Math.cos(beta * R), 46 - 44 * Math.sin(beta * R)]];
        o += at(st, 1, arrow(AB[0][0], AB[0][1], AB[1][0], AB[1][1], { c: C.blue, w: 1.1, head: 3 }) + rect(76, 4, 78, 22, { fill: '#fff', stroke: C.ink, w: .5, rx: 1 }) + line(78, 10, 152, 10, { c: C.ink, w: .8 }) + line(104, 10, 130, 10 + 26 * Math.tan(dip * R), { c: C.blue, w: 1.6 }) + tag(137, 20, `${dip}°`, { size: 4.6, fill: C.blue }), { rest: st > 1 });
        o += at(st, 2, arrow(CD[0][0], CD[0][1], CD[1][0], CD[1][1], { c: C.green, w: 1.1, head: 3 }) + rect(76, 28, 78, 22, { fill: '#fff', stroke: C.ink, w: .5, rx: 1 }) + line(78, 33, 152, 33, { c: C.ink, w: .8 }) + line(104, 33, 130, 33 + 26 * Math.tan(app * R), { c: C.green, w: 1.6 }) + tag(137, 44, `${X.nf(app, 0)}°`, { size: 4.6, fill: C.green }), { rest: st > 2 });
        return o + [bot(X.t('coupe.apparent.t0')), bot(X.t('coupe.apparent.t1')), bot(X.t('coupe.apparent.t2')), bot(X.t('coupe.apparent.t3', { b: beta }), { fill: C.acc })][st];
      } },
    { id: 'ev', kind: 'show', steps: 3, min: 2, param: { values: [1, 2, 3], start: 0, label: (v, i, X) => X.t('coupe.ev.p', { n: v }) },
      fig: (st, ev, X) => {
        const { M, s } = ms(), F = S.frame(s, SEC, ev), sn = sense(M, M.dipAz), a = M.apparent, c0 = s.cps[1];
        let o = S.groundFill(s, F) + S.clipped(s, F, S.regionsSvg(s, F, {}) + lines(s, F, a, sn, { c: C.ink, w: 1 }), { ground: true }) + S.stripSvg(s, F) + S.frameRect(F);
        if (st >= 1) o += tag(F.X(c0.s) + (sn > 0 ? 20 : -20), Math.min(F.Z(c0.z) + 11, 44), `${X.nf(S.drawnAngle(a, ev), 0)}°`, { size: 5, fill: ev === 1 ? C.green : C.red });
        return o + [bot(X.t('coupe.ev.t0', { n: ev })), bot(X.t(ev === 1 ? 'coupe.ev.t1b' : 'coupe.ev.t1', { m: X.nf(S.drawnAngle(a, ev), 0), a: X.nf(a, 0) }), { fill: ev === 1 ? C.pri : C.red }), bot(X.t('coupe.ev.t2'), { fill: C.pri })][st];
      } },
    { id: 'v3', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 'g-coupe-pli-inv' }, { mis: 'g-coupe-pli-mono' }, { mis: 'g-coupe-pli-tab' }],
        draw: (st, X) => {
          const G = galerie('anticlinal'), box = { x: 2, y: 13, w: 66, h: 45.5 }, d = G.geo.dem, a = mapPt(G, box, midLine(G).A), b = mapPt(G, box, midLine(G).B);
          return geoMapSvg(G, box, {}) + line(a[0], a[1], b[0], b[1], { c: C.ink, w: 1.1 }) + badge(a[0], a[1], 'A', { r: 2.4, fill: C.acc, quiet: true }) + badge(b[0], b[1], 'B', { r: 2.4, fill: C.acc, quiet: true }) +
            legendSvg(G, 72, 13, 13, 45) + txt(78.5, 10.4, X.t('coupe.v3.young'), { size: 3.6, w: 700, fill: C.mute }) + txt(78.5, 61.6, X.t('coupe.v3.old'), { size: 3.6, w: 700, fill: C.mute }) + top(X.t('coupe.v3.top'));
        } },
      q: 1 },
    { id: 'struct', kind: 'show', steps: 5, min: 4,
      fig: (st, p, X) => {
        const k = ['tabulaire', 'monoclinal', 'anticlinal', 'synclinal', 'discordance'][st], G = galerie(k), l = midLine(G), s = S.sectionOf(G, l.A, l.B, 260, 140, .3), F = S.frame(s, SEC);
        return S.groundFill(s, F) + S.clipped(s, F, S.regionsSvg(s, F, { labels: true }), { ground: true }) + S.stripSvg(s, F, { w: 1.6 }) + S.frameRect(F) + ab(F, s) + bot(X.t('coupe.sig.' + k), { fill: k === 'anticlinal' || k === 'synclinal' ? C.acc : C.ink });
      } },
    { id: 'pr', kind: 'practice', min: 5, practice: { seconds: 300, draw: true },
      fig: (st, p, X) => {
        const E = exoGeo(), s = S.sectionOf(E, EXO_AB.A, EXO_AB.B), F = S.frame(s, SEC), dip = 30, dipAz = 100, a = apparentDip(dip, dipAz, s.az), sn = sense(s, dipAz);
        let o = S.groundFill(s, F);
        if (st >= 2) o += S.clipped(s, F, S.regionsSvg(s, F, { labels: true }) + lines(s, F, a, sn, { c: C.ink, w: 1.2 }), { ground: true });
        o += S.stripSvg(s, F) + S.contactDots(s, F, 1.1) + S.frameRect(F) + ab(F, s);
        return o + (st < 2 ? bot(X.t('coupe.pr.t0', { d: dip, dir: toward(dipAz), az: X.nf(s.az, 0) })) : bot(X.t('coupe.pr.t2', { a: X.nf(a, 0), b: X.nf(Math.abs(((dipAz - s.az + 540) % 360) - 180), 0) }), { fill: C.pri }));
      } },
    { id: 'recap', kind: 'recap', steps: 4, min: 1, fig: (st, p, X) => recapFig('coupe', st, X) }
  ]
};

const sc = (id, claim, cs, note, ask) => Object.fromEntries([[`coupe.${id}.claim`, claim], ...cs.map((c, i) => [`coupe.${id}.c${i}`, c]), [`coupe.${id}.note`, note], [`coupe.${id}.ask`, ask]]);
const vt = (id, claim, q, opts, sol, note, ask) => ({ ...sc(id, claim, ['Réfléchissez 20 secondes, sans parler.', 'Votez : A, B, C ou D.'], note, ask), [`coupe.${id}.q`]: q, ...Object.fromEntries(opts.map((o, i) => [`coupe.${id}.o${i}`, o])), [`coupe.${id}.sol`]: sol });

export const FR = {
  'topic.11': 'Coupes géologiques', 'topic.11.d': 'Du plan à la coupe : prolonger les contacts en profondeur',
  'coupe.recap.r0': 'Surface : points de départ', 'coupe.recap.r1': 'Pendage apparent, parallèles', 'coupe.recap.r2': 'Même échelle, Ev = Eh', 'coupe.recap.c3': 'La réponse pour la mission.',
  'coupe.hook.t0': 'Le profil du trajet', 'coupe.hook.t1': 'Les formations en surface', 'coupe.hook.t2': 'Et sous le sol ?',
  ...sc('hook', 'Ce que cache le sol',
    ['Voici le **profil** de la mission : A → B.', 'On pose dessus les **couleurs de la carte géologique**.', 'Mais que se passe-t-il **sous** la surface ? Personne n’y a creusé.'],
    'Rappeler la leçon précédente : on a tout ce qu’il faut pour raisonner (contacts, pendage, âges).', 'Comment savoir sans creuser ?'),
  'coupe.v1.top': 'Pendage {dip}° vers {dir}. Et dessous\u00a0?',
  ...vt('v1', 'Où vont les contacts ?', 'Sous la surface, les contacts du profil A → B…', ['Descendent vers B (à droite)', 'Descendent vers A (à gauche)', 'Sont verticaux', 'Restent horizontaux'],
    'Le pendage va vers l’Est : côté B de la trace.', 'Revenir sur la petite carte : la flèche rouge est le sens du pendage.', 'Qui a regardé le sens de la flèche par rapport à A → B ?'),
  'coupe.horiz.t0': 'Couches horizontales : un cas simple', 'coupe.horiz.t1': 'Contact en surface = altitude connue', 'coupe.horiz.t2': 'Chaque contact reste à son altitude', 'coupe.horiz.t3': 'Coupe terminée : bandes horizontales',
  ...sc('horiz', 'D’abord le cas le plus simple',
    ['Couches horizontales : le profil, avec les contacts vus en surface.', 'Chaque contact a une **altitude** : 400, 500, 600 ou 700 m.', 'Un contact horizontal garde **son altitude** sous le sol : on prolonge à plat.', 'On colorie entre les lignes : la coupe est finie.'],
    'Insister : en horizontal, on n’a besoin d’aucun calcul. Le pendage, c’est la difficulté de la suite.', 'Que deviendrait la ligne si la couche penchait ?'),
  'coupe.mono.t0': 'Cinq contacts coupés par A → B', 'coupe.mono.t1': 'δ = {d}° et angle {b}° avec A → B : α′ = {a}°', 'coupe.mono.t2': 'Premier contact : pendage apparent {a}°', 'coupe.mono.t3': 'Les autres contacts lui sont parallèles', 'coupe.mono.t4': 'On colorie entre les lignes', 'coupe.mono.t5': 'Coupe exacte du moteur : écart {e}°',
  ...sc('mono', 'Construire une coupe inclinée',
    ['Départ : **cinq points de contact** sur le profil, ceux de la carte.', 'La coupe est oblique au pendage : on calcule le **pendage apparent α′**.', 'Du premier point, on trace le contact **à α′**, du côté du pendage.', 'Les autres contacts sont **parallèles** : même angle, depuis chacun de leurs points.', 'On **colorie** les bandes entre deux lignes, avec la bonne couleur.', 'Le moteur trace la coupe **exacte** : elle se superpose à votre construction.'],
    'Construire au tableau en parallèle, avec rapporteur et règle. C’est la scène centrale : laisser prédire chaque étape avant de cliquer.', 'Pourquoi des lignes parallèles et pas en éventail ?'),
  'coupe.v2.top': 'La coupe d’un camarade : quelle erreur ?',
  ...vt('v2', 'Quelle est l’erreur ?', 'La coupe du camarade (traits noirs) comporte…', ['Un sens de pendage inversé', 'Pendage trop fort', 'Des contacts non parallèles', 'Aucune erreur'],
    'Les contacts penchent du mauvais côté : le pendage va vers B.', 'La correction (tirets verts) arrive à la révélation : elle compare, elle ne juge pas.', 'Comment le voit-on sur la petite carte ?'),
  'coupe.erreurs.t0': 'La bonne coupe', 'coupe.erreurs.t1': 'Sens du pendage inversé', 'coupe.erreurs.t2': 'Contacts non parallèles', 'coupe.erreurs.t3': 'Horizontaux : pendage oublié',
  ...sc('erreurs', 'Trois erreurs fréquentes',
    ['La coupe juste : voilà ce qu’on cherche.', 'Erreur 1 : on a **inversé le sens** du pendage.', 'Erreur 2 : les contacts partent **en éventail** : ils doivent être parallèles.', 'Erreur 3 : on **prolonge à plat** : le pendage est oublié.'],
    'Pour chaque erreur, demander « qu’est-ce qui vous l’a fait faire ? » avant de corriger.', 'Laquelle avez-vous déjà faite ?'),
  'coupe.apparent.t0': 'Un plan incliné de 45°', 'coupe.apparent.t1': 'Coupe perpendiculaire à la direction : 45°', 'coupe.apparent.t2': 'Coupe oblique : le contact paraît moins incliné', 'coupe.apparent.t3': 'tan α′ = tan δ × cos β  (β = {b}°)',
  ...sc('apparent', 'Pourquoi le pendage change selon la coupe',
    ['Une couche penche de **45°** vers l’Est.', 'On la coupe **perpendiculairement** à sa direction : on voit **45°**.', 'On la coupe **en biais** : le même plan paraît **moins incliné**.', 'Plus la coupe s’écarte du sens du pendage, **plus le pendage apparent diminue**.'],
    'Faire un geste : un livre incliné, coupé par deux plans de papier.', 'Et si la coupe suit exactement la direction ?'),
  'coupe.ev.p': 'Vertical ×{n}', 'coupe.ev.t0': 'Échelle verticale ×{n}', 'coupe.ev.t1': 'Angle mesuré {m}° au lieu de {a}°', 'coupe.ev.t1b': 'Ev = Eh : l’angle mesuré est vrai ({m}°)', 'coupe.ev.t2': 'Même échelle partout : Ev = Eh',
  ...sc('ev', 'L’échelle verticale fausse les angles',
    ['Même coupe, **échelle verticale ×N** (↑ ↓).', 'En agrandissant la verticale, les angles mesurés **grandissent**.', 'Pour une coupe géologique : **Ev = Eh**, toujours, sinon les pendages mentent.'],
    'Faire varier ↑ ↓ : ×1 → ×2 → ×3. L’angle mesuré sur l’écran change, le pendage réel non.', 'Quelle est la coupe topographique exagérée du TP ?'),
  'coupe.v3.top': 'Coupe suivant A → B ?', 'coupe.v3.young': 'récent', 'coupe.v3.old': 'ancien',
  ...vt('v3', 'Quelle forme en coupe ?', 'Le long de A → B, la coupe montre…', ['Une voûte (anticlinal)', 'Une cuvette (synclinal)', 'Bandes inclinées', 'Des couches horizontales'],
    'Plus ancien au centre ⇒ voûte.', 'Prédire avant de montrer : c’est le test de la leçon précédente.', 'Que changerait un synclinal ?'),
  'coupe.sig.tabulaire': 'Tabulaire : bandes horizontales', 'coupe.sig.monoclinal': 'Monoclinal : bandes inclinées parallèles', 'coupe.sig.anticlinal': 'Anticlinal : voûte, ancien au cœur', 'coupe.sig.synclinal': 'Synclinal : cuvette, récent au cœur', 'coupe.sig.discordance': 'Discordance : des couches reposent sur d’autres tronquées',
  ...sc('struct', 'Cinq structures en coupe',
    ['**Tabulaire** : couches horizontales.', '**Monoclinal** : couches inclinées, parallèles.', '**Anticlinal** : une voûte, les plus anciennes au cœur.', '**Synclinal** : une cuvette, les plus récentes au cœur.', '**Discordance** : une surface d’érosion sépare deux séries.'],
    'Revenir sur les cartes de la leçon précédente : même structure, vue de profil.', 'Quelle coupe ressemble à quelle carte ?'),
  'coupe.pr.t0': 'Pendage {d}° vers {dir} · A → B : cap {az}°', 'coupe.pr.t2': 'Pendage apparent {a}° (angle β = {b}°)',
  ...sc('pr', 'À vous : construisez la coupe',
    ['Sur **votre** feuille : le profil A → B avec les quatre points de contact.', 'Calculez α′, tracez les contacts parallèles, coloriez. Le minuteur tourne.', 'Correction : la coupe exacte et l’angle apparent.'],
    'Distribuer le profil imprimé. Circuler : regarder surtout le sens du pendage et le parallélisme.', 'Qui a trouvé un angle différent ?'),
  ...sc('recap', 'À retenir',
    ['La surface donne les **points de départ** : A → B coupe les contacts.', 'On trace les contacts au **pendage apparent**, tous **parallèles**.', 'Toujours **la même échelle** en horizontal et en vertical : Ev = Eh.', 'La réponse de la mission.'], 'Fin du parcours géologique : place à l’évaluation.', 'Quelle étape était la plus difficile ?'),
  'mis.g-coupe-sens': 'Sens du pendage inversé', 'mis.g-coupe-sens.why': 'Les contacts plongent du côté où la flèche de pendage pointe par rapport à A → B.',
  'mis.g-coupe-vert': 'Contacts verticaux', 'mis.g-coupe-vert.why': 'Un pendage de 35° n’est pas vertical : l’angle vient de la carte.',
  'mis.g-coupe-horiz': 'Contacts horizontaux', 'mis.g-coupe-horiz.why': 'Horizontaux seulement si la couche l’est : ici elle penche.',
  'mis.g-coupe-fort': 'Pendage vrai au lieu de l’apparent', 'mis.g-coupe-fort.why': 'La coupe oblique montre un angle plus faible que le pendage vrai : tan α′ = tan δ × cos β.',
  'mis.g-coupe-fan': 'Contacts en éventail', 'mis.g-coupe-fan.why': 'Les contacts d’une couche plane sont parallèles : même pendage apparent.',
  'mis.g-coupe-ok': 'Coupe prise pour juste', 'mis.g-coupe-ok.why': 'Comparer le sens du pendage de la carte et celui de la coupe.',
  'mis.g-coupe-pli-inv': 'Cuvette au lieu de voûte', 'mis.g-coupe-pli-inv.why': 'Ancien au cœur ⇒ anticlinal ⇒ voûte.',
  'mis.g-coupe-pli-mono': 'Bandes parallèles inclinées', 'mis.g-coupe-pli-mono.why': 'Un monoclinal n’est pas symétrique : ici les âges le sont.',
  'mis.g-coupe-pli-tab': 'Couches horizontales', 'mis.g-coupe-pli-tab.why': 'Des contacts qui ne suivent pas les courbes indiquent un pli ou un pendage.'
};
