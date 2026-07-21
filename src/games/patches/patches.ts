import { makeRng, randInt, type Rng } from '../../engine/rng'

// Patches (Shikaku): divide the grid into rectangles so each rectangle
// contains exactly one number, and covers exactly that many squares.

export interface Rect {
  r0: number
  c0: number
  r1: number
  c1: number
}

export type Shape = 'square' | 'wide' | 'tall'

export interface Clue {
  cell: number
  size: number
  /** Optional shape hint shown on the clue (like LinkedIn's Patches). */
  shape?: Shape
}

export function shapeOf(r: Rect): Shape {
  const h = r.r1 - r.r0 + 1
  const w = r.c1 - r.c0 + 1
  return h === w ? 'square' : w > h ? 'wide' : 'tall'
}

export interface PatchesPuzzle {
  n: number
  clues: Clue[]
  solution: Rect[] // solution[i] is the rectangle for clues[i]
}

export const PATCHES_MAX_LEVEL = 6

export function patchesSize(level: number): number {
  const L = Math.min(Math.max(level, 1), PATCHES_MAX_LEVEL)
  return L <= 2 ? 5 : L <= 4 ? 6 : 7
}

function maxPiece(level: number): number {
  return level <= 2 ? 6 : level <= 4 ? 8 : 9
}

export function rectArea(r: Rect): number {
  return (r.r1 - r.r0 + 1) * (r.c1 - r.c0 + 1)
}

export function rectCells(r: Rect, n: number): number[] {
  const out: number[] = []
  for (let row = r.r0; row <= r.r1; row++) {
    for (let col = r.c0; col <= r.c1; col++) out.push(row * n + col)
  }
  return out
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.r0 <= b.r1 && b.r0 <= a.r1 && a.c0 <= b.c1 && b.c0 <= a.c1
}

/** Randomly split the board into rectangles no bigger than `maxA`. */
function partition(n: number, maxA: number, rng: Rng): Rect[] {
  const out: Rect[] = []
  const stack: Rect[] = [{ r0: 0, c0: 0, r1: n - 1, c1: n - 1 }]
  while (stack.length) {
    const rect = stack.pop()!
    const h = rect.r1 - rect.r0 + 1
    const w = rect.c1 - rect.c0 + 1
    const area = h * w
    // splitting a 1-wide strip shorter than 4 would create a 1x1 piece — never allowed
    const canSplit = h > 1 || w > 1
    const mustAccept = !canSplit || (Math.min(h, w) === 1 && Math.max(h, w) < 4)
    // keep pieces of 2..maxA with some randomness so sizes vary
    if (mustAccept || (area <= maxA && (area <= 2 || rng() < 0.45))) {
      out.push(rect)
      continue
    }
    // split the longer side (random tie-break) at a random line;
    // 1-wide strips split away from the ends so no 1x1 piece can appear
    const splitRows = h === w ? rng() < 0.5 : h > w
    if (splitRows) {
      const lo = w === 1 ? 2 : 1
      const hi = w === 1 ? h - 2 : h - 1
      const at = rect.r0 + lo + randInt(rng, hi - lo + 1)
      stack.push({ ...rect, r1: at - 1 }, { ...rect, r0: at })
    } else {
      const lo = h === 1 ? 2 : 1
      const hi = h === 1 ? w - 2 : w - 1
      const at = rect.c0 + lo + randInt(rng, hi - lo + 1)
      stack.push({ ...rect, c1: at - 1 }, { ...rect, c0: at })
    }
  }
  return out
}

/** All rectangles of a given area/shape that contain `cell` and no other clue cell. */
function candidateRects(n: number, clue: Clue, clueCells: Set<number>): Rect[] {
  const out: Rect[] = []
  const { cell, size, shape } = clue
  const cr = Math.floor(cell / n)
  const cc = cell % n
  for (let h = 1; h <= size; h++) {
    if (size % h !== 0) continue
    const w = size / h
    if (h > n || w > n) continue
    if (shape === 'square' && h !== w) continue
    if (shape === 'wide' && w <= h) continue
    if (shape === 'tall' && h <= w) continue
    for (let r0 = Math.max(0, cr - h + 1); r0 <= cr && r0 + h - 1 < n; r0++) {
      for (let c0 = Math.max(0, cc - w + 1); c0 <= cc && c0 + w - 1 < n; c0++) {
        const rect: Rect = { r0, c0, r1: r0 + h - 1, c1: c0 + w - 1 }
        let ok = true
        for (const cel of rectCells(rect, n)) {
          if (cel !== cell && clueCells.has(cel)) {
            ok = false
            break
          }
        }
        if (ok) out.push(rect)
      }
    }
  }
  return out
}

export function countPatchesSolutions(n: number, clues: Clue[], cap = 2): number {
  const clueCells = new Set(clues.map((c) => c.cell))
  const cands = clues.map((c) => candidateRects(n, c, clueCells))
  const total = n * n
  const covered = new Array<boolean>(total).fill(false)
  const used = new Array<boolean>(clues.length).fill(false)
  let count = 0

  const fits = (rect: Rect): boolean => rectCells(rect, n).every((cel) => !covered[cel])

  const dfs = (coveredCount: number) => {
    if (count >= cap) return
    if (coveredCount === total) {
      count++
      return
    }
    // branch on the uncovered cell with the fewest fitting candidates
    let bestCell = -1
    let bestOptions: { clue: number; rect: Rect }[] | null = null
    for (let cel = 0; cel < total; cel++) {
      if (covered[cel]) continue
      const r = Math.floor(cel / n)
      const c = cel % n
      const options: { clue: number; rect: Rect }[] = []
      for (let i = 0; i < clues.length; i++) {
        if (used[i]) continue
        for (const rect of cands[i]) {
          if (r < rect.r0 || r > rect.r1 || c < rect.c0 || c > rect.c1) continue
          if (fits(rect)) options.push({ clue: i, rect })
        }
      }
      if (bestOptions === null || options.length < bestOptions.length) {
        bestCell = cel
        bestOptions = options
        if (options.length === 0) break
      }
    }
    if (bestCell === -1 || !bestOptions) return
    for (const opt of bestOptions) {
      used[opt.clue] = true
      const cells = rectCells(opt.rect, n)
      cells.forEach((cel) => (covered[cel] = true))
      dfs(coveredCount + cells.length)
      cells.forEach((cel) => (covered[cel] = false))
      used[opt.clue] = false
      if (count >= cap) return
    }
  }

  dfs(0)
  return count
}

export function generatePatches(seed: string, level: number): PatchesPuzzle {
  const n = patchesSize(level)
  for (let attempt = 0; attempt < 300; attempt++) {
    const rng = makeRng(`${seed}-a${attempt}`)
    const rects = partition(n, maxPiece(level), rng)
    if (rects.some((r) => rectArea(r) === 1)) continue // no "1" patches, ever
    // a clue in a random cell of each rectangle; some clues carry a shape hint
    const pShape = level <= 2 ? 0.6 : level <= 4 ? 0.4 : 0.25
    const clues: Clue[] = rects.map((rect) => {
      const cells = rectCells(rect, n)
      const clue: Clue = { cell: cells[randInt(rng, cells.length)], size: rectArea(rect) }
      if (rng() < pShape) clue.shape = shapeOf(rect)
      return clue
    })
    if (countPatchesSolutions(n, clues) === 1) {
      return { n, clues, solution: rects }
    }
  }
  throw new Error('patches generation failed')
}
