import clsx from 'clsx'
import { AVATAR_BACKGROUNDS, COLLAR_COLORS } from '@/game/constants'
import { isHumanTurn, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'

const panel = 'rounded-[15px] border border-line bg-paper p-3 sm:p-4'

export function PartyPanel() {
  const store = useGameStore()
  const { game, tapPlayer, openModal } = store
  const human = isHumanTurn(store)

  return (
    <section className={panel}>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="m-0 text-xs font-bold sm:text-sm">
          The little pack{' '}
          <span className="ml-1 rounded-md bg-[#edf0e4] px-1.5 py-0.5 text-[10px] text-muted">{game.players.length}</span>
        </h2>
        <span className="rounded bg-[#f1f2e9] px-1.5 py-1 text-[8px] tracking-wide text-muted">
          {game.mode === 'solo' ? 'SOLO + BOTS' : 'PASS & PLAY'}
        </span>
      </div>

      {game.players.map((p, i) => {
        const active = i === game.turn && !game.ended
        const status = game.ended
          ? p.role === 'mischief'
            ? '🐿 Mischief dog'
            : '🐾 Treasure hunter'
          : p.blocked
            ? '🐿 Distracted by a squirrel'
            : active
              ? 'Following a little hunch'
              : 'Looking innocent'
        return (
          <button
            key={i}
            type="button"
            aria-label={`Target ${p.name}`}
            onClick={() => tapPlayer(i)}
            className={clsx(
              'my-1 flex w-full items-center gap-2 rounded-[9px] border p-1.5 text-left sm:gap-2.5 sm:p-2',
              active ? 'border-sage-200 bg-sage-100' : 'border-transparent',
            )}
          >
            <div
              className="flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-full sm:size-9"
              style={{ background: AVATAR_BACKGROUNDS[i] }}
            >
              <Dog color={p.color} collar={COLLAR_COLORS[i % COLLAR_COLORS.length]} className="size-[30px] sm:size-[35px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold sm:text-xs">
                {p.name}
                {i === 0 && <small className="ml-1.5 text-[8px] text-subtle">YOU</small>}
              </div>
              <div className="mt-0.5 text-[10px] text-muted">{status}</div>
            </div>
            <span className="text-[10px] text-[#7a8767]">{active ? '●' : `${p.hand.length} ▧`}</span>
          </button>
        )
      })}

      <button
        type="button"
        disabled={!human}
        onClick={() => openModal({ kind: 'role' })}
        className="mt-2 flex w-full items-center gap-2 rounded-[9px] border border-dashed border-line-strong bg-[#f7f8ef] p-2.5 text-left disabled:opacity-40 sm:mt-4"
      >
        <span className="text-xl text-[#8b9b6a]" aria-hidden="true">
          ♧
        </span>
        <div>
          <small className="block text-[8px] tracking-widest text-subtle">FOR YOUR EYES ONLY</small>
          <b className="mt-1 block text-[11px] font-medium">Peek at your secret role</b>
        </div>
        <span className="ml-auto text-sm" aria-hidden="true">
          ↗
        </span>
      </button>
    </section>
  )
}

const REACTIONS = ['👀', '🐾', '💛', '🤔']

export function ActivityPanel({ onReact }: { onReact: (emoji: string) => void }) {
  const log = useGameStore((s) => s.game.log)

  return (
    <section className={panel}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-xs font-bold sm:text-sm">Garden gossip</h2>
        <span className="size-1.5 rounded-full bg-sage" />
      </div>
      <div aria-live="polite" className="h-[190px] overflow-auto">
        {log.slice(0, 12).map((e) => (
          <div key={`${e.time}-${e.name}-${e.text}`} className="flex animate-pop gap-2 pb-4 text-[11px] leading-normal text-muted">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#f0f2e6] text-xs">{e.icon}</span>
            <div>
              <b className="font-semibold text-[#556545]">{e.name}</b> {e.text}
              <small className="mt-0.5 block text-[9px] text-subtle">
                {new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 border-t border-[#ebeee1] pt-3">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`React ${emoji}`}
            onClick={() => onReact(emoji)}
            className="size-[29px] rounded-md border border-[#e8ecdd] bg-sage-50 text-sm"
          >
            {emoji}
          </button>
        ))}
        <span className="ml-1 hidden max-w-[70px] text-[9px] leading-normal text-subtle sm:inline">
          Say it with a little feeling
        </span>
      </div>
    </section>
  )
}
