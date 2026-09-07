import { useRef, useState } from 'react'
import { commits } from '@/data/timeline'
import { Commit } from './Commit'
import { SectionHeader } from '@/components/chrome/SectionRule'
import { gsap, useGSAP, ScrollTrigger, NO_PREF, REDUCED } from '@/lib/gsap'
import { cn } from '@/lib/cn'

export function GitTimeline() {
  const root = useRef<HTMLElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const [oneline, setOneline] = useState(false)

  useGSAP(
    () => {
      if (oneline) return
      const mm = gsap.matchMedia()

      mm.add(NO_PREF, () => {
        // Main branch draws downward with scroll.
        const line = gsap.fromTo(
          '.tl-line',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: list.current, start: 'top 65%', end: 'bottom 60%', scrub: 1 },
          },
        )
        // Commits pop in as the line reaches them.
        const rows = gsap.utils.toArray<HTMLElement>('.tl-row', list.current)
        const tweens = rows.map((row) => {
          const node = row.querySelector('.tl-node')
          const paths = row.querySelectorAll<SVGPathElement>('.tl-branch-path')
          paths.forEach((p) => {
            const len = p.getTotalLength()
            gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
          })
          const tl = gsap.timeline({
            scrollTrigger: { trigger: row, start: 'top 85%', once: true },
          })
          tl.fromTo(node, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' })
          if (paths.length) tl.to(paths, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' }, 0)
          tl.fromTo(row.children[1], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.05)
          return tl
        })
        return () => {
          line.scrollTrigger?.kill()
          line.kill()
          tweens.forEach((t) => {
            t.scrollTrigger?.kill()
            t.kill()
          })
        }
      })

      mm.add(REDUCED, () => {
        gsap.set('.tl-line', { scaleY: 1 })
        gsap.set('.tl-node, .tl-row > div', { opacity: 1, scale: 1, y: 0 })
      })

      // Active row (both modes)
      const rows = gsap.utils.toArray<HTMLElement>('.tl-row', list.current)
      const triggers = rows.map((row, i) =>
        ScrollTrigger.create({
          trigger: row,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (self.isActive) setActive(commits[i].id)
          },
        }),
      )

      return () => {
        mm.revert()
        triggers.forEach((t) => t.kill())
      }
    },
    { scope: root, dependencies: [oneline] },
  )

  return (
    <section id="timeline" ref={root} className="section" aria-labelledby="timeline-title">
      <div className="container">
        <SectionHeader
          index="03"
          label="Timeline"
          id="timeline-title"
          title="Commit history."
          sub="2021 → now, as a git graph."
          right={
            <button
              type="button"
              onClick={() => setOneline((v) => !v)}
              className="link-underline font-mono text-[12px] text-text-2 hover:text-text"
              aria-pressed={oneline}
            >
              {oneline ? 'git log --graph' : 'git log --oneline'}
            </button>
          }
        />

        {oneline ? (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region must be keyboard reachable
          <pre className="code !text-[12px] md:!text-[13px]" tabIndex={0} aria-label="git log, one line per commit">
            {[...commits].reverse().map((c) => {
              const ref = c.date === 'HEAD' ? ' (HEAD -> main)' : c.branch !== 'main' ? ` (${c.branch})` : ''
              return (
                <div key={c.id}>
                  <span className="s">{c.hash}</span>
                  <span className="k">{ref}</span> {c.title}
                  <span className="c">  # {c.date}</span>
                </div>
              )
            })}
          </pre>
        ) : (
          <div className="relative">
            {/* Main branch line, sits at x=20 in the graph column */}
            <div
              className={cn('tl-line absolute bottom-0 top-0 w-[2px] origin-top bg-accent-2')}
              style={{ left: 19 }}
              aria-hidden="true"
            />
            <ol ref={list} className="relative" aria-label="Career timeline as a git graph">
              {commits.map((c, i) => (
                <Commit key={c.id} commit={c} index={i} active={active === c.id} isLast={i === commits.length - 1} />
              ))}
            </ol>
          </div>
        )}
      </div>

      <style>{`
        #timeline .tl-head-ring { animation: tl-pulse 1.8s var(--ease-out) infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes tl-pulse { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.9); } }
        @media (prefers-reduced-motion: reduce) { #timeline .tl-head-ring { animation: none; } }
        html[data-reduced] #timeline .tl-head-ring { animation: none; }
      `}</style>
    </section>
  )
}
