# immo-lagecheck

Lage-Check für Immobilienmakler: Adresse eingeben, Grundstück auf der Karte einzeichnen,
Fläche berechnen lassen und die Umgebung (Bus, Supermarkt, Schule …) mit Entfernungen sehen.
Ergebnis ist ein „Lage-Steckbrief“, den der Makler ins Exposé kopieren kann.

## Kontext

- Gebaut von Arbnor Hajdini (Frontend Team Lead, TypeScript/React/Angular/Vue).
- Zweck: vorzeigbarer Prototyp für ein Gespräch als Team Lead Web Development bei onOffice
  (CRM für Immobilienmakler) am **Freitag, 13.11.2026**. Muss bis **Mittwochabend, 11.11.** laufen
  und als Link (Vercel) zeigbar sein.
- Lieber eine kleine Version, die sauber funktioniert, als viele halbe Features.

## Zusammenarbeit mit Arbnor

- Auf **Deutsch** antworten, einfach und Schritt für Schritt erklären.
- Bei Vue-Konzepten kurz den Vergleich zu React oder Angular nennen
  (z. B. `ref` = `useState`, `computed` = `useMemo`, Composable = Custom Hook).
- Vor jedem größeren Schritt kurz sagen, was als Nächstes passiert und welche Dateien entstehen.
- **Nicht ungefragt committen oder pushen.** Commit-Nachrichten nach Conventional Commits
  (`feat:`, `fix:`, `chore:` …).
- **Keine `Co-Authored-By`-Zeile** und kein sonstiger Hinweis auf Claude/KI in Commits,
  Commit-Nachrichten, Code oder Doku.
- **Keine Pull Requests und keine Feature-Branches.** Direkt auf `main` arbeiten, committen und
  pushen (nach Zustimmung).
- **Clean Code einhalten** (siehe Abschnitt „Clean Code“), vor allem: keine Kommentare im Code.
- Keine Google-Maps-API, keine API-Schlüssel, keine Secrets im Code.

## Tech-Stack

- Vue 3 mit `<script setup lang="ts">`, TypeScript (strict), Vite
- Karte: **Leaflet** mit OpenStreetMap-Kacheln
- Zeichnen: **@geoman-io/leaflet-geoman-free** (Polygon zeichnen, bearbeiten, löschen)
- Geometrie: **@turf/turf** (Fläche, Umfang, Abstände)
- Adresssuche: **Nominatim** (OpenStreetMap)
- Umgebung: **Overpass API** (OpenStreetMap-Daten)
- Styling: **Tailwind CSS v4** mit eigenen Design-Tokens (CSS-Variablen), siehe unten
- Tests: **Vitest** (+ @vue/test-utils für Komponenten)
- Code-Qualität: **ESLint** (flat config, eslint-plugin-vue, typescript-eslint), **Prettier**, **vue-tsc**
- Git: **Husky**, **lint-staged**, **commitlint** (Conventional Commits), **GitHub Actions** CI
- Deployment auf **Vercel** (privater Bereich „ArbnorHajdini's projects“): https://immo-lagecheck.vercel.app

### Regeln für die freien OSM-Dienste

- Kartenattribution „© OpenStreetMap-Mitwirkende“ muss sichtbar sein.
- Nominatim: höchstens 1 Anfrage pro Sekunde, nur auf Knopfdruck/Enter suchen (kein Live-Suchen
  bei jedem Tastendruck), `accept-language=de`, Ergebnisse auf Deutschland begrenzen (`countrycodes=de`).
  Rückwärtssuche (`/reverse`, gleiche Bremse) nur, wenn sich das Grundstück ändert und die gesuchte
  Adresse mehr als 50 m daneben liegt oder keine gesucht wurde (`src/lib/grundstuecksadresse.ts`):
  Steckbrief und PDF nennen dann die Adresse am Grundstück, ohne Treffer die Koordinaten –
  nie eine Adresse, die nicht zum Grundstück passt.
- Overpass: **eine** gebündelte Abfrage pro „Umgebung prüfen“, Timeout setzen, Fehler freundlich anzeigen.
  **Der Browser fragt Overpass nie direkt**, sondern die eigene Vercel-Funktion
  `api/umgebung.ts` (`GET /api/umgebung?lat=…&lon=…`). Grund: overpass-api.de sperrt Anfragen mit
  Referer `*.vercel.app` (HTTP 406, ohne CORS-Header); mit eigener App-Kennung als User-Agent
  (`APP_KENNUNG`) nimmt der Server sie an – so verlangt es auch die Overpass-Nutzungsregel.
  Den Referer **nicht** fälschen oder weglassen, um Sperren zu umgehen.
  - Die Funktion nimmt nur `lat`/`lon` in Deutschland an und baut die Abfrage selbst
    (`src/lib/overpassAbfrage.ts`, nur relative Importe) – kein offener Proxy.
  - Vollständige Antworten bleiben 7 Tage im Vercel-CDN (`s-maxage`), Fehler/Überlast nie.
  - Lokal führt `vite/vercelFunktionenLokal.ts` dieselbe Funktion unter `npm run dev` und
    `npm run preview` aus.
  - Overpass ist oft überlastet (sofort 502 oder Antwort nach ~40 s): Gesamtzeitlimit 60 s im
    Browser, bei 429/502/503/504 bis zu 3 Versuche mit Pause (0 / 2 / 5 s).
- Overpass-Ergebnisse (rohe Orte) 7 Tage im `localStorage` zwischenspeichern, Schlüssel =
  Grundstücks-Mittelpunkt auf 3 Nachkommastellen (`src/lib/umgebungsZwischenspeicher.ts`).
  Entfernungen werden immer neu aus dem aktuellen Grundstück berechnet; Status und Steckbrief
  nennen den Stand der Daten. Vor einer Vorführung die Demo-Adresse einmal prüfen.
- Fremde Texte (Adressen, OSM-Namen) nie als HTML in Leaflet-Tooltips/Popups einsetzen,
  sondern über `alsSichererText()` (`src/lib/kartenAnzeige.ts`) – Schutz vor XSS.
- Eigene Kartenobjekte (Adress-Marker, Umgebung) mit `NUR_ZUR_ANZEIGE` anlegen
  (`pmIgnore` + `bubblingMouseEvents`): Geoman lässt sie nicht bearbeiten oder löschen, und
  Klicks gehen an die Karte durch – sonst kann man auf einem Marker keine Grundstücksecke setzen.

## MVP (in dieser Reihenfolge)

1. **Adresse suchen**
   Eingabefeld + Button. Treffer von Nominatim, Karte zoomt auf die Adresse und setzt einen Marker.
2. **Grundstück zeichnen**
   Polygon mit Geoman zeichnen und bearbeiten. Sofort anzeigen: **Fläche in m²** (ab 10.000 m² zusätzlich
   in Hektar) und **Umfang in m**. Nur ein Grundstück gleichzeitig; neues Zeichnen ersetzt das alte.
3. **Umgebung prüfen**
   Button, aktiv sobald ein Grundstück existiert. Overpass-Abfrage im Umkreis von 1.500 m um den
   Mittelpunkt des Grundstücks. Pro Kategorie den **nächstgelegenen** Ort mit Name und **Luftlinie
   vom Grundstücksrand** (0 m, wenn innerhalb), zusätzlich als Marker auf der Karte:
   - Bushaltestelle: `highway=bus_stop`
   - Bahnhof/Haltepunkt: `railway=station`, `railway=halt`
   - Supermarkt: `shop=supermarket`
   - Schule: `amenity=school`
   - Kita: `amenity=kindergarten`
   - Apotheke: `amenity=pharmacy`
   - Arztpraxis: `amenity=doctors`
   - Hauptstraße: `highway` in `primary`, `secondary`, `trunk` (Abstand zur Linie)
   Kategorien ohne Treffer: „nicht im Umkreis von 1,5 km“.
4. **Lage-Steckbrief**
   Kompakter Textblock (Adresse, Fläche, Umfang, Entfernungen) mit Button „Kopieren“
   (Clipboard API) und kurzer Bestätigung.

## Erweiterungen (umgesetzt)

6. **Objektart** (`src/lib/objektart.ts`, Auswahl oben links): Haus mit Grundstück, Wohnung,
   Grundstück (unbebaut) – als Liste, neue Arten = ein Eintrag mehr.
   - Mit Grundstück: Grundstück einzeichnen, Entfernungen ab Grundstücksgrenze.
   - Wohnung: kein Zeichnen (Werkzeuge ausgeblendet, gezeichnetes Grundstück wird entfernt),
     Entfernungen ab Adresspunkt; Steckbrief/PDF ohne Fläche/Umfang, eigener Hinweistext.
   - Intern rechnet alles mit einem `Bezugsobjekt` (`geometrie.ts`): Grundstück-Polygon oder
     Adresspunkt. Schrittnummern und Hinweistexte kommen aus `objektart.ts`.

5. **PDF-Exposé** („Als PDF-Exposé speichern“ im Lage-Steckbrief)
   A4, echte PDF-Datei mit jsPDF (erst beim Klick per `import()` geladen), Text als Vektor.
   - Seite 1: Adresse, Detailkarte mit Grundstück, Kennzahlen (Fläche, Umfang, Infrastruktur),
     „Das Wichtigste in der Nähe“ (4 nächste Ziele), Hinweis „ohne Gewähr, nicht amtlich“.
   - Seite 2 (nur nach „Umgebung prüfen“): Übersichtskarte mit nummerierten Markern
     (überlappende werden versetzt, mit Führungslinie) und Tabelle mit denselben Nummern.
   - Karten werden aus OSM-Kacheln (CORS erlaubt) in doppelter Auflösung selbst gezeichnet –
     kein Screenshot der Live-Karte, daher immer helle Druckfarben, auch im Dark Mode.
   - Helvetica im PDF kennt nur WinAnsi: fremde Zeichen über `alsPdfText()` ersetzen.
   - jsPDF nur über `ladeJsPdf()` (`src/lib/jsPdfLaden.ts`) laden; es wird vorgeladen, sobald ein
     Steckbrief möglich ist. Grund: Nach einem neuen Deployment fehlt in offenen Tabs die alte
     Chunk-Datei (404). Tritt das trotzdem auf, meldet die App „Seite neu laden“ statt einer
     falschen Netzwerk-Meldung (`istModulLadefehler`).

## Nicht im MVP (später)

- Grundstücksgrenzen automatisch aus dem Liegenschaftskataster (NRW Open Data)
- echte Fußwege statt Luftlinie (OSRM)
- mehrere Grundstücke, Speichern
- Einbindung als Shortcode in das WordPress-Plugin `wp-immo-kit` (Nachbar-Repo)

## Styling und Theming

**Entscheidung: Tailwind CSS v4 + semantische Design-Tokens als CSS-Variablen.**
Keine Farbcodes, Abstände oder Radien „hart“ in Komponenten.

- Alle Tokens liegen in **`src/styles/tokens.css`** und nur dort stehen Farbwerte:
  - Farben (semantisch, nicht nach Farbton benannt): `--color-bg`, `--color-surface`,
    `--color-surface-muted`, `--color-text`, `--color-text-muted`, `--color-border`,
    `--color-border-control` (Rahmen von Bedienelementen, ≥ 3:1),
    `--color-primary`, `--color-primary-hover`, `--color-primary-contrast`, `--color-danger`, `--color-success`,
    `--color-warning`, `--color-focus`, außerdem Kartenfarben `--color-plot-fill`, `--color-plot-stroke`
  - PDF-Druckfarben `--pdf-*` (nur in `:root`, gelten auch im Dark Mode; gelesen in `src/lib/pdfFarben.ts`)
  - Radien (`--radius-sm/md/lg`), Schatten (`--shadow-sm/md`), Schriften (`--font-sans`)
- **Light Mode** in `:root`, **Dark Mode** in `.dark` (gleiche Variablennamen, andere Werte).
- In `src/styles/main.css` werden die Tokens mit `@theme inline` an Tailwind gebunden, sodass
  Klassen wie `bg-surface`, `text-muted`, `border-border`, `bg-primary`, `rounded-md` entstehen.
- Dark Mode per Klasse: `@custom-variant dark (&:where(.dark, .dark *));`
- **Theme-Umschalter** (Hell / Dunkel / System) im Header als Composable `useTheme.ts`:
  Standard = Systemeinstellung (`prefers-color-scheme`), Auswahl in `localStorage`
  (Zugriffe in try/catch), Klasse `dark` auf `<html>`. Kein Aufblitzen beim Laden
  (kleines Inline-Script in `index.html`, das die Klasse vor dem Rendern setzt).
  Der Speicherschlüssel steht nur in `.env` (`VITE_THEME_STORAGE_KEY`) und wird von Vite in
  `index.html` (`%VITE_THEME_STORAGE_KEY%`) und `useTheme.ts` (`import.meta.env`) eingesetzt.
- Tailwinds eingebaute Farbpalette (`bg-blue-500` usw.) **nicht** verwenden, nur die eigenen
  semantischen Klassen.
- Leaflet und Geoman an das Theme anpassen (Polygon-Farben aus den Tokens lesen,
  Kartenkacheln im Dark Mode per CSS-Filter abdunkeln, Popups/Controls mit Token-Farben).
- Kontraste nach WCAG AA in beiden Modi, sichtbarer Fokus-Rahmen (`--color-focus`).
- Prüfskript **`npm run lint:colors`**: schlägt fehl, wenn außerhalb von `src/styles/tokens.css`
  Hex-, `rgb()`- oder `hsl()`-Farbwerte in `src/` vorkommen. Läuft in lint-staged und in der CI.

## Git, Commits und CI

- **Conventional Commits** für jede Commit-Nachricht, z. B.
  `feat: Adresssuche mit Nominatim`, `fix: Fläche bei Selbstüberschneidung`,
  `chore: ESLint einrichten`, `docs: README ergänzen`, `test: Format-Funktionen testen`,
  `style:`, `refactor:`, `ci:`, `build:`. Scope optional (`feat(karte): …`).
  Beschreibung kurz, im Imperativ/Präsens, ohne Punkt am Ende.
- **commitlint** mit `@commitlint/config-conventional`, ausgeführt über einen **Husky**
  `commit-msg`-Hook.
- **Husky** `pre-commit`-Hook mit **lint-staged**: ESLint --fix, Prettier und `lint:colors`
  nur auf geänderten Dateien.
- Kleine, thematische Commits (ein Schritt = ein Commit). **Nur committen/pushen, wenn Arbnor
  zustimmt.** Gearbeitet wird direkt auf `main` – keine Feature-Branches, keine Pull Requests.
- Commit-Nachrichten **ohne** `Co-Authored-By`-Zeile (auch nicht, wenn ein Tool sie vorschlägt).
- **GitHub Actions** `.github/workflows/ci.yml` bei Push und Pull Request:
  `npm ci` → `lint` → `lint:colors` → `type-check` (vue-tsc) → `test` → `build`.
- npm-Skripte: `dev`, `build`, `preview`, `lint`, `lint:colors`, `format`, `type-check`, `test`.
- `.nvmrc` (aktuelle Node-LTS), `.editorconfig`, `.prettierrc`, sinnvolle `.gitignore`.
- **README.md** (Englisch): Was das Tool macht, Screenshot hell/dunkel, Tech-Stack,
  Setup (`npm install`, `npm run dev`), Skripte, Datenquellen mit OSM-Attribution, Lizenz MIT.

## Struktur (Vorschlag)

```
src/
  App.vue
  styles/
    tokens.css             // NUR hier Farben, Radien, Schatten (Light + Dark)
    main.css               // @import "tailwindcss", @theme inline, @custom-variant dark
    leaflet.css            // Leaflet-Controls, Tooltip, Marker in Token-Farben
  components/
    AppHeader.vue          // Titel + Theme-Umschalter
    ObjektartWahl.vue      // Haus / Wohnung / Grundstück
    AdressSuche.vue
    KarteGrundstueck.vue
    GrundstueckAngaben.vue // Anleitung, Fläche, Umfang, „Grundstück entfernen“
    UmgebungListe.vue      // Button „Umgebung prüfen“, Ergebnis je Kategorie
    LageSteckbrief.vue     // Textvorschau, „Kopieren“, „Als PDF-Exposé speichern“
  composables/
    useTheme.ts            // Hell / Dunkel / System
    useAdressSuche.ts      // Nominatim
    useGrundstueck.ts      // Polygon, Fläche, Umfang
    useUmgebung.ts         // Overpass + nächstgelegene Orte
    useZwischenablage.ts   // Clipboard API, Bestätigung, Hinweis bei Fehler
    useExposeExport.ts     // Status des PDF-Exports
    useGrundstuecksadresse.ts // passt die gesuchte Adresse zum Grundstück? sonst Rückwärtssuche
  lib/
    nominatim.ts           // Suche und Rückwärtssuche, Antwort parsen, 1 Anfrage/Sekunde
    grundstuecksadresse.ts // Abstand Adresse ↔ Grundstück, wirksame Adresse, Hinweistext
    objektart.ts           // Objektarten, Schrittnummern, Bezugsobjekt je Objektart
    geometrie.ts           // reine Turf-Funktionen (testbar)
    grundstueckZeichnen.ts // Geoman: Werkzeugleiste, nur ein Grundstück, keine Selbstüberschneidung
    format.ts              // m², ha, m/km, deutsche Zahlenformate
    overpass.ts            // /api/umgebung abfragen (mit neuen Versuchen), Antwort parsen
    overpassAbfrage.ts     // Abfrage bauen, Mittelpunkt runden, Deutschland-Prüfung (auch Server)
    umgebungKategorien.ts  // die 8 Kategorien – Overpass-Filter und Zuordnung aus einer Quelle
    umgebung.ts            // nächstgelegener Ort je Kategorie
    umgebungAufKarte.ts    // Marker, Hauptstraße, 1,5-km-Umkreis
    kartenAnzeige.ts       // alsSichererText() für Tooltips, NUR_ZUR_ANZEIGE für Marker
    steckbrief.ts          // Text des Lage-Steckbriefs (reine Funktion)
    expose.ts              // Ablauf PDF-Export: Inhalt → Karten → PDF → speichern
    exposeInhalt.ts        // Texte, Kennzahlen, Tabelle, Dateiname (reine Funktion)
    exposePdf.ts           // A4-Layout mit jsPDF (Maße als benannte mm-Konstanten)
    kartenbild.ts          // Kartenbild aus OSM-Kacheln + Grundstück + Marker (Canvas)
    kachelMathe.ts         // Web-Mercator, Zoom, Kacheln, Begrenzungen (reine Funktionen)
    markerVerteilung.ts    // überlappende Marker versetzen
    pdfFarben.ts           // --pdf-* Tokens lesen
    pdfText.ts             // Text auf WinAnsi-Zeichensatz bringen
    jsPdfLaden.ts          // jsPDF einmal laden/vorladen, Modul-Ladefehler erkennen
    umgebungsZwischenspeicher.ts // Overpass-Orte 7 Tage im localStorage
    speicher.ts            // mitLocalStorage() – sicherer Zugriff mit try/catch
    typpruefung.ts         // istObjekt, alsZahl für fremde JSON-Antworten
  types.ts
tests/
  nominatim.test.ts
  grundstuecksadresse.test.ts
  useGrundstuecksadresse.test.ts
  objektart.test.ts
  useAdressSuche.test.ts
  useTheme.test.ts
  useGrundstueck.test.ts
  useUmgebung.test.ts
  overpass.test.ts
  overpassAbfrage.test.ts
  apiUmgebung.test.ts
  umgebung.test.ts
  steckbrief.test.ts
  useZwischenablage.test.ts
  useExposeExport.test.ts
  exposeInhalt.test.ts
  kachelMathe.test.ts
  markerVerteilung.test.ts
  pdfText.test.ts
  jsPdfLaden.test.ts
  umgebungsZwischenspeicher.test.ts
  geometrie.test.ts
  format.test.ts
  testdaten.ts             // gemeinsame Testdaten (Quadrat am Äquator, Orte, Straßen)
scripts/
  check-colors.mjs         // für npm run lint:colors
api/
  umgebung.ts              // Vercel-Funktion: Overpass-Abfrage mit App-Kennung, CDN-Cache
vite/
  vercelFunktionenLokal.ts // führt api/*.ts lokal im Dev-/Preview-Server aus
vercel.json                // maxDuration der Funktion
eslint-regeln/
  keine-kommentare.js      // ESLint-Regel app/keine-kommentare
.env                       // VITE_THEME_STORAGE_KEY (keine Secrets!)
.github/workflows/ci.yml
```

## Clean Code

Gilt für allen Code (TypeScript, Vue, CSS, HTML, Skripte, Konfiguration, Tests).

- **Keine Kommentare** – auch keine JSDoc-, CSS- oder HTML-Kommentare, kein auskommentierter Code,
  keine `eslint-disable`-Zeilen. Braucht Code einen Kommentar, ist er nicht verständlich genug:
  besser benennen oder in eine Funktion mit sprechendem Namen auslagern.
  Die ESLint-Regel **`app/keine-kommentare`** (`eslint-regeln/keine-kommentare.js`) erzwingt das
  für TS/JS/Vue; CSS und HTML von Hand sauber halten.
- **Sprechende Namen**, einheitlich **deutsch** (Fachsprache wie die Dateinamen:
  `sucheAdresse`, `AdressTreffer`, `Begrenzung`). Framework- und Standardbegriffe bleiben
  (`ref`, `computed`, `props`, `signal`, `lat`/`lon`).
- **Kleine Funktionen mit genau einer Aufgabe**; lange Abläufe in benannte Schritte zerlegen.
- **Keine magischen Zahlen oder Strings** – benannte Konstanten (`ADRESS_ZOOM`, `MIN_SUCHBEGRIFF_LAENGE`).
- **Benannte Objekte statt Tupel**, wenn die Reihenfolge nicht selbsterklärend ist
  (`{ sued, west, nord, ost }` statt `[number, number, number, number]`).
- **Keine Duplikate (DRY)** – ein Wert, eine Stelle (z. B. Theme-Schlüssel nur in `.env`).
- **Frühe Returns** statt verschachtelter `if`s; keine leeren `catch`-Blöcke, Fehler bewusst behandeln.
- **Reine Funktionen** in `lib/` und für Logik, die getestet wird; Abhängigkeiten
  (z. B. `fetch`, Uhrzeit) per Parameter austauschbar machen.
- **Tests** lesbar nach Arrange – Act – Assert, Testnamen beschreiben das Verhalten.

## Qualität

- UI komplett auf Deutsch, responsiv (funktioniert auch auf dem Handy), Tastatur-bedienbar,
  echte `<label>`, `aria-live` für Statusmeldungen.
- Lade- und Fehlerzustände für jede Anfrage.
- Zahlen im deutschen Format (`1.234 m²`, `850 m`, `1,2 km`).
- Logik in Composables und `lib/`, Komponenten bleiben schlank.
- `npm run lint`, `npm run lint:colors`, `npm run type-check`, `npm run test` und `npm run build`
  müssen ohne Fehler durchlaufen, bevor ein Schritt als fertig gilt.
- **Vor jedem Deployment den Produktions-Build im Browser prüfen** (`npm run build`, dann
  `npm run preview` auf Port 4173): Manche Fehler gibt es nur im Build, nicht im Dev-Server –
  z. B. Template-Refs, die wie eine Setup-Variable heißen (`ref="karte"` neben `let karte`), oder
  Geoman, das vor Leaflet ausgeführt wird, wenn man die Kartenbibliotheken in einen eigenen Chunk
  auslagert. Deshalb: Ref-Namen = Name der `useTemplateRef`-Variable, kein manuelles Chunk-Splitting
  für Leaflet/Geoman.
