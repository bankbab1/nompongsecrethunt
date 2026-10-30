import clsx from 'clsx'
import { ChevronRight, HeartHandshake, KeyRound, Pointer, VenetianMask, Zap, PawPrint } from 'lucide-react'
import { AVATAR_BACKGROUNDS, COLLAR_COLORS } from '@/game/constants'
import { score } from '@/game/rules'
import { packSuspicion } from '@/game/suspicion'
import { translate, useT } from '@/i18n'
import { turnShake } from '@/lib/turnShake'
import { isHumanTurn, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { IconChip, logIcon, PERSONA_ICONS, REACTION_ICONS, ToolMark } from './icons'

const panel = 'rounded-2xl border border-line bg-paper p-3 md:p-4'

export function PartyPanel({ secondsLeft }: { secondsLeft: number | null }) {
  const t = useT()
  const store = useGameStore()
  const { game, tapPlayer, accusePlayer, openModal } = store
  const human = isHumanTurn(store)
  const over = game.phase !== 'playing'
  // Your own seat is "you" in solo; in pass & play it's whoever holds the device.
  const me = game.mode === 'solo' ? 0 : human ? game.turn : -1
  // Which dogs the selected card can be used on, so they can light up.
  const card = human ? game.players[game.turn].hand[store.selected] : undefined
  const canTarget = (i: number) =>
    card?.type === 'break'
      ? i !== game.turn && !game.players[i].broken.includes(card.tool)
      : card?.type === 'fix'
        ? card.tools.some((tool) => game.players[i].broken.includes(tool))
        : false
  const targeting = card?.type === 'break' || card?.type === 'fix'

  return (
    <section className={panel}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="m-0 flex items-center gap-1.5 text-sm font-bold">
          {t('party.title')}
          <span className="rounded-md bg-[#edf0e4] px-1.5 py-0.5 text-[10px] text-muted">{game.players.length}</span>
        </h2>
        <span className="rounded bg-[#f1f2e9] px-1.5 py-1 text-[9px] tracking-wide text-muted">
          {game.mode === 'solo' ? t('party.solo') : t('party.local')}
        </span>
      </div>

      <ul className="m-0 list-none p-0">
        {game.players.map((p, i) => {
          const active = i === game.turn && !over
          const suspicion = Math.round(packSuspicion(game, i))
          const PersonaIcon = p.persona ? PERSONA_ICONS[p.persona] : null
          const target = canTarget(i)
          return (
            <li
              key={i}
              className={clsx(
                'relative my-1 flex items-center gap-1 rounded-xl border transition-opacity',
                target
                  ? 'animate-pulse border-[#f3c84b] bg-[#fffbe6] ring-2 ring-[#f3c84b]'
                  : active
                    ? 'border-sage-200 bg-sage-100'
                    : 'border-transparent',
                targeting && !target && 'opacity-40',
              )}
            >
              {target && (
                <span className="absolute -top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-[#f3c84b] px-1.5 py-px text-[9px] font-bold text-[#5b4300]">
                  {card?.type === 'fix' ? <HeartHandshake size={10} strokeWidth={2.6} /> : <Zap size={10} strokeWidth={2.6} />}
                  {t('party.tapMe')}
                </span>
              )}
              <button
                type="button"
                aria-label={t('party.target', { name: p.name })}
                onClick={() => tapPlayer(i)}
                className="flex min-w-0 flex-1 items-center gap-2.5 p-2 text-left"
              >
                <div
                  className={clsx('relative grid size-9 shrink-0 place-items-center rounded-full', turnShake(active && human, secondsLeft))}
                  style={{ background: AVATAR_BACKGROUNDS[i] }}
                >
                  <Dog color={p.color} collar={COLLAR_COLORS[i % COLLAR_COLORS.length]} className="size-[34px]" />
                  {PersonaIcon && (
                    <span className="absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-white text-[#5f7140] shadow-sm">
                      <PersonaIcon size={11} strokeWidth={2.4} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className="truncate">{p.name}</span>
                    {i === me && <small className="shrink-0 text-[9px] font-normal text-subtle">{t('party.you')}</small>}
                    {p.broken.map((tool) => (
                      <span key={tool} title={t(`tool.broken.${tool}`)} className="shrink-0">
                        <ToolMark tool={tool} state="broken" size={13} />
                      </span>
                    ))}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted">
                    {over ? (
                      <>
                        {p.role === 'sneaky' ? <VenetianMask size={11} /> : <PawPrint size={11} />}
                        {p.role === 'sneaky' ? t('role.sneaky') : t('role.hunter')}
                      </>
                    ) : p.persona ? (
                      t(`persona.${p.persona}`)
                    ) : active ? (
                      t('status.thinking')
                    ) : (
                      t('status.innocent')
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2" title={`${t('party.suspicion')}: ${suspicion}%`}>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#e9ecdf]">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-[width] duration-500',
                          suspicion >= 60 ? 'bg-[#c0674f]' : suspicion >= 35 ? 'bg-[#d6a64b]' : 'bg-sage',
                        )}
                        style={{ width: `${Math.max(3, suspicion)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] text-[#7a8767] tabular-nums">{t('party.points', { n: score(p) })}</span>
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
                  className="mr-2 grid size-9 shrink-0 place-items-center rounded-full border border-[#e8ecdd] bg-white text-[#a0603f] disabled:opacity-30"
                >
                  <Pointer size={16} strokeWidth={2} />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[10px] text-subtle">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-6 rounded-full bg-linear-to-r from-sage via-[#d6a64b] to-[#c0674f]" />
          {t('party.suspicion')}
        </span>
        {human && !game.accusedThisTurn && (
          <span className="flex items-center gap-1">
            <Pointer size={11} /> {t('party.accuseHint')}
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={!human}
        onClick={() => openModal({ kind: 'role' })}
        className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-dashed border-line-strong bg-[#f7f8ef] p-2.5 text-left disabled:opacity-40"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[#5f7140]">
          <KeyRound size={16} />
        </span>
        <div>
          <small className="block text-[9px] tracking-widest text-subtle">{t('role.eyebrow')}</small>
          <b className="mt-0.5 block text-xs font-medium">{t('role.button')}</b>
        </div>
        <ChevronRight size={16} className="ml-auto text-subtle" />
      </button>
    </section>
  )
}

export function ActivityPanel({ onReact }: { onReact: (icon: number) => void }) {
  const t = useT()
  const log = useGameStore((s) => s.game.log)
  const players = useGameStore((s) => s.game.players)

  return (
    <section className={panel}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="m-0 text-sm font-bold">{t('gossip.title')}</h2>
        <span className="size-1.5 rounded-full bg-sage" />
      </div>
      <div aria-live="polite" className="h-[200px] overflow-auto md:h-[240px]">
        {log.slice(0, 25).map((e, i) => {
          const speaker = e.speaker !== undefined ? players[e.speaker] : null
          const SpeakerIcon = speaker?.persona ? PERSONA_ICONS[speaker.persona] : null
          return (
            <div key={`${e.time}-${i}-${e.key}`} className="flex animate-pop gap-2 pb-3 text-[11px] leading-normal text-muted">
              <IconChip icon={SpeakerIcon ?? logIcon(e.key)} />
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
      <div className="flex items-center gap-1.5 border-t border-[#ebeee1] pt-3">
        {REACTION_ICONS.map((Icon, i) => (
          <button
            key={i}
            type="button"
            aria-label={t('gossip.react')}
            onClick={() => onReact(i)}
            className="grid size-8 place-items-center rounded-lg border border-[#e8ecdd] bg-sage-50 text-[#5f7140]"
          >
            <Icon size={15} />
          </button>
        ))}
        <span className="ml-1 text-[10px] leading-normal text-subtle">{t('gossip.react')}</span>
      </div>
    </section>
  )
}
