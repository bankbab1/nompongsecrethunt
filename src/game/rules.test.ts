import { flip, geometry, goalsReached, isLegal, isSealed, key, network } from './board'
import { barkFor, chooseAccusation, chooseBotMove, treasureBeliefs } from './bot'
import { buildDeck, ROLE_DECK } from './constants'
import { accuse, applyMove, createMatch, IllegalMove, score, standings, startRound } from './rules'
import { packSuspicion } from './suspicion'
import type { Card, GameState, Rng, Tile } from './types'

function seededRng(seed = 1): Rng {
  return (n) => {
    seed = (seed * 16807) % 2147483647
    return seed % n
  }
}

const geo = geometry('small')
const names = (n: number) => ['Tester', 'B', 'C', 'D', 'E', 'F', 'G'].slice(0, n)

/** A 4-dog solo match where it's player 0's turn and they hold exactly `hand`. */
function match(hand: Card[] = [], overrides: Partial<GameState> = {}): GameState {
  const g = createMatch({ mode: 'solo', names: names(4), size: 'small', now: 0 }, seededRng())
  g.turn = 0
  if (hand.length) g.players[0].hand = hand
  return { ...g, ...overrides }
}

const path = (mask: number, dead = false): Card => ({ type: 'path', mask, dead })
const straightTo = (x: number): Record<string, Tile> => {
  const board: Record<string, Tile> = { '0,2': { mask: 15, dead: false } }
  for (let i = 1; i <= x; i++) board[key(i, 2)] = { mask: 10, dead: false }
  return board
}

describe('deck and roles', () => {
  it('has the classic 40 trails and 27 actions', () => {
    const deck = buildDeck()
    expect(deck).toHaveLength(67)
    expect(deck.filter((c) => c.type === 'path')).toHaveLength(40)
    expect(deck.filter((c) => c.type === 'path' && c.dead)).toHaveLength(9)
  })

  it('deals one role card fewer than the role deck holds', () => {
    for (let n = 3; n <= 7; n++) {
      const g = createMatch({ mode: 'solo', names: names(n) }, seededRng(n))
      const sneaky = g.players.filter((p) => p.role === 'sneaky').length
      expect(sneaky).toBeGreaterThanOrEqual(ROLE_DECK[n].sneaky - 1)
      expect(sneaky).toBeLessThanOrEqual(ROLE_DECK[n].sneaky)
      expect(g.players.every((p) => p.hand.length === (n <= 5 ? 6 : 5))).toBe(true)
    }
  })

  it('gives computer dogs distinct personas and humans none', () => {
    const solo = createMatch({ mode: 'solo', names: names(6) }, seededRng())
    expect(solo.players[0].persona).toBeNull()
    expect(new Set(solo.players.slice(1).map((p) => p.persona)).size).toBe(5)
    const local = createMatch({ mode: 'local', names: names(4) }, seededRng())
    expect(local.players.every((p) => p.persona === null)).toBe(true)
  })
})

describe('board', () => {
  it('only flips cards, never quarter-turns them', () => {
    expect(flip(10)).toBe(10)
    expect(flip(6)).toBe(9)
    expect(flip(14)).toBe(11)
  })

  it('stops the scent at dead ends', () => {
    const board = { ...straightTo(1), '2,2': { mask: 10, dead: true } }
    const { reached, open } = network(geo, board)
    expect(reached.has('2,2')).toBe(true)
    expect(open.has('2,2')).toBe(false)
    expect(isLegal(geo, board, 3, 2, 10)).toBe(false)
  })

  it('requires matching edges and a link to the open network', () => {
    const board = straightTo(1)
    expect(isLegal(geo, board, 2, 2, 10)).toBe(true)
    expect(isLegal(geo, board, 2, 2, 5)).toBe(false)
    expect(isLegal(geo, board, 5, 4, 10)).toBe(false)
  })

  it('reaches a hiding spot from the side or from below', () => {
    expect(goalsReached(geo, straightTo(7))).toEqual([1])
    // Turn up at column 7, step right into column 8, then point up into spot 1 (row 0).
    const detour = {
      ...straightTo(6),
      '7,2': { mask: 8 | 1, dead: false },
      '7,1': { mask: 4 | 2, dead: false },
      '8,1': { mask: 8 | 1, dead: false },
    }
    expect(goalsReached(geo, detour)).toEqual([0])
  })
})

describe('board sizes', () => {
  it('keep the hiding spots two rows apart on the right edge with Nompong mid-left', () => {
    for (const [size, cols, rows] of [['small', 9, 5], ['classic', 11, 7], ['large', 13, 9]] as const) {
      const g = geometry(size)
      expect([g.cols, g.rows]).toEqual([cols, rows])
      expect(g.start).toEqual({ x: 0, y: (rows - 1) / 2 })
      expect(g.goals.map((p) => p.y)).toEqual([g.start.y - 2, g.start.y, g.start.y + 2])
      expect(g.goals.every((p) => p.x === cols - 1)).toBe(true)
    }
  })

  it('notices when the trail has sealed itself off', () => {
    // Nompong's crossroads capped on every side by dead ends.
    const board = {
      '0,2': { mask: 15, dead: false },
      '1,2': { mask: 10, dead: true },
      '0,1': { mask: 5, dead: true },
      '0,3': { mask: 5, dead: true },
    }
    expect(isSealed(geo, board, [])).toBe(true)
    expect(isSealed(geo, straightTo(3), [])).toBe(false)
  })
})

describe('moves', () => {
  it('blocks a pup with a spoiled tool from laying trails until it is fixed', () => {
    const g = match([path(10), { type: 'fix', tools: ['nose'] }])
    g.players[0].broken = ['nose']
    expect(() => applyMove(g, { kind: 'path', card: 0, x: 1, y: 2, flipped: false }, seededRng())).toThrow('error.broken')
    const fixed = applyMove(g, { kind: 'fix', card: 1, target: 0 }, seededRng())
    expect(fixed.players[0].broken).toEqual([])
  })

  it('only breaks a tool that is not already broken, and never your own', () => {
    const g = match([{ type: 'break', tool: 'leash' }])
    expect(() => applyMove(g, { kind: 'break', card: 0, target: 0 }, seededRng())).toThrow(IllegalMove)
    g.players[1].broken = ['leash']
    expect(() => applyMove(g, { kind: 'break', card: 0, target: 1 }, seededRng())).toThrow('error.alreadyBroken')
    expect(applyMove(g, { kind: 'break', card: 0, target: 2 }, seededRng()).players[2].broken).toEqual(['leash'])
  })

  it('lets a double fix mend either of its tools', () => {
    const g = match([{ type: 'fix', tools: ['leash', 'paw'] }])
    g.players[1].broken = ['paw']
    expect(applyMove(g, { kind: 'fix', card: 0, target: 1 }, seededRng()).players[1].broken).toEqual([])
  })

  it('records a private sniff and a public claim', () => {
    const g = match([{ type: 'sniff' }], { treasure: 2 })
    const next = applyMove(g, { kind: 'sniff', card: 0, goal: 0, claim: 'treasure' }, seededRng())
    expect(next.knowledge[0]).toEqual(['rock', null, null])
    expect(next.claims).toEqual([{ by: 0, goal: 0, says: 'treasure' }])
  })

  it('ends the round for the hunters when the trail reaches the treasure', () => {
    const g = match([path(10)], { board: straightTo(6), treasure: 1 })
    g.players.forEach((p, i) => (p.role = i === 3 ? 'sneaky' : 'hunter'))
    const next = applyMove(g, { kind: 'path', card: 0, x: 7, y: 2, flipped: false }, seededRng())
    expect(next.phase).toBe('roundOver')
    expect(next.result?.winner).toBe('hunters')
    expect(next.result?.finder).toBe(0)
    // Four loot cards, none to the sneaky pup, the best one to the finder.
    expect(next.players[3].loot).toEqual([])
    expect(next.players.reduce((n, p) => n + p.loot.length, 0)).toBe(4)
    expect(Math.max(...next.players.map((p) => p.loot[0]?.value ?? 0))).toBe(next.players[0].loot[0].value)
  })

  it('reveals a rock and keeps playing when the trail hits the wrong spot', () => {
    const g = match([path(10)], { board: straightTo(6), treasure: 0 })
    const next = applyMove(g, { kind: 'path', card: 0, x: 7, y: 2, flipped: false }, seededRng())
    expect(next.revealed).toEqual([1])
    expect(next.phase).toBe('playing')
  })

  it('pays the sneaky pups when every hand runs dry', () => {
    const g = match([], { deck: [] })
    g.players.forEach((p, i) => {
      p.role = i === 2 ? 'sneaky' : 'hunter'
      p.hand = i === 0 ? [{ type: 'dig' }] : []
    })
    const next = applyMove(g, { kind: 'pass', card: 0 }, seededRng())
    expect(next.result?.winner).toBe('sneaky')
    expect(score(next.players[2])).toBe(4)
    expect(score(next.players[0])).toBe(0)
  })

  it('carries loot across rounds and ends the match after round three', () => {
    let g = match()
    g.players[1].loot = [{ value: 3, item: 0 }]
    g = startRound(startRound(g, seededRng()), seededRng())
    expect(g.round).toBe(3)
    expect(score(g.players[1])).toBe(3)
    expect(standings(g)[0].i).toBe(1)
  })
})

describe('suspicion', () => {
  it('rises for dead ends and falls for real progress', () => {
    const g = match([path(10, true), path(10)])
    const dead = applyMove(g, { kind: 'path', card: 0, x: 1, y: 2, flipped: false }, seededRng())
    expect(packSuspicion(dead, 0)).toBeGreaterThan(packSuspicion(g, 0))
    const good = applyMove(g, { kind: 'path', card: 1, x: 1, y: 2, flipped: false }, seededRng())
    expect(packSuspicion(good, 0)).toBeLessThan(packSuspicion(g, 0))
  })

  it('catches a lie when the spot is uncovered', () => {
    const g = match([path(10)], { board: straightTo(6), treasure: 0, claims: [{ by: 2, goal: 1, says: 'treasure' }] })
    const next = applyMove(g, { kind: 'path', card: 0, x: 7, y: 2, flipped: false }, seededRng())
    expect(packSuspicion(next, 2)).toBeGreaterThan(packSuspicion(g, 2) + 20)
  })

  it('makes a dog who sniffed the same spot doubt a liar at once', () => {
    const g = match([{ type: 'sniff' }], { treasure: 2 })
    g.knowledge[1][0] = 'rock'
    const next = applyMove(g, { kind: 'sniff', card: 0, goal: 0, claim: 'treasure' }, seededRng())
    expect(next.suspicion[1][0]).toBeGreaterThanOrEqual(g.suspicion[1][0] + 25)
  })

  it('lets you point a paw once per turn', () => {
    const g = match()
    const next = accuse(g, 2, seededRng())
    expect(packSuspicion(next, 2)).toBeGreaterThan(packSuspicion(g, 2))
    expect(() => accuse(next, 3, seededRng())).toThrow('error.alreadyAccused')
    expect(() => accuse(g, 0, seededRng())).toThrow('error.accuseSelf')
  })
})

describe('computer dogs', () => {
  it('trust their own sniff over anything barked', () => {
    const g = match([], { treasure: 2, claims: [{ by: 1, goal: 0, says: 'treasure' }] })
    g.knowledge[0] = [null, null, 'treasure']
    expect(treasureBeliefs(g, 0)).toEqual([0, 0, 1])
  })

  it('never lie as honest hunters and often lie as sneaky charmers', () => {
    const g = match([], { treasure: 0 })
    g.players[0].persona = 'pepper'
    g.players[0].role = 'hunter'
    const rng = seededRng(3)
    const honest = Array.from({ length: 200 }, () => barkFor(g, 0, rng)).filter((c) => c === 'treasure').length
    g.players[0].role = 'sneaky'
    const lies = Array.from({ length: 200 }, () => barkFor(g, 0, rng)).filter((c) => c === 'rock').length
    expect(honest).toBeGreaterThan(150)
    expect(lies).toBeGreaterThan(150)
  })

  it('accuse once their suspicion passes their persona threshold', () => {
    const g = match()
    g.players[0].persona = 'coco'
    g.players[0].role = 'hunter'
    expect(chooseAccusation(g, () => 0)).toBeNull()
    g.suspicion[0][3] = 90
    expect(chooseAccusation(g, () => 0)).toBe(3)
  })

  it('always finish a full three-round match', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const rng = seededRng(seed)
      let g = createMatch({ mode: 'solo', names: names(3 + (seed % 5)), size: (['small', 'classic', 'large'] as const)[seed % 3] }, rng)
      g.players[0].persona = 'biscuit' // let the bot drive the human seat too
      let moves = 0
      while (g.phase !== 'matchOver' && moves < 2000) {
        if (g.phase === 'roundOver') g = startRound(g, rng)
        const target = chooseAccusation(g, rng)
        if (target !== null) g = accuse(g, target, rng)
        g = applyMove(g, chooseBotMove(g, rng), rng)
        moves++
      }
      expect(g.phase).toBe('matchOver')
      expect(g.round).toBe(3)
    }
  })
})
