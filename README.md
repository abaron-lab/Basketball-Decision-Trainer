# 🏀 Basketball IQ Trainer

Ein Browser-Spiel für Kinder und Jugendliche im Verein (Minibasketball U10/U12 und U14), mit dem sie Spielentscheidungen üben:
**Zum Korb, passen, werfen, ohne Ball richtig laufen oder richtig verteidigen?**

Die Inhalte orientieren sich an den DBB-Miniregeln, dem DBB-Leitfaden Minibasketball, der DBB-Spielkonzeption und den DBB-Kriterien zur Mann-Mann-Verteidigung. **Für Trainer und Eltern:** [docs/TRAINER.md](docs/TRAINER.md) (Lernziele, Quellen, Trainer-Werkzeuge).

Man schaut dem eigenen Spieler in 3D über die Schulter. An der entscheidenden Stelle friert das Bild ein, und man hat ein paar Sekunden Zeit. Danach erklärt das Spiel mit einer Skizze von oben, was die beste Lösung war und warum. Am Ende kann man sich mit Namen in die Rangliste eintragen.

## Spielen

`index.html` über einen Webserver öffnen (z. B. GitHub Pages). Es gibt keinen Build-Schritt. Aus dem Netz kommt nur three.js (jsDelivr), die Schriften liegen in `fonts/`.

Der Testlink mit `?kickout=vergleich` öffnet zwei spielbare Fassungen desselben Angriffs. Beim Entscheidungsstopp startet **Vorher ansehen** oder **Nachher ansehen** denselben Angriff in der anderen Fassung. Beide starten im 4-gegen-4 mit identischer Aufstellung, zuerst mit freiem Weg zum Korb und dann mit Hilfe vom linken Flügel. Die Vergleichsrunden zählen nicht zur Spielerstatistik.

## Inhalte

**Position** (vor dem Spiel wählbar)

| Position | Spielzüge | Was man lernt |
|---|---|---|
| ① Aufbau (Point Guard) | Aufbau über die Mitte · Schnellangriff 3 gegen 2 · Angriff über den Flügel · Pass und geh · Backdoor-Cut · Durchbruch & Kick-out · Ballgewinn: langer Pass? · Ball umkehren | Hilfe erkennen und den freien Mitspieler finden, Korbleger bei freier Bahn, Wurf bei viel Platz, nach dem Pass schneiden oder Platz machen, den Ball auf die freie Seite oder in die Lücke spielen |
| ③ Flügel | Pass auf den Flügel · Ohne Ball: Backdoor? · Schnellangriff als Läufer · Extra-Pass · Einer gegen zwei · Durchbruch vom Flügel | Nach dem Fangen werfen, ziehen oder weiterpassen; ohne Ball backdoor schneiden oder den Ball fordern; Überzahl nutzen |
| ⑤ Center | Ball am Brett · Ball an der Freiwurflinie · Aufbau zieht zum Korb · Rim Run · Rebound & langer Pass · Flash-Cut | Zur Mitte drehen und die Hilfe lesen; Backdoor-Pass von der Freiwurflinie; ohne Ball zum Korb laufen oder Platz lassen; im Schnellangriff zum Korb sprinten; zum Ball laufen, wenn dort Platz ist |
| Ⓥ Abwehr | Gegenspieler mit Ball · Ein Pass entfernt · Zwei Pässe entfernt · Aushelfen · Zurück zum Gegenspieler · Mitgehen beim Pass · Zurück in die Abwehr | Mann-Mann-Verteidigung: die richtige Position antippen, bei jedem Pass mitgehen, nach Ballverlust erst den Korb sichern |

Alles bewusst **ohne Blöcke/Screens** und ohne Doppeln (DBB-Miniregeln). Jeder Spielzug hat mehrere Varianten (wer hilft, wo steht der Verteidiger), Seite und Positionen sind zufällig.

**Altersklasse:** U10 und U12 spielen auf 2,60 m, U14 auf 3,05 m. Die Auswahl wird im Spielerprofil gespeichert und gilt unabhängig von der Spielform.

**Spielform:** 4 gegen 4 (Miniregeln U10/U12) oder 5 gegen 5 (leistungsorientierte U12 und U14, zusätzlich ein Spieler in der Ecke).

**Lernziele:** Jede Situation gehört zu einer der sieben taktischen Grundfertigkeiten aus dem DBB-Leitfaden Minibasketball (Lücke erkennen, Gegenspieler umspielen, Überzahl nutzen, In den Lauf passen, Zusammenspiel, Anbieten und Orientieren, Ins Ziel treffen, im Spiel als Wurfauswahl „Guter Wurf“) oder zur „Mann-Mann-Verteidigung“. Die Spielerkarte zeigt den Stand je Lernziel. Inhalte aus dem FIBA Coaching Manual Mini-Basketball: Flash-Cut, Ball umkehren, beim Pass mitgehen, im Umschalten erst Korb, dann Ball.

**Erst fragen, dann erklären:** Nach einer falschen Entscheidung stellt das Spiel eine Frage („Wer hat ausgeholfen?“, „Wo stand dein Verteidiger?“). Das Kind tippt auf der Skizze auf den Spieler, danach kommt die Erklärung.

**Für Trainer** (Klemmbrett-Symbol im Menü): Trainingsthemen über alle Positionen, Aufgaben-Links für die Team-Gruppe (`?aufgabe=…`), eine Team-Ansicht je Lernziel und eine Info-Seite mit Quellen.

**Schwierigkeit:** Anfänger (4 s), Mittel (2,5 s, angetäuschte Hilfe), Profi (1,8 s, viele Täuschungen). Dazu gibt es einen Lernmodus ohne Zeitlimit.

**Spielerkarte:** Über die Leiste mit Trikot, Name und Level oben im Menü. Dort stellt man Namen, Trikotnummer, Hautfarbe und Frisur ein (so sieht dann auch der eigene Spieler im Spiel aus). Die Karte zeigt Werte wie Lesen, Tempo und Pass, das Level (Rookie bis Legende, mit XP aus jedem Spiel) und 12 Abzeichen zum Freischalten, z. B. „Heiße Hand“ (5 richtige in Folge) oder „Allrounder“ (alle Positionen gespielt). Alles wird nur auf dem Gerät gespeichert.

**Mädchen-Version:** Beim ersten Start (und später in der Spielerkarte unter „Anpassen“) wählt man „Mädchen“ oder „Jungen“. In der Mädchen-Version sind alle Figuren Mädchen (Mitspielerinnen und Gegnerinnen, mit Zopf, Flechtzopf, Zöpfen, offenen Haaren oder Dutt), und alle Texte sprechen von Mitspielerin, Verteidigerin, Gegenspielerin usw. Spielzüge, Regeln und Altersstufen sind gleich, denn die DBB-Miniregeln gelten für Mädchen und Jungen. Die eigene Frisur ist frei wählbar. Trainer können im Aufgaben-Link „Mädchen“ vorwählen (`&g=w`), dann ist das bei neuen Spielerinnen schon eingestellt.

**Bedienung:** Für einen Pass tippt man direkt auf das lila Schild über dem Mitspieler (am Computer auch Tasten 1–5). Unten sind nur noch zwei Tasten: blau „Zum Korb“ bzw. „Backdoor-Cut“, orange „Werfen“ bzw. „Ball fordern“.
Tastatur: `1`–`4` Pass, `↑` blaue Taste, `Leertaste` orange Taste, `Enter` weiter. Bei Rückfragen auf der Taktiktafel mit den Pfeiltasten einen Spieler markieren und mit `Enter` bestätigen.

## Auf GitHub Pages veröffentlichen

1. Die Änderungen auf den Branch `main` bringen (Pull Request mergen).
2. Auf GitHub im Repository: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“**, Branch `main`, Ordner `/ (root)`, **Save**.
3. Nach ein bis zwei Minuten läuft das Spiel unter `https://<dein-github-name>.github.io/Basketball-Decision-Trainer/`.


### Impressum und Datenschutz
Bevor die Seite öffentlich genutzt wird, in `impressum.html` und `datenschutz.html` die rot markierten Platzhalter ausfüllen:
- Name, ladungsfähige Anschrift und E-Mail (bei einem Verein: Vereinsname, Vorstand, Registergericht und -nummer),
- Speicherort der Firestore-Datenbank (Firebase-Konsole → Firestore → Standort),
- die zuständige Landesdatenschutzbehörde,
- optional eine feste Löschfrist für Ranglisten-Einträge (z. B. Saisonende).

In der Firebase-Konsole (Projekteinstellungen) prüfen, ob den „Firebase Data Processing and Security Terms“ zugestimmt ist; darauf verweist die Datenschutzerklärung. Die Seiten sind sorgfältig erstellt, ersetzen aber keine Rechtsberatung.

### Als App auf dem Handy
Über **App installieren** im Hauptmenü lässt sich das Spiel auf den Startbildschirm legen. Beim Start über das App-Symbol öffnet es sich ohne Browserleiste.

- **iPhone (Safari)** zeigt die Schritte zum manuellen Hinzufügen an. [Apple-Anleitung für iOS 27](https://support.apple.com/de-ch/guide/iphone/iphea86e5236/27/ios/27)
- **Android (Chrome)** öffnet den Installationsdialog, sobald Chrome ihn anbietet. Alternativ zeigt der Knopf die Schritte über das Chrome-Menü an. [Chrome-Hilfe für Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=de)

Nach dem ersten Öffnen funktioniert es auch ohne Internet (die Online-Rangliste natürlich nicht).

Tipp für Eltern: Als App auf dem Startbildschirm bleibt der Spieler auch nach längeren Pausen gespeichert. Safari löscht sonst die Daten von Webseiten, die etwa eine Woche nicht geöffnet wurden.

### Spieler behalten und mitnehmen
Der Spieler (Name, Trikot, Aussehen, Level, Abzeichen, Statistik) wird nur auf dem Gerät gespeichert, ohne Anmeldung und ohne Server.
- **Mehrere Kinder auf einem Gerät:** Spielerkarte → **Spieler** → „Neuer Spieler“. Gibt es mehrere Spieler, fragt das Spiel beim Start „Wer spielt?“.
- **Auf ein anderes Gerät mitnehmen oder sichern:** Spielerkarte → **Sichern**. Das zeigt einen Spieler-Link und einen QR-Code. Den Link z. B. per Messenger an sich selbst oder die Eltern schicken oder den Code mit dem anderen Gerät scannen. Beim Öffnen fragt das Spiel „Dein Spieler ist da!“ und übernimmt ihn. Der Link enthält den Stand von dem Moment, in dem er erstellt wurde; nach einigen Spielen erinnert die Auswertung ans Neu-Sichern. Rekorde je Einstellung bleiben auf dem alten Gerät.
- Auf der Willkommens-Karte gibt es „Ich habe schon einen Spieler“, dort kann man einen Link einfügen.

## Rangliste

Nach jedem Spiel kann man seinen Namen eintragen. Es gibt eine Liste pro Position (inkl. Abwehr und Trainingsthema), Spielform (4 gegen 4 / 5 gegen 5) und Schwierigkeit. Pro Name zählt das beste Ergebnis. Im Menü zeigt „🏆 Rangliste“ alle Listen.

**Ohne Einrichtung** werden die Einträge nur auf dem jeweiligen Gerät gespeichert (gut für ein gemeinsames Tablet im Training).

**Damit das ganze Team auf verschiedenen Handys eine gemeinsame Liste hat**, braucht es einen kleinen, kostenlosen Online-Speicher. GitHub Pages kann selbst nichts speichern. Wir nutzen dafür Firebase Firestore (kostenloser Spark-Tarif, reicht für einen Verein locker):

1. Auf <https://console.firebase.google.com> mit einem Google-Konto anmelden und **Projekt hinzufügen** (Name z. B. `basketball-iq`, Google Analytics kann aus bleiben).
2. Links **Build → Firestore Database → Datenbank erstellen**, Standort `europe-west3` (Frankfurt), **Produktionsmodus**.
3. In Firestore auf den Reiter **Regeln** gehen, den Inhalt von [`firestore.rules`](firestore.rules) hineinkopieren und **Veröffentlichen**. (Nach einem Update der Regeln im Repository diesen Schritt wiederholen. Aktuell neu: Lernziele `lz` und die Positionen `def`/`mix` für die Team-Ansicht.)
4. **Projekteinstellungen** (Zahnrad) → **Allgemein** → unten „Meine Apps“ → Web-App (`</>`) hinzufügen. Dort stehen `apiKey` und `projectId`.
5. Die Datei [`config.js`](config.js) auf github.com öffnen, auf das Stift-Symbol tippen, bei `projectId` und `apiKey` die beiden Werte eintragen und **Commit changes** drücken (auf `main`). `index.html` muss dafür nicht angefasst werden. Ohne `config.js` oder mit leeren Werten wird nur auf dem Gerät gespeichert.

Der Firebase-`apiKey` ist kein Geheimnis, er darf im Code stehen. Wer möchte, kann ihn in der Google Cloud Console auf die eigene GitHub-Pages-Adresse beschränken.

**Mehrere Teams:** Hängt man `?team=name` an den Link (z. B. `…/Basketball-Decision-Trainer/?team=u12-tigers`), bekommt dieses Team eine eigene Rangliste. Ohne Angabe heißt das Team `team`. Diesen Link einfach in die Team-Gruppe schicken.

**Einträge löschen** (z. B. Quatsch-Namen): in der Firebase-Konsole unter Firestore → `teams` → Teamname → `scores`.

Hinweis: Die Punkte werden im Browser berechnet. Wer sich mit Programmieren auskennt, könnte schummeln. Für eine Vereinsrangliste unter Kindern ist das in Ordnung. Bei Verbindungsproblemen wird der Eintrag auf dem Gerät gemerkt und später nachgeschickt.

## Dateien

- `index.html`: das Spiel (three.js), dazu `css/app.css` und die Skripte in `js/` (Aufteilung siehe `CLAUDE.md`)
- `config.js`: Zugangsdaten für die Online-Rangliste (Firebase `projectId` und `apiKey`)
- `firestore.rules`: Sicherheitsregeln für die Online-Rangliste
- `docs/TRAINER.md`: Hinweise für Trainer und Eltern, Lernziele und Quellen
- `legacy/2d-version.html`: frühere 2D-Version (Canvas), nur Aufbau über die Mitte
- `sfx/`: Geräusche (Dribbeln, Abwurf, Fangen, Schuhquietschen, Schritte, Netz, Ring, Jubel, Überraschung und Tape-Stop), erstellt mit der Sound-Effects-KI von [ElevenLabs](https://elevenlabs.io/) und gekürzt. Im Free Plan von ElevenLabs ist die Namensnennung Pflicht (steht in `lizenzen.html` und auf der Info-Seite im Spiel) und die kommerzielle Nutzung eingeschränkt; vor einer kommerziellen Nutzung die Sounds mit einem bezahlten Plan neu erzeugen oder ersetzen. Die Hallenkulisse während des Spielzugs besteht aus synthetischem Publikumsgemurmel. Fehlen die Dateien, spielt das Spiel eigene synthetische Töne.
- `tools/make_sfx.mjs`, `tools/trim_sfx.sh`: Geräusche neu erzeugen (ElevenLabs-API-Key nötig, nicht ins Repository) und mit ffmpeg kürzen
- `tools/smoke_test.py`: automatischer Test mit Playwright, der Spielzüge durchspielt, Screenshots macht und sich in die Rangliste einträgt

Schwache Geräte: Läuft das Spiel ruckelig, schaltet es nach ein paar Sekunden automatisch Schatten und Auflösung herunter. Mit `?lite` am Link startet es gleich in der leichten Grafik.
