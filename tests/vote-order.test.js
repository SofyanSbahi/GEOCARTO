/* WP0 (v3.1) — ordre des options d'un vote mélangé par défaut.
   Avant : la bonne réponse était « A » dans 16 votes sur 20 (tous ceux de géologie) : un élève pouvait réussir sans raisonner et les taux
   de réussite / seuils de Mazur étaient faussés. Les décomptes restent en ordre canonique : journal et bilan ne changent pas. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { optionOrder, invertOrder } from '../js/stage/tools.js';
import { LESSONS } from '../js/stage/lessons/index.js';

const votes = [];
LESSONS.forEach(L => L.scenes.forEach(sc => { if (sc.kind === 'vote' && sc.vote) votes.push({ L, sc, key: `${L.id}.${sc.id}`, n: sc.vote.opts.length, ok: sc.vote.opts.findIndex(o => o.ok) }); }));

test('le catalogue contient bien les 20 votes attendus, chacun avec une seule bonne réponse', () => {
  assert.equal(votes.length, 20);
  for (const v of votes) assert.equal(v.sc.vote.opts.filter(o => o.ok).length, 1, v.key);
});

test('optionOrder : une permutation de 0..n-1, déterministe', () => {
  for (const v of votes) for (const seed of [0, 1, 12, 999]) {
    const p = optionOrder(v.n, v.key, seed), q = optionOrder(v.n, v.key, seed);
    assert.deepEqual(p, q, `${v.key} seed ${seed} : non déterministe`);
    assert.deepEqual([...p].sort(), Array.from({ length: v.n }, (_, i) => i), `${v.key} seed ${seed} : pas une permutation`);
  }
});

test('optionOrder : dépend de la scène et de la graine (pas un ordre unique pour toute la séance)', () => {
  const orders = new Set();
  for (const v of votes) orders.add(optionOrder(v.n, v.key, 12).join(''));
  assert.ok(orders.size >= 8, `trop peu d'ordres distincts d'une scène à l'autre : ${orders.size}`);
  const bySeed = new Set(); for (let s = 1; s <= 30; s++) bySeed.add(optionOrder(4, 'geocarte.v1', s).join(''));
  assert.ok(bySeed.size >= 12, `trop peu d'ordres distincts d'une graine à l'autre : ${bySeed.size}`);
});

test('fixed : l\'ordre d\'écriture est conservé ; n < 2 : identité', () => {
  assert.deepEqual(optionOrder(4, 'x', 7, true), [0, 1, 2, 3]);
  assert.deepEqual(optionOrder(1, 'x', 7), [0]);
  assert.deepEqual(optionOrder(0, 'x', 7), []);
});

test('invertOrder : lettre affichée ↔ option canonique', () => {
  for (const v of votes) for (let seed = 1; seed <= 20; seed++) {
    const p = optionOrder(v.n, v.key, seed), inv = invertOrder(p);
    p.forEach((c, d) => assert.equal(inv[c], d));
    assert.equal(p[inv[v.ok]], v.ok, `${v.key} : la bonne réponse n'est pas retrouvée à la lettre affichée`);
  }
});

test('la bonne réponse se répartit sur A, B, C et D (15 à 35 % chacune sur 200 graines, pour chaque vote)', () => {
  for (const v of votes) {
    const cnt = new Array(v.n).fill(0);
    for (let seed = 1; seed <= 200; seed++) cnt[invertOrder(optionOrder(v.n, v.key, seed))[v.ok]]++;
    cnt.forEach((c, d) => assert.ok(c >= 30 && c <= 70, `${v.key} : la bonne réponse est en ${'ABCD'[d]} dans ${c}/200 séances`));
  }
});

test('sur une séance donnée, la bonne réponse n\'est plus presque toujours « A »', () => {
  for (const seed of [1, 2, 3, 12]) {
    const letters = votes.map(v => invertOrder(optionOrder(v.n, v.key, seed))[v.ok]);
    const a = letters.filter(d => d === 0).length;
    assert.ok(a <= 10, `graine ${seed} : ${a} votes sur ${votes.length} ont encore la bonne réponse en A`);
    assert.ok(new Set(letters).size >= 3, `graine ${seed} : les bonnes réponses n'occupent que ${new Set(letters).size} lettres`);
  }
});

test('un ordre fixe doit être justifié dans la scène (fixedWhy) ; aucun vote actuel n\'en a besoin', () => {
  for (const v of votes) if (v.sc.vote.fixed) assert.ok(typeof v.sc.vote.fixedWhy === 'string' && v.sc.vote.fixedWhy.length > 10, `${v.key} : fixed sans fixedWhy`);
  assert.equal(votes.filter(v => v.sc.vote.fixed).length, 0, 'revue des 20 votes (2026-10-21) : aucun ne requiert d\'ordre fixe');
});
