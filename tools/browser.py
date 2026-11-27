"""Gemeinsame Chromium-Einstellungen für die Tests.

Standard: SwiftShader (3D-Grafik auf der CPU, läuft überall, auch ohne Grafikkarte und in der Cloud, aber 1–2 Minuten pro Runde).
Mit --gpu (oder GPU=1): echte Grafikkarte (Mac: Metal, sonst ANGLE-Standard) im neuen Headless-Modus von Chromium, viel schneller.
Die Bildschirmfotos können sich dann in Kleinigkeiten unterscheiden; für Leistungsmessungen gilt weiter CLAUDE.md (echtes Fenster).
"""
import os, sys
GPU = '--gpu' in sys.argv or os.environ.get('GPU') == '1'
if '--gpu' in sys.argv: sys.argv.remove('--gpu')  # vor argparse bzw. sys.argv[1] entfernen

def launch_kw(chrome=None):
    if GPU:
        angle = 'metal' if sys.platform == 'darwin' else 'default'
        # channel='chromium' = neuer Headless-Modus; die schlanke headless-shell hat keine GPU
        kw = {'args': ['--no-sandbox', f'--use-angle={angle}', '--enable-gpu', '--ignore-gpu-blocklist']}
        if not chrome: kw['channel'] = 'chromium'
    else:
        kw = {'args': ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']}
    if chrome: kw['executable_path'] = chrome
    print('Grafik:', 'GPU' if GPU else 'SwiftShader (CPU)', flush=True)
    return kw
