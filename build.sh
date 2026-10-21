#!/bin/sh
# Construit dist/app.js (bundle unique, fonctionne en file://). Nécessite esbuild : ESBUILD=/chemin/esbuild sh build.sh
ESB="${ESBUILD:-$(command -v esbuild || echo /opt/npm-tools/node_modules/.bin/esbuild)}"
"$ESB" js/main.js --bundle --format=iife --minify --target=es2020 --outfile=dist/app.js
