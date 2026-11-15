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

def normalize_event(event,room_id,received_at):
    gift=event.gift
    user=event.user
    common=getattr(event,'common',None)
    msg_id=getattr(common,'msg_id',0) or getattr(event,'msg_id',0)
    user_id=getattr(user,'user_id',0) or getattr(user,'id',0)
    gift_id=getattr(gift,'id',0) or getattr(event,'gift_id',0)
    if not msg_id or not user_id or not gift_id or not room_id:
        raise ValueError('Olay, kullanıcı, hediye veya oda kimliği eksik')
    coins=getattr(gift,'diamond_count',None)
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
            'giftName':str(getattr(gift,'name','') or gift_id),'coins':coins,
            'repeatCount':count if streak else 1,'streak':streak,'streakId':str(group) if streak else '',
            'repeatEnd':bool(getattr(event,'repeat_end',False)),'timestamp':timestamp,'receivedAt':received_at}

class Outbox:
    def __init__(self,path):
        self.db=sqlite3.connect(str(path))
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA synchronous=FULL')
        self.db.executescript('CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS rejected(id INTEGER PRIMARY KEY,created INTEGER,reason TEXT,payload TEXT);')
    def put(self,payload):
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
    """TikTokLive 7 returns the gift/list `data` object containing `gifts`."""
    raw_gifts=info.get('gifts') if isinstance(info,dict) else None
    if raw_gifts is None and isinstance(info,dict):
        raw_gifts=[v for v in info.values() if isinstance(v,dict)]
    if not isinstance(raw_gifts,list):raise ValueError('Katalog biçimi desteklenmiyor')
    entries=[]
    for raw in raw_gifts:
        if not isinstance(raw,dict):continue
        price=raw.get('diamond_count');gid=raw.get('id')
        if type(price) is not int or price<1 or not gid:continue
        image=raw.get('image') or {};urls=image.get('url_list',[]) if isinstance(image,dict) else []
        entries.append({'giftId':str(gid),'name':str(raw.get('name',gid)),'coins':price,
                        'streak':raw.get('type')==1,'image':urls[0] if urls else '', 'region':'provider-room'})
    if not entries:raise ValueError('Doğrulanabilir katalog kaydı yok')
    return sorted(entries,key=lambda g:g['giftId'])
