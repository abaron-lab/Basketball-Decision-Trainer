# 🏀 Point Guard Trainer

Ein Browser-Spiel für Kinder (U10/U12), mit dem sie Spielentscheidungen als Point Guard üben:
**Zum Korb ziehen, passen oder selbst werfen?**

Man schaut dem eigenen Spieler in 3D über die Schulter. An der entscheidenden Stelle friert das Bild ein, und das Kind hat ein paar Sekunden Zeit zum Entscheiden. Danach erklärt das Spiel mit einer Skizze von oben, was die beste Lösung war und warum.

## Spielen

`index.html` im Browser öffnen. Es gibt keinen Build-Schritt. Die Datei lädt nur three.js und Google Fonts aus dem Netz.

## Inhalte

**Spielmodi**
- U10 · 4 gegen 4 (Aufbau, zwei Flügel, Center)
- U12 · 5 gegen 5 (zusätzlich ein Spieler in der Ecke)

**Spielzüge** (bewusst ohne Blöcke/Screens, passend für U10/U12)

| Spielzug | Mögliche Entscheidungen |
|---|---|
| Aufbau über die Mitte | Zum Korb · Pass zum Flügel links/rechts (Hilfe kommt) · Wurf (Verteidiger weicht zurück) · Pass zum Center · Pass in die Ecke (U12) |
| Schnellangriff 3 gegen 2 | Korbleger (keiner stoppt dich) · Pass zum freien Läufer links/rechts |
| Angriff über den Flügel | Zum Korb · Pass nach oben · Pass zum Center · Pass in die Ecke (U12) · Wurf |
| Backdoor-Cut | Pass in den Lauf des Cutters · Pass zum Center, wenn dessen Verteidiger aushilft (ab Fortgeschritten) |

**Schwierigkeit:** Anfänger (4 s), Fortgeschritten (2,5 s, angetäuschte Hilfe), Profi (1,8 s, viele Täuschungen). Dazu gibt es einen Lernmodus ohne Zeitlimit.

**Bedienung:** Zum Passen auf einen Mitspieler tippen (PASS-Blase). Dazu gibt es die Knöpfe „Zum Korb“ und „Selbst werfen“.
Tastatur: `1`–`4` Pass, `↑` zum Korb, `Leertaste` werfen, `Enter` weiter.

## Dateien

- `index.html`: aktuelle 3D-Version (three.js)
- `legacy/2d-version.html`: frühere 2D-Version (Canvas), nur Aufbau über die Mitte
- `tools/smoke_test.py`: automatischer Test mit Playwright, der Spielzüge durchspielt und Screenshots macht

## Stand

Die 3D-Version ist neu. Getestet sind der Aufbau über die Mitte, der Schnellangriff und der Backdoor-Cut, auf Handy- und Laptop-Format.
Der **Angriff über den Flügel ist noch nicht im Browser geprüft**. Das ist der nächste Schritt.
