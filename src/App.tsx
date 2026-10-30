import { CircleHelp, Flower2, Heart, Languages, PawPrint, Plus, Sparkles, Star, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Hand } from '@/components/Hand'
import { Modals } from '@/components/Modals'
import { Scene, type FloatingReaction } from '@/components/Scene'
import { ActivityPanel, PartyPanel } from '@/components/SidePanels'
import { cryptoRng } from '@/game/rules'
import { useT } from '@/i18n'
import { beep } from '@/lib/sound'
import { useTurnClock } from '@/lib/useTurnClock'
import { useGameStore } from '@/store/gameStore'

const BOT_DELAY_MS = 1100
const CONFETTI = [Star, PawPrint, Flower2, Heart]
const CONFETTI_COLORS = ['#e8b74a', '#7d9a55', '#e59a8a', '#9dcfc9']

export function App() {
  const t = useT()
  const game = useGameStore((s) => s.game)
  const modal = useGameStore((s) => s.modal)
  const sound = useGameStore((s) => s.sound)
  const toast = useGameStore((s) => s.toast)
  const { openModal, playBotTurn, flipCard, toggleSound, showToast, setLang } = useGameStore.getState()
  const secondsLeft = useTurnClock()
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
    setConfetti(Array.from({ length: 25 }, (_, i) => ({ id: i, icon: cryptoRng(CONFETTI.length), left: cryptoRng(100) })))
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

  const react = (icon: number) => {
    const id = Date.now() + Math.random()
    setReactions((r) => [...r, { id, icon, left: 25 + cryptoRng(50) }])
    setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2000)
    beep(750, sound)
  }

  const startNew = () => {
    if (botPending) return showToast('toast.wait')
    openModal({ kind: 'setup' })
  }

  const iconButton = 'grid size-8 place-items-center rounded-full border border-line bg-white/70 text-[#3f5a35] sm:size-9'

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-cream/95 px-3 backdrop-blur sm:px-[3%] lg:static lg:h-[88px] lg:bg-transparent lg:px-[5%]">
        <a href="./" className="flex min-w-0 items-center gap-2 font-display text-sm font-extrabold tracking-wider text-ink no-underline sm:text-base lg:gap-3 lg:text-[22px]">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-forest text-white lg:size-11">
            <PawPrint size={18} strokeWidth={2} />
          </span>
          <span className="leading-none">
            NOMPONG
            <span className="mt-1 block font-sans text-[8px] font-semibold tracking-[2.5px] text-muted max-[360px]:hidden lg:text-[9px]">{t('brand.sub')}</span>
          </span>
        </a>
        <nav className="flex shrink-0 items-center gap-1 text-xs text-muted sm:gap-1.5">
          <span className="mr-2 hidden items-center gap-2 lg:flex">
            <span className="size-1.5 rounded-full bg-sage" /> {t('header.tagline')}
          </span>
          <button type="button" onClick={startNew} aria-label={t('intro.new')} className={`${iconButton} md:hidden`}>
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => setLang(t.lang === 'th' ? 'en' : 'th')}
            aria-label={t('header.lang')}
            className="flex h-8 items-center gap-1 rounded-full border border-line bg-white/70 px-2.5 text-xs font-semibold text-[#3f5a35] sm:h-9 sm:gap-1.5 sm:px-3"
          >
            <Languages size={15} />
            {t.lang === 'th' ? 'EN' : 'TH'}
          </button>
          <button type="button" aria-label={t('header.sound')} aria-pressed={sound} onClick={toggleSound} className={iconButton}>
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button type="button" aria-label={t('header.help')} onClick={() => openModal({ kind: 'help' })} className={iconButton}>
            <CircleHelp size={17} />
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-[1530px] pb-6 md:px-[3%] md:pt-6 lg:px-[5%] lg:pt-4">
        <section className="mb-6 hidden items-center justify-between gap-3 md:flex">
          <div>
            <div className="text-[10px] font-bold tracking-[2px] text-subtle">{t('intro.eyebrow')}</div>
            <h1 className="my-2 text-[clamp(27px,3vw,43px)] font-extrabold tracking-[-1px]">
              {t('intro.title1')} <em className="font-serif font-normal text-[#6c7f52]">{t('intro.title2')}</em>
            </h1>
            <p className="m-0 text-xs leading-normal text-muted">{t('intro.sub')}</p>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-forest px-5 py-3.5 text-sm font-medium text-white shadow-[0_5px_12px_#263d3110]"
          >
            <Sparkles size={16} /> {t('intro.new')}
          </button>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_268px] lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-[22px]">
          <section className="bg-paper md:overflow-hidden md:rounded-[18px] md:border md:border-line">
            <Scene reactions={reactions} secondsLeft={secondsLeft} />
            <Hand />
          </section>
          <aside className="flex flex-col gap-3 px-3 md:gap-4 md:px-0">
            <PartyPanel secondsLeft={secondsLeft} />
            <ActivityPanel onReact={react} />
            <div className="hidden gap-2.5 px-1 py-3 md:flex">
              <Sparkles size={18} className="shrink-0 text-[#b3bd8c]" />
              <p className="m-0 text-[11px] leading-[1.9] text-muted">
                {t('tip.1')}
                <br />
                <b className="font-normal text-[#6c7b58]">{t('tip.2')}</b>
              </p>
            </div>
          </aside>
        </div>

        <footer className="flex justify-between px-3 py-6 text-[9px] tracking-wide text-subtle md:px-0">
          <span>{t('footer.1')}</span>
          <span className="hidden tracking-normal sm:inline">{t('footer.2')}</span>
        </footer>
      </main>

      {toast && <Toast key={toast.id} text={t(toast.key, toast.params)} />}
      {modal && <Modals />}
      {confetti.map((c) => {
        const Icon = CONFETTI[c.icon]
        return (
          <Icon
            key={c.id}
            size={22}
            strokeWidth={2}
            className="pointer-events-none fixed -top-6 z-110 animate-fall"
            style={{ left: `${c.left}vw`, animationDelay: `${c.id * 40}ms`, color: CONFETTI_COLORS[c.id % CONFETTI_COLORS.length] }}
          />
        )
      })}
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
      className={`pointer-events-none fixed top-16 left-1/2 z-100 max-w-[90vw] -translate-x-1/2 rounded-xl bg-[#2f4937] px-5 py-3 text-center text-sm text-white shadow-lg transition-all duration-250 md:top-auto md:bottom-6 ${
        shown ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 md:translate-y-[30px]'
      }`}
    >
      {text}
    </div>
  )
}
