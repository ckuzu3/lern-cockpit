# Lern-Cockpit

Eine Lern-App für Zertifikate und Studienmodule. Statisch, ohne Build-Werkzeuge, offline-fähig,
auf dem iPhone über den Homescreen nutzbar. Inhalte sind reine JSON-Dateien.

## Der Ablauf

1. Im Chat: **„Nächstes Zertifikat: X"** oder **„Ich habe Modul Y begonnen"** (Unterlagen hochladen, falls vorhanden)
2. Claude recherchiert die offiziellen Prüfungsziele, erzeugt `app/kurse/<id>.json` und trägt die Datei in `app/kurse/index.json` ein
3. Claude veröffentlicht die neue Version
4. Auf dem iPhone: App öffnen – der neue Kurs ist da. Kein technischer Schritt nötig.

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
kurse/                  Rohmaterial und Uploads (Skripte, Folien) – wird NICHT ausgeliefert
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
alle Kursdateien auf Konsistenz und veröffentlicht `app/` auf GitHub Pages. Dauer: ein bis zwei
Minuten. Schlägt die Prüfung fehl, wird nichts veröffentlicht.

Pages schaltet sich beim ersten Workflow-Lauf selbst ein. Sollte das an den
Repository-Einstellungen scheitern: **Settings → Pages → Source: GitHub Actions**.

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

Siehe `kurse/_SCHEMA.md`.
