import clsx from 'clsx'
import {
  Ban,
  Bird,
  CircleHelp,
  Eye,
  Bone,
  Construction,
  Cookie,
  Crown,
  Drumstick,
  EyeOff,
  Flame,
  Flower2,
  Footprints,
  Gift,
  Glasses,
  Heart,
  Link2,
  type LucideIcon,
  Megaphone,
  MessageCircle,
  Moon,
  Mountain,
  PawPrint,
  Pointer,
  Rabbit,
  Search,
  Shield,
  ShoppingBasket,
  Shovel,
  SkipForward,
  Smile,
  Sparkles,
  Sprout,
  Sun,
  TreeDeciduous,
  Trophy,
  Volleyball,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react'
import type { Card, PersonaId, Theme, Tool } from '@/game/types'

/**
 * Every glyph in the game comes from here, so the look stays one consistent line-icon set.
 * Illustrations (Nompong, trail tiles, the garden) are separate SVG art in ./art.
 */

/** What Nompong hunts for, by mission index. */
export const MISSION_ICONS: LucideIcon[] = [Bone, Bird, Footprints, Drumstick, Rabbit, Volleyball]
/** Loot by point value. */
export const LOOT_ICONS: Record<1 | 2 | 3, LucideIcon> = { 1: Cookie, 2: Gift, 3: Crown }
/** What sits on an unrevealed hiding spot. */
export const GOAL_ICONS: LucideIcon[] = [TreeDeciduous, ShoppingBasket, Flower2]
export const RockIcon = Mountain
export const THEME_ICONS: Record<Theme, LucideIcon> = { garden: Sun, night: Moon, pink: Flower2 }
export const PERSONA_ICONS: Record<PersonaId, LucideIcon> = {
  mochi: Smile,
  biscuit: Glasses,
  pepper: Sparkles,
  coco: Flame,
  milo: Moon,
  taro: Shield,
}
/** Quick reactions anyone can float over the garden. */
export const REACTION_ICONS: LucideIcon[] = [Eye, PawPrint, Heart, CircleHelp]
export const TOOL_ICONS: Record<Tool, LucideIcon> = { leash: Link2, nose: Wind, paw: PawPrint }

/** A tool with a small status mark: red slash when spoiled, green wrench when it's a fix. */
export function ToolMark({ tool, state, size = 16 }: { tool: Tool; state: 'broken' | 'fix'; size?: number }) {
  const Icon = TOOL_ICONS[tool]
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <Icon size={size} strokeWidth={1.8} className={state === 'broken' ? 'text-[#b4533c]' : 'text-moss'} />
      {state === 'broken' ? (
        <span className="absolute inset-0 m-auto h-[2px] w-[120%] -rotate-45 rounded bg-[#b4533c]" />
      ) : (
        <Wrench size={size * 0.55} strokeWidth={2.4} className="absolute -right-1 -bottom-1 rounded-full bg-white text-moss" />
      )}
    </span>
  )
}

/** The picture on a non-trail card. */
export function CardGlyph({ card, size = 26 }: { card: Card; size?: number }) {
  switch (card.type) {
    case 'sniff':
      return <Search size={size} strokeWidth={1.6} className="text-[#5f7140]" />
    case 'dig':
      return <Shovel size={size} strokeWidth={1.6} className="text-[#8a6a3c]" />
    case 'break':
      return <ToolMark tool={card.tool} state="broken" size={size} />
    case 'fix':
      return (
        <span className="flex items-center gap-1">
          {card.tools.map((tool) => (
            <ToolMark key={tool} tool={tool} state="fix" size={card.tools.length > 1 ? size * 0.75 : size} />
          ))}
        </span>
      )
    default:
      return null
  }
}

/** Icon for an activity-log entry, chosen by its message key. */
export function logIcon(key: string): LucideIcon {
  if (key.startsWith('say.')) return MessageCircle
  const icons: Record<string, LucideIcon> = {
    'log.roundStart': Sprout,
    'log.path': PawPrint,
    'log.deadEnd': Construction,
    'log.sniff': Search,
    'log.claimTreasure': Megaphone,
    'log.claimRock': Megaphone,
    'log.dig': Shovel,
    'log.digDeadEnd': Shovel,
    'log.break': Zap,
    'log.fix': Wrench,
    'log.fixSelf': Wrench,
    'log.pass': SkipForward,
    'log.rock': Mountain,
    'log.found': Trophy,
    'log.sneakyWin': EyeOff,
    'log.accuse': Pointer,
  }
  return icons[key] ?? Ban
}

/** A round icon chip used in the activity feed and the "just now" banner. */
export function IconChip({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={clsx('grid size-6 shrink-0 place-items-center rounded-md bg-[#f0f2e6] text-[#5f7140]', className)}>
      <Icon size={14} strokeWidth={2} />
    </span>
  )
}
