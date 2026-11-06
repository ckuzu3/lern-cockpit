#!/bin/bash
# Veröffentlicht den aktuellen Stand: Offline-Cache erneuern, Einzeldatei bauen, pushen.
# Aufruf: bash tools/deploy.sh "Beschreibung der Änderung"
set -e
cd "$(dirname "$0")/.."

# Service-Worker-Version hochzählen, damit iPhones den neuen Stand holen
alt=$(grep -o "lc-v[0-9]*" app/sw.js | head -1)
neu="lc-v$(( ${alt#lc-v} + 1 ))"
sed -i '' "s/$alt/$neu/" app/sw.js
echo "Offline-Cache: $alt -> $neu"

node tools/build-single.js

git add -A
git commit -q -m "${1:-Inhalte aktualisiert}" || { echo "Nichts zu committen."; exit 0; }
git push -q origin main
echo "Gepusht. GitHub Pages baut jetzt – in ein bis zwei Minuten ist der neue Stand auf dem iPhone."
