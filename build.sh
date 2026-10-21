#!/bin/sh
# Construit dist/app.js (bundle unique, fonctionne en file://).
# esbuild est épinglé dans package.json (0.28.2) : `npm ci` puis `sh build.sh`.
# Un autre binaire reste possible : ESBUILD=/chemin/esbuild sh build.sh (la sortie peut alors différer).
cd "$(dirname "$0")" || exit 1
ESB="${ESBUILD:-./node_modules/.bin/esbuild}"
[ -x "$ESB" ] || { echo "esbuild introuvable ($ESB) : lancer d'abord « npm ci »." >&2; exit 1; }
"$ESB" js/main.js --bundle --format=iife --minify --target=es2020 --outfile=dist/app.js
