import { describe, it, expect } from 'vitest'
import { generateSudoku, countSolutions, levelSpec, SUDOKU_MAX_LEVEL } from './sudoku/sudoku'
import { generateQueens, countQueensSolutions, QUEENS_MAX_LEVEL } from './queens/queens'
import { generateZip, countZipSolutions, ZIP_MAX_LEVEL } from './zip/zip'
import {
  generatePatches,
  countPatchesSolutions,
  rectArea,
  rectCells,
  PATCHES_MAX_LEVEL,
} from './patches/patches'
import { generateTango, countTangoSolutions, tangoViolations, TANGO_MAX_LEVEL } from './tango/tango'
import { generateNonogram, countNonogramSolutions, runsOf, NONOGRAM_MAX_LEVEL } from './nonogram/nonogram'
import { answerFor, scoreGuess, wordLength } from './wordy/wordy'

const SEEDS = ['2026-07-21', '2026-07-22', '2026-08-01']

describe('sudoku generator', () => {
  for (const level of [1, 3, SUDOKU_MAX_LEVEL]) {
    for (const seed of SEEDS) {
      it(`level ${level} seed ${seed}: unique solution, valid givens`, () => {
        const p = generateSudoku(`sudoku-${seed}-L${level}`, level)
        const spec = levelSpec(level)
        expect(p.n).toBe(spec.n)
        // givens are a subset of the solution
        p.givens.forEach((v, i) => {
          if (v !== 0) expect(v).toBe(p.solution[i])
        })
        expect(countSolutions(p.givens, p.n, p.boxW, p.boxH)).toBe(1)
        // solution is fully filled
        expect(p.solution.every((v) => v >= 1 && v <= p.n)).toBe(true)
      })
    }
  }
})

describe('queens generator', () => {
  for (const level of [1, 3, QUEENS_MAX_LEVEL]) {
    for (const seed of SEEDS) {
      it(`level ${level} seed ${seed}: unique valid solution`, () => {
        const p = generateQueens(`queens-${seed}-L${level}`, level)
        expect(countQueensSolutions(p.n, p.regions)).toBe(1)
        // solution satisfies all constraints
        const cols = new Set(p.solution)
        expect(cols.size).toBe(p.n)
        const regs = new Set(p.solution.map((c, r) => p.regions[r * p.n + c]))
        expect(regs.size).toBe(p.n)
        for (let r = 1; r < p.n; r++) {
          expect(Math.abs(p.solution[r] - p.solution[r - 1])).toBeGreaterThan(1)
        }
        // regions cover the board with ids 0..n-1
        expect(p.regions.every((x) => x >= 0 && x < p.n)).toBe(true)
      })
    }
  }
})

describe('zip generator', () => {
  for (const level of [1, 3, ZIP_MAX_LEVEL]) {
    for (const seed of SEEDS) {
      it(`level ${level} seed ${seed}: unique hamiltonian solution through waypoints`, () => {
        const p = generateZip(`zip-${seed}-L${level}`, level)
        const total = p.n * p.n
        // solution is a hamiltonian path
        expect(new Set(p.solution).size).toBe(total)
        for (let i = 1; i < total; i++) {
          const a = p.solution[i - 1]
          const b = p.solution[i]
          const dist =
            Math.abs(Math.floor(a / p.n) - Math.floor(b / p.n)) + Math.abs((a % p.n) - (b % p.n))
          expect(dist).toBe(1)
        }
        // waypoints appear along the solution in order, start to end
        const posOf = new Map(p.solution.map((c, i) => [c, i]))
        const positions = p.waypoints.map((w) => posOf.get(w)!)
        expect(positions[0]).toBe(0)
        expect(positions[positions.length - 1]).toBe(total - 1)
        for (let i = 1; i < positions.length; i++) {
          expect(positions[i]).toBeGreaterThan(positions[i - 1])
        }
        expect(countZipSolutions(p.n, p.waypoints)).toBe(1)
      })
    }
  }
})

describe('patches generator', () => {
  for (const level of [1, 3, PATCHES_MAX_LEVEL]) {
    for (const seed of SEEDS) {
      it(`level ${level} seed ${seed}: unique exact-cover solution`, () => {
        const p = generatePatches(`patches-${seed}-L${level}`, level)
        const total = p.n * p.n
        // solution rectangles tile the board exactly
        const covered = new Set<number>()
        p.solution.forEach((r) => rectCells(r, p.n).forEach((c) => covered.add(c)))
        expect(covered.size).toBe(total)
        expect(p.solution.reduce((s, r) => s + rectArea(r), 0)).toBe(total)
        // each solution rect contains exactly its own clue with matching size
        expect(p.solution.length).toBe(p.clues.length)
        p.solution.forEach((r, i) => {
          const cells = rectCells(r, p.n)
          const inside = p.clues.filter((c) => cells.includes(c.cell))
          expect(inside.length).toBe(1)
          expect(inside[0].cell).toBe(p.clues[i].cell)
          expect(inside[0].size).toBe(rectArea(r))
        })
        expect(countPatchesSolutions(p.n, p.clues)).toBe(1)
      })
    }
  }
})

describe('patches shape hints and no-1 rule', () => {
  for (const level of [1, 4, PATCHES_MAX_LEVEL]) {
    for (const seed of SEEDS) {
      it(`level ${level} seed ${seed}: no size-1 clues, shape hints truthful`, () => {
        const p = generatePatches(`patches2-${seed}-L${level}`, level)
        p.clues.forEach((c) => expect(c.size).toBeGreaterThan(1))
        p.solution.forEach((r, i) => {
          const clue = p.clues[i]
          if (clue.shape) {
            const h = r.r1 - r.r0 + 1
            const w = r.c1 - r.c0 + 1
            const actual = h === w ? 'square' : w > h ? 'wide' : 'tall'
            expect(clue.shape).toBe(actual)
          }
        })
      })
    }
  }
})

describe('tango generator', () => {
  for (const level of [1, 3, TANGO_MAX_LEVEL]) {
    for (const seed of SEEDS) {
      it(`level ${level} seed ${seed}: unique, rules hold, constraints truthful`, () => {
        const p = generateTango(`tango-${seed}-L${level}`, level)
        expect(countTangoSolutions(p.n, p.givens, p.constraints)).toBe(1)
        expect(tangoViolations(p.solution, p.n, p.constraints).size).toBe(0)
        // givens agree with the solution
        p.givens.forEach((v, i) => {
          if (v !== 0) expect(v).toBe(p.solution[i])
        })
        // equal counts per row/col in solution
        const half = p.n / 2
        for (let r = 0; r < p.n; r++) {
          const suns = p.solution.slice(r * p.n, r * p.n + p.n).filter((v) => v === 1).length
          expect(suns).toBe(half)
        }
        p.constraints.forEach((c) =>
          expect(c.eq).toBe(p.solution[c.a] === p.solution[c.b]),
        )
      })
    }
  }
})

describe('nonogram generator', () => {
  for (const level of [1, 4, NONOGRAM_MAX_LEVEL]) {
    for (const seed of SEEDS) {
      it(`level ${level} seed ${seed}: unique solution matching clues`, () => {
        const p = generateNonogram(`nono-${seed}-L${level}`, level)
        expect(countNonogramSolutions(p.rows, p.cols, p.n)).toBe(1)
        for (let r = 0; r < p.n; r++) {
          expect(runsOf(p.solution.slice(r * p.n, r * p.n + p.n))).toEqual(p.rows[r])
        }
      })
    }
  }
})

describe('wordy', () => {
  it('answers are deterministic and length-correct per level', () => {
    for (const level of [1, 2, 4]) {
      const a = answerFor(`wordy-x-L${level}`, level)
      expect(a).toBe(answerFor(`wordy-x-L${level}`, level))
      expect(a.length).toBe(wordLength(level))
    }
  })
  it('scores duplicate letters like wordle', () => {
    expect(scoreGuess('LLLL', 'LAOL')).toEqual(['correct', 'absent', 'absent', 'correct'])
    expect(scoreGuess('BOOK', 'TOOL')).toEqual(['absent', 'correct', 'correct', 'absent'])
    expect(scoreGuess('OTTO', 'TOOT')).toEqual(['present', 'present', 'present', 'present'])
  })
})
