import { useEffect, useState } from 'react'
import { sections } from '@/data/profile'
import { scrollTo } from '@/lib/lenis'
import { cn } from '@/lib/cn'
import { ScrollTrigger } from '@/lib/gsap'

export function SideDots() {
  const [active, setActive] = useState<string>('top')

  useEffect(() => {
    const triggers = sections.map((s) =>
      ScrollTrigger.create({
        trigger: `#${s.id}`,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) setActive(s.id)
        },
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [])

  return (
    <nav
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-4 lg:flex"
      aria-label="Section navigation"
    >
      {sections.map((s) => {
        const isActive = active === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(`#${s.id}`)}
            aria-label={`Go to ${s.label}`}
            aria-current={isActive ? 'true' : undefined}
            className="group relative flex h-6 w-6 items-center justify-end"
          >
            <span
              className={cn(
                'absolute right-8 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[.14em] text-text-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
              )}
            >
              {s.label}
            </span>
            <span
              className={cn(
                'block w-1 rounded-full transition-all duration-500 [transition-timing-function:var(--ease-out)]',
                isActive ? 'h-6 bg-accent' : 'h-1 bg-text-3 group-hover:bg-text-2',
              )}
            />
          </button>
        )
      })}
    </nav>
  )
}
