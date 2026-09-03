# KAL-Q

A Kalaallisut word arcade. Catch rising roots and affixes, then place a pair in the same lane to form a real word.

**Play:** [jandahl.github.io/kal-q](https://jandahl.github.io/kal-q/)

## Play locally

```bash
npm install
npm run dev
```

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move paddle | A / D or ← / → | Left / Right |
| Place held tile | Enter or K | Place |
| Discard | S or ↓ | Discard |
| Rush incoming tile | hold W or ↑ | Rush |
| Pause | P or Esc | Pause |

Gold tiles are roots. Teal tiles are affixes. They only clear if the pair is linguistically valid **and** stacked in the same lane.

## Deploy

GitHub Pages is built by [`.github/workflows/pages.yml`](.github/workflows/pages.yml) on every push to `main` (`npm run build:pages`). The site is a static export at `/kal-q/` — not a `gh-pages` branch, and not a path inside retr-oq.

## Stack

Vite, TanStack Start, React, Canvas 2D. High score is stored in `localStorage`.
