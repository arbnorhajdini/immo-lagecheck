# immo-lagecheck

A location check for real estate agents: search an address, draw the plot on the map, get its
area and perimeter, and see what's nearby (bus stop, supermarket, school …) with distances.
The result is a short location profile ("Lage-Steckbrief") that can be copied into an exposé.

> Status: work in progress. Screenshots (light/dark) will follow once the first features are in.

## Tech stack

- Vue 3 (`<script setup lang="ts">`), TypeScript (strict), Vite
- Tailwind CSS v4 with semantic design tokens (CSS custom properties), light/dark/system theme
- Leaflet + OpenStreetMap tiles, Geoman (drawing), Turf (geometry)
- Nominatim (geocoding) and Overpass API (points of interest)
- Vitest, ESLint (flat config), Prettier, vue-tsc
- Husky, lint-staged, commitlint (Conventional Commits), GitHub Actions

## Setup

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev
```

## Scripts

| Script                | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `npm run dev`         | Start the dev server                                                  |
| `npm run build`       | Production build into `dist/`                                         |
| `npm run preview`     | Serve the production build locally                                    |
| `npm run lint`        | ESLint                                                                |
| `npm run lint:colors` | Fail if color values appear in `src/` outside `src/styles/tokens.css` |
| `npm run format`      | Format all files with Prettier                                        |
| `npm run type-check`  | Type-check with vue-tsc                                               |
| `npm run test`        | Run unit tests with Vitest                                            |

## Theming

All colors, radii and shadows live in `src/styles/tokens.css` (light values in `:root`, dark values
in `.dark`). `src/styles/main.css` binds them to Tailwind via `@theme inline`, so components only
use semantic classes such as `bg-surface`, `text-muted` or `bg-primary`. Tailwind's built-in color
palette is disabled.

## Data sources

- Map tiles and data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright),
  available under the Open Database License (ODbL).
- Geocoding by [Nominatim](https://nominatim.org/) – used according to the
  [usage policy](https://operations.osmfoundation.org/policies/nominatim/) (max. 1 request per
  second, search on submit only).
- Points of interest via the [Overpass API](https://overpass-api.de/).

## License

[MIT](./LICENSE)
