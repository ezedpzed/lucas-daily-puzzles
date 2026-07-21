# Project: Lucas's Daily Puzzles

> Created: 2026-07-21 · **Live:** https://ezedpzed.github.io/lucas-daily-puzzles/ · **Repo:** https://github.com/ezedpzed/lucas-daily-puzzles

## Problem Statement

Lucas (Tim's 6-year-old son, a strong reader) loves LinkedIn's daily puzzle games — Mini Sudoku, Patches, Zip, Queens — but there's no kid-appropriate, screen-time-bounded way for him to play them daily. Build a free web app that gives him one fresh, auto-generated puzzle set per day at a difficulty that ramps with his skill.

Full product detail lives in `PRD.md` (v1.0, 2026-07-20) — this spec is the working context; the PRD is the source of truth for requirements.

## Current Status (2026-07-21)

**Shipped and live.** All 4 Phase 1 games + all 3 Phase 2 games are deployed and playable:

| Game | Based on | Sizes | Notes |
|---|---|---|---|
| Mini Sudoku 🔢 | LinkedIn Mini Sudoku | 4×4 → 6×6 | tap cell + number pad |
| Zip 🐍 | LinkedIn Zip | 5×5 → 6×6 | drag path, waypoints in order |
| Patches 🧵 | Shikaku | 5×5 → 7×7 | drag rectangles; no 1-squares; shape hints (square/wide/tall) |
| Queens 👑 | Star Battle (1 star) | 5×5 → 7×7 | tap: blank → ✕ → 👑 |
| Tango 🌗 | Takuzu | 4×4 → 6×6 | ☀️/🌙 with =/× links |
| Picture Cross 🖼️ | Nonogram | 5×5 → 7×7 | 12 curated pixel pictures with name reveal at 5×5 |
| Wordy 📝 | Wordle | 3 → 5 letters | ~500 kid words; extra guesses cost a star, never fails |

Every puzzle is date-seeded and solver-verified to have exactly one solution. 65 vitest generator tests. Pushes to `main` auto-deploy via GitHub Actions (tests run in CI).

**Key URLs/facts for working sessions:**
- Parent panel: `#/parent`, PIN `1234` (game toggles, difficulty pin, resets, stats)
- Difficulty auto-ramps: +1 level per 10 hint-free solves; 3+ hints steps the counter back
- Progress is per-device localStorage; day boundary is local midnight
- `gh` CLI installed at `~/.local/bin/gh`, authed as ezedpzed

## Goals

- A daily 5–15 minute puzzle ritual Lucas asks to do (streak ≥5 days/week after month one)
- One set per day with a hard stop; gentle rewards (streaks, stars, modest confetti), no pressure mechanics
- Zero ongoing maintenance (deterministic date-seeded puzzle generation, unique-solution verified)
- Zero cost (static hosting, no backend, no accounts)

## Non-Goals

- Accounts, cross-device sync, or any backend (v1) — progress is per-device localStorage
- Multiplayer, sharing, sound effects, app stores, puzzle archive, localization
- Apps Script (evaluated and rejected — static PWA is simpler and better)

## Constraints

- Solo builder (Tim), personal side project — favor simple, maintainable choices
- Must be touch-first and mobile-friendly: iPad/tablet, phone, and a touchscreen Chromebook
- Free hosting only; no personal data collection
- Every generated puzzle must be verified to have exactly one solution

## Tech Stack

- Vite + React + TypeScript SPA, installable PWA (offline via vite-plugin-pwa)
- Pure TS puzzle engine per game in `src/games/<game>/`: `generate(seed, level)` + solver for uniqueness; React board component per game
- Shared engine in `src/engine/`: seeded RNG (xmur3+mulberry32), day keys, localStorage meta/day records
- GitHub Pages hosting, deployed via `.github/workflows/deploy.yml` on push to `main`
- Vitest generator tests in `src/games/generators.test.ts`

## Roadmap

- ~~Phase 1: Mini Sudoku, Patches, Zip, Queens + app shell~~ ✅ shipped 2026-07-21
- ~~Phase 2: Tango, Picture Cross (nonogram), Wordy (kid Wordle)~~ ✅ shipped 2026-07-21
- **Next up:** rotating daily subset (7 games/day is likely too many for one sitting); milestone badges
- **Phase 3 (stretch):** Tangram; QR/code progress export between devices; theming; show finished nonogram picture on the solved screen

## Open Questions

- Rotating subset vs. manually disabling games in the parent panel — Tim leaning toward rotation, not yet requested
- Custom day-boundary time? (currently local midnight; could be "after school" if mornings become a fight)
- PWA install flow on his Chromebook — confirm it works nicely as a shelf app

## Session Log

<!-- Sessions are appended below by /workflow-project-session close -->

### Session: 2026-07-20

**Accomplished:**
- Interviewed requirements (3 rounds) and wrote `PRD.md` v1.0
- Researched additional game candidates; selected Tango, Mini Nonogram, Kid Wordle (Phase 2) and Tangram (Phase 3)
- Decided architecture: static PWA (Vite + React + TS), date-seeded client-side generation, GitHub Pages, no backend

### Session: 2026-07-21

**Accomplished:**
- Built and deployed the entire app in one day — Phase 1 and Phase 2 complete (see Current Status table)
- Scaffold + engine: Vite/React/TS PWA, seeded RNG, localStorage progress/streak/auto-ramp, app shell (daily set with hard stop, hidden timer, stars/confetti, how-to overlays, parent panel)
- Phase 1 games: Mini Sudoku, Zip, Queens shipped first (demo-ready same day); Patches added after Tim confirmed the first three worked on device
- Patches refined per Tim's feedback: no 1-square patches; LinkedIn-style shape hints on clues, enforced by solver + UI
- Phase 2 games: Tango, Picture Cross, Wordy
- Repo pushed to github.com/ezedpzed/lucas-daily-puzzles; Pages enabled via API; CI runs tests then deploys; 65 tests green
- Installed `gh` CLI (no Homebrew on machine) at `~/.local/bin/gh`, authed as ezedpzed

**Decisions made:**
- Queens generator needs deliberately uneven region sizes — uniform random regions almost never give unique solutions at 6×6/7×7
- Wordy accepts any letters as a guess (no dictionary rejection) and can't be failed — extra rows past 6 cost a star
- Picture Cross uses curated pixel art at 5×5 for the reveal moment, random boards at 7×7

**Open items for next session:**
- Decide on rotating daily subset (likely yes) — until then, use parent panel to trim the 7-game set
- Play-test Tango / Picture Cross / Wordy on the touchscreen Chromebook
- Check PWA install flow on Chromebook
- Visual/browser QA pass still pending (cli-chrome extension needs a manual reload on Tim's machine)
