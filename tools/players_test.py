"""Test für mehrere Spieler pro Gerät und das Profil (Playwright + Chromium, alte Figuren für Tempo).

Aufruf: python3 tools/players_test.py /pfad/zu/three.min.js [ausgabe-ordner]
Chromium: Umgebungsvariable CHROME (sonst Playwrights Standard), z. B. CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
Prüft: neuer Spieler (über Profil), „Wer spielt?“ beim Start, Wechsel, Spieler entfernen, Kopfzeile mit Profil-Taste auf schmalen Handys,
Profil ohne Online-Konfiguration (nur Spielerliste) im Hoch- und Querformat.
"""
import asyncio, sys, os, functools, threading, http.server, pathlib
from playwright.async_api import async_playwright
from browser import launch_kw  # --gpu: echte Grafikkarte statt SwiftShader
OUT=sys.argv[2] if len(sys.argv)>2 else 'shots'
os.makedirs(OUT,exist_ok=True)
ROOT=str(pathlib.Path(__file__).resolve().parent.parent)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
SIM='''()=>{const G=__G;G.results=Array.from({length:5},(_,i)=>({play:'wcatch',ans:'pass:C',choice:'pass:C',ok:i<4,rt:1.2,pts:100,off:false,def:false,lz:'luecke'}));G.round=5;G.rounds=5;G.score=400;G.bestStreak=4;G.phase='feedback';document.getElementById('nextBtn').click();}'''
async def main():
    three=open(sys.argv[1],'rb').read()
    class S(http.server.ThreadingHTTPServer): request_queue_size=128  # sonst verliert macOS Verbindungen beim Laden vieler Dateien
    srv=S(('127.0.0.1',0),functools.partial(Q,directory=ROOT))
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{srv.server_address[1]}/index.html?lite&rig=alt'
    async with async_playwright() as p:
        b=await p.chromium.launch(**launch_kw(os.environ.get('CHROME')))
        errs=[]
        async def page(ctx):
            pg=await ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.route('**/three.min.js',lambda r:r.fulfill(body=three,content_type='application/javascript'))
            await pg.route('**/config.js',lambda r:r.abort()); return pg
        async def ready(pg): await pg.wait_for_selector('#loading.hidden',state='attached',timeout=90000); await pg.wait_for_timeout(700)
        ctx=await b.new_context(viewport={'width':390,'height':664})
        pg=await page(ctx); await pg.goto(base, wait_until='domcontentloaded', timeout=120000); await ready(pg)
        await pg.fill('#wName','Mia'); await pg.click('#wPos .lvb[data-v="wing"]'); await pg.click('#wSkip')
        for i in range(2):
            await pg.evaluate(SIM); await pg.wait_for_timeout(1500)
            if await pg.is_visible('#unlock'): await pg.click('#ulOk')
        await pg.screenshot(path=f'{OUT}/1_summary.png')
        print('ohne config.js keine Erinnerung ans Sichern:', not await pg.is_visible('#sSave'))
        await pg.click('#menuBtn'); await pg.wait_for_timeout(500)
        await pg.click('#cardBtn'); await pg.wait_for_timeout(400); await pg.screenshot(path=f'{OUT}/3_card.png')
        print('Spielerkarte ohne Sichern-Taste:', not await pg.query_selector('#pcSave'))
        await pg.click('#pcWho'); await pg.wait_for_timeout(300); await pg.screenshot(path=f'{OUT}/4_profile.png')
        print('Profil ohne Konto-Teil:', not await pg.is_visible('#acKonto'), await pg.is_visible('#acLocal'))
        async with pg.expect_navigation(wait_until='domcontentloaded',timeout=120000): await pg.click('#acNew')
        await ready(pg)
        print('welcome for new:', await pg.is_visible('#welcome'))
        await pg.fill('#wName','Ben'); await pg.click('#wSkip'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{OUT}/5_menu_ben.png')
        pg2=await page(ctx); await pg2.goto(base, wait_until='domcontentloaded', timeout=120000); await ready(pg2)
        print('picker on new session:', await pg2.is_visible('#who'))
        await pg2.screenshot(path=f'{OUT}/6_picker.png')
        async with pg2.expect_navigation(wait_until='domcontentloaded',timeout=120000): await pg2.click('#whoList .wp:first-child')
        await ready(pg2)
        print('after pick:', await pg2.inner_text('#psName'), '|', await pg2.inner_text('#psLv'))
        # löschen auf Gerät 1 (aktuell Mia in pg2)
        await pg2.click('#cardBtn'); await pg2.click('#pcTabs .lvb[data-t="edit"]'); await pg2.click('#pcDel')
        async with pg2.expect_navigation(wait_until='domcontentloaded',timeout=120000): await pg2.click('#pcDel')
        await ready(pg2)
        assert (await pg2.evaluate("JSON.parse(localStorage.pgt_players).length"))==1
        print('after delete:', await pg2.inner_text('#psName'), await pg2.evaluate("JSON.parse(localStorage.pgt_players).map(x=>x.name)"))
        # Profil-Taste in der Kopzeile: passt sie auf schmale Handys?
        for w,h in ((390,664),(375,667),(360,640)):
            await pg2.set_viewport_size({'width':w,'height':h}); await pg2.wait_for_timeout(300)
            r=await pg2.evaluate("(()=>{const b=document.getElementById('profBtn').getBoundingClientRect(),h=document.querySelector('.mhead').getBoundingClientRect();return [Math.round(b.right),Math.round(h.right),innerWidth]})()")
            print('Kopfzeile %dx%d: Profil-Taste rechts %d, Kopfzeile %d, Breite %d %s'%(w,h,r[0],r[1],r[2],'OK' if r[0]<=r[1]+0.5 else 'ZU BREIT'))
            await pg2.screenshot(path=f'{OUT}/9_menu_{w}.png')
        await pg2.set_viewport_size({'width':844,'height':390}); await pg2.wait_for_timeout(300)
        await pg2.click('#profBtn'); await pg2.wait_for_timeout(400); await pg2.screenshot(path=f'{OUT}/8_profile_land.png')
        print('errs',errs)
        await b.close()
asyncio.run(main())
