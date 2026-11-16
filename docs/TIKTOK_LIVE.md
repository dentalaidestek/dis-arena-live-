# TikTok LIVE köprüsü

TikTokLive **7.0.1** üçüncü taraf kütüphanesi kullanılır. Resmi TikTok API'si veya garanti edilmiş teslimat kanalı değildir.

## Bağlantı

Yayıncı paneli doğrulanmış kullanıcı adıyla Python sürecini başlatır. Boş ad, URL, `--demo` ve bozuk adlar sağlayıcı istemcisi oluşturulmadan reddedilir. `client.connect()` oturum tamamlanana kadar beklenir; `start()` tarafından dönen arka plan task'ının yanlışlıkla bırakılması engellenmiştir.

Durumlar: connecting, live-connected, disconnected, live-ended, offline, room-error, connection-error, queue-full. FailedParseRoomIdError oda çözümleme hatası olarak gösterilir. Üstel bekleme ve jitter ile yeniden denenir. Yeni istemci her denemeden sonra kapatılır. Panelden bağlantı kesme yönetilen köprüyü sonlandırır; outbox sonraki açılışa kalır.

## Olay sözleşmesi

`common.msg_id`, `user.id`, `gift.id`, `gift.diamond_count`, `repeat_count`, `repeat_end`, `group_id` (yoksa gerçek `order_id`), `common.create_time`, oda kimliği korunur. Ara seri bildirimleri filtrelenmez. Kullanıcı adı ID yerine kullanılmaz. Mesaj kimliği veya seri kimliği yoksa karantinaya alınır; saat tabanlı sahte olay/seri ID'si oluşturulmaz.

TikTokLive gerçek protobuf nesneleriyle adaptör testi ve ×1…×1000 uçtan uca fixture testi vardır. Gerçek yayın üzerinde hediye gönderilerek test yapılmadı. Sağlayıcı mesaj kimliğini ara seri güncellemelerinde yeniden kullanırsa benzersizlik anahtarı kümülatif adedi de kapsar; tekrar puanlamayı ayrıca kalıcı seri ilerlemesi engeller.

## Kalıcılık ve sınırlar

Adaptör ham normalize paketi SQLite outbox'a yazdıktan sonra Bearer korumalı `/api/bridge/gift` adresine teslim eder. Başarılı HTTP yanıtı işlem veya kalıcı karantina kaydı anlamına gelir; ardından outbox kaydı silinir. Yanıt kaybolursa aynı paket tekrar iletilir. Kuyruk 50.000 pakette durdurulur ve hata bildirilir. Kaynağın kendisinin göndermediği, ağ kopukken sağlayıcıdan hiç alınmamış veya işlem başlamadan önce sürecin kaybettiği olaylar geri getirilemez. Sıfır kayıp garantisi yoktur.

Geliş sırası sunucu transaction sırasıdır; sağlayıcı zamanıyla geçmişe dönük sıralama yapılmaz. Eski tura ait gecikmiş paketler, tamamlanan tur hediyeleri ve taşma yapan paketler kalıcı inceleme kaydında tutulur. Reddedilmiş paketi otomatik sonradan puana çevirme yoktur; canlı tur sonuçlarını sessizce değiştirmez.

## Katalog ve gerçek hediyeler

Katalog, bağlantıda `client.web.fetch_gift_list()` üzerinden alınır; 7.0.1'in `data.gifts` dizisi normalize edilir. ID/ad/birim jeton/tür/seri davranışı/görsel, sağlayıcı oda kapsamı, doğrulama zamanı ve içerik hash sürümü kaydedilir. Ülke bilgisi sağlayıcıda yoksa tahmin edilmez. Katalog alınamazsa son doğrulanmış sürüm saklanır; panel 24 saati aşanı eski işaretler. Bilinmeyen ID, farklı fiyat veya seri türü puanlanmaz.

Hediye ID'leri kaynak koduna sabit yazılmaz; aynı ad farklı ülke/oda kataloglarında farklı ID veya fiyatla gelebilir. Termux köprüsü her bağlantıda gerçek oda kataloğunu alır. Sunucu katalogdaki tekil `Tea`/`Çay` + 50 jeton kaydını kötü hekim, tekil `Genius` + 50 jeton kaydını iyi hekim sahiplenme olarak otomatik eşler. Genius o odanın kataloğunda yoksa otomatik eşleme yapılmaz; yönetici panelinden katalogdaki başka bir 50 jetonluk hediye seçilebilir. Bouquet 20 jeton çekim ve Parfüm 20 jeton implant için de gerçek ID, katalogdan doğrulanır. İsim/fiyat eşleşmesi tekil değilse sistem tahmin yürütmez. Çürütme ve iyileştirme yalnız demo ortamındadır.

Kaynaklar (15 Kasım 2026'da incelendi):
- https://ttl.docs.isaackogan.com/guides/gifts/
- https://github.com/isaackogan/TikTokLive/blob/master/TikTokLive/events/proto_events.py
- Yerelde kurulan TikTokLive 7.0.1: `client.connect`, `start`, `fetch_gift_list`, `ExtendedGift`, `ExtendedUser` kaynakları.
