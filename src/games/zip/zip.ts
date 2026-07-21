import { makeRng, shuffle, type Rng } from '../../engine/rng'

// Zip: drag one continuous path through every cell, hitting the numbered
// waypoints in order. Path starts at 1 and ends at the highest number.

export interface ZipPuzzle {
  n: number
  waypoints: number[] // cell index of waypoint k at position k (0-based order)
  solution: number[] // full ordered path of cell indices
}

export const ZIP_MAX_LEVEL = 6

export function zipSize(level: number): number {
  return Math.min(Math.max(level, 1), ZIP_MAX_LEVEL) <= 2 ? 5 : 6
}

function initialWaypointCount(level: number, n: number): number {
  const base = n === 5 ? 7 : 9
  return Math.max(4, base - Math.floor((level - 1) / 2))
}

function neighbors(idx: number, n: number): number[] {
  const r = Math.floor(idx / n)
  const c = idx % n
  const out: number[] = []
  if (r > 0) out.push(idx - n)
  if (r < n - 1) out.push(idx + n)
  if (c > 0) out.push(idx - 1)
  if (c < n - 1) out.push(idx + 1)
  return out
}

/** Randomized Hamiltonian path via DFS with a Warnsdorff-style heuristic. */
function genHamiltonianPath(n: number, rng: Rng): number[] | null {
  const total = n * n
  const visited = new Array(total).fill(false)
  const path: number[] = []
  const start = Math.floor(rng() * total)

  const degree = (idx: number) => neighbors(idx, n).filter((x) => !visited[x]).length

  const dfs = (cur: number, budget: { steps: number }): boolean => {
    if (budget.steps-- <= 0) return false
    visited[cur] = true
    path.push(cur)
    if (path.length === total) return true
    const next = shuffle(rng, neighbors(cur, n).filter((x) => !visited[x])).sort(
      (a, b) => degree(a) - degree(b),
    )
    for (const nx of next) {
      if (dfs(nx, budget)) return true
    }
    visited[cur] = false
    path.pop()
    return false
  }

  return dfs(start, { steps: 60000 }) ? path : null
}

/**
 * Count Hamiltonian paths that start at waypoint 0, end at the last waypoint,
 * and visit waypoints in order. Capped; a blown node budget counts as "not
 * unique" so the generator adds another waypoint instead of stalling.
 */
export function countZipSolutions(n: number, waypoints: number[], cap = 2): number {
  const total = n * n
  const wpOrder = new Map<number, number>()
  waypoints.forEach((cell, k) => wpOrder.set(cell, k))
  const last = waypoints.length - 1
  const visited = new Array(total).fill(false)
  let count = 0
  let nodes = 0
  const NODE_BUDGET = 400000

  const reachableOk = (head: number, visitedCount: number): boolean => {
    // all unvisited cells must be reachable from the head
    const seen = new Set<number>()
    const stack = [head]
    seen.add(head)
    while (stack.length) {
      const cur = stack.pop()!
      for (const nx of neighbors(cur, n)) {
        if (!visited[nx] && !seen.has(nx)) {
          seen.add(nx)
          stack.push(nx)
        }
      }
    }
    return seen.size === total - visitedCount + 1
  }

  const dfs = (cur: number, visitedCount: number, nextWp: number) => {
    if (count >= cap || nodes++ > NODE_BUDGET) return
    if (visitedCount === total) {
      if (nextWp === waypoints.length) count++
      return
    }
    if (!reachableOk(cur, visitedCount)) return
    for (const nx of neighbors(cur, n)) {
      if (visited[nx]) continue
      const w = wpOrder.get(nx)
      if (w !== undefined) {
        if (w !== nextWp) continue // waypoints must be hit in order
        if (w === last && visitedCount + 1 !== total) continue // last waypoint must be final cell
      }
      visited[nx] = true
      dfs(nx, visitedCount + 1, w !== undefined ? nextWp + 1 : nextWp)
      visited[nx] = false
      if (count >= cap) return
    }
  }

  visited[waypoints[0]] = true
  dfs(waypoints[0], 1, 1)
  if (nodes > NODE_BUDGET) return cap // treat as ambiguous
  return count
}

function pickWaypoints(path: number[], count: number): number[] {
  const total = path.length
  const positions = new Set<number>([0, total - 1])
  for (let k = 1; k < count - 1; k++) {
    positions.add(Math.round((k * (total - 1)) / (count - 1)))
  }
  return [...positions].sort((a, b) => a - b).map((p) => path[p])
}

/** Insert an extra waypoint in the middle of the largest gap along the path. */
function addWaypoint(path: number[], waypoints: number[]): number[] {
  const posOf = new Map<number, number>()
  path.forEach((cell, p) => posOf.set(cell, p))
  const positions = waypoints.map((w) => posOf.get(w)!)
  let bestGap = 0
  let insertAt = -1
  let newPos = -1
  for (let i = 0; i + 1 < positions.length; i++) {
    const gap = positions[i + 1] - positions[i]
    if (gap > bestGap && gap >= 2) {
      bestGap = gap
      insertAt = i + 1
      newPos = positions[i] + Math.floor(gap / 2)
    }
  }
  if (insertAt === -1) return waypoints
  const next = waypoints.slice()
  next.splice(insertAt, 0, path[newPos])
  return next
}

export function generateZip(seed: string, level: number): ZipPuzzle {
  const n = zipSize(level)
  for (let attempt = 0; attempt < 50; attempt++) {
    const rng = makeRng(`${seed}-a${attempt}`)
    const path = genHamiltonianPath(n, rng)
    if (!path) continue
    let waypoints = pickWaypoints(path, initialWaypointCount(level, n))
    // add waypoints until the solution is unique
    for (let tries = 0; tries < n * n; tries++) {
      if (countZipSolutions(n, waypoints) === 1) {
        return { n, waypoints, solution: path }
      }
      const more = addWaypoint(path, waypoints)
      if (more.length === waypoints.length) break // no room left; regenerate
      waypoints = more
    }
  }
  throw new Error('zip generation failed')
}
