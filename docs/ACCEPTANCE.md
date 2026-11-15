# Diş Arena — kabul ve devam kaydı

15 Kasım 2026 · PR #1 · `feature/coin-arena-20261112`. Main merge veya production dağıtımı yapılmadı.

## Teslim edilen davranış

- `/arena` canlı izleyici, `/demo` ayrı demo izleyici, `/obs` temiz 9:16, `/admin` ayrı yayıncı yönetimi. Eski query adresleri yönlenir. İzleyici DOM'unda yönetici formu/düğmesi yoktur.
- Yayıncı ve isteğe bağlı oda şifreleri ayrı yetkilerdir. scrypt + rastgele tuz, SQLite şifre özetleri, HttpOnly/SameSite oturum, oturum iptali, yanlış giriş sınırı ve ayrı API kontrolü vardır. HTTPS'te Secure cookie ortam değişkeniyle açılır. Tek kullanımlık yerel kurulum kodu 2 dakika geçerlidir.
- Son talimata göre canlı Çay/çekim **50**, Parfüm/implant **20** jetondur. Çürütme/iyileştirme yalnız ayrı demo içinde tutulur. Hedef hediye öncesindeki sıralama/dişe sabittir; kilit uzatılmaz. Eski yanlış fiyatlı atama normal puanı kaybetmeden saldırısız işlenir.
- Node tek otoritedir. SQLite transaction olay, seri ilerlemesi ve tur durumunu birlikte saklar; tarayıcı render'ı puan yazamaz. Kalıcı idempotency 10.000 sınırıyla kırpılmaz. Canlı/demo veritabanları ayrıdır.
- Python kalıcı outbox ve ACK/retry, kullanıcı adı kontrolü, sağlayıcı kimliklerinin korunması, katalog aktarımı ve backoff/jitter korunmuştur. Eksik katalog/seri kimliğinde puan uydurulmaz. Gerçek katalogdaki eşleştirilmiş ad izleyicide gösterilir; doğrulanmayan eşleme açıkça bekleniyor görünür.
- Üst dört lider, gerçek FDI diş numaraları, sayaç/tur, lider değişimi, rekabet ve üç satırlık canlı olay akışı vardır. Sağdaki boş sıralama paneli kaldırıldı. OBS üst/alt TikTok güvenli alanları CSS değişkenleriyle ayarlanır.
- Aynı prosedürel 3D sahnede dört ayrı taç geometrisi, daha büyük hekimler, küçültülmüş kafa, düzeltilmiş burun/yüz, ağız dışına taşınmış FDI etiketleri; eklemli kol, hedefe uzanan alet, diş çekimi/boşluk, implant vidası/restorasyon ve yüz tepkileri vardır. Puanlar anlık, görseller ayrı sınırlı kuyruktadır; taşma puanı silmez.
- Native tam ekran ve panele dönüş aynı round ID, başlangıç zamanı ve oyuncuları korur. Grafik tercihi ayrı demo/canlı kaynakta sunucuda tutulur.
- Termux tek komut başlatıcı mevcut veriyi korur; demo Python olmadan açılır. Konsol yoğun hediyeleri gruplar. Yedekleme `access.sqlite` şifre özetlerini de kapsar.

## Çalıştırılan testler

| Kontrol | Gerçek sonuç |
|---|---|
| `npm test` | 61 geçti; motor, seri, SQLite yeniden açma/idempotency, eşzamanlı HTTP, auth, yetki ayrımı, demo/launcher ve geometri matematiği |
| `npm run test:python` | TikTokLive 7.0.1 bağımlılıklarıyla 10 geçti |
| `npm run test:provider` | 1 geçti; gerçek protobuf sınıfıyla sentetik 1000 seri artışı → Python → SQLite =1000; replay +0 |
| `npm run build` | TypeScript/Vite geçti; yaklaşık 1,27 MB JS paket boyutu uyarısı sürüyor |
| Chromium Playwright | Önceki kaynak paketi `bfffb63` üzerinde 5 kabul testi geçti; son etiket/güvenli alan düzeltmeleri yeni CI'da tekrar çalıştırılır |
| `git diff --check` | Temiz |

Gerçek GitHub Actions Chromium/SwiftShader testleri: 360×800, 393×873, 1080×1920 OBS, 1280×1000 masaüstü; WebGL FPS>0, tarayıcı hatası olmaması ve taşma kontrolü; şifreli mobil yönetim/çıkış; çekim→implant→demo çürütme→iyileştirme; tam ekran gir/çık sırasında turun korunması; oda şifresinin admin yetkisi vermemesi. Her prosedürde hedef Ahmet / FDI 11 kontrol edilip 3D işlem sırasında ekran görüntüsü alınır.

`bfffb63` üzerindeki üç iş akışı başarılı: Diş Arena CI 43734355307, Verify Diş Arena 43734355296, Arena visual acceptance 43734355364. Tarayıcı ekranları artifact `arena-visual-acceptance` içinde saklanır. Yeni commit için güncel Actions sonuçları ayrıca kontrol edilmelidir. Bu gerçek tarayıcı doğrulamasıdır; mobil emülasyonu gerçek Android GPU testi değildir.

## Eski testlerin durumu

`npm run test:legacy` ile önce tüm eski testler de çalıştırıldı. Başlangıç commit'i temiz bir geçici dizine çıkartılıp aynı komut tekrar çalıştırıldı: **82 testten 22'si başlangıçta da başarısızdı**. Güncel testler eklenmeden önceki sonuçla hata isimleri aynıdır; eski akış hataları düzeltilmiş gibi gösterilmedi. Aktif uygulama bu HP/sahiplenme modüllerini çağırmaz.

Başarısız eski testler:

- `engine.test.ts`: 32 bağımsız diş başlatır; çürük kalkanı bir saldırı tüketir; kırık kalkanı çürük saldırısını engellemez; aynı olay iki kez işlenmez.
- `giftClaims.test.ts`: 30 jeton Doughnut çekilmiş sahipli dişi yeni kullanıcıya verir.
- `ownership.test.ts`: bir izleyici tek diş sahiplenir ve ikinci dişi alamaz; çekim sonrası implant aynı sahibin dişini geri getirir; son sekizde implant yasak ve sahiplik korunur.
- `pressure.test.ts`: 10 dakika öncesi baskı yok, sonra tüm aktif dişlerde 2 HP azalır; baskı çekim yapmaz, kalkanı harcamaz, çekilmiş dişe işlemez; çekim baskı süresini sıfırlar.
- `procedureGifts.test.ts`: three concurrent gift events independently heal three teeth with no animation queue; target selection is deterministic and excludes own tooth for hostile gifts.
- `replacement.test.ts`: 17 aktif dişte yeni kullanıcı implantla 50 HP ile gelir; 16 aktif dişte yeni oyuncu girişi kapanır; tekrar edilen olay yeni sahip atamaz.
- `runtime.test.ts`: geçerli olay işlenir ve tekrar uygulanmaz; aynı dişe gelen ardışık savunma ve saldırı sırası belirleyicidir.
- `toothEconomy.test.ts`: front incisors cost more than middle and posterior teeth; cheap gifts cannot heal expensive owned incisors; screenshot gift names have unique consistent prices.
- `toothGiftAssignments.test.ts`: assigned teeth have distinct gifts with exact mirrored price bands.

## Açık kabul işleri ve sınırlar

1. Gerçek yayıncı adı verilmedi: aktif TikTok LIVE oda çözümleme/gerçek hediye teslimatı/gerçek katalog ID seçimi yapılmadı. Panelden 50 ve 20 jetonluk doğrulanmış iki farklı gerçek hediye eşleştirilmeli. Üçüncü taraf TikTokLive sıfır veri kaybı garantisi vermez.
2. Yeni sürüm kullanıcı telefonunda Android + Termux ile henüz denenmedi. Önceki çalışan kurulum korunmuştur; Node SQLite ve Python 3.14 bağımlılık uyumu cihazda doğrulanmalı. Uzun süreli canlı + OBS yayın testi yapılmadı.
3. Karakterler hâlâ prosedürel/stilize Three.js modelleridir; profesyonel sanatçı yapımı rigged karakter kalitesi iddia edilmez. 28 oyuncunun tam adı mobil ağız üzerinde okunamaz: kısa etiket + FDI kullanılır, ilk dört ve yönetim tablosu tam adları gösterir.
4. Docker imajı/çok sunuculu dağıtım doğrulanmadı. JS paket boyutu uyarısı ve TikTokLive websockets legacy deprecation uyarısı sürüyor. Aktif motor testleri geçse de yukarıdaki 22 eski HP testi başarısızdır.
5. Animasyon kuyruğu sınırlıdır; yoğun trafik ve yeniden bağlantı kaçırılan görselleri özetleyebilir, kalıcı puanı ve olay kaydını değiştirmez. Eski uygulamanın daha önce silmiş olduğu olay kimlikleri kurtarılamaz.

## Cihazda sıradaki adım

`git pull --ff-only` ardından `bash termux-preview.sh`; yayıncı şifresiyle girip dört işlem turunu çalıştırın. `/demo` ve `/obs?mode=demo` görüntülerini cihazda kontrol edin. Ardından `--live` ile gerçek kullanıcıyı bağlayıp katalogdan 50/20 ID eşleştirin; gerçek Gül serisi, kopma/yeniden bağlantı ve tur sonunu deneyin. Bu kabul tamamlanana kadar PR taslak kalmalıdır.
