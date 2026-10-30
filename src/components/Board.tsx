import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { geoOf, goalAt, isLegal, isStartCell, key, network } from '@/game/board'
import { Shovel } from 'lucide-react'
import { useT } from '@/i18n'
import { isHumanTurn, selectedMask, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { Trail } from './art/Trail'
import { GOAL_ICONS, MISSION_ICONS, RockIcon } from './icons'

export function Board() {
  const t = useT()
  const store = useGameStore()
  const { game, preview, zoom, view, tapCell } = store
  const geo = geoOf(game)
  // Fit whole cells into the space available, keeping them square.
  const stage = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(40)
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const fit = () => setCell(Math.max(18, Math.floor(Math.min(el.clientWidth / geo.cols, el.clientHeight / geo.rows))))
    fit()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [geo.cols, geo.rows])

  const player = game.players[game.turn]
  const card = player.hand[store.selected]
  const mask = selectedMask(store)
  const human = isHumanTurn(store)
  const placing = human && !player.broken.length && card?.type === 'path'
  const open = placing ? network(geo, game.board).open : null
  const sniffing = human && card?.type === 'sniff'
  const digging = human && card?.type === 'dig'
  const last = game.lastAction
  const Treasure = MISSION_ICONS[game.mission]
  const iconSize = Math.max(14, Math.round(cell * 0.5))
  // Only the dog holding the device sees its own sniffs.
  const known = human ? game.knowledge[game.turn] : [null, null, null]

  const cells = []
  for (let y = 0; y < geo.rows; y++)
    for (let x = 0; x < geo.cols; x++) {
      const tile = game.board[key(x, y)]
      const start = isStartCell(geo, x, y)
      const goal = goalAt(geo, x, y)
      const revealed = goal !== null && game.revealed.includes(goal)
      const valid = open !== null && isLegal(geo, game.board, x, y, mask, open)
      const previewing = preview?.x === x && preview.y === y
      const target =
        (sniffing && goal !== null && !revealed) || (digging && tile !== undefined && !start)
      const justPlayed = last && (last.kind === 'path' || last.kind === 'dig') && last.x === x && last.y === y

      let label = t('cell.empty', { x, y })
      if (goal !== null) label = t('cell.goal', { n: goal + 1 })
      else if (start) label = t('cell.start')
      else if (tile) label = t('cell.trail', { x, y })
      else if (valid) label = t('cell.place', { x, y })

      cells.push(
        <button
          key={key(x, y)}
          type="button"
          aria-label={label}
          onClick={() => tapCell(x, y)}
          className={clsx(
            'relative min-h-0 min-w-0 rounded-md border p-0 transition-[background,transform] sm:rounded-[9px]',
            start
              ? 'overflow-visible border-[#e6dfb8] bg-[#f6efcf] shadow-[0_4px_0_#acb97e]'
              : goal !== null
                ? clsx('border-[#dce6b7] shadow-[0_5px_0_#a2ba77]', revealed ? 'bg-sun' : 'bg-[#cedda8]')
                : tile
                  ? 'animate-pop border-[#c5ce93] bg-linear-145 from-[#e9e6c0] to-[#d0d7a2] shadow-[0_4px_0_#a3b77b,0_7px_12px_#69834b22]'
                  : 'border-[#aec68135] bg-[#c9dba055] hover:bg-[#f5fac655]',
            valid && !previewing && 'border-dashed border-[#fbffe5a6] bg-[#edf4c035]',
            previewing && 'z-10 bg-[#f9ffd2] shadow-[0_0_0_3px_#54783f]',
            target && 'z-10 animate-pulse ring-3 ring-[#f3c84b]',
            justPlayed && !target && 'z-[5] ring-2 ring-[#f3c84b]/80',
          )}
        >
          {previewing && card?.type === 'path' ? (
            <Trail mask={mask} dead={card.dead} />
          ) : start ? (
            <>
              <Dog className="block size-full" />
              <span className="absolute -bottom-4 left-0 w-full text-[8px] tracking-wider whitespace-nowrap text-[#607b47]">
                {t('board.start')}
              </span>
            </>
          ) : goal !== null ? (
            <>
              <span className="grid size-full place-items-center text-[#5f7140]">
                {(() => {
                  const Icon = revealed ? (goal === game.treasure ? Treasure : RockIcon) : GOAL_ICONS[goal]
                  return <Icon size={iconSize} strokeWidth={1.7} className={revealed && goal === game.treasure ? 'text-[#b8862b]' : undefined} />
                })()}
              </span>
              {!revealed && (
                <span
                  title={known[goal] ? t('cell.youSniffed', { what: t(known[goal] === 'treasure' ? 'peek.treasure' : 'peek.rock') }) : undefined}
                  className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-[#ffffed] text-[11px] font-bold text-[#78935c] shadow-[0_2px_5px_#78935c22]"
                >
                  {known[goal] === 'treasure' ? <Treasure size={11} strokeWidth={2.4} /> : known[goal] === 'rock' ? <RockIcon size={11} strokeWidth={2.4} /> : '?'}
                </span>
              )}
            </>
          ) : tile ? (
            <Trail mask={tile.mask} dead={tile.dead} />
          ) : null}
          {digging && tile && !start && (
            <Shovel size={13} strokeWidth={2.2} className="absolute -top-1.5 -right-1 rounded-full bg-white p-0.5 text-[#8a6a3c]" aria-hidden="true" />
          )}
          {justPlayed && last.kind === 'dig' && !tile && (
            <Shovel size={iconSize * 0.8} strokeWidth={1.6} className="absolute inset-0 m-auto text-[#8a6a3c] opacity-60" aria-hidden="true" />
          )}
          {!previewing && !start && goal === null && !tile && valid ? (
            <span className="absolute inset-0 grid place-items-center text-xl text-[#fbffe5b0]">+</span>
          ) : null}
        </button>,
      )
    }

  return (
    <div ref={stage} className="flex size-full items-center justify-center [perspective:1400px]">
      <div
        aria-label={t('board.label')}
        className="grid gap-[3px] transition-transform duration-300 ease-out sm:gap-1 [transform-style:preserve-3d]"
        style={{
          gridTemplateColumns: `repeat(${geo.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${geo.rows}, minmax(0, 1fr))`,
          width: cell * geo.cols,
          height: cell * geo.rows,
          transform: `rotateX(${view.tilt}deg) rotateZ(${view.spin}deg) scale(${zoom})`,
        }}
      >
        {cells}
      </div>
    </div>
  )
}
