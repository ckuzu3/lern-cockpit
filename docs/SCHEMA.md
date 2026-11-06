# Schema einer Kursdatei (`app/kurse/<id>.json`)

Jeder Kurs ist gleich aufgebaut – egal ob Zertifikat oder Studienmodul.

```jsonc
{
  "id": "md-102",                  // kebab-case, zugleich Schlüssel für den Fortschritt
  "titel": "MD-102 Endpoint Administrator",
  "anbieter": "Microsoft",
  "typ": "zertifikat",             // oder "studium"
  "stand": "2026-11-06",           // Datum der Recherche
  "termin": null,                  // "2027-01-20" sobald die Prüfung gebucht ist

  "pruefung": {                    // Steckbrief, erscheint auf der Startseite
    "code": "MD-102", "name": "...", "dauer": "...", "fragen": "...",
    "bestehen": "...", "kosten": "...", "gueltigkeit": "...", "sprache": "...",
    "quelle": "https://..."        // offizielle Quelle, Pflicht
  },
  "hinweis": "Fragen sind selbst formuliert ...",   // Urheberrechts-Hinweis
  "ressourcen": [{"titel":"...","url":"...","was":"..."}],

  "domains": [{                    // Prüfungsgebiete, Reihenfolge = offizielle Reihenfolge
    "id": "d1", "titel": "...", "kurz": "...", "gewicht": "20–25 %",
    "themen": ["..."],             // wörtlich die geprüften Fähigkeiten
    "zusammenfassung": "Markdown"  // ##, ###, Listen, **fett**, `code`, Tabellen
  }],

  "lernplan": {
    "hinweis": "...",
    "wochen": [{"nr":1,"thema":"...","stunden":8,"ziel":"...","aufgaben":["..."]}]
  },

  "karten":  [{"id":"k001","domain":"d1","front":"...","back":"..."}],
  "fragen":  [{"id":"f001","domain":"d1","frage":"...","optionen":["A","B"],
               "richtig":[0],      // mehrere Indizes = Mehrfachauswahl
               "erklaerung":"warum richtig und warum die anderen falsch sind"}],
  "pruefungen":[{"id":"p1","titel":"Probeprüfung 1","dauer_min":80,"fragen":["f001","f007"]}],

  "glossar": [{"b":"Begriff","d":"Erklärung"}],
  "lastminute": "Markdown – die letzten 48 Stunden"
}
```

## Regeln

- **IDs sind unveränderlich.** Neue Inhalte werden angehängt, bestehende IDs nie neu vergeben –
  sonst verliert der Fortschritt seinen Bezug.
- **Jede Frage braucht eine Erklärung**, die auch sagt, warum die falschen Optionen falsch sind.
- **Keine echten Prüfungsfragen.** Eigene Fragen entlang der offiziellen Prüfungsziele.
- **Quelle und Stand** immer eintragen, damit später erkennbar ist, wann nachrecherchiert werden muss.
- Richtwerte pro Zertifikat: 80–150 Karten, 50–80 Fragen, 2–3 Probeprüfungen,
  pro Domain eine Zusammenfassung von 2–4 Bildschirmseiten.
