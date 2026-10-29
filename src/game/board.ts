import { BOARD_COLS, BOARD_ROWS, DIRS, GOAL_COLUMN, GOAL_ROWS, START } from './constants'
import type { GameState, Mask } from './types'

export const key = (x: number, y: number) => `${x},${y}`
export const START_KEY = key(START.x, START.y)

/** Rotate a mask clockwise `n` quarter turns. Cards only ever flip (two turns), like the real thing. */
export function rotate(mask: Mask, n = 1): Mask {
  let m = mask
  for (let i = 0; i < n; i++) m = ((m << 1) & 15) | ((m >> 3) & 1)
  return m
}
export const flip = (mask: Mask) => rotate(mask, 2)

export const inBounds = (x: number, y: number) => x >= 0 && x < BOARD_COLS && y >= 0 && y < BOARD_ROWS
export const isStartCell = (x: number, y: number) => x === START.x && y === START.y
export const goalAt = (x: number, y: number): number | null =>
  x === GOAL_COLUMN && (GOAL_ROWS as readonly number[]).includes(y) ? y / 2 : null
export const goalCell = (goal: number) => ({ x: GOAL_COLUMN, y: GOAL_ROWS[goal] })

type Board = GameState['board']

/**
 * Walks the scent out from Nompong. `reached` is every tile touched by the network;
 * `open` is the subset the scent can travel on from (dead ends are reached but stop it).
 */
export function network(board: Board): { reached: Set<string>; open: Set<string> } {
  const reached = new Set([START_KEY])
  const open = new Set([START_KEY])
  const queue: [number, number][] = [[START.x, START.y]]
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
export function isLegal(board: Board, x: number, y: number, mask: Mask, open = network(board).open): boolean {
  if (!inBounds(x, y) || isStartCell(x, y) || goalAt(x, y) !== null || board[key(x, y)]) return false
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
export function goalsReached(board: Board, open = network(board).open): number[] {
  const hits: number[] = []
  GOAL_ROWS.forEach((gy, goal) => {
    for (const [dx, dy, bit] of DIRS) {
      // The tile sits on the opposite side of the goal from the direction it points.
      const tx = GOAL_COLUMN - dx
      const ty = gy - dy
      const k = key(tx, ty)
      if (open.has(k) && board[k].mask & bit) {
        hits.push(goal)
        return
      }
    }
  })
  return hits
}

/** Shortest grid distance from any open trail end to any of `goals`. Infinity when the trail is sealed. */
export function frontierDistance(board: Board, goals: number[], open = network(board).open): number {
  let best = Infinity
  for (const k of open) {
    const [x, y] = k.split(',').map(Number)
    const tile = board[k]
    for (const [dx, dy, bit] of DIRS) {
      const nx = x + dx
      const ny = y + dy
      if (!(tile.mask & bit) || !inBounds(nx, ny) || board[key(nx, ny)]) continue
      for (const g of goals) {
        const c = goalCell(g)
        best = Math.min(best, Math.abs(c.x - nx) + Math.abs(c.y - ny))
      }
    }
  }
  return best
}
