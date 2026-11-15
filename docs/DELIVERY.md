# Diş Arena — yayın görünümü teslim kaydı

15 Kasım 2026. Uygulama kaynağı: `70c13d441376b1ebec4fd6376f8f03548f2b1b64`. Mevcut geliştirme dalı ve taslak [PR #1](https://github.com/dentalaidestek/dis-arena-live-/pull/1) güncellendi. Main birleştirilmedi; production dağıtımı yapılmadı.

## Sayfalar ve akış

| Sayfa | Amaç |
|---|---|
| `/arena` | Canlı izleyici görünümü |
| `/admin` | Sunucuda şifre doğrulamalı yayıncı paneli |
| `/obs` | Kontrolsüz, güvenli alanlı 9:16 yayın |
| `/demo` | Ayrı SQLite kaynağını izleyen test sahnesi |
| `/admin?mode=demo` | Demo butonları ve dört deneysel görsel işlem |

Üst dört lider, FDI numaraları, tur/sayaç ve olay akışı korunur. Tam ekran gir/çık turu sıfırlamaz. Tarayıcı yenilenince sunucudaki durum gelir. İzleyici şifresi yayıncı API yetkisi vermez. İlk kurulum kodu hem tek komut başlatıcıda hem düz `npm start` konsolunda bulunur.

## Kural ve 3D değişiklikleri

Canlı oyun: **Çay 50 → 30 saniye çekim kilidi**, **Parfüm 20 → implant ve kilidi kaldırma**. Çürütme/iyileştirme yalnız ayrı demodadır. Gerçek katalog ID'si uydurulmadı; eşleme panelden doğrulanmalıdır. Kümülatif seri farkı kalıcı SQLite kaydıyla hesaplanır.

Mevcut Three.js sahnesi korunmuştur. Dört taç formu, daha büyük iki hekim, daha dengeli hasta kafası, FDI/kısa isim plakaları, omuz-dirsek-bilek zinciri, hedef dişe uzanan alet, çekim/boşluk ve implant vidası/restorasyon geliştirilmiştir. Hasta acı/mutluluk geçişleri ve dört demo animasyonu gerçek WebGL sahnesinde oynar. İşlem hedefi sabit kalır; yeni tur önceki turun görsellerini reddeder. Karakterler stilize ve prosedüreldir; sanatçı üretimi rigged karakter kalitesi iddia edilmez.

## Test kanıtı

| Kontrol | Sonuç |
|---|---|
| Güncel motor/sunucu testleri | 63 geçti |
| Python köprü/yedek testleri | 10 geçti |
| Sağlayıcı protobuf → Python → SQLite | 1 geçti; sentetik ×1000 =1000, tekrar +0 |
| Üretim build | Geçti |
| `bash termux-preview.sh --check` | Geçti (Linux geliştirme ortamında) |
| Eski HP modülleri dahil geniş test | 98 test: 76 geçti, başlangıçta da var olan 22 başarısızlık sürüyor |
| Disk SQLite fixture ölçümü | 10.000 paket / 28 kullanıcı: 1576 ms; 6344 paket/sn; p95 0,353 ms |

Performans ölçümü yalnız bu ortamda doğrudan store çağrısıdır; TikTok/ağ/OBS/Android kapasite garantisi değildir. JS ~1,27 MB paket uyarısı ve sağlayıcı deprecation uyarısı sürüyor.

Tarayıcı kabul kapsamı: 360×800 ve 393×873 mobil emülasyonu, 1080×1920 OBS, masaüstü; gerçek WebGL render/FPS ve taşma; yayıncı girişi/çıkışı; hedef Ahmet/FDI11 üzerinde çekim→implant→çürütme→iyileştirme; native tam ekran/turun korunması; oda/admin yetki ayrımı; Gül1000 +100 hediye, dondurulan dört kazanan, temiz yeni tur. Üç CI iş akışı uygulama kaynağında başarılı:

- [Diş Arena CI](https://github.com/dentalaidestek/dis-arena-live-/actions/runs/43736281416)
- [Verify Diş Arena](https://github.com/dentalaidestek/dis-arena-live-/actions/runs/43736281524)
- [6 tarayıcı kabul testi](https://github.com/dentalaidestek/dis-arena-live-/actions/runs/43736281393)

Artifact: `14170930160`, SHA256 `2c9214c138acfea3e9dd638589dc9ac4cdbe24e4b31dc968d41d15ea0b84a5de`. Görseller tek tek ve karşılaştırmalı olarak açılıp incelendi.

## Ekran görüntüleri

Görüntüler gerçek Chromium/SwiftShader tarayıcı yakalamalarıdır. Depodaki WebP kopyaları yalnız dosya boyutu için dönüştürülmüştür; PNG asılları Actions artifact'indedir. Demo etiketi bilerek korunur.

- [393×873 mobil](screenshots/mobile.webp)
- [360×800 mobil](screenshots/mobile-360.webp)
- [1080×1920 OBS](screenshots/obs.webp)
- [Çekim sırasında](screenshots/extract.webp)
- [İmplant sırasında](screenshots/implant.webp)
- [Yayıncı paneli](screenshots/admin.webp)
- [Tam ekran](screenshots/fullscreen.webp)

## Açık kabul işleri

Aktif TikTok LIVE hesabı/kataloğu verilmediği için gerçek hediye teslimatı ve gerçek 50/20 ID eşleştirmesi denenmedi. Yeni sürüm fiziksel Android GPU/Termux cihazında ve uzun süreli gerçek OBS yayınında henüz doğrulanmadı. Docker ve çok sunuculu dağıtım da doğrulanmadı. Bu nedenle ürünün bütün yayın kabul kriterlerinin tamamlandığı iddia edilmez; PR taslak kalır. Ayrıntılar [ACCEPTANCE.md](ACCEPTANCE.md).

## Telefonda aç

```sh
cd ~/dis-arena-live-
git switch feature/coin-arena-20261112
git pull --ff-only
bash termux-preview.sh
```

`http://127.0.0.1:8787/admin?mode=demo` panel; `http://127.0.0.1:8787/demo` oyun; `http://127.0.0.1:8787/obs?mode=demo` temiz yayın. İlk açılışta konsol kodu ve yayıncı şifresi kullanılır. **Dört işlemi tam ekranda oynat** sahnedeki işlem turunu başlatır. Daha sonra gerçek LIVE için `bash termux-preview.sh --live` kullanılır. [Termux yönergeleri](TERMUX.md).

## Değişen dosyalar

Başlangıç `152578e` ile uygulama kaynağı arasındaki dosyalar; ekran kanıtı dosyaları ve bu rapor ayrıca eklenmiştir:

- `.dockerignore`
- `.github/workflows/ci.yml`
- `.github/workflows/verify.yml`
- `.github/workflows/visual.yml`
- `.gitignore`
- `Dockerfile`
- `README.md`
- `docs/ACCEPTANCE.md`
- `docs/GAME_RULES.md`
- `docs/TERMUX.md`
- `docs/TIKTOK_LIVE.md`
- `docs/superpowers/plans/2026-11-15-arena-completion.md`
- `docs/superpowers/plans/2026-11-15-broadcast-admin.md`
- `docs/superpowers/plans/2026-11-15-termux-presentation.md`
- `e2e/arena.spec.ts`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `public/fonts/DejaVuSans.ttf`
- `public/fonts/LICENSE-DejaVu.txt`
- `scripts/arena_backup.py`
- `scripts/benchmark.ts`
- `scripts/launch.mjs`
- `scripts/launcher.test.ts`
- `scripts/provider_fixture.py`
- `scripts/requirements.txt`
- `scripts/termux-check.sh`
- `scripts/test_backup.py`
- `scripts/test_tiktok_adapter.py`
- `scripts/tiktok_adapter.py`
- `scripts/tiktok_live_bridge.py`
- `server/access.test.ts`
- `server/access.ts`
- `server/consoleMonitor.ts`
- `server/demo.test.ts`
- `server/demo.ts`
- `server/integration.test.ts`
- `server/provider.fixture.spec.ts`
- `server/security.test.ts`
- `server/server.ts`
- `server/store.test.ts`
- `server/store.ts`
- `src/ActionAnimation.tsx`
- `src/AdminPanel.tsx`
- `src/DentalArenaScene.tsx`
- `src/Viewer.tsx`
- `src/broadcast.css`
- `src/coinArena.test.ts`
- `src/coinArena.ts`
- `src/main.tsx`
- `src/presentation.css`
- `src/procedureMotion.test.ts`
- `src/procedureMotion.ts`
- `src/proceduresV3.test.ts`
- `src/routes.test.ts`
- `src/routes.ts`
- `src/style.css`
- `src/toothGeometry.test.ts`
- `src/toothGeometry.ts`
- `src/ui/ProcedureIcon.tsx`
- `src/useArena.ts`
- `src/visualQueue.test.ts`
- `src/visualQueue.ts`
- `termux-preview.sh`
- `tsconfig.json`
- `vite.config.ts`
