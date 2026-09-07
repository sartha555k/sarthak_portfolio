import { useEffect, useState } from 'react'
import { Command } from 'lucide-react'
import { sections } from '@/data/profile'
import { scrollTo } from '@/lib/lenis'
import { cn } from '@/lib/cn'

type Props = { onOpenPalette: () => void }

export function Nav({ onOpenPalette }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 80))
    }
    onScroll()
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled ? 'border-b border-line bg-bg/80 backdrop-blur-[12px]' : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="container flex h-16 items-center justify-between" aria-label="Primary">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            scrollTo('#top')
          }}
          className="font-display text-[28px] leading-none tracking-[.02em] text-text hover:text-accent transition-colors"
          aria-label="Sarthak Patel, back to top"
        >
          SP<span className="text-accent">.</span>
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {sections
            .filter((s) => s.id !== 'top')
            .map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollTo(`#${s.id}`)
                  }}
                  className="link-underline font-mono text-[12px] text-text-2 hover:text-text transition-colors"
                >
                  {s.label}
                </a>
              </li>
            ))}
        </ul>

        <button
          type="button"
          onClick={onOpenPalette}
          className="btn btn-sm gap-1.5"
          aria-label="Open command palette"
          aria-haspopup="dialog"
        >
          <Command size={12} aria-hidden="true" />
          <span>{isMac ? '⌘' : 'Ctrl'} K</span>
        </button>
      </nav>
    </header>
  )
}
