/** Edge bitmask for a trail tile: 1 = up, 2 = right, 4 = down, 8 = left. */
export type Mask = number

export type ActionType = 'sniff' | 'squirrel' | 'treat' | 'dig'
export type Card = { type: 'trail'; mask: Mask } | { type: ActionType }

export type Role = 'hunter' | 'mischief'
export type Mode = 'solo' | 'local'
export type Theme = 'garden' | 'night' | 'pink'
export type Winner = 'hunters' | 'mischief'

export interface Player {
  name: string
  role: Role
  hand: Card[]
  blocked: boolean
  color: string
}

export interface LogEntry {
  icon: string
  name: string
  text: string
  time: number
}

export interface GameState {
  version: 1
  hunt: number
  mode: Mode
  mission: number
  /** Index (0–2) of the hiding spot that holds the treasure. */
  treasure: number
  theme: Theme
  turn: number
  deck: Card[]
  /** Placed trail masks keyed by "x,y". */
  board: Record<string, Mask>
  /** Hiding spots that have been uncovered. */
  revealed: number[]
  ended: boolean
  winner?: Winner
  log: LogEntry[]
  players: Player[]
}

/** A move always spends the card at index `card` in the current player's hand. */
export type Move =
  | { kind: 'trail'; card: number; x: number; y: number; mask: Mask }
  | { kind: 'sniff'; card: number }
  | { kind: 'squirrel'; card: number; target: number }
  | { kind: 'treat'; card: number; target: number }
  | { kind: 'dig'; card: number; x: number; y: number }
  | { kind: 'discard'; card: number }

/** Returns an integer in [0, n). Injected so the rules stay deterministic under test. */
export type Rng = (n: number) => number
