/* WP6 (v3.1) — couche enseignant : chaque scène de géologie (et du préalable) a note + question ; les malentendus dominants sont affichables
   (clés présentes) ; la mention « brouillon » existe. Contenu rédigé par la machine : à relire par un géologue. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { has, t } from '../js/stage/i18n.js';
import '../js/stage/lessons/fr.js';
import { lessonById } from '../js/stage/lessons/index.js';

for (const id of ['geocarte', 'coupe', 'prereq']) test(`${id} : chaque scène a une note et une question pour l’enseignant, chaque malentendu a son texte`, () => {
  const L = lessonById(id);
  for (const s of L.scenes) { assert.ok(has(`${id}.${s.id}.note`), `${s.id} note`); assert.ok(has(`${id}.${s.id}.ask`), `${s.id} ask`); }
  for (const s of L.scenes.filter(x => x.kind === 'vote')) for (const o of s.vote.opts) if (o.mis) assert.ok(has('mis.' + o.mis) && has('mis.' + o.mis + '.why'), `${s.id} ${o.mis}`);
});
test('la mention « brouillon automatique » et le libellé du malentendu dominant existent', () => { assert.match(t('th.draft'), /brouillon automatique/); assert.ok(has('pres.dom')); });
