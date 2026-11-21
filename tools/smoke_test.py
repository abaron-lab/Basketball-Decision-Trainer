"""Rauchtest für den Point Guard Trainer (Playwright + Chrome).

Spielt automatisch einige Spielzüge im Lernmodus durch und speichert Screenshots.

Aufruf:
  python3 tools/smoke_test.py --three /pfad/zu/three.min.js [--size 390x844] [--mode 4|5]
                              [--rounds 4] [--plays top,break,wing,backdoor] [--out shots]

three.js 0.149.0 vorher lokal holen, z. B.:
  npm pack three@0.149.0 && tar xzf three-0.149.0.tgz package/build/three.min.js

Hinweis: Ohne GPU rendert Chrome per SwiftShader sehr langsam. Deshalb läuft der Test
im Lernmodus (ohne Zeitlimit) und klickt die wippenden Pass-Blasen mit force=True.
"""
import argparse, asyncio, os, random, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ALL_PLAYS = ['top', 'break', 'wing', 'backdoor']

async def run(a):
    three = open(a.three, 'rb').read()
    w, h = map(int, a.size.split('x'))
    os.makedirs(a.out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=a.chrome, args=[
            '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': w, 'height': h})
        await pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript'))
        await pg.route('https://fonts.**', lambda r: r.abort())
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((ROOT / 'index.html').as_uri())
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{a.out}/menu.png')
        await pg.click(f'#mode .lvb[data-m="{a.mode}"]')
        await pg.click('#noLimit')
        for c in ALL_PLAYS:
            if c not in a.plays.split(','):
                await pg.click(f'.chip[data-p="{c}"]')
        await pg.click('#startBtn')
        seen = []
        for i in range(a.rounds):
            await pg.wait_for_function('window.__G.phase==="decide"', timeout=180000)
            await pg.wait_for_timeout(300)
            sc = await pg.evaluate('[window.__G.sc.play, window.__G.sc.variant, window.__G.sc.ans]')
            seen.append(sc)
            await pg.screenshot(path=f'{a.out}/decide{i}_{sc[0]}_{sc[1]}.png')
            ans = sc[2] if i % 3 != 2 else random.choice(['drive', 'shot'])
            if ans.startswith('pass:'):
                await pg.click(f'.bub[data-r="{ans[5:]}"]', force=True)
            else:
                await pg.click(f'.cb[data-c="{ans}"]')
            await pg.wait_for_function('window.__G.phase==="feedback"', timeout=180000)
            await pg.screenshot(path=f'{a.out}/feedback{i}.png')
            await pg.click('#nextBtn')
        print('Spielzüge:', seen)
        print('JS-Fehler:', errs or 'keine')
        await b.close()

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--three', required=True)
    ap.add_argument('--chrome', default='/usr/bin/google-chrome')
    ap.add_argument('--size', default='1280x720')
    ap.add_argument('--mode', default='4')
    ap.add_argument('--rounds', type=int, default=4)
    ap.add_argument('--plays', default=','.join(ALL_PLAYS))
    ap.add_argument('--out', default='shots')
    asyncio.run(run(ap.parse_args()))
