import { makeRng, shuffle, randInt, type Rng } from '../../engine/rng'

// Queens (Star Battle, 1 star): place one queen in every row, column, and
// color region; no two queens may touch, even diagonally.

export interface QueensPuzzle {
  n: number
  regions: number[] // region id per cell, 0..n-1
  solution: number[] // queen column for each row
}

export const QUEENS_MAX_LEVEL = 6

export function queensSize(level: number): number {
  const L = Math.min(Math.max(level, 1), QUEENS_MAX_LEVEL)
  return 5 + Math.min(2, Math.floor((L - 1) / 2)) // 5,5,6,6,7,7
}

/** A valid placement: distinct cols, adjacent rows' cols differ by >= 2. */
function randomPlacement(n: number, rng: Rng): number[] | null {
  const cols: number[] = []
  const used = new Set<number>()
  const step = (row: number): boolean => {
    if (row === n) return true
    for (const c of shuffle(rng, Array.from({ length: n }, (_, i) => i))) {
      if (used.has(c)) continue
      if (row > 0 && Math.abs(c - cols[row - 1]) <= 1) continue
      cols.push(c)
      used.add(c)
      if (step(row + 1)) return true
      cols.pop()
      used.delete(c)
    }
    return false
  }
  return step(0) ? cols : null
}

/**
 * Grow n regions from the queen cells until the board is covered.
 * Region sizes are deliberately uneven — a couple of tiny regions pin queens
 * down hard, which is what makes unique solutions common at 6x6/7x7.
 */
function growRegions(n: number, queenCols: number[], rng: Rng): number[] {
  const total = n * n
  const regions = new Array(total).fill(-1)
  const cells: number[][] = []
  for (let r = 0; r < n; r++) {
    const idx = r * n + queenCols[r]
    regions[idx] = r
    cells.push([idx])
  }

  // uneven target sizes: squares of uniforms, normalized, min 1
  const raw = Array.from({ length: n }, () => Math.pow(rng(), 2) + 0.05)
  const sum = raw.reduce((a, b) => a + b, 0)
  const targets = raw.map((w) => Math.max(1, Math.round((w / sum) * total)))

  const frontierOf = (reg: number): number[] => {
    const out: number[] = []
    for (const cell of cells[reg]) {
      const r = Math.floor(cell / n)
      const c = cell % n
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue
        const ni = nr * n + nc
        if (regions[ni] === -1) out.push(ni)
      }
    }
    return out
  }

  const grow = (reg: number): boolean => {
    const frontier = frontierOf(reg)
    if (frontier.length === 0) return false
    const chosen = frontier[randInt(rng, frontier.length)]
    regions[chosen] = reg
    cells[reg].push(chosen)
    return true
  }

  let assigned = n
  // phase 1: grow regions toward their uneven targets
  let stalled = false
  while (assigned < total && !stalled) {
    stalled = true
    for (const reg of shuffle(rng, Array.from({ length: n }, (_, i) => i))) {
      if (cells[reg].length >= targets[reg]) continue
      if (grow(reg)) {
        assigned++
        stalled = false
        if (assigned === total) break
      }
    }
  }
  // phase 2: any leftover cells go to whichever region can reach them
  while (assigned < total) {
    let grew = false
    for (const reg of shuffle(rng, Array.from({ length: n }, (_, i) => i))) {
      if (grow(reg)) {
        assigned++
        grew = true
        if (assigned === total) break
      }
    }
    if (!grew) break // unreachable in a connected grid, but never loop forever
  }
  return regions
}

export function countQueensSolutions(n: number, regions: number[], cap = 2): number {
  let count = 0
  const usedCols = new Set<number>()
  const usedRegions = new Set<number>()
  const cols: number[] = []
  const step = (row: number) => {
    if (count >= cap) return
    if (row === n) {
      count++
      return
    }
    for (let c = 0; c < n; c++) {
      if (usedCols.has(c)) continue
      if (row > 0 && Math.abs(c - cols[row - 1]) <= 1) continue
      const reg = regions[row * n + c]
      if (usedRegions.has(reg)) continue
      usedCols.add(c)
      usedRegions.add(reg)
      cols.push(c)
      step(row + 1)
      cols.pop()
      usedCols.delete(c)
      usedRegions.delete(reg)
      if (count >= cap) return
    }
  }
  step(0)
  return count
}

export function generateQueens(seed: string, level: number): QueensPuzzle {
  const n = queensSize(level)
  for (let attempt = 0; attempt < 500; attempt++) {
    const rng = makeRng(`${seed}-a${attempt}`)
    const placement = randomPlacement(n, rng)
    if (!placement) continue
    const regions = growRegions(n, placement, rng)
    if (countQueensSolutions(n, regions) === 1) {
      return { n, regions, solution: placement }
    }
  }
  // Deterministic fallback should never be reached at these sizes; keep TS happy.
  throw new Error('queens generation failed')
}

/** Returns indices of queens that conflict with another queen or region rules. */
export function queensConflicts(n: number, regions: number[], queens: number[]): Set<number> {
  const conflicts = new Set<number>()
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const a = queens[i]
      const b = queens[j]
      const ar = Math.floor(a / n), ac = a % n
      const br = Math.floor(b / n), bc = b % n
      const sameLine = ar === br || ac === bc || regions[a] === regions[b]
      const touching = Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1
      if (sameLine || touching) {
        conflicts.add(a)
        conflicts.add(b)
      }
    }
  }
  return conflicts
}
