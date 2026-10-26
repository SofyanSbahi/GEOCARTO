/* Registre des leçons Stage v2 et des 11 thèmes du TP (ordre du cours).
   Un thème est servi par : une leçon v2 (scènes + votes + pratique) · une scène du deck v1 « courbes » (en attendant sa migration) · rien (planifié). */
import { echelle } from './echelle.js';
import { orient } from './orient.js';
import { coord } from './coord.js';
import { pente } from './pente.js';
import { profil } from './profil.js';
import { relief } from './relief.js';
import { prologue } from './mission.js';
import { geocarte } from './geologie.js';
import { coupe } from './coupe.js';
import { prereq } from './prereq.js';

export const LESSONS = [prologue, echelle, orient, coord, relief, pente, profil, geocarte, coupe, prereq];
export const lessonById = id => LESSONS.find(l => l.id === id);
export const TOPICS = [
  { n: 1, id: 'echelle' }, { n: 2, id: 'orient' }, { n: 3, id: 'coord' },
  { n: 4, id: 'relief', scene: 1 }, { n: 5, id: 'relief', scene: 3 }, { n: 6, id: 'relief', scene: 5 },
  { n: 7, id: 'pente' }, { n: 8, id: 'relief', scene: 7 }, { n: 9, id: 'profil' }, { n: 10, id: 'geocarte' }, { n: 11, id: 'coupe' }
];

/* rc.6 — enchaînement des leçons en séance (ordre du cours, au niveau des leçons). « relief » porte les thèmes 4, 5, 6 et 8 : après lui vient
   « pente » (thème 7). Le préalable « Lire le relief » est FACULTATIF : jamais enchaîné automatiquement, seulement proposé dans la vue enseignant
   après « profil » ; s'il est joué, il mène aux cartes géologiques. */
export const SEQUENCE = ['mission', 'echelle', 'orient', 'coord', 'relief', 'pente', 'profil', 'geocarte', 'coupe'];
export const OPTIONAL = { id: 'prereq', after: 'profil', before: 'geocarte' };
export const nextLesson = id => id === OPTIONAL.id ? OPTIONAL.before : SEQUENCE[SEQUENCE.indexOf(id) + 1] || null;
export const prevLesson = id => id === OPTIONAL.id ? OPTIONAL.after : SEQUENCE.indexOf(id) > 0 ? SEQUENCE[SEQUENCE.indexOf(id) - 1] : null;
