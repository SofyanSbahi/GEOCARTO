/* Mini-i18n du mode Stage.
   Les textes ne sont JAMAIS écrits dans le code : tout passe par t('clé').
   Pour ajouter l'arabe ou l'anglais : créer ar.js / en.js qui appellent register('ar', {...}) puis setLang('ar').
   Les clés manquantes retombent sur le français. La direction (RTL) est appliquée à <html dir>. */
const dict = {};
let lang = 'fr';
export const RTL = new Set(['ar', 'he', 'fa']);

export function register(l, strings) { dict[l] = { ...(dict[l] || {}), ...strings }; }
export function setLang(l) {
  lang = dict[l] ? l : 'fr';
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL.has(lang) ? 'rtl' : 'ltr';
}
export const getLang = () => lang;
export function t(key, vars) {
  let s = (dict[lang] && dict[lang][key]) ?? (dict.fr && dict.fr[key]) ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m));
  return s;
}
/* nombres : « 1 245 » en français, chiffres selon la langue ensuite */
export const nf = (n, dec = 0) =>
  new Intl.NumberFormat(lang === 'ar' ? 'ar-MA-u-nu-latn' : lang, { maximumFractionDigits: dec, minimumFractionDigits: 0 }).format(n);
