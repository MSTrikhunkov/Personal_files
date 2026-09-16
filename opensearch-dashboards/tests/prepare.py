#!/usr/bin/env python3
"""Fetch hash-pinned upstream fixtures (or use --cache), without npm install scripts."""
import argparse, base64, hashlib, io, json, tarfile, urllib.request
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--work',required=True,type=Path)
p.add_argument('--cache',type=Path)
a=p.parse_args()
manifest=json.loads(Path(__file__).with_name('fixtures.json').read_text())
for item in manifest:
    key=item['name']+'-'+item['version']
    cached=a.cache/(key+'.tgz') if a.cache else None
    data=cached.read_bytes() if cached and cached.exists() else urllib.request.urlopen(item['url'],timeout=60).read()
    integrity='sha512-'+base64.b64encode(hashlib.sha512(data).digest()).decode()
    if integrity != item['integrity']: raise SystemExit('Integrity mismatch: '+key)
    targets=[a.work/'original'/key, a.work/'fixtures'/key/'node_modules'/item['name']]
    for target in targets:
        if target.exists(): raise SystemExit('Use a fresh work directory: '+str(target))
    with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
        for entry in archive:
            name=Path(entry.name)
            if name.is_absolute() or '..' in name.parts or name.parts[0]!='package':
                raise SystemExit('Unsafe archive member')
            if not entry.isfile():
                if entry.isdir(): continue
                raise SystemExit('Unsupported archive member')
            content=archive.extractfile(entry).read()
            for target,relative in [(targets[0],name),(targets[1],Path(*name.parts[1:]))]:
                output=target/relative;output.parent.mkdir(parents=True,exist_ok=True);output.write_bytes(content)
    print('Verified and extracted',key)
