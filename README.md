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

## Fortschritt

Liegt im `localStorage` des Browsers, pro Kurs ein Eintrag (`lc.<kursid>`). Er überlebt jedes
Update der Inhalte, weil nur über IDs referenziert wird. Deshalb: **Karten- und Frage-IDs in einer
bestehenden Kursdatei nie neu vergeben**, nur anhängen.

Wichtig fürs iPhone: Safari räumt den Speicher von normalen Webseiten nach einiger Zeit ohne
Besuch auf. Bei einer über **„Zum Home-Bildschirm"** installierten App passiert das nicht.
Also installieren, nicht nur als Lesezeichen speichern.

## Inhaltsschema

Siehe `kurse/_SCHEMA.md`.
