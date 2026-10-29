import { CARD_INFO } from '@/game/constants'
import { isHumanTurn, useGameStore } from '@/store/gameStore'

/** The two lines of guidance the scene caption and hand footer show for the current moment. */
export function useHints(): { caption: string; cardHelp: string } {
  const store = useGameStore()
  const { game, preview } = store
  const player = game.players[game.turn]
  const card = player.hand[store.selected]
  const human = isHumanTurn(store)

  if (preview) return { caption: 'Looking good? Tap the tile again to place it.', cardHelp: 'Tap the highlighted tile again to confirm.' }
  if (game.ended) return { caption: 'The secret is out. Ready for another little adventure?', cardHelp: 'The pack is following the scent…' }
  if (!human || !card) return { caption: `${player.name} is making a move…`, cardHelp: 'The pack is following the scent…' }

  const help =
    card.type === 'trail' && player.blocked ? 'You need a treat before placing trails.' : CARD_INFO[card.type].help
  return { caption: card.type === 'trail' ? 'Pick a trail card, then choose a glowing spot.' : help, cardHelp: help }
}
