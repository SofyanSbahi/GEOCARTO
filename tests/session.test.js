/* rc.6 — enchaînement des leçons en séance : ordre du cours, préalable facultatif jamais imposé, carte de fin à la place du retour au menu,
   vue enseignant qui suit. Le comportement réel (chaîne complète au clavier / télécommande) est vérifié dans Chromium (docs/V3_1_RELEASE.md § 11). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/stage/lessons/fr.js';
import { SEQUENCE, OPTIONAL, nextLesson, prevLesson, LESSONS, lessonById, TOPICS } from '../js/stage/lessons/index.js';
const src = fs.readFileSync(new URL('../js/stage/lesson.js', import.meta.url), 'utf8');

test('la séquence couvre toutes les leçons Stage une seule fois, préalable mis à part', () => {
  assert.equal(new Set(SEQUENCE).size, SEQUENCE.length);
  for (const id of SEQUENCE) assert.ok(lessonById(id), id);
  assert.deepEqual([...SEQUENCE, OPTIONAL.id].sort(), LESSONS.map(L => L.id).sort());
  assert.ok(!SEQUENCE.includes(OPTIONAL.id), 'le préalable ne doit jamais être enchaîné automatiquement');
});
test('ordre du cours : prologue d’abord, puis l’ordre des thèmes (première apparition de chaque leçon)', () => {
  const firstSeen = [...new Set(TOPICS.map(tp => tp.id))];
  assert.equal(SEQUENCE[0], 'mission'); assert.deepEqual(SEQUENCE.slice(1), firstSeen);
});
test('suivant / précédent : inverses l’un de l’autre, bornés aux extrémités', () => {
  for (let i = 0; i < SEQUENCE.length - 1; i++) { assert.equal(nextLesson(SEQUENCE[i]), SEQUENCE[i + 1]); assert.equal(prevLesson(SEQUENCE[i + 1]), SEQUENCE[i]); }
  assert.equal(prevLesson(SEQUENCE[0]), null); assert.equal(nextLesson(SEQUENCE.at(-1)), null);
});
test('préalable : placé entre profil et cartes géologiques, sans en être un passage obligé', () => {
  assert.equal(nextLesson('profil'), 'geocarte'); assert.equal(nextLesson(OPTIONAL.id), 'geocarte'); assert.equal(prevLesson(OPTIONAL.id), 'profil');
  assert.equal(OPTIONAL.after, 'profil'); assert.equal(OPTIONAL.before, 'geocarte');
});
test('la fin de leçon affiche la carte au lieu de revenir au menu ; « suivant » sur la carte lance la leçon suivante', () => {
  assert.ok(!/else \{ location\.hash = '#\/stage'; \} \};/.test(src), 'retour au menu supprimé');
  assert.match(src, /else if \(!S\.end\) endCard\(true\); else \{ const n = nextLesson\(L\.id\); if \(n\) goLesson\(n\); \}/);
  assert.match(src, /const prev = \(\) => \{ if \(S\.end\) \{ endCard\(false\); return; \}/);
});
test('la vue enseignant suit la projection et propose précédent / menu / suivant (+ préalable après profil)', () => {
  assert.match(src, /m\.t === 'lesson' && m\.id !== L\.id && lessonById\(m\.id\)\) location\.hash = '#\/stage\/' \+ m\.id \+ '\/presenter'/);
  assert.match(src, /ch && ch\.postMessage\(\{ t: 'lesson', id \}\)/);
  assert.match(src, /L\.id === OPTIONAL\.after && lessonById\(OPTIONAL\.id\)/);
});
