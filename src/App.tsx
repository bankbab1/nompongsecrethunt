import { useEffect, useRef, useState } from 'react'
import { Hand } from '@/components/Hand'
import { Modals } from '@/components/Modals'
import { Scene, type FloatingReaction } from '@/components/Scene'
import { ActivityPanel, PartyPanel } from '@/components/SidePanels'
import { cryptoRng } from '@/game/rules'
import { useT } from '@/i18n'
import { beep } from '@/lib/sound'
import { useGameStore } from '@/store/gameStore'

const BOT_DELAY_MS = 1100

export function App() {
  const t = useT()
  const game = useGameStore((s) => s.game)
  const modal = useGameStore((s) => s.modal)
  const sound = useGameStore((s) => s.sound)
  const toast = useGameStore((s) => s.toast)
  const { openModal, playBotTurn, flipCard, toggleSound, showToast, setLang } = useGameStore.getState()
  const [reactions, setReactions] = useState<FloatingReaction[]>([])
  const [confetti, setConfetti] = useState<FloatingReaction[]>([])
  const botPending = game.mode === 'solo' && game.phase === 'playing' && game.players[game.turn].persona !== null

  useEffect(() => {
    document.documentElement.lang = t.lang
  }, [t.lang])

  // Computer dogs take their turn after a short, slightly random pause, and wait while a dialog is open.
  useEffect(() => {
    if (!botPending || modal) return
    const timer = setTimeout(playBotTurn, BOT_DELAY_MS + cryptoRng(700))
    return () => clearTimeout(timer)
  }, [botPending, modal, game, playBotTurn])

  // Celebrate when the hunters find the treasure.
  const celebrated = useRef(game.phase !== 'playing')
  useEffect(() => {
    if (game.phase === 'playing') {
      celebrated.current = false
      return
    }
    if (celebrated.current || game.result?.winner !== 'hunters') return
    celebrated.current = true
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setConfetti(Array.from({ length: 25 }, (_, i) => ({ id: i, emoji: ['✦', '🐾', '🌼', '💛'][cryptoRng(4)], left: cryptoRng(100) })))
    const timer = setTimeout(() => setConfetti([]), 4500)
    return () => clearTimeout(timer)
  }, [game.phase, game.result])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key.toLowerCase() === 'f' && !useGameStore.getState().modal && !target.matches('input, select, textarea')) flipCard()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [flipCard])

  const react = (emoji: string) => {
    const id = Date.now() + Math.random()
    setReactions((r) => [...r, { id, emoji, left: 25 + cryptoRng(50) }])
    setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2000)
    beep(750, sound)
  }

  const startNew = () => {
    if (botPending) return showToast('toast.wait')
    openModal({ kind: 'setup' })
  }

  const circle = 'grid size-8 place-items-center rounded-full border border-line text-base'

  return (
    <>
      <header className="flex h-[75px] items-center justify-between border-b border-line px-3 sm:px-[3%] lg:h-[94px] lg:px-[5%]">
        <a href="./" className="flex items-center gap-3 font-display text-lg font-extrabold tracking-wider text-ink no-underline lg:text-[22px]">
          <span className="text-4xl leading-none text-leaf lg:text-[45px]" aria-hidden="true">
            ✿
          </span>
          <span>
            NOMPONG
            <span className="mt-1 block font-sans text-[8px] font-semibold tracking-[3px] lg:text-[9px]">{t('brand.sub')}</span>
          </span>
        </a>
        <nav className="flex items-center gap-2 text-xs text-muted">
          <span className="mr-2 hidden items-center gap-2 md:flex">
            <span className="size-1.5 rounded-full bg-sage" /> {t('header.tagline')}
          </span>
          <button
            type="button"
            onClick={() => setLang(t.lang === 'th' ? 'en' : 'th')}
            className="h-8 rounded-full border border-line px-3 text-xs font-medium"
          >
            {t('header.lang')}
          </button>
          <button type="button" aria-label={t('header.sound')} aria-pressed={sound} onClick={toggleSound} className={circle}>
            {sound ? '♪' : '♫'}
          </button>
          <button type="button" aria-label={t('header.help')} onClick={() => openModal({ kind: 'help' })} className={circle}>
            ?
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-[1530px] px-3 pt-6 sm:px-[3%] sm:pt-7 lg:px-[5%] lg:pt-9">
        <section className="mb-5 flex items-start justify-between gap-3 sm:items-center lg:mb-8">
          <div>
            <div className="text-[9px] font-bold tracking-[2px] text-subtle sm:text-[10px]">{t('intro.eyebrow')}</div>
            <h1 className="my-2 text-3xl font-extrabold tracking-[-1px] lg:text-[clamp(27px,3vw,43px)]">
              {t('intro.title1')} <em className="font-serif font-normal text-[#6c7f52]">{t('intro.title2')}</em>
            </h1>
            <p className="m-0 max-w-[280px] text-xs leading-normal text-muted sm:max-w-none">{t('intro.sub')}</p>
          </div>
          <button
            type="button"
            onClick={startNew}
            aria-label={t('intro.new')}
            className="mt-6 shrink-0 rounded-[10px] bg-forest p-3 text-xs font-medium text-white shadow-[0_5px_12px_#263d3110] sm:mt-0 lg:px-5 lg:py-3.5"
          >
            ✧<span className="hidden sm:inline">&nbsp; {t('intro.new')}</span>
            <span className="ml-6 hidden text-[#becb9f] lg:inline">↗</span>
          </button>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_268px] lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-[22px]">
          <section className="overflow-hidden rounded-[18px] border border-line bg-paper">
            <Scene reactions={reactions} />
            <Hand />
          </section>
          <aside className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 md:flex md:flex-col md:gap-4">
            <PartyPanel />
            <ActivityPanel onReact={react} />
            <div className="hidden gap-2.5 px-1 py-3 md:flex">
              <span className="text-lg text-[#b3bd8c]" aria-hidden="true">
                ✦
              </span>
              <p className="m-0 text-[11px] leading-[1.9] text-muted">
                {t('tip.1')}
                <br />
                <b className="font-normal text-[#6c7b58]">{t('tip.2')}</b>
              </p>
            </div>
          </aside>
        </div>

        <footer className="flex justify-between py-6 text-[9px] tracking-wide text-subtle">
          <span>{t('footer.1')}</span>
          <span className="hidden tracking-normal sm:inline">{t('footer.2')}</span>
        </footer>
      </main>

      {toast && <Toast key={toast.id} text={t(toast.key, toast.params)} />}
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
