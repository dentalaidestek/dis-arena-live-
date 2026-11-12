# TikTok LIVE → Diş Arena (Termux)

Bu deneysel bağlantı TikTok'un resmi API'si değildir. TikTokLive üçüncü taraf kütüphanesini kullanır. TikTok erişimi, ülke, sürüm ve yayının açık olmasına göre başarısız olabilir. Kendi veya izinli yayınınızda deneyin.

## Terminal 1: Diş Arena

```bash
cd ~/dis-arena-live-
git pull
npm install
npm run dev -- --host 0.0.0.0
```

## Terminal 2: canlı yayın dinleyicisi

Termux'ta ikinci bir oturum açın:

```bash
pkg install python -y
python -m pip install TikTokLive websockets
cd ~/dis-arena-live-
python scripts/tiktok_live_bridge.py @YAYINCI_ADI
```

Tarayıcıdan http://localhost:5173 açın. Durum satırında **TikTok LIVE bağlı** görünmelidir. TikTok yayıncısı LIVE değilse bağlanamayabilir. Hediye gönderildiğinde kullanıcı adı otomatik alınır ve hediye adına göre boş diş atanır.

## Bilinen sınırlar

- WebSocket sadece 127.0.0.1:8765 adresine bağlanır; köprü ile oyun aynı telefonda çalışmalıdır.
- Tarayıcıyı başka cihazda açmak bu yerel köprüyle çalışmaz.
- Gerçek hediyeler yalnızca tanınan ad ve eşleşen jeton değeriyle işlenir. TikTok'un bölgesel isim/fiyat farklılıkları için hediye kataloğu güncellenmelidir.
- Streak hediyelerinde yalnız tamamlanan seri olayı gönderilir. Bir serinin tekrar sayısı şimdilik ayrı oyun işlemlerine çevrilmez.
- Yayın bağlantısı kesilirse dinleyicinin yeniden başlatılması gerekebilir. Tarayıcı köprüye otomatik yeniden bağlanır.
- Köprü demo amaçlıdır; güvenlik, hediye doğrulaması, dayanıklılık ve platform koşulları doğrulanmadan ücretli yarışma olarak kullanılmamalıdır.
