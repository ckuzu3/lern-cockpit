# Unterlagen ablegen

Alles, woraus Lerninhalte gebaut werden, liegt in **iCloud Drive → Lern-App → Unterlagen**.
Im Projekt zeigt der Verweis `unterlagen/` auf genau diesen Ordner, du erreichst ihn also
vom Mac und vom iPhone aus – es ist derselbe Ordner.

Hinein kommen: Studienskripte, Folien, Modulbeschreibungen, Prüfungsreglemente,
Mitschriften, Fotos von Tafelbildern.

## Vom iPhone hochladen

- **Aus einer App** (Mail, Teams, Safari, OneDrive): Teilen → *In Dateien sichern* →
  iCloud Drive → Lern-App → Unterlagen → Modulordner
- **Papier abfotografieren**: Dateien-App öffnen, in den Modulordner wechseln,
  oben rechts **⋯ → Dokumente scannen**. Das ergibt direkt ein sauberes, mehrseitiges PDF –
  besser als Fotos, weil der Text erkannt wird.
- **Fotos**: Fotos-App → Teilen → *In Dateien sichern*

Danach im Chat sagen, welches Modul dazugekommen ist.

**Pro Kurs oder Modul einen Unterordner**, benannt wie der Kurs:

```
iCloud Drive/Lern-App/Unterlagen/
  itil-4-foundation/
  hf-netzwerktechnik-2/
    Skript_Kapitel1-4.pdf
    Folien_Woche3.pptx
    Modulbeschreibung.pdf
```

Formate: PDF, Word, PowerPoint, Markdown, Text, Bilder. Alles, was lesbar ist.

Dieser Ordner wird **nicht veröffentlicht** – er liegt ausserhalb des Repositorys und ist
zusätzlich in `.gitignore` ausgenommen. Nur die daraus erzeugten Lerninhalte in
`app/kurse/<id>.json` gehen online. Wenn du Material hast, das du auch dort nicht sehen
willst, sag es mir: dann baue ich den Kurs nur als iCloud-Einzeldatei.

Alternativ kannst du Dateien direkt in den Chat ziehen. Der Ordner ist nur bequemer,
wenn es viele sind oder sie über die Zeit dazukommen.
