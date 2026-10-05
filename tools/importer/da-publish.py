"""Upload imported documents (+ their /media-da images) to Document Authoring, then bulk preview/publish.

Usage: python3 tools/importer/da-publish.py <paths-file> <steps: check,images,pages,preview,live> [--workers N]
  <paths-file>: one document path per line, as in content/ (e.g. /accommodation, /fragments/x/y).
Credentials are injected by the environment for admin.da.live / admin.hlx.page (no Authorization header here).
A run log (JSONL) is kept next to the paths file so an interrupted run resumes (DA_LOG overrides its location).
"""
import concurrent.futures as cf
import json
import os
import re
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORG, SITE = 'aclarke-adobe', 'uom-da'
DA_SRC = f'https://admin.da.live/source/{ORG}/{SITE}'
DA_CONTENT = f'https://content.da.live/{ORG}/{SITE}'
ADMIN = 'https://admin.hlx.page'
MIME = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
        'webp': 'image/webp', 'svg': 'image/svg+xml'}


def curl(args, timeout=180):
    r = subprocess.run(['curl', '-s', '-w', '\n%{http_code}', *args], capture_output=True, text=True, timeout=timeout)
    body, _, code = r.stdout.rpartition('\n')
    return int(code or 0), body


class Log:
    def __init__(self, path):
        self.path = path

    def write(self, rec):
        with open(self.path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(rec) + '\n')

    def done(self, kind):
        ok = set()
        if os.path.exists(self.path):
            for line in open(self.path, encoding='utf-8'):
                r = json.loads(line)
                if r.get('kind') == kind and r.get('ok'):
                    ok.add(r['key'])
        return ok


def doc_file(path):
    return f'{REPO}/content{path}.plain.html'


def media_of(path):
    return set(re.findall(r'src="/media-da/([^"?#]+)', open(doc_file(path), encoding='utf-8').read()))


def check(paths):
    problems = []
    imgs = set()
    for p in paths:
        if not os.path.exists(doc_file(p)):
            problems.append(f'missing document {p}')
            continue
        size = os.path.getsize(doc_file(p))
        if size > 900_000:
            problems.append(f'{p} is {size} bytes (DA limit 1 MB)')
        imgs |= media_of(p)
    for n in sorted(imgs):
        f = f'{REPO}/content/media-da/{n}'
        if not os.path.exists(f):
            problems.append(f'missing image {n}')
        elif n.endswith('.svg') and os.path.getsize(f) > 40_000:
            problems.append(f'svg over 40 KB (preview rejects it): {n}')
    print(f'{len(paths)} documents, {len(imgs)} images; {len(problems)} problems')
    for x in problems[:30]:
        print('  ', x)
    return not problems


def upload_image(name):
    local = f'{REPO}/content/media-da/{name}'
    mime = MIME.get(name.rsplit('.', 1)[-1].lower(), 'application/octet-stream')
    code, body = 0, ''
    for attempt in range(3):
        code, body = curl(['-X', 'POST', '-F', f'data=@{local};type={mime}', f'{DA_SRC}/media-da/{name}'])
        if code in (200, 201):
            return name, True, code
        if code in (401, 403):
            break
        time.sleep(2 * (attempt + 1))
    return name, False, f'{code} {body[:120]}'


def upload_page(path):
    html = open(doc_file(path), encoding='utf-8').read().replace('src="/media-da/', f'src="{DA_CONTENT}/media-da/')
    doc = f'<body>\n  <header></header>\n  <main>{html}</main>\n  <footer></footer>\n</body>\n'
    tmp = f'/tmp/da_doc_{os.getpid()}_{abs(hash(path))}.html'
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(doc)
    try:
        code, body = 0, ''
        for attempt in range(3):
            code, body = curl(['-X', 'POST', '-F', f'data=@{tmp};type=text/html', f'{DA_SRC}{path}.html'])
            if code in (200, 201):
                return path, True, code
            if code in (401, 403):
                break
            time.sleep(2 * (attempt + 1))
        return path, False, f'{code} {body[:120]}'
    finally:
        os.remove(tmp)


def bulk(action, paths, log, chunk=500):
    """Bulk preview/live admin job; returns the paths that failed."""
    failures = []
    for i in range(0, len(paths), chunk):
        part = paths[i:i + chunk]
        code, body = curl(['-X', 'POST', '-H', 'Content-Type: application/json',
                           '--data', json.dumps({'paths': part, 'forceUpdate': True}),
                           f'{ADMIN}/{action}/{ORG}/{SITE}/main/*'])
        if code not in (200, 202):
            print(f'[{action}] job start failed {code}: {body[:200]}')
            failures += part
            continue
        res = json.loads(body)
        self_link = res.get('links', {}).get('self')
        print(f"[{action}] job {res.get('job', {}).get('name')} for {len(part)} paths", flush=True)
        while True:
            time.sleep(10)
            c, b = curl([f'{self_link}/details'])
            if c != 200:
                continue
            d = json.loads(b)
            prog = d.get('progress', {})
            print(f"  {d.get('state')} {prog.get('processed', 0)}/{prog.get('total', len(part))} failed={prog.get('failed', 0)}", flush=True)
            if d.get('state') in ('stopped', 'completed'):
                for r in d.get('data', {}).get('resources', []):
                    ok = r.get('status') in (200, 204, 304)
                    log.write({'kind': action, 'key': r.get('path'), 'ok': ok, 'status': r.get('status'), 'error': r.get('error')})
                    if not ok:
                        failures.append(r.get('path'))
                break
    return failures


def main():
    paths_file, steps = sys.argv[1], sys.argv[2].split(',')
    workers = int(sys.argv[sys.argv.index('--workers') + 1]) if '--workers' in sys.argv else 6
    paths = sorted({l.strip().rstrip('/') for l in open(paths_file, encoding='utf-8') if l.strip()})
    log = Log(os.environ.get('DA_LOG', f'{os.path.splitext(os.path.abspath(paths_file))[0]}.publish-log.jsonl'))
    if 'check' in steps and not check(paths):
        sys.exit('check failed; fix the problems above (or drop "check" to force)')
    if 'images' in steps:
        imgs = sorted(set().union(*[media_of(p) for p in paths]) - log.done('image'))
        print(f'{len(imgs)} images to upload', flush=True)
        with cf.ThreadPoolExecutor(workers) as ex:
            for n, (name, ok, info) in enumerate(ex.map(upload_image, imgs), 1):
                log.write({'kind': 'image', 'key': name, 'ok': ok, 'info': str(info)})
                if not ok or n % 200 == 0:
                    print(f'  image {n}/{len(imgs)} {name} {ok} {info}', flush=True)
    if 'pages' in steps:
        todo = [p for p in paths if p not in log.done('page')]
        print(f'{len(todo)} documents to upload', flush=True)
        with cf.ThreadPoolExecutor(workers) as ex:
            for n, (path, ok, info) in enumerate(ex.map(upload_page, todo), 1):
                log.write({'kind': 'page', 'key': path, 'ok': ok, 'info': str(info)})
                if not ok or n % 100 == 0:
                    print(f'  document {n}/{len(todo)} {path} {ok} {info}', flush=True)
    for action in ('preview', 'live'):
        if action in steps:
            fails = bulk(action, paths, log)
            print(f'[{action}] failures: {len(fails)} {fails[:10]}', flush=True)


if __name__ == '__main__':
    main()
