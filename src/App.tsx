import { CircleHelp, Flower2, Heart, PawPrint, Plus, Sparkles, Star, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Hand } from '@/components/Hand'
import { Modals } from '@/components/Modals'
import { Scene, type FloatingReaction } from '@/components/Scene'
import { ActivityPanel, PartyPanel } from '@/components/SidePanels'
import { cryptoRng } from '@/game/rules'
import { type Lang, useT } from '@/i18n'
import { beep } from '@/lib/sound'
import { useTurnClock } from '@/lib/useTurnClock'
import { useGameStore } from '@/store/gameStore'

const BOT_DELAY_MS = 1100
const CONFETTI = [Star, PawPrint, Flower2, Heart]
const CONFETTI_COLORS = ['#7c3aed', '#f59e0b', '#ec4899', '#10b981']

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

  // Workfit's header buttons: plain icons that tint on hover, finger-sized on touch screens.
  const iconButton =
    'grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 pointer-coarse:size-10'

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1530px] items-center justify-between gap-2 px-3 md:px-[3%] lg:px-[5%]">
          <a href="./" className="flex min-w-0 items-center gap-2 text-ink no-underline">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-700 text-white">
              <PawPrint size={15} strokeWidth={2.2} />
            </span>
            <span className="truncate text-base font-semibold tracking-tight">Nompong</span>
            <span className="hidden truncate text-xs text-muted sm:inline">{t('brand.sub')}</span>
          </a>
          <nav className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={startNew} aria-label={t('intro.new')} title={t('intro.new')} className={`${iconButton} md:hidden`}>
              <Plus size={18} />
            </button>
            <LangSwitch lang={t.lang} onChange={setLang} />
          <button type="button" aria-label={t('header.sound')} aria-pressed={sound} onClick={toggleSound} className={iconButton}>
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button type="button" aria-label={t('header.help')} onClick={() => openModal({ kind: 'help' })} className={iconButton}>
            <CircleHelp size={17} />
          </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1530px] pb-6 md:px-[3%] md:pt-6 lg:px-[5%] lg:pt-4">
        <section className="mb-6 hidden items-end justify-between gap-4 md:flex">
          <div>
            <div className="text-xs font-medium text-brand-700">{t('intro.eyebrow')}</div>
            <h1 className="mt-1 text-[2.125rem] leading-tight font-semibold tracking-[-0.02em]">
              {t('intro.title1')} <span className="text-brand-700">{t('intro.title2')}</span>
            </h1>
            <p className="mt-1 text-base text-slate-600">{t('intro.sub')}</p>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Plus size={16} /> {t('intro.new')}
          </button>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_268px] lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-[22px]">
          <section className="bg-surface md:overflow-hidden md:rounded-2xl md:border md:border-slate-200/80 md:shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Scene reactions={reactions} secondsLeft={secondsLeft} />
            <Hand />
          </section>
          <aside className="flex flex-col gap-3 px-3 md:gap-4 md:px-0">
            <PartyPanel secondsLeft={secondsLeft} />
            <ActivityPanel onReact={react} />
            <div className="hidden gap-2.5 px-1 py-3 md:flex">
              <Sparkles size={18} className="shrink-0 text-brand-400" />
              <p className="m-0 text-xs leading-relaxed text-muted">
                {t('tip.1')}
                <br />
                <b className="font-normal text-slate-700">{t('tip.2')}</b>
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
      className={`pointer-events-none fixed top-16 left-1/2 z-100 max-w-[90vw] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm text-white shadow-lg shadow-slate-900/10 transition-all duration-250 md:top-auto md:bottom-6 ${
        shown ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 md:translate-y-[30px]'
      }`}
    >
      {text}
    </div>
  )
}

/** Workfit's TH | EN switch: one violet pill slides between the two. */
function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div role="radiogroup" aria-label="Language / ภาษา" className="relative flex h-8 shrink-0 items-center rounded-lg bg-slate-100 p-0.5 pointer-coarse:h-10">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0.5 left-0.5 w-9 rounded-md bg-brand-700 shadow-sm transition-transform duration-300 ease-[cubic-bezier(.3,1.2,.5,1)] ${lang === 'en' ? 'translate-x-9' : ''}`}
      />
      {(['th', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          onClick={() => onChange(l)}
          className={`relative h-7 w-9 rounded-md text-xs font-semibold transition-colors duration-300 pointer-coarse:h-9 ${lang === l ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
