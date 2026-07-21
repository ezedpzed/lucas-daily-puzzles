# Lucas's Daily Puzzles

A free, installable web app that serves a fresh set of logic puzzles every day — Mini Sudoku, Zip, and Queens — built for a 6-year-old puzzle fan. Inspired by LinkedIn's daily games.

- **One set per day, hard stop** — screen-time-friendly ritual with streaks and stars
- **Deterministic date-seeded generation** — same puzzle everywhere, no backend, every puzzle verified to have exactly one solution
- **Difficulty ramps automatically** as puzzles are solved hint-free
- **Parent panel** at `#/parent` (default PIN `1234`): difficulty, game toggles, resets

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # generator uniqueness tests
npm run build   # production build to dist/
```

## Deploy

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml` (enable Pages → Source: GitHub Actions in repo settings).

See `PRD.md` for full product requirements and `PROJECT_SPEC.md` for working context.
