import clsx from 'clsx'
import { CARD_INFO } from '@/game/constants'
import { rotate } from '@/game/rules'
import { useHints } from '@/lib/hints'
import { isHumanTurn, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { Trail } from './art/Trail'

export function Hand() {
  const store = useGameStore()
  const { game, selected, rotation, selectCard, rotateCard, discard } = store
  const player = game.players[game.turn]
  const human = isHumanTurn(store)
  const visible = human || game.ended
  const { cardHelp } = useHints()

  const status = game.ended ? 'HUNT COMPLETE' : human ? 'YOUR TURN' : `${player.name.toUpperCase()}’S TURN`
  const title = game.ended
    ? 'A little adventure to remember.'
    : player.blocked
      ? 'Squirrel trouble. Find a treat!'
      : human
        ? 'Make a little magic.'
        : 'A little plotting in progress…'

  return (
    <div className="px-3 pt-4 sm:px-6 sm:pt-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded bg-[#edf2de] px-2 py-1 text-[9px] tracking-widest text-[#5f7140]">{status}</span>
          <h3 className="my-2 text-sm font-bold sm:text-base">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="mr-1 text-2xl text-[#afb99d]" aria-hidden="true">
            ▧
          </span>
          <b className="text-[#5f6e4e]">{game.deck.length}</b> cards left
        </div>
      </div>

      <div className="flex min-h-[130px] justify-center gap-2 pt-4 pb-4 sm:gap-3">
        {visible ? (
          player.hand.map((card, i) => {
            const active = selected === i
            return (
              <button
                key={i}
                type="button"
                disabled={game.ended}
                aria-pressed={active}
                onClick={() => selectCard(i)}
                className={clsx(
                  'relative flex h-[104px] w-[calc((100vw-94px)/5)] max-w-[77px] shrink-0 flex-col items-center rounded-lg border border-[#dddcc6] bg-[#fffef4] p-1.5 transition-[transform,box-shadow] sm:h-[112px] sm:w-[84px] sm:max-w-none lg:h-[119px] lg:w-[89px] lg:rounded-[10px]',
                  active
                    ? '-translate-y-2 bg-[#fbffed] shadow-[0_0_0_2px_#79915c,0_6px_0_#ced6bb]'
                    : 'shadow-[0_4px_0_#e4e5d7] hover:-translate-y-1.5',
                )}
              >
                <small className="self-start text-[8px] tracking-wide text-[#7d876a]">
                  {card.type === 'trail' ? 'TRAIL' : 'ACTION'}
                </small>
                <div className="flex min-h-0 w-full flex-1 items-center justify-center">
                  {card.type === 'trail' ? (
                    <Trail mask={rotate(card.mask, active ? rotation : 0)} mini />
                  ) : (
                    <span className="text-[27px] sm:text-[31px]">{CARD_INFO[card.type].icon}</span>
                  )}
                </div>
                <b className="mt-1 mb-px text-[9px] font-medium">{CARD_INFO[card.type].name}</b>
                {active && (
                  <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-moss text-[10px] text-white">
                    ✓
                  </span>
                )}
              </button>
            )
          })
        ) : (
          <div className="flex items-center gap-3 text-xs text-subtle">
            <Dog color={player.color} className="w-[60px]" />
            Secret paws at work. Your hand will return soon.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[#e9ecdf] py-3 text-[11px] text-muted">
        <span className="max-w-[55%] leading-normal">{visible ? cardHelp : 'The pack is following the scent…'}</span>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={rotateCard}
            disabled={!human || player.hand[selected]?.type !== 'trail'}
            className="p-1 text-xs text-[#5f6e4e] disabled:opacity-40"
          >
            ↻ Rotate
          </button>
          <button
            type="button"
            onClick={discard}
            disabled={!human || !player.hand.length}
            className="p-1 text-xs text-[#5f6e4e] disabled:opacity-40"
          >
            Discard →
          </button>
        </div>
      </div>
    </div>
  )
}
