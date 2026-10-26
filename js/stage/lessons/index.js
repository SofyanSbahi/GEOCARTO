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

export const LESSONS = [prologue, echelle, orient, coord, relief, pente, profil, geocarte, coupe];
export const lessonById = id => LESSONS.find(l => l.id === id);
export const TOPICS = [
  { n: 1, id: 'echelle' }, { n: 2, id: 'orient' }, { n: 3, id: 'coord' },
  { n: 4, id: 'relief', scene: 1 }, { n: 5, id: 'relief', scene: 3 }, { n: 6, id: 'relief', scene: 5 },
  { n: 7, id: 'pente' }, { n: 8, id: 'relief', scene: 7 }, { n: 9, id: 'profil' }, { n: 10, id: 'geocarte' }, { n: 11, id: 'coupe' }
];
