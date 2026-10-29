import { PERSONAS } from './constants'
import type { GameState, Player } from './types'

/**
 * Every dog keeps its own read on every other dog (suspicion[observer][target], 0–100).
 * Evidence is public — what got played, what got said — and each persona weighs it differently.
 */

const clamp = (n: number) => Math.max(0, Math.min(100, n))
const gainOf = (p: Player) => (p.persona ? PERSONAS[p.persona].gain : 1)

export function initialSuspicion(players: Player[]): number[][] {
  return players.map((o, oi) =>
    players.map((_, ti) => (oi === ti ? 0 : o.persona ? PERSONAS[o.persona].baseline : 0)),
  )
}

export function bump(s: GameState, observer: number, target: number, amount: number) {
  if (observer === target) return
  s.suspicion[observer][target] = clamp(s.suspicion[observer][target] + amount * gainOf(s.players[observer]))
}

/** Every other dog sees the same evidence about `target`. */
export function bumpAll(s: GameState, target: number, amount: number | ((observer: number) => number)) {
  s.players.forEach((_, o) => bump(s, o, target, typeof amount === 'function' ? amount(o) : amount))
}

/** How suspicious the rest of the pack is of `target`, on average. */
export function packSuspicion(s: GameState, target: number): number {
  const others = s.suspicion.filter((_, o) => o !== target)
  return others.reduce((sum, row) => sum + row[target], 0) / Math.max(1, others.length)
}

/** Spoiling a trusted dog looks bad; spoiling a dog the observer already doubts looks like justice. */
export function onBreak(s: GameState, actor: number, target: number) {
  bumpAll(s, actor, (o) => {
    if (o === target) return 0
    const view = s.suspicion[o][target]
    return view >= 60 ? -8 : view < 35 ? 9 : 3
  })
  const victim = s.players[target]
  bump(s, target, actor, 15 + (victim.persona ? PERSONAS[victim.persona].grudge : 0))
}

export function onFix(s: GameState, actor: number, target: number) {
  if (actor === target) return
  bumpAll(s, actor, (o) => (s.suspicion[o][target] >= 60 ? 6 : -8))
  bump(s, target, actor, -15)
}

/** Dogs who sniffed the same spot know at once whether a claim was a lie. */
export function onClaim(s: GameState, claimer: number, goal: number, says: 'treasure' | 'rock') {
  s.knowledge.forEach((known, o) => {
    const truth = known[goal]
    if (o !== claimer && truth) bump(s, o, claimer, truth === says ? -12 : 45)
  })
}

/** When a hiding spot is uncovered everyone can check what was claimed about it. */
export function onReveal(s: GameState, goal: number) {
  const truth = goal === s.treasure ? 'treasure' : 'rock'
  for (const c of s.claims) if (c.goal === goal) bumpAll(s, c.by, c.says === truth ? -10 : 40)
}

/** A paw pointed by a trusted dog carries weight; mud-slinging costs the accuser a little too. */
export function onAccuse(s: GameState, accuser: number, target: number) {
  s.players.forEach((_, o) => {
    if (o === accuser || o === target) return
    bump(s, o, target, 12 * (1 - s.suspicion[o][accuser] / 100))
    bump(s, o, accuser, 2)
  })
  bump(s, target, accuser, 20)
}
