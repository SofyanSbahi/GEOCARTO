/* Environnement minimal pour importer sous Node des modules qui touchent window/localStorage à l'import
   (store.js, etc.). Ne sert QUE aux tests : les moteurs, eux, ne doivent jamais avoir besoin de ce fichier. */
const mem = new Map();
globalThis.localStorage ??= { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
globalThis.sessionStorage ??= globalThis.localStorage;
globalThis.addEventListener ??= () => {};
globalThis.removeEventListener ??= () => {};
globalThis.document ??= { visibilityState: 'visible', documentElement: { classList: { add() {}, remove() {}, toggle() {} }, dataset: {} } };
// store.js arme un setInterval au chargement : on le rend inoffensif pour ne pas retenir le processus
const si = globalThis.setInterval; globalThis.setInterval = (f, ms, ...a) => { const t = si(f, ms, ...a); t.unref?.(); return t; };
