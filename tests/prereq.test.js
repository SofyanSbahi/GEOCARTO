/* WP4 (v3.1) — leçon préalable « Lire le relief » : les trois figures disent vrai (altitudes, sens, pointe du V), les trois votes sont complets et
   la leçon est marquée brouillon jusqu'à relecture par un géologue. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { t, has } from '../js/stage/i18n.js';
import '../js/stage/lessons/fr.js';
import { LESSONS, lessonById } from '../js/stage/lessons/index.js';
import { FIGS } from '../js/stage/lessons/prereq.js';

const L = lessonById('prereq'), votes = L.scenes.filter(s => s.kind === 'vote');

test('la leçon préalable existe, compte 3 votes et un récapitulatif, et est un brouillon', () => {
  assert.ok(L && LESSONS.includes(L));
  assert.equal(votes.length, 3);
  assert.equal(L.scenes.at(-1).kind, 'recap');
  assert.equal(L.draft, true);
  assert.equal(L.scenes.reduce((a, s) => a + (s.min || 2), 0) <= 8, true, 'durée ≤ 8 min');
});
test('vote 1 : P et Q sont sur la même courbe, donc à la même altitude, et ne se confondent pas', () => {
  const f = FIGS.v1(); assert.equal(f.zP, f.zQ); assert.ok(Math.hypot(f.P[0] - f.Q[0], f.P[1] - f.Q[1]) > 15);
});
test('vote 2 : l’altitude baisse bien de P vers Q (bonne réponse « Descend »), points distincts', () => {
  const f = FIGS.v2(); assert.ok(f.zP > f.zQ); assert.ok(Math.hypot(f.P[0] - f.Q[0], f.P[1] - f.Q[1]) > 8);
});
test('vote 3 : la pointe encerclée est le point le plus haut de la courbe, dans la carte', () => {
  const f = FIGS.v3(); assert.ok(f.up); assert.ok(f.apex[1] > 19 && f.apex[0] > 4 && f.apex[0] < 86);
});
test('chaque vote a une seule bonne réponse, des malentendus nommés et tous les textes français', () => {
  for (const s of votes) {
    assert.equal(s.vote.opts.filter(o => o.ok).length, 1);
    for (const k of ['claim', 'note', 'ask', 'q', 'sol']) assert.ok(has(`prereq.${s.id}.${k}`), `${s.id}.${k}`);
    s.vote.opts.forEach((o, i) => { assert.ok(has(`prereq.${s.id}.o${i}`)); if (o.mis) assert.ok(has('mis.' + o.mis) && has('mis.' + o.mis + '.why'), o.mis); });
  }
});
test('le brouillon est annoncé en clair', () => assert.match(t('th.draft'), /brouillon automatique/));
