import { BOARD_ROWS, DIRS, TRAIL_COLS } from './constants'
import { isLegal, key, reachable, rotate } from './rules'
import type { GameState, Move, Rng } from './types'

type Scored = { move: Move; score: number }
const isDeadEnd = (m: number) => m === 1 || m === 2 || m === 4 || m === 8

/**
 * Picks a move for the current computer player. Hunters push the trail east toward the
 * unrevealed hiding spots; the mischief dog builds dead ends, digs, and distracts.
 */
export function chooseBotMove(s: GameState, rng: Rng): Move {
  const me = s.players[s.turn]
  const mischief = me.role === 'mischief'
  const seen = reachable(s.board)
  const remainingRows = [0, 2, 4].filter((_, gi) => !s.revealed.includes(gi))
  const targetRow = remainingRows.includes(2) ? 2 : remainingRows[0]
  const options: Scored[] = []

  me.hand.forEach((c, card) => {
    if (c.type === 'trail') {
      if (me.blocked) return
      for (let r = 0; r < 4; r++) {
        const mask = rotate(c.mask, r)
        for (let y = 0; y < BOARD_ROWS; y++)
          for (let x = 0; x < TRAIL_COLS; x++) {
            if (!isLegal(s.board, x, y, mask, seen)) continue
            const openExits = DIRS.filter(([dx, dy, bit]) => {
              const nx = x + dx
              const ny = y + dy
              return mask & bit && nx >= 0 && nx < TRAIL_COLS && ny >= 0 && ny < BOARD_ROWS && s.board[key(nx, ny)] === undefined
            }).length
            const score = mischief
              ? (4 - x) * 2 + rng(5) + (isDeadEnd(mask) ? 8 : 0)
              : x * 4 - Math.abs(targetRow - y) * 2 + openExits * 2 + rng(7) / 4
            options.push({ move: { kind: 'trail', card, x, y, mask }, score })
          }
      }
    } else if (c.type === 'treat' && me.blocked) {
      options.push({ move: { kind: 'treat', card, target: s.turn }, score: 30 })
    } else if (c.type === 'squirrel') {
      const targets = s.players.flatMap((q, i) => (i !== s.turn && !q.blocked ? [i] : []))
      if (targets.length)
        options.push({ move: { kind: 'squirrel', card, target: targets[rng(targets.length)] }, score: mischief ? 13 : 1 })
    } else if (c.type === 'dig' && mischief) {
      // Dig up whichever trail reaches furthest east.
      const furthest = Object.keys(s.board)
        .map((k) => k.split(',').map(Number))
        .filter(([x]) => x > 0)
        .sort((a, b) => b[0] - a[0])[0]
      if (furthest) options.push({ move: { kind: 'dig', card, x: furthest[0], y: furthest[1] }, score: 12 })
    } else if (c.type === 'sniff') {
      options.push({ move: { kind: 'sniff', card }, score: 2 })
    }
  })

  options.sort((a, b) => b.score - a.score)
  return options[0]?.move ?? { kind: 'discard', card: rng(me.hand.length) }
}
