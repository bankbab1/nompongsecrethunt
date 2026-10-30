import clsx from 'clsx'
import { Check, Eye, Flag, FlipVertical2, Layers, MousePointerClick, SkipForward } from 'lucide-react'
import { flip } from '@/game/board'
import { useT } from '@/i18n'
import { cardNameKey } from '@/lib/cards'
import { useGuide } from '@/lib/hints'
import { isHumanTurn, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { Trail } from './art/Trail'
import { CardGlyph } from './icons'

/**
 * The player's hand plus what to do with it. On phones it pins to the bottom of the screen
 * so the cards and the next step are always in reach while looking at the board.
 */
export function Hand() {
  const t = useT()
  const store = useGameStore()
  const { game, selected, flipped, selectCard, flipCard, pass, openModal } = store
  const player = game.players[game.turn]
  const human = isHumanTurn(store)
  const over = game.phase !== 'playing'
  const guide = useGuide()
  const card = player.hand[selected]
  const StatusIcon = human ? MousePointerClick : over ? Flag : Eye

  return (
    <div className="sticky bottom-0 z-30 border-t border-line bg-paper/95 px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_#2c3e2a14] backdrop-blur md:static md:border-0 md:bg-transparent md:px-6 md:pt-4 md:pb-1 md:shadow-none">
      {human && <StepGuide step={guide.step} />}

      <div
        className={clsx(
          'mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-[12px] leading-snug md:text-[13px]',
          human ? 'bg-[#fffbe6] text-ink ring-1 ring-[#f0e2a8]' : 'bg-[#f3f5ec] text-muted',
        )}
      >
        <StatusIcon size={16} strokeWidth={2} className={clsx('mt-px shrink-0', human ? 'text-[#a07b12]' : 'text-subtle')} />
        <div className="min-w-0">
          <b className="font-semibold">{guide.instruction}</b>
          {!human && !over && <div className="mt-0.5 hidden text-[11px] md:block">{t('wait.body')}</div>}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-muted" title={t('hand.deck')}>
          <Layers size={14} className="text-[#9aa486]" />
          <b className="text-[#5f6e4e]">{game.deck.length}</b>
        </div>
      </div>

      <div className="flex items-end justify-center gap-1.5 pt-3.5 pb-2 md:min-h-[130px] md:gap-2.5 md:pt-5">
        {human ? (
          player.hand.map((c, i) => {
            const active = selected === i
            return (
              <button
                key={i}
                type="button"
                aria-pressed={active}
                onClick={() => selectCard(i)}
                className={clsx(
                  'relative flex aspect-[3/4] w-[calc((100%-36px)/6)] max-w-[84px] min-w-0 shrink flex-col items-center rounded-lg border p-1 transition-[transform,box-shadow,opacity] md:w-[78px] md:p-1.5 lg:w-[84px] lg:rounded-[10px]',
                  c.type === 'break' ? 'border-[#e8cfc3] bg-[#fff8f3]' : 'border-[#dddcc6] bg-[#fffef4]',
                  active
                    ? '-translate-y-1.5 shadow-[0_0_0_2.5px_#79915c,0_5px_0_#ced6bb]'
                    : clsx('shadow-[0_3px_0_#e4e5d7] hover:-translate-y-1', selected >= 0 && 'opacity-60 hover:opacity-100'),
                  selected < 0 && 'animate-[pulse_2s_ease-in-out_infinite]',
                )}
              >
                <small className="self-start text-[7px] tracking-wide text-[#7d876a] md:text-[8px]">
                  {c.type === 'path' ? t('tag.trail') : t('tag.action')}
                </small>
                <div className="flex min-h-0 w-full flex-1 items-center justify-center">
                  {c.type === 'path' ? (
                    <Trail mask={active && flipped ? flip(c.mask) : c.mask} dead={c.dead} mini />
                  ) : (
                    <CardGlyph card={c} size={22} />
                  )}
                </div>
                <b className="mt-0.5 line-clamp-2 text-center text-[8px] leading-tight font-medium md:text-[9px]">{t(cardNameKey(c))}</b>
                {active && (
                  <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-moss text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })
        ) : (
          <div className="flex items-center gap-3 py-2 text-xs text-subtle">
            <Dog color={player.color} className="w-12 md:w-[60px]" />
            {over ? (
              <button
                type="button"
                onClick={() => openModal({ kind: 'result' })}
                className="rounded-xl bg-forest px-4 py-3 text-sm font-medium text-white"
              >
                {game.phase === 'matchOver' ? t('match.eyebrow') : t('result.next')}
              </button>
            ) : (
              t('hand.hidden')
            )}
          </div>
        )}
      </div>

      {human && (
        <div className="flex items-center justify-end gap-2 md:border-t md:border-[#e9ecdf] md:py-2.5">
          {card?.type === 'path' && (
            <button
              type="button"
              onClick={flipCard}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-[#3f5a35]"
            >
              <FlipVertical2 size={14} /> {t('hand.flip')}
            </button>
          )}
          <button
            type="button"
            title={t('caption.pass')}
            onClick={pass}
            disabled={!player.hand.length}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-[#3f5a35] disabled:opacity-40"
          >
            <SkipForward size={14} /> {t('hand.pass')}
          </button>
        </div>
      )}
    </div>
  )
}

function StepGuide({ step }: { step: number }) {
  const t = useT()
  const steps = [t('step.pick'), t('step.target'), t('step.confirm')]
  return (
    <ol className="flex items-center gap-1 text-[10px] md:text-[11px]">
      {steps.map((label, i) => {
        const n = i + 1
        const state = step > n ? 'done' : step === n ? 'now' : 'later'
        return (
          <li key={n} className="flex min-w-0 items-center gap-1">
            {i > 0 && <span className={clsx('h-px w-2 shrink-0 sm:w-5', state === 'later' ? 'bg-line-strong' : 'bg-sage')} />}
            <span
              className={clsx(
                'flex min-w-0 items-center gap-1 rounded-full px-1.5 py-0.5 md:px-2 md:py-1',
                state === 'now' && 'bg-forest font-semibold text-white',
                state === 'done' && 'bg-sage-100 text-moss',
                state === 'later' && 'text-subtle',
              )}
            >
              <span
                className={clsx(
                  'grid size-4 shrink-0 place-items-center rounded-full text-[9px]',
                  state === 'now' ? 'bg-white text-forest' : state === 'done' ? 'bg-moss text-white' : 'border border-line-strong',
                )}
              >
                {state === 'done' ? <Check size={10} strokeWidth={3} /> : n}
              </span>
              <span className="truncate">{label}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
