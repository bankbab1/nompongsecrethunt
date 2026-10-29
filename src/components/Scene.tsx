import clsx from 'clsx'
import { MISSIONS, ROUNDS, THEME_ICONS } from '@/game/constants'
import type { Theme } from '@/game/types'
import { useT } from '@/i18n'
import { useHints } from '@/lib/hints'
import { useGameStore } from '@/store/gameStore'
import { GardenBackdrop } from './art/GardenBackdrop'
import { Board } from './Board'

export interface FloatingReaction {
  id: number
  emoji: string
  left: number
}

export function Scene({ reactions }: { reactions: FloatingReaction[] }) {
  const t = useT()
  const game = useGameStore((s) => s.game)
  const zoom = useGameStore((s) => s.zoom)
  const setZoom = useGameStore((s) => s.setZoom)
  const setTheme = useGameStore((s) => s.setTheme)
  const { caption } = useHints()

  return (
    <>
      <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-[#a9ae6e]" aria-hidden="true">
            {THEME_ICONS[game.theme]}
          </span>
          <div>
            <b className="block text-xs font-semibold sm:text-sm">{t(`world.${game.theme}`)}</b>
            <small className="mt-0.5 block text-[11px] text-muted">{t(`world.${game.theme}.sub`)}</small>
          </div>
        </div>
        <div className="rounded-md bg-[#f0f2e8] px-2.5 py-1.5 text-[10px] tracking-wider text-muted">
          {t('scene.round', { round: game.round, rounds: ROUNDS })}
        </div>
      </div>

      <div
        className={clsx(
          `theme-${game.theme}`,
          'relative h-[380px] overflow-hidden bg-meadow sm:h-[430px] lg:h-[440px] min-[1450px]:h-[490px]',
          game.theme === 'night' && 'bg-[#60786d]',
        )}
      >
        <GardenBackdrop className="garden-backdrop absolute inset-0 size-full transition-[filter] duration-1000" />

        <div className="absolute top-4 left-3 z-20 flex items-center gap-2 rounded-xl border border-white/50 bg-[#fffff5ed] p-2 shadow-[0_5px_20px_#4b653110] sm:top-5 sm:left-6 sm:gap-3 sm:px-3.5 sm:py-3">
          <span className="rounded-lg bg-[#f3efdb] p-1.5 text-xl sm:text-2xl" aria-hidden="true">
            {MISSIONS[game.mission]}
          </span>
          <div>
            <small className="mb-1 block text-[9px] tracking-widest text-muted">{t('scene.mission')}</small>
            <b className="text-xs capitalize sm:text-sm">{t('scene.missionLine', { item: t(`mission.${game.mission}`) })}</b>
          </div>
        </div>

        <div className="absolute top-4 right-3 z-20 flex gap-1.5 sm:right-4">
          {(Object.keys(THEME_ICONS) as Theme[]).map((theme) => (
            <button
              key={theme}
              type="button"
              aria-label={t(`world.${theme}`)}
              aria-pressed={game.theme === theme}
              onClick={() => setTheme(theme)}
              className={clsx(
                'size-7 rounded-full text-base',
                game.theme === theme ? 'bg-[#526e40] text-white shadow-[0_0_0_2px_#fff]' : 'bg-[#fbfff0aa] text-[#66804c]',
              )}
            >
              {THEME_ICONS[theme]}
            </button>
          ))}
        </div>

        <div className="absolute inset-[96px_10px_62px] flex items-center justify-center sm:inset-[104px_5%_68px] lg:inset-[100px_8%_68px]">
          <Board />
        </div>

        <div className="absolute bottom-4 left-3 flex max-w-[calc(100%-115px)] items-center gap-2 rounded-2xl bg-[#f4f8dfd9] px-3 py-2 text-[11px] leading-snug text-[#526b39] sm:left-6 sm:text-xs">
          <span className="size-1.5 shrink-0 rounded-full bg-[#839f4a]" />
          <span>{caption}</span>
        </div>

        <div className="absolute right-3 bottom-4 flex overflow-hidden rounded-lg shadow-[0_3px_9px_#364b2020] sm:right-5">
          {[
            { label: t('zoom.out'), text: '−', onClick: () => setZoom(zoom - 0.1) },
            { label: t('zoom.reset'), text: '⌖', onClick: () => setZoom(1) },
            { label: t('zoom.in'), text: '+', onClick: () => setZoom(zoom + 0.1) },
          ].map((b) => (
            <button
              key={b.text}
              type="button"
              aria-label={b.label}
              onClick={b.onClick}
              className="size-[30px] border-r border-[#dbe1c8] bg-[#f9fbece6] text-base last:border-r-0"
            >
              {b.text}
            </button>
          ))}
        </div>

        {reactions.map((r) => (
          <span
            key={r.id}
            className="pointer-events-none absolute bottom-[20%] z-30 animate-float-up text-4xl"
            style={{ left: `${r.left}%` }}
          >
            {r.emoji}
          </span>
        ))}
      </div>
    </>
  )
}
