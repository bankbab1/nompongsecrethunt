import { flip, frontierDistance, geoOf, goalsReached, isLegal, key, network } from './board'
import { DIRS, PERSONAS, type Persona } from './constants'
import { packSuspicion } from './suspicion'
import type { GameState, GoalContent, Move, Rng } from './types'

type Scored = { move: Move; score: number }

/** Where this dog believes the treasure is: its own sniffs first, then claims weighted by trust. */
export function treasureBeliefs(s: GameState, me: number): number[] {
  const known = s.knowledge[me]
  if (known.includes('treasure')) return known.map((k) => (k === 'treasure' ? 1 : 0))
  return [0, 1, 2].map((g) => {
    if (s.revealed.includes(g) || known[g] === 'rock') return 0
    let belief = 1
    for (const c of s.claims) {
      if (c.goal !== g || c.by === me) continue
      const trust = 1 - s.suspicion[me][c.by] / 100
      belief += c.says === 'treasure' ? trust : -0.6 * trust
    }
    return Math.max(0.05, belief)
  })
}

const argmax = (xs: number[]) => xs.reduce((best, x, i) => (x > xs[best] ? i : best), 0)
const personaOf = (s: GameState, i: number): Persona => PERSONAS[s.players[i].persona ?? 'mochi']

/**
 * Picks a move for the current computer player. Hunters build toward the spot they believe
 * in and spoil the dogs they suspect. Sneaky pups lay dead ends, dig, and spoil the dogs who
 * look most trustworthy — unless the pack is onto them, in which case they play nice for a bit.
 */
export function chooseBotMove(s: GameState, rng: Rng): Move {
  const me = s.turn
  const p = s.players[me]
  const persona = personaOf(s, me)
  const beliefs = treasureBeliefs(s, me)
  const target = argmax(beliefs)
  const geo = geoOf(s)
  const goal = geo.goals[target]
  const { open } = network(geo, s.board)
  // A sneaky pup plays nice until the trail gets close to the treasure (bolder ones strike
  // earlier), or whenever the pack is already watching it.
  const threat = frontierDistance(geo, s.board, [target], open)
  const lieLow = threat > 4 + persona.bold * 2 || packSuspicion(s, me) > 40
  const sneaky = p.role === 'sneaky' && !(lieLow && rng(100) >= persona.bold * 12)
  // While lying low it still lays trails, but ones that wander rather than race ahead.
  const covering = p.role === 'sneaky' && !sneaky
  const others = s.players.map((_, i) => i).filter((i) => i !== me)
  const view = (i: number) => s.suspicion[me][i]
  const options: Scored[] = []

  p.hand.forEach((c, card) => {
    switch (c.type) {
      case 'path': {
        if (p.broken.length) return
        for (const flipped of [false, true]) {
          const mask = flipped ? flip(c.mask) : c.mask
          for (let y = 0; y < geo.rows; y++)
            for (let x = 0; x < geo.cols; x++) {
              if (!isLegal(geo, s.board, x, y, mask, open)) continue
              // Closest open edge of the new tile to the target spot.
              let dist = Math.abs(goal.x - x) + Math.abs(goal.y - y) + 2
              for (const [dx, dy, bit] of DIRS)
                if (mask & bit) dist = Math.min(dist, Math.abs(goal.x - x - dx) + Math.abs(goal.y - y - dy))
              const trial = { ...s.board, [key(x, y)]: { mask, dead: c.dead } }
              const finishes = !c.dead && goalsReached(geo, trial).includes(target)
              const score = sneaky
                ? c.dead
                  ? 16 + x * 1.5 + rng(4)
                  : dist * 1.5 - 6 + rng(3)
                : c.dead
                  ? -30
                  : covering
                    ? 30 - Math.abs(dist - threat - 1) * 3 - (finishes ? 50 : 0) + rng(4)
                    : 40 - dist * 3 + (finishes ? 40 : 0) + rng(4) / 2
              options.push({ move: { kind: 'path', card, x, y, flipped }, score })
            }
        }
        return
      }
      case 'fix': {
        for (const i of [me, ...others]) {
          if (!c.tools.some((t) => s.players[i].broken.includes(t))) continue
          const score = i === me ? (sneaky ? 20 : 38) : sneaky ? 3 + (view(i) > 55 ? 6 : 0) : 16 - view(i) / 5
          options.push({ move: { kind: 'fix', card, target: i }, score })
        }
        return
      }
      case 'break': {
        for (const i of others) {
          if (s.players[i].broken.includes(c.tool)) continue
          // Sneaky pups go after whoever looks most trusted; hunters go after their prime suspect.
          const score = sneaky ? 12 + persona.bold * 8 + (50 - packSuspicion(s, i)) / 10 : (view(i) - 50) / 2.5 + persona.bold * 6
          options.push({ move: { kind: 'break', card, target: i }, score })
        }
        return
      }
      case 'dig': {
        for (const [k, tile] of Object.entries(s.board)) {
          if (k === geo.startKey) continue
          const [x, y] = k.split(',').map(Number)
          const score = sneaky
            ? open.has(k) && !tile.dead
              ? 8 + x * 1.2
              : -5
            : tile.dead && network(geo, s.board).reached.has(k)
              ? 14
              : -10
          options.push({ move: { kind: 'dig', card, x, y }, score })
        }
        return
      }
      case 'sniff': {
        const unknown = [0, 1, 2].filter((g) => !s.revealed.includes(g) && !s.knowledge[me][g])
        if (!unknown.length || s.knowledge[me].includes('treasure')) return
        const g = unknown.reduce((a, b) => (beliefs[b] > beliefs[a] ? b : a))
        options.push({
          move: { kind: 'sniff', card, goal: g, claim: null },
          score: (sneaky ? 7 : 11) - (3 - unknown.length) * 3 + rng(3),
        })
      }
    }
  })

  options.sort((a, b) => b.score - a.score)
  const best = options[0]
  if (!best || best.score < 0) return { kind: 'pass', card: worstCard(s, rng) }
  if (best.move.kind === 'sniff') best.move.claim = barkFor(s, best.move.goal, rng)
  return best.move
}

/** The card a dog is happiest to throw away. */
function worstCard(s: GameState, rng: Rng): number {
  const hand = s.players[s.turn].hand
  const sneaky = s.players[s.turn].role === 'sneaky'
  const i = hand.findIndex((c) => (sneaky ? c.type === 'fix' : c.type === 'path' && c.dead))
  return i >= 0 ? i : rng(hand.length)
}

/** What a dog barks after sniffing: the truth, a lie, or nothing, depending on role and persona. */
export function barkFor(s: GameState, goal: number, rng: Rng): GoalContent | null {
  const me = s.turn
  const persona = personaOf(s, me)
  if (rng(100) < persona.silent * 100) return null
  const truth: GoalContent = goal === s.treasure ? 'treasure' : 'rock'
  const lie = rng(100) < (s.players[me].role === 'sneaky' ? persona.lieSneaky : persona.lieHunter) * 100
  return lie ? (truth === 'treasure' ? 'rock' : 'treasure') : truth
}

/** Whether a computer dog points a paw before playing, and at whom. */
export function chooseAccusation(s: GameState, rng: Rng): number | null {
  if (s.accusedThisTurn) return null
  const me = s.turn
  const persona = personaOf(s, me)
  // Each dog calls out a given suspect once a round, unless it is very sure.
  const already = (t: number) => s.accusations.some((a) => a.by === me && a.target === t)
  const others = s.players.map((_, i) => i).filter((i) => i !== me)
  if (s.players[me].role === 'sneaky') {
    // Pile onto whoever the pack already doubts, or deflect once the pack starts eyeing us.
    const scapegoat = others.reduce((a, b) => (packSuspicion(s, b) > packSuspicion(s, a) ? b : a))
    const pressured = packSuspicion(s, me) > 25 || packSuspicion(s, scapegoat) > 45
    return pressured && !already(scapegoat) && rng(100) < persona.chat * 60 ? scapegoat : null
  }
  const suspect = others.reduce((a, b) => (s.suspicion[me][b] > s.suspicion[me][a] ? b : a))
  const sure = s.suspicion[me][suspect]
  if (sure < persona.accuseAt || (already(suspect) && sure < 95)) return null
  return rng(100) < persona.chat * 70 ? suspect : null
}
