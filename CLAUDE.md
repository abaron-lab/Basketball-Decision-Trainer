# CLAUDE.md

Hinweise für die Arbeit an diesem Repository.

## Projekt
Entscheidungstrainer für junge Point Guards (U10/U12). Die Zielgruppe sind Kinder und ihre Trainer bzw. Eltern. UI-Texte sind auf **Deutsch**, kurz und kindgerecht. Keine taktisch komplizierten Inhalte: **keine Screens/Blöcke**. Erlaubt sind einfache Reads (Hilfe → freier Mitspieler, Schnellangriff, Backdoor, Wurf bei viel Platz).

## Aufbau
- Alles steckt in einer Datei: `index.html` (HTML + CSS + JS). Kein Build, keine Abhängigkeiten außer three.js `0.149.0` (jsDelivr, globale `THREE`-Variable) und Google Fonts.
- Die Seite wird auch als claude.ai-Artifact veröffentlicht. Dort sind nur Skripte von cdn.jsdelivr.net/npm, cdnjs, unpkg u. a. erlaubt, kein fetch zu anderen Hosts, und localStorage nur mit try/catch.

### Koordinaten
- Spiellogik in **Weltkoordinaten** (Meter): `x` nach rechts, `z` Richtung Korb, Korb bei `(0,0)`, Grundlinie bei `z=+1.575`, Mittellinie bei `z=-12.425`.
- three.js-Position = `(x, y, -z)` → Helfer `V(x,y,z)`.

### Wichtige Teile in `index.html`
- `PLAYS`: Spielzüge mit Name, Beschreibung, Anlaufzeit `T` je Level, Varianten `vars(mode, level)` und `build`-Funktion.
- `buildTop / buildBreak / buildWing / buildBackdoor`: legen die Spieler mit `addP(role, team, num, {name, finish, sel})` an und geben ihnen Wegpunkte `setPath(p, [[t,x,z],...])`. Sie liefern `{ans, helper, fake, why, rule, ...}`.
  - `ans`: `'drive' | 'shot' | 'pass:ROLE'`
  - `helper`: Rolle des Verteidigers, der aushilft (blockt bei falschem „Zum Korb“)
  - `GUARD[offRole] = Verteidiger`
- `buildScenario(seed, play, variant)`: deterministisch über einen Seed (für „Nochmal ansehen“). Berechnet auch `fitPts` für den Kamera-Ausschnitt.
- Ablauf: `startRound → beginApproach → startDecide → resolve(choice) → animateOutcome → showFeedback → showSummary`.
- Kamera: Third-Person hinter dem Ballführer (`updCam`). `computeFit()` passt FOV und View-Offset so an, dass im Entscheidungsmoment alle relevanten Spieler sichtbar sind, auch im Hochformat.
- Spielerfiguren: `makeRig()` (Gelenke als Gruppen), Animation in `poseP()`.
- Pass-Auswahl: DOM-Blasen (`.bub`) über den Mitspielern, positioniert per `project(cam)`.

## Testen
```
npm pack three@0.149.0 && tar xzf three-0.149.0.tgz package/build/three.min.js
python3 tools/smoke_test.py --three package/build/three.min.js --size 390x844 --mode 5 --rounds 4
python3 tools/smoke_test.py --three package/build/three.min.js --size 1280x720 --plays wing
```
Ohne GPU läuft das Rendering sehr langsam. Der Test nutzt deshalb den Lernmodus. Screenshots in `shots/` ansehen, besonders den Entscheidungsmoment: Ist die Situation eindeutig lesbar, und ist nichts verdeckt?

## Offene Punkte
- Angriff über den Flügel noch im Browser prüfen (Lesbarkeit der Hilfe-Varianten, Kamera-Ausschnitt).
- Auf dem Handy sind die Spieler eher klein, weil das ganze Halbfeld auf die Breite passen muss.
- Beim Schnellangriff können nachlaufende Spieler nahe an der Kamera ins Bild kommen.
