# KAL-Q

A Kalaallisut word arcade. Catch rising roots and affixes, then place a pair in the same lane to form a real word.

## Play

```bash
npm install
npm run dev
```

Open the printed local URL. `npm run build` produces the production bundle.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move paddle | A / D or ← / → | Left / Right |
| Place held tile | Enter or K | Place |
| Discard | S or ↓ | Discard |
| Rush incoming tile | hold W or ↑ | Rush |
| Pause | P or Esc | Pause |

Gold tiles are roots. Teal tiles are affixes. They only clear if the pair is linguistically valid **and** stacked in the same lane.

## Stack

Vite, TanStack Start, React, Canvas 2D. High score is stored in `localStorage`.
