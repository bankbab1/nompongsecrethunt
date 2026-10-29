import { useEffect, useRef, useState } from 'react'
import { ActivityPanel, PartyPanel } from '@/components/SidePanels'
import { Hand } from '@/components/Hand'
import { Modals } from '@/components/Modals'
import { Scene, type FloatingReaction } from '@/components/Scene'
import { cryptoRng } from '@/game/rules'
import { beep } from '@/lib/sound'
import { useGameStore } from '@/store/gameStore'

const BOT_DELAY_MS = 1000

export function App() {
  const game = useGameStore((s) => s.game)
  const modal = useGameStore((s) => s.modal)
  const sound = useGameStore((s) => s.sound)
  const toast = useGameStore((s) => s.toast)
  const { openModal, playBotTurn, rotateCard, toggleSound, showToast } = useGameStore.getState()
  const [reactions, setReactions] = useState<FloatingReaction[]>([])
  const [confetti, setConfetti] = useState<FloatingReaction[]>([])
  const botPending = game.mode === 'solo' && !game.ended && game.turn !== 0

  // Computer dogs take their turn after a short, slightly random pause.
  useEffect(() => {
    if (!botPending) return
    const t = setTimeout(playBotTurn, BOT_DELAY_MS + cryptoRng(650))
    return () => clearTimeout(t)
  }, [botPending, game, playBotTurn])

  // Celebrate when the hunters find the treasure.
  const celebrated = useRef(game.ended)
  useEffect(() => {
    if (!game.ended) {
      celebrated.current = false
      return
    }
    if (celebrated.current || game.winner !== 'hunters') return
    celebrated.current = true
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setConfetti(
      Array.from({ length: 25 }, (_, i) => ({ id: i, emoji: ['✦', '🐾', '🌼', '💛'][cryptoRng(4)], left: cryptoRng(100) })),
    )
    const t = setTimeout(() => setConfetti([]), 4500)
    return () => clearTimeout(t)
  }, [game.ended, game.winner])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key.toLowerCase() === 'r' && !useGameStore.getState().modal && !target.matches('input, select, textarea')) rotateCard()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [rotateCard])

  const react = (emoji: string) => {
    const id = Date.now() + Math.random()
    setReactions((r) => [...r, { id, emoji, left: 25 + cryptoRng(50) }])
    setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2000)
    beep(750, sound)
  }

  const startNew = () => {
    if (botPending) return showToast('Let the pack finish its turn first.')
    openModal({ kind: 'setup' })
  }

  return (
    <>
      <header className="flex h-[75px] items-center justify-between border-b border-line px-3 sm:px-[3%] lg:h-[94px] lg:px-[5%]">
        <a href="./" className="flex items-center gap-3 font-display text-lg font-extrabold tracking-wider text-ink no-underline lg:text-[22px]">
          <span className="text-4xl leading-none text-leaf lg:text-[45px]" aria-hidden="true">
            ✿
          </span>
          <span>
            NOMPONG
            <span className="mt-1 block font-sans text-[8px] font-semibold tracking-[3px] lg:text-[9px]">THE SECRET HUNT</span>
          </span>
        </a>
        <nav className="flex items-center gap-1 text-xs text-muted sm:gap-3">
          <span className="hidden items-center gap-2 md:flex">
            <span className="size-1.5 rounded-full bg-sage" /> A little adventure, together
          </span>
          <button
            type="button"
            aria-label="Toggle sound"
            aria-pressed={sound}
            onClick={toggleSound}
            className="ml-2 size-8 rounded-full border border-line text-base"
          >
            {sound ? '♪' : '♫'}
          </button>
          <button
            type="button"
            aria-label="How to play"
            onClick={() => openModal({ kind: 'help' })}
            className="ml-2 size-8 rounded-full border border-line text-base"
          >
            ?
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-[1530px] px-3 pt-6 sm:px-[3%] sm:pt-7 lg:px-[5%] lg:pt-9">
        <section className="mb-5 flex items-start justify-between gap-3 sm:items-center lg:mb-8">
          <div>
            <div className="text-[9px] font-bold tracking-[2px] text-subtle sm:text-[10px]">A COZY GAME OF TRUST & TROUBLE</div>
            <h1 className="my-2 text-3xl font-extrabold tracking-[-1.2px] lg:text-[clamp(27px,3vw,43px)] lg:tracking-[-1.7px]">
              Little paws. <em className="font-serif font-normal text-[#6c7f52]">Big secrets.</em>
            </h1>
            <p className="m-0 max-w-[260px] text-xs leading-normal text-muted sm:max-w-none">
              Follow the scent. Find the treasure. Trust no fluffy face.
            </p>
          </div>
          <button
            type="button"
            onClick={startNew}
            aria-label="New adventure"
            className="mt-6 shrink-0 rounded-[10px] bg-forest p-3 text-xs font-medium text-white shadow-[0_5px_12px_#263d3110] sm:mt-0 lg:px-5 lg:py-3.5"
          >
            ✧<span className="hidden sm:inline">&nbsp; New adventure</span>
            <span className="ml-6 hidden text-[#becb9f] lg:inline">↗</span>
          </button>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_248px] lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-[22px]">
          <section className="overflow-hidden rounded-[18px] border border-line bg-paper">
            <Scene reactions={reactions} />
            <Hand />
          </section>
          <aside className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:flex md:flex-col md:gap-4">
            <PartyPanel />
            <ActivityPanel onReact={react} />
            <div className="hidden gap-2.5 px-1 py-5 md:flex">
              <span className="text-lg text-[#b3bd8c]" aria-hidden="true">
                ✦
              </span>
              <p className="m-0 text-[11px] leading-[1.9] text-muted">
                A wagging tail doesn’t always mean a good dog.
                <br />
                <b className="font-normal text-[#6c7b58]">Someone might be leading you astray.</b>
              </p>
            </div>
          </aside>
        </div>

        <footer className="flex justify-between py-6 text-[9px] tracking-wide text-subtle">
          <span>MADE FOR GOOD DOGS. AND A FEW SNEAKY ONES.</span>
          <span className="hidden tracking-normal sm:inline">Private roles · Random treasures · Endless tail wags</span>
        </footer>
      </main>

      {toast && <Toast key={toast.id} text={toast.text} />}
      {modal && <Modals />}
      {confetti.map((c) => (
        <span
          key={c.id}
          className="pointer-events-none fixed -top-5 z-110 animate-fall text-2xl"
          style={{ left: `${c.left}vw`, animationDelay: `${c.id * 40}ms` }}
        >
          {c.emoji}
        </span>
      ))}
    </>
  )
}

function Toast({ text }: { text: string }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const show = requestAnimationFrame(() => setShown(true))
    const hide = setTimeout(() => setShown(false), 3200)
    return () => {
      cancelAnimationFrame(show)
      clearTimeout(hide)
    }
  }, [])
  return (
    <div
      role="status"
      className={`pointer-events-none fixed bottom-6 left-1/2 z-100 max-w-[90vw] -translate-x-1/2 rounded-[10px] bg-[#2f4937] px-5 py-3 text-center text-sm text-white transition-all duration-250 ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-[30px] opacity-0'
      }`}
    >
      {text}
    </div>
  )
}
