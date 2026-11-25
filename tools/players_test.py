"""Test für mehrere Spieler pro Gerät und den Spieler-Link (Playwright + Chromium, alte Figuren für Tempo).

Aufruf: python3 tools/players_test.py /pfad/zu/three.min.js [ausgabe-ordner]
Chromium: Umgebungsvariable CHROME (sonst Playwrights Standard), z. B. CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
Prüft: neuer Spieler, „Wer spielt?“ beim Start, Wechsel, Link auf einem zweiten Gerät übernehmen, Spieler entfernen.
"""
import asyncio, sys, os, functools, threading, http.server, pathlib
from playwright.async_api import async_playwright
OUT=sys.argv[2] if len(sys.argv)>2 else 'shots'
os.makedirs(OUT,exist_ok=True)
ROOT=str(pathlib.Path(__file__).resolve().parent.parent)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
SIM='''()=>{const G=__G;G.results=Array.from({length:5},(_,i)=>({play:'wcatch',ans:'pass:C',choice:'pass:C',ok:i<4,rt:1.2,pts:100,off:false,def:false,lz:'luecke'}));G.round=5;G.rounds=5;G.score=400;G.bestStreak=4;G.phase='feedback';document.getElementById('nextBtn').click();}'''
async def main():
    three=open(sys.argv[1],'rb').read()
    srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT))
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{srv.server_address[1]}/index.html?lite&rig=alt'
    async with async_playwright() as p:
        kw={'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {}
        b=await p.chromium.launch(**kw,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
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
        await pg.click('#sSave'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{OUT}/2_save.png')
        link=await pg.inner_text('#svLink'); print('link len',len(link), link[:90])
        await pg.click('#svClose'); await pg.click('#menuBtn'); await pg.wait_for_timeout(500)
        await pg.click('#cardBtn'); await pg.wait_for_timeout(400); await pg.screenshot(path=f'{OUT}/3_card.png')
        await pg.click('#pcWho'); await pg.wait_for_timeout(300); await pg.screenshot(path=f'{OUT}/4_who.png')
        async with pg.expect_navigation(wait_until='domcontentloaded',timeout=120000): await pg.click('#whoNew')
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
        # anderes Gerät
        ctx2=await b.new_context(viewport={'width':390,'height':664})
        pg3=await page(ctx2); await pg3.goto(link.replace('index.html#','index.html?lite&rig=alt#'), wait_until='domcontentloaded', timeout=120000); await ready(pg3)
        print('restore visible:', await pg3.is_visible('#restore'), 'welcome:', await pg3.is_visible('#welcome'))
        await pg3.screenshot(path=f'{OUT}/7_restore.png')
        async with pg3.expect_navigation(wait_until='domcontentloaded',timeout=120000): await pg3.click('#rsYes')
        await ready(pg3)
        print('device2:', await pg3.inner_text('#psName'), '|', await pg3.inner_text('#psLv'), '|', await pg3.inner_text('#psBd'), 'hash:', await pg3.evaluate('location.hash'))
        print('welcome after restore:', await pg3.is_visible('#welcome'))
        # löschen auf Gerät 1 (aktuell Mia in pg2)
        await pg2.click('#cardBtn'); await pg2.click('#pcTabs .lvb[data-t="edit"]'); await pg2.click('#pcDel')
        async with pg2.expect_navigation(wait_until='domcontentloaded',timeout=120000): await pg2.click('#pcDel')
        await ready(pg2)
        assert (await pg2.evaluate("JSON.parse(localStorage.pgt_players).length"))==1
        print('after delete:', await pg2.inner_text('#psName'), await pg2.evaluate("JSON.parse(localStorage.pgt_players).map(x=>x.name)"))
        # Querformat Sichern
        pg4=await page(ctx2); await pg4.set_viewport_size({'width':844,'height':390}); await pg4.goto(base, wait_until='domcontentloaded', timeout=120000); await ready(pg4)
        await pg4.click('#cardBtn'); await pg4.click('#pcSave'); await pg4.wait_for_timeout(2000); await pg4.screenshot(path=f'{OUT}/8_save_land.png')
        print('errs',errs)
        await b.close()
asyncio.run(main())
