/* Mauvaises réponses « figurées » (v3.1, WP3) : chaque distracteur d'un vote est la FIGURE que produirait un étudiant ayant ce malentendu, calculée par le
   moteur à partir de la bonne réponse. Le vote devient un diagnostic : la salle voit pourquoi c'est faux, et l'enseignant discute en montrant l'image.
   Pur : aucune dépendance au DOM ni à l'horloge ; l'aléa vient des paramètres. Les identifiants `id` sont ceux des malentendus nommés (data/errors.js, Stage).
   Règle de lisibilité L6 : deux options ne doivent jamais se ressembler — `lineSeparation` et `angleSeparation` servent à le vérifier (tests et choix des points). */
import { gradient } from '../terrain/dem.js';
import { makeGeology } from './geology.js';

const RAD = Math.PI / 180;
/* écart (degrés, 0–180) entre deux azimuts */
export const angleSeparation = (a, b) => { const x = Math.abs(a - b) % 360; return Math.min(x, 360 - x); };

/* ---------- 1. Où vont les contacts sous le sol ? (coupe : pendage apparent α′, sens +1 = les contacts descendent vers B) ---------- */
export function contactVariants({ apparent, sense }) {
  return [
    { id: 'ok', ok: true, angle: apparent, sense },          // bonne réponse : pendage apparent, du côté où plonge la couche
    { id: 'g-coupe-sens', angle: apparent, sense: -sense },   // sens du pendage inversé
    { id: 'g-coupe-vert', angle: 90, sense },                  // « un pendage de 35° ? alors vertical » : l'angle de la carte pris pour un trait vertical
    { id: 'g-coupe-horiz', angle: 0, sense }                   // contacts prolongés à plat : le pendage est oublié
  ];
}
/* direction (degrés dans (−90, 90]) de la droite de contact dessinée : > 0 = elle descend vers B */
export const lineDirection = v => { const a = v.sense * v.angle; return a > 90 ? a - 180 : a <= -90 ? a + 180 : a; };
/* écart minimal entre deux droites de la série (une droite n'a pas de sens : 0° et 180° sont la même) */
export function lineSeparation(variants) {
  let m = 180;
  for (let i = 0; i < variants.length; i++) for (let j = i + 1; j < variants.length; j++) {
    const d = Math.abs(lineDirection(variants[i]) - lineDirection(variants[j])); m = Math.min(m, Math.min(d, 180 - d));
  }
  return m;
}

/* ---------- 2. Vers où plonge la couche ? (carte : azimuts en degrés depuis le Nord, sens horaire) ---------- */
/* azimut de la plus grande pente descendante en (x, y) (coordonnées de maille ; y vers le bas) */
export function downhillAzimuth(dem, x, y) {
  const [gx, gy] = gradient(dem, x, y);
  return (Math.atan2(-gx, gy) / RAD + 360) % 360;
}
/* Quatre flèches candidates, toutes issues du même point : le vrai sens du pendage, son inverse, la direction du contact (confondue avec le plongement) et
   la pente du terrain (confondue avec le pendage). Le point d'origine est choisi parmi `origins` (coordonnées de maille) pour que les quatre flèches
   soient bien distinctes (écart ≥ minSep). `origins` est classé par préférence (le plus lisible d'abord) : on retient le PREMIER qui convient, sinon le meilleur.
   Ordre canonique du vote : [ok, g-dipsens, g-dipstrike, g-dipterrain]. */
export function dipDirectionCandidates({ dipAz, strikeAz, dem, origins, minSep = 25 }) {
  let best = null;
  for (const o of origins) {
    const az = [dipAz, dipAz + 180, strikeAz, downhillAzimuth(dem, o.x, o.y)].map(a => ((a % 360) + 360) % 360);
    let sep = 360; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) sep = Math.min(sep, angleSeparation(az[i], az[j]));
    if (!best || sep > best.minSep + 1e-9) best = { origin: o, az, minSep: sep };
    if (sep >= minSep) { best = { origin: o, az, minSep: sep }; break; }
  }
  const ids = ['ok', 'g-dipsens', 'g-dipstrike', 'g-dipterrain'];
  return best && { origin: best.origin, minSep: best.minSep, ok: best.minSep >= minSep, candidates: best.az.map((az, i) => ({ id: ids[i], ok: i === 0, az })) };
}

/* ---------- 3. Quelle forme en coupe ? (la même carte, quatre structures) ---------- */
/* La bonne structure est celle de la carte ; les mauvaises réponses sont les coupes qu'on obtiendrait avec le malentendu : cuvette au lieu de voûte,
   bandes parallèles inclinées, couches horizontales. Elles sont construites sur LE MÊME terrain (même profil de surface) : seule la structure change. */
export const FOLD_VARIANTS = [
  { id: 'ok', ok: true, kind: 'anticlinal' },
  { id: 'g-coupe-pli-inv', kind: 'synclinal' },
  { id: 'g-coupe-pli-mono', kind: 'monoclinal' },
  { id: 'g-coupe-pli-tab', kind: 'tabulaire' }
];
/* Réglages pour que les quatre coupes SE LISENT côte à côte (la trace du vote est horizontale, d'Ouest en Est, sur `len` mailles) :
   · monoclinal : plongement vers l'Est (azimut 90°), donc dans le plan de la coupe — sinon la coupe suit la direction des couches et montre des bandes plates ;
   · tabulaire : limites réparties sur toute la profondeur montrée (sinon une seule teinte sous le relief) ; profondeur = 40 % de la longueur de la trace. */
export function foldVariants(dem, seed, { len = 70 } = {}) {
  const depth = .4 * len * dem.cellM, rel = dem.zmax - dem.zmin;
  const opts = { monoclinal: { dipAz: 90, dip: 26 }, tabulaire: { bnd: Array.from({ length: 7 }, (_, i) => dem.zmin - depth + (rel + depth) * i / 6) } };
  return FOLD_VARIANTS.map(v => ({ ...v, geo: makeGeology(dem, v.kind, seed, opts[v.kind] || {}) }));
}
/* part des cellules (non vides dans les deux grilles) dont la formation diffère : deux coupes quasi identiques ne feraient pas un bon vote */
export function gridDifference(a, b) {
  if (a.g.length !== b.g.length) throw new Error('grilles de tailles différentes');
  let n = 0, d = 0; for (let k = 0; k < a.g.length; k++) { if (a.g[k] < 0 || b.g[k] < 0) continue; n++; if (a.g[k] !== b.g[k]) d++; }
  return n ? d / n : 0;
}
