import type { Card, PersonaId, Theme, Tool } from './types'

export const BOARD_COLS = 9
export const BOARD_ROWS = 5
export const START = { x: 0, y: 2 } as const
export const GOAL_COLUMN = 8
export const GOAL_ROWS = [0, 2, 4] as const
export const ROUNDS = 3
export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 7

/** [dx, dy, edge bit on this tile, matching edge bit on the neighbour]. */
export const DIRS = [
  [0, -1, 1, 4],
  [1, 0, 2, 8],
  [0, 1, 4, 1],
  [-1, 0, 8, 2],
] as const

/** Sneaky / hunter role cards per table size. One card is always left out, so nobody knows the exact count. */
export const ROLE_DECK: Record<number, { sneaky: number; hunters: number }> = {
  3: { sneaky: 1, hunters: 3 },
  4: { sneaky: 1, hunters: 4 },
  5: { sneaky: 2, hunters: 4 },
  6: { sneaky: 2, hunters: 5 },
  7: { sneaky: 3, hunters: 5 },
}

export const handSize = (players: number) => (players <= 5 ? 6 : 5)

export const TOOLS: Tool[] = ['leash', 'nose', 'paw']
export const TOOL_ICONS: Record<Tool, { broken: string; fixed: string }> = {
  leash: { broken: '🪢', fixed: '🦮' },
  nose: { broken: '🤧', fixed: '🌸' },
  paw: { broken: '🌵', fixed: '🩹' },
}

/** 40 trails (9 dead ends) and 27 actions, the same mix as the classic tunnel game. */
export function buildDeck(): Card[] {
  const deck: Card[] = []
  const add = (n: number, card: Card) => {
    for (let i = 0; i < n; i++) deck.push(structuredClone(card))
  }
  const through: [number, number][] = [
    [15, 5],
    [14, 5],
    [11, 5],
    [10, 4],
    [5, 3],
    [6, 4],
    [12, 5],
  ]
  for (const [mask, n] of through) add(n, { type: 'path', mask, dead: false })
  for (const mask of [15, 14, 11, 10, 5, 6, 12, 2, 4]) add(1, { type: 'path', mask, dead: true })
  add(6, { type: 'sniff' })
  add(3, { type: 'dig' })
  for (const tool of TOOLS) {
    add(3, { type: 'break', tool })
    add(2, { type: 'fix', tools: [tool] })
  }
  add(1, { type: 'fix', tools: ['leash', 'nose'] })
  add(1, { type: 'fix', tools: ['nose', 'paw'] })
  add(1, { type: 'fix', tools: ['leash', 'paw'] })
  return deck
}

/** What Nompong hunts for each round. */
export const MISSIONS = ['🦴', '🦆', '🩴', '🍗', '🧸', '🎾'] as const

/** Loot is Nompong's stuff, worth 1–3 points. 16 / 8 / 4 cards per match. */
export const LOOT_ITEMS = { 1: ['🍪', '🎾', '🦆'], 2: ['🧸', '🩴'], 3: ['🦴', '👑'] } as const
export const LOOT_COUNTS = { 1: 16, 2: 8, 3: 4 } as const
/** Points each sneaky pup takes when they win, by how many sneaky pups there were. */
export const sneakyPayout = (count: number) => (count === 1 ? 4 : count <= 3 ? 3 : 2)

export interface Persona {
  id: PersonaId
  name: string
  emoji: string
  color: string
  /** How strongly evidence moves this dog's suspicion. */
  gain: number
  /** Suspicion a dog starts every round with toward everyone else. */
  baseline: number
  /** Suspicion at which this dog points a paw. */
  accuseAt: number
  /** Chance of lying about a sniff as a sneaky pup / as a hunter. */
  lieSneaky: number
  lieHunter: number
  /** Chance of keeping a sniff to themselves. */
  silent: number
  /** How readily they break other dogs and stop covering their tracks. */
  bold: number
  /** Extra suspicion toward whoever spoils their tools. */
  grudge: number
  /** How chatty they are. */
  chat: number
}

export const PERSONAS: Record<PersonaId, Persona> = {
  mochi: { id: 'mochi', name: 'Mochi', emoji: '🐶', color: '#e3ddd0', gain: 0.6, baseline: 0, accuseAt: 75, lieSneaky: 0.45, lieHunter: 0, silent: 0.1, bold: 0.3, grudge: 5, chat: 0.6 },
  biscuit: { id: 'biscuit', name: 'Biscuit', emoji: '🤓', color: '#caa07d', gain: 1.35, baseline: 5, accuseAt: 55, lieSneaky: 0.6, lieHunter: 0, silent: 0.15, bold: 0.45, grudge: 8, chat: 0.6 },
  pepper: { id: 'pepper', name: 'Pepper', emoji: '🦊', color: '#77766c', gain: 0.9, baseline: 5, accuseAt: 85, lieSneaky: 0.9, lieHunter: 0.15, silent: 0.05, bold: 0.6, grudge: 5, chat: 0.85 },
  coco: { id: 'coco', name: 'Coco', emoji: '😤', color: '#eed8a6', gain: 1.1, baseline: 10, accuseAt: 40, lieSneaky: 0.6, lieHunter: 0, silent: 0.05, bold: 0.7, grudge: 35, chat: 0.95 },
  milo: { id: 'milo', name: 'Milo', emoji: '😴', color: '#bd8f65', gain: 0.5, baseline: 0, accuseAt: 90, lieSneaky: 0.5, lieHunter: 0, silent: 0.45, bold: 0.25, grudge: 0, chat: 0.3 },
  taro: { id: 'taro', name: 'Taro', emoji: '🐺', color: '#9a9488', gain: 1.2, baseline: 20, accuseAt: 50, lieSneaky: 0.7, lieHunter: 0, silent: 0.2, bold: 0.85, grudge: 20, chat: 0.6 },
}
export const PERSONA_IDS = Object.keys(PERSONAS) as PersonaId[]

export const HUMAN_COLORS = ['#e9c47e', '#e3ddd0', '#caa07d', '#77766c', '#eed8a6', '#bd8f65', '#9a9488'] as const
export const AVATAR_BACKGROUNDS = ['#f2e6c7', '#ece8dd', '#efdece', '#e4e5dd', '#efe5cd', '#eddbca', '#e6e3dc'] as const
export const COLLAR_COLORS = ['#819a58', '#c4a274', '#859d96', '#b69a90'] as const
export const GOAL_DECOYS = ['🌳', '🧺', '🌼'] as const
export const THEME_ICONS: Record<Theme, string> = { garden: '☀', night: '☾', pink: '❀' }
