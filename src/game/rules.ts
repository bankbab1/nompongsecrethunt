import { flip, frontierDistance, goalsReached, isLegal, key, network, START_KEY } from './board'
import {
  buildDeck,
  handSize,
  HUMAN_COLORS,
  LOOT_COUNTS,
  MISSIONS,
  PERSONA_IDS,
  PERSONAS,
  ROLE_DECK,
  ROUNDS,
  sneakyPayout,
} from './constants'
import { bumpAll, initialSuspicion, onAccuse, onBreak, onClaim, onFix, onReveal } from './suspicion'
import type { GameState, GoalContent, LogEntry, LootCard, Mode, Move, Player, Rng, RoundResult, Side } from './types'

export const cryptoRng: Rng = (n) => {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] % n
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng(i + 1)
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export class IllegalMove extends Error {}

function log(s: GameState, entry: Omit<LogEntry, 'time'>, now: number) {
  s.log = [{ ...entry, time: now }, ...s.log].slice(0, 60)
}

/** A computer dog says something in character, if it's chatty enough right now. */
function say(s: GameState, speaker: number, line: string, params: LogEntry['params'], rng: Rng, now: number, force = false) {
  const persona = s.players[speaker].persona
  if (!persona || (!force && rng(100) >= PERSONAS[persona].chat * 100)) return
  log(s, { icon: PERSONAS[persona].emoji, key: `say.${persona}.${line}`, params: { ...params, v: rng(3) }, speaker }, now)
}

export interface NewMatchOptions {
  mode: Mode
  /** Player names; the first is always the person holding the device. */
  names: string[]
  previous?: GameState
  now?: number
}

export function createMatch({ mode, names, previous, now = Date.now() }: NewMatchOptions, rng: Rng): GameState {
  const personas = shuffle([...PERSONA_IDS], rng)
  const players: Player[] = names.map((name, i) => {
    const persona = mode === 'solo' && i > 0 ? personas[i - 1] : null
    return {
      name: persona ? PERSONAS[persona].name : name,
      persona,
      role: 'hunter',
      hand: [],
      broken: [],
      loot: [],
      color: persona ? PERSONAS[persona].color : HUMAN_COLORS[i],
    }
  })
  const lootDeck: LootCard[] = []
  for (const value of [1, 2, 3] as const)
    for (let i = 0; i < LOOT_COUNTS[value]; i++) lootDeck.push({ value, item: rng(value === 1 ? 3 : 2) })

  const s: GameState = {
    version: 2,
    match: (previous?.match ?? 0) + 1,
    mode,
    round: 0,
    phase: 'playing',
    mission: 0,
    treasure: 0,
    theme: previous?.theme ?? 'garden',
    turn: 0,
    deck: [],
    lootDeck: shuffle(lootDeck, rng),
    board: {},
    revealed: [],
    knowledge: [],
    claims: [],
    accusations: [],
    suspicion: [],
    accusedThisTurn: false,
    roundStarter: rng(players.length),
    log: [],
    players,
  }
  return startRound(s, rng, now, previous?.mission)
}

/** Deals a fresh round: new roles, new garden, new thing to hunt. Loot carries over. */
export function startRound(state: GameState, rng: Rng, now = Date.now(), lastMission = state.mission): GameState {
  const s = structuredClone(state)
  const n = s.players.length
  const { sneaky, hunters } = ROLE_DECK[n]
  const roles = shuffle([...Array(sneaky).fill('sneaky'), ...Array(hunters).fill('hunter')], rng)
  const deck = shuffle(buildDeck(), rng)

  let mission = rng(MISSIONS.length)
  if (mission === lastMission) mission = (mission + 1 + rng(MISSIONS.length - 1)) % MISSIONS.length

  s.round += 1
  s.phase = 'playing'
  s.mission = mission
  s.treasure = rng(3)
  s.board = { [START_KEY]: { mask: 15, dead: false } }
  s.revealed = []
  s.claims = []
  s.accusations = []
  s.result = undefined
  s.accusedThisTurn = false
  s.players.forEach((p, i) => {
    p.role = roles[i]
    p.broken = []
    p.hand = deck.splice(-handSize(n))
  })
  s.deck = deck
  s.knowledge = s.players.map(() => [null, null, null])
  s.suspicion = initialSuspicion(s.players)
  if (s.round > 1) s.roundStarter = (s.roundStarter + 1) % n
  s.turn = s.roundStarter
  log(s, { icon: '🌱', key: 'log.roundStart', params: { round: s.round, item: MISSIONS[mission] } }, now)
  return s
}

/** Pointing a paw is free, once per turn, and doesn't end the turn. */
export function accuse(state: GameState, target: number, rng: Rng, now = Date.now()): GameState {
  if (state.phase !== 'playing') throw new IllegalMove('error.over')
  if (state.accusedThisTurn) throw new IllegalMove('error.alreadyAccused')
  if (target === state.turn || !state.players[target]) throw new IllegalMove('error.accuseSelf')
  const s = structuredClone(state)
  const me = s.players[s.turn]
  s.accusedThisTurn = true
  s.accusations.push({ by: s.turn, target })
  onAccuse(s, s.turn, target)
  if (me.persona) say(s, s.turn, 'accuse', { target: s.players[target].name }, rng, now, true)
  else log(s, { icon: '👉', key: 'log.accuse', params: { name: me.name, target: s.players[target].name } }, now)
  say(s, target, 'defend', { name: me.name }, rng, now)
  return s
}

/**
 * Plays a move for the current player and returns the next state. Throws IllegalMove
 * (whose message is an i18n key) when the move breaks a rule; the input is never mutated.
 */
export function applyMove(state: GameState, move: Move, rng: Rng, now = Date.now()): GameState {
  if (state.phase !== 'playing') throw new IllegalMove('error.over')
  const s = structuredClone(state)
  const actor = s.turn
  const p = s.players[actor]
  const card = p.hand[move.card]
  if (!card) throw new IllegalMove('error.noCard')
  if (move.kind !== 'pass' && card.type !== move.kind) throw new IllegalMove('error.wrongCard')

  switch (move.kind) {
    case 'path': {
      if (card.type !== 'path') break
      if (p.broken.length) throw new IllegalMove('error.broken')
      const mask = move.flipped ? flip(card.mask) : card.mask
      const before = network(s.board)
      if (!isLegal(s.board, move.x, move.y, mask, before.open)) throw new IllegalMove('error.illegalPath')
      const unrevealed = [0, 1, 2].filter((g) => !s.revealed.includes(g))
      const distBefore = frontierDistance(s.board, unrevealed, before.open)
      s.board[key(move.x, move.y)] = { mask, dead: card.dead }
      const after = network(s.board)
      if (card.dead) bumpAll(s, actor, 9)
      else bumpAll(s, actor, frontierDistance(s.board, unrevealed, after.open) < distBefore ? -3 : 0)
      log(s, { icon: card.dead ? '🚧' : '🐾', key: card.dead ? 'log.deadEnd' : 'log.path', params: { name: p.name } }, now)

      for (const goal of goalsReached(s.board, after.open)) {
        if (s.revealed.includes(goal)) continue
        s.revealed.push(goal)
        onReveal(s, goal)
        if (goal === s.treasure) return endRound(s, 'hunters', now, actor)
        log(s, { icon: '🪨', key: 'log.rock', params: { spot: goal + 1 } }, now)
      }
      break
    }
    case 'sniff': {
      if (move.goal < 0 || move.goal > 2) throw new IllegalMove('error.pickSpot')
      const truth: GoalContent = move.goal === s.treasure ? 'treasure' : 'rock'
      s.knowledge[actor][move.goal] = truth
      log(s, { icon: '👃', key: 'log.sniff', params: { name: p.name, spot: move.goal + 1 } }, now)
      if (move.claim) {
        s.claims.push({ by: actor, goal: move.goal, says: move.claim })
        onClaim(s, actor, move.goal, move.claim)
        const line = move.claim === 'treasure' ? 'claimTreasure' : 'claimRock'
        if (p.persona) say(s, actor, line, { spot: move.goal + 1 }, rng, now, true)
        else log(s, { icon: '📣', key: `log.${line}`, params: { name: p.name, spot: move.goal + 1 } }, now)
      }
      break
    }
    case 'dig': {
      const k = key(move.x, move.y)
      const tile = s.board[k]
      if (!tile || k === START_KEY) throw new IllegalMove('error.dig')
      const { open } = network(s.board)
      bumpAll(s, actor, tile.dead ? -10 : open.has(k) ? 10 : 3)
      delete s.board[k]
      log(s, { icon: '🪏', key: tile.dead ? 'log.digDeadEnd' : 'log.dig', params: { name: p.name } }, now)
      break
    }
    case 'break': {
      if (card.type !== 'break') break
      const target = s.players[move.target]
      if (!target || move.target === actor) throw new IllegalMove('error.breakSelf')
      if (target.broken.includes(card.tool)) throw new IllegalMove('error.alreadyBroken')
      target.broken.push(card.tool)
      onBreak(s, actor, move.target)
      log(s, { icon: '😈', key: 'log.break', params: { name: p.name, target: target.name, tool: card.tool } }, now)
      say(s, move.target, 'broken', { name: p.name, tool: card.tool }, rng, now)
      break
    }
    case 'fix': {
      if (card.type !== 'fix') break
      const target = s.players[move.target]
      const tool = card.tools.find((t) => target?.broken.includes(t))
      if (!target || !tool) throw new IllegalMove('error.nothingToFix')
      target.broken = target.broken.filter((t) => t !== tool)
      onFix(s, actor, move.target)
      const self = move.target === actor
      log(s, { icon: '💚', key: self ? 'log.fixSelf' : 'log.fix', params: { name: p.name, target: target.name, tool } }, now)
      if (!self) say(s, move.target, 'thanks', { name: p.name }, rng, now)
      break
    }
    case 'pass':
      log(s, { icon: '🍃', key: 'log.pass', params: { name: p.name } }, now)
      break
  }

  p.hand.splice(move.card, 1)
  const drawn = s.deck.pop()
  if (drawn) p.hand.push(drawn)

  if (s.players.every((q) => !q.hand.length)) return endRound(s, 'sneaky', now)
  s.accusedThisTurn = false
  do s.turn = (s.turn + 1) % s.players.length
  while (!s.players[s.turn].hand.length)
  return s
}

function takeLoot(s: GameState, maxValue: number): LootCard | undefined {
  for (let v = Math.min(3, maxValue); v >= 1; v--) {
    const i = s.lootDeck.findIndex((c) => c.value === v)
    if (i >= 0) return s.lootDeck.splice(i, 1)[0]
  }
  return undefined
}

function endRound(s: GameState, winner: Side, now: number, finder?: number): GameState {
  const n = s.players.length
  const payouts: RoundResult['payouts'] = s.players.map((_, player) => ({ player, loot: [] }))

  if (winner === 'hunters' && finder !== undefined) {
    // The finder picks first, then the haul passes backwards around the hunters.
    const haul = s.lootDeck.splice(-Math.min(n, s.lootDeck.length)).sort((a, b) => b.value - a.value)
    const order = Array.from({ length: n }, (_, i) => (finder - i + n) % n).filter((i) => s.players[i].role === 'hunter')
    haul.forEach((card, i) => payouts[order[i % order.length]].loot.push(card))
  } else {
    const sneaky = s.players.flatMap((q, i) => (q.role === 'sneaky' ? [i] : []))
    for (const i of sneaky) {
      let owed = sneakyPayout(sneaky.length)
      while (owed > 0) {
        const card = takeLoot(s, owed)
        if (!card) break
        payouts[i].loot.push(card)
        owed -= card.value
      }
    }
  }

  for (const { player, loot } of payouts) s.players[player].loot.push(...loot)
  for (const g of [0, 1, 2]) if (!s.revealed.includes(g)) onReveal(s, g)
  s.revealed = [0, 1, 2]
  s.result = { winner, finder, payouts: payouts.filter((x) => x.loot.length) }
  s.phase = s.round >= ROUNDS ? 'matchOver' : 'roundOver'
  if (winner === 'hunters')
    log(s, { icon: '🎉', key: 'log.found', params: { name: s.players[finder!].name, item: MISSIONS[s.mission] } }, now)
  else log(s, { icon: '🐿️', key: 'log.sneakyWin', params: {} }, now)
  return s
}

export const score = (p: Player) => p.loot.reduce((sum, c) => sum + c.value, 0)

/** Final standings, best first. Ties share a place. */
export function standings(s: GameState) {
  const sorted = s.players.map((p, i) => ({ i, name: p.name, points: score(p) })).sort((a, b) => b.points - a.points)
  return sorted.map((row) => ({ ...row, place: sorted.findIndex((r) => r.points === row.points) + 1 }))
}

export function isSavedGame(value: unknown): value is GameState {
  const v = value as GameState | null
  return v?.version === 2 && Array.isArray(v.players) && v.players.length >= 3 && Array.isArray(v.suspicion)
}
