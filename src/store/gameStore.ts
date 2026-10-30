import { create } from 'zustand'
import { flip, geoOf, goalAt, isLegal } from '@/game/board'
import { chooseAccusation, chooseBotMove } from '@/game/bot'
import { accuse, applyMove, createMatch, cryptoRng, IllegalMove, isSavedGame, startRound } from '@/game/rules'
import type { BoardSize, GameState, GoalContent, Mode, Move, Theme } from '@/game/types'
import type { Lang, Params } from '@/i18n'
import type { MessageKey } from '@/i18n/en'
import { beep } from '@/lib/sound'

export const SAVE_KEY = 'nompong-hunt-v2'
export const LANG_KEY = 'nompong-hunt-lang'
export const TIMER_KEY = 'nompong-hunt-timer'
export const TUTORIAL_KEY = 'nompong-hunt-tutorial'
export const TIMER_OPTIONS = [0, 30, 60] as const
export const DEFAULT_VIEW = { tilt: 24, spin: 0 }
export const TOP_VIEW = { tilt: 0, spin: 0 }

export type Modal =
  | { kind: 'setup' }
  | { kind: 'help' }
  | { kind: 'role' }
  | { kind: 'peek'; goal: number }
  | { kind: 'handoff' }
  | { kind: 'result' }
  | { kind: 'tutorial' }

interface GameStore {
  game: GameState
  lang: Lang
  selected: number
  flipped: boolean
  preview: { x: number; y: number } | null
  /** Pass & play: the next dog hasn't taken the device yet, so their hand stays hidden. */
  awaitingHandoff: boolean
  zoom: number
  /** Camera over the garden: tilt back from straight down, and spin around the board. */
  view: { tilt: number; spin: number }
  sound: boolean
  /** Seconds per human turn; 0 means no limit. */
  turnSeconds: number
  modal: Modal | null
  toast: { key: MessageKey | (string & {}); params?: Params; id: number } | null

  newMatch: (opts: { mode: Mode; names: string[]; size?: BoardSize }) => void
  nextRound: () => void
  selectCard: (i: number) => void
  flipCard: () => void
  tapCell: (x: number, y: number) => void
  tapPlayer: (i: number) => void
  accusePlayer: (i: number) => void
  pass: () => void
  bark: (claim: GoalContent | null) => void
  takeHandoff: () => void
  playBotTurn: () => void
  setTheme: (theme: Theme) => void
  setZoom: (zoom: number) => void
  setView: (view: { tilt: number; spin: number }) => void
  toggleSound: () => void
  setLang: (lang: Lang) => void
  setTurnSeconds: (seconds: number) => void
  /** The turn clock ran out: pass the selected card for the player. */
  timeUp: () => void
  openModal: (modal: Modal) => void
  closeModal: () => void
  showToast: (key: MessageKey, params?: Params) => void
}

export const isHumanTurn = (s: Pick<GameStore, 'game' | 'awaitingHandoff'>) =>
  s.game.phase === 'playing' &&
  (s.game.mode === 'local' ? !s.awaitingHandoff : s.game.players[s.game.turn].persona === null)

/** The selected trail's mask as it would be placed, or 0 when the selection isn't a trail. */
export const selectedMask = (s: Pick<GameStore, 'game' | 'selected' | 'flipped'>) => {
  const card = s.game.players[s.game.turn].hand[s.selected]
  return card?.type === 'path' ? (s.flipped ? flip(card.mask) : card.mask) : 0
}

function read<T>(key: string, parse: (raw: string) => T | null): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : parse(raw)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode or full storage: the hunt still plays, it just won't survive a reload.
  }
}

function boot() {
  const saved = read(SAVE_KEY, (raw) => {
    const v: unknown = JSON.parse(raw)
    return isSavedGame(v) ? v : null
  })
  const lang = read<Lang>(LANG_KEY, (raw) => (raw === 'th' || raw === 'en' ? raw : null)) ?? 'th'
  const game = saved ?? createMatch({ mode: 'solo', names: [lang === 'th' ? 'คุณ' : 'You', '', '', ''] }, cryptoRng)
  const handoff = game.mode === 'local' && game.phase === 'playing'
  const modal: Modal | null = game.phase !== 'playing' ? { kind: 'result' } : handoff ? { kind: 'handoff' } : saved ? null : { kind: 'setup' }
  const turnSeconds = read(TIMER_KEY, (raw) => (TIMER_OPTIONS as readonly number[]).includes(Number(raw)) ? Number(raw) : null) ?? 30
  return { game, lang, turnSeconds, awaitingHandoff: handoff, modal }
}

const initial = boot()

export const useGameStore = create<GameStore>()((set, get) => {
  const toast = (key: string, params?: Params) => set({ toast: { key, params, id: Date.now() } })

  /** After any state change: who acts next, and what does the screen need to show? */
  const advance = (next: GameState) => {
    const handoff = next.mode === 'local' && next.phase === 'playing'
    set({
      game: next,
      selected: -1,
      flipped: false,
      preview: null,
      awaitingHandoff: handoff,
      modal: next.phase !== 'playing' ? { kind: 'result' } : handoff ? { kind: 'handoff' } : null,
    })
  }

  const play = (move: Move): boolean => {
    let next: GameState
    try {
      next = applyMove(get().game, move, cryptoRng)
    } catch (e) {
      if (e instanceof IllegalMove) {
        toast(e.message)
        return false
      }
      throw e
    }
    beep(630, get().sound)
    advance(next)
    return true
  }

  const currentCard = () => {
    const { game, selected } = get()
    return game.players[game.turn].hand[selected]
  }

  return {
    ...initial,
    selected: -1,
    flipped: false,
    preview: null,
    zoom: 1,
    view: DEFAULT_VIEW,
    sound: false,
    toast: null,

    newMatch: ({ mode, names, size }) => {
      advance(createMatch({ mode, names, size, previous: get().game }, cryptoRng))
      // First match on this device: walk through the basics before anything else.
      if (!read(TUTORIAL_KEY, (raw) => raw)) {
        write(TUTORIAL_KEY, '1')
        set({ modal: { kind: 'tutorial' } })
      } else if (mode === 'solo') toast('toast.welcome')
    },

    nextRound: () => {
      const { game } = get()
      if (game.phase !== 'roundOver') return
      advance(startRound(game, cryptoRng))
    },

    selectCard: (i) => {
      if (!isHumanTurn(get())) return
      set({ selected: i, flipped: false, preview: null })
      beep(440, get().sound)
    },

    flipCard: () => {
      const s = get()
      if (!isHumanTurn(s) || currentCard()?.type !== 'path') return
      set({ flipped: !s.flipped, preview: null })
      beep(470, s.sound)
    },

    tapCell: (x, y) => {
      const s = get()
      if (!isHumanTurn(s)) return
      const card = currentCard()
      if (!card) return toast('error.noCard')
      switch (card.type) {
        case 'path':
          // First tap previews the tile, a second tap on the same spot places it.
          if (s.preview?.x === x && s.preview.y === y) {
            play({ kind: 'path', card: s.selected, x, y, flipped: s.flipped })
          } else if (s.game.players[s.game.turn].broken.length) {
            toast('error.broken')
          } else if (!isLegal(geoOf(s.game), s.game.board, x, y, selectedMask(s))) {
            toast('error.illegalPath')
          } else {
            set({ preview: { x, y } })
            beep(520, s.sound)
          }
          return
        case 'sniff': {
          const goal = goalAt(geoOf(s.game), x, y)
          if (goal === null) return toast('toast.pickSpot')
          set({ modal: { kind: 'peek', goal } })
          return
        }
        case 'dig':
          play({ kind: 'dig', card: s.selected, x, y })
          return
        default:
          toast('toast.tapDog')
      }
    },

    tapPlayer: (i) => {
      const s = get()
      if (!isHumanTurn(s)) return
      const card = currentCard()
      if (card?.type === 'break' || card?.type === 'fix') play({ kind: card.type, card: s.selected, target: i })
    },

    accusePlayer: (i) => {
      const s = get()
      if (!isHumanTurn(s)) return
      try {
        set({ game: accuse(s.game, i, cryptoRng) })
        beep(330, s.sound)
      } catch (e) {
        if (e instanceof IllegalMove) toast(e.message)
        else throw e
      }
    },

    pass: () => {
      const s = get()
      if (!isHumanTurn(s)) return
      if (!currentCard()) return toast('error.noCard')
      play({ kind: 'pass', card: s.selected })
    },

    bark: (claim) => {
      const { modal, selected } = get()
      if (modal?.kind !== 'peek') return
      set({ modal: null })
      play({ kind: 'sniff', card: selected, goal: modal.goal, claim })
    },

    takeHandoff: () => set({ awaitingHandoff: false, modal: null }),

    playBotTurn: () => {
      let { game } = get()
      if (game.phase !== 'playing' || game.mode !== 'solo' || !game.players[game.turn].persona) return
      const target = chooseAccusation(game, cryptoRng)
      if (target !== null) game = accuse(game, target, cryptoRng)
      set({ game })
      play(chooseBotMove(game, cryptoRng))
    },

    setTheme: (theme) => set((s) => ({ game: { ...s.game, theme } })),
    setView: ({ tilt, spin }) => set({ view: { tilt: Math.min(65, Math.max(0, tilt)), spin } }),
    setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.7, Math.round(zoom * 10) / 10)) }),
    toggleSound: () => {
      const sound = !get().sound
      set({ sound })
      toast(sound ? 'toast.soundOn' : 'toast.soundOff')
      beep(600, sound)
    },
    setLang: (lang) => {
      set({ lang })
      write(LANG_KEY, lang)
    },
    setTurnSeconds: (turnSeconds) => {
      set({ turnSeconds })
      write(TIMER_KEY, String(turnSeconds))
    },
    timeUp: () => {
      const s = get()
      if (!isHumanTurn(s) || !s.game.players[s.game.turn].hand.length) return
      toast('toast.timeUp')
      if (s.modal?.kind === 'peek') set({ modal: null })
      play({ kind: 'pass', card: currentCard() ? s.selected : 0 })
    },
    openModal: (modal) => set({ modal }),
    // A pending pass & play hand-off always comes back once other dialogs close.
    closeModal: () => set((s) => ({ modal: s.awaitingHandoff && s.game.phase === 'playing' ? { kind: 'handoff' } : null })),
    showToast: toast,
  }
})

useGameStore.subscribe((s, prev) => {
  if (s.game !== prev.game) write(SAVE_KEY, JSON.stringify(s.game))
})
