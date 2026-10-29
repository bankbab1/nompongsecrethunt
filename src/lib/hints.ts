import { useT } from '@/i18n'
import { isHumanTurn, useGameStore } from '@/store/gameStore'
import { cardHelpKey } from './cards'

/** The two lines of guidance the scene caption and hand footer show for the current moment. */
export function useHints(): { caption: string; cardHelp: string } {
  const t = useT()
  const store = useGameStore()
  const { game, preview } = store
  const player = game.players[game.turn]
  const card = player.hand[store.selected]

  if (game.phase !== 'playing') return { caption: t('caption.over'), cardHelp: t('caption.over') }
  if (preview) return { caption: t('help.preview'), cardHelp: t('help.preview') }
  if (!isHumanTurn(store) || !card) {
    const waiting = t('caption.waiting', { name: player.name })
    return { caption: waiting, cardHelp: waiting }
  }
  if (card.type === 'path' && player.broken.length) {
    const blocked = t('help.blocked', { tool: player.broken[0] })
    return { caption: blocked, cardHelp: blocked }
  }
  const [helpKey, params] = cardHelpKey(card)
  const help = t(helpKey, params)
  return { caption: help, cardHelp: help }
}
