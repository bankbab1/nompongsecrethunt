import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  children: ReactNode
  /** Called on Escape. Omit for steps the player must answer (hand-offs, secret peeks). */
  onDismiss?: () => void
  label: string
}

/** Centered modal with a focus trap; focus lands on the first control when it opens. */
export function Dialog({ children, onDismiss, label }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const focusables = () => [...root.querySelectorAll<HTMLElement>('button, input, select')]
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onDismiss) onDismiss()
      if (e.key !== 'Tab') return
      const f = focusables()
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    // Phones: a bottom sheet, like Workfit's. Wider screens: a centred card.
    <div className="fixed inset-0 z-90 flex animate-fade items-end justify-center bg-slate-900/40 backdrop-blur-[2px] sm:items-center sm:p-5">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="max-h-[92dvh] w-full animate-sheet-in overflow-auto rounded-t-2xl border border-slate-200/80 bg-white px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] text-center shadow-xl shadow-slate-900/10 sm:max-w-[440px] sm:animate-pop sm:rounded-2xl sm:p-7"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        {children}
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
