import sqlite3,tempfile,unittest
from pathlib import Path
from arena_backup import backup,restore
class BackupTests(unittest.TestCase):
    def test_backup_restores_rows_and_detects_corruption(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);source=root/'source';source.mkdir()
            db=sqlite3.connect(source/'live.sqlite');db.execute('create table example(x)');db.execute('insert into example values(42)');db.commit();db.close()
            dest=root/'backup';backup(source,dest);restore(dest,root/'restored')
            db=sqlite3.connect(root/'restored/live.sqlite');self.assertEqual(db.execute('select x from example').fetchone()[0],42);db.close()
            (dest/'live.sqlite').write_bytes(b'bad')
            with self.assertRaises(ValueError):restore(dest,root/'broken')
