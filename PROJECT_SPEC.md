# Project: Lucas's Daily Puzzles

> Created: 2026-07-21

## Problem Statement

Lucas (Tim's 6-year-old son, a strong reader) loves LinkedIn's daily puzzle games — Mini Sudoku, Patches, Zip, Queens — but there's no kid-appropriate, screen-time-bounded way for him to play them daily. Build a free web app that gives him one fresh, auto-generated puzzle set per day at a difficulty that ramps with his skill.

Full product detail lives in `PRD.md` (v1.0, 2026-07-20) — this spec is the working context; the PRD is the source of truth for requirements.

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

- Vite + React + TypeScript single-page app, built as an installable PWA (offline-capable)
- Pure TS puzzle engine per game: `generate(seed, level)`, `validate(state)`, `hint(state)`, `isSolved(state)`
- localStorage for progress, streaks, difficulty state, and parent-panel config
- GitHub Pages hosting, deployed via GitHub Actions on push to `main`
- GitHub account: https://github.com/ezedpzed (repo to be created there)
- Unit tests on generators/solvers (uniqueness + solvability across levels × seeds)

## Scope Snapshot

- **Phase 1 (MVP):** app shell (home / daily set / results / celebration), Mini Sudoku, Patches (Shikaku), Zip, Queens (Star Battle), mistake highlighting + hints + undo, hidden gentle timer, streaks/stars, PIN-gated parent panel at `/#/parent`, PWA + Pages deploy
- **Phase 2:** Tango (Takuzu), Mini Nonogram, Kid Wordle (4-letter words); rotating-subset option; milestone badges
- **Phase 3 (stretch):** Tangram; QR/code progress export between devices; theming

## Open Questions

- Repo name (e.g., `lucas-daily-puzzles`) — public repo means the code is visible; fine for a puzzle app but worth a deliberate choice
- Custom day-boundary time? (PRD says local midnight; could be "after school" if mornings become a fight)
- Which game to build first — plan is Mini Sudoku (his favorite, simplest to verify)
- PWA install flow on his Chromebook — confirm it works nicely as a home-screen/shelf app

## Session Log

<!-- Sessions are appended below by /workflow-project-session close -->

### Session: 2026-07-20

**Accomplished:**
- Interviewed requirements (3 rounds) and wrote `PRD.md` v1.0
- Researched additional game candidates; selected Tango, Mini Nonogram, Kid Wordle (Phase 2) and Tangram (Phase 3)
- Decided architecture: static PWA (Vite + React + TS), date-seeded client-side generation, GitHub Pages, no backend

**Open items for next session:**
- Create GitHub repo under ezedpzed and scaffold the Vite project
- Build the app shell + Mini Sudoku generator/solver first

### Session: 2026-07-21

**Accomplished:**
- Built the full Phase 1 MVP: Vite + React + TS PWA scaffold, seeded-RNG engine, localStorage progress/streak/difficulty-ramp system
- Three playable games with unique-solution-verified generators: Mini Sudoku (4x4→6x6), Zip (drag-path, 5x5→6x6), Queens (Star Battle, 5x5→7x7)
- App shell: daily set with hard stop, hidden gentle timer, stars/confetti/streaks, how-to overlays, PIN-gated parent panel (default PIN 1234) at `#/parent`
- 27 vitest generator tests passing (uniqueness + validity across seeds × levels); typecheck clean; production build works
- Fixed Queens generator: uniform random regions almost never yield unique solutions at 6x6/7x7 — switched to deliberately uneven region sizes (tiny regions pin queens), now ~1ms/puzzle with 100% success
- git repo initialized on `main` with first commit; GitHub Pages deploy workflow at `.github/workflows/deploy.yml`

**In progress / not finished:**
- Visual browser check not done (cli-chrome extension needs manual re-load; app verified via build/tests/HTTP only)

**Later in session:** deployed live (CI green, tests pass in pipeline); Tim confirmed all 3 games work on device; built and shipped Patches (Shikaku) — random rectangle partition generator, exact-cover uniqueness solver, drag-to-draw UI with tap-to-remove. All four PRD Phase 1 games now live (36 generator tests passing).

**Even later:** Patches refined per Tim's feedback (no 1-squares ever; LinkedIn-style shape hints on clues — square/wide/tall glyphs enforced by solver and UI). Phase 2 shipped: Tango (Takuzu, 4x4→6x6, =/× links), Picture Cross (mini nonogram, 12 curated 5x5 pixel pictures with name reveal, random 7x7 at L4+), Wordy (kid Wordle: 3-letter L1 → 5-letter L4+, ~500 curated kid words, any guess accepted, extra rows past 6 cost a star instead of failing, physical keyboard support). 65 tests passing; deployed live.

**Open items for next session:**
- 7 games/day may be too many for one sitting — consider disabling some via parent panel or building the PRD's rotating-subset option
- Play-test new games on the touchscreen Chromebook
- Consider PWA install flow check on Chromebook

**Deployed:** live at https://ezedpzed.github.io/lucas-daily-puzzles/ (repo github.com/ezedpzed/lucas-daily-puzzles, auto-deploys from main via Actions)

**Decisions made:**
- Launch with 3 of the 4 games (Patches deferred) to be demo-ready in one day
- Queens region generation uses uneven target sizes for uniqueness
