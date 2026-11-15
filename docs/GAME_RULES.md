# Güncel oyun kuralları — 15 Kasım 2026

Eski 32 diş/HP/eleme kuralları ana uygulama için geçerli değildir.

- 28 diş, üstte ve altta 14'er; iki hekim; ilk geçerli hediye ile 600 saniye.
- Puanlar benzersiz TikTok kullanıcı ID'sinde tutulur. Kullanıcı adı değişebilir.
- Sıralama: toplam jeton azalan, katılım zamanı artan, kullanıcı ID'si deterministik sözlü sırası. İlk 28 dişlere, ilk dört iki üst/iki alt merkezi kesiciye yerleşir.
- Ana canlı oyunda Çay 50 jetonla çekim; Parfüm 20 jetonla implant yapar. Çürütme 10 / iyileştirme 10 yalnız ayrı demo ortamında deneysel olarak korunur.
- Çekim/çürütme gönderenin hediye öncesi hemen önündekini hedefler; birinci ikinciyi hedefler. İlk hediyesini gönderen, henüz önceki sıralamada bulunmayan oyuncunun saldırı hedefi yoktur.
- Çekim 30 saniye, çürütme 15 saniye kilitler. Kilitli hedefe yeni saldırı kilidi uzatmaz veya başka durumla değiştirmez. Eski jetonlar korunur.
- Kilitli gönderenden gelen normal hediyeler puan vermez. Çekimde yalnız implant, çürükte yalnız iyileştirme kilidi kaldırır ve hediye değerini puana ekler. Kilitli olmayan oyuncunun savunma hediyesi normal puandır.
- Süre dolduğu tam milisaniyede oyuncu serbesttir. Tur bitişinin tam milisaniyesindeki yeni hediye kabul edilmez. Kazananlar ve sonuç dondurularak saklanır.
- Her paket sunucunun teslim alıp transaction başlattığı sırayla ve sunucu zamanı kullanılarak işlenir. Sağlayıcı zamanı ayrıca günlüğe yazılır; geçmiş tura ait veya gelecekteki şüpheli mesajlar reddedilir. Tur bittikten sonra gelen eski paketler geçmiş sonucu değiştirmez.
- Gerçek işlem ataması hediye adına göre yapılmaz: doğrulanmış katalog ID'si ve birim fiyat eşleşmesi gerekir. Canlı çekim ve implant iki farklı, doğrulanmış 50 ve 20 jetonluk ID kullanır. Eski 20 jetonluk çekim veya deneysel atamalar canlıda yalnız normal puan olur.
- Gül serisinde yeni adet = max(0, yeni çarpan − işlenmiş çarpan). Seri sonu ikinci kez yazılmaz. Belirsiz seri kimliğinde puan tahmin edilmez.
- Puanlar animasyon süresini beklemez. Görsel işlem kendi hedef kullanıcı/dişini ve işlem öncesi yerleşimi taşır. Görsel kuyruk özetlemesi puanları değiştirmez.
