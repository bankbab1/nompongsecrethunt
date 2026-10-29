import { useState } from 'react'
import { MISSIONS } from '@/game/constants'
import type { Mode } from '@/game/types'
import { useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { Dialog, DialogHeading, primaryButton, secondaryButton } from './Dialog'

const body = 'mb-5 text-sm leading-[1.8] text-muted'
const list = 'pl-5 text-left text-sm leading-[1.8] text-muted list-disc'

export function Modals() {
  const modal = useGameStore((s) => s.modal)
  if (!modal) return null
  switch (modal.kind) {
    case 'setup':
      return <SetupModal />
    case 'help':
      return <HelpModal />
    case 'role':
      return <RoleModal />
    case 'peek':
      return <PeekModal goal={modal.goal} />
    case 'handoff':
      return <HandoffModal />
    case 'results':
      return <ResultsModal />
  }
}

function SetupModal() {
  const game = useGameStore((s) => s.game)
  const newGame = useGameStore((s) => s.newGame)
  const closeModal = useGameStore((s) => s.closeModal)
  const [name, setName] = useState(game.players[0].name)
  const [mode, setMode] = useState<Mode>(game.mode)
  const [count, setCount] = useState(game.players.length)
  const field = 'w-full rounded-lg border border-[#dce3cf] bg-white p-3 text-[#365139]'
  const label = 'mt-3 mb-1.5 block text-left text-xs'

  return (
    <Dialog label="New adventure" onDismiss={closeModal}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          newGame({ name: name.trim() || 'You', mode, count })
        }}
      >
        <DialogHeading icon={<Dog className="mx-auto h-[90px]" />} eyebrow="SOMETHING GOOD IS HIDING" title="Adventure starts here." />
        <p className={body}>
          One treasure. A pack of curious dogs.
          <br />
          And someone with a sneaky little plan.
        </p>
        <label htmlFor="nickname" className={label}>
          Your nickname
        </label>
        <input
          id="nickname"
          className={field}
          maxLength={18}
          value={name}
          placeholder="What should we call you?"
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="game-mode" className={label}>
          How would you like to play?
        </label>
        <select id="game-mode" className={field} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="solo">Solo adventure · you + computer dogs</option>
          <option value="local">Pass & play · friends on one device</option>
        </select>
        <label htmlFor="pack-size" className={label}>
          Pack size
        </label>
        <select id="pack-size" className={field} value={count} onChange={(e) => setCount(Number(e.target.value))}>
          <option value={3}>3 dogs · a quick adventure</option>
          <option value={4}>4 dogs · a cozy little pack</option>
          <option value={5}>5 dogs · a little more mischief</option>
          <option value={6}>6 dogs · the whole pack</option>
        </select>
        <p className="my-3 text-[11px] text-muted">One dog is secretly mischievous. Online rooms aren’t included yet.</p>
        <button type="submit" className={primaryButton}>
          Let’s follow the scent →
        </button>
        <button type="button" className={secondaryButton} onClick={closeModal}>
          Back to the garden
        </button>
      </form>
    </Dialog>
  )
}

function HelpModal() {
  const closeModal = useGameStore((s) => s.closeModal)
  return (
    <Dialog label="How to play" onDismiss={closeModal}>
      <DialogHeading icon="🌱" title="A little guide to the hunt." />
      <ul className={list}>
        <li>
          <b>Hunters</b> connect Nompong to the treasure. One secret <b>mischief dog</b> wants the pack to run out of cards.
        </li>
        <li>Choose a trail card, rotate it (or press R), then tap a glowing spot. Tap again to confirm. All neighboring trail edges must match.</li>
        <li>
          <b>Sniff</b> a hiding spot for a private clue. <b>Squirrel!</b> distracts a dog until someone gives them a <b>treat</b>.
        </li>
        <li>
          <b>Dig</b> removes a trail. You can always discard instead of playing.
        </li>
        <li>Play one card, then draw one. If nobody reaches the treasure before all hands are empty, mischief wins.</li>
        <li>There’s no turn timer. The game saves in this browser. Pass & play uses one device; solo includes computer dogs.</li>
      </ul>
      <button type="button" className={primaryButton} onClick={closeModal}>
        Got it. Let’s sniff! →
      </button>
    </Dialog>
  )
}

function RoleModal() {
  const role = useGameStore((s) => s.game.players[s.game.turn].role)
  const closeModal = useGameStore((s) => s.closeModal)
  const bad = role === 'mischief'
  return (
    <Dialog label="Your secret role" onDismiss={closeModal}>
      <DialogHeading
        icon={bad ? '🐿️' : '🐾'}
        eyebrow="SHHH. THIS IS YOUR SECRET."
        title={bad ? 'A little mischief maker.' : 'A good-hearted hunter.'}
      />
      <p className={body}>
        {bad
          ? 'Keep the pack away from the treasure. Create detours, dig up useful trails, and distract the other dogs. You win if everyone runs out of cards.'
          : 'Help Nompong reach the treasure. Build connected trails, sniff out hiding spots, and keep an eye on suspicious dogs.'}
      </p>
      <button type="button" className={primaryButton} onClick={closeModal}>
        Hide my secret →
      </button>
    </Dialog>
  )
}

function PeekModal({ goal }: { goal: number }) {
  const game = useGameStore((s) => s.game)
  const confirmPeek = useGameStore((s) => s.confirmPeek)
  const mission = MISSIONS[game.mission]
  const found = goal === game.treasure
  return (
    <Dialog label="A secret sniff">
      <DialogHeading icon={found ? mission.icon : '🪨'} eyebrow="A SECRET SNIFF" title={found ? 'You found the scent!' : 'Just a little rock.'} />
      <p className={body}>
        Hiding spot {goal + 1} {found ? `holds the ${mission.name}` : 'doesn’t have the treasure'}. Only you can see this clue.
      </p>
      <button type="button" className={primaryButton} onClick={confirmPeek}>
        Keep it secret →
      </button>
    </Dialog>
  )
}

function HandoffModal() {
  const name = useGameStore((s) => s.game.players[s.game.turn].name)
  const takeHandoff = useGameStore((s) => s.takeHandoff)
  return (
    <Dialog label="Pass the device">
      <DialogHeading icon="🐾" eyebrow="PASS THE DEVICE" title={`${name}’s turn`} />
      <p className={body}>Hand the device to {name}. Their cards and secret role will appear after they continue.</p>
      <button type="button" className={primaryButton} onClick={takeHandoff}>
        I’m {name} →
      </button>
    </Dialog>
  )
}

function ResultsModal() {
  const game = useGameStore((s) => s.game)
  const newGame = useGameStore((s) => s.newGame)
  const closeModal = useGameStore((s) => s.closeModal)
  const mission = MISSIONS[game.mission]
  const huntersWon = game.winner === 'hunters'
  const youWon = game.players[0].role === (huntersWon ? 'hunter' : 'mischief')

  return (
    <Dialog label="The secret is out" onDismiss={closeModal}>
      <DialogHeading
        icon={huntersWon ? mission.icon : '🐿️'}
        eyebrow="THE SECRET IS OUT"
        title={huntersWon ? 'Good dogs. Great find.' : 'Mischief accomplished.'}
      />
      <p className={body}>
        {huntersWon
          ? `The hunters found Nompong’s ${mission.name}.`
          : 'The mischievous dog kept the treasure hidden until the cards ran out.'}
        {game.mode === 'solo' && (youWon ? ' Your team wins!' : ' Your team lost this hunt.')}
      </p>
      <ul className={list}>
        {game.players.map((p, i) => (
          <li key={i}>
            <b>{p.name}</b> — {p.role === 'mischief' ? '🐿️ Mischief dog' : '🐾 Treasure hunter'}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={primaryButton}
        onClick={() => newGame({ name: game.players[0].name, mode: game.mode, count: game.players.length })}
      >
        Next little adventure →
      </button>
      <button type="button" className={secondaryButton} onClick={closeModal}>
        Explore the garden
      </button>
    </Dialog>
  )
}
