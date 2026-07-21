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
