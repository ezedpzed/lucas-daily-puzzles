import { describe, it, expect } from 'vitest'
import { generateSudoku, countSolutions, levelSpec, SUDOKU_MAX_LEVEL } from './sudoku/sudoku'
import { generateQueens, countQueensSolutions, QUEENS_MAX_LEVEL } from './queens/queens'
import { generateZip, countZipSolutions, ZIP_MAX_LEVEL } from './zip/zip'

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
