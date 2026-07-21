import { makeRng, randInt, type Rng } from '../../engine/rng'

// Picture Cross (mini nonogram): fill squares so each row/column matches its
// run counts; solving reveals a little pixel picture.

export interface NonogramPuzzle {
  n: number
  rows: number[][]
  cols: number[][]
  solution: boolean[]
  picture?: { name: string; emoji: string }
}

export const NONOGRAM_MAX_LEVEL = 6

export function nonogramSize(level: number): number {
  return Math.min(Math.max(level, 1), NONOGRAM_MAX_LEVEL) <= 3 ? 5 : 7
}

// hand-drawn 5x5 pixel pictures ('#' = filled)
const PICTURES: { name: string; emoji: string; art: string[] }[] = [
  { name: 'a heart', emoji: '❤️', art: ['.#.#.', '#####', '#####', '.###.', '..#..'] },
  { name: 'a tree', emoji: '🌲', art: ['..#..', '.###.', '#####', '..#..', '..#..'] },
  { name: 'a cup', emoji: '☕', art: ['.....', '####.', '#####', '####.', '.###.'] },
  { name: 'a boat', emoji: '⛵', art: ['..#..', '.##..', '###..', '.....', '#####'] },
  { name: 'an arrow', emoji: '⬆️', art: ['..#..', '.###.', '#####', '..#..', '..#..'] },
  { name: 'a house', emoji: '🏠', art: ['..#..', '.###.', '#####', '#.#.#', '#####'] },
  { name: 'a dog', emoji: '🐶', art: ['#...#', '#####', '##.##', '#####', '.###.'] },
  { name: 'a key', emoji: '🔑', art: ['###..', '#.#..', '###..', '..#..', '..###'] },
  { name: 'a plane', emoji: '✈️', art: ['..#..', '..#..', '#####', '..#..', '.###.'] },
  { name: 'a mushroom', emoji: '🍄', art: ['.###.', '#####', '#####', '..#..', '.###.'] },
  { name: 'a fish', emoji: '🐟', art: ['.....', '.##.#', '#####', '.##.#', '.....'] },
  { name: 'a crown', emoji: '👑', art: ['#.#.#', '#####', '#####', '.###.', '.....'] },
]

export function runsOf(line: boolean[]): number[] {
  const runs: number[] = []
  let cur = 0
  for (const v of line) {
    if (v) cur++
    else if (cur > 0) {
      runs.push(cur)
      cur = 0
    }
  }
  if (cur > 0) runs.push(cur)
  return runs.length ? runs : [0]
}

function cluesFor(solution: boolean[], n: number): { rows: number[][]; cols: number[][] } {
  const rows: number[][] = []
  const cols: number[][] = []
  for (let r = 0; r < n; r++) rows.push(runsOf(solution.slice(r * n, r * n + n)))
  for (let c = 0; c < n; c++) {
    const line: boolean[] = []
    for (let r = 0; r < n; r++) line.push(solution[r * n + c])
    cols.push(runsOf(line))
  }
  return { rows, cols }
}

/** All bit patterns of length n whose runs match the clue. */
function linePatterns(clue: number[], n: number): boolean[][] {
  const out: boolean[][] = []
  for (let bits = 0; bits < 1 << n; bits++) {
    const line = Array.from({ length: n }, (_, i) => (bits >> i) & 1 ? true : false)
    const runs = runsOf(line)
    if (runs.length === clue.length && runs.every((v, i) => v === clue[i])) out.push(line)
  }
  return out
}

export function countNonogramSolutions(rows: number[][], cols: number[][], n: number, cap = 2): number {
  const rowPats = rows.map((clue) => linePatterns(clue, n))
  let count = 0
  const grid: boolean[][] = []

  const colFeasible = (): boolean => {
    const placed = grid.length
    for (let c = 0; c < n; c++) {
      const clue = cols[c]
      // runs completed so far in this column
      const runs: number[] = []
      let cur = 0
      for (let r = 0; r < placed; r++) {
        if (grid[r][c]) cur++
        else if (cur > 0) {
          runs.push(cur)
          cur = 0
        }
      }
      const clueRuns = clue[0] === 0 ? [] : clue
      // completed runs must match the clue prefix
      for (let i = 0; i < runs.length; i++) {
        if (i >= clueRuns.length || runs[i] !== clueRuns[i]) return false
      }
      // the open run (if any) must fit within the next clue run
      const nextIdx = runs.length
      if (cur > 0 && (nextIdx >= clueRuns.length || cur > clueRuns[nextIdx])) return false
      // remaining cells must be able to hold the remaining runs
      const remainingCells = n - placed
      let need = 0
      for (let i = nextIdx; i < clueRuns.length; i++) need += clueRuns[i] + 1
      if (need > 0) need -= 1
      if (cur > 0 && nextIdx < clueRuns.length) need -= cur
      if (need > remainingCells) return false
    }
    return true
  }

  const dfs = (r: number) => {
    if (count >= cap) return
    if (r === n) {
      count++
      return
    }
    for (const pat of rowPats[r]) {
      grid.push(pat)
      if (colFeasible()) dfs(r + 1)
      grid.pop()
      if (count >= cap) return
    }
  }
  dfs(0)
  return count
}

function randomSolution(n: number, rng: Rng): boolean[] {
  return Array.from({ length: n * n }, () => rng() < 0.5)
}

export function generateNonogram(seed: string, level: number): NonogramPuzzle {
  const n = nonogramSize(level)
  const rng = makeRng(seed)

  if (n === 5) {
    // try the day's picture first, in a rotated order
    const start = randInt(rng, PICTURES.length)
    for (let k = 0; k < PICTURES.length; k++) {
      const pic = PICTURES[(start + k) % PICTURES.length]
      const solution = pic.art.flatMap((row) => [...row].map((ch) => ch === '#'))
      const { rows, cols } = cluesFor(solution, n)
      if (countNonogramSolutions(rows, cols, n) === 1) {
        return { n, rows, cols, solution, picture: { name: pic.name, emoji: pic.emoji } }
      }
    }
  }
  // random unique board (all 7x7 levels; 5x5 fallback)
  for (let attempt = 0; attempt < 500; attempt++) {
    const solution = randomSolution(n, makeRng(`${seed}-a${attempt}`))
    const { rows, cols } = cluesFor(solution, n)
    if (countNonogramSolutions(rows, cols, n) === 1) {
      return { n, rows, cols, solution }
    }
  }
  throw new Error('nonogram generation failed')
}
