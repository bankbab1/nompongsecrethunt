import clsx from 'clsx'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Workfit's segmented control: one violet pill slides to the chosen segment (measured, so it
 * fits segments of any width). Long labels wrap rather than scroll sideways on narrow phones.
 */
export function Segmented<K extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: K
  onChange: (v: K) => void
  options: { id: K; label: string }[]
}) {
  const track = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  // No slide on the first paint, only when the value changes afterwards.
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const measure = () => {
      const tab = track.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (tab) setPill({ left: tab.offsetLeft, top: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight })
    }
    measure()
    if (typeof ResizeObserver === 'undefined' || !track.current) return
    const ro = new ResizeObserver(measure)
    ro.observe(track.current)
    return () => ro.disconnect()
  }, [value, options.length])
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 50)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div role="group" aria-label={label}>
      <div ref={track} className="relative flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1">
        {pill && (
          <span
            aria-hidden="true"
            className={clsx(
              'absolute top-0 left-0 rounded-lg bg-brand-700 shadow-sm shadow-brand-700/20',
              ready && 'transition-[transform,width,height] duration-300 ease-[cubic-bezier(.3,1.2,.5,1)]',
            )}
            style={{ width: pill.width, height: pill.height, transform: `translate(${pill.left}px, ${pill.top}px)` }}
          />
        )}
        {options.map((o) => {
          const on = o.id === value
          return (
            <button
              key={String(o.id)}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={clsx(
                'relative min-h-9 flex-auto rounded-lg px-2.5 py-1 text-center text-[13px] leading-tight font-medium transition-colors duration-300 sm:min-h-8 sm:px-3 sm:text-sm',
                on ? 'font-semibold text-white' : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
