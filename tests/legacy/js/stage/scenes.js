/* Définition des scènes (structure uniquement : les textes sont dans fr.js, clés « s.<id>.* »).
   Une scène = un état du relief + au plus UN paramètre que l'enseignant fait varier avec ↑ / ↓.
     form    : forme analytique (FORMS) ou 'mixte' (relief procédural, graine = seed)
     layers  : calques cartographiques
     view    : 'split' = bloc 3D + carte côte à côte
     param   : { key, values, labels? }  key ∈ level | eq | form | layers | probe
     probe   : le clic/toucher sonde un point
     hide    : 'probe' | 'formname' → résultat masqué jusqu'à R (prédire puis révéler)
     regen   : N génère un nouveau terrain                                                        */
export const COURBES = {
  id: 'courbes',
  exitRoute: '#/labo/courbes',
  scenes: [
    { id: 'plane', view: 'split', upto: true,
      base: { form: 'colline', relief: 400, base: 200, eq: 50, layers: { shade: true, tint: true } },
      param: { key: 'level', values: [250, 300, 350, 400, 450, 500, 550] } },
    { id: 'eq',
      base: { form: 'colline', relief: 400, base: 200, eq: 100, layers: { shade: true, spots: true } },
      param: { key: 'eq', values: [100, 50, 25, 10] } },
    { id: 'read', probe: true, hide: 'probe', regen: true,
      base: { form: 'mixte', seed: 12, relief: 600, base: 300, eq: 20, layers: { shade: true, spots: true } } },
    { id: 'gap', probe: true,
      base: { form: 'rupture', relief: 400, base: 100, eq: 20, layers: { shade: true } },
      param: { key: 'probe', values: [{ x: 80, y: 20 }, { x: 80, y: 53 }, { x: 80, y: 92 }], labels: ['probe.0', 'probe.1', 'probe.2'] } },
    { id: 'forms', hide: 'formname',
      base: { form: 'colline', relief: 400, base: 200, eq: 20, layers: { shade: true, spots: true } },
      param: { key: 'form', values: ['colline', 'cuvette', 'col', 'vallee', 'crete', 'plateau'], labels: ['form.colline', 'form.cuvette', 'form.col', 'form.vallee', 'form.crete', 'form.plateau'] } },
    { id: 'v',
      base: { form: 'vallee', relief: 450, base: 300, eq: 20, layers: { shade: true } },
      param: { key: 'combo', labels: ['layers.0', 'layers.1', 'layers.2'],
        values: [{}, { layers: { rivers: true } }, { form: 'crete' }] } },
    { id: 'synth', probe: true, regen: true,
      base: { form: 'mixte', seed: 21, relief: 500, base: 250, eq: 20, layers: { shade: true, tint: true, spots: true, rivers: true } },
      param: { key: 'eq', values: [20, 40, 10] } }
  ]
};
export const DECKS = { courbes: COURBES };

/* Résout la configuration effective d'une scène pour l'état courant */
export function resolve(scene, pi, seedOverride) {
  const cfg = { ...scene.base, layers: { ...scene.base.layers }, level: null, probe: null };
  const p = scene.param;
  if (p) {
    const v = p.values[Math.min(pi, p.values.length - 1)];
    if (p.key === 'layers') cfg.layers = { ...cfg.layers, ...v };
    else if (p.key === 'combo') { const { layers, ...rest } = v; Object.assign(cfg, rest); cfg.layers = { ...cfg.layers, ...(layers || {}) }; }
    else if (p.key === 'probe') cfg.probe = v;
    else cfg[p.key] = v;
  }
  if (seedOverride != null && scene.regen) cfg.seed = seedOverride;
  if (scene.upto && cfg.level == null) cfg.level = cfg.base + cfg.eq;
  return cfg;
}
