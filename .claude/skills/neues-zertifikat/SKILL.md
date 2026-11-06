---
name: neues-zertifikat
description: Lädt ein neues Zertifikat oder Studienmodul in das Lern-Cockpit. Nutzen, wenn der Nutzer sagt "Nächstes Zertifikat X", "Ich habe Kurs Y begonnen", "Lade Modul Z in die App" oder Unterlagen zu einem neuen Kurs hochlädt.
---

# Neuen Kurs in das Lern-Cockpit laden

Ziel: aus dem Satz „Nächstes Zertifikat: X" wird ohne weiteres Zutun fertiges Lernmaterial in der App.

## Ablauf

1. **Recherchieren.** Immer die offizielle Quelle zuerst:
   - Microsoft: `learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/<code>`
   - Cisco, AXELOS/PeopleCert, CompTIA: die Herstellerseite mit den Exam Objectives
   - Studienmodul: die hochgeladenen Unterlagen, ergänzt um Recherche
   Prüfe das **Gültigkeitsdatum** der Prüfungsziele – sie ändern sich mehrmals pro Jahr.
   Niemals aus dem Gedächtnis arbeiten.

2. **Datei erzeugen** nach `kurse/_SCHEMA.md` → `app/kurse/<id>.json`.
   Umfang: 80–150 Karten, 50–80 Fragen mit Erklärungen, 2–3 Probeprüfungen,
   pro Domain eine Zusammenfassung, Glossar, Last-Minute-Blatt.
   Domains und Gewichtungen **wörtlich** aus der offiziellen Quelle.
   Keine echten Prüfungsfragen übernehmen – eigene Fragen entlang der Ziele schreiben.

3. **Lernplan rechnen.** Falls ein Prüfungstermin bekannt ist, rückwärts vom Termin,
   sonst mit 8 Stunden pro Woche. Letzte Woche ist immer die Prüfungswoche
   (Probeprüfungen, schwächste Domain, Last-Minute-Blatt). Aufgaben so formulieren,
   dass klar ist, was in Pendelzeit (Karten) und was in einen festen Block gehört (Labs, Learn-Module).

4. **Eintragen** in `app/kurse/index.json` unter `kurse`, und den Fahrplan-Eintrag aktualisieren.

5. **Prüfen**: `node tools/serve.js 8899`, Startseite, eine Karte, eine Frage, eine Probeprüfung.
   JSON muss parsen, jede `pruefungen[].fragen`-ID muss existieren, jede Karte und Frage
   eine gültige `domain`.

6. **Ausliefern**: `VERSION` in `app/sw.js` erhöhen, dann veröffentlichen
   (GitHub Pages: committen und pushen; sonst Artifact neu publizieren).
   Zusätzlich `node tools/build-single.js` für die iCloud-Einzeldatei.

7. **Melden**: ein Satz, was geladen wurde (Karten, Fragen, Wochen) und was der Nutzer
   auf dem iPhone tun muss – im Normalfall: App öffnen.

## Beim Aktualisieren eines bestehenden Kurses

IDs niemals neu vergeben, nur anhängen. Sonst verliert der Lernfortschritt den Bezug.
