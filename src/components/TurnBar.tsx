import clsx from 'clsx'
import { AVATAR_BACKGROUNDS, COLLAR_COLORS, ROUNDS } from '@/game/constants'
import { useT } from '@/i18n'
import { turnShake } from '@/lib/turnShake'
import { isHumanTurn, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { PERSONA_ICONS } from './icons'

/**
 * The strip above the board that always answers "whose turn is it, how long do they have,
 * and who's next". Turn order starts from the dog playing now.
 */
export function TurnBar({ secondsLeft }: { secondsLeft: number | null }) {
  const t = useT()
  const store = useGameStore()
  const { game, turnSeconds } = store
  const n = game.players.length
  const playing = game.phase === 'playing'
  const human = isHumanTurn(store)
  const current = game.players[game.turn]
  // Dogs with empty hands are skipped, so leave them out of the queue.
  const order = Array.from({ length: n }, (_, i) => (game.turn + i) % n).filter(
    (i) => i === game.turn || game.players[i].hand.length,
  )
  const youAreUp = playing && human
  const urgent = secondsLeft !== null && secondsLeft <= 10

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-y px-3 py-2.5 transition-colors sm:px-6',
        youAreUp ? 'border-brand-200 bg-brand-50' : 'border-line bg-slate-50',
      )}
      aria-live="polite"
    >
      <div className="flex min-w-[180px] flex-1 items-center gap-2.5">
        <div
          className={clsx(
            'relative grid size-10 shrink-0 place-items-center rounded-full',
            youAreUp && (urgent ? 'shadow-[0_0_0_3px_#e11d48]' : 'shadow-[0_0_0_3px_#8b5cf6]'),
            turnShake(youAreUp, secondsLeft),
          )}
          style={{ background: AVATAR_BACKGROUNDS[game.turn] }}
        >
          <Dog color={current.color} collar={COLLAR_COLORS[game.turn % COLLAR_COLORS.length]} className="size-9" />
          {playing && !human && current.persona && (
            <PersonaBadge id={current.persona} />
          )}
        </div>
        <div className="min-w-0">
          <div className={clsx('truncate font-display text-base font-semibold sm:text-lg', youAreUp ? 'text-brand-700' : 'text-ink')}>
            {!playing ? t('turn.over') : youAreUp ? t('turn.you') : t('turn.other', { name: current.name })}
          </div>
          {playing && !human && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <ThinkingDots />
              {store.awaitingHandoff ? t('turn.waitDevice') : t('turn.thinking')}
            </div>
          )}
        </div>
        <span className="ml-auto shrink-0 rounded-md bg-white/70 px-2 py-1 text-[10px] tracking-wider text-muted md:hidden">
          {t('scene.round', { round: game.round, rounds: ROUNDS })}
        </span>
        {youAreUp && (
          <div className="flex shrink-0 items-center gap-2 md:ml-auto">
            {secondsLeft !== null && turnSeconds > 0 ? (
              <Countdown left={secondsLeft} total={turnSeconds} urgent={urgent} label={t('turn.seconds', { s: secondsLeft })} />
            ) : (
              <span className="text-[10px] text-subtle">{t('turn.noLimit')}</span>
            )}
          </div>
        )}
      </div>

      {playing && (
        <ol aria-label={t('turn.order')} className="flex w-full items-center gap-1 overflow-x-auto sm:w-auto sm:max-w-full">
          {order.map((i, pos) => {
            const p = game.players[i]
            return (
              <li key={i} className="flex shrink-0 items-center gap-1">
                {pos > 0 && <span className="text-[10px] text-subtle">›</span>}
                <span
                  className={clsx(
                    'flex items-center gap-1 rounded-full border py-0.5 pr-2 pl-0.5 text-[10px]',
                    pos === 0 ? 'border-brand-300 bg-white font-semibold text-brand-700' : 'border-transparent text-muted',
                  )}
                >
                  <span className="grid size-5 place-items-center overflow-hidden rounded-full" style={{ background: AVATAR_BACKGROUNDS[i] }}>
                    <Dog color={p.color} className="size-5" />
                  </span>
                  <span className="max-w-[64px] truncate">{p.name}</span>
                  {pos === 1 && <span className="rounded bg-brand-100 px-1 text-[8px] tracking-wide text-slate-600">{t('turn.next')}</span>}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function Countdown({ left, total, urgent, label }: { left: number; total: number; urgent: boolean; label: string }) {
  const r = 16
  const c = 2 * Math.PI * r
  return (
    <div className={clsx('relative grid size-11 place-items-center', urgent && 'animate-pulse')} role="timer" aria-label={label}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="white" stroke="#ede9fe" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={urgent ? '#e11d48' : '#6d28d9'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, left) / total)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span className={clsx('relative text-xs font-bold tabular-nums', urgent ? 'text-rose-600' : 'text-brand-700')}>{Math.max(0, left)}</span>
    </div>
  )
}

function ThinkingDots() {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[0, 150, 300].map((d) => (
        <span key={d} className="size-1 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  )
}

function PersonaBadge({ id }: { id: keyof typeof PERSONA_ICONS }) {
  const Icon = PERSONA_ICONS[id]
  return (
    <span className="absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-white text-slate-600 shadow-sm">
      <Icon size={11} strokeWidth={2.4} />
    </span>
  )
}
