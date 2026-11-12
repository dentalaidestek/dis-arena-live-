#!/usr/bin/env bash
set -euo pipefail
echo '🦷 Diş Arena — Termux kontrol'
command -v node >/dev/null || { echo 'Node.js yok: pkg install nodejs-lts'; exit 1; }
command -v npm >/dev/null || { echo 'npm yok'; exit 1; }
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
npm install
npm test
npm run build
echo '✅ Test ve derleme tamamlandı. dist/ klasörünü kontrol et.'
