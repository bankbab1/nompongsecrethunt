import type { Card } from '@/game/types'
import type { Params } from '@/i18n'

/** Display name key and help text key for each card; the picture lives in components/icons. */
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
