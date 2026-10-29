import {
  BOARD_ROWS,
  BOT_NAMES,
  DECK_SIZE,
  DIRS,
  DOG_COLORS,
  GOAL_COLUMN,
  GOAL_COUNT,
  HAND_SIZE,
  MISSIONS,
  START,
  TRAIL_COLS,
  TRAIL_MASKS,
} from './constants'
import type { Card, GameState, Mask, Mode, Move, Player, Rng, Winner } from './types'

export const cryptoRng: Rng = (n) => {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] % n
}

export const key = (x: number, y: number) => `${x},${y}`
const START_KEY = key(START.x, START.y)

/** Rotate a mask clockwise `n` quarter turns. */
export function rotate(mask: Mask, n = 1): Mask {
  let m = mask
  for (let i = 0; i < n; i++) m = ((m << 1) & 15) | ((m >> 3) & 1)
  return m
}

export const isGoalCell = (x: number, y: number) => x === GOAL_COLUMN && y % 2 === 0
export const isStartCell = (x: number, y: number) => x === START.x && y === START.y

export function newCard(rng: Rng): Card {
  const n = rng(100)
  if (n < 73) return { type: 'trail', mask: TRAIL_MASKS[rng(TRAIL_MASKS.length)] }
  return { type: n < 82 ? 'sniff' : n < 89 ? 'squirrel' : n < 96 ? 'treat' : 'dig' }
}

export interface NewGameOptions {
  name: string
  mode: Mode
  count: number
  previous?: GameState
  now?: number
}

export function createGame({ name, mode, count, previous, now = Date.now() }: NewGameOptions, rng: Rng): GameState {
  let mission = rng(MISSIONS.length)
  if (previous && mission === previous.mission) mission = (mission + 1 + rng(MISSIONS.length - 1)) % MISSIONS.length

  const deck = Array.from({ length: DECK_SIZE }, () => newCard(rng))
  const players: Player[] = Array.from({ length: count }, (_, i) => ({
    name: i === 0 ? name : BOT_NAMES[i - 1],
    role: 'hunter',
    hand: deck.splice(-HAND_SIZE),
    blocked: false,
    color: DOG_COLORS[i],
  }))
  players[rng(count)].role = 'mischief'

  return {
    version: 1,
    hunt: (previous?.hunt ?? 0) + 1,
    mode,
    mission,
    treasure: rng(GOAL_COUNT),
    theme: previous?.theme ?? 'garden',
    turn: 0,
    deck,
    // Nompong sits on a crossroads with one straight trail already leading out.
    board: { [START_KEY]: 15, [key(1, 2)]: 10 },
    revealed: [],
    ended: false,
    log: [{ icon: '🌱', name: 'A fresh scent!', text: 'The hunt has begun.', time: now }],
    players,
  }
}

/** Every tile connected to Nompong's start through matching edges. */
export function reachable(board: GameState['board']): Set<string> {
  const seen = new Set([START_KEY])
  const queue: [number, number][] = [[START.x, START.y]]
  while (queue.length) {
    const [x, y] = queue.shift()!
    const m = board[key(x, y)]
    for (const [dx, dy, bit, opposite] of DIRS) {
      const k = key(x + dx, y + dy)
      const n = board[k]
      if (m & bit && n && n & opposite && !seen.has(k)) {
        seen.add(k)
        queue.push([x + dx, y + dy])
      }
    }
  }
  return seen
}

/** A trail fits when the cell is free, every neighbouring edge matches, and it extends Nompong's network. */
export function isLegal(board: GameState['board'], x: number, y: number, mask: Mask, seen = reachable(board)): boolean {
  if (x < 0 || x >= TRAIL_COLS || y < 0 || y >= BOARD_ROWS || board[key(x, y)] !== undefined) return false
  let connects = false
  for (const [dx, dy, bit, opposite] of DIRS) {
    const k = key(x + dx, y + dy)
    const n = board[k]
    if (n === undefined) continue
    if (Boolean(mask & bit) !== Boolean(n & opposite)) return false
    if (mask & bit && seen.has(k)) connects = true
  }
  return connects
}

export class IllegalMove extends Error {}

function addLog(s: GameState, icon: string, name: string, text: string, now: number) {
  s.log = [{ icon, name, text, time: now }, ...s.log].slice(0, 30)
}

/**
 * Plays a move for the current player and returns the next state: the card is spent, a
 * replacement drawn, hiding spots checked, and the turn passed on. Throws IllegalMove with
 * a player-facing message when the move breaks a rule; the input state is never mutated.
 */
export function applyMove(state: GameState, move: Move, now = Date.now()): GameState {
  if (state.ended) throw new IllegalMove('The hunt is already over.')
  const s = structuredClone(state)
  const p = s.players[s.turn]
  const card = p.hand[move.card]
  if (!card) throw new IllegalMove('Choose a card first.')
  if (move.kind !== 'discard' && card.type !== move.kind) throw new IllegalMove('That card can’t do that.')

  switch (move.kind) {
    case 'trail': {
      if (p.blocked) throw new IllegalMove('Squirrel trouble! Use a treat or discard a card.')
      const shape = card.type === 'trail' ? card.mask : 0
      if (![0, 1, 2, 3].some((r) => rotate(shape, r) === move.mask))
        throw new IllegalMove('That trail shape doesn’t match the card.')
      if (!isLegal(s.board, move.x, move.y, move.mask))
        throw new IllegalMove('Trails must connect to Nompong and match every neighboring edge.')
      s.board[key(move.x, move.y)] = move.mask
      addLog(s, '🐾', p.name, 'added a scent trail.', now)
      break
    }
    case 'sniff':
      addLog(s, '👃', p.name, 'took a secret sniff.', now)
      break
    case 'squirrel': {
      const target = s.players[move.target]
      if (!target || move.target === s.turn) throw new IllegalMove('Choose another dog.')
      if (target.blocked) throw new IllegalMove('That dog is already distracted.')
      target.blocked = true
      addLog(s, '🐿️', p.name, `distracted ${target.name}.`, now)
      break
    }
    case 'treat': {
      const target = s.players[move.target]
      if (!target?.blocked) throw new IllegalMove('That dog is already focused. Save your treat!')
      target.blocked = false
      const text = move.target === s.turn ? 'enjoyed a treat and focused again.' : `gave ${target.name} a good dog treat.`
      addLog(s, '🦴', p.name, text, now)
      break
    }
    case 'dig': {
      const k = key(move.x, move.y)
      if (s.board[k] === undefined || k === START_KEY)
        throw new IllegalMove('Choose a trail tile. Nompong’s start is protected.')
      delete s.board[k]
      addLog(s, '🪏', p.name, 'dug up a trail.', now)
      break
    }
    case 'discard':
      addLog(s, '🍃', p.name, 'dropped a card and waited.', now)
      break
  }

  p.hand.splice(move.card, 1)
  const drawn = s.deck.pop()
  if (drawn) p.hand.push(drawn)

  if (revealReachedGoals(s, now)) return endGame(s, 'hunters', now)
  if (s.players.every((q) => !q.hand.length)) return endGame(s, 'mischief', now)

  do s.turn = (s.turn + 1) % s.players.length
  while (!s.players[s.turn].hand.length)
  return s
}

/** Uncovers any hiding spot the network now reaches; true when one of them is the treasure. */
function revealReachedGoals(s: GameState, now: number): boolean {
  const seen = reachable(s.board)
  for (let gi = 0; gi < GOAL_COUNT; gi++) {
    const k = key(GOAL_COLUMN - 1, gi * 2)
    if (!seen.has(k) || !(s.board[k] & 2) || s.revealed.includes(gi)) continue
    s.revealed.push(gi)
    if (gi === s.treasure) return true
    addLog(s, '🪨', 'A little detour.', `The pack found a rock at hiding spot ${gi + 1}.`, now)
  }
  return false
}

function endGame(s: GameState, winner: Winner, now: number): GameState {
  s.ended = true
  s.winner = winner
  s.revealed = [0, 1, 2]
  if (winner === 'hunters') addLog(s, '🎉', 'Treasure found!', 'The hunters followed the right scent.', now)
  else addLog(s, '🐿️', 'A sneaky little victory.', 'The pack ran out of moves.', now)
  return s
}

export function isSavedGame(value: unknown): value is GameState {
  const v = value as GameState | null
  return v?.version === 1 && Array.isArray(v.players) && v.players.length >= 3
}
