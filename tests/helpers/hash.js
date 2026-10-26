import { createHash } from 'node:crypto';
export const sha = (data) => createHash('sha256').update(typeof data === 'string' ? data : Buffer.from(data.buffer ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : data)).digest('hex').slice(0, 16);
/* arrondit récursivement les nombres (stabilité inter-plateformes) et supprime fonctions / structures cycliques */
export function stable(v, dec = 6, seen = new Set()) {
  if (typeof v === 'number') return Number.isFinite(v) ? +v.toFixed(dec) : String(v);
  if (typeof v === 'function' || v === undefined) return undefined;
  if (v === null || typeof v !== 'object') return v;
  if (ArrayBuffer.isView(v)) return `${v.constructor.name}[${v.length}]#${sha(v)}`;
  if (seen.has(v)) return '[cycle]'; seen.add(v);
  if (v instanceof Set) return [...v].map(x => stable(x, dec, seen)).sort();
  if (v instanceof Map) return [...v].map(([k, x]) => [k, stable(x, dec, seen)]);
  if (Array.isArray(v)) return v.map(x => stable(x, dec, seen));
  const o = {}; for (const k of Object.keys(v).sort()) { const s = stable(v[k], dec, seen); if (s !== undefined) o[k] = s; } return o;
}
