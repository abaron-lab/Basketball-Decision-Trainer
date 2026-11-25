"""Prüft Trikotnummern und vertonte Rückfragen aller erzeugten Spielzugvarianten.

python tools/scenarios_test.py --three /pfad/zu/three.min.js --chrome /usr/bin/chromium
"""
import argparse
import functools
import http.server
import threading

from playwright.sync_api import sync_playwright
from smoke_test import Quiet, ROOT


# Im selben Gültigkeitsbereich wie die Builder testen. Nur das 3D-Modell wird
# durch eine leere Gruppe ersetzt, da dieser Test viele Aufstellungen erzeugt.
CHECK = """
window.checkScenarios = () => {
    makeRig = () => ({root: new T3.Group(), cur: {}});
    const clips = new Set();
    let count = 0;
    for (const num of [0, 1, 7, 11, 99]) {
        PROFILE.num = num;
        for (const mode of [4, 5]) for (const level of [1, 2, 3]) {
            Object.assign(G, {mode, level});
            for (const [play, spec] of Object.entries(PLAYS)) {
                for (const variant of new Set(spec.vars(mode, level))) {
                    const sc = buildScenario(1, play, variant);
                    G.sc = sc;
                    G.snap = players.map(p => ({...p, z: p.path.at(-1)[2]}));
                    const fail = reason => { throw Error([play, variant, mode, level, num, reason].join(' / ')); };
                    if (role('H').num !== num) fail('Wunschnummer');
                    for (const team of ['off', 'def']) {
                        const nums = players.filter(p => p.team === team).map(p => p.num);
                        if (new Set(nums).size !== nums.length) fail('Doppelte Nummer');
                    }
                    const q = quizOf(sc);
                    if (!q || !G.snap.some(p => p.role === q.r && (miniFar() || p.z >= -10.8))) {
                        fail('Quiz-Ziel fehlt auf der Karte');
                    }
                    for (const girl of [false, true]) {
                        GIRL = girl;
                        for (const text of [q.t, sc.rule]) {
                            const id = vFile(text);
                            if (!id) fail('Keine Sprachzuordnung für ' + text);
                            clips.add(id);
                        }
                    }
                    count++;
                }
            }
        }
    }
    return {count, clips: [...clips]};
};
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--three', required=True)
    parser.add_argument('--chrome')
    args = parser.parse_args()
    html = (ROOT / 'index.html').read_text()
    hook = 'window.__G=G;'
    assert html.count(hook) == 1
    handler = functools.partial(Quiet, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as server, sync_playwright() as pw:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        browser = pw.chromium.launch(executable_path=args.chrome, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        page = browser.new_page()
        page.route('**/index.html*', lambda r: r.fulfill(body=html.replace(hook, CHECK + hook), content_type='text/html'))
        page.route('**/three.min.js', lambda r: r.fulfill(path=args.three, content_type='application/javascript'))
        page.route('**/config.js', lambda r: r.abort())
        page.route('**/examples/jsm/**', lambda r: r.abort())
        page.goto(f'http://127.0.0.1:{server.server_port}/index.html?lite&rig=alt')
        result = page.evaluate('checkScenarios()')
        for clip in result['clips']:
            assert (ROOT / 'voice' / f'{clip}.mp3').is_file(), clip
        print(result['count'], 'Aufstellungen geprüft')
        browser.close()
        server.shutdown()


if __name__ == '__main__':
    main()
