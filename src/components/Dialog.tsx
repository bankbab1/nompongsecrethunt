import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useT } from '@/i18n'

/** Dragging the sheet down further than this (px) closes it. */
const DISMISS_PX = 110
/** A quick flick down (px per ms) closes it even when it hasn't travelled far. */
const FLICK_SPEED = 0.6
/** How long the sheet takes to slide out after release. */
const OUT_MS = 220

interface DialogProps {
  children: ReactNode
  /**
   * Closes the dialog: Escape, the ✕, a tap on the backdrop, or a swipe down on phones.
   * Omit for steps the player must answer (hand-offs, secret peeks); those can't be brushed away.
   */
  onDismiss?: () => void
  label: string
}

/**
 * Workfit's sheet: a bottom sheet with a grab handle on phones (drag the handle down, or flick it,
 * to close), a centred card from sm. Tap outside or press Escape to close; focus stays inside.
 */
export function Dialog({ children, onDismiss, label }: DialogProps) {
  const t = useT()
  const panel = useRef<HTMLDivElement>(null)
  const dismissible = Boolean(onDismiss)
  const closeRef = useRef(onDismiss)
  closeRef.current = onDismiss

  const drag = useRef<{ y: number; id: number } | null>(null)
  const [dy, setDy] = useState(0)
  const dyRef = useRef(0)
  dyRef.current = dy
  // Last two pointer samples, to tell a flick from a slow drag.
  const track = useRef({ y: 0, t: 0, v: 0 })
  const [leaving, setLeaving] = useState(false)
  // Closing runs once: ✕ then Escape must not close twice.
  const closing = useRef(false)
  const outTimer = useRef<number | undefined>(undefined)

  /** Slide off the bottom on phones (from wherever the finger left it), then close. */
  const dismiss = () => {
    if (!closeRef.current || closing.current) return
    closing.current = true
    // Desktop, reduced motion, or no matchMedia at all (tests): close straight away.
    const matches = (q: string) => window.matchMedia?.(q).matches ?? true
    const instant = matches('(min-width: 640px)') || matches('(prefers-reduced-motion: reduce)')
    if (instant) return closeRef.current()
    setLeaving(true)
    outTimer.current = window.setTimeout(() => closeRef.current?.(), OUT_MS)
  }
  useEffect(() => () => window.clearTimeout(outTimer.current), [])

  // Focus moves in, Tab stays inside, Escape closes; the page behind doesn't scroll.
  useEffect(() => {
    const root = panel.current
    if (!root) return
    const focusables = () =>
      [...root.querySelectorAll<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      )
    const first = window.setTimeout(() => (focusables().find((el) => !el.hasAttribute('data-dialog-close')) ?? root).focus({ preventScroll: true }), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
      if (e.key !== 'Tab') return
      const list = focusables()
      if (!list.length) return
      const [a, z] = [list[0], list[list.length - 1]]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(first)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
    // Runs once per dialog: the store's close action is stable and read through closeRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Only the handle strip drags the sheet; a swipe on the content just scrolls it.
  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // No live pointer to capture (a synthetic event): dragging still works without it.
    }
    drag.current = { y: e.clientY, id: e.pointerId }
    track.current = { y: e.clientY, t: performance.now(), v: 0 }
  }
  const move = (e: ReactPointerEvent) => {
    if (!drag.current || drag.current.id !== e.pointerId) return
    const now = performance.now()
    const p = track.current
    p.v = (e.clientY - p.y) / Math.max(1, now - p.t)
    p.y = e.clientY
    p.t = now
    // Dialogs that must be answered only give a little, then spring back.
    const pulled = Math.max(0, e.clientY - drag.current.y)
    setDy(dismissible ? pulled : Math.min(pulled, 40) * 0.5)
  }
  const end = () => {
    if (!drag.current) return
    drag.current = null
    const far = dyRef.current > DISMISS_PX
    const flick = track.current.v > FLICK_SPEED && dyRef.current > 24
    if (dismissible && (far || flick)) dismiss()
    else setDy(0)
  }

  const dragging = dy > 0 && !leaving && drag.current !== null
  const shade = leaving ? 0 : dy ? Math.max(0.15, 1 - dy / 500) : 1

  return (
    <div className="fixed inset-0 z-90 flex items-end justify-center sm:items-center sm:p-5" onClick={dismiss}>
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200"
        style={{ opacity: shade, transitionDuration: dragging ? '0ms' : undefined }}
      />
      <div
        ref={panel}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92dvh] w-full animate-sheet-in flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200/80 bg-white text-center shadow-2xl shadow-slate-900/15 outline-none sm:max-w-[440px] sm:animate-pop sm:rounded-2xl"
        style={{
          transform: leaving ? 'translateY(105%)' : dy ? `translateY(${dy}px)` : undefined,
          transition: dragging ? 'none' : `transform ${leaving ? OUT_MS : 260}ms ${leaving ? 'cubic-bezier(0.4, 0, 1, 1)' : 'cubic-bezier(0.2, 0.9, 0.3, 1.2)'}`,
        }}
      >
        {/* Grab handle (phones): a strip tall enough to hold the close button. */}
        <div
          className="flex h-11 shrink-0 cursor-grab touch-none justify-center pt-2.5 active:cursor-grabbing sm:hidden"
          aria-hidden="true"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <span className="h-1.5 w-10 rounded-full bg-slate-300" />
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={dismiss}
            data-dialog-close
            aria-label={t('dialog.close')}
            className="group absolute top-1 right-1 z-20 grid size-11 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:top-2 sm:right-2"
          >
            <span className="grid size-8 place-items-center rounded-full bg-slate-900/[0.07] text-slate-600 transition group-hover:bg-slate-900/[0.12] group-active:scale-90">
              <X size={17} strokeWidth={2.5} />
            </span>
          </button>
        )}
        <div className={clsx('min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none px-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:p-7')}>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Workfit's primary and secondary buttons: 44px touch targets on phones, compact on desktop. */
export const primaryButton =
  'my-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-[15px] font-medium text-white transition-colors hover:bg-brand-800 active:scale-[0.98] sm:h-10 sm:rounded-lg sm:text-sm'
export const secondaryButton =
  'my-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[15px] font-medium text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] sm:h-10 sm:rounded-lg sm:text-sm'

export function DialogHeading({ icon, eyebrow, title }: { icon: ReactNode; eyebrow?: string; title: string }) {
  return (
    <>
      <div className="flex justify-center text-brand-700">{icon}</div>
      {eyebrow && <div className="mt-3 text-xs font-medium text-brand-700">{eyebrow}</div>}
      <h2 className="mt-1 mb-3 text-xl leading-snug font-semibold">{title}</h2>
    </>
  )
}
