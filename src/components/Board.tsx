import clsx from 'clsx'
import { BOARD_COLS, BOARD_ROWS, GOAL_DECOYS, MISSIONS } from '@/game/constants'
import { isGoalCell, isLegal, isStartCell, key, reachable } from '@/game/rules'
import { isHumanTurn, selectedMask, useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { Trail } from './art/Trail'

export function Board() {
  const store = useGameStore()
  const { game, preview, zoom, tapCell } = store
  const player = game.players[game.turn]
  const card = player.hand[store.selected]
  const mask = selectedMask(store)
  const placing = isHumanTurn(store) && !player.blocked && card?.type === 'trail'
  const seen = placing ? reachable(game.board) : null

  const cells = []
  for (let y = 0; y < BOARD_ROWS; y++)
    for (let x = 0; x < BOARD_COLS; x++) {
      const tile = game.board[key(x, y)]
      const start = isStartCell(x, y)
      const goal = isGoalCell(x, y)
      const gi = y / 2
      const revealed = goal && game.revealed.includes(gi)
      const valid = seen !== null && isLegal(game.board, x, y, mask, seen)
      const previewing = preview?.x === x && preview.y === y

      let label = `Empty spot ${x}, ${y}`
      if (goal) label = `Hiding spot ${gi + 1}`
      else if (start) label = 'Nompong start'
      else if (tile !== undefined) label = `Trail at ${x}, ${y}`
      else if (valid) label = `Place trail at ${x}, ${y}`

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
              : goal
                ? clsx('border-[#dce6b7] shadow-[0_5px_0_#a2ba77]', revealed ? 'bg-sun' : 'bg-[#cedda8]')
                : tile !== undefined
                  ? 'animate-pop border-[#c5ce93] bg-linear-145 from-[#e9e6c0] to-[#d0d7a2] shadow-[0_4px_0_#a3b77b,0_7px_12px_#69834b22]'
                  : 'border-[#aec68135] bg-[#c9dba055] hover:bg-[#f5fac655]',
            valid && !previewing && 'border-dashed border-[#fbffe5a6] bg-[#edf4c035]',
            previewing && 'z-10 bg-[#f9ffd2] shadow-[0_0_0_3px_#54783f]',
          )}
        >
          {previewing ? (
            <Trail mask={mask} />
          ) : start ? (
            <>
              <Dog className="block size-full" />
              <span className="absolute -bottom-4 left-0 w-full text-[8px] tracking-wider whitespace-nowrap text-[#607b47]">
                START HERE
              </span>
            </>
          ) : goal ? (
            <>
              <span className="text-2xl drop-shadow-[0_3px_0_#66834526] sm:text-3xl">
                {revealed ? (gi === game.treasure ? MISSIONS[game.mission].icon : '🪨') : GOAL_DECOYS[gi]}
              </span>
              {!revealed && (
                <span className="absolute -top-1 -right-1 grid size-[18px] place-items-center rounded-full bg-[#ffffed] text-[11px] text-[#78935c] shadow-[0_2px_5px_#78935c22]">
                  ?
                </span>
              )}
            </>
          ) : tile !== undefined ? (
            <Trail mask={tile} />
          ) : valid ? (
            <span className="absolute inset-0 grid place-items-center text-2xl text-[#fbffe5b0]">+</span>
          ) : null}
        </button>,
      )
    }

  return (
    <div
      aria-label="Treasure hunt board"
      className="board-tilt grid size-full grid-cols-8 grid-rows-5 gap-[3px] transition-[scale] duration-250 sm:gap-1"
      style={{ scale: zoom }}
    >
      {cells}
    </div>
  )
}
