import { memo } from 'react'

// Seeded so the scattered grass and flowers land in the same place on every render.
function seeded(seed = 12) {
  return (n: number) => {
    seed = (seed * 9301 + 49297) % 233280
    return (seed / 233280) * n
  }
}

const r = seeded()
const pickets = Array.from({ length: 27 }, (_, i) => i * 40 - 20)
const tufts = Array.from({ length: 120 }, () => [r(1000), r(650)])
const flowers = Array.from({ length: 23 }, () => [r(1000), 530 + r(120)])

function Shrub({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#garden-shadow)">
      <ellipse cx="0" cy="20" rx="48" ry="18" fill="#8fae67" />
      <circle cx="-25" cy="0" r="28" fill="#a3bd7b" />
      <circle cx="7" cy="-15" r="34" fill="#b2ca8b" />
      <circle cx="32" cy="5" r="25" fill="#9bb874" />
      <path d="M-15-12q12-13 23-8" fill="none" stroke="#c5dba0" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

/** Nompong's backyard: lawn, picket fence, shrubs, kennel, flowerpot and water bowl. */
export const GardenBackdrop = memo(function GardenBackdrop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="garden-grass" x2="0" y2="1">
          <stop stopColor="#e2ebc0" />
          <stop offset="1" stopColor="#c6dba2" />
        </linearGradient>
        <radialGradient id="garden-light">
          <stop stopColor="#ffffdd" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffffdd" stopOpacity="0" />
        </radialGradient>
        <filter id="garden-shadow">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#557b30" floodOpacity=".15" />
        </filter>
      </defs>
      <rect width="1000" height="650" fill="url(#garden-grass)" />
      <ellipse cx="620" cy="230" rx="500" ry="300" fill="url(#garden-light)" />
      <path d="M0 30Q480 95 1000 20V0H0Z" fill="#c1d39a" />
      {pickets.map((x) => (
        <g key={x}>
          <path d={`M${x} 70V15l12-12 12 12v60`} fill="#f3edcc" stroke="#d5d2a9" strokeWidth="1" />
          <path d={`M${x + 5} 23v40`} stroke="#ffffe3" opacity=".7" />
        </g>
      ))}
      <path d="M0 35H1000M0 60H1000" stroke="#e9e1ba" strokeWidth="9" />
      <g stroke="#acc787" strokeWidth="1.4" opacity=".55">
        {tufts.map(([x, y], i) => (
          <path key={i} d={`M${x} ${y}l-3-6m3 6l4-4`} />
        ))}
      </g>
      <Shrub x={30} y={95} s={1.6} />
      <Shrub x={970} y={100} s={1.6} />
      <Shrub x={25} y={580} s={1.3} />
      <Shrub x={967} y={544} s={1.3} />
      {/* Kennel */}
      <g transform="translate(65 460) rotate(-8)" filter="url(#garden-shadow)">
        <path d="M-47 3L0-38 47 3V64H-47Z" fill="#ecd5a3" />
        <path d="M-57 8L0-47 57 8" fill="none" stroke="#b98b6a" strokeWidth="15" strokeLinejoin="round" />
        <path d="M-19 64V31a19 19 0 0138 0V64" fill="#786a46" />
        <rect x="-22" y="-6" width="44" height="15" rx="4" fill="#fff2cb" />
        <text textAnchor="middle" x="0" y="5" fill="#9a8259" fontSize="7" fontFamily="sans-serif">
          NOMPONG
        </text>
      </g>
      {/* Flowerpot */}
      <g transform="translate(908 387) rotate(13)" filter="url(#garden-shadow)">
        <ellipse cy="27" rx="32" ry="11" fill="#95af66" />
        <path d="M-30-5h60l-8 32h-44Z" fill="#cc9878" />
        <ellipse cy="-5" rx="32" ry="10" fill="#e5b28d" />
        <path d="M-19-6Q-13-35 0-9Q10-49 15-8Q37-30 25-3" fill="#8eaa64" />
        <circle cx="9" cy="-31" r="7" fill="#f4dca1" />
      </g>
      {/* Water bowl */}
      <g transform="translate(825 592) rotate(-15)">
        <ellipse rx="35" ry="13" fill="#95ad74" />
        <path d="M-28-8h56l-6 15h-44Z" fill="#e5debc" />
        <ellipse cy="-8" rx="28" ry="9" fill="#f6f0d7" />
        <ellipse cy="-8" rx="21" ry="5" fill="#a9c4bb" />
      </g>
      {flowers.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 7V-4" stroke="#8fa766" strokeWidth="2" />
          <g fill={i % 2 ? '#fff6da' : '#ecdda1'}>
            <circle cx="-4" cy="-4" r="4" />
            <circle cx="4" cy="-4" r="4" />
            <circle cy="-9" r="4" />
            <circle cy="1" r="4" />
          </g>
          <circle cy="-4" r="3" fill="#cbb56b" />
        </g>
      ))}
      <g fill="#f8f5cc" opacity=".7">
        <path d="M740 123q-13-20-19-5q0 12 19 5q14-18 18-5q0 13-18 5" />
        <path d="M185 472q-10-16-15-4q0 9 15 4q11-14 14-4q0 10-14 4" />
      </g>
    </svg>
  )
})
