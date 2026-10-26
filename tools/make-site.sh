#!/bin/sh
# Assemble le dossier PUBLIABLE `site/` : uniquement ce dont le navigateur a besoin (jamais js/, tests/, docs/, tools/, README, CLAUDE.md, package*.json).
# Usage : npm ci && sh build.sh && sh tools/make-site.sh   → publier le contenu de site/ (voir docs/SECURITY_RELEASE_AUDIT.md §6).
set -e
cd "$(dirname "$0")/.."
[ -f dist/app.js ] || { echo "dist/app.js manquant : lancer d'abord sh build.sh" >&2; exit 1; }
rm -rf site && mkdir -p site
cp index.html config.js sw.js manifest.webmanifest icon.svg site/
cp -R css img dist site/
cp vendor/THREE-LICENSE site/THIRD-PARTY-LICENSES.txt     # three.js (MIT) : sa licence exige de conserver l'avis ; l'avis est aussi dans dist/app.js
touch site/.nojekyll
echo "site/ prêt : $(find site -type f | wc -l) fichiers, $(du -sh site | cut -f1)"
