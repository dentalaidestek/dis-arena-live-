# Diş Arena — Termux ile geliştirme
Termux uygulamasında:
```bash
pkg update && pkg install -y git nodejs-lts
git clone https://github.com/dentalaidestek/dis-arena-live-.git
cd dis-arena-live-
bash scripts/termux-check.sh
npm run dev -- --host 0.0.0.0
```
Vite'ın gösterdiği yerel adresi telefondaki tarayıcıdan açın. Komutlar yalnızca yerel cihazda çalışır; bu repo herhangi bir TikTok hesabına bağlanmaz. İlk kurulum internet gerektirir.

## GLB model iş akışı
- Lisanslı veya kendiniz oluşturduğunuz modelleri `public/models/` altına koyun.
- Önerilen dosyalar: `tooth.glb`, `doctor-good.glb`, `doctor-bad.glb`.
- GLB dosyaları üçgen sayısı ve doku boyutuna göre optimize edilmeli; mobil GPU testleri yapılmalı.
- Üçüncü taraf kulüp logolarını ve insan yüzlerini izinsiz eklemeyin.
- Gerçek TikTok LIVE olaylarını platform yetkisi doğrulanmadan açmayın.

Termux'a doğrudan erişimimiz yoktur; GitHub commit'leri Termux'ta `git pull` ile alınır.
