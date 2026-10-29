# Nompong’s Secret Hunt

A hidden-role bluffing game in Nompong’s backyard, in the spirit of Saboteur. Hunter pups build a scent trail to whatever Nompong is hunting for this round; sneaky pups quietly lead the pack astray. Computer dogs have personalities, bark claims that may be lies, and keep their own suspicion of everyone at the table. Thai and English.

## How it plays

- **Roles.** Each round deals hunter and sneaky role cards with one card left out, so nobody knows how many sneaky pups there are — maybe none.
- **Cards.** 40 trails (9 of them dead ends) and 27 actions: secret sniff, dig, spoil a dog’s leash / nose / paw, and the matching fixes. A dog with anything spoiled can’t lay trails. Trails only flip, never turn sideways.
- **Mind games.** After a sniff you bark the truth, a fib, or nothing. Once a turn you may point a paw at a suspect. Every dog keeps `suspicion[observer][target]`, moved by dead ends, digs, who spoils or fixes whom, claims that are later proven false, and accusations; the panel shows the pack’s average.
- **Personas.** Mochi (Loyal Goofball), Biscuit (Nerdy Detective), Pepper (Sly Charmer), Coco (Drama Queen), Milo (Sleepy Chill), Taro (Grumpy Guard). Each has its own trust gain, accusation threshold, lying rate, boldness, grudges and lines.
- **Loot.** Three rounds. Hunters who find the treasure share Nompong’s stuff (1–3 points each), finder first; otherwise the sneaky pups split it. Most points wins.

## Stack

Vite 8 · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · zustand 5 · Vitest 5 — the same stack as nompong-studio.

## Develop

```sh
npm install
npm run dev        # http://localhost:5230
npm test           # rules, suspicion, bots, full-match simulations, app smoke tests
npm run build      # static site in dist/ (relative base, host anywhere)
```

## Layout

| Path | What lives there |
| --- | --- |
| `src/game/board.ts` | Grid geometry: scent network (dead ends stop it), legal placement, reaching hiding spots. |
| `src/game/rules.ts` | Matches and rounds, `applyMove`, `accuse`, loot payouts. Pure; randomness is injected. |
| `src/game/suspicion.ts` | How each dog’s suspicion responds to what it sees and hears. |
| `src/game/bot.ts` | Computer dogs: beliefs from sniffs and trusted claims, persona-driven moves, barks and accusations. |
| `src/game/constants.ts` | Deck, role table, tools, loot, personas and their tuning. |
| `src/i18n/` | `en.ts` / `th.ts` copy (including every persona line) and the `useT` hook. Log entries are stored as keys so the feed re-renders in either language. |
| `src/store/gameStore.ts` | zustand store: game plus UI state. Saves to `localStorage` under `nompong-hunt-v2`. |
| `src/components/` | React UI: scene, board, hand, side panels, dialogs. `art/` holds the SVG illustrations. |
| `legacy/` | The original single-file prototype, kept for reference. |

## Game modes

- Solo: you plus 2–6 computer dogs with personalities
- Pass & play: 3–7 friends on one device, with private hand-offs

Online multiplayer rooms are not implemented yet.

## CI and hosting

`.github/workflows/ci.yml` runs typecheck, tests and build on every pull request and push to `main`. Pushes to `main` also deploy `dist/` to GitHub Pages (Settings → Pages → Source must be **GitHub Actions**).
