/* Compatibilité : la géologie (calcul) vit dans engine/geology ; le rendu canvas dans core/geodraw.js (ADR 0001). */
export * from '../engine/geology/index.js';
export {geoRaster,drawSection} from './geodraw.js';
