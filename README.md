# 🏀 Basketball IQ Trainer

Ein Browser-Spiel für Kinder und Jugendliche im Verein (U10/U12, etwa 10–14 Jahre), mit dem sie Spielentscheidungen üben:
**Zum Korb, passen, werfen oder ohne Ball richtig laufen?**

Man schaut dem eigenen Spieler in 3D über die Schulter. An der entscheidenden Stelle friert das Bild ein, und man hat ein paar Sekunden Zeit. Danach erklärt das Spiel mit einer Skizze von oben, was die beste Lösung war und warum. Am Ende kann man sich mit Namen in die Rangliste eintragen.

## Spielen

`index.html` im Browser öffnen. Es gibt keinen Build-Schritt. Die Datei lädt nur three.js und Google Fonts aus dem Netz.

## Inhalte

**Position** (vor dem Spiel wählbar)

| Position | Spielzüge | Was man lernt |
|---|---|---|
| 🎯 Aufbau (Point Guard) | Aufbau über die Mitte · Schnellangriff 3 gegen 2 · Angriff über den Flügel · Backdoor-Cut | Hilfe erkennen und den freien Mitspieler finden, Korbleger bei freier Bahn, Wurf bei viel Platz |
| 🏹 Flügel | Pass auf den Flügel · Ohne Ball: Backdoor? · Schnellangriff als Läufer | Nach dem Fangen werfen, ziehen oder weiterpassen; ohne Ball backdoor schneiden oder den Ball fordern |
| 💪 Center | Ball am Brett · Ball an der Freiwurflinie · Aufbau zieht zum Korb | Allein: drehen und Korbleger; Doppeln: rauspassen; Backdoor-Pass von der Freiwurflinie; ohne Ball zum Korb laufen oder Platz lassen |

Alles bewusst **ohne Blöcke/Screens**. Jeder Spielzug hat mehrere Varianten (wer hilft, wo steht der Verteidiger), Seite und Positionen sind zufällig.

**Spielmodus:** U10 · 4 gegen 4 oder U12 · 5 gegen 5 (zusätzlich ein Spieler in der Ecke).

**Schwierigkeit:** Anfänger (4 s), Mittel (2,5 s, angetäuschte Hilfe), Profi (1,8 s, viele Täuschungen). Dazu gibt es einen Lernmodus ohne Zeitlimit.

**Bedienung:** Alle Tasten sind unten am Bildschirm: lila Pass-Tasten (die gleiche Nummer steht über dem Mitspieler), blau „Zum Korb“ bzw. „Backdoor-Cut“, orange „Werfen“ bzw. „Ball fordern“.
Tastatur: `1`–`4` Pass, `↑` blaue Taste, `Leertaste` orange Taste, `Enter` weiter.

## Auf GitHub Pages veröffentlichen

1. Die Änderungen auf den Branch `main` bringen (Pull Request mergen).
2. Auf GitHub im Repository: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“**, Branch `main`, Ordner `/ (root)`, **Save**.
3. Nach ein bis zwei Minuten läuft das Spiel unter `https://<dein-github-name>.github.io/Basketball-Decision-Trainer/`.

## Rangliste

Nach jedem Spiel kann man seinen Namen eintragen. Es gibt eine Liste pro Position, Spielmodus (U10/U12) und Schwierigkeit. Pro Name zählt das beste Ergebnis. Im Menü zeigt „🏆 Rangliste“ alle Listen.

**Ohne Einrichtung** werden die Einträge nur auf dem jeweiligen Gerät gespeichert (gut für ein gemeinsames Tablet im Training).

**Damit das ganze Team auf verschiedenen Handys eine gemeinsame Liste hat**, braucht es einen kleinen, kostenlosen Online-Speicher. GitHub Pages kann selbst nichts speichern. Wir nutzen dafür Firebase Firestore (kostenloser Spark-Tarif, reicht für einen Verein locker):

1. Auf <https://console.firebase.google.com> mit einem Google-Konto anmelden und **Projekt hinzufügen** (Name z. B. `basketball-iq`, Google Analytics kann aus bleiben).
2. Links **Build → Firestore Database → Datenbank erstellen**, Standort `europe-west3` (Frankfurt), **Produktionsmodus**.
3. In Firestore auf den Reiter **Regeln** gehen, den Inhalt von [`firestore.rules`](firestore.rules) hineinkopieren und **Veröffentlichen**.
4. **Projekteinstellungen** (Zahnrad) → **Allgemein** → unten „Meine Apps“ → Web-App (`</>`) hinzufügen. Dort stehen `apiKey` und `projectId`.
5. In `index.html` die Zeile `const ONLINE={projectId:'',apiKey:''};` suchen und beide Werte eintragen, z. B. `const ONLINE={projectId:'basketball-iq',apiKey:'AIza…'};`. Speichern und auf `main` committen.

Der Firebase-`apiKey` ist kein Geheimnis, er darf im Code stehen. Wer möchte, kann ihn in der Google Cloud Console auf die eigene GitHub-Pages-Adresse beschränken.

**Mehrere Teams:** Hängt man `?team=name` an den Link (z. B. `…/Basketball-Decision-Trainer/?team=u12-tigers`), bekommt dieses Team eine eigene Rangliste. Ohne Angabe heißt das Team `team`. Diesen Link einfach in die Team-Gruppe schicken.

**Einträge löschen** (z. B. Quatsch-Namen): in der Firebase-Konsole unter Firestore → `teams` → Teamname → `scores`.

Hinweis: Die Punkte werden im Browser berechnet. Wer sich mit Programmieren auskennt, könnte schummeln. Für eine Vereinsrangliste unter Kindern ist das in Ordnung. Bei Verbindungsproblemen wird der Eintrag auf dem Gerät gemerkt und später nachgeschickt.

## Dateien

- `index.html`: das Spiel (three.js)
- `firestore.rules`: Sicherheitsregeln für die Online-Rangliste
- `legacy/2d-version.html`: frühere 2D-Version (Canvas), nur Aufbau über die Mitte
- `tools/smoke_test.py`: automatischer Test mit Playwright, der Spielzüge durchspielt, Screenshots macht und sich in die Rangliste einträgt

Schwache Geräte: Läuft das Spiel ruckelig, schaltet es nach ein paar Sekunden automatisch Schatten und Auflösung herunter. Mit `?lite` am Link startet es gleich in der leichten Grafik.
