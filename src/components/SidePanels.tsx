import clsx from 'clsx'
import { AVATAR_BACKGROUNDS, COLLAR_COLORS, PERSONAS, TOOL_ICONS } from '@/game/constants'
import { score } from '@/game/rules'
import { packSuspicion } from '@/game/suspicion'
import { translate, useT } from '@/i18n'
import { isHumanTurn, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'

const panel = 'rounded-[15px] border border-line bg-paper p-3 sm:p-4'

export function PartyPanel() {
  const t = useT()
  const store = useGameStore()
  const { game, tapPlayer, accusePlayer, openModal } = store
  const human = isHumanTurn(store)
  const over = game.phase !== 'playing'
  // Your own seat is "you" in solo; in pass & play it's whoever holds the device.
  const me = game.mode === 'solo' ? 0 : human ? game.turn : -1

  return (
    <section className={panel}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="m-0 text-xs font-bold sm:text-sm">
          {t('party.title')}{' '}
          <span className="ml-1 rounded-md bg-[#edf0e4] px-1.5 py-0.5 text-[10px] text-muted">{game.players.length}</span>
        </h2>
        <span className="rounded bg-[#f1f2e9] px-1.5 py-1 text-[8px] tracking-wide text-muted">
          {game.mode === 'solo' ? t('party.solo') : t('party.local')}
        </span>
      </div>

      {game.players.map((p, i) => {
        const active = i === game.turn && !over
        const suspicion = Math.round(packSuspicion(game, i))
        const persona = p.persona ? PERSONAS[p.persona] : null
        return (
          <div
            key={i}
            className={clsx(
              'my-1 flex items-center gap-1 rounded-[9px] border',
              active ? 'border-sage-200 bg-sage-100' : 'border-transparent',
            )}
          >
            <button
              type="button"
              aria-label={t('party.target', { name: p.name })}
              onClick={() => tapPlayer(i)}
              className="flex min-w-0 flex-1 items-center gap-2 p-1.5 text-left sm:gap-2.5 sm:p-2"
            >
              <div
                className="relative flex size-[32px] shrink-0 items-center justify-center rounded-full sm:size-9"
                style={{ background: AVATAR_BACKGROUNDS[i] }}
              >
                <Dog color={p.color} collar={COLLAR_COLORS[i % COLLAR_COLORS.length]} className="size-[30px] sm:size-[35px]" />
                {persona && (
                  <span className="absolute -right-1 -bottom-1 text-[13px]" aria-hidden="true">
                    {persona.emoji}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate text-[11px] font-semibold sm:text-xs">
                  {p.name}
                  {i === me && <small className="text-[8px] text-subtle">{t('party.you')}</small>}
                  {p.broken.map((tool) => (
                    <span key={tool} title={t(`tool.broken.${tool}`)} className="text-xs">
                      {TOOL_ICONS[tool].broken}
                    </span>
                  ))}
                </div>
                <div className="mt-0.5 truncate text-[10px] text-muted">
                  {over
                    ? `${p.role === 'sneaky' ? '🐿 ' + t('role.sneaky') : '🐾 ' + t('role.hunter')}`
                    : persona
                      ? t(`persona.${persona.id}`)
                      : active
                        ? t('status.thinking')
                        : t('status.innocent')}
                </div>
                <div className="mt-1 flex items-center gap-1.5" title={`${t('party.suspicion')}: ${suspicion}%`}>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#e9ecdf]">
                    <div
                      className={clsx('h-full rounded-full transition-[width] duration-500', suspicion >= 60 ? 'bg-[#c0674f]' : suspicion >= 35 ? 'bg-[#d6a64b]' : 'bg-sage')}
                      style={{ width: `${Math.max(3, suspicion)}%` }}
                    />
                  </div>
                  <span className="w-11 shrink-0 text-right text-[9px] text-[#7a8767]">{t('party.points', { n: score(p) })}</span>
                </div>
              </div>
            </button>
            {i !== game.turn && human && (
              <button
                type="button"
                aria-label={t('party.accuse', { name: p.name })}
                title={t('party.accuse', { name: p.name })}
                disabled={game.accusedThisTurn}
                onClick={() => accusePlayer(i)}
                className="mr-1.5 grid size-7 shrink-0 place-items-center rounded-full border border-[#e8ecdd] bg-white text-sm disabled:opacity-30"
              >
                👉
              </button>
            )}
          </div>
        )
      })}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[9px] text-subtle">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-6 rounded-full bg-linear-to-r from-sage via-[#d6a64b] to-[#c0674f]" />
          {t('party.suspicion')}
        </span>
        {human && !game.accusedThisTurn && <span>{t('party.accuseHint')}</span>}
      </div>

      <button
        type="button"
        disabled={!human}
        onClick={() => openModal({ kind: 'role' })}
        className="mt-3 flex w-full items-center gap-2 rounded-[9px] border border-dashed border-line-strong bg-[#f7f8ef] p-2.5 text-left disabled:opacity-40"
      >
        <span className="text-xl text-[#8b9b6a]" aria-hidden="true">
          ♧
        </span>
        <div>
          <small className="block text-[8px] tracking-widest text-subtle">{t('role.eyebrow')}</small>
          <b className="mt-1 block text-[11px] font-medium">{t('role.button')}</b>
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
  const t = useT()
  const log = useGameStore((s) => s.game.log)
  const players = useGameStore((s) => s.game.players)

  return (
    <section className={panel}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-xs font-bold sm:text-sm">{t('gossip.title')}</h2>
        <span className="size-1.5 rounded-full bg-sage" />
      </div>
      <div aria-live="polite" className="h-[240px] overflow-auto">
        {log.slice(0, 25).map((e, i) => {
          const speaker = e.speaker !== undefined ? players[e.speaker] : null
          return (
            <div key={`${e.time}-${i}-${e.key}`} className="flex animate-pop gap-2 pb-3.5 text-[11px] leading-normal text-muted">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#f0f2e6] text-xs">{e.icon}</span>
              <div className="min-w-0">
                {speaker ? (
                  <>
                    <b className="font-semibold text-[#556545]">{speaker.name}</b>{' '}
                    <span className="rounded-lg bg-[#f4f6ec] px-1.5 py-0.5 text-ink">“{translate(t.lang, e.key, e.params)}”</span>
                  </>
                ) : (
                  t(e.key, e.params)
                )}
                <small className="mt-0.5 block text-[9px] text-subtle">
                  {new Date(e.time).toLocaleTimeString(t.lang === 'th' ? 'th-TH' : [], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-1 border-t border-[#ebeee1] pt-3">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={emoji}
            onClick={() => onReact(emoji)}
            className="size-[29px] rounded-md border border-[#e8ecdd] bg-sage-50 text-sm"
          >
            {emoji}
          </button>
        ))}
        <span className="ml-1 hidden max-w-[80px] text-[9px] leading-normal text-subtle sm:inline">{t('gossip.react')}</span>
      </div>
    </section>
  )
}
