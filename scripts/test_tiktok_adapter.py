import unittest
import tempfile
from pathlib import Path
from types import SimpleNamespace as N
from tiktok_adapter import normalize_event, Outbox, validate_username

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
