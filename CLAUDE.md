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
- Später Deployment auf **Vercel**

### Regeln für die freien OSM-Dienste

- Kartenattribution „© OpenStreetMap-Mitwirkende“ muss sichtbar sein.
- Nominatim: höchstens 1 Anfrage pro Sekunde, nur auf Knopfdruck/Enter suchen (kein Live-Suchen
  bei jedem Tastendruck), `accept-language=de`, Ergebnisse auf Deutschland begrenzen (`countrycodes=de`).
- Overpass: **eine** gebündelte Abfrage pro „Umgebung prüfen“, Timeout setzen, Fehler freundlich anzeigen.

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

## Nicht im MVP (später)

- Grundstücksgrenzen automatisch aus dem Liegenschaftskataster (NRW Open Data)
- echte Fußwege statt Luftlinie (OSRM)
- PDF-Export, mehrere Grundstücke, Speichern
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
    AdressSuche.vue
    KarteGrundstueck.vue
    UmgebungListe.vue
    LageSteckbrief.vue
  composables/
    useTheme.ts            // Hell / Dunkel / System
    useAdressSuche.ts      // Nominatim
    useGrundstueck.ts      // Polygon, Fläche, Umfang
    useUmgebung.ts         // Overpass + nächstgelegene Orte
  lib/
    nominatim.ts           // Such-URL, Antwort parsen, 1 Anfrage/Sekunde
    geometrie.ts           // reine Turf-Funktionen (testbar)
    format.ts              // m², ha, m/km, deutsche Zahlenformate
    overpass.ts            // Query bauen, Antwort parsen
  types.ts
tests/
  nominatim.test.ts
  useAdressSuche.test.ts
  useTheme.test.ts
  geometrie.test.ts
  format.test.ts
scripts/
  check-colors.mjs         // für npm run lint:colors
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
