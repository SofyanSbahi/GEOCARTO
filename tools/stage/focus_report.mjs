/* Rapport « 2 secondes » : pour chaque écran de chaque leçon, compte les POINTS FOCAUX (étiquettes pleines, pastilles, grands chiffres ≥ 6 u)
   et les MOTS dans la figure. MOTS = jetons d'au moins 2 lettres (les graduations, chiffres et repères A/B/P ne sont pas de la lecture). Un écran qui dépasse le budget a plusieurs centres d'attention concurrents : il doit être redessiné.
   Usage : node tools/stage/focus_report.mjs [--json] */
import { t, nf } from '../../js/stage/i18n.js';
import '../../js/stage/lessons/fr.js';
import { LESSONS } from '../../js/stage/lessons/index.js';
import { stepsOf, paramOf } from '../../js/stage/lesson.js';
import * as K from '../../js/stage/kit.js';
export const BUDGET = { focal: 3, words: 12 };
export function measure(fig) {
  const focal = (fig.match(/class="[^"]*\bfp\b/g) || []).length;
  const texts = [...fig.matchAll(/<text ([^>]*)>([^<]*)<\/text>/g)].filter(m => !/data-old/.test(m[1])).map(m => m[2]);
  return { focal, words: texts.join(' ').split(/\s+/).filter(w => (w.match(/\p{L}/gu) || []).length >= 2).length, texts: texts.length };
}
export function report() {
  const rows = [];
  for (const L of LESSONS.filter(l => !l.planned)) {
    const ctx = L.setup ? L.setup(L.seed || 1) : {};
    for (const sc of L.scenes) {
      if (!sc.fig && !(sc.vote && sc.vote.draw)) continue;
      const pvs = sc.param ? sc.param.values.map((v, i) => i) : [0]; let worst = { focal: 0, words: 0, st: 0, pi: 0 };
      for (const pi of pvs) for (let st = 0; st < stepsOf(sc, ctx); st++) {
        K.room(1); K.direction(true);
        const x = { t, nf, ctx, pi, scene: sc, lesson: L, rs: 1 }, pv = paramOf(sc, pi);
        const fig = sc.kind === 'vote' ? sc.vote.draw(st, x) : sc.fig(st, pv, x), m = measure(fig);
        if (m.focal > worst.focal || (m.focal === worst.focal && m.words > worst.words)) worst = { ...m, st, pi };
      }
      rows.push({ id: `${L.id}.${sc.id}`, ...worst, budget: sc.kind === 'vote' ? Math.max(BUDGET.focal, sc.vote.opts.length) : BUDGET.focal });
    }
  }
  return rows;
}
if (process.argv[1] && process.argv[1].endsWith('focus_report.mjs')) {
  const rows = report(), bad = rows.filter(r => r.focal > r.budget || r.words > BUDGET.words);
  if (process.argv.includes('--json')) console.log(JSON.stringify(rows)); else {
    console.log('scène'.padEnd(22), 'focaux', 'mots'); for (const r of rows) console.log(r.id.padEnd(22), String(r.focal).padStart(6), String(r.words).padStart(5), r.focal > r.budget || r.words > BUDGET.words ? '  ← à redessiner' : '');
    console.log(`\n${bad.length} / ${rows.length} scènes au-delà du budget (≤ ${BUDGET.focal} points focaux, ≤ ${BUDGET.words} mots dans la figure)`);
  }
}
