import { makeRng, randInt, shuffle, type Rng } from '../../engine/rng'

// Tango (Takuzu): fill the grid with suns (1) and moons (2) so each row and
// column has equal counts and never three of the same in a row. "=" links
// must match, "x" links must differ.

export interface TangoConstraint {
  a: number // cell index
  b: number // adjacent cell index (right or below a)
  eq: boolean
}

export interface TangoPuzzle {
  n: number
  givens: number[] // 0 empty, 1 sun, 2 moon
  solution: number[]
  constraints: TangoConstraint[]
}

export const TANGO_MAX_LEVEL = 6

export function tangoSize(level: number): number {
  return Math.min(Math.max(level, 1), TANGO_MAX_LEVEL) <= 2 ? 4 : 6
}

function targetGivens(level: number): number {
  return [8, 6, 14, 11, 9, 7][Math.min(Math.max(level, 1), TANGO_MAX_LEVEL) - 1]
}

function constraintCount(level: number): number {
  return [2, 3, 4, 5, 6, 6][Math.min(Math.max(level, 1), TANGO_MAX_LEVEL) - 1]
}

/** Rule check for placing `val` at `idx` given the current grid. */
export function tangoPlacementOk(
  grid: number[],
  idx: number,
  val: number,
  n: number,
  constraints: TangoConstraint[],
): boolean {
  const r = Math.floor(idx / n)
  const c = idx % n
  const at = (rr: number, cc: number) => grid[rr * n + cc]

  // no three in a row (check the three windows containing this cell, both axes)
  for (let s = c - 2; s <= c; s++) {
    if (s < 0 || s + 2 >= n) continue
    let same = 0
    for (let k = s; k <= s + 2; k++) {
      const v = k === c ? val : at(r, k)
      if (v === val) same++
    }
    if (same === 3) return false
  }
  for (let s = r - 2; s <= r; s++) {
    if (s < 0 || s + 2 >= n) continue
    let same = 0
    for (let k = s; k <= s + 2; k++) {
      const v = k === r ? val : at(k, c)
      if (v === val) same++
    }
    if (same === 3) return false
  }

  // per-row / per-column counts never exceed half
  const half = n / 2
  let rowCount = 1
  for (let cc = 0; cc < n; cc++) if (cc !== c && at(r, cc) === val) rowCount++
  if (rowCount > half) return false
  let colCount = 1
  for (let rr = 0; rr < n; rr++) if (rr !== r && at(rr, c) === val) colCount++
  if (colCount > half) return false

  // links touching this cell
  for (const con of constraints) {
    if (con.a !== idx && con.b !== idx) continue
    const other = con.a === idx ? grid[con.b] : grid[con.a]
    if (other === 0) continue
    if (con.eq && other !== val) return false
    if (!con.eq && other === val) return false
  }
  return true
}

export function countTangoSolutions(
  n: number,
  givens: number[],
  constraints: TangoConstraint[],
  cap = 2,
): number {
  const grid = givens.slice()
  let count = 0
  const step = () => {
    if (count >= cap) return
    const idx = grid.indexOf(0)
    if (idx === -1) {
      count++
      return
    }
    for (const val of [1, 2]) {
      if (tangoPlacementOk(grid, idx, val, n, constraints)) {
        grid[idx] = val
        step()
        grid[idx] = 0
        if (count >= cap) return
      }
    }
  }
  step()
  return count
}

function fillSolution(n: number, rng: Rng): number[] | null {
  const grid = new Array(n * n).fill(0)
  const step = (): boolean => {
    const idx = grid.indexOf(0)
    if (idx === -1) return true
    for (const val of shuffle(rng, [1, 2])) {
      if (tangoPlacementOk(grid, idx, val, n, [])) {
        grid[idx] = val
        if (step()) return true
        grid[idx] = 0
      }
    }
    return false
  }
  return step() ? grid : null
}

export function generateTango(seed: string, level: number): TangoPuzzle {
  const n = tangoSize(level)
  for (let attempt = 0; attempt < 100; attempt++) {
    const rng = makeRng(`${seed}-a${attempt}`)
    const solution = fillSolution(n, rng)
    if (!solution) continue

    // random adjacent-pair links, labelled from the solution
    const pairs: [number, number][] = []
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const i = r * n + c
        if (c + 1 < n) pairs.push([i, i + 1])
        if (r + 1 < n) pairs.push([i, i + n])
      }
    }
    const constraints: TangoConstraint[] = shuffle(rng, pairs)
      .slice(0, constraintCount(level))
      .map(([a, b]) => ({ a, b, eq: solution[a] === solution[b] }))

    // start fully given, remove while the solution stays unique
    const givens = solution.slice()
    let remaining = n * n
    for (const i of shuffle(rng, Array.from({ length: n * n }, (_, k) => k))) {
      if (remaining <= targetGivens(level)) break
      const saved = givens[i]
      givens[i] = 0
      if (countTangoSolutions(n, givens, constraints) === 1) remaining--
      else givens[i] = saved
    }
    return { n, givens, solution, constraints }
  }
  throw new Error('tango generation failed')
}

/** Cells currently breaking a rule (for mistake highlighting). */
export function tangoViolations(
  grid: number[],
  n: number,
  constraints: TangoConstraint[],
): Set<number> {
  const bad = new Set<number>()
  const at = (r: number, c: number) => grid[r * n + c]
  const half = n / 2

  for (let r = 0; r < n; r++) {
    for (let c = 0; c + 2 < n; c++) {
      const v = at(r, c)
      if (v !== 0 && v === at(r, c + 1) && v === at(r, c + 2)) {
        bad.add(r * n + c).add(r * n + c + 1).add(r * n + c + 2)
      }
    }
  }
  for (let c = 0; c < n; c++) {
    for (let r = 0; r + 2 < n; r++) {
      const v = at(r, c)
      if (v !== 0 && v === at(r + 1, c) && v === at(r + 2, c)) {
        bad.add(r * n + c).add((r + 1) * n + c).add((r + 2) * n + c)
      }
    }
  }
  for (let r = 0; r < n; r++) {
    for (const val of [1, 2]) {
      const cells = []
      for (let c = 0; c < n; c++) if (at(r, c) === val) cells.push(r * n + c)
      if (cells.length > half) cells.forEach((i) => bad.add(i))
    }
  }
  for (let c = 0; c < n; c++) {
    for (const val of [1, 2]) {
      const cells = []
      for (let r = 0; r < n; r++) if (at(r, c) === val) cells.push(r * n + c)
      if (cells.length > half) cells.forEach((i) => bad.add(i))
    }
  }
  for (const con of constraints) {
    const va = grid[con.a]
    const vb = grid[con.b]
    if (va === 0 || vb === 0) continue
    if ((con.eq && va !== vb) || (!con.eq && va === vb)) {
      bad.add(con.a).add(con.b)
    }
  }
  return bad
}

export { randInt }
