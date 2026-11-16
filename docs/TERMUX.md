# Telefonda tek komutla deneme

Mevcut depoda güncelleyin ve başlatın:

```sh
cd ~/dis-arena-live-
git switch feature/coin-arena-20261112
git pull --ff-only
bash termux-preview.sh
```

Başlatıcı eksik Node paketini hazırlar, SQLite desteğini denetler, değişmiş bağımlılıkları kurar, görünümü gerektiğinde derler ve **oyun sunucusuyla birlikte** açar. Önceki yalnız Vite açan 5173 yöntemi kullanılmaz. Yönetim: **http://127.0.0.1:8787/admin?mode=demo**. Oyun: **http://127.0.0.1:8787/demo**.

Termux tarayıcıyı otomatik açar ve 2 dakikalık tek kullanımlık kurulum koduyla kontrolleri etkinleştirir. Kalıcı yönetici anahtarı URL'ye konmaz. Otomatik açılamazsa adresi Chrome'da açıp terminaldeki kurulum kodunu ekrandaki alana yapıştırın. İlk kurulumda yayıncı şifresini belirleyin; sonraki açılışlarda bu şifreyle girilir. İzleyici oda şifresi istenirse ayrıca ayarlanır ve yönetici yetkisi vermez. 28 oyunculu demo hazır gelir. Python ve açık TikTok yayını gerekmez. Canlı yarış verileri değişmez.

## Görsel test

1. **Dört işlemi oynat** düğmesine basın. Sayfa sahneye döner; sırayla çekim, implant, çürütme ve iyileştirme oynar.
2. Tek tek denemek için dört işlem düğmesini kullanın. Gönderen ve kilitli hedef otomatik seçilir. Çekimden sonra implant, çürütmeden sonra iyileştirme denenir.
3. **Gül ×1000** yalnız 1000 jeton eklemeli. **100 hediye**, **Tur sonunu göster** ve **28 oyuncuyu hazırla** diğer testlerdir.
4. **Yayın ekranı** bağlantısı panel olmadan 9:16 kompozisyonu açar. OBS Browser Source: 1080×1920.
5. `/admin` sayfasında FPS ve grafik kalitesi vardır; izleyici ekranında hiçbir yönetim formu yoktur. **Tam ekran yayın** ile sahneye geçilir, **Yayıncıya dön** ile yönetim geri gelir. Telefonda düşük kalite otomatik seçilir. Ekran kaydı alırken Termux'u kapatmayın; sunucu kapanırsa puanlar korunur, görüntü bağlantı bekler.

Durdurmak: Termux'ta **Ctrl+C**. Yeniden açmak: `bash termux-preview.sh`. Mevcut veritabanları korunur. Derleme ve kurulum dosyalar değişmedikçe tekrarlanmaz.

## Canlı bağlantı testi

```sh
bash termux-preview.sh --live
```

Bu seçenek eksik Python/TikTokLive bağımlılıklarını kurar; gerekirse Termux derleme araçlarını hazırlar. Ardından yayıncı paneline gerçek TikTok kullanıcı adını girip **Bağlan** seçin. Canlı katalogdan iki farklı gerçek ID eşleştirilmelidir: Çay/çekim **20**, Parfüm/implant **20** jeton. Çürütme/iyileştirme canlıya atanamaz; yalnız demodadır. Canlı yayın kapalıysa doğru durum gösterilir; demo yine kullanılabilir.

## Motor ve kurulum kontrolü

```sh
bash termux-preview.sh --check
```

Motor/SQLite/HTTP testlerini ve güncel derlemeyi denetler, ardından çıkar. Bu kontrol gerçek Android GPU veya TikTok hediye teslimatını doğrulamaz.

`node:sqlite` bulunamazsa Termux'taki Node derlemesi desteklemiyor olabilir; başlatıcı bunu başlamadan açıkça bildirir. Tarayıcı WebGL açamazsa ekran hata bilgisini gösterir, kontrol paneli çalışmaya devam eder. Termux Python 3.14 üzerinde sağlayıcının Rust tabanlı bağımlılıkları derlenemezse gerçek LIVE testi engellenebilir; demo Python'dan bağımsızdır.

## Konsol ve veri koruması

`[LIVE]`, `[GIFT]`, `[EXTRACT]`, `[IMPLANT]`, `[ROUND]`, `[WARN]` kayıtları bağlantı, hediye deltası, FDI hedefi ve kalan süreyi özetler. Yoğun trafik konsolda gruplanır; gerçek işlem günlüğü SQLite içindedir. Tarayıcı yenilemek turu sıfırlamaz. Android'in arka plan süreçlerini sonlandırmasını önlemek için Termux'un pil kısıtlamasını cihaz ayarlarından kaldırın; süreç kapanırsa SQLite son tamamlanan transaction'dan kurtarılır.

Bu sürüm Chromium mobil ekran emülasyonunda test edilmiştir. Yeni sürümün gerçek Android GPU/Termux ve aktif TikTok yayını kabul testi kullanıcı cihazında yapılmalıdır; masaüstü emülasyonu bunun yerine geçmez.
