/* Point d'entrée des moteurs de domaine et du modèle pédagogique (ADR 0001).
   ENGINE_VERSION : à incrémenter si un golden change volontairement (relief d'un code de terrain, notation, exercices). */
export const ENGINE_VERSION='3.0.0';
export * as math from './math.js';
export * as terrain from './terrain/index.js';
export * as contour from './contour/index.js';
export * as profile from './profile/index.js';
export * as geology from './geology/index.js';
export * as pedagogy from './pedagogy/index.js';
