"""Test für das Konto mit E-Mail-Link (js/account.js) gegen ein nachgebautes Firebase (Playwright + Chromium, alte Figuren für Tempo).

Aufruf: python3 tools/account_test.py /pfad/zu/three.min.js [ausgabe-ordner]
Chromium: Umgebungsvariable CHROME (sonst Playwrights Standard).
Es wird nichts an das echte Firebase geschickt: config.js zeigt auf ein Testprojekt, Identity Toolkit, Secure Token und
Firestore beantwortet dieser Test selbst (Daten im Speicher, die Konto-Regeln aus firestore.rules vereinfacht nachgebildet).
Prüft: Anmelden auf Gerät A (Link auf demselben Gerät) über die Profil-Taste, Hochladen, automatische Ranglisten-Einträge,
Gerät B lädt die Spieler, Gerät C ohne offene Anfrage (E-Mail bestätigen), Link einfügen, Kindergerät E per Code verbinden
(falscher Code, richtiger Code, Spielen mit dem Konto, Entfernen durch die Eltern), Gerät F über ?koppeln= (QR-Code mit der
Kamera-App), Spieler entfernen, Konto löschen (auch die Geräte), Gerät A ist danach abgemeldet.
"""
import asyncio, sys, os, functools, threading, http.server, pathlib, json, re, itertools, time
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
        s.codes={}; s.users={}; s.anon=set(); s.docs={}; s.n=itertools.count(1); s.log=[]; s.mails=[]
    def tok_uid(s,req):
        a=req.headers.get('authorization','')
        m=re.match(r'Bearer tok-(\w+)-\d+$',a)
        return m.group(1) if m and (m.group(1) in s.users.values() or m.group(1) in s.anon) else None
    def member(s,acct,me):  # Besitzer (E-Mail bestätigt) oder verbundenes Gerät
        return me is not None and (me==acct and me in s.users.values() or f'accounts/{acct}/devices/{me}' in s.docs)
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
            if op=='signUp':  # anonyme Anmeldung (verbundenes Gerät)
                assert j.get('returnSecureToken') and 'email' not in j, j
                uid='a%d'%next(s.n); s.anon.add(uid)
                return 200,{'idToken':'tok-%s-%d'%(uid,next(s.n)),'refreshToken':'rt-'+uid,'localId':uid,'expiresIn':'3600'}
            if op=='delete':
                uid=re.match(r'tok-(\w+)-',j['idToken']).group(1)
                s.users={k:v for k,v in s.users.items() if v!=uid}; s.anon.discard(uid); return 200,{}
        if h=='securetoken.googleapis.com':
            uid=parse_qs(body)['refresh_token'][0][3:]
            if uid not in s.users.values() and uid not in s.anon: return 400,{'error':{'message':'USER_NOT_FOUND'}}
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
            seg=path.split('/'); DENY=(403,{'error':{'message':'PERMISSION_DENIED'}})
            if seg[0]=='pairs':
                if not me: return DENY
                if req.method=='PATCH':
                    f=json.loads(body)['fields']
                    if not re.fullmatch(r'[A-HJKMNP-Z2-9]{8}',seg[1]) or f['acct']['stringValue']!=me or me not in s.users.values() or set(f)!={'acct','exp','mail'}: return DENY
                    if int(f['exp']['integerValue'])>time.time()*1000+1800000: return DENY
                    if path in s.docs: return DENY  # currentDocument.exists=false bzw. kein update
                    assert q.get('currentDocument.exists')==['false'], q
                    s.docs[path]=f; return 200,{'name':PRE+path,'fields':f}
                if req.method=='GET' and len(seg)==1: return DENY  # kein Auflisten
            if seg[0]=='accounts':
                if len(seg)>=4 and seg[2]=='devices':
                    if req.method=='PATCH':
                        f=json.loads(body)['fields']; pr=s.docs.get('pairs/'+f.get('code',{}).get('stringValue',''))
                        if me!=seg[3] or set(f)!={'code','name','ts'} or not pr or pr['acct']['stringValue']!=seg[1] or int(pr['exp']['integerValue'])<=time.time()*1000: return DENY
                        if path in s.docs: return DENY
                    elif not (me==seg[1] and me in s.users.values() or me==seg[3]): return DENY
                elif len(seg)==3 and seg[2]=='devices':
                    if not (me==seg[1] and me in s.users.values()): return DENY
                elif not s.member(seg[1],me) or (len(seg)>=4 and req.method=='PATCH' and not re.fullmatch(r'[a-z0-9]{1,12}',seg[3])): return DENY
                if len(seg)==2 and req.method in('DELETE',) and me!=seg[1]: return DENY
                if len(seg)==2 and req.method=='PATCH' and 'updateMask.fieldPaths' not in q and me!=seg[1]: return DENY
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
                if seg[0]=='accounts' and len(seg)==4 and seg[2]=='players': assert set(f)=={'data','games','ts'} and len(f['data']['stringValue'])<=4000, f
                return 200,{'name':PRE+path,'fields':s.docs[path]}
            if req.method=='DELETE':
                if seg[0]=='teams':
                    d=s.docs.get(path,{})
                    if not me or d.get('uid',{}).get('stringValue')!=me or me not in s.users.values(): return 403,{'error':{'message':'PERMISSION_DENIED'}}
                s.docs.pop(path,None); return 200,{}
            if req.method=='POST' and seg[0]=='teams':
                f=json.loads(body)['fields']
                if 'uid' in f and not s.member(f['uid']['stringValue'],me): return 403,{'error':{'message':'PERMISSION_DENIED'}}
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
        check(await A.is_visible('#acMailBtn') and await A.is_visible('#acScanBtn'),'Profil: E-Mail-Anmeldung und QR-Code scannen')
        await A.screenshot(path=f'{OUT}/acc_0_profile.png')
        await A.click('#acMailBtn'); await A.wait_for_timeout(200)
        await A.screenshot(path=f'{OUT}/acc_1_form.png')
        await A.fill('#acMail','eltern@example.org'); await A.click('#acSend'); await A.wait_for_timeout(300)
        check(await A.is_visible('#acOkRow') and not fb.mails,'ohne Häkchen kein Link')
        await A.check('#acOk'); await A.click('#acSend'); await A.wait_for_timeout(600)
        check(len(fb.mails)==1 and await A.is_visible('#acTo'),'Link verschickt, Hinweis aufs Postfach')
        await A.screenshot(path=f'{OUT}/acc_2_sent.png')
        em,code,cont=fb.mails[-1]
        check('team=tigers' in cont and 'oobCode' not in cont,'Rücksprung behält ?team= '+cont)
        await open_link(A,code,cont)
        check(await A.is_visible('#acct .acdo[data-s="owner"]'),'nach dem Link angemeldet (Profil, Elterngerät)')
        check('oobCode' not in A.url and 'team=tigers' in A.url,'Adresse aufgeräumt: '+A.url)
        uid=fb.users.get('eltern@example.org')
        check(uid and f'accounts/{uid}' in fb.docs and 'consent' in fb.docs[f'accounts/{uid}'],'Konto-Dokument mit Einwilligung')
        pl=players(uid); check(len(pl)==1,'Spieler hochgeladen: %d'%len(pl))
        await A.screenshot(path=f'{OUT}/acc_3_in.png')
        await A.click('#acClose'); await A.wait_for_timeout(300)
        check(await A.evaluate("document.getElementById('profBtn').classList.contains('on')"),'Profil-Taste zeigt den Haken')
        check(not await A.query_selector('#pcSave'),'Spielerkarte ohne Sichern-Taste')
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
        check(await B.is_visible('#acMailBtn'),'„Ich habe schon einen Spieler“ öffnet das Profil')
        await B.screenshot(path=f'{OUT}/acc_5_have.png')
        await B.click('#acMailBtn'); await B.fill('#acMail','Eltern@Example.org'); await B.check('#acOk'); await B.click('#acSend'); await B.wait_for_timeout(500)
        em,code,cont=fb.mails[-1]; await open_link(B,code,cont)
        check(await B.is_visible('#acct .acdo[data-s="owner"]'),'Gerät B angemeldet')
        msg=await B.inner_text('#acMsg'); check('1 Spieler' in msg,'Meldung: '+msg)
        await B.click('#acClose'); await B.wait_for_timeout(500)
        nm=await B.inner_text('#psName'); check('MIA' in nm.upper(),'Gerät B hat Mia: '+nm)
        check(not await B.is_visible('#welcome'),'keine Willkommens-Karte mehr')
        await B.reload(wait_until='domcontentloaded'); await ready(B)
        check('MIA' in (await B.inner_text('#psName')).upper(),'nach Neuladen noch Mia')
        # Gerät B legt einen zweiten Spieler an → im Konto
        await B.click('#cardBtn'); await B.wait_for_timeout(300); await B.click('#pcWho'); await B.wait_for_timeout(200)
        check(await B.is_visible('#acList .wp.sel'),'„Spieler wechseln“ öffnet das Profil mit der Spielerliste')
        async with B.expect_navigation(wait_until='domcontentloaded',timeout=120000): await B.click('#acNew')
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
        ctxC=await b.new_context(viewport={'width':390,'height':664}); C=await page(ctxC)
        await B.evaluate("localStorage.removeItem('pgt_acct_pend')")
        # Anfrage von C, Link wird auf einem fremden Gerät (D) geöffnet → D fragt nach der E-Mail
        await C.goto(base,wait_until='domcontentloaded',timeout=120000); await ready(C)
        await C.evaluate("openAcct('mail')"); await C.fill('#acMail','eltern@example.org'); await C.check('#acOk'); await C.click('#acSend'); await C.wait_for_timeout(400)
        em,code,cont=fb.mails[-1]
        ctxD=await b.new_context(viewport={'width':390,'height':664}); D=await page(ctxD)
        await open_link(D,code,cont)
        check(await D.is_visible('#acct .apane[data-p="confirm"]'),'fremdes Gerät fragt nach der E-Mail')
        await D.screenshot(path=f'{OUT}/acc_6_confirm.png')
        await D.fill('#acMail2','eltern@example.org'); await D.click('#acFin'); await D.wait_for_timeout(300)
        check(await D.is_visible('#acct .apane[data-p="confirm"]') and 'Häkchen' in await D.inner_text('#acMsg'),'ohne Häkchen keine Anmeldung')
        await D.check('#acOk2'); await D.click('#acFin'); await D.wait_for_timeout(1500)
        check(await D.is_visible('#acct .acdo[data-s="owner"]'),'fremdes Gerät angemeldet')
        # C fügt einen neuen Link ein
        await C.click('#acAgain'); await C.wait_for_timeout(400); em,code,cont=fb.mails[-1]
        link=f'https://test.firebaseapp.com/__/auth/action?apiKey=k&mode=signIn&oobCode={code}&continueUrl={cont}&lang=de'
        await C.fill('#acPaste','Hallo '+link); await C.click('#acGo'); await C.wait_for_timeout(1500)
        check(await C.is_visible('#acct .acdo[data-s="owner"]'),'eingefügter Link meldet an')
        check(await C.evaluate("JSON.parse(localStorage.getItem('pgt_players')||'[]').length")==2,'Gerät C hat beide Spieler')
        check(len(await C.query_selector_all('#acList .wp'))==2,'Profil zeigt beide Spieler zum Auswählen')
        await C.screenshot(path=f'{OUT}/acc_7_who_after.png')
        await C.click('#acClose'); await C.wait_for_timeout(300)

        # ---------- Kindergerät E: Eltern (A) zeigen einen Code, E tippt ihn ein ----------
        await A.evaluate("openAcct()"); await A.wait_for_timeout(800)
        await A.click('#acAdd'); await A.wait_for_timeout(1200)
        code=(await A.inner_text('#acPCode')).replace('-','')
        pairs=lambda:[k for k in fb.docs if k.startswith('pairs/')]
        check(re.fullmatch(r'[A-HJKMNP-Z2-9]{8}',code) and pairs()==['pairs/'+code],'Elterngerät zeigt einen Code: '+code)
        check(await A.is_visible('#acQR'),'QR-Code ist zu sehen')
        await A.screenshot(path=f'{OUT}/acc_10_qr.png')
        await A.set_viewport_size({'width':844,'height':390}); await A.wait_for_timeout(300); await A.screenshot(path=f'{OUT}/acc_10_qr_land.png')
        await A.set_viewport_size({'width':390,'height':664}); await A.wait_for_timeout(200)
        ctxE=await b.new_context(viewport={'width':390,'height':664}); E=await page(ctxE)
        await E.goto(base,wait_until='domcontentloaded',timeout=120000); await ready(E)
        await E.fill('#wName','Kai'); await E.click('#wSkip'); await game(E)
        await E.click('#menuBtn'); await E.wait_for_timeout(300)
        await E.click('#profBtn'); await E.wait_for_timeout(300)
        await E.click('#acScanBtn'); await E.wait_for_timeout(1500)
        check(await E.is_visible('#acct .apane[data-p="scan"]') and len(await E.inner_text('#acScanMsg'))>10,'Scanner startet bzw. erklärt: '+await E.inner_text('#acScanMsg'))
        await E.screenshot(path=f'{OUT}/acc_11_scan.png')
        await E.click('#acScanCode'); await E.wait_for_timeout(200)
        nanon=len(fb.anon)
        await E.fill('#acCode','ABCD-EFGH'); await E.click('#acJoin'); await E.wait_for_timeout(1200)
        check('passt nicht' in await E.inner_text('#acMsg') and await E.is_visible('#acCode'),'falscher Code: '+await E.inner_text('#acMsg'))
        check(len(fb.anon)==nanon and await E.evaluate("!localStorage.getItem('pgt_acct')"),'falscher Code: keine Anmeldung übrig')
        await E.fill('#acCode',code[:4].lower()+' '+code[4:].lower()); await E.screenshot(path=f'{OUT}/acc_12_code.png')
        await E.click('#acJoin'); await E.wait_for_timeout(2500)
        check(await E.is_visible('#acct .acdo[data-s="dev"]'),'Kindergerät verbunden')
        check('Verbunden' in await E.inner_text('#acMsg'),'Meldung: '+await E.inner_text('#acMsg'))
        names=sorted(await E.evaluate("JSON.parse(localStorage.getItem('pgt_players')||'[]').map(x=>x.name)"))
        check(names==['Ben','Kai','Mia'],'Kindergerät hat alle Spieler: %s'%names)
        check(len(players(uid))==3,'Kai vom Kindergerät im Konto: %d'%len(players(uid)))
        check(not pairs(),'Code nach dem Verbinden gelöscht')
        await E.screenshot(path=f'{OUT}/acc_13_dev.png')
        for _ in range(12):
            if 'verbunden' in await A.inner_text('#acMsg'): break
            await A.wait_for_timeout(500)
        check(await A.is_visible('#acct .acdo[data-s="owner"]') and 'verbunden' in await A.inner_text('#acMsg'),'Elterngerät meldet das neue Gerät: '+await A.inner_text('#acMsg'))
        await A.wait_for_timeout(800)
        check(len(await A.query_selector_all('#acDevs .devr'))==1,'Elterngerät listet das Gerät')
        await A.screenshot(path=f'{OUT}/acc_14_owner_devs.png')
        # Kindergerät spielt: automatisch gesichert und in der Rangliste (uid des Kontos)
        await E.click('#acClose'); await game(E); await E.wait_for_timeout(2500)
        sc=[v for v in scores().values() if v.get('uid',{}).get('stringValue')==uid and v['name']['stringValue']=='Kai']
        check(len(sc)==1,'Kindergerät trägt mit dem Konto in die Rangliste ein')
        kai=[json.loads(v['data']['stringValue']) for v in players(uid).values() if json.loads(v['data']['stringValue'])['n']=='Kai']
        check(kai and kai[0]['d'][4]==2,'Spielstand vom Kindergerät hochgeladen: %s'%(kai and kai[0]['d'][4]))
        await E.click('#menuBtn'); await E.wait_for_timeout(300)
        # Gerät F: QR-Code mit der Kamera-App gescannt (?koppeln=…)
        await A.click('#acAdd'); await A.wait_for_timeout(1200); code=(await A.inner_text('#acPCode')).replace('-','')
        ctxF=await b.new_context(viewport={'width':390,'height':664}); F=await page(ctxF)
        await F.goto(base+'&koppeln='+code,wait_until='domcontentloaded',timeout=120000); await ready(F); await F.wait_for_timeout(2500)
        check(await F.is_visible('#acct .acdo[data-s="dev"]') and 'koppeln' not in F.url,'?koppeln= verbindet direkt: '+F.url)
        for _ in range(12):
            if len(await A.query_selector_all('#acDevs .devr'))==2: break
            await A.wait_for_timeout(500)
        check(len(await A.query_selector_all('#acDevs .devr'))==2,'Elterngerät listet zwei Geräte')
        # Elterngerät entfernt E → E ist beim nächsten Start nicht mehr verbunden
        devE=await E.evaluate("ACC.dev")
        await A.evaluate("document.querySelector('#acDevs .devr .rbtn').click()"); await A.wait_for_timeout(100)
        await A.evaluate("document.querySelector('#acDevs .devr .rbtn').click()"); await A.wait_for_timeout(800)
        check(f'accounts/{uid}/devices/{devE}' not in fb.docs,'Gerät E entfernt')
        await E.reload(wait_until='domcontentloaded'); await ready(E); await E.wait_for_timeout(1500)
        check(await E.evaluate("!localStorage.getItem('pgt_acct')"),'Gerät E danach nicht mehr verbunden')
        if await E.is_visible('#who'): await E.click('#whoList .wp.sel'); await E.wait_for_timeout(200)
        await E.click('#profBtn'); await E.wait_for_timeout(300)
        check('nicht mehr' in await E.inner_text('#acMsg'),'Gerät E erklärt es: '+await E.inner_text('#acMsg'))
        check(await E.evaluate("JSON.parse(localStorage.getItem('pgt_players')||'[]').length")==3,'Gerät E behält die Spieler')
        # Gerät F trennt sich selbst
        await F.evaluate("openAcct()"); await F.wait_for_timeout(500)
        await F.click('#acLeave'); await F.click('#acLeave'); await F.wait_for_timeout(1200)
        check(await F.is_visible('#acct .acdo[data-s="out"]') and not any('/devices/' in k for k in fb.docs),'Gerät F getrennt, keine Geräte mehr im Konto')
        await A.click('#acClose'); await A.wait_for_timeout(200)

        # ---------- Spieler entfernen (Gerät B, Ben) ----------
        await B.click('#cardBtn'); await B.wait_for_timeout(300)
        await B.evaluate("document.querySelector('#pcard .lvb[data-t=\"edit\"]')?.click()")
        await B.evaluate("document.getElementById('pcDel').click()"); await B.wait_for_timeout(100)
        async with B.expect_navigation(wait_until='domcontentloaded',timeout=120000): await B.evaluate("document.getElementById('pcDel').click()")
        await ready(B)
        check(len(players(uid))==2,'Ben auch im Konto entfernt (Mia und Kai bleiben)')
        await A.reload(wait_until='domcontentloaded'); await ready(A); await A.wait_for_timeout(1500)
        reg=sorted(await A.evaluate("JSON.parse(localStorage.getItem('pgt_players')||'[]').map(x=>x.name)"))
        check(reg==['Kai','Mia'],'Gerät A entfernt Ben ebenfalls: %s'%reg)

        # ---------- Konto löschen (Gerät B) ----------
        await B.evaluate("openAcct()"); await B.wait_for_timeout(800)
        await B.click('#acDel'); await B.wait_for_timeout(100); await B.click('#acDel'); await B.wait_for_timeout(2500)
        check(await B.is_visible('#acct .acdo[data-s="out"]') and 'gelöscht' in await B.inner_text('#acMsg'),'Konto gelöscht: '+await B.inner_text('#acMsg'))
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
