import { create } from 'zustand'
import { chooseBotMove } from '@/game/bot'
import { applyMove, createGame, cryptoRng, IllegalMove, isGoalCell, isLegal, isSavedGame, rotate } from '@/game/rules'
import type { GameState, Mode, Move, Theme } from '@/game/types'
import { beep } from '@/lib/sound'

export const SAVE_KEY = 'nompong-hunt-v1'

export type Modal =
  | { kind: 'setup' }
  | { kind: 'help' }
  | { kind: 'role' }
  | { kind: 'peek'; goal: number }
  | { kind: 'handoff' }
  | { kind: 'results' }

interface GameStore {
  game: GameState
  selected: number
  rotation: number
  preview: { x: number; y: number } | null
  /** Pass & play: the next dog hasn't taken the device yet, so their hand stays hidden. */
  awaitingHandoff: boolean
  zoom: number
  sound: boolean
  modal: Modal | null
  toast: { text: string; id: number } | null

  newGame: (opts: { name: string; mode: Mode; count: number }) => void
  selectCard: (i: number) => void
  rotateCard: () => void
  tapCell: (x: number, y: number) => void
  tapPlayer: (i: number) => void
  discard: () => void
  confirmPeek: () => void
  takeHandoff: () => void
  playBotTurn: () => void
  setTheme: (theme: Theme) => void
  setZoom: (zoom: number) => void
  toggleSound: () => void
  openModal: (modal: Modal) => void
  closeModal: () => void
  showToast: (text: string) => void
}

export const isHumanTurn = (s: Pick<GameStore, 'game' | 'awaitingHandoff'>) =>
  !s.game.ended && (s.game.mode === 'local' ? !s.awaitingHandoff : s.game.turn === 0)

/** The selected card's mask after rotation, or 0 when the selection isn't a trail. */
export const selectedMask = (s: Pick<GameStore, 'game' | 'selected' | 'rotation'>) => {
  const card = s.game.players[s.game.turn].hand[s.selected]
  return card?.type === 'trail' ? rotate(card.mask, s.rotation) : 0
}

function loadSaved(): GameState | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')
    return isSavedGame(saved) ? saved : null
  } catch {
    return null
  }
}

function initialState() {
  const saved = loadSaved()
  const game = saved ?? createGame({ name: 'You', mode: 'solo', count: 4 }, cryptoRng)
  const pendingHandoff = game.mode === 'local' && !game.ended
  const modal: Modal | null = game.ended ? { kind: 'results' } : pendingHandoff ? { kind: 'handoff' } : null
  return { game, awaitingHandoff: pendingHandoff, modal, fresh: !saved }
}

const boot = initialState()

export const useGameStore = create<GameStore>()((set, get) => {
  const toast = (text: string) => set({ toast: { text, id: Date.now() } })

  /** Plays a move for whoever's turn it is and moves the UI on to what comes next. */
  const play = (move: Move): boolean => {
    let next: GameState
    try {
      next = applyMove(get().game, move)
    } catch (e) {
      if (e instanceof IllegalMove) {
        toast(e.message)
        return false
      }
      throw e
    }
    const { sound } = get()
    beep(630, sound)
    const handoff = next.mode === 'local' && !next.ended
    set({
      game: next,
      selected: 0,
      rotation: 0,
      preview: null,
      awaitingHandoff: handoff,
      modal: next.ended ? { kind: 'results' } : handoff ? { kind: 'handoff' } : null,
    })
    return true
  }

  return {
    game: boot.game,
    selected: 0,
    rotation: 0,
    preview: null,
    awaitingHandoff: boot.awaitingHandoff,
    zoom: 1,
    sound: false,
    modal: boot.modal,
    toast: boot.fresh ? { text: 'Welcome to the garden! Peek at your secret role.', id: 0 } : null,

    newGame: ({ name, mode, count }) => {
      const game = createGame({ name, mode, count, previous: get().game }, cryptoRng)
      const handoff = mode === 'local'
      set({ game, selected: 0, rotation: 0, preview: null, awaitingHandoff: handoff, modal: handoff ? { kind: 'handoff' } : null })
      if (!handoff) toast('Welcome to the garden! Peek at your secret role.')
    },

    selectCard: (i) => {
      if (!isHumanTurn(get())) return
      set({ selected: i, rotation: 0, preview: null })
      beep(440, get().sound)
    },

    rotateCard: () => {
      const s = get()
      if (!isHumanTurn(s) || s.game.players[s.game.turn].hand[s.selected]?.type !== 'trail') return
      set({ rotation: (s.rotation + 1) % 4, preview: null })
      beep(470, s.sound)
    },

    tapCell: (x, y) => {
      const s = get()
      if (!isHumanTurn(s)) return
      const card = s.game.players[s.game.turn].hand[s.selected]
      if (!card) return
      switch (card.type) {
        case 'trail': {
          // First tap previews the tile, a second tap on the same spot places it.
          if (s.preview?.x === x && s.preview.y === y) {
            play({ kind: 'trail', card: s.selected, x, y, mask: selectedMask(s) })
          } else if (s.game.players[s.game.turn].blocked) {
            toast('Squirrel trouble! Use a treat or discard a card.')
          } else if (!isLegal(s.game.board, x, y, selectedMask(s))) {
            toast('Trails must connect to Nompong and match every neighboring edge.')
          } else {
            set({ preview: { x, y } })
            beep(520, s.sound)
          }
          return
        }
        case 'sniff':
          if (!isGoalCell(x, y)) return toast('Choose one of the three hiding spots.')
          set({ modal: { kind: 'peek', goal: y / 2 } })
          return
        case 'dig':
          play({ kind: 'dig', card: s.selected, x, y })
          return
        default:
          toast('Tap a dog in the pack to use this card.')
      }
    },

    tapPlayer: (i) => {
      const s = get()
      if (!isHumanTurn(s)) return
      const card = s.game.players[s.game.turn].hand[s.selected]
      if (card?.type === 'squirrel' || card?.type === 'treat') play({ kind: card.type, card: s.selected, target: i })
    },

    discard: () => {
      const s = get()
      if (!isHumanTurn(s) || !s.game.players[s.game.turn].hand.length) return
      play({ kind: 'discard', card: s.selected })
    },

    confirmPeek: () => {
      set({ modal: null })
      play({ kind: 'sniff', card: get().selected })
    },

    takeHandoff: () => set({ awaitingHandoff: false, modal: null }),

    playBotTurn: () => {
      const { game } = get()
      if (game.ended || game.mode !== 'solo' || game.turn === 0) return
      play(chooseBotMove(game, cryptoRng))
    },

    setTheme: (theme) => set((s) => ({ game: { ...s.game, theme } })),
    setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.7, Math.round(zoom * 10) / 10)) }),
    toggleSound: () => {
      const sound = !get().sound
      set({ sound })
      toast(sound ? 'Little sounds on' : 'Little sounds off')
      beep(600, sound)
    },
    openModal: (modal) => set({ modal }),
    closeModal: () => set({ modal: null }),
    showToast: toast,
  }
})

useGameStore.subscribe((s, prev) => {
  if (s.game === prev.game) return
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s.game))
  } catch {
    // Private mode or full storage: the hunt still plays, it just won't survive a reload.
  }
})
