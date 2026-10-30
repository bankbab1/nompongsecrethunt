import clsx from 'clsx'
import { Construction, Focus, Hand, LayoutGrid, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { geoOf, isSealed } from '@/game/board'
import { THEMES } from '@/game/constants'
import { useT } from '@/i18n'
import { DEFAULT_VIEW, TOP_VIEW, useGameStore } from '@/store/gameStore'
import { GardenBackdrop } from './art/GardenBackdrop'
import { Board } from './Board'
import { IconChip, logIcon, MISSION_ICONS, REACTION_ICONS, THEME_ICONS } from './icons'
import { TurnBar } from './TurnBar'

export interface FloatingReaction {
  id: number
  /** Index into REACTION_ICONS, or into the confetti set for confetti. */
  icon: number
  left: number
}

export function Scene({ reactions, secondsLeft }: { reactions: FloatingReaction[]; secondsLeft: number | null }) {
  const t = useT()
  const game = useGameStore((s) => s.game)
  const zoom = useGameStore((s) => s.zoom)
  const setZoom = useGameStore((s) => s.setZoom)
  const setTheme = useGameStore((s) => s.setTheme)
  const view = useGameStore((s) => s.view)
  const setView = useGameStore((s) => s.setView)
  const sealed = game.phase === 'playing' && isSealed(geoOf(game), game.board, game.revealed)
  const modal = useGameStore((s) => s.modal)
  const hint = useOrbitHint(game.match, game.round, modal !== null)
  const orbit = useOrbit(view, setView, hint.dismiss)
  // The latest thing that happened, ignoring chatter, so the board can say "just now…".
  const last = game.log.find((e) => e.speaker === undefined)
  const Mission = MISSION_ICONS[game.mission]
  const WorldIcon = THEME_ICONS[game.theme]
  const upright = Math.round(view.spin / 360) * 360

  const tools = [
    { label: t('zoom.in'), Icon: ZoomIn, onClick: () => setZoom(zoom + 0.1) },
    { label: t('zoom.out'), Icon: ZoomOut, onClick: () => setZoom(zoom - 0.1) },
    { label: t('view.left'), Icon: RotateCcw, onClick: () => setView({ ...view, spin: view.spin - 90 }) },
    { label: t('view.right'), Icon: RotateCw, onClick: () => setView({ ...view, spin: view.spin + 90 }) },
    { label: t('view.top'), Icon: LayoutGrid, onClick: () => setView({ ...TOP_VIEW, spin: upright }) },
    {
      label: t('view.reset'),
      Icon: Focus,
      onClick: () => {
        setView({ ...DEFAULT_VIEW, spin: upright })
        setZoom(1)
      },
    },
  ]

  return (
    <>
      <div className="hidden items-center gap-3 px-6 py-4 md:flex">
        <WorldIcon size={22} className="text-[#a9ae6e]" />
        <div>
          <b className="block text-sm font-semibold">{t(`world.${game.theme}`)}</b>
          <small className="mt-0.5 block text-[11px] text-muted">{t(`world.${game.theme}.sub`)}</small>
        </div>
      </div>

      <TurnBar secondsLeft={secondsLeft} />

      <div
        className={clsx(
          `theme-${game.theme}`,
          'relative overflow-hidden bg-meadow',
          {
            // Phones: fill the gap between the turn bar and the pinned hand, so nothing overlaps.
            small: 'h-[max(280px,calc(100dvh-390px))] md:h-[440px] min-[1450px]:h-[490px]',
            classic: 'h-[max(280px,calc(100dvh-390px))] md:h-[520px] min-[1450px]:h-[580px]',
            large: 'h-[max(280px,calc(100dvh-390px))] md:h-[600px] min-[1450px]:h-[660px]',
          }[game.size ?? 'small'],
          game.theme === 'night' && 'bg-[#60786d]',
        )}
      >
        <GardenBackdrop className="garden-backdrop absolute inset-0 size-full transition-[filter] duration-1000" />

        <div className="absolute top-2.5 left-2.5 z-20 flex max-w-[60%] items-center gap-2 rounded-xl bg-white/90 py-1.5 pr-3 pl-1.5 shadow-[0_4px_14px_#4b653118] md:top-4 md:left-5 md:py-2 md:pl-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f3efdb] text-[#8a6a3c] md:size-10">
            <Mission size={20} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <small className="block truncate text-[9px] tracking-wider text-muted">{t('scene.mission')}</small>
            <b className="block truncate text-xs capitalize md:text-sm">{t('scene.missionLine', { item: t(`mission.${game.mission}`) })}</b>
          </div>
        </div>

        <div className="absolute top-2.5 right-2.5 z-20 flex gap-1 rounded-full bg-white/70 p-1 md:top-4 md:right-4">
          {THEMES.map((theme) => {
            const Icon = THEME_ICONS[theme]
            return (
              <button
                key={theme}
                type="button"
                aria-label={t(`world.${theme}`)}
                aria-pressed={game.theme === theme}
                onClick={() => setTheme(theme)}
                className={clsx('grid size-7 place-items-center rounded-full', game.theme === theme ? 'bg-forest text-white' : 'text-[#66804c]')}
              >
                <Icon size={15} />
              </button>
            )
          })}
        </div>

        <div
          {...orbit}
          className="absolute inset-[50px_44px_48px_6px] flex cursor-grab touch-none items-center justify-center active:cursor-grabbing md:inset-[72px_64px_60px_4%]"
        >
          <Board />
        </div>

        {hint.show && <OrbitHint label={t('view.hint')} />}

        {sealed && (
          <div className="absolute top-14 left-1/2 z-20 flex w-[min(92%,420px)] -translate-x-1/2 animate-pop items-start gap-2 rounded-xl bg-[#fff1e6] px-3 py-2 text-[12px] leading-snug text-[#8a4a2b] shadow-[0_6px_20px_#8a4a2b22] ring-1 ring-[#f1cdb5]">
            <Construction size={16} className="mt-0.5 shrink-0" />
            <span>
              <b>{t('sealed.title')}</b> {t('sealed.body')}
            </span>
          </div>
        )}

        <div className="absolute top-12 right-2 z-20 flex flex-col overflow-hidden rounded-xl bg-white/90 shadow-[0_3px_12px_#364b2025] md:top-1/2 md:right-4 md:-translate-y-1/2">
          {tools.map(({ label, Icon, onClick }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onClick={onClick}
              className="grid size-8 place-items-center border-b border-[#e3e8d6] text-[#3f5a35] last:border-b-0 active:bg-sage-100 md:size-9"
            >
              <Icon size={16} strokeWidth={2} />
            </button>
          ))}
        </div>

        {last && (
          <div
            key={`${last.time}-${last.key}`}
            className="absolute bottom-2.5 left-2.5 z-20 flex max-w-[calc(100%-64px)] animate-pop items-center gap-2 rounded-xl bg-white/90 py-1.5 pr-3 pl-1.5 text-[11px] leading-snug text-ink shadow-[0_4px_14px_#36502322] md:bottom-4 md:left-5 md:text-xs"
          >
            <IconChip icon={logIcon(last.key)} />
            <span className="line-clamp-2">
              <b className="mr-1 text-[9px] tracking-widest text-subtle uppercase">{t('last.title')}</b>
              {t(last.key, last.params)}
            </span>
          </div>
        )}

        {reactions.map((r) => {
          const Icon = REACTION_ICONS[r.icon]
          return (
            <Icon
              key={r.id}
              size={36}
              strokeWidth={1.8}
              className="pointer-events-none absolute bottom-[20%] z-30 animate-float-up text-white drop-shadow-[0_2px_6px_#1f332580]"
              style={{ left: `${r.left}%` }}
            />
          )
        })}
      </div>
    </>
  )
}

/**
 * Drag anywhere over the board to orbit the camera: sideways spins the garden all the way
 * round, up/down tilts between a flat top view and a low angle. A drag never counts as a tap.
 */
function useOrbit(
  view: { tilt: number; spin: number },
  setView: (v: { tilt: number; spin: number }) => void,
  onOrbit: () => void,
) {
  const drag = useRef<{ x: number; y: number; tilt: number; spin: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  return {
    onPointerDown: (e: React.PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY, tilt: view.tilt, spin: view.spin, moved: false }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.moved && Math.hypot(dx, dy) < 8) return
      if (!d.moved) {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        onOrbit()
      }
      d.moved = true
      setView({ spin: d.spin - dx * 0.5, tilt: d.tilt - dy * 0.3 })
    },
    onPointerUp: () => {
      suppressClick.current = Boolean(drag.current?.moved)
      drag.current = null
    },
    onPointerCancel: () => {
      drag.current = null
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (suppressClick.current) {
        e.stopPropagation()
        e.preventDefault()
        suppressClick.current = false
      }
    },
  }
}

/**
 * Shows the "drag to look around" hint once at the start of each match, as soon as the
 * setup and tutorial dialogs are out of the way. It goes after the first drag or 6 seconds.
 */
function useOrbitHint(match: number, round: number, dialogOpen: boolean) {
  const [shownFor, setShownFor] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState<number | null>(null)
  const due = round === 1 && !dialogOpen && dismissed !== match

  useEffect(() => {
    if (!due) return
    setShownFor(match)
    const timer = setTimeout(() => setDismissed(match), 6000)
    return () => clearTimeout(timer)
  }, [due, match])

  return { show: due && shownFor === match, dismiss: () => setDismissed(match) }
}

function OrbitHint({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
      <div className="flex animate-pop flex-col items-center gap-2 rounded-2xl bg-forest/85 px-5 py-4 text-white shadow-[0_10px_30px_#1f332555] backdrop-blur-sm">
        <div className="relative grid size-16 place-items-center">
          <svg viewBox="0 0 64 64" className="absolute inset-0 animate-orbit" aria-hidden="true">
            <path d="M32 6a26 26 0 1 1-24.5 17.3" fill="none" stroke="#dce8b8" strokeWidth="4" strokeLinecap="round" />
            <path d="M3 14l4.5 9.5L17 19" fill="none" stroke="#dce8b8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-bold">360°</span>
        </div>
        <Hand size={26} strokeWidth={1.8} className="animate-swipe" aria-hidden="true" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </div>
  )
}
