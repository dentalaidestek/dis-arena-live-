#!/usr/bin/env python3
"""Online SQLite backup; integrity-checked restore while the server is stopped."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import time
DATABASES=('live.sqlite','demo.sqlite','bridge-outbox.sqlite')
def checksum(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def backup(directory,output):
    directory=Path(directory);output=Path(output);output.mkdir(parents=True,exist_ok=False)
    manifest={}
    for name in DATABASES:
        source=directory/name
        if not source.exists():continue
        src=sqlite3.connect(source.resolve().as_uri()+'?mode=ro',uri=True);dst=sqlite3.connect(output/name)
        try:src.backup(dst)
        finally:dst.close();src.close()
        manifest[name]=checksum(output/name)
    if not manifest:raise ValueError('Yedeklenecek veritabanı yok')
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2))
def restore(source,directory):
    source=Path(source);directory=Path(directory)
    manifest=json.loads((source/'manifest.json').read_text())
    if not manifest or any(name not in DATABASES for name in manifest):raise ValueError('Geçersiz yedek manifesti')
    for name,expected in manifest.items():
        if checksum(source/name)!=expected:raise ValueError('Yedek sağlama toplamı uyuşmuyor: '+name)
        db=sqlite3.connect((source/name).resolve().as_uri()+'?mode=ro',uri=True)
        try:
            if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise ValueError('SQLite bütünlük hatası')
        finally:db.close()
    pidfile=directory/'server.pid'
    if pidfile.exists():
        try:os.kill(int(pidfile.read_text()),0)
        except ProcessLookupError:pass
        else:raise ValueError('Geri yüklemeden önce arena sunucusunu durdurun')
    if directory.exists() and any((directory/n).exists() for n in DATABASES):
        backup(directory,directory.parent/(directory.name+'-before-restore-'+str(time.time_ns())))
    directory.mkdir(parents=True,exist_ok=True)
    for name in manifest:
        # No active server; keep the original set in the pre-restore backup.
        for suffix in ('','-wal','-shm'):
            path=directory/(name+suffix)
            if path.exists():path.unlink()
        src=sqlite3.connect(source/name);dst=sqlite3.connect(directory/name)
        try:src.backup(dst)
        finally:dst.close();src.close()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['backup','restore']);parser.add_argument('--directory',default='data');parser.add_argument('--output');parser.add_argument('--backup')
    args=parser.parse_args()
    if args.action=='backup':
        if not args.output:parser.error('--output gerekli')
        backup(args.directory,args.output)
    else:
        if not args.backup:parser.error('--backup gerekli')
        restore(args.backup,args.directory)
