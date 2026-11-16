"""Dependency-free provider adapter and durable transport outbox.
No inferred series IDs: missing stable provider identifiers are quarantined.
"""
import json
import re
import sqlite3

def validate_username(value):
    if not isinstance(value,str) or not re.fullmatch(r'@?[a-zA-Z0-9_][a-zA-Z0-9_.]{1,23}',value) or '..' in value or value.endswith('.'):
        raise ValueError('Geçerli TikTok kullanıcı adı gerekli (@kullanici_adi)')
    return value.lstrip('@')

def normalize_event(event,room_id,received_at,catalog_by_id=None):
    gift=event.gift
    user=event.user
    common=getattr(event,'common',None)
    msg_id=getattr(common,'msg_id',0) or getattr(event,'msg_id',0)
    user_id=getattr(user,'user_id',0) or getattr(user,'id',0)
    gift_id=getattr(gift,'id',0) or getattr(event,'gift_id',0)
    if not msg_id or not user_id or not gift_id or not room_id:
        raise ValueError('Olay, kullanıcı, hediye veya oda kimliği eksik')
    # The connected room catalogue is authoritative: event data cannot override a verified ID price.
    known=(catalog_by_id or {}).get(str(gift_id)) if catalog_by_id is not None else None
    if catalog_by_id is not None and known is None:
        raise ValueError('Hediye ID canlı odanın doğrulanmış kataloğunda yok')
    coins=known['coins'] if known is not None else getattr(gift,'diamond_count',None)
    count=getattr(event,'repeat_count',1) or 1
    if type(coins) is not int or coins<1 or type(count) is not int or not 1<=count<=100000:
        raise ValueError('Hediye fiyatı veya adedi geçersiz')
    streak=bool(getattr(gift,'streakable',False))
    group=getattr(event,'group_id',0) or getattr(event,'order_id',0)
    if streak and (not group or str(group)=='0'):
        raise ValueError('Seri kimliği belirsiz; puan verilmedi')
    provider_time=getattr(common,'create_time',0)
    timestamp=int(provider_time)*1000 if provider_time else received_at
    return {'type':'gift','eventId':str(msg_id),'roomId':str(room_id),'userId':str(user_id),
            'username':str(getattr(user,'unique_id','') or user_id),'giftId':str(gift_id),
            'giftName':str(known['name'] if known is not None else (getattr(gift,'name','') or gift_id)),'coins':coins,
            'repeatCount':count if streak else 1,'streak':streak,'streakId':str(group) if streak else '',
            'repeatEnd':bool(getattr(event,'repeat_end',False)),'timestamp':timestamp,'receivedAt':received_at}

def normalize_engagement(event,room_id,received_at,kind):
    """Normalize FollowEvent / LikeEvent into an idempotent tooth-claim packet."""
    common=getattr(event,'common',None)
    user=getattr(event,'user',None)
    msg_id=getattr(common,'msg_id',0) or getattr(event,'msg_id',0)
    user_id=getattr(user,'user_id',0) or getattr(user,'id',0)
    if kind not in ('follow','like') or not msg_id or not user_id or not room_id:
        raise ValueError('Takip/beğeni olayında oda, olay veya kullanıcı kimliği eksik')
    count=1
    if kind=='like':
        count=getattr(event,'like_count',0)
        if type(count) is not int or not 1<=count<=10000:
            raise ValueError('Beğeni adedi geçersiz')
    provider_time=getattr(common,'create_time',0)
    timestamp=int(provider_time)*1000 if provider_time else received_at
    return {'type':kind,'eventId':str(msg_id),'roomId':str(room_id),'userId':str(user_id),
            'username':str(getattr(user,'unique_id','') or getattr(user,'display_id','') or user_id),
            'count':count,'timestamp':timestamp}

class Outbox:
    def __init__(self,path):
        self.db=sqlite3.connect(str(path))
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA synchronous=FULL')
        self.db.executescript('CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS rejected(id INTEGER PRIMARY KEY,created INTEGER,reason TEXT,payload TEXT);')
    def put(self,payload):
        if payload.get('type') in ('follow','like'):
            key=json.dumps([payload['roomId'],payload['type'],payload['eventId']])
        else:
            key=json.dumps([payload['roomId'],payload['eventId'],[payload['userId'],payload['giftId'],payload.get('streakId'),payload.get('repeatCount',1)] if payload.get('streak') else None])
        if self.db.execute('SELECT count(*) FROM outbox').fetchone()[0]>=50000:
            raise RuntimeError('Kalıcı köprü kuyruğu 50000 olay sınırında; alıcıyı kontrol edin')
        with self.db:self.db.execute('INSERT OR IGNORE INTO outbox VALUES(?,?)',(key,json.dumps(payload)))
    def pending(self):
        return [(row[0],json.loads(row[1])) for row in self.db.execute('SELECT id,payload FROM outbox ORDER BY rowid LIMIT 100')]
    def ack(self,key):
        with self.db:self.db.execute('DELETE FROM outbox WHERE id=?',(key,))
    def reject(self,reason,payload,created):
        with self.db:self.db.execute('INSERT INTO rejected(created,reason,payload) VALUES(?,?,?)',(created,str(reason),str(payload)[:10000]))
    def close(self):self.db.close()

def normalize_catalog(info):
    """Normalize and de-duplicate the provider's live-room gift catalogue."""
    raw_gifts=info.get('gifts') if isinstance(info,dict) else None
    if raw_gifts is None and isinstance(info,dict):
        raw_gifts=[v for v in info.values() if isinstance(v,dict)]
    if not isinstance(raw_gifts,list):raise ValueError('Katalog biçimi desteklenmiyor')
    by_id={}
    for raw in raw_gifts:
        if not isinstance(raw,dict):continue
        price=raw.get('diamond_count');gid=raw.get('id')
        if type(price) is not int or price<1 or not gid:continue
        image=raw.get('image') or {};urls=image.get('url_list',[]) if isinstance(image,dict) else []
        entry={'giftId':str(gid),'name':str(raw.get('name',gid)),'coins':price,
               'streak':raw.get('type')==1,'streakKnown':True,'image':urls[0] if urls else '', 'region':'provider-room'}
        previous=by_id.get(entry['giftId'])
        if previous is not None:
            if previous['coins']!=entry['coins']:
                raise ValueError('Aynı hediye ID için çelişkili jeton değeri: '+entry['giftId'])
            continue
        by_id[entry['giftId']]=entry
    if not by_id:raise ValueError('Doğrulanabilir katalog kaydı yok')
    def sort_key(g):
        gid=g['giftId']
        return (g['coins'],0,int(gid)) if gid.isdigit() else (g['coins'],1,gid)
    return sorted(by_id.values(),key=sort_key)


def merge_catalogs(provider_entries,user_entries):
    """Merge the user's exact provider-ID price list with live-room metadata.

    User-supplied IDs and coin prices are canonical. When the room catalogue
    contains the same ID, retain its streak/image metadata; otherwise mark
    streak metadata unknown so the server can validate the event's streak flag.
    """
    by_id={str(g['giftId']):dict(g) for g in provider_entries}
    for raw in user_entries:
        if not isinstance(raw,dict):continue
        gid=raw.get('id',raw.get('giftId'))
        name=raw.get('name')
        coins=raw.get('coins')
        if not gid or not isinstance(name,str) or not name.strip() or type(coins) is not int or coins<1:
            raise ValueError('Kullanıcı hediye kataloğunda geçersiz ID, ad veya jeton değeri')
        gid=str(gid)
        previous=by_id.get(gid)
        by_id[gid]={
            'giftId':gid,
            'name':name,
            'coins':coins,
            'streak':bool(previous.get('streak')) if previous else False,
            'streakKnown':bool(previous is not None and previous.get('streakKnown',True)),
            'image':previous.get('image','') if previous else '',
            'region':'user-catalog'
        }
    if not by_id:raise ValueError('Birleştirilecek doğrulanmış hediye kataloğu yok')
    def sort_key(g):
        gid=g['giftId']
        return (g['coins'],0,int(gid)) if gid.isdigit() else (g['coins'],1,gid)
    return sorted(by_id.values(),key=sort_key)
