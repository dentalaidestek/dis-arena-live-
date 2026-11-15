# Diş Arena — doğrulama ve devam kaydı

Tarih: 15 Kasım 2026. Başlangıç: `152578e1f3d840d062a79ccec761de08835a6634`, mevcut PR #1. Başlangıçtaki iki CI iş akışı başarılıydı. Bu kayıt gerçek LIVE veya görsel kalite onayı değildir.

## Uygulanan paket

- Çekim 20 jeton / 30 sn, implant ayrı 20 jeton, çürütme 10 jeton / 15 sn, iyileştirme ayrı 10 jeton varsayımı. Farklı durumlar birbirinin savunmasıyla açılmaz. Kilit uzatılmaz; hedef eski sıralamaya ve eski dişe sabitlenir.
- Paylaşılan TypeScript motoru artık Node SQLite sunucusunda çalışır; React puan yazamaz. Kalıcı ve benzersiz olay kaydı, seri ilerlemesi, önceki/sonraki puan, hedefler, katalog sürümü ve tur durumu transaction içinde kaydedilir.
- Canlı/demo ayrı veritabanları. 600 saniye sonunda donan ilk dört ve önceki turlar korunur. Eski localStorage için yalnız boş veritabanına aktarım ve eski ID koruması vardır.
- Python ara seri bildirimlerini iletir; gerçek sağlayıcı oda/kullanıcı/hediye/seri/mesaj kimliklerini korur. SQLite outbox, HTTP ACK/retry, katalog çekme, yapılandırılmış durumlar ve jitter/backoff eklenmiştir.
- İki ayrı Bearer yetkisi, origin denetimi, salt okunur WebSocket, mesaj/kuyruk/izleyici tampon sınırları vardır.
- Yayıncı paneli, katalog eşleştirme, sayaçlar, ayrı demo araçları, OBS 9:16 CSS, düşük/yüksek DPR seçimi ve FPS sayacı eklenmiştir.
- Mevcut 3D sahne korunarak çürük lezyonu ve mine rengi, iyileştirme/restorasyon efekti, ortak diş koordinatına yönelen eklemli kol/alet, hasta tepkisi ve seri işlem kuyruğu eklenmiştir. İşlem öncesi ağız yerleşimi görsel boyunca korunur. Font yerel dosyaya taşınmıştır. Bu değişikliklerin estetik kalitesi doğrulanmadı.
- Yedekleme/sağlama toplamı/integrity_check, geri yükleme öncesi otomatik yedek, Dockerfile ve güncellenmiş CI eklenmiştir. Docker derlemesi yapılmadı.

## Çalıştırılan doğrulamalar

| Kontrol | Sonuç |
|---|---|
| `npm test` | 45 test geçti; güncel motor, SQLite, HTTP/WS, seri ve görsel kuyruk matematiği |
| `npm run test:python` | 10 test geçti; gerçek TikTokLive 7.0.1 protobuf nesnesi dahil |
| `npm run test:provider` | 1 test geçti; gerçek protobuf → Python adaptörü → SQLite, 1000 artış = 1000 jeton; tekrar oynatma 0 ek puan |
| `npm run build` | TypeScript ve Vite derlemesi geçti; yaklaşık 1,25 MB JS için Vite paket boyutu uyarısı var |
| `git diff --check` | Temiz |
| Disk yük fixture'ı | 28 kullanıcı / 10.000 paket: 2306 ms, 4337 paket/sn; p50 0,158 ms, p95 0,377 ms, p99 0,845 ms |
| Eksik/bozuk kullanıcı adı | Sağlayıcı başlatılmadan CLI ve HTTP seviyesinde reddedildi |
| Yedek geri yükleme | Satırlar korundu; bozulmuş sağlama toplamı reddedildi |

Disk ölçümü tek geliştirme ortamında, SQLite WAL + synchronous FULL ile ve doğrudan store çağrısıyla yapıldı. Ağ/Python/3D/OBS dahil gerçek yayın kapasitesini veya uzun süreli yük dayanıklılığını göstermez. Python sağlayıcı bağımlılığından websockets legacy deprecation uyarıları geliyor.

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

## Yayın öncesi açık işler

1. Gerçek yayıncı kullanıcı adı bu görevde verilmedi. Gerçek LIVE bağlantısı, oda çözümleme ve gerçek Gül/20 jeton/10 jeton hediyeleri denenmedi. Gerçek katalogdan dört farklı ID seçilmeli; ID veya fiyat uydurulmadı.
2. Önceki “Diş Arena Canlı Yarış HUD'u.png” referansı bulundu ve dosya içeriği okundu. Görsel, yatay 1672×941 HUD tarif ediyor. Yeni talimattaki hasta/iki hekim/dikey sahneyle birebir eşleşme iddiası yok.
3. Bulut tarayıcı `127.0.0.1:8787` adresine `ERR_CONNECTION_REFUSED` verdi; başarısız sayfa gözlemi de tarayıcı URL politikasıyla engellendi. Alternatif tarayıcı yüzeyiyle engel aşılmadı. Gerçek WebGL render, masaüstü/mobil taşma, 1080×1920 OBS ekranı, hasta/alet hareketi ve FPS gözlemi yapılmadı. Matematik testleri görsel kabul yerine geçmez.
4. Mevcut karakterler prosedürel Three.js modelleridir; rigged profesyonel sanatçı karakter paketi eklenmedi. Çürütme/iyileştirme estetiği ve anatomi görsel inceleme bekler.
5. İyileştirme 10 jeton varsayımı kullanıcı tarafından ayrıca belirtilmiş bir fiyat değildir. Yayın kuralında kesinleştirilmeli.
6. Uzun süreli gerçek LIVE + OBS yük denemesi, gerçek cihazlar ve Docker çalıştırma doğrulanmadı. Eski localStorage kaydında hiç saklanmamış veya daha önce kırpılmış geçmiş olaylar geri kazanılamaz.

## Sıradaki teknik adım

Bu commit'in CI sonucunu kontrol et. Ardından erişilebilir aynı makinedeki tarayıcıda ayrı demo veritabanıyla dört işlemi 1080×1920 ve dar mobil görünümde görsel olarak doğrula. Gerçek yayıncıyla katalog yükle, iki farklı 20 jetonluk ve iki farklı 10 jetonluk ID eşleştir, ×1→×10→×15 / bağlantı kopması / tur sonu gerçek olay kabul testlerini çalıştır. Bu doğrulamalar olmadan PR taslak kalmalı; merge/deploy yapılmamalı.
