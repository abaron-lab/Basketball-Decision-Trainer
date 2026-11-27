"""Test für das Konto mit E-Mail-Link (js/account.js) gegen ein nachgebautes Firebase (Playwright + Chromium, alte Figuren für Tempo).

Aufruf: python3 tools/account_test.py /pfad/zu/three.min.js [ausgabe-ordner]
Chromium: Umgebungsvariable CHROME (sonst Playwrights Standard).
Es wird nichts an das echte Firebase geschickt: config.js zeigt auf ein Testprojekt, Identity Toolkit, Secure Token und
Firestore beantwortet dieser Test selbst (Daten im Speicher, die Konto-Regeln aus firestore.rules vereinfacht nachgebildet).
Prüft: Anmelden auf Gerät A (Link auf demselben Gerät), Hochladen, automatische Ranglisten-Einträge, Gerät B lädt die Spieler,
Gerät C ohne offene Anfrage (E-Mail bestätigen), Link einfügen, Spieler entfernen, Konto löschen, Gerät A ist danach abgemeldet.
"""
import asyncio, sys, os, functools, threading, http.server, pathlib, json, re, itertools
from urllib.parse import urlparse, parse_qs, unquote
from playwright.async_api import async_playwright
from browser import launch_kw  # --gpu: echte Grafikkarte statt SwiftShader
OUT=sys.argv[2] if len(sys.argv)>2 else 'shots'
os.makedirs(OUT,exist_ok=True)
ROOT=str(pathlib.Path(__file__).resolve().parent.parent)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
SIM='''()=>{const G=__G;G.results=Array.from({length:5},(_,i)=>({play:'wcatch',ans:'pass:C',choice:'pass:C',ok:i<4,rt:1.2,pts:100,off:false,def:false,lz:'luecke'}));G.round=5;G.rounds=5;G.score=400;G.bestStreak=4;G.phase='feedback';document.getElementById('nextBtn').click();}'''
PRE='projects/test/databases/(default)/documents/'
CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS'}

class FakeFirebase:
    def __init__(s):
        s.codes={}; s.users={}; s.docs={}; s.n=itertools.count(1); s.log=[]; s.mails=[]
    def tok_uid(s,req):
        a=req.headers.get('authorization','')
        m=re.match(r'Bearer tok-(\w+)-\d+$',a)
        return m.group(1) if m and m.group(1) in s.users.values() else None
    async def handle(s,route):
        req=route.request; u=urlparse(req.url)
        if req.method=='OPTIONS': return await route.fulfill(status=204,headers=CORS)
        body=req.post_data or ''
        try: st,res=s.dispatch(req,u,body)
        except Exception as e: st,res=500,{'error':{'message':'TEST '+repr(e)}}
        s.log.append((req.method,u.path.split('/documents/')[-1] if 'documents' in u.path else u.path,st))
        await route.fulfill(status=st,headers={**CORS,'Content-Type':'application/json'},body=json.dumps(res))
    def dispatch(s,req,u,body):
        h=u.hostname
        if h=='identitytoolkit.googleapis.com':
            op=u.path.split(':')[-1]; j=json.loads(body or '{}')
            if op=='sendOobCode':
                assert j['requestType']=='EMAIL_SIGNIN' and j.get('canHandleCodeInApp') and j['continueUrl'].startswith('http'), j
                code='c%d'%next(s.n); s.codes[code]=(j['email'].lower(),j['continueUrl']); s.mails.append((j['email'],code,j['continueUrl']))
                return 200,{'email':j['email']}
            if op=='signInWithEmailLink':
                c=s.codes.pop(j.get('oobCode'),None)
                if not c: return 400,{'error':{'message':'INVALID_OOB_CODE'}}
                if c[0]!=j['email'].lower(): return 400,{'error':{'message':'INVALID_EMAIL'}}
                uid=s.users.setdefault(c[0],'u%d'%next(s.n))
                return 200,{'idToken':'tok-%s-%d'%(uid,next(s.n)),'refreshToken':'rt-'+uid,'localId':uid,'email':c[0],'expiresIn':'3600'}
            if op=='delete':
                uid=re.match(r'tok-(\w+)-',j['idToken']).group(1)
                s.users={k:v for k,v in s.users.items() if v!=uid}; return 200,{}
        if h=='securetoken.googleapis.com':
            uid=parse_qs(body)['refresh_token'][0][3:]
            if uid not in s.users.values(): return 400,{'error':{'message':'USER_NOT_FOUND'}}
            return 200,{'id_token':'tok-%s-%d'%(uid,next(s.n)),'refresh_token':'rt-'+uid,'expires_in':'3600','user_id':uid}
        if h=='firestore.googleapis.com':
            path=unquote(u.path.split('/documents/',1)[1]) if '/documents/' in u.path else ''
            me=s.tok_uid(req); q=parse_qs(u.query)
            if path.endswith(':runQuery'):
                col=path[:-9]; sq=json.loads(body)['structuredQuery']; out=[]
                for k,f in s.docs.items():
                    if k.rsplit('/',1)[0]!=col+'/scores': continue
                    w=sq.get('where')
                    if w and f.get(w['fieldFilter']['field']['fieldPath'],{}).get('stringValue')!=w['fieldFilter']['value']['stringValue']: continue
                    out.append({'document':{'name':PRE+k,'fields':f}})
                return 200,out or [{'readTime':'x'}]
            seg=path.split('/')
            if seg[0]=='accounts':
                if me!=seg[1] or (len(seg)>=4 and req.method=='PATCH' and not re.fullmatch(r'[a-z0-9]{1,12}',seg[3])): return 403,{'error':{'message':'PERMISSION_DENIED'}}
            if req.method=='GET':
                if len(seg)%2==1:  # Sammlung
                    docs=[{'name':PRE+k,'fields':f} for k,f in s.docs.items() if k.rsplit('/',1)[0]==path]
                    return 200,({'documents':docs} if docs else {})
                return (200,{'name':PRE+path,'fields':s.docs[path]}) if path in s.docs else (404,{'error':{'message':'NOT_FOUND'}})
            if req.method=='PATCH':
                f=json.loads(body)['fields']
                if 'updateMask.fieldPaths' in q:
                    if path not in s.docs or 'consent' not in s.docs[path]: return 403,{'error':{'message':'PERMISSION_DENIED'}}
                    s.docs[path]={**s.docs[path],**{k:f[k] for k in q['updateMask.fieldPaths']}}
                else: s.docs[path]=f
                if seg[0]=='accounts' and len(seg)==4: assert set(f)=={'data','games','ts'} and len(f['data']['stringValue'])<=4000, f
                return 200,{'name':PRE+path,'fields':s.docs[path]}
            if req.method=='DELETE':
                if seg[0]=='teams':
                    d=s.docs.get(path,{})
                    if not me or d.get('uid',{}).get('stringValue')!=me: return 403,{'error':{'message':'PERMISSION_DENIED'}}
                s.docs.pop(path,None); return 200,{}
            if req.method=='POST' and seg[0]=='teams':
                f=json.loads(body)['fields']
                if 'uid' in f and f['uid']['stringValue']!=me: return 403,{'error':{'message':'PERMISSION_DENIED'}}
                k='%s/s%d'%(path,next(s.n)); s.docs[k]=f; return 200,{'name':PRE+k,'fields':f}
        return 404,{'error':{'message':'NOT_HANDLED'}}

def check(cond,msg):
    print(('OK   ' if cond else 'FAIL ')+msg)
    if not cond: check.fail+=1
check.fail=0

async def main():
    three=open(sys.argv[1],'rb').read()
    class S(http.server.ThreadingHTTPServer): request_queue_size=128  # sonst verliert macOS Verbindungen beim Laden vieler Dateien
    srv=S(('127.0.0.1',0),functools.partial(Q,directory=ROOT))
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{srv.server_address[1]}/index.html?lite&rig=alt&team=tigers'
    fb=FakeFirebase()
    async with async_playwright() as p:
        b=await p.chromium.launch(**launch_kw(os.environ.get('CHROME')))
        errs=[]
        async def page(ctx):
            pg=await ctx.new_page(); pg.set_default_timeout(120000); pg.set_default_navigation_timeout(180000); pg.on('pageerror',lambda e:errs.append(str(e)+' '+str(e.stack)[:400]))
            await pg.route('**/three.min.js',lambda r:r.fulfill(body=three,content_type='application/javascript'))
            await pg.route('**/config.js',lambda r:r.fulfill(body="window.ONLINE_CONFIG={projectId:'test',apiKey:'k'};",content_type='application/javascript'))
            for host in ('identitytoolkit','securetoken','firestore'): await pg.route(f'https://{host}.googleapis.com/**',fb.handle)
            return pg
        async def ready(pg):
            try: await pg.wait_for_selector('#loading.hidden',state='attached',timeout=90000)
            except Exception: print('Seite lädt nicht, Fehler:',errs); raise
            await pg.wait_for_timeout(700)
        async def game(pg):
            await pg.evaluate(SIM); await pg.wait_for_timeout(1800)
            if await pg.is_visible('#unlock'): await pg.click('#ulOk')
        async def open_link(pg,code,cont):
            sep='&' if '?' in cont else '?'
            await pg.goto(f'{cont}{sep}apiKey=k&oobCode={code}&mode=signIn&lang=de',wait_until='domcontentloaded',timeout=120000); await ready(pg)
            await pg.wait_for_timeout(1200)
        players=lambda uid:{k:v for k,v in fb.docs.items() if k.startswith(f'accounts/{uid}/players/')}
        scores=lambda:{k:v for k,v in fb.docs.items() if k.startswith('teams/')}

        # ---------- Gerät A ----------
        ctxA=await b.new_context(viewport={'width':390,'height':664}); A=await page(ctxA)
        await A.goto(base,wait_until='domcontentloaded',timeout=120000); await ready(A)
        await A.fill('#wName','Mia'); await A.click('#wSkip')
        for _ in range(2): await game(A)
        check(await A.is_visible('#sSave'),'Auswertung erinnert ans Sichern')
        check('E-Mail' in await A.inner_text('#sSave'),'Erinnerung nennt die E-Mail der Eltern')
        await A.click('#sSave'); await A.wait_for_timeout(300)
        await A.screenshot(path=f'{OUT}/acc_1_form.png')
        await A.fill('#acMail','eltern@example.org'); await A.click('#acSend'); await A.wait_for_timeout(300)
        check(await A.is_visible('#acOkRow') and not fb.mails,'ohne Häkchen kein Link')
        await A.check('#acOk'); await A.click('#acSend'); await A.wait_for_timeout(600)
        check(len(fb.mails)==1 and await A.is_visible('#acTo'),'Link verschickt, Hinweis aufs Postfach')
        await A.screenshot(path=f'{OUT}/acc_2_sent.png')
        em,code,cont=fb.mails[-1]
        check('team=tigers' in cont and 'oobCode' not in cont,'Rücksprung behält ?team= '+cont)
        await open_link(A,code,cont)
        check(await A.is_visible('#acct .apane[data-p="in"]'),'nach dem Link angemeldet')
        check('oobCode' not in A.url and 'team=tigers' in A.url,'Adresse aufgeräumt: '+A.url)
        uid=fb.users.get('eltern@example.org')
        check(uid and f'accounts/{uid}' in fb.docs and 'consent' in fb.docs[f'accounts/{uid}'],'Konto-Dokument mit Einwilligung')
        pl=players(uid); check(len(pl)==1,'Spieler hochgeladen: %d'%len(pl))
        await A.screenshot(path=f'{OUT}/acc_3_in.png')
        await A.click('#acClose'); await A.wait_for_timeout(300)
        check('Gesichert' in await A.inner_text('#pcSave'),'Spielerkarte zeigt „Gesichert“')
        await game(A); await A.wait_for_timeout(2500)
        check(not await A.is_visible('#sSave'),'mit Konto keine Erinnerung ans Sichern')
        sc=[v for v in scores().values() if v.get('uid',{}).get('stringValue')==uid]
        check(len(sc)==1 and sc[0]['name']['stringValue']=='Mia','automatisch in die Rangliste eingetragen (mit uid)')
        check('tigers' in fb.docs[f'accounts/{uid}'].get('teams',{}).get('stringValue',''),'Team im Konto gemerkt')
        g=[json.loads(v['data']['stringValue'])['d'][4] for v in players(uid).values()]
        check(g==[3],'Spielstand nach dem Spiel hochgeladen: %s'%g)
        await A.screenshot(path=f'{OUT}/acc_4_summary.png')
        await A.click('#menuBtn'); await A.wait_for_timeout(300)

        # ---------- Gerät B: frisch, über „Ich habe schon einen Spieler“ ----------
        ctxB=await b.new_context(viewport={'width':390,'height':664}); B=await page(ctxB)
        await B.goto(base,wait_until='domcontentloaded',timeout=120000); await ready(B)
        await B.click('#wHave'); await B.wait_for_timeout(300)
        check(await B.is_visible('#whoAcct'),'„Mit E-Mail anmelden“ bei „Wer spielt?“')
        await B.screenshot(path=f'{OUT}/acc_5_who.png')
        await B.click('#whoAcct'); await B.fill('#acMail','Eltern@Example.org'); await B.check('#acOk'); await B.click('#acSend'); await B.wait_for_timeout(500)
        em,code,cont=fb.mails[-1]; await open_link(B,code,cont)
        check(await B.is_visible('#acct .apane[data-p="in"]'),'Gerät B angemeldet')
        msg=await B.inner_text('#acMsg'); check('1 Spieler' in msg,'Meldung: '+msg)
        await B.click('#acClose'); await B.wait_for_timeout(500)
        nm=await B.inner_text('#psName'); check('MIA' in nm.upper(),'Gerät B hat Mia: '+nm)
        check(not await B.is_visible('#welcome'),'keine Willkommens-Karte mehr')
        await B.reload(wait_until='domcontentloaded'); await ready(B)
        check('MIA' in (await B.inner_text('#psName')).upper(),'nach Neuladen noch Mia')
        # Gerät B legt einen zweiten Spieler an → im Konto
        await B.click('#cardBtn'); await B.wait_for_timeout(300); await B.click('#pcWho'); await B.wait_for_timeout(200)
        async with B.expect_navigation(wait_until='domcontentloaded',timeout=120000): await B.click('#whoNew')
        await ready(B); await B.fill('#wName','Ben'); await B.click('#wSkip')
        for _ in range(40):
            if len(players(uid))==2: break
            await B.wait_for_timeout(500)
        check(len(players(uid))==2,'zweiter Spieler im Konto: %d'%len(players(uid)))

        # ---------- Gerät A: beim Start Ben dazu ----------
        await A.reload(wait_until='domcontentloaded'); await ready(A); await A.wait_for_timeout(1500)
        reg=await A.evaluate("JSON.parse(localStorage.getItem('pgt_players')||'[]').map(x=>x.name)")
        check(sorted(reg)==['Ben','Mia'],'Gerät A kennt jetzt Ben und Mia: %s'%reg)

        # ---------- Gerät C: Link ohne offene Anfrage, dann Einfügen ----------
        await A.click('#cardBtn'); await A.wait_for_timeout(200); await A.click('#pcSave'); await A.wait_for_timeout(300)
        ctxC=await b.new_context(viewport={'width':390,'height':664}); C=await page(ctxC)
        await B.evaluate("localStorage.removeItem('pgt_acct_pend')")
        # Anfrage von C, Link wird auf einem fremden Gerät (D) geöffnet → D fragt nach der E-Mail
        await C.goto(base,wait_until='domcontentloaded',timeout=120000); await ready(C)
        await C.evaluate("openAcct()"); await C.fill('#acMail','eltern@example.org'); await C.check('#acOk'); await C.click('#acSend'); await C.wait_for_timeout(400)
        em,code,cont=fb.mails[-1]
        ctxD=await b.new_context(viewport={'width':390,'height':664}); D=await page(ctxD)
        await open_link(D,code,cont)
        check(await D.is_visible('#acct .apane[data-p="confirm"]'),'fremdes Gerät fragt nach der E-Mail')
        await D.screenshot(path=f'{OUT}/acc_6_confirm.png')
        await D.fill('#acMail2','eltern@example.org'); await D.click('#acFin'); await D.wait_for_timeout(300)
        check(await D.is_visible('#acct .apane[data-p="confirm"]') and 'Häkchen' in await D.inner_text('#acMsg'),'ohne Häkchen keine Anmeldung')
        await D.check('#acOk2'); await D.click('#acFin'); await D.wait_for_timeout(1500)
        check(await D.is_visible('#acct .apane[data-p="in"]'),'fremdes Gerät angemeldet')
        # C fügt einen neuen Link ein
        await C.click('#acAgain'); await C.wait_for_timeout(400); em,code,cont=fb.mails[-1]
        link=f'https://test.firebaseapp.com/__/auth/action?apiKey=k&mode=signIn&oobCode={code}&continueUrl={cont}&lang=de'
        await C.fill('#acPaste','Hallo '+link); await C.click('#acGo'); await C.wait_for_timeout(1500)
        check(await C.is_visible('#acct .apane[data-p="in"]'),'eingefügter Link meldet an')
        check(await C.evaluate("JSON.parse(localStorage.getItem('pgt_players')||'[]').length")==2,'Gerät C hat beide Spieler')
        await C.click('#acClose'); await C.wait_for_timeout(400)
        check(await C.is_visible('#who'),'mehrere Spieler geladen → „Wer spielt?“')
        await C.screenshot(path=f'{OUT}/acc_7_who_after.png')

        # ---------- Spieler entfernen (Gerät B, Ben) ----------
        await B.click('#cardBtn'); await B.wait_for_timeout(300)
        await B.evaluate("document.querySelector('#pcard .lvb[data-t=\"edit\"]')?.click()")
        await B.evaluate("document.getElementById('pcDel').click()"); await B.wait_for_timeout(100)
        async with B.expect_navigation(wait_until='domcontentloaded',timeout=120000): await B.evaluate("document.getElementById('pcDel').click()")
        await ready(B)
        check(len(players(uid))==1,'Ben auch im Konto entfernt')
        await A.reload(wait_until='domcontentloaded'); await ready(A); await A.wait_for_timeout(1500)
        reg=await A.evaluate("JSON.parse(localStorage.getItem('pgt_players')||'[]').map(x=>x.name)")
        check(reg==['Mia'],'Gerät A entfernt Ben ebenfalls: %s'%reg)

        # ---------- Konto löschen (Gerät B) ----------
        await B.evaluate("openAcct()"); await B.wait_for_timeout(800)
        await B.click('#acDel'); await B.wait_for_timeout(100); await B.click('#acDel'); await B.wait_for_timeout(2500)
        check(await B.is_visible('#acct .apane[data-p="out"]') and 'gelöscht' in await B.inner_text('#acMsg'),'Konto gelöscht: '+await B.inner_text('#acMsg'))
        check(not any(k.startswith('accounts/') for k in fb.docs),'keine Konto-Daten mehr in Firestore')
        check(not any(v.get('uid') for v in scores().values()),'Ranglisten-Einträge des Kontos gelöscht')
        check('eltern@example.org' not in fb.users,'Anmeldung gelöscht')
        check(await B.evaluate("JSON.parse(localStorage.getItem('pgt_players')||'[]').length")>=1,'Spieler bleiben auf dem Gerät')
        await B.screenshot(path=f'{OUT}/acc_8_deleted.png')
        # Gerät A: Token ungültig → abgemeldet, Spieler bleiben
        await A.evaluate("ACC.exp=0;localStorage.setItem('pgt_acct',JSON.stringify(ACC))")
        await A.reload(wait_until='domcontentloaded'); await ready(A); await A.wait_for_timeout(1500)
        check(await A.evaluate("!localStorage.getItem('pgt_acct')"),'Gerät A danach abgemeldet')
        check('MIA' in (await A.inner_text('#psName')).upper(),'Gerät A behält Mia')
        # Mädchen-Version der Texte
        await A.evaluate("setGirl(true);openAcct()"); await A.wait_for_timeout(300)
        await A.screenshot(path=f'{OUT}/acc_9_girl.png')
        check(not errs,'keine JS-Fehler: %s'%errs[:3])
        await b.close()
    print('Firebase-Aufrufe:',len(fb.log),'· Fehler:',check.fail)
    sys.exit(1 if check.fail else 0)
asyncio.run(main())
