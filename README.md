# Diş Arena — 28 diş, iki hekim, 10 dakika

Mevcut `feature/coin-arena-20261112` çalışmasının devamıdır. Güncel davranışlar [oyun kurallarında](docs/GAME_RULES.md), doğrulama ve yayın engelleri [kabul raporunda](docs/ACCEPTANCE.md) bulunur. Eski HP/32 diş modülleri ana ekranda kullanılmaz.

| İşlem | Birim hediye | Etki |
|---|---:|---|
| Çekim | 20 jeton | Önceki sıralamadaki hemen öndeki oyuncuyu 30 sn kilitler |
| İmplant | 20 jeton | Gönderenin çekim kilidini kaldırır |
| Çürütme | 10 jeton | Aynı hedefleme kuralıyla 15 sn kilitler |
| İyileştirme | 10 jeton* | Gönderenin çürük kilidini kaldırır |

*İyileştirme bedeli kullanıcı tarafından 15 Kasım 2026 tarihinde 10 jeton olarak kesinleştirildi. Dört işlem dört ayrı doğrulanmış hediye ID'si kullanır. Hiçbir gerçek TikTok ID'si uydurulmamıştır. Çay 50 jeton kuralı kaldırılmıştır; gerçek katalogda 20 jeton olmayan Çay, çekim hediyesi olarak seçilemez.

## Termux

Mevcut depoda `bash termux-preview.sh` komutu sunucuyu ve otomatik girişli 28 oyunculu demoyu birlikte açar. Python gerekmez. Ayrıntılar: [Termux testi](docs/TERMUX.md).

## Çalıştırma

Node **22.13+** (CI Node 22) ve Python **3.12** gerekir. Bağımlılıklar:

```sh
npm ci
python3 -m pip install -r scripts/requirements.txt
npm run build
npm start
```

`http://127.0.0.1:8787` yayıncı ekranıdır. Yönetici anahtarı ilk açılışta `data/tokens.json` dosyasının `admin` alanında oluşturulur; panelde bir kez girilir, sekme oturumunda saklanır. Anahtarı OBS URL'sine eklemeyin. Kullanıcı adını panelden yazıp **Bağlan** seçilir; Python köprüsü otomatik başlatılır, ayrı Termux oturumu gerekmez. Kullanıcı adı verilmeden sağlayıcı bağlantısı açılmaz.

- Demo: `http://127.0.0.1:8787/?mode=demo`
- OBS canlı: `http://127.0.0.1:8787/?view=obs`
- OBS demo: `http://127.0.0.1:8787/?view=obs&mode=demo`
- OBS Browser Source alanı: **1080 × 1920**. Görsel kabul kontrolü hâlâ gereklidir.
- Geliştirme: `npm start` yanında `npm run dev`; Vite API ve WebSocket'i aynı sunucuya yönlendirir.

Demo araçları yalnız `demo.sqlite` dosyasına yazar. Canlıya test hediyesi ekleme yolu yoktur. 28 oyuncu, dört işlem, Gül ×1000, 100 hediye ve tur sonu panelden denenebilir. Önce 28 oyuncuyu oluşturun. Saldırı için göndereni, savunma için kilitlenen oyuncuyu seçin.

## Mimari

Python TikTokLive → kalıcı SQLite outbox → Bearer korumalı HTTP → tek sunucu işlem sırası → SQLite transaction → salt okunur WebSocket → React/Three.js.

Puanlama React render döngüsünden bağımsızdır. Olay kaydı, seri ilerlemesi ve yeni oyun durumu aynı SQLite transaction içinde tamamlanır. Sonuçlar arşivlenir. 10.000 olaylık bellek listesi idempotency kaynağı değildir. Her tur sunucu UTC saatiyle ilk kabul edilen hediyede başlar; sıralama toplam jeton, ilk katılım zamanı, kullanıcı ID'si sırasındadır.

Gül seri çarpanı kümülatiftir: ×10→×15 yalnız +5 ekler. Oda/kullanıcı/hediye/sağlayıcı seri kimliği birlikte kullanılır. Tek bildirimde 100.000'e kadar normal hediye adetleri aritmetik olarak işlenir. Özel işlem serilerinde 1000 üzeri delta otomatik işlenmez; ham olay kalıcı inceleme kaydında tutulur. Sayısal taşmada paket bütünüyle geri alınır.

Animasyon sırasında işlemin önceki diş yerleşimi sabitlenir; güncel sıralama ayrı kalır. Bir defada bir görsel işlem oynar. Bekleyen kuyruk 256 görselle sınırlıdır; fazlası açık sayaçla özetlenir, puanlar silinmez. Sunucu tarafı yayın görsel paketi kuyruğu 500, yavaş izleyici tamponu 2 MB ile sınırlıdır. Kopan izleyici güncel duruma döner; kaçırdığı görseller otomatik yeniden oynatılmaz. Bütün hediye sonuçları olay günlüğünde kalır.

## Yapılandırma ve dağıtım

| Değişken | Varsayılan | Amaç |
|---|---|---|
| `ARENA_PORT` | `8787` | Node HTTP/WebSocket portu |
| `ARENA_HOST` | `127.0.0.1` | Dinlenecek adres |
| `ARENA_DATA_DIR` | `data` | Kalıcı disk dizini |
| `ARENA_ORIGINS` | Yerel 5173/8787 origin'leri | Virgülle ayrılmış izinli web origin'leri |
| `ARENA_ADMIN_TOKEN` | Üretilen yerel anahtar | Yönetici API erişimi |
| `ARENA_BRIDGE_TOKEN` | Ayrı üretilen anahtar | Sağlayıcı ingest erişimi |
| `ARENA_PYTHON` | `python3` | Python çalıştırıcısı |
| `ARENA_SERVER_URL` | `http://127.0.0.1:8787` | Ayrı çalıştırılan Python köprüsünün hedefi |

Üretimde tek arena süreci, kalıcı disk, TLS reverse proxy ve gerçek alan adıyla `ARENA_ORIGINS` kullanın. Konteyner için `Dockerfile` mevcuttur; `/app/data` kalıcı volume olmalıdır. Docker imajı bu oturumda oluşturulup denenmedi. Yatay ölçek veya çok sunuculu yazıcı mimarisi doğrulanmadı. İzleyici WebSocket'i salt okunurdur ve en fazla 64 yerel yayın izleyicisine izin verir; son kullanıcılara dağıtılan genel bir oyun sunucusu değildir.

## Testler

```sh
npm test
npm run test:python
npm run test:provider
npm run build
npm run benchmark
npm run test:legacy
```

`test:provider`, TikTokLive 7.0.1'in gerçek protobuf sınıflarıyla üretilmiş **sentetik** ×1…×1000 olaylarını Python adaptöründen SQLite motoruna geçirir. Gerçek LIVE testi değildir. `test:legacy` eski HP modüllerini de çalıştırır; başlangıç commit'inde bulunan 22 başarısız testin listesi kabul raporundadır. CI, güncel motor/servis/adaptör testlerini ve derlemeyi çalıştırır.

## Yedekleme ve geçiş

```sh
python3 scripts/arena_backup.py backup --directory data --output backups/yayin-oncesi
# Arena ve köprü durdurulduktan sonra:
python3 scripts/arena_backup.py restore --backup backups/yayin-oncesi --directory data
```

SQLite online backup API'si WAL içeriğini de kapsar. Sağlama toplamı ve integrity_check doğrulanır. Geri yükleme mevcut veriyi önce ayrı bir `before-restore` yedeğine alır; PID dosyası aktif sunucu gösterirse reddeder. Anahtarlar yedek paketine alınmaz, ayrıca güvenli tutulmalıdır.

Eski `dis-arena-coin-v2` localStorage kaydı varsa panelde içe aktarma görünür. Yalnız boş veritabanına aktarılır; orijinal kayıt değiştirilmez ve ek bir kopyası SQLite'a kaydedilir. Mevcut eski olay kimlikleri korunur. Önceki uygulamanın silmiş olduğu 10.000 öncesi kimlikleri veya hiç kaydetmediği seri ilerlemesi sonradan geri oluşturulamaz; eski turu aktardıktan sonra gerçek LIVE'a geçmeden yeni tur açılması gerekir. Geri alma: sunucuyu durdurun, veritabanını yedekleyin, önceki kodu ayrı veri diziniyle başlatın; yeni SQLite dosyalarını silmeyin.
