/* rc.5 — ergonomie enseignant : la vue présentateur relaie les touches de la projection (sauf quitter / plein écran / aide / présentateur),
   affiche l'état de la liaison grâce au signal périodique de la projection, et l'index lance « projection + vue enseignant » en un clic.
   Contrôles sur le source (le module touche au DOM) ; le comportement réel est vérifié dans Chromium (voir docs/V3_1_RELEASE.md § 10). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../js/stage/lesson.js', import.meta.url), 'utf8');
const fr = fs.readFileSync(new URL('../js/stage/fr.js', import.meta.url), 'utf8');
const body = name => { const i = src.indexOf(`function ${name}(`); return src.slice(i, src.indexOf('\n}\n', i)); };

test('une seule table de touches, partagée par la projection et la vue enseignant', () => {
  assert.equal((src.match(/const KEYS = \{/g) || []).length, 1);
  assert.match(body('mountLesson'), /KEYS\[e\.key\]/); assert.match(body('mountPresenter'), /KEYS\[e\.key\]/);
});
test('la vue enseignant écoute le clavier et ne relaie ni quitter, ni plein écran, ni aide, ni présentateur', () => {
  const pv = body('mountPresenter');
  assert.match(pv, /addEventListener\('keydown', onKey\)/); assert.match(pv, /removeEventListener\('keydown', onKey\)/);
  assert.match(pv, /NO_RELAY\.has\(a\)\) return/);
  for (const a of ['exit', 'full', 'help', 'present']) assert.match(src, new RegExp(`NO_RELAY = new Set\\([^)]*'${a}'`));
  assert.match(pv, /send\(e\.shiftKey \? 'unvote' : 'vote'/);
});
test('la projection émet un signal périodique, sans rien dessiner', () => {
  const pr = body('mountLesson');
  assert.match(pr, /const beat = setInterval\(\(\) => post\(\), BEAT\)/); assert.match(pr, /clearInterval\(beat\)/);
  assert.match(pr, /m\.a === 'home'\) go\(0, 0\)/);
});
test('état de la liaison : synchronisé / perdu / en attente, réévalué en continu', () => {
  const pv = body('mountPresenter');
  assert.match(pv, /Date\.now\(\) - seen < LOST/); assert.match(pv, /\$\('#pvT'\)[^\n]*stat\(\)/);
  for (const k of ['pres.connected', 'pres.lost', 'pres.waiting']) assert.ok(fr.includes(`'${k}'`), k);
});
test('lancement en un clic depuis l\'index : une fenêtre de projection + la vue enseignant dans l\'onglet courant', () => {
  const ix = body('lessonIndex');
  assert.match(ix, /window\.open\(projUrl\(id/); assert.match(ix, /location\.hash = '#\/stage\/' \+ id \+ '\/presenter'/);
  assert.match(src, /export const projUrl = \(id, sc = 1\) =>/);
});
test('la projection reste inchangée : aucune nouvelle classe ni nouvel élément dans son gabarit', () => {
  const pr = body('mountLesson');
  for (const c of ['pv-bar', 'pv-nav', 'pv-guide', 'st-ix-dual']) assert.ok(!pr.includes(c), c);
});
