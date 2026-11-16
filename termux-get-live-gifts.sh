#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  pkg install python -y
fi

if ! python3 -c "import TikTokLive" >/dev/null 2>&1; then
  echo "TikTok LIVE bağlantı bağımlılığı hazırlanıyor…"
  python3 -m pip install -r scripts/requirements.txt
fi

echo "Hedef yayın: @sariangona61"
exec python3 scripts/inspect_live_gifts.py sariangona61
