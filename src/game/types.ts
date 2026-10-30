/** Edge bitmask for a trail tile: 1 = up, 2 = right, 4 = down, 8 = left. */
export type Mask = number

/** The three things a sneaky pup can spoil. While any is broken, a pup can't lay trails. */
export type Tool = 'leash' | 'nose' | 'paw'

export type Card =
  | { type: 'path'; mask: Mask; dead: boolean }
  | { type: 'sniff' }
  | { type: 'dig' }
  | { type: 'break'; tool: Tool }
  | { type: 'fix'; tools: Tool[] }

export type CardType = Card['type']

export type Role = 'hunter' | 'sneaky'
export type Mode = 'solo' | 'local'
export type Theme = 'garden' | 'night' | 'pink'
export type BoardSize = 'small' | 'classic' | 'large'
export type Side = 'hunters' | 'sneaky'
export type Phase = 'playing' | 'roundOver' | 'matchOver'
export type GoalContent = 'treasure' | 'rock'

export type PersonaId = 'mochi' | 'biscuit' | 'pepper' | 'coco' | 'milo' | 'taro'

export interface LootCard {
  value: 1 | 2 | 3
  /** Which piece of Nompong's stuff it is; kept for variety in the loot art. */
  item: number
}

export interface Player {
  name: string
  /** Computer dogs have a persona; human players don't. */
  persona: PersonaId | null
  role: Role
  hand: Card[]
  broken: Tool[]
  loot: LootCard[]
  color: string
}

export interface Tile {
  mask: Mask
  /** Dead-end tiles have open edges but a blocked centre, so the scent can't pass through. */
  dead: boolean
}

export interface Claim {
  by: number
  goal: number
  says: GoalContent
}

/**
 * Log entries are stored as message keys plus parameters so the activity feed can be
 * re-rendered in either language. `speaker` marks a line a dog says out loud.
 */
export interface LogEntry {
  key: string
  params: Record<string, string | number>
  time: number
  speaker?: number
}

export interface LastAction {
  player: number
  kind: Move['kind']
  x?: number
  y?: number
  target?: number
  goal?: number
}

export interface RoundResult {
  winner: Side
  /** Player who connected the trail to the treasure. */
  finder?: number
  payouts: { player: number; loot: LootCard[] }[]
}

export interface GameState {
  version: 2
  match: number
  mode: Mode
  /** Missing on saves from before board sizes existed, which were all small. */
  size?: BoardSize
  round: number
  phase: Phase
  /** What Nompong is hunting for this round (index into MISSIONS). */
  mission: number
  /** Which hiding spot (0–2) holds it. */
  treasure: number
  theme: Theme
  turn: number
  deck: Card[]
  lootDeck: LootCard[]
  board: Record<string, Tile>
  /** Hiding spots uncovered by the trail this round. */
  revealed: number[]
  /** knowledge[player][goal]: what that player privately sniffed. */
  knowledge: (GoalContent | null)[][]
  claims: Claim[]
  /** Who pointed a paw at whom this round. */
  accusations: { by: number; target: number }[]
  /** suspicion[observer][target], 0–100. */
  suspicion: number[][]
  accusedThisTurn: boolean
  /** Who opened this round; the next round starts with the dog after them. */
  roundStarter: number
  result?: RoundResult
  /** The most recent move, so the screen can point at what just happened. */
  lastAction?: LastAction
  log: LogEntry[]
  players: Player[]
}

/** A move spends the card at index `card` in the current player's hand and ends the turn. */
export type Move =
  | { kind: 'path'; card: number; x: number; y: number; flipped: boolean }
  | { kind: 'sniff'; card: number; goal: number; claim: GoalContent | null }
  | { kind: 'dig'; card: number; x: number; y: number }
  | { kind: 'break'; card: number; target: number }
  | { kind: 'fix'; card: number; target: number }
  | { kind: 'pass'; card: number }

/** Returns an integer in [0, n). Injected so the rules stay deterministic under test. */
export type Rng = (n: number) => number
