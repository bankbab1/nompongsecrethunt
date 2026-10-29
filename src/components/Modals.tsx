import clsx from 'clsx'
import { useState } from 'react'
import { LOOT_ITEMS, MAX_PLAYERS, MIN_PLAYERS, MISSIONS, PERSONAS, ROUNDS } from '@/game/constants'
import { score, standings } from '@/game/rules'
import type { GoalContent, Mode } from '@/game/types'
import { rich, useT } from '@/i18n'
import { useGameStore } from '@/store/gameStore'
import { Dog } from './art/Dog'
import { Dialog, DialogHeading, primaryButton, secondaryButton } from './Dialog'

const body = 'mb-5 text-sm leading-[1.8] text-muted whitespace-pre-line'
const list = 'pl-5 text-left text-sm leading-[1.8] text-muted list-disc space-y-1.5'

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
    case 'result':
      return <ResultModal />
  }
}

function SetupModal() {
  const t = useT()
  const game = useGameStore((s) => s.game)
  const newMatch = useGameStore((s) => s.newMatch)
  const closeModal = useGameStore((s) => s.closeModal)
  const [mode, setMode] = useState<Mode>(game.mode)
  const [count, setCount] = useState(game.players.length)
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, i) => (game.players[i] && !game.players[i].persona ? game.players[i].name : '')),
  )
  const field = 'w-full rounded-lg border border-[#dce3cf] bg-white p-3 text-[#365139]'
  const label = 'mt-3 mb-1.5 block text-left text-xs'
  const setName = (i: number, v: string) => setNames((ns) => ns.map((n, j) => (j === i ? v : n)))

  return (
    <Dialog label={t('intro.new')} onDismiss={closeModal}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const filled = names
            .slice(0, mode === 'solo' ? 1 : count)
            .map((n, i) => n.trim() || (i === 0 && mode === 'solo' ? (t.lang === 'th' ? 'คุณ' : 'You') : t('setup.player', { n: i + 1 })))
          while (filled.length < count) filled.push('')
          newMatch({ mode, names: filled })
        }}
      >
        <DialogHeading icon={<Dog className="mx-auto h-[90px]" />} eyebrow={t('setup.eyebrow')} title={t('setup.title')} />
        <p className={body}>{t('setup.body')}</p>

        <label htmlFor="game-mode" className={label}>
          {t('setup.mode')}
        </label>
        <select id="game-mode" className={field} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="solo">{t('setup.solo')}</option>
          <option value="local">{t('setup.local')}</option>
        </select>

        <label htmlFor="pack-size" className={label}>
          {t('setup.size')}
        </label>
        <select id="pack-size" className={field} value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map((n) => (
            <option key={n} value={n}>
              {t('setup.dogs', { n })}
            </option>
          ))}
        </select>

        {mode === 'solo' ? (
          <>
            <label htmlFor="name-0" className={label}>
              {t('setup.name')}
            </label>
            <input id="name-0" className={field} maxLength={14} value={names[0]} placeholder={t('setup.namePlaceholder')} onChange={(e) => setName(0, e.target.value)} />
          </>
        ) : (
          <fieldset>
            <legend className={label}>{t('setup.names')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: count }, (_, i) => (
                <input
                  key={i}
                  aria-label={t('setup.player', { n: i + 1 })}
                  className={field}
                  maxLength={14}
                  value={names[i]}
                  placeholder={t('setup.player', { n: i + 1 })}
                  onChange={(e) => setName(i, e.target.value)}
                />
              ))}
            </div>
          </fieldset>
        )}

        <p className="my-3 text-[11px] leading-relaxed text-muted">{t('setup.note')}</p>
        <button type="submit" className={primaryButton}>
          {t('setup.start')}
        </button>
        <button type="button" className={secondaryButton} onClick={closeModal}>
          {t('setup.cancel')}
        </button>
      </form>
    </Dialog>
  )
}

function HelpModal() {
  const t = useT()
  const closeModal = useGameStore((s) => s.closeModal)
  return (
    <Dialog label={t('header.help')} onDismiss={closeModal}>
      <DialogHeading icon="🌱" title={t('guide.title')} />
      <ul className={list}>
        {t.list('guide.items').map((item, i) => (
          <li key={i}>{rich(item)}</li>
        ))}
      </ul>
      <div className="my-4 grid grid-cols-2 gap-2 text-left text-[11px] text-muted sm:grid-cols-3">
        {Object.values(PERSONAS).map((p) => (
          <div key={p.id} className="rounded-lg bg-sage-50 px-2 py-1.5">
            <span className="mr-1">{p.emoji}</span>
            <b className="text-ink">{p.name}</b>
            <div>{t(`persona.${p.id}`)}</div>
          </div>
        ))}
      </div>
      <button type="button" className={primaryButton} onClick={closeModal}>
        {t('guide.close')}
      </button>
    </Dialog>
  )
}

function RoleModal() {
  const t = useT()
  const game = useGameStore((s) => s.game)
  const closeModal = useGameStore((s) => s.closeModal)
  const sneaky = game.players[game.turn].role === 'sneaky'
  const item = t(`mission.${game.mission}`)
  const known = game.knowledge[game.turn]
  return (
    <Dialog label={t('role.button')} onDismiss={closeModal}>
      <DialogHeading
        icon={sneaky ? '🐿️' : '🐾'}
        eyebrow={t('role.secret')}
        title={sneaky ? t('role.sneaky.title') : t('role.hunter.title')}
      />
      <p className={body}>{sneaky ? t('role.sneaky.body', { item }) : t('role.hunter.body', { item })}</p>
      {known.some(Boolean) && (
        <div className="mb-4 rounded-xl bg-sage-50 p-3 text-sm">
          <div className="mb-2 text-[10px] tracking-widest text-subtle">{t('role.knowledge')}</div>
          <div className="flex justify-center gap-4">
            {known.map((k, g) => (
              <span key={g} className={clsx(!k && 'opacity-30')}>
                {g + 1}: {k === 'treasure' ? MISSIONS[game.mission] : k === 'rock' ? '🪨' : '?'}
              </span>
            ))}
          </div>
        </div>
      )}
      <button type="button" className={primaryButton} onClick={closeModal}>
        {t('role.hide')}
      </button>
    </Dialog>
  )
}

function PeekModal({ goal }: { goal: number }) {
  const t = useT()
  const game = useGameStore((s) => s.game)
  const bark = useGameStore((s) => s.bark)
  const found = goal === game.treasure
  const item = t(`mission.${game.mission}`)
  const spot = goal + 1
  const options: { claim: GoalContent | null; text: string }[] = [
    { claim: 'treasure', text: t('bark.treasure', { item, spot }) },
    { claim: 'rock', text: t('bark.rock', { spot }) },
    { claim: null, text: `🤐 ${t('bark.silent')}` },
  ]
  return (
    <Dialog label={t('peek.eyebrow', { spot })}>
      <DialogHeading icon={found ? MISSIONS[game.mission] : '🪨'} eyebrow={t('peek.eyebrow', { spot })} title={found ? t('peek.treasure') : t('peek.rock')} />
      <p className={body}>{found ? t('peek.treasureBody', { spot, item }) : t('peek.rockBody', { spot })}</p>
      <div className="mb-2 text-left text-xs font-semibold">{t('bark.prompt')}</div>
      {options.map((o) => (
        <button
          key={String(o.claim)}
          type="button"
          onClick={() => bark(o.claim)}
          className={clsx(o.claim === null ? secondaryButton : primaryButton, 'text-left')}
        >
          {o.text}
        </button>
      ))}
    </Dialog>
  )
}

function HandoffModal() {
  const t = useT()
  const name = useGameStore((s) => s.game.players[s.game.turn].name)
  const takeHandoff = useGameStore((s) => s.takeHandoff)
  return (
    <Dialog label={t('handoff.eyebrow')}>
      <DialogHeading icon="🐾" eyebrow={t('handoff.eyebrow')} title={t('handoff.title', { name })} />
      <p className={body}>{t('handoff.body', { name })}</p>
      <button type="button" className={primaryButton} onClick={takeHandoff}>
        {t('handoff.ready', { name })}
      </button>
    </Dialog>
  )
}

function ResultModal() {
  const t = useT()
  const game = useGameStore((s) => s.game)
  const nextRound = useGameStore((s) => s.nextRound)
  const openModal = useGameStore((s) => s.openModal)
  const closeModal = useGameStore((s) => s.closeModal)
  const result = game.result
  if (!result) return null

  const item = t(`mission.${game.mission}`)
  const huntersWon = result.winner === 'hunters'
  const noSneaky = !huntersWon && !game.players.some((p) => p.role === 'sneaky')
  const matchOver = game.phase === 'matchOver'
  const payout = (i: number) => result.payouts.find((x) => x.player === i)?.loot ?? []
  const you = game.mode === 'solo' ? game.players[0] : null
  const table = standings(game)
  const top = table.filter((r) => r.place === 1)

  return (
    <Dialog label={t('result.eyebrow', { round: game.round, rounds: ROUNDS })} onDismiss={closeModal}>
      {matchOver ? (
        <DialogHeading
          icon="🏆"
          eyebrow={t('match.eyebrow')}
          title={top.length > 1 ? t('match.tie') : top[0].i === 0 && you ? t('match.you') : t('match.winner', { name: top[0].name })}
        />
      ) : (
        <DialogHeading
          icon={huntersWon ? MISSIONS[game.mission] : '🐿️'}
          eyebrow={t('result.eyebrow', { round: game.round, rounds: ROUNDS })}
          title={huntersWon ? t('result.hunters') : t('result.sneaky')}
        />
      )}
      <p className={body}>
        {huntersWon ? t('result.huntersBody', { name: game.players[result.finder!].name, item }) : noSneaky ? t('result.nobody') : t('result.sneakyBody', { item })}
        {you && ` ${(you.role === 'hunter') === huntersWon ? t('result.youWon') : t('result.youLost')}`}
      </p>

      <ul className="mb-4 space-y-1.5 text-left text-sm">
        {(matchOver ? table.map((r) => r.i) : game.players.map((_, i) => i)).map((i) => {
          const p = game.players[i]
          const loot = payout(i)
          return (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2">
              {matchOver && <b className="w-5 text-subtle">{table.find((r) => r.i === i)!.place}</b>}
              <span>{p.role === 'sneaky' ? '🐿️' : '🐾'}</span>
              <b className="truncate">{p.name}</b>
              <span className="text-[11px] text-muted">{p.role === 'sneaky' ? t('role.sneaky') : t('role.hunter')}</span>
              <span className="ml-auto flex items-center gap-1.5">
                {loot.map((c, j) => (
                  <span key={j} title={`${c.value}`}>
                    {LOOT_ITEMS[c.value][c.item]}
                  </span>
                ))}
                <b className="w-14 text-right text-[12px] text-forest">{t('match.pts', { n: score(p) })}</b>
              </span>
            </li>
          )
        })}
      </ul>

      {matchOver ? (
        <button type="button" className={primaryButton} onClick={() => openModal({ kind: 'setup' })}>
          {t('match.again')}
        </button>
      ) : (
        <button type="button" className={primaryButton} onClick={nextRound}>
          {t('result.next')}
        </button>
      )}
      <button type="button" className={secondaryButton} onClick={closeModal}>
        {matchOver ? t('match.view') : t('result.view')}
      </button>
    </Dialog>
  )
}
