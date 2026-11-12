#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"
echo "🦷 Diş Arena v2 — 10 dakikalık oyun önizlemesi"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js bulunamadı. Termux'ta: pkg install nodejs-lts -y"
  exit 1
fi
if [ ! -d node_modules ]; then npm ci; fi
echo ""
echo "📱 Telefonda aç: http://127.0.0.1:5173"
echo "🎁 Sayfanın altındaki 'Yayıncı test ve tur kontrolü' bölümünden hediye simülasyonu yap."
echo "🛑 Durdurmak için Ctrl+C"
npm run dev -- --host 0.0.0.0
