#!/usr/bin/env python3
"""Unofficial TikTokLive ingestion. Normally managed by the arena control panel.
All incremental gift packets enter a durable SQLite outbox before HTTP delivery.
"""
import asyncio
import hashlib
import json
import os
from pathlib import Path
import random
import sys
import time
import urllib.request
from tiktok_adapter import normalize_event,normalize_catalog,merge_catalogs,Outbox,validate_username

async def main():
    if len(sys.argv)!=2:raise SystemExit('TikTok kullanıcı adı gerekli; bağlantı başlatılmadı')
    try:username=validate_username(sys.argv[1])
    except ValueError as exc:raise SystemExit(str(exc))
    token=os.environ.get('ARENA_BRIDGE_TOKEN','')
    if not token:raise SystemExit('ARENA_BRIDGE_TOKEN gerekli; bağlantı başlatılmadı')
    # Validate before importing/initializing any provider client.
    from TikTokLive import TikTokLiveClient
    from TikTokLive.events import ConnectEvent,DisconnectEvent,GiftEvent,LiveEndEvent
    from importlib.metadata import version
    print('TikTokLive version:',version('TikTokLive'),flush=True)
    directory=Path(os.environ.get('ARENA_DATA_DIR','data'));directory.mkdir(parents=True,exist_ok=True)
    outbox=Outbox(directory/'bridge-outbox.sqlite')
    catalog_path=Path(__file__).with_name('live_gift_catalog.json')
    try:
        with catalog_path.open('r',encoding='utf-8') as handle:
            user_catalog=json.load(handle)
        user_gifts=user_catalog.get('gifts') if isinstance(user_catalog,dict) else None
        if not isinstance(user_gifts,list) or not user_gifts:
            raise ValueError('Kayıtlı hediye kataloğu boş veya geçersiz')
        print(f'USER GIFT CATALOG: {len(user_gifts)} exact provider IDs loaded',flush=True)
    except Exception as exc:
        raise SystemExit('Kayıtlı hediye kataloğu okunamadı: '+str(exc))
    base=os.environ.get('ARENA_SERVER_URL','http://127.0.0.1:8787').rstrip('/')
    def post_sync(path,body):
        request=urllib.request.Request(base+'/api/bridge/'+path,data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method='POST')
        with urllib.request.urlopen(request,timeout=10) as response:return json.load(response)
    async def post(path,body):return await asyncio.to_thread(post_sync,path,body)
    async def status(state,error=''):
        print('STATUS:',state,error,flush=True)
        try:await post('status',{'state':state,'username':username,'error':error})
        except Exception as exc:print('Status delivery:',str(exc)[:120],flush=True)
    async def deliver():
        retry=0
        while True:
            try:
                for key,payload in outbox.pending():
                    result=await post('gift',payload)
                    # 200 means it was committed or safely quarantined in the server.
                    if not result.get('accepted') and not result.get('duplicate'):
                        print('QUARANTINED:',result.get('message'),flush=True)
                    outbox.ack(key)
                retry=0
                await asyncio.sleep(.05)
            except asyncio.CancelledError:raise
            except Exception as exc:
                retry+=1;print('Outbox retained:',str(exc)[:150],flush=True)
                await asyncio.sleep(min(30,2**min(retry,5))+random.random())
    delivery=asyncio.create_task(deliver())
    retry=0
    catalog_by_id={}
    try:
        while True:
            catalog_by_id.clear()  # Never reuse a previous room/session's catalogue.
            client=TikTokLiveClient(unique_id='@'+username)
            catalog_ready=asyncio.Event()
            @client.on(ConnectEvent)
            async def on_connect(event):
                await status('live-connected')
                try:
                    # Combine current-room streak/image metadata with the user's exact ID/coin list.
                    # The saved catalogue remains usable even if TikTok's regional gift-list endpoint fails.
                    provider_entries=[]
                    try:
                        info=client.gift_info or await client.web.fetch_gift_list()
                        provider_entries=normalize_catalog(info)
                    except Exception as provider_exc:
                        print('ROOM CATALOG UNAVAILABLE; using saved provider-ID list:',str(provider_exc)[:150],flush=True)
                    entries=merge_catalogs(provider_entries,user_gifts)
                    next_catalog_by_id={gift['giftId']:gift for gift in entries}
                    print(f'LIVE GIFT CATALOG: {len(entries)} unique IDs (saved list + room metadata)',flush=True)
                    for gift in entries:
                        print(f"GIFT: {gift['name']} | {gift['coins']} jeton | ID {gift['giftId']}",flush=True)
                    ver=hashlib.sha256(json.dumps(entries,sort_keys=True).encode()).hexdigest()[:24]
                    # Do not accept events against a catalogue the server has not committed yet.
                    await post('catalog',{'version':ver,'gifts':entries})
                    catalog_by_id.clear()
                    catalog_by_id.update(next_catalog_by_id)
                    print('CATALOG SYNCED: saved gift IDs and coin values are active for LIVE scoring',flush=True)
                except Exception as exc:await status('live-connected','Katalog sunucuya aktarılamadı; hediyeler puanlanmayacak: '+str(exc)[:150])
                finally:catalog_ready.set()
            @client.on(DisconnectEvent)
            async def on_disconnect(event):await status('disconnected')
            @client.on(LiveEndEvent)
            async def on_end(event):await status('live-ended')
            @client.on(GiftEvent)
            async def on_gift(event):
                now=int(time.time()*1000)
                await catalog_ready.wait()
                try:
                    payload=normalize_event(event,client.room_id,now,catalog_by_id)
                    outbox.put(payload)
                except ValueError as exc:
                    outbox.reject(exc,str(event),now);await status('live-connected',str(exc))
                except RuntimeError as exc:
                    outbox.reject(exc,str(event),now);await status('queue-full',str(exc));await client.disconnect()
            try:
                await status('connecting')
                await client.connect(fetch_gift_info=False)
                retry=0
            except asyncio.CancelledError:raise
            except Exception as exc:
                name=type(exc).__name__
                state='offline' if name in ('UserOfflineError','UserNotFoundError') else 'room-error' if name=='FailedParseRoomIdError' else 'connection-error'
                await status(state,name+': '+str(exc)[:200])
            finally:
                try:await client.close()
                except Exception:pass
            retry+=1
            await asyncio.sleep(min(60,2**min(retry,6))+random.uniform(0,1))
    finally:
        delivery.cancel()
        try:await delivery
        except asyncio.CancelledError:pass
        outbox.close()

if __name__=='__main__':
    try:asyncio.run(main())
    except KeyboardInterrupt:pass
