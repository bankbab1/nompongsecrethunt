import { DIRS } from '@/game/constants'
import type { Mask } from '@/game/types'

/**
 * A scent-trail tile: one path stroke out to each open edge of the mask. Dead ends stop
 * short of the centre, where a puddle blocks the scent.
 */
export function Trail({ mask, dead = false, mini = false }: { mask: Mask; dead?: boolean; mini?: boolean }) {
  const from = dead ? 26 : 0
  const d = DIRS.filter(([, , bit]) => mask & bit)
    .map(([dx, dy]) => `M${50 + dx * from} ${50 + dy * from}L${50 + dx * 55} ${50 + dy * 55}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="block size-full">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke={dead ? '#c9b98e' : '#bcc28e'} strokeWidth="29" />
        <path d={d} stroke={dead ? '#efe2c0' : '#f5eccd'} strokeWidth="23" />
        <path d={d} stroke="#fff9e0" strokeWidth="2" strokeDasharray="1 10" opacity=".7" />
      </g>
      <circle cx="23" cy="24" r="2" fill="#a5b57a" />
      <path d="M79 80l-3-6m3 6l4-4" stroke="#9eb574" strokeWidth="2" />
      {dead ? (
        <g>
          <ellipse cx="50" cy="52" rx="17" ry="13" fill="#8fa9b8" />
          <ellipse cx="47" cy="49" rx="10" ry="6" fill="#b8d0dc" />
          <path d="M40 66l20-32" stroke="#b5654e" strokeWidth="4" strokeLinecap="round" opacity=".85" />
        </g>
      ) : (
        !mini && (
          <g fill="#bfb287">
            <ellipse cx="48" cy="48" rx="3" ry="4" transform="rotate(-25 48 48)" />
            <circle cx="44" cy="42" r="1.3" />
            <circle cx="48" cy="40" r="1.3" />
          </g>
        )
      )}
    </svg>
  )
}
