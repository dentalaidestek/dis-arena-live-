#!/usr/bin/env python3
"""Unofficial TikTok LIVE -> local browser WebSocket bridge (Termux).
Install: pip install TikTokLive websockets
Run: python scripts/tiktok_live_bridge.py @live_username
Only run against a stream you are authorized to monitor. No TikTok login is stored.
"""
import asyncio
import json
import os
import sys
import time
import random
from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, DisconnectEvent, GiftEvent
from websockets.asyncio.server import serve

PORT = int(os.environ.get('ARENA_WS_PORT', '8765'))
CLIENTS = set()
LIVE_STATE = {'type': 'status', 'state': 'live-disconnected'}

async def broadcast(message):
    payload = json.dumps(message, ensure_ascii=False)
    for ws in tuple(CLIENTS):
        try:
            await ws.send(payload)
        except Exception:
            CLIENTS.discard(ws)

async def websocket_handler(ws):
    CLIENTS.add(ws)
    try:
        await ws.send(json.dumps(LIVE_STATE, ensure_ascii=False))
        async for _ in ws:
            pass  # Browser cannot inject gift events into TikTok.
    finally:
        CLIENTS.discard(ws)

async def main():
    if len(sys.argv) != 2 or not sys.argv[1].strip('@ '):
        raise SystemExit('Usage: python scripts/tiktok_live_bridge.py @tiktok_username')
    username = sys.argv[1].strip().lstrip('@')
    client = TikTokLiveClient(unique_id='@' + username)

    @client.on(ConnectEvent)
    async def on_connect(event):
        LIVE_STATE.update({'state': 'live-connected', 'username': username})
        print('LIVE connected:', username, flush=True)
        await broadcast(LIVE_STATE)

    @client.on(DisconnectEvent)
    async def on_disconnect(event):
        LIVE_STATE.update({'state': 'live-disconnected'})
        print('LIVE disconnected', flush=True)
        await broadcast(LIVE_STATE)

    @client.on(GiftEvent)
    async def on_gift(event):
        gift = event.gift
        # Streak gifts emit intermediate events; count only the completed streak.
        if getattr(gift, 'streakable', False) and not getattr(event, 'repeat_end', False):
            return
        user = event.user
        gift_name = getattr(gift, 'name', '')
        coin_value = getattr(gift, 'diamond_count', None)
        repeat_count = max(1, int(getattr(event, 'repeat_count', 1) or 1))
        msg_id = str(getattr(event, 'msg_id', '') or '')
        # Never turn a repeated gift streak into a single ownership event of a different price.
        if coin_value is None:
            print('Unknown gift price:', gift_name, flush=True)
            return
        payload = {
            'type': 'gift',
            'eventId': msg_id or f'{username}:{getattr(user,"user_id","")}:{gift_name}:{time.time_ns()}',
            'userId': str(getattr(user, 'user_id', '') or getattr(user, 'unique_id', '')),
            'username': str(getattr(user, 'unique_id', '')),
            'giftName': str(gift_name),
            'coins': int(coin_value),
            'repeatCount': repeat_count,
            'timestamp': int(time.time() * 1000)
        }
        print('GIFT:', payload['username'], gift_name, coin_value, 'x', repeat_count, flush=True)
        await broadcast(payload)

    print(f'Local bridge ws://127.0.0.1:{PORT} | TikTok @{username}', flush=True)
    async with serve(websocket_handler, '127.0.0.1', PORT):
        retry = 0
        while True:
            try:
                await client.start()
                retry = 0
                print('LIVE session ended; reconnecting...', flush=True)
            except (KeyboardInterrupt, asyncio.CancelledError):
                raise
            except Exception as exc:
                LIVE_STATE.update({'state': 'live-disconnected'})
                await broadcast(LIVE_STATE)
                print('LIVE connection error:', type(exc).__name__, str(exc)[:200], flush=True)
            retry += 1
            delay = min(60, 2 ** min(retry, 5)) + random.uniform(0, 1)
            await asyncio.sleep(delay)
            client = TikTokLiveClient(unique_id='@' + username)
            client.add_listener(ConnectEvent, on_connect)
            client.add_listener(DisconnectEvent, on_disconnect)
            client.add_listener(GiftEvent, on_gift)

if __name__ == '__main__':
    asyncio.run(main())
