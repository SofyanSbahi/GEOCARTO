/* Palette « projection » des formations (v3.1, WP5). Le moteur garde les couleurs historiques (figées par les tests « golden ») ; le mode Stage les remplace
   par des teintes dont les voisines restent distinctes sous projecteur délavé ET en deutéranopie (ΔE76 ≥ 10, vérifié par tests/palette.test.js).
   Seules les formations dont l'écart était insuffisant changent ; les autres gardent leur teinte d'origine. */
export const PROJ = { l: '#4cbbe8', d: '#2e6aa6', m: '#d9f0f9', ci: '#5aa83a', cs: '#dcea8c', s: '#aee6d6', ca: '#7fb07f' };
export const projColor = un => PROJ[un.id] || un.c;
/* lettres grecques des roches magmatiques → lettres latines lisibles de loin (F12) : granite « Gr », dolérite « Do » */
export const LATIN = { 'γ': 'Gr', 'δ': 'Do' };
export const projId = un => LATIN[un.id] || un.id;
