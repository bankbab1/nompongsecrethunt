import { useEffect, useState } from 'react'
import { isHumanTurn, useGameStore } from '@/store/gameStore'

/**
 * Seconds left in the current human turn, or null when no clock applies (bots' turns,
 * no time limit, round over). The clock pauses while a dialog is open and passes the
 * selected card when it runs out.
 */
export function useTurnClock(): number | null {
  const store = useGameStore()
  const { game, turnSeconds, modal, timeUp } = store
  const human = isHumanTurn(store)
  const active = human && turnSeconds > 0
  // Changes on every move, so each turn gets a fresh clock.
  const turnKey = `${game.round}:${game.turn}:${game.deck.length}:${game.players[game.turn].hand.length}:${active}`
  const [clock, setClock] = useState({ key: turnKey, left: turnSeconds })
  const left = clock.key === turnKey ? clock.left : turnSeconds

  useEffect(() => {
    if (!active || modal) return
    const id = setInterval(
      () => setClock((c) => ({ key: turnKey, left: (c.key === turnKey ? c.left : turnSeconds) - 1 })),
      1000,
    )
    return () => clearInterval(id)
  }, [active, modal, turnKey, turnSeconds])

  useEffect(() => {
    if (active && !modal && left <= 0) timeUp()
  }, [active, modal, left, timeUp])

  return active ? Math.max(0, left) : null
}
