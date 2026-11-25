"""Rauchtest für den Basketball IQ Trainer (Playwright + Chromium).

Spielt automatisch einige Spielzüge im Lernmodus durch, speichert Screenshots
und trägt am Ende einen Namen in die (lokale) Rangliste ein.

Aufruf:
  python3 tools/smoke_test.py --three /pfad/zu/three.min.js [--pos pg|wing|center]
                              [--size 390x844] [--mode 4|5] [--level 1|2|3]
                              [--rounds 4] [--plays wcatch,wcut] [--out shots]
                              [--bag backdoor:gap,wcut:dribble]   (feste Spielzüge/Varianten)
                              [--rig alt]   (alte Figuren statt player.glb)

three.js 0.149.0 vorher lokal holen, z. B.:
  npm pack three@0.149.0 && tar xzf three-0.149.0.tgz package/build/three.min.js

Hinweis: Ohne GPU rendert Chromium per SwiftShader sehr langsam. Deshalb läuft der Test
im Lernmodus (ohne Zeitlimit) und mit ?lite (ohne Schatten). Für die Screenshots, die
Menschen ansehen sollen, kann --full die volle Grafik einschalten.
Die Seite wird über einen kleinen lokalen HTTP-Server geladen (Module und player.glb
lassen sich über file:// nicht laden). GLTFLoader/SkeletonUtils kommen von jsDelivr.
"""
import argparse, asyncio, os, random, pathlib, threading, functools, http.server
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Bildschirm-Position des gesuchten Spielers auf der Mini-Karte (wie der pointerdown-Handler in index.html rechnet)
QUIZ_XY = '''()=>{const G=window.__G,q=G.quiz,m=document.getElementById('mini'),r=m.getBoundingClientRect(),k=Math.min(r.width/m.width,r.height/m.height),M=window.__miniMap(),
  p=G.snap.find(p=>p.role===q.r);return [r.left+(r.width-m.width*k)/2+M.sx(p.x)*k, r.top+(r.height-m.height*k)/2+M.sz(p.z)*k];}'''

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

async def run(a):
    three = open(a.three, 'rb').read()
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/index.html'
    w, h = map(int, a.size.split('x'))
    os.makedirs(a.out, exist_ok=True)
    async with async_playwright() as p:
        kw = {'executable_path': a.chrome} if a.chrome else {}
        b = await p.chromium.launch(args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], **kw)
        pg = await b.new_page(viewport={'width': w, 'height': h})
        await pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript'))
        await pg.route('**/config.js', lambda r: r.abort())  # Test schreibt nicht in die echte Online-Rangliste
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        q = [x for x in ('' if a.full else 'lite', 'rig=alt' if a.rig == 'alt' else '', 'g=w' if a.girl else '') if x]
        await pg.goto(url + ('?' + '&'.join(q) if q else ''))
        await pg.wait_for_selector('#menu:not(.hidden)', timeout=60000)
        if a.rig != 'alt':
            await pg.wait_for_function('window.__glb()', timeout=60000)
            print('Figuren: player.glb')
        if await pg.is_visible('#welcome'):  # erster Start: Willkommens-Karte überspringen
            if a.girl:
                await pg.click('#wG .lvb[data-v="w"]')
                await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'{a.out}/welcome.png')
            await pg.click('#wSkip')
        # Sprachausgabe: zu jedem Text in VOICE gibt es voice/<id>.mp3 (und <id>_w.mp3, wenn fem() den Text ändert)
        miss = await pg.evaluate('''async()=>{const V=window.__snd.voice.VOICE,out=[];for(const k in V){const ids=[k];if(window.__snd.voice.fem(V[k])!==V[k])ids.push(k+'_w');
          for(const id of ids){const r=await fetch('voice/'+id+'.mp3');if(!r.ok)out.push(id);}}return out;}''')
        assert not miss, f'Sprachdateien fehlen: {miss}'
        print('Sprachdateien: vollständig')
        await pg.click(f'#pos .lvb[data-v="{a.pos}"]')
        await pg.click(f'#mode .lvb[data-m="{a.mode}"]')
        await pg.click(f'#lvl .lvb[data-l="{a.level}"]')
        await pg.click('#noLimit')
        if a.plays:
            want = a.plays.split(',')
            await pg.click('#playsTog')
            for c in await pg.eval_on_selector_all('#plays .chip', 'els=>els.map(e=>e.dataset.p)'):
                if c not in want:
                    await pg.click(f'.chip[data-p="{c}"]')
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'{a.out}/menu.png')
        if a.bag:
            bag = [x.split(':') for x in a.bag.split(',')]
            a.rounds = len(bag)
            await pg.evaluate('b=>{window.__bag=b}', bag)
        await pg.evaluate(f'window.__G.rounds={a.rounds}')
        await pg.click('#startBtn')
        seen = []
        for i in range(a.rounds):
            await pg.wait_for_function('window.__G.phase==="decide"', timeout=300000)
            await pg.wait_for_timeout(300)
            sc = await pg.evaluate('[window.__G.sc.play, window.__G.sc.variant, window.__G.sc.ans]')
            seen.append(sc)
            await pg.screenshot(path=f'{a.out}/decide{i}_{sc[0]}_{sc[1]}.png')
            ans = sc[2]
            if i % 3 == 2:
                opts = await pg.eval_on_selector_all('#controls .cb:not(.hidden), #tags .tag[data-c]', 'els=>els.map(e=>e.dataset.c)')
                ans = random.choice([o for o in opts if o != sc[2]] or opts)  # bewusst falsch: Frage in der Auswertung testen
            await pg.click(f'#bottom [data-c="{ans}"], #tags [data-c="{ans}"]')
            await pg.wait_for_function('window.__G.phase==="feedback"', timeout=300000)
            await pg.screenshot(path=f'{a.out}/feedback{i}.png')
            if await pg.evaluate('!!window.__G.quiz'):  # falsche Wahl: erst die Frage beantworten
                await pg.wait_for_function('window.__snd.voice.playing()', timeout=8000)  # Frage wird vorgelesen
                vt = await pg.evaluate('[window.__G.quiz.t, window.__snd.voice.file(window.__G.quiz.t), window.__snd.voice.duck()]')
                assert vt[1], f'Keine Sprachdatei für die Frage: {vt[0]}'
                print('Sprache:', vt[1], '·', vt[0], '· Effekte abgesenkt auf', round(vt[2] or 0, 2))
                await pg.click('#nextBtn')
                assert await pg.is_visible('#feedback'), 'Weiter darf vor der Antwort nicht gehen'
                await pg.wait_for_timeout(500)
                await pg.screenshot(path=f'{a.out}/feedback{i}_gesperrt.png')
                xy = await pg.evaluate(QUIZ_XY)
                await pg.mouse.click(xy[0], xy[1])
                assert not await pg.evaluate('!!window.__G.quiz'), 'Antippen auf der Karte hat die Frage nicht beantwortet'
                rf = await pg.evaluate('[window.__G.sc.rule, window.__snd.voice.file(window.__G.sc.rule)]')
                assert rf[1], f'Keine Sprachdatei für den Merksatz (in VOICE ergänzen): {rf[0]}'
                print('Merksatz:', rf[1])
                await pg.wait_for_timeout(300)
                await pg.screenshot(path=f'{a.out}/feedback{i}_antwort.png')
            await pg.click('#nextBtn')
        await pg.wait_for_selector('#summary:not(.hidden)', timeout=30000)
        await pg.wait_for_timeout(1300)
        if await pg.is_visible('#unlock'):  # Popup mit neuen Abzeichen
            await pg.screenshot(path=f'{a.out}/unlock.png')
            await pg.click('#ulOk')
        await pg.fill('#nameIn', 'Testkind')
        await pg.click('#saveBtn')
        await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{a.out}/summary.png', full_page=True)
        board = await pg.inner_text('#sBoard')
        print('Spielzüge:', seen)
        print('Rangliste:', ' | '.join(board.split('\n')[:4]))
        print('JS-Fehler:', errs or 'keine')
        await b.close()

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--three', required=True)
    ap.add_argument('--chrome', default=os.environ.get('CHROME', '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else ''))
    ap.add_argument('--size', default='1280x720')
    ap.add_argument('--pos', default='pg')
    ap.add_argument('--mode', default='4')
    ap.add_argument('--level', default='1')
    ap.add_argument('--rounds', type=int, default=4)
    ap.add_argument('--plays', default='')
    ap.add_argument('--bag', default='')
    ap.add_argument('--full', action='store_true')
    ap.add_argument('--out', default='shots')
    ap.add_argument('--rig', default='glb')
    ap.add_argument('--girl', action='store_true', help='Mädchen-Version (Texte und Figuren)')
    asyncio.run(run(ap.parse_args()))
