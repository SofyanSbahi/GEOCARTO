/* Compatibilité : le terrain, les courbes et la géométrie du trait vivent maintenant dans engine/ (ADR 0001).
   Ce fichier ne contient plus de logique ; il conserve les anciens chemins d'import et le défaut Math.random de suggestLine
   (côté INTERFACE seulement : le moteur exige un générateur injecté). */
export * from '../engine/terrain/index.js';
export * from '../engine/contour/index.js';
export {profileAlong,crossings,extremes} from '../engine/profile/line.js';
import {suggestLine as _suggestLine} from '../engine/profile/line.js';
export const suggestLine=(d,eq,R=Math.random,tries=120)=>_suggestLine(d,eq,R,tries);
