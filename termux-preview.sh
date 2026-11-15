#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  if command -v pkg >/dev/null 2>&1; then
    echo 'Node.js hazırlanıyor…'
    pkg install nodejs-lts -y
  else
    echo 'Node.js 22.13+ gerekli.'
    exit 1
  fi
fi
if ! node -e "const [a,b]=process.versions.node.split('.').map(Number);if(a<22||(a===22&&b<13))process.exit(1);require('node:sqlite')" >/dev/null 2>&1; then
  if command -v pkg >/dev/null 2>&1; then
    echo 'Node.js ve SQLite desteği güncelleniyor…'
    pkg install nodejs-lts -y
  fi
fi
exec node scripts/launch.mjs "$@"
