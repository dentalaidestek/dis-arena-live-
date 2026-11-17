"""Generate synthetic, typed TikTokLive 7 packets. No LIVE account or real gift IDs."""
import json
from TikTokLive.events import GiftEvent
from TikTokLive.proto.custom_proto import ExtendedGift,ExtendedUser
from TikTokLiveProto.v3.webcast.shared.message import CommonMessageData
from tiktok_adapter import normalize_event
packets=[]
for i in range(1,1001):
    event=GiftEvent(common=CommonMessageData(msg_id=i,create_time=1),user=ExtendedUser(id=123,display_id='fixture_user'),gift=ExtendedGift(id=9,name='Fixture Rose',diamond_count=1,type=1),group_id=42,repeat_count=i,repeat_end=int(i==1000))
    packets.append(normalize_event(event,'fixture-room',1000+i))
print(json.dumps(packets))
