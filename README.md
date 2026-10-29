# Nompong’s Secret Hunt

A browser-based hidden-role treasure hunt with Nompong, an illustrated backyard, six random missions, three garden themes, action cards, and automatic local saves.

## Stack

Vite 8 · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · zustand 5 · Vitest 5 — the same stack as nompong-studio.

## Develop

```sh
npm install
npm run dev        # http://localhost:5230
npm test           # rules engine + app smoke tests
npm run build      # static site in dist/ (relative base, host anywhere)
```

## Layout

| Path | What lives there |
| --- | --- |
| `src/game/` | Pure rules engine: types, constants, `createGame`, `applyMove`, `isLegal`, and the computer player (`bot.ts`). No React, no DOM; randomness is injected so games are reproducible in tests. |
| `src/store/gameStore.ts` | zustand store: the game plus UI state (selected card, rotation, preview, modals, toasts). Saves to `localStorage` under `nompong-hunt-v1`. |
| `src/components/` | React UI: scene, board, hand, side panels, dialogs. `art/` holds the SVG illustrations. |
| `src/styles/` | Tailwind entry and garden palette tokens. |
| `legacy/` | The original single-file vanilla JS prototype, kept for reference. |

## Game modes

- Solo with computer opponents
- 3–6 player pass-and-play on one device with private handoffs

Online multiplayer rooms are not implemented yet. Game state is stored in the browser, so pass-and-play privacy depends on players respecting the handoff screen.

## CI and hosting

`.github/workflows/ci.yml` runs typecheck, tests and build on every pull request and push to `main`. Pushes to `main` also deploy `dist/` to GitHub Pages (Settings → Pages → Source must be **GitHub Actions**).
