import { TOOL_ICONS } from '@/game/constants'
import type { Card } from '@/game/types'
import type { Params } from '@/i18n'

/** Display name key, icon, and help text key for each card. */
export function cardNameKey(card: Card): string {
  switch (card.type) {
    case 'path':
      return card.dead ? 'card.deadEnd' : 'card.path'
    case 'break':
      return `card.break.${card.tool}`
    case 'fix':
      return card.tools.length > 1 ? 'card.fix.double' : `card.fix.${card.tools[0]}`
    default:
      return `card.${card.type}`
  }
}

export function cardIcon(card: Card): string {
  switch (card.type) {
    case 'sniff':
      return '👃'
    case 'dig':
      return '🪏'
    case 'break':
      return TOOL_ICONS[card.tool].broken
    case 'fix':
      return card.tools.map((t) => TOOL_ICONS[t].fixed).join('')
    default:
      return '🐾'
  }
}

export function cardHelpKey(card: Card): [string, Params?] {
  switch (card.type) {
    case 'path':
      return [card.dead ? 'help.deadEnd' : 'help.path']
    case 'break':
      return ['help.break', { tool: card.tool }]
    case 'fix':
      return ['help.fix', { tool: card.tools[0] }]
    default:
      return [`help.${card.type}`]
  }
}
