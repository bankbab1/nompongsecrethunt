import { BOARD_SIZES, DIRS } from './constants'
import type { BoardSize, GameState, Mask } from './types'

export const key = (x: number, y: number) => `${x},${y}`

/** Rotate a mask clockwise `n` quarter turns. Cards only ever flip (two turns), like the real thing. */
export function rotate(mask: Mask, n = 1): Mask {
  let m = mask
  for (let i = 0; i < n; i++) m = ((m << 1) & 15) | ((m >> 3) & 1)
  return m
}
export const flip = (mask: Mask) => rotate(mask, 2)

/**
 * Where everything sits on a board of a given size. Nompong starts at the middle of the left
 * edge; the three hiding spots sit on the right edge two rows apart, as in the classic layout,
 * with any extra rows above and below left free for detours.
 */
export interface Geometry {
  cols: number
  rows: number
  start: { x: number; y: number }
  startKey: string
  goals: { x: number; y: number }[]
}

const cache = new Map<BoardSize, Geometry>()
export function geometry(size: BoardSize = 'small'): Geometry {
  let g = cache.get(size)
  if (!g) {
    const { cols, rows } = BOARD_SIZES[size]
    const mid = Math.floor(rows / 2)
    g = {
      cols,
      rows,
      start: { x: 0, y: mid },
      startKey: key(0, mid),
      goals: [mid - 2, mid, mid + 2].map((y) => ({ x: cols - 1, y })),
    }
    cache.set(size, g)
  }
  return g
}
export const geoOf = (s: Pick<GameState, 'size'>) => geometry(s.size)

export const inBounds = (geo: Geometry, x: number, y: number) => x >= 0 && x < geo.cols && y >= 0 && y < geo.rows
export const isStartCell = (geo: Geometry, x: number, y: number) => x === geo.start.x && y === geo.start.y
export function goalAt(geo: Geometry, x: number, y: number): number | null {
  const i = geo.goals.findIndex((g) => g.x === x && g.y === y)
  return i < 0 ? null : i
}

type Board = GameState['board']

/**
 * Walks the scent out from Nompong. `reached` is every tile touched by the network;
 * `open` is the subset the scent can travel on from (dead ends are reached but stop it).
 */
export function network(geo: Geometry, board: Board): { reached: Set<string>; open: Set<string> } {
  const reached = new Set([geo.startKey])
  const open = new Set([geo.startKey])
  const queue: [number, number][] = [[geo.start.x, geo.start.y]]
  while (queue.length) {
    const [x, y] = queue.shift()!
    const tile = board[key(x, y)]
    for (const [dx, dy, bit, opposite] of DIRS) {
      const k = key(x + dx, y + dy)
      const n = board[k]
      if (!(tile.mask & bit) || !n || !(n.mask & opposite) || reached.has(k)) continue
      reached.add(k)
      if (!n.dead) {
        open.add(k)
        queue.push([x + dx, y + dy])
      }
    }
  }
  return { reached, open }
}

/** A trail fits when the cell is free, every neighbouring edge matches, and it touches the open network. */
export function isLegal(
  geo: Geometry,
  board: Board,
  x: number,
  y: number,
  mask: Mask,
  open = network(geo, board).open,
): boolean {
  if (!inBounds(geo, x, y) || isStartCell(geo, x, y) || goalAt(geo, x, y) !== null || board[key(x, y)]) return false
  let connects = false
  for (const [dx, dy, bit, opposite] of DIRS) {
    const k = key(x + dx, y + dy)
    const n = board[k]
    if (!n) continue
    if (Boolean(mask & bit) !== Boolean(n.mask & opposite)) return false
    if (mask & bit && open.has(k)) connects = true
  }
  return connects
}

/** Hiding spots that an open trail now points into. */
export function goalsReached(geo: Geometry, board: Board, open = network(geo, board).open): number[] {
  const hits: number[] = []
  geo.goals.forEach((g, goal) => {
    for (const [dx, dy, bit] of DIRS) {
      // The tile sits on the opposite side of the goal from the direction it points.
      const k = key(g.x - dx, g.y - dy)
      if (open.has(k) && board[k].mask & bit) {
        hits.push(goal)
        return
      }
    }
  })
  return hits
}

/** Empty cells the open trail points into: where the next card could go. */
export function frontier(geo: Geometry, board: Board, open = network(geo, board).open): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = []
  for (const k of open) {
    const [x, y] = k.split(',').map(Number)
    for (const [dx, dy, bit] of DIRS) {
      const nx = x + dx
      const ny = y + dy
      if (board[k].mask & bit && inBounds(geo, nx, ny) && !board[key(nx, ny)] && goalAt(geo, nx, ny) === null)
        cells.push({ x: nx, y: ny })
    }
  }
  return cells
}

/** Shortest grid distance from any open trail end to any of `goals`. Infinity when the trail is sealed. */
export function frontierDistance(geo: Geometry, board: Board, goals: number[], open = network(geo, board).open): number {
  let best = Infinity
  for (const c of frontier(geo, board, open))
    for (const g of goals) best = Math.min(best, Math.abs(geo.goals[g].x - c.x) + Math.abs(geo.goals[g].y - c.y))
  return best
}

/**
 * True when no open trail end points at a free cell and no hiding spot is reachable: the pack
 * can only get going again by digging something up.
 */
export function isSealed(geo: Geometry, board: Board, revealed: number[]): boolean {
  const { open } = network(geo, board)
  const pending = [0, 1, 2].filter((g) => !revealed.includes(g))
  if (!pending.length) return false
  return frontier(geo, board, open).length === 0 && goalsReached(geo, board, open).every((g) => revealed.includes(g))
}
