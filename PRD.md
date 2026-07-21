# Lucas's Daily Puzzles — Product Requirements Document

**Version:** 1.0 · **Date:** 2026-07-20 · **Owner:** Tim (Dad) · **User:** Lucas, age 6

---

## 1. Overview

A free, mobile-friendly web app that gives Lucas a small set of daily logic puzzles, modeled on LinkedIn's daily games. One fresh set per day, a hard stop when it's done, gentle celebration on completion, and difficulty that quietly ramps up as he improves.

**Guiding principles**
- **Calm and clean**, like LinkedIn's games — the puzzles are the fun, not the chrome.
- **One sitting a day** — a bounded, screen-time-friendly ritual (5–15 minutes).
- **Low-stakes trial and error** — undo, hints, and mistake highlighting; never punishing.
- **Zero maintenance** — puzzles are procedurally generated; no daily work for Dad.
- **Zero cost** — static site on GitHub Pages, no backend, no accounts.

## 2. Target user & context

- Lucas is 6, a **strong reader** (reading Harry Potter / Narnia), so short written instructions and a word game are fine.
- Devices: his own device, iPad/tablet, Dad's phone, and a **touchscreen Chromebook**. The app must work well with **touch-first interaction** at phone and tablet/laptop sizes.
- No account, no personal data collected, no ads, no external tracking.

## 3. Games

### 3.1 Launch games (Phase 1)

All grids are generated at kid-appropriate sizes and guaranteed to have a **unique solution**.

| Game | Based on | Starting size | Notes |
|---|---|---|---|
| Mini Sudoku | LinkedIn Mini Sudoku | 4×4 (2×2 boxes) → 6×6 | His favorite. Number pad entry, no pencil marks needed at launch. |
| Patches | Shikaku | 5×5 → 7×7 | Drag to draw rectangles covering the grid; each contains exactly one number equal to its area. |
| Zip | LinkedIn Zip | 5×5 → 6×6 | Drag one continuous path through every cell, visiting numbered waypoints in order. |
| Queens | Star Battle (1 star) | 5×5 → 7×7 | One queen per row, column, and color region; no two adjacent. Tap to cycle blank → X → queen. |

### 3.2 Additional game candidates (researched)

Recommended additions, in priority order:

1. **Tango (Takuzu/Binairo)** — fill a 6×6 grid with two symbols (suns/moons), no three in a row, equal counts per row/column. Already part of the LinkedIn family, rules a 6-year-old grasps instantly, and easy to generate. **Recommend for Phase 2.**
2. **Mini Nonogram (Picross)** — 5×5 grids where row/column counts reveal a hidden pixel picture. The picture reveal is a built-in reward that kids love. **Recommend for Phase 2.**
3. **Kid Wordle** — guess a 4-letter word in 6 tries, drawn from a kid-friendly word list (~1,500 common words). Great fit given his reading level; trivially cheap to build. **Recommend for Phase 2.**
4. **Tangram** — arrange 7 pieces to fill a daily silhouette. Great spatial play, but drag-rotate-snap interactions and solution validation are significantly more build effort than the grid games. **Recommend for Phase 3 (stretch).**

Considered and passed on for now: Pinpoint and Crossclimb (trivia/general-knowledge dependence makes them hard to pitch at age 6), Hitori and Kakuro (rules too fiddly for this age).

Research sources: [LinkedIn Games](https://www.linkedin.com/games), [ConnectSafely: How to play LinkedIn games](https://connectsafely.ai/articles/linkedin-games), [TheWordFinder LinkedIn games hub](https://www.thewordfinder.com/linkedin-games-hub/), [Mommy Poppins: logic puzzles for kids](https://mommypoppins.com/anywhere-kids/boredom-busters/best-easy-logic-puzzles-for-kids), [What Do We Do All Day: single-player logic games](https://www.whatdowedoallday.com/single-player-logic-games/), [Dad Suggests: best logic games for kids](https://www.dadsuggests.com/home/the-best-logic-games-for-kids), [Math Playground logic games](https://www.mathplayground.com/logic-games.html), [MentalUP logic games](https://www.mentalup.co/logic-games-and-logic-puzzles).

### 3.3 Daily set composition

- Default: **all enabled games appear each day** (4 at launch). Parent panel can toggle games or switch to a rotating subset (e.g., 3 of 6) once more games exist so the set stays ~10 minutes.
- The day's set is presented as a simple card list ("Today's Puzzles") with a checkmark as each is completed.

## 4. Puzzle generation & daily cycle

- **Deterministic seeded generation:** the puzzle for each game on a given date is generated from a seed derived from the date (e.g., `hash("sudoku-2026-07-20")`). Same date → same puzzle on every device, with no backend and no puzzle bank to maintain.
- Every generated puzzle is **verified to have exactly one solution** by the generator (generate-and-check with a solver) before being shown. Generation happens client-side in <1s at these grid sizes.
- **Day boundary:** local midnight. A new set appears each morning.
- **Hard stop:** once today's set is complete, the app shows the celebration + results screen and a "Come back tomorrow!" state. No replays, no archive access for Lucas (parent panel can reset a day if something goes wrong).

## 5. Difficulty progression

- Each game has a **difficulty ladder** defined in config: grid size, clue density, and technique depth (e.g., Sudoku L1 = 4×4 heavy clues → L8 = 6×6 sparse clues).
- **Auto-ramp:** the app tracks per-game cumulative solves and average solve time in localStorage. Roughly every ~10 clean solves within target time, the level steps up by one. It never ramps more than one level at a time, and steps back a level after repeated heavy hint use or abandonment.
- **Parent override:** the parent panel can pin or adjust each game's level directly.

## 6. In-puzzle experience

- **Help features (all games):**
  - **Mistake highlighting** — rule-breaking entries glow red immediately (toggleable per game in parent panel).
  - **Hint button** — reveals one correct cell/segment. Unlimited, but hint count is shown on the results screen (data feeds the difficulty ramp).
  - **Undo** — unlimited, one tap.
- **Timer:** hidden during play; solve time revealed on completion ("You did it in 3:24! ⭐"). Personal-best flag when he beats his record for that game/level. No countdowns, no failure states.
- **Rules refresher:** each game has a short "How to play" overlay with a 2–3 sentence explanation and a tiny illustrated example, accessible anytime from the puzzle screen.
- **Interruption-safe:** in-progress puzzle state persists to localStorage continuously; closing the tab mid-puzzle loses nothing.

## 7. Completion & rewards

- **Per-puzzle:** brief confetti burst + solve time + stars (3 = no hints, 2 = 1–2 hints, 1 = solved with 3+ hints).
- **Daily set complete:** bigger celebration screen with the day's summary (times, stars) and streak count.
- **Streak & trophies:** current streak and best streak on the home screen; simple milestone badges (7-day streak, 50 puzzles solved, first 3-star day, first personal best, etc.). Kept low-key to match the clean visual style — think LinkedIn's completion screens, not a casino.
- Missing a day resets the current streak but nothing else; no guilt messaging.

## 8. Parent panel

- Hidden route (`/#/parent`) gated by a simple 4-digit PIN.
- Controls: per-game enable/disable, difficulty level pin/adjust, mistake-highlighting toggle, reset today's set, reset all progress, view stats (streak, per-game levels, times, hint usage).
- Config changes take effect immediately; everything stored in localStorage.

## 9. Technical approach

| Decision | Choice | Rationale |
|---|---|---|
| Platform | Static single-page web app (**PWA**) | Free, works on all his devices; PWA gives a home-screen icon and offline play |
| Stack | **Vite + React + TypeScript** | Mainstream, well-supported; TS matters for solver/generator correctness |
| State/storage | localStorage (per device) | No backend, no accounts — accepted trade-off: streaks don't sync across devices |
| Puzzle logic | Pure TS modules per game: `generate(seed, level)`, `validate(state)`, `hint(state)`, `isSolved(state)` | Shared engine interface keeps adding games cheap and unit-testable |
| Hosting | **GitHub Pages** via GitHub Actions on push to `main` | Free, zero-ops |
| Testing | Unit tests on generators/solvers (uniqueness, solvability across all levels × many seeds) | The one place bugs would really hurt the experience |

**Why not Apps Script:** Apps Script web apps are viable for forms and simple tools, but interactive touch puzzle UIs need a real front-end build anyway, and Apps Script adds latency, an awkward iframe sandbox, and Google-account friction — with no benefit since we need no backend at all. A static PWA is both simpler and better here.

**Non-goals (v1):** accounts/sync, multiplayer or sharing, sound effects, native app stores, puzzle archive, localization.

## 10. Phases

- **Phase 1 — MVP:** app shell (home, daily set, results, celebration), Mini Sudoku + Patches + Zip + Queens with seeded generators/solvers, help features, gentle timer, streaks/stars, parent panel, PWA + GitHub Pages deploy.
- **Phase 2:** Tango, Mini Nonogram, Kid Wordle; rotating-subset option; milestone badges.
- **Phase 3 (stretch):** Tangram; optional export/import of progress (QR or code string) to move streaks between devices; theming.

## 11. Success criteria

- Lucas asks to do his puzzles most days (streak ≥5 days/week after the first month).
- A daily set takes 5–15 minutes; he finishes ≥80% of started sets.
- Zero ongoing maintenance beyond occasionally opening the parent panel.
- Total cost: $0.
