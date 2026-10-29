import type { Theme } from './types'

export const BOARD_COLS = 8
export const BOARD_ROWS = 5
/** Trails go in columns 0..6; column 7 holds the hiding spots. */
export const TRAIL_COLS = 7
export const START = { x: 0, y: 2 } as const
export const GOAL_COLUMN = 7
export const GOAL_COUNT = 3
export const HAND_SIZE = 5
export const DECK_SIZE = 68

/** [dx, dy, edge bit on this tile, matching edge bit on the neighbour]. */
export const DIRS = [
  [0, -1, 1, 4],
  [1, 0, 2, 8],
  [0, 1, 4, 1],
  [-1, 0, 8, 2],
] as const

export const MISSIONS = [
  { icon: '🦴', name: 'golden bone', line: 'Find the golden bone' },
  { icon: '🦆', name: 'squeaky duck', line: 'Find the squeaky duck' },
  { icon: '🩴', name: 'favorite slipper', line: 'Find the missing slipper' },
  { icon: '🍗', name: 'chicken drumstick', line: 'Find the secret drumstick' },
  { icon: '🧸', name: 'cuddly teddy', line: 'Find the cuddly teddy' },
  { icon: '🎾', name: 'lucky tennis ball', line: 'Find the lucky tennis ball' },
] as const

export const BOT_NAMES = ['Mochi', 'Biscuit', 'Pepper', 'Coco', 'Milo'] as const
export const DOG_COLORS = ['#e9c47e', '#e3ddd0', '#caa07d', '#77766c', '#eed8a6', '#bd8f65'] as const
export const AVATAR_BACKGROUNDS = ['#f2e6c7', '#ece8dd', '#efdece', '#e4e5dd', '#efe5cd', '#eddbca'] as const
export const COLLAR_COLORS = ['#819a58', '#c4a274', '#859d96', '#b69a90'] as const
export const GOAL_DECOYS = ['🌳', '🧺', '🌼'] as const

export const THEMES: Record<Theme, { icon: string; name: string; sub: string }> = {
  garden: { icon: '☀', name: 'The sunny backyard', sub: 'A suspiciously lovely day for a hunt' },
  night: { icon: '☾', name: 'The moonlit backyard', sub: 'Little secrets under a sleepy sky' },
  pink: { icon: '❀', name: 'The blossom backyard', sub: 'Something sweet is hiding in the flowers' },
}

/** Weighted pool of trail shapes: straights and crossroads come up most. */
export const TRAIL_MASKS = [10, 10, 10, 5, 5, 3, 6, 12, 9, 7, 11, 13, 14, 15, 15, 15, 2, 8]

export const CARD_INFO = {
  trail: { name: 'Scent trail', icon: '🐾', help: 'Choose a glowing spot. Rotate to connect the scent.' },
  sniff: { name: 'Sniff ahead', icon: '👃', help: 'Tap a hiding spot to privately peek inside.' },
  squirrel: { name: 'Squirrel!', icon: '🐿️', help: 'Tap another dog to distract them from placing trails.' },
  treat: { name: 'Good dog treat', icon: '🦴', help: 'Tap a distracted dog to help them focus again.' },
  dig: { name: 'Dig it up', icon: '🪏', help: 'Tap a trail tile to remove it from the garden.' },
} as const
