# CLAUDE.md

Hinweise für die Arbeit an diesem Repository.

## Projekt
„Basketball IQ Trainer“: Entscheidungstrainer für junge Spieler (U10/U12, 10–14 Jahre) auf den Positionen Aufbau, Flügel und Center. Die Zielgruppe sind Kinder und ihre Trainer bzw. Eltern. UI-Texte sind auf **Deutsch**, kurz und kindgerecht. Keine taktisch komplizierten Inhalte: **keine Screens/Blöcke**. Erlaubt sind einfache Reads (Hilfe → freier Mitspieler, Schnellangriff, Backdoor, Wurf bei viel Platz).

## Aufbau
- Alles steckt in einer Datei: `index.html` (HTML + CSS + JS). Kein Build, keine Abhängigkeiten außer three.js `0.149.0` (jsDelivr, globale `THREE`-Variable) und Google Fonts.
- Gehostet über GitHub Pages (Branch `main`, Root). Die Online-Rangliste nutzt optional Firestore per REST (`ONLINE`-Konstante, Regeln in `firestore.rules`); ohne Konfiguration bzw. ohne Netz wird lokal gespeichert.
- Die Seite wird auch als claude.ai-Artifact veröffentlicht. Dort sind nur Skripte von cdn.jsdelivr.net/npm, cdnjs, unpkg u. a. erlaubt, kein fetch zu anderen Hosts, und localStorage nur mit try/catch.

### Koordinaten
- Spiellogik in **Weltkoordinaten** (Meter): `x` nach rechts, `z` Richtung Korb, Korb bei `(0,0)`, Grundlinie bei `z=+1.575`, Mittellinie bei `z=-12.425`.
- three.js-Position = `(x, y, -z)` → Helfer `V(x,y,z)`.

### Wichtige Teile in `index.html`
- `POS` (Positionen) und `PLAYS`: Spielzüge mit `pos`, Name, Beschreibung, Anlaufzeit `T` je Level, Varianten `vars(mode, level)` und `build`-Funktion. `playsOf(pos)` liefert die Spielzüge einer Position.
- Builder: Aufbau `buildTop / buildBreak / buildWing / buildBackdoor`, Flügel `buildWCatch / buildWCut / buildWBreak`, Center `buildCPost / buildCHigh / buildCDive`. Sie legen die Spieler mit `addP(role, team, num, {name, finish, sel})` an und geben ihnen Wegpunkte `setPath(p, [[t,x,z],...])`. Der eigene Spieler ist immer Rolle `H`, sein Verteidiger `dH`. Sie liefern `{ans, helper, fake, why, rule, ...}`:
  - `ans`: `'drive' | 'shot' | 'pass:ROLE'`
  - `helper`: Rolle des Verteidigers, der aushilft (blockt bei falschem „Zum Korb“)
  - `GUARD[offRole] = Verteidiger`
  - optional: `feed:{from,t0,t1}` (Zuspiel zum eigenen Spieler während des Anlaufs), `ballAt` (wer den Ball hat, wenn der eigene Spieler ohne Ball spielt), `labels:{drive:[icon,text], shot:[icon,text]|null}` (Beschriftung der blauen/orangen Taste, `null` blendet aus), `outcome(choice, ok, finish)` (eigene Animation, z. B. ohne Ball), `notes` (Erklärungen bei falscher Wahl), `camFix:{x,z,dx,dz}` (feste Kamera bei Spielzügen nah am Korb), `camSide` (Kamera links/rechts versetzt, damit kein Verteidiger den eigenen Spieler verdeckt), `prompt`.
- `buildScenario(seed, play, variant)`: deterministisch über einen Seed (für „Nochmal ansehen“). Berechnet auch `fitPts` für den Kamera-Ausschnitt.
- Ablauf: `startRound → beginApproach → startDecide → resolve(choice) → animateOutcome → showFeedback → showSummary`.
- Kamera: Third-Person hinter dem Ballführer (`updCam`). `computeFit()` passt FOV und View-Offset so an, dass im Entscheidungsmoment alle relevanten Spieler sichtbar sind, auch im Hochformat.
- Spielerfiguren: `makeRig()` (Gelenke als Gruppen), Animation in `poseP()`.
- Bedienung: alle Tasten unten (`#passRow` lila Pass-Tasten, `#actRow` blau/orange). Über den Mitspielern stehen nur nicht klickbare Nummern (`.tag`), positioniert per `project(cam)`.
- Rangliste: `saveScore / loadBoard / topList`, lokal in `localStorage` (`pgt_board_<team>`), online in `teams/<team>/scores`. Team über `?team=`.

## Testen
```
npm pack three@0.149.0 && tar xzf three-0.149.0.tgz package/build/three.min.js
python3 tools/smoke_test.py --three package/build/three.min.js --size 390x844 --pos pg --mode 5 --rounds 4
python3 tools/smoke_test.py --three package/build/three.min.js --size 1280x720 --pos wing --plays wcatch,wcut
python3 tools/smoke_test.py --three package/build/three.min.js --size 390x844 --pos center --rounds 3
```
Ohne GPU läuft das Rendering sehr langsam (ca. 1–2 Minuten pro Runde). Der Test nutzt deshalb den Lernmodus und `?lite`. Screenshots in `shots/` ansehen, besonders den Entscheidungsmoment: Ist die Situation eindeutig lesbar, und ist nichts verdeckt?

## Offene Punkte
- Auf dem Handy sind die Spieler eher klein, weil das ganze Halbfeld auf die Breite passen muss.
- Online-Rangliste ist erst aktiv, wenn `ONLINE` in `index.html` mit einem Firebase-Projekt befüllt ist (siehe README).
