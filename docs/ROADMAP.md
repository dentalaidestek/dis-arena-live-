# Diş Arena — ürün ve uygulama planı

## Görsel referans
Kullanıcının paylaştığı kırmızı/kötü ve mavi/iyi hekim ekipli, ortada 32 diş bulunan 9:16 afiş görseli tasarım referansıdır. **Görseli tek parça arka plan olarak kullanma**: diş, diş eti, karakter, HUD ve bildirimler ayrı canlı 3D/UI katmanları olmalıdır.

## Sabit kararlar
- 32 diş, 32 takım. Kulüp listesi henüz onaylanmadı; mevcut liste geçici.
- Her dişte sağlık, çürük/kırık saldırı izi, ayrı tüketilebilir çürük/kırık kalkanları, çekim ve implant durumu.
- Kalkanlar süreyle değil ilgili saldırı başına birer eksilir.
- 0 HP tek başına otomatik çekim değildir; çekim ayrı olaydır ve 20 HP altında mümkündür.
- İmplant, çekilmiş dişi geri getirir. Finalde implant kilidi ve tur sonlandırma koşulları ayrıca netleştirilecek.
- Kötü hekimler: Karies (çürütme), Erozyon (aşındırma), Ekstraksiyon (çekim); iyi hekimler: Restorasyon (tedavi), Periodonti (temizleme), İmplant (geri getirme).
- Kullanıcının TikTok adı, avatarı ve eylemi animasyon kartında gösterilir; yasal ad/soyad tahmin edilmez.
- En sağlıklı takımın formasını ayrı lider karakter giyer. Eşitlikte önceki lider korunur; açılışta tek lider yoktur.
- Gerçekçi dev insan yüzü kullanılmaz; anatomik ağız sahnenin merkezidir.
- PC'de TikTok LIVE Studio, alternatif telefon ekran paylaşımı hedeflenir.

## Aşamalar
1. Oyun motoru ve yerel simülasyon (başlangıç sürümü).
2. Anatomik 32 GLB diş, diş eti, ayrı çürük shader, kırık deformasyonu, çekim/implant animasyonu.
3. Blender rig'li hekimler, iyi/kötü takım girişleri, kullanıcı kartı ve ses efektleri.
4. Animasyon kuyruğu (öncelik, birleştirme, geç gelen olay, reconnect), kalıcı durum ve yönetim paneli.
5. Lider forması/arma varlıklarının lisans kontrolü ve alternatif özgün tasarımlar.
6. Yetkili TikTok olay kaynağı doğrulaması, moderasyon ve LIVE Studio testleri.

## Platform riski
Hediye göndererek doğrudan oyun sonucunu değiştirme özelliği TikTok LIVE kurallarına uygunluğu doğrulanmadan etkinleştirilmeyecek. Kumar, nakit ödül, hediye baskısı, sahte izleyici/hediye yok. Öncelik ücretsiz yorum etkileşimli oyun ve kozmetik hediye tepkileri.

## Teknik borç
İlk 3D sahnede anatomik modeller yerine geçici geometriler kullanılıyor; gerçek hekimler ve takım formaları henüz yok. WebSocket/TikTok bağlantısı ve testler henüz tamamlanmadı. Oyunun üretime hazır olduğu iddia edilmemeli.
