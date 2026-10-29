import clsx from 'clsx'
import { flip } from '@/game/board'
import { useT } from '@/i18n'
import { cardIcon, cardNameKey } from '@/lib/cards'
import { useHints } from '@/lib/hints'
import { isHumanTurn, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { Trail } from './art/Trail'

export function Hand() {
  const t = useT()
  const store = useGameStore()
  const { game, selected, flipped, selectCard, flipCard, pass, openModal } = store
  const player = game.players[game.turn]
  const human = isHumanTurn(store)
  const over = game.phase !== 'playing'
  const visible = human
  const { cardHelp } = useHints()

  const status = over ? t('hand.over') : human ? t('hand.yourTurn') : t('hand.theirTurn', { name: player.name.toUpperCase() })
  const title = over
    ? t('hand.title.over')
    : player.broken.length && human
      ? t('hand.title.blocked')
      : human
        ? t('hand.title.play')
        : t('hand.title.waiting')

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
          <b className="text-[#5f6e4e]">{game.deck.length}</b> {t('hand.deck')}
        </div>
      </div>

      <div className="flex min-h-[130px] justify-center gap-1.5 pt-4 pb-4 sm:gap-2.5">
        {visible ? (
          player.hand.map((card, i) => {
            const active = selected === i
            return (
              <button
                key={i}
                type="button"
                aria-pressed={active}
                onClick={() => selectCard(i)}
                className={clsx(
                  'relative flex h-[104px] w-[calc((100vw-80px)/6)] max-w-[77px] shrink-0 flex-col items-center rounded-lg border p-1 transition-[transform,box-shadow] sm:h-[112px] sm:w-[78px] sm:max-w-none sm:p-1.5 lg:h-[119px] lg:w-[84px] lg:rounded-[10px]',
                  card.type === 'break' ? 'border-[#e3cbbf] bg-[#fff7f1]' : 'border-[#dddcc6] bg-[#fffef4]',
                  active
                    ? '-translate-y-2 shadow-[0_0_0_2px_#79915c,0_6px_0_#ced6bb]'
                    : 'shadow-[0_4px_0_#e4e5d7] hover:-translate-y-1.5',
                )}
              >
                <small className="self-start text-[8px] tracking-wide text-[#7d876a]">
                  {card.type === 'path' ? t('tag.trail') : t('tag.action')}
                </small>
                <div className="flex min-h-0 w-full flex-1 items-center justify-center">
                  {card.type === 'path' ? (
                    <Trail mask={active && flipped ? flip(card.mask) : card.mask} dead={card.dead} mini />
                  ) : (
                    <span className="text-[24px] sm:text-[28px]">{cardIcon(card)}</span>
                  )}
                </div>
                <b className="mt-1 mb-px text-center text-[9px] leading-tight font-medium">{t(cardNameKey(card))}</b>
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
            {over ? (
              <button
                type="button"
                onClick={() => openModal({ kind: 'result' })}
                className="rounded-[10px] bg-forest px-4 py-3 text-sm font-medium text-white"
              >
                {game.phase === 'matchOver' ? t('match.eyebrow') : t('result.next')}
              </button>
            ) : (
              t('hand.hidden')
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[#e9ecdf] py-3 text-[11px] text-muted">
        <span className="max-w-[60%] leading-normal">{cardHelp}</span>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={flipCard}
            disabled={!human || player.hand[selected]?.type !== 'path'}
            className="p-1 text-xs text-[#5f6e4e] disabled:opacity-40"
          >
            {t('hand.flip')}
          </button>
          <button
            type="button"
            title={t('caption.pass')}
            onClick={pass}
            disabled={!human || !player.hand.length}
            className="p-1 text-xs text-[#5f6e4e] disabled:opacity-40"
          >
            {t('hand.pass')}
          </button>
        </div>
      </div>
    </div>
  )
}
