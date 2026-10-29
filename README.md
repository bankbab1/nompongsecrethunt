# Nompong’s Secret Hunt

A browser-based hidden-role treasure hunt with Nompong, an illustrated backyard, six random missions, three garden themes, action cards, and automatic local saves.

## Play locally

No dependencies or build step required. Serve the game with:

```sh
python -m http.server 8080 --directory dist
```

Open http://localhost:8080 in your browser.

## Game modes

- Solo with computer opponents
- 3–6 player pass-and-play on one device with private handoffs

Online multiplayer rooms are not implemented yet. Game state is stored in the browser, so pass-and-play privacy depends on players respecting the handoff screen.

## Source

- `dist/index.html`: game interface
- `dist/style.css`: responsive layout and garden styling
- `dist/game.js`: game rules, computer turns, rendering, and persistence

The `dist` directory contains the editable source and can be hosted directly as a static website.
