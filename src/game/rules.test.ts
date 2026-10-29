import { chooseBotMove } from './bot'
import { applyMove, createGame, IllegalMove, isLegal, key, reachable, rotate } from './rules'
import type { Card, GameState, Rng } from './types'

/** Deterministic RNG for repeatable games. */
function seededRng(seed = 1): Rng {
  return (n) => {
    seed = (seed * 16807) % 2147483647
    return seed % n
  }
}

function game(overrides: Partial<GameState> = {}, hand: Card[] = []): GameState {
  const g = createGame({ name: 'Tester', mode: 'solo', count: 4, now: 0 }, seededRng())
  if (hand.length) g.players[0].hand = hand
  return { ...g, ...overrides }
}

describe('rotate', () => {
  it('turns edges clockwise and wraps after four turns', () => {
    expect(rotate(1)).toBe(2) // up → right
    expect(rotate(8)).toBe(1) // left → up
    expect(rotate(10)).toBe(5) // horizontal → vertical
    expect(rotate(3, 4)).toBe(3)
  })
})

describe('createGame', () => {
  it('deals five cards to each dog and hides exactly one mischief dog', () => {
    const g = game()
    expect(g.players).toHaveLength(4)
    expect(g.players.every((p) => p.hand.length === 5)).toBe(true)
    expect(g.deck).toHaveLength(68 - 20)
    expect(g.players.filter((p) => p.role === 'mischief')).toHaveLength(1)
    expect(g.board).toEqual({ '0,2': 15, '1,2': 10 })
  })

  it('never repeats the previous mission', () => {
    const rng = seededRng(7)
    let prev = createGame({ name: 'A', mode: 'solo', count: 3 }, rng)
    for (let i = 0; i < 30; i++) {
      const next = createGame({ name: 'A', mode: 'solo', count: 3, previous: prev }, rng)
      expect(next.mission).not.toBe(prev.mission)
      expect(next.hunt).toBe(prev.hunt + 1)
      prev = next
    }
  })
})

describe('isLegal', () => {
  const board = { '0,2': 15, '1,2': 10 }

  it('accepts a tile that extends the network with matching edges', () => {
    expect(isLegal(board, 2, 2, 10)).toBe(true)
  })

  it('rejects tiles that leave a neighbouring edge unmatched', () => {
    expect(isLegal(board, 2, 2, 5)).toBe(false) // vertical tile next to an open east edge
  })

  it('rejects tiles that do not connect back to Nompong', () => {
    expect(isLegal(board, 4, 4, 10)).toBe(false)
  })

  it('rejects occupied cells and the hiding-spot column', () => {
    expect(isLegal(board, 1, 2, 10)).toBe(false)
    expect(isLegal({ ...board, '6,2': 10 }, 7, 2, 10)).toBe(false)
  })
})

describe('applyMove', () => {
  it('places a trail, draws a card, and passes the turn without mutating the input', () => {
    const g = game({}, [{ type: 'trail', mask: 10 }, { type: 'sniff' }])
    const next = applyMove(g, { kind: 'trail', card: 0, x: 2, y: 2, mask: 10 }, 1)
    expect(next.board['2,2']).toBe(10)
    expect(next.players[0].hand).toHaveLength(2)
    expect(next.turn).toBe(1)
    expect(g.board['2,2']).toBeUndefined()
  })

  it('accepts any rotation of the card but not a different shape', () => {
    const g = game({}, [{ type: 'trail', mask: 5 }])
    expect(() => applyMove(g, { kind: 'trail', card: 0, x: 2, y: 2, mask: 10 })).not.toThrow()
    expect(() => applyMove(g, { kind: 'trail', card: 0, x: 2, y: 2, mask: 15 })).toThrow(IllegalMove)
  })

  it('blocks distracted dogs from placing trails until they get a treat', () => {
    const g = game({}, [{ type: 'trail', mask: 10 }, { type: 'treat' }])
    g.players[0].blocked = true
    expect(() => applyMove(g, { kind: 'trail', card: 0, x: 2, y: 2, mask: 10 })).toThrow(/Squirrel/)
    const next = applyMove(g, { kind: 'treat', card: 1, target: 0 })
    expect(next.players[0].blocked).toBe(false)
  })

  it('squirrels only distract other, focused dogs', () => {
    const g = game({}, [{ type: 'squirrel' }])
    expect(() => applyMove(g, { kind: 'squirrel', card: 0, target: 0 })).toThrow(/another dog/)
    const next = applyMove(g, { kind: 'squirrel', card: 0, target: 2 })
    expect(next.players[2].blocked).toBe(true)
  })

  it('digs up trails but protects the start', () => {
    const g = game({}, [{ type: 'dig' }])
    expect(() => applyMove(g, { kind: 'dig', card: 0, x: 0, y: 2 })).toThrow(/protected/)
    expect(applyMove(g, { kind: 'dig', card: 0, x: 1, y: 2 }).board['1,2']).toBeUndefined()
  })

  it('reveals a rock at a wrong hiding spot and keeps playing', () => {
    const board: Record<string, number> = { '0,2': 15 }
    for (let x = 1; x < 6; x++) board[key(x, 2)] = 10
    const g = game({ board, treasure: 0 }, [{ type: 'trail', mask: 10 }])
    const next = applyMove(g, { kind: 'trail', card: 0, x: 6, y: 2, mask: 10 })
    expect(next.revealed).toEqual([1])
    expect(next.ended).toBe(false)
  })

  it('ends the hunt when the trail reaches the treasure', () => {
    const board: Record<string, number> = { '0,2': 15 }
    for (let x = 1; x < 6; x++) board[key(x, 2)] = 10
    const g = game({ board, treasure: 1 }, [{ type: 'trail', mask: 10 }])
    const next = applyMove(g, { kind: 'trail', card: 0, x: 6, y: 2, mask: 10 })
    expect(next.ended).toBe(true)
    expect(next.winner).toBe('hunters')
    expect(next.revealed).toEqual([0, 1, 2])
  })

  it('gives mischief the win once every hand is empty', () => {
    const g = game({ deck: [] })
    g.players.forEach((p, i) => (p.hand = i === 0 ? [{ type: 'sniff' }] : []))
    const next = applyMove(g, { kind: 'discard', card: 0 })
    expect(next.ended).toBe(true)
    expect(next.winner).toBe('mischief')
  })

  it('skips dogs with empty hands when passing the turn', () => {
    const g = game({ deck: [] })
    g.players[1].hand = []
    expect(applyMove(g, { kind: 'discard', card: 0 }).turn).toBe(2)
  })
})

describe('full games', () => {
  it('always finish within the deck when every dog is a bot', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const rng = seededRng(seed)
      let g = createGame({ name: 'Bot', mode: 'solo', count: 3 + (seed % 4) }, rng)
      let moves = 0
      while (!g.ended && moves < 500) {
        g = applyMove(g, chooseBotMove(g, rng))
        moves++
      }
      expect(g.ended).toBe(true)
      if (g.winner === 'hunters') expect(reachable(g.board).has(key(6, g.treasure * 2))).toBe(true)
    }
  })
})
