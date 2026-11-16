# Güncel oyun kuralları — 15 Kasım 2026

Eski 32 diş/HP/eleme kuralları ana uygulama için geçerli değildir.

- 28 diş, üstte ve altta 14'er; iki hekim; ilk geçerli hediye, takip veya 100 beğeni ile 600 saniyelik tur başlar.
- Puanlar benzersiz TikTok kullanıcı ID'sinde tutulur. Kullanıcı adı değişebilir.
- Sıralama: toplam jeton azalan, katılım zamanı artan, kullanıcı ID'si deterministik sözlü sırası. İlk 28 dişlere, ilk dört iki üst/iki alt merkezi kesiciye yerleşir.
- Canlı köprü, bağlı odanın tüm hediye kataloğunu her ID + ad + birim jeton değeriyle alır; ID bazlı indeksler ve kataloğu artan jeton değerine göre sıralar. Her hediye olayı bu doğrulanmış ID kaydından fiyat/ad alır; katalogda olmayan ID reddedilir. Normal hediyeler puan tablosuna katalogdaki birim jeton değeri kadar ekler (ör. 1 jeton = +1, 500 jeton = +500); seri hediyelerde yalnız yeni adet farkı eklenir. Sıralama toplam puana göre yapılır.
- Katılım: Bir TikTok takip olayı kullanıcıya bir diş sahiplenme hakkı verir. Canlı odadaki toplam beğeni sayısında her 100 yeni beğeni bir diş sahiplenme hakkı üretir. Aynı sağlayıcı olay kimliği tekrar gelirse yeniden işlenmez; bir kullanıcı aynı turda ikinci dişi alamaz; 28 diş dolduğunda yeni sahiplenme kabul edilmez. Takip/beğeni jeton puanı kazandırmaz.
- Özel canlı işlemler: Bouquet 20 jetonla çekim; Ghostfire 30 jetonla kötü hekimi, Warm Cocoa 30 jetonla iyi hekimi sahiplenir. Hekim sahiplenme puan tablosuna jeton eklemez ve her hekim tur başına yalnız bir kez sahiplenilir. Çürütme 10 / iyileştirme 10 yalnız ayrı demo ortamında çalışır.
- Çekim/çürütme gönderenin hediye öncesi hemen önündekini hedefler; birinci ikinciyi hedefler. İlk hediyesini gönderen, henüz önceki sıralamada bulunmayan oyuncunun saldırı hedefi yoktur.
- Çekim 30 saniye, çürütme 15 saniye kilitler. Kilitli hedefe yeni saldırı kilidi uzatmaz veya başka durumla değiştirmez. Eski jetonlar korunur.
- Kilitli gönderenden gelen normal hediyeler puan vermez. Çekimde yalnız implant, çürükte yalnız iyileştirme kilidi kaldırır ve hediye değerini puana ekler. Kilitli olmayan oyuncunun savunma hediyesi normal puandır.
- Süre dolduğu tam milisaniyede oyuncu serbesttir. Tur bitişinin tam milisaniyesindeki yeni hediye kabul edilmez. Kazananlar ve sonuç dondurularak saklanır.
- Her paket sunucunun teslim alıp transaction başlattığı sırayla ve sunucu zamanı kullanılarak işlenir. Sağlayıcı zamanı ayrıca günlüğe yazılır; geçmiş tura ait veya gelecekteki şüpheli mesajlar reddedilir. Tur bittikten sonra gelen eski paketler geçmiş sonucu değiştirmez.
- Gerçek işlem ataması doğrulanmış katalog ID'si ve birim fiyat eşleşmesiyle yapılır. Hediye ID'leri sabit kodlanmaz; Termux köprüsü bağlı LIVE odasının tam kataloğunu sunucuya aktarır. Yanlış fiyatlı veya doğrulanmamış hediyeler özel işlem tetiklemez; katalog fiyatı dışındaki olay değeri puan olarak kabul edilmez.
- Gül serisinde yeni adet = max(0, yeni çarpan − işlenmiş çarpan). Seri sonu ikinci kez yazılmaz. Belirsiz seri kimliğinde puan tahmin edilmez.
- Puanlar animasyon süresini beklemez. Görsel işlem kendi hedef kullanıcı/dişini ve işlem öncesi yerleşimi taşır. Görsel kuyruk özetlemesi puanları değiştirmez.
