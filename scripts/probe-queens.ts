// Dev probe: measure how often region growth yields a unique Queens puzzle.
import { generateQueens } from '../src/games/queens/queens'

for (const level of [1, 3, 5, 6]) {
  const t0 = Date.now()
  let ok = 0
  let fail = 0
  for (let d = 0; d < 20; d++) {
    try {
      generateQueens(`probe-${d}`, level)
      ok++
    } catch {
      fail++
    }
  }
  console.log(`level ${level}: ok=${ok} fail=${fail} in ${Date.now() - t0}ms`)
}
