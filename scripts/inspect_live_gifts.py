#!/usr/bin/env python3
"""Read the real gift catalogue of a public TikTok LIVE without starting the arena server."""
import asyncio
import sys
from tiktok_adapter import normalize_catalog, validate_username

DEFAULT_USERNAME = "sariangona61"

async def main():
    username = validate_username(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_USERNAME)
    from TikTokLive import TikTokLiveClient
    from TikTokLive.events import ConnectEvent

    client = TikTokLiveClient(unique_id="@" + username)
    finished = asyncio.Event()
    outcome = {"error": None}

    @client.on(ConnectEvent)
    async def on_connect(_event):
        try:
            # Fetch the catalogue from this room's live provider response.
            info = await client.web.fetch_gift_list()
            gifts = normalize_catalog(info)
            print(f"\nLIVE CONNECTED: @{username}", flush=True)
            print(f"CATALOG ENTRIES: {len(gifts)}", flush=True)
            print("\nALL GIFTS (provider IDs; not guessed):", flush=True)
            for gift in gifts:
                print(f"GIFT: {gift['name']} | {gift['coins']} jeton | ID {gift['giftId']}", flush=True)
            fifty = [g for g in gifts if g["coins"] == 50]
            print("\n50-JETON GIFTS:", flush=True)
            if fifty:
                for gift in fifty:
                    print(f"50 COIN: {gift['name']} | ID {gift['giftId']}", flush=True)
            else:
                print("Bu odanın kataloğunda 50 jetonluk hediye bulunamadı.", flush=True)
        except Exception as exc:
            outcome["error"] = str(exc)
            print("CATALOG ERROR:", str(exc), flush=True)
        finally:
            finished.set()

    connect_task = asyncio.create_task(client.connect(fetch_gift_info=False))
    try:
        await asyncio.wait_for(finished.wait(), timeout=90)
    except asyncio.TimeoutError:
        outcome["error"] = "90 saniyede LIVE bağlantısı/katalog yanıtı alınamadı."
        print("TIMEOUT:", outcome["error"], flush=True)
    finally:
        try:
            await client.disconnect()
        except Exception:
            pass
        if not connect_task.done():
            connect_task.cancel()
        try:
            await connect_task
        except (asyncio.CancelledError, Exception):
            pass
    if outcome["error"]:
        raise SystemExit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nİşlem kullanıcı tarafından durduruldu.", flush=True)
