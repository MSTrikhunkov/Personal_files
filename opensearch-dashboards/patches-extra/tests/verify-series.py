#!/usr/bin/env python3
"""Verify patch application and reverse application against originals from the supplied archive."""
import argparse, hashlib, subprocess, tarfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('archive',type=Path);p.add_argument('work',type=Path);a=p.parse_args()
folder=Path(__file__).resolve().parents[1];a.work.mkdir(parents=True,exist_ok=False)
files=['scripts/postinstall.js','src/dev/build/tasks/install_dependencies_task.ts','package.json','yarn.lock','.node-version']
original={}
with tarfile.open(a.archive) as archive:
    for relative in files:
        data=archive.extractfile('OpenSearch-Dashboards-2.14.0/'+relative).read()
        original[relative]=data;dest=a.work/relative;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
series=[str(folder.parent/'patches'/name) for name in (folder.parent/'patches/series').read_text().splitlines()] + [str(folder/name) for name in (folder/'series').read_text().splitlines()]
def run(name,*flags):
    result=subprocess.run(['patch','-p1','--batch',*flags,'-i',str(folder/name)],cwd=a.work,text=True,capture_output=True)
    print(result.stdout,end='');print(result.stderr,end='')
    if result.returncode or any(word in result.stdout.lower() for word in ['fuzz','offset','failed']): raise SystemExit('Patch verification failed: '+name)
for name in series:run(name,'--dry-run');run(name)
for relative in ['package.json','yarn.lock','.node-version']:
    assert (a.work/relative).read_bytes()==original[relative]
print('PASS forward application, unchanged manifests/lockfile/Node version')
for name in reversed(series):run(name,'-R')
for relative,data in original.items():assert (a.work/relative).read_bytes()==data
assert not list((a.work/'scripts/security_backports').glob('*'))
print('PASS reverse application restores original files')
for name in series:run(name)
print('PASS reapplication; patched verification tree retained at',a.work)
