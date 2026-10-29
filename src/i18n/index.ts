import { createElement, Fragment, type ReactNode } from 'react'
import { useGameStore } from '@/store/gameStore'
import { en, type MessageKey } from './en'
import { th } from './th'

export type Lang = 'en' | 'th'
export type Params = Record<string, string | number>

const dicts: Record<Lang, Record<string, string | string[]>> = { en, th }

/** Params that are themselves message keys (tool names, mission items) get translated too. */
function resolveParam(lang: Lang, name: string, value: string | number): string {
  if (name === 'tool') return translate(lang, `tool.${value}`)
  return String(value)
}

/**
 * Looks up a message and fills `{placeholders}`. Keys can be dynamic (`say.coco.accuse`),
 * so unknown keys fall back to English and then to the key itself.
 */
export function translate(lang: Lang, key: MessageKey | (string & {}), params: Params = {}): string {
  const raw = dicts[lang][key] ?? dicts.en[key] ?? key
  const text = Array.isArray(raw) ? raw[Number(params.v ?? 0) % raw.length] : raw
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? resolveParam(lang, name, params[name]) : m))
}

export function translateList(lang: Lang, key: MessageKey): string[] {
  const raw = dicts[lang][key] ?? dicts.en[key]
  return Array.isArray(raw) ? raw : [raw]
}

export function useT() {
  const lang = useGameStore((s) => s.lang)
  return Object.assign((key: MessageKey | (string & {}), params?: Params) => translate(lang, key, params), {
    lang,
    list: (key: MessageKey) => translateList(lang, key),
  })
}

/** Renders the few `<b>…</b>` spans our own copy uses, without injecting HTML. */
export function rich(text: string): ReactNode {
  return createElement(
    Fragment,
    null,
    ...text.split(/(<b>.*?<\/b>)/).map((part, i) =>
      part.startsWith('<b>') ? createElement('b', { key: i }, part.slice(3, -4)) : part,
    ),
  )
}
