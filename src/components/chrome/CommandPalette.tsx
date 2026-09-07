import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowUpRight, CornerDownLeft, Search } from 'lucide-react'
import { commands, type Command } from '@/data/commands'
import { scrollTo, startScroll, stopScroll } from '@/lib/lenis'
import { prefersReducedMotion, setReducedMotion } from '@/lib/reducedMotion'
import { cn } from '@/lib/cn'

type Props = { open: boolean; onClose: () => void }

/** Subsequence fuzzy match. Returns a score (lower is better) or -1. */
function fuzzy(query: string, text: string): number {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 0
  if (t.includes(q)) return t.indexOf(q)
  let qi = 0
  let score = 0
  let last = -1
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += last >= 0 ? i - last : i
      last = i
      qi++
    }
  }
  return qi === q.length ? score + 50 : -1
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const navigate = useNavigate()

  const results = useMemo(() => {
    if (!query.trim()) return commands
    return commands
      .map((c) => {
        const hay = [c.label, c.hint ?? '', ...(c.keywords ?? [])].join(' ')
        return { c, s: fuzzy(query.trim(), hay) }
      })
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s)
      .map((r) => r.c)
  }, [query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setIndex(0)
    setFlash(null)
    stopScroll()
    const t = setTimeout(() => inputRef.current?.focus(), 10)
    return () => {
      clearTimeout(t)
      startScroll()
    }
  }, [open])

  useEffect(() => {
    setIndex(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current?.children[index] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [index])

  function run(cmd: Command) {
    const a = cmd.action
    switch (a.type) {
      case 'scroll':
        onClose()
        setTimeout(() => scrollTo(a.target), 30)
        break
      case 'route':
        onClose()
        navigate(a.to)
        break
      case 'href':
        if (a.external) window.open(a.url, '_blank', 'noopener,noreferrer')
        else window.location.href = a.url
        onClose()
        break
      case 'toggle-motion': {
        const next = !prefersReducedMotion()
        setReducedMotion(next)
        setFlash(next ? 'reduced motion on · reloading' : 'reduced motion off · reloading')
        setTimeout(() => window.location.reload(), 500)
        break
      }
      case 'copy':
        navigator.clipboard?.writeText(a.text).then(
          () => setFlash('copied ✓'),
          () => setFlash('copy failed'),
        )
        setTimeout(onClose, 900)
        break
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => (i + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => (i - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = results[index]
      if (cmd) run(cmd)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      // Trap focus inside the input; the list is driven by arrows.
      e.preventDefault()
    }
  }

  if (!open) return null

  let lastGroup = ''

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close command palette"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-bg/70 backdrop-blur-[4px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="card relative w-full max-w-[560px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.6)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={14} className="text-text-3" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a section, open a project, run an action…"
            className="font-mono h-12 w-full bg-transparent text-[13px] text-text placeholder:text-text-3 focus:outline-none"
            aria-label="Search commands"
            aria-controls="palette-list"
            aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
            role="combobox"
            aria-expanded="true"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="chip">esc</kbd>
        </div>

        <ul
          id="palette-list"
          ref={listRef}
          role="listbox"
          className="scrollbar-hide max-h-[50vh] overflow-y-auto py-2"
          data-lenis-prevent
        >
          {results.length === 0 && (
            <li className="font-mono px-4 py-6 text-center text-[12px] text-text-3">no matches for “{query}”</li>
          )}
          {results.map((c, i) => {
            const showGroup = c.group !== lastGroup
            lastGroup = c.group
            const isExternal = c.action.type === 'href' && c.action.external
            return (
              <li key={c.id} role="none">
                {showGroup && (
                  <div className="eyebrow px-4 pb-1 pt-3 text-[10px]" aria-hidden="true">
                    {c.group}
                  </div>
                )}
                <button
                  id={`cmd-${c.id}`}
                  type="button"
                  role="option"
                  aria-selected={i === index}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(c)}
                  className={cn(
                    'font-mono flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-[13px]',
                    i === index ? 'bg-bg-2 text-text' : 'text-text-2',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('h-1 w-1 rounded-full', i === index ? 'bg-accent' : 'bg-transparent')} />
                    {c.label}
                    {isExternal && <ArrowUpRight size={12} className="text-text-3" aria-hidden="true" />}
                  </span>
                  {c.hint && <span className="truncate text-[11px] text-text-3">{c.hint}</span>}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="font-mono flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-text-3">
          <span className="flex items-center gap-3">
            <span>↑↓ move</span>
            <span className="flex items-center gap-1">
              <CornerDownLeft size={11} aria-hidden="true" /> run
            </span>
          </span>
          <span className={cn('transition-opacity', flash ? 'text-ok opacity-100' : 'opacity-0')} aria-live="polite">
            {flash ?? ' '}
          </span>
        </div>
      </div>
    </div>
  )
}
