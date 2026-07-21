import { makeRng, shuffle, type Rng } from '../../engine/rng'

// Mini Sudoku: 4x4 (2x2 boxes) at low levels, 6x6 (2 rows x 3 cols boxes) after.
// Every puzzle is generated with exactly one solution.

export interface SudokuPuzzle {
  n: number
  boxW: number
  boxH: number
  givens: number[] // 0 = empty
  solution: number[]
}

export interface LevelSpec {
  n: number
  boxW: number
  boxH: number
  targetClues: number
}

export const SUDOKU_MAX_LEVEL = 8

export function levelSpec(level: number): LevelSpec {
  const L = Math.min(Math.max(level, 1), SUDOKU_MAX_LEVEL)
  if (L === 1) return { n: 4, boxW: 2, boxH: 2, targetClues: 9 }
  if (L === 2) return { n: 4, boxW: 2, boxH: 2, targetClues: 7 }
  // 6x6 from level 3, clues 24 down to 14
  const clues = [24, 22, 20, 18, 16, 14][L - 3]
  return { n: 6, boxW: 3, boxH: 2, targetClues: clues }
}

function boxIndex(r: number, c: number, n: number, boxW: number, boxH: number): number {
  const perRow = n / boxW
  return Math.floor(r / boxH) * perRow + Math.floor(c / boxW)
}

function candidatesOk(grid: number[], idx: number, val: number, n: number, boxW: number, boxH: number): boolean {
  const r = Math.floor(idx / n)
  const c = idx % n
  for (let i = 0; i < n; i++) {
    if (grid[r * n + i] === val) return false
    if (grid[i * n + c] === val) return false
  }
  const br = Math.floor(r / boxH) * boxH
  const bc = Math.floor(c / boxW) * boxW
  for (let dr = 0; dr < boxH; dr++) {
    for (let dc = 0; dc < boxW; dc++) {
      if (grid[(br + dr) * n + (bc + dc)] === val) return false
    }
  }
  return true
}

function fillGrid(grid: number[], n: number, boxW: number, boxH: number, rng: Rng): boolean {
  const idx = grid.indexOf(0)
  if (idx === -1) return true
  const vals = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1))
  for (const v of vals) {
    if (candidatesOk(grid, idx, v, n, boxW, boxH)) {
      grid[idx] = v
      if (fillGrid(grid, n, boxW, boxH, rng)) return true
      grid[idx] = 0
    }
  }
  return false
}

export function countSolutions(givens: number[], n: number, boxW: number, boxH: number, cap = 2): number {
  const grid = givens.slice()
  let count = 0
  const step = (): void => {
    if (count >= cap) return
    // most-constrained empty cell first
    let best = -1
    let bestVals: number[] | null = null
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== 0) continue
      const vals: number[] = []
      for (let v = 1; v <= n; v++) if (candidatesOk(grid, i, v, n, boxW, boxH)) vals.push(v)
      if (bestVals === null || vals.length < bestVals.length) {
        best = i
        bestVals = vals
        if (vals.length <= 1) break
      }
    }
    if (best === -1) {
      count++
      return
    }
    for (const v of bestVals!) {
      grid[best] = v
      step()
      grid[best] = 0
      if (count >= cap) return
    }
  }
  step()
  return count
}

export function generateSudoku(seed: string, level: number): SudokuPuzzle {
  const rng = makeRng(seed)
  const { n, boxW, boxH, targetClues } = levelSpec(level)
  const solution = new Array(n * n).fill(0)
  fillGrid(solution, n, boxW, boxH, rng)

  const givens = solution.slice()
  const order = shuffle(rng, Array.from({ length: n * n }, (_, i) => i))
  let clues = n * n
  for (const i of order) {
    if (clues <= targetClues) break
    const saved = givens[i]
    givens[i] = 0
    if (countSolutions(givens, n, boxW, boxH) === 1) {
      clues--
    } else {
      givens[i] = saved
    }
  }
  return { n, boxW, boxH, givens, solution }
}

export { boxIndex }
