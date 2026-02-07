# GameHub Arcade

Browser-based multi-game arcade built for GitHub Pages.

## Features
- Dynamic game catalog loaded from `games.json`
- Search + category filters (`Action`, `Puzzle`, `Sports`, `Arcade`)
- 60 starter games under `/games/` (scalable pattern for 1000+)
- Each game includes:
  - `index.html`
  - `style.css`
  - `script.js`
  - score tracking + restart button
  - back-to-menu + fullscreen controls

## Folder structure

```text
.
├── index.html
├── styles.css
├── script.js
├── games.json
├── assets/
│   └── default-thumbnail.svg
└── games/
    ├── maze-runner/
    │   ├── index.html
    │   ├── style.css
    │   └── script.js
    ├── space-shooter/
    ├── puzzle-slider/
    ├── football-penalty/
    └── ... 56 more game folders
```

## Scalability strategy (1000+ games)
- Metadata-first architecture (`games.json`) decouples catalog from UI.
- Card rendering uses pagination (`Load More`) with a configurable `pageSize`.
- Game cards are generated from a template to reduce DOM cost.
- Standardized game folder contract (`index.html/style.css/script.js`) supports bulk generation scripts.
- GitHub Pages compatibility: all links are relative and work on static hosting.

## Local run

```bash
python -m http.server 8000
# open http://localhost:8000
```
