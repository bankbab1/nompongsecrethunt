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
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-[#23362666] p-5 backdrop-blur-[7px]">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="max-h-[90vh] w-[450px] overflow-auto rounded-3xl bg-[#fbfcf3] p-6 text-center shadow-[0_30px_100px_#172b3140] sm:p-8"
      >
        {children}
      </div>
    </div>
  )
}

export const primaryButton =
  'w-full rounded-[10px] bg-forest px-5 py-3.5 text-sm font-medium text-white shadow-[0_5px_12px_#263d3110] my-1.5'
export const secondaryButton = 'w-full rounded-[10px] bg-[#eaf0df] p-3.5 text-sm my-1'

export function DialogHeading({ icon, eyebrow, title }: { icon: ReactNode; eyebrow?: string; title: string }) {
  return (
    <>
      <div className="flex justify-center text-[#4d6b42]">{icon}</div>
      {eyebrow && <div className="mt-2 text-[10px] font-bold tracking-[2px] text-subtle">{eyebrow}</div>}
      <h2 className="my-3 text-2xl font-bold tracking-tight sm:text-[27px]">{title}</h2>
    </>
  )
}
