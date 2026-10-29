import clsx from 'clsx'
import { goalAt, isLegal, isStartCell, key, network } from '@/game/board'
import { BOARD_COLS, BOARD_ROWS, GOAL_DECOYS, MISSIONS } from '@/game/constants'
import { useT } from '@/i18n'
import { isHumanTurn, selectedMask, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { Trail } from './art/Trail'

export function Board() {
  const t = useT()
  const store = useGameStore()
  const { game, preview, zoom, tapCell } = store
  const player = game.players[game.turn]
  const card = player.hand[store.selected]
  const mask = selectedMask(store)
  const human = isHumanTurn(store)
  const placing = human && !player.broken.length && card?.type === 'path'
  const open = placing ? network(game.board).open : null
  // Only the dog holding the device sees its own sniffs.
  const known = human ? game.knowledge[game.turn] : [null, null, null]

  const cells = []
  for (let y = 0; y < BOARD_ROWS; y++)
    for (let x = 0; x < BOARD_COLS; x++) {
      const tile = game.board[key(x, y)]
      const start = isStartCell(x, y)
      const goal = goalAt(x, y)
      const revealed = goal !== null && game.revealed.includes(goal)
      const valid = open !== null && isLegal(game.board, x, y, mask, open)
      const previewing = preview?.x === x && preview.y === y

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
              <span className="text-xl drop-shadow-[0_3px_0_#66834526] sm:text-2xl lg:text-3xl">
                {revealed ? (goal === game.treasure ? MISSIONS[game.mission] : '🪨') : GOAL_DECOYS[goal]}
              </span>
              {!revealed && (
                <span
                  title={known[goal] ? t('cell.youSniffed', { what: known[goal] === 'treasure' ? MISSIONS[game.mission] : '🪨' }) : undefined}
                  className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-[#ffffed] text-[11px] text-[#78935c] shadow-[0_2px_5px_#78935c22]"
                >
                  {known[goal] ? (known[goal] === 'treasure' ? MISSIONS[game.mission] : '🪨') : '?'}
                </span>
              )}
            </>
          ) : tile ? (
            <Trail mask={tile.mask} dead={tile.dead} />
          ) : valid ? (
            <span className="absolute inset-0 grid place-items-center text-xl text-[#fbffe5b0]">+</span>
          ) : null}
        </button>,
      )
    }

  return (
    <div
      aria-label={t('board.label')}
      className="board-tilt grid size-full grid-cols-9 grid-rows-5 gap-[3px] transition-[scale] duration-250 sm:gap-1"
      style={{ scale: zoom }}
    >
      {cells}
    </div>
  )
}
