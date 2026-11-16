import unittest
import tempfile
from pathlib import Path
from types import SimpleNamespace as N
from tiktok_adapter import normalize_event, normalize_engagement, normalize_catalog, merge_catalogs, Outbox, validate_username

def event(count=1,group=900,msg=100):
    return N(gift=N(id=1,name='Rose',diamond_count=1,streakable=True),gift_id=1,user=N(user_id=123,unique_id='alice'),repeat_count=count,repeat_end=False,group_id=group,common=N(msg_id=msg,create_time=1))

class AdapterTests(unittest.TestCase):
    def test_intermediate_streak_is_forwarded_with_stable_group(self):
        a=normalize_event(event(10,msg=100),'room',1000)
        b=normalize_event(event(15,msg=101),'room',1001)
        self.assertEqual(a['streakId'],b['streakId'])
        self.assertNotEqual(a['eventId'],b['eventId'])
        self.assertEqual(b['repeatCount'],15)
        self.assertEqual(b['coins'],1)
        self.assertEqual(b['userId'],'123')
    def test_ambiguous_group_or_message_is_rejected(self):
        for e in [event(group=0),event(msg=0)]:
            with self.assertRaises(ValueError): normalize_event(e,'room',1000)
    def test_new_real_series_uses_new_identity(self):
        self.assertNotEqual(normalize_event(event(group=1),'r',1000)['streakId'],normalize_event(event(group=2),'r',1000)['streakId'])
    def test_outbox_survives_restart_and_acks_only_one(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'outbox.db';q=Outbox(path)
            p=normalize_event(event(),'room',1000);q.put(p);q.put(p)
            q.close();q=Outbox(path);rows=q.pending()
            self.assertEqual(len(rows),1);self.assertEqual(rows[0][1],p)
            q.ack(rows[0][0]);self.assertEqual(q.pending(),[]);q.close()
    def test_username_validation(self):
        self.assertEqual(validate_username('@dental_arena'),'dental_arena')
        for u in ['', '--demo','https://tiktok.com/@a','a..b']:
            with self.assertRaises(ValueError):validate_username(u)

class CatalogTests(unittest.TestCase):
    def test_library_data_gifts_array_is_normalized_without_invented_ids(self):
        from tiktok_adapter import normalize_catalog
        gifts=normalize_catalog({'gifts':[{'id':9,'name':'A','diamond_count':20,'type':1,'image':{'url_list':['https://example.test/a']}}]})
        self.assertEqual(gifts[0]['giftId'],'9');self.assertTrue(gifts[0]['streak']);self.assertEqual(gifts[0]['coins'],20)
    def test_bad_prices_and_missing_ids_are_not_guessed(self):
        from tiktok_adapter import normalize_catalog
        with self.assertRaises(ValueError):normalize_catalog({'gifts':[{'name':'Tea','diamond_count':20}]})

class InstalledProviderTests(unittest.TestCase):
    def test_real_tiktoklive_7_proto_event(self):
        try:
            from TikTokLive.events import GiftEvent
            from TikTokLive.proto.custom_proto import ExtendedUser,ExtendedGift
        except ImportError:self.skipTest('Install scripts/requirements.txt for real provider schema test')
        from TikTokLiveProto.v3.webcast.shared.message import CommonMessageData
        common_message=CommonMessageData(msg_id=100,create_time=1)
        e=GiftEvent(common=common_message,user=ExtendedUser(id=123,display_id='alice'),gift=ExtendedGift(id=9,name='Provider fixture',diamond_count=1,type=1),group_id=42,repeat_count=10,repeat_end=0)
        p=normalize_event(e,'room',1000)
        self.assertEqual(p['userId'],'123');self.assertEqual(p['eventId'],'100')
        self.assertEqual(p['repeatCount'],10);self.assertTrue(p['streak']);self.assertEqual(p['streakId'],'42')

if __name__=='__main__':unittest.main()

class ReusedMessageTests(unittest.TestCase):
    def test_outbox_preserves_cumulative_updates_with_a_reused_provider_message_id(self):
        with tempfile.TemporaryDirectory() as d:
            q=Outbox(Path(d)/'queue');q.put(normalize_event(event(10),'r',1000));q.put(normalize_event(event(15),'r',1001))
            self.assertEqual(len(q.pending()),2);q.close()

class SavedGiftCatalogueTests(unittest.TestCase):
    def test_saved_459_provider_ids_merge_and_override_room_price_by_exact_id(self):
        import json
        from pathlib import Path
        path=Path(__file__).with_name('live_gift_catalog.json')
        saved=json.loads(path.read_text(encoding='utf-8'))
        self.assertEqual(len(saved['gifts']),459)
        room=normalize_catalog({'gifts':[{'id':17473,'name':'Room Name','diamond_count':999,'type':0}]})
        merged=merge_catalogs(room,saved['gifts'])
        by_id={g['giftId']:g for g in merged}
        self.assertEqual(len(by_id),459)
        self.assertEqual(by_id['17473']['name'],'Bouquet')
        self.assertEqual(by_id['17473']['coins'],20)
        self.assertEqual(by_id['17473']['streak'],False)
        self.assertTrue(by_id['17473']['streakKnown'])
        self.assertEqual(by_id['1429000']['coins'],30)
        self.assertEqual(by_id['10022']['coins'],20000)

    def test_saved_catalogue_fallback_id_uses_event_streak_metadata_and_exact_price(self):
        from tiktok_adapter import merge_catalogs
        merged=merge_catalogs([], [{'id':'17473','name':'Bouquet','coins':20}])
        known={g['giftId']:g for g in merged}
        e=N(gift=N(id=17473,name='Wrong provider label',diamond_count=999,streakable=False),
            user=N(user_id=123,unique_id='alice'),repeat_count=1,repeat_end=False,
            group_id=0,common=N(msg_id=700,create_time=1))
        payload=normalize_event(e,'room',1000,known)
        self.assertEqual(payload['coins'],20)
        self.assertEqual(payload['giftName'],'Bouquet')
        self.assertFalse(known['17473']['streakKnown'])

class EngagementAdapterTests(unittest.TestCase):
    def test_follow_and_like_events_have_stable_identity_and_count(self):
        follow=N(common=N(msg_id=800,create_time=10),user=N(user_id=77,unique_id='follow_user'))
        like=N(common=N(msg_id=801,create_time=11),user=N(user_id=88,unique_id='like_user'),like_count=125)
        self.assertEqual(normalize_engagement(follow,'room',20000,'follow'),{
            'type':'follow','eventId':'800','roomId':'room','userId':'77','username':'follow_user','count':1,'timestamp':10000})
        packet=normalize_engagement(like,'room',20000,'like')
        self.assertEqual(packet['eventId'],'801')
        self.assertEqual(packet['count'],125)
        self.assertEqual(packet['timestamp'],11000)

    def test_like_count_and_event_identity_are_required(self):
        with self.assertRaises(ValueError):
            normalize_engagement(N(common=N(msg_id=0),user=N(user_id=1,unique_id='a'),like_count=1),'room',20000,'like')
        with self.assertRaises(ValueError):
            normalize_engagement(N(common=N(msg_id=1),user=N(user_id=1,unique_id='a'),like_count=0),'room',20000,'like')

    def test_outbox_deduplicates_engagement_by_provider_event_id(self):
        with tempfile.TemporaryDirectory() as d:
            q=Outbox(Path(d)/'engagement.db')
            p={'type':'like','eventId':'like-1','roomId':'room','userId':'7','username':'alice','count':100,'timestamp':1000}
            q.put(p);q.put(p)
            self.assertEqual(len(q.pending()),1)
            self.assertEqual(q.pending()[0][1],p)
            q.close()
