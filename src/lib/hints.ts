import { useT } from '@/i18n'
import { isHumanTurn, useGameStore } from '@/store/gameStore'

export interface Guide {
  /** 1 pick a card, 2 tap a target, 3 confirm; 0 when it isn't a human's turn. */
  step: 0 | 1 | 2 | 3
  /** One plain sentence telling the player exactly what to do next. */
  instruction: string
}

/** What the player holding the device should do right now. */
export function useGuide(): Guide {
  const t = useT()
  const store = useGameStore()
  const { game, preview } = store
  const player = game.players[game.turn]
  const card = player.hand[store.selected]

  if (game.phase !== 'playing') return { step: 0, instruction: t('caption.over') }
  if (!isHumanTurn(store)) return { step: 0, instruction: t('wait.title', { name: player.name }) }
  if (player.broken.length && (!card || card.type === 'path'))
    return { step: card ? 2 : 1, instruction: t('target.blocked', { tool: player.broken[0] }) }
  if (!card) return { step: 1, instruction: t('help.pickCard') }
  if (preview) return { step: 3, instruction: t('target.pathConfirm') }

  switch (card.type) {
    case 'path':
      return { step: 2, instruction: t(card.dead ? 'target.deadEnd' : 'target.path') }
    case 'break':
      return { step: 2, instruction: t('target.break', { tool: card.tool }) }
    case 'fix':
      return { step: 2, instruction: t('target.fix', { tools: card.tools.map((tool) => t(`tool.${tool}`)).join(' / ') }) }
    default:
      return { step: 2, instruction: t(`target.${card.type}`) }
  }
}
