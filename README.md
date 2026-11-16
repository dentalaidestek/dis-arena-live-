# Diş Arena — 28 diş, iki hekim, 10 dakika

Mevcut `feature/coin-arena-20261112` çalışmasının devamıdır. Güncel davranışlar [oyun kurallarında](docs/GAME_RULES.md), doğrulama ve yayın engelleri [kabul raporunda](docs/ACCEPTANCE.md) bulunur. Eski HP/32 diş modülleri ana ekranda kullanılmaz. Yeni klinik dioraması ve gerçek oyun görüntüleri [görsel yenileme kaydında](docs/VISUAL_REDESIGN.md); değişen dosyalar ve CI kanıtları [teslim kaydındadır](docs/DELIVERY.md).

| Canlı işlem | Doğrulanmış birim değer | Etki |
|---|---:|---|
| Bouquet / çekim | 20 jeton | Hediye öncesindeki rakibi 30 saniye kilitler |
| Parfüm / implant | 20 jeton | Gönderenin çekim kilidini kaldırır |

Son kullanıcı talimatıyla ana oyunda Bouquet / çekim ve Parfüm / implant hediyelerinin ikisi de 20 jetondur. Çürütme 10 / iyileştirme 10 kodları yalnız ayrı demoda korunur. Gerçek hediye ID'si uydurulmaz: yayın kataloğundan farklı ve doğru fiyatlı ID'ler yayıncı tarafından seçilir. Katalogdaki gerçek ad izleyici kartına aktarılır; yanlış fiyatlı eski atamalar saldırı oluşturmaz, normal doğrulanmış puan olarak işlenir.

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

İzleyici ve yayıncı sayfaları ayrıdır:

| Adres | İçerik |
|---|---|
| `/arena` | Canlı izleyici sahnesi; yönetici kontrolleri yok |
| `/admin` | Sunucuda doğrulanan yayıncı şifresi; yönetim ve bağlantı |
| `/obs` | Temiz 9:16 yayın; OBS Browser Source **1080 × 1920** |
| `/demo` | Canlıdan ayrı demo sahnesi |
| `/admin?mode=demo` | Yalnız demo verisine uygulanan test araçları |
| `/obs?mode=demo` | Demo yayın görünümü |

Eski `/?mode=demo` ve `/?view=obs` adresleri yeni sayfalara yönlenir. Termux başlatıcısı `/admin` sayfasını iki dakikalık, tek kullanımlık yerel kurulum koduyla açar. İlk kurulumda en az 8 karakterlik yayıncı şifresi belirlenir. Elle `npm start` kullanıyorsanız konsolda yazılan iki dakikalık kurulum kodunu `/admin` içindeki ilk kurulum bölümüne girin. `data/tokens.json` içindeki ayrı anahtarlar yalnız güvenilir CLI/köprü entegrasyonları içindir. Anahtarı paylaşmayın veya OBS URL'sine eklemeyin.

Şifreler scrypt ile tuzlanıp `access.sqlite` içinde saklanır. Oturumlar HttpOnly/SameSite cookie kullanır; sunucuda yalnız token özeti saklanır. Beş hatalı deneme 15 dakika sınırlandırılır. Oda izleme şifresi isteğe bağlı ve yönetici şifresinden ayrı yetkidedir. Yönetici API'leri ayrıca kontrol edilir; çıkış oturumu iptal eder. HTTPS reverse proxy arkasında `ARENA_SECURE_COOKIES=1` kullanın. HTTP Termux yerel bağlantısında Secure cookie kapalıdır.

Yayıncı panelindeki **Tam ekran yayın** oyunu sıfırlamadan ve TikTok köprüsünü kesmeden sahneyi açar; **Yayıncıya dön** paneli geri getirir. OBS sayfasında dönüş düğmesi dahi yoktur. Grafik kalitesi sunucu üzerinden canlı/demo için ayrı seçilir. Yayında üst %6 / alt %7 güvenli boşluk vardır; CSS `--tiktok-safe-top` / `--tiktok-safe-bottom` ile yayının arayüzüne göre ayarlanabilir.

Demo araçları yalnız `demo.sqlite` dosyasına yazar. 28 oyuncu, dört işlem, Gül ×1000, 100 hediye ve tur sonu burada denenir. Canlı yarışa test hediyesi eklenmez. Geliştirme: `npm start` yanında `npm run dev`; Vite API/WebSocket'i aynı sunucuya yönlendirir.

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
| `ARENA_SECURE_COOKIES` | `0` | HTTPS üzerinde oturum cookie Secure bayrağı |
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
npm run test:ui
npm run test:legacy
```

`test:provider`, TikTokLive 7.0.1'in gerçek protobuf sınıflarıyla üretilmiş **sentetik** ×1…×1000 olaylarını Python adaptöründen SQLite motoruna geçirir. Gerçek LIVE testi değildir. `test:legacy` eski HP modüllerini de çalıştırır; başlangıç commit'inde bulunan 22 başarısız testin listesi kabul raporundadır. CI, güncel motor/servis/adaptör testlerini ve derlemeyi çalıştırır.

## Yedekleme ve geçiş

```sh
python3 scripts/arena_backup.py backup --directory data --output backups/yayin-oncesi
# Arena ve köprü durdurulduktan sonra:
python3 scripts/arena_backup.py restore --backup backups/yayin-oncesi --directory data
```

SQLite online backup API'si WAL içeriğini de kapsar. Sağlama toplamı ve integrity_check doğrulanır. Geri yükleme mevcut veriyi önce ayrı bir `before-restore` yedeğine alır; PID dosyası aktif sunucu gösterirse reddeder. `access.sqlite` içindeki şifre özetleri de yedeklenir; yedekleri özel tutun. Bearer anahtarları yedek paketine alınmaz, ayrıca güvenli tutulmalıdır.

Eski `dis-arena-coin-v2` localStorage kaydı varsa panelde içe aktarma görünür. Yalnız boş veritabanına aktarılır; orijinal kayıt değiştirilmez ve ek bir kopyası SQLite'a kaydedilir. Mevcut eski olay kimlikleri korunur. Önceki uygulamanın silmiş olduğu 10.000 öncesi kimlikleri veya hiç kaydetmediği seri ilerlemesi sonradan geri oluşturulamaz; eski turu aktardıktan sonra gerçek LIVE'a geçmeden yeni tur açılması gerekir. Geri alma: sunucuyu durdurun, veritabanını yedekleyin, önceki kodu ayrı veri diziniyle başlatın; yeni SQLite dosyalarını silmeyin.
