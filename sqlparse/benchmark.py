"""Bounded before/after measurements; invoke with source-tree path."""
import json
from pathlib import Path
import statistics
import sys
import time
sys.path.insert(0, str(Path(sys.argv[1]).resolve()))
import sqlparse
from sqlparse import lexer
from sqlparse.exceptions import SQLParseError

vectors = [
    ('CVE-2026-59893-dollar', (1000, 2000, 4000),
     lambda n: ' '.join(f'$a{i}$x' for i in range(n)),
     lambda text: list(lexer.tokenize(text))),
    ('CVE-2026-59893-comment', (2000, 4000, 8000),
     lambda n: '/*x ' * n, lambda text: list(lexer.tokenize(text))),
    ('CVE-2026-59893-hint', (2000, 4000, 8000),
     lambda n: '/*+x ' * n, lambda text: list(lexer.tokenize(text))),
    ('CVE-2026-71491', (2000, 4000, 8000),
     lambda n: '-- c\n' * n, sqlparse.parse),
    ('CVE-2026-84305-IN', (300, 600, 1200),
     lambda n: 'SELECT a FROM t WHERE (a, b) IN (' +
     ', '.join(f'({i}, {i*2})' for i in range(n)) + ')',
     lambda text: sqlparse.format(text, reindent=True)),
    ('CVE-2026-84305-VALUES', (500, 1000, 1950),
     lambda n: 'INSERT INTO t VALUES ' + ', '.join(f'({i})' for i in range(n)),
     lambda text: sqlparse.format(text, reindent=True)),
]
print(json.dumps({'python': sys.version, 'source': sqlparse.__file__}), flush=True)
for cve, sizes, build, run in vectors:
    for n in sizes:
        text = build(n)
        elapsed = []
        for _ in range(3):
            start = time.perf_counter()
            status = 'ok'
            try:
                run(text)
            except SQLParseError as exc:
                status = str(exc)
            elapsed.append(time.perf_counter() - start)
        print(json.dumps({'vector': cve, 'n': n, 'bytes': len(text),
                          'median_seconds': statistics.median(elapsed),
                          'status': status}), flush=True)
