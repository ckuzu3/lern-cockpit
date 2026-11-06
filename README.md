# Lern-Cockpit

Eine Lern-App für Zertifikate und Studienmodule. Statisch, ohne Build-Werkzeuge, offline-fähig,
auf dem iPhone über den Homescreen nutzbar. Inhalte sind reine JSON-Dateien.

## Der Ablauf

1. Im Chat: **„Nächstes Zertifikat: X"** oder **„Ich habe Modul Y begonnen"** (Unterlagen hochladen, falls vorhanden)
2. Claude recherchiert die offiziellen Prüfungsziele, erzeugt `app/kurse/<id>.json` und trägt die Datei in `app/kurse/index.json` ein
3. Claude veröffentlicht die neue Version
4. Auf dem iPhone: App öffnen – der neue Kurs ist da. Kein technischer Schritt nötig.

## Funktionen

- **Übersicht** als Startbildschirm: alle Kurse mit Fortschritt, Fahrplan, Datensicherung
- **Tagesziel**, aus Prüfungstermin und offenem Stoff zurückgerechnet; ohne Termin 20 Karten und 10 Fragen
- **Kurz-Drill**: fünf Minuten, Karten und Fragen gemischt – für Pausen
- **Lernkarten** mit Spaced Repetition (SM-2), Wischen links/rechts, Tastatur 1–4 am Mac
- **Übungsfragen** nach Domain, mit Begründung auch zu den falschen Antworten
- **Prüfungssimulation** mit Timer, Fragen markieren, Fragenübersicht, Auswertung nach Domain
- **Fehlerprotokoll**: falsch beantwortete Fragen kommen zurück
- **Markieren und Notizen** auf jeder Karte und jeder Frage
- **Suche** über Karten, Fragen, Zusammenfassungen und Glossar
- **Schwächster Bereich** und **Verlauf** der letzten 14 Tage auf der Startseite
- **Datensicherung** zum Übertragen des Fortschritts auf ein anderes Gerät
- Hell und dunkel, offline, als App auf dem Homescreen installierbar

## Struktur

```
app/                    das ist der Deploy-Ordner – alles darin wird ausgeliefert
  index.html            Hülle
  app.js                gesamte Logik (Views, SM-2-Wiederholung, Prüfungsmodus)
  style.css             Darstellung, mobil zuerst
  sw.js                 Service Worker: Offline-Cache. VERSION bei jedem Deploy erhöhen
  manifest.webmanifest  macht die Seite installierbar
  kurse/index.json      welche Kurse geladen werden + Fahrplan
  kurse/<id>.json       ein Kurs: Prüfungssteckbrief, Domains, Karten, Fragen, Plan, Glossar
unterlagen -> iCloud    Verweis auf iCloud Drive/Lern-App/Unterlagen – Quelle für neue Kurse,
                        vom Mac und vom iPhone aus befüllbar, wird NICHT veröffentlicht
docs/SCHEMA.md          Aufbau einer Kursdatei
docs/UNTERLAGEN.md      wie Material für neue Kurse hierher kommt
tools/serve.js          lokaler Testserver
tools/build-single.js   baut dist/Lern-Cockpit.html, eine einzige Datei für iCloud
dist/                   Ergebnis des Einzeldatei-Builds
```

## Lokal testen

```
node tools/serve.js 8899
```
Dann http://localhost:8899 öffnen.

## Veröffentlichen

```
bash tools/deploy.sh "Was sich geändert hat"
```

Das Skript zählt die Version im Service Worker hoch (sonst behalten installierte iPhones den
alten Stand), baut die iCloud-Einzeldatei neu, committet und pusht. GitHub Actions prüft danach
alle Kursdateien auf Konsistenz und schiebt den Inhalt von `app/` auf den Branch **gh-pages**,
von dem GitHub Pages ausliefert. Dauer: ein bis zwei Minuten. Schlägt die Prüfung fehl, wird
nichts veröffentlicht.

Einmalige Einrichtung: **Settings → Pages → Source: Deploy from a branch → gh-pages / (root)**.
Der Weg über die Pages-API (`enablement: true`) funktioniert hier nicht, weil der
Workflow-Token Pages in diesem Repository nicht aktivieren darf.

## Zwischenlösung ohne GitHub: iCloud

```
node tools/build-single.js
cp dist/Lern-Cockpit.html ~/Library/Mobile\ Documents/com~apple~CloudDocs/Lern-Cockpit/
```

Die Datei erscheint auf dem iPhone in **Dateien → iCloud Drive → Lern-Cockpit**. Antippen
öffnet sie, auch ohne Netz. Grenzen gegenüber der installierten Variante: kein Icon auf dem
Homescreen, und der Lernfortschritt wird in dieser Ansicht nicht zuverlässig gespeichert –
innerhalb einer Sitzung ja, über Tage hinweg nicht.

## Auf dem iPhone installieren

Die Pages-Adresse in **Safari** öffnen (nicht Chrome – nur Safari kann installieren),
dann Teilen-Symbol → **Zum Home-Bildschirm**. Danach:

- startet die App im Vollbild, ohne Browserleiste
- funktioniert ohne Netz, auch im Tunnel
- behält den Lernfortschritt dauerhaft (iOS räumt installierte Web-Apps nicht auf)

Ohne Installation ist es eine normale Webseite: Netz nötig, und Safari löscht den Fortschritt
irgendwann. Also wirklich installieren.

## Fortschritt

Liegt im `localStorage` des Browsers, pro Kurs ein Eintrag (`lc.<kursid>`). Er überlebt jedes
Update der Inhalte, weil nur über IDs referenziert wird. Deshalb: **Karten- und Frage-IDs in einer
bestehenden Kursdatei nie neu vergeben**, nur anhängen.

Wichtig fürs iPhone: Safari räumt den Speicher von normalen Webseiten nach einiger Zeit ohne
Besuch auf. Bei einer über **„Zum Home-Bildschirm"** installierten App passiert das nicht.
Also installieren, nicht nur als Lesezeichen speichern.

## Inhaltsschema

Siehe `docs/SCHEMA.md`.
