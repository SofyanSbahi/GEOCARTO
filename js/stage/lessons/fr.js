/* Textes français des leçons Stage v2. Pour l'arabe / l'anglais : créer ar.js / en.js avec les MÊMES clés et appeler register('ar', {...}). */
import { register } from '../i18n.js';
import { FR as echelle } from './echelle.js';
import { FR as orient } from './orient.js';
import { FR as coord } from './coord.js';
import { FR as pente } from './pente.js';
import { FR as relief } from './relief.js';
import { FR as mission } from './mission.js';
import { FR as profil } from './profil.js';
import { FR as geo } from './geologie.js';
import { FR as coupe } from './coupe.js';
import { FR as ui } from './ui.fr.js';
register('fr', { ...ui, ...echelle, ...orient, ...coord, ...relief, ...mission, ...pente, ...profil, ...geo, ...coupe });
