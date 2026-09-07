import { useRef, useState } from 'react'
import { work } from '@/data/work'
import { WorkCard } from './WorkCard'
import { SectionHeader } from '@/components/chrome/SectionRule'
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap'

const pad = (n: number) => String(n).padStart(2, '0')

export function WorkGallery() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Pinned horizontal gallery: desktop only, motion allowed only.
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const trackEl = track.current
        const sectionEl = root.current
        if (!trackEl || !sectionEl) return

        const cards = gsap.utils.toArray<HTMLElement>('.work-card', trackEl)
        const getDistance = () => Math.max(0, trackEl.scrollWidth - window.innerWidth + 48)

        const tween = gsap.to(trackEl, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top top',
            end: () => `+=${getDistance()}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              setProgress(self.progress)
              // Subtle 3D tilt: rotateY ±4° by distance from viewport centre.
              const vw = window.innerWidth
              const centre = vw / 2
              for (const card of cards) {
                const r = card.getBoundingClientRect()
                const d = (r.left + r.width / 2 - centre) / vw // -0.5..0.5
                gsap.set(card, { rotateY: gsap.utils.clamp(-4, 4, -d * 8), transformPerspective: 1200 })
              }
            },
          },
        })

        // Images inside the pinned section change height as they arrive.
        const imgs = trackEl.querySelectorAll('img')
        const refresh = () => ScrollTrigger.refresh()
        imgs.forEach((i) => i.addEventListener('load', refresh, { once: true }))

        return () => {
          tween.scrollTrigger?.kill()
          tween.kill()
          gsap.set(cards, { clearProps: 'transform' })
          gsap.set(trackEl, { clearProps: 'transform' })
        }
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  const current = Math.min(work.length, Math.max(1, Math.round(progress * (work.length - 1)) + 1))

  return (
    <section
      id="work"
      ref={root}
      className="section lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:overflow-hidden lg:py-0"
      aria-labelledby="work-title"
    >
      <div className="container">
        <SectionHeader
          index="02"
          label="Work"
          id="work-title"
          title="Selected work."
          sub="Six things I built. Two of them you can poke at without leaving this page."
        />
      </div>

      <div className="work-viewport lg:pl-[max(var(--gutter),calc((100vw-var(--max))/2+var(--gutter)))]">
        <div
          ref={track}
          className="flex flex-col gap-16 px-[var(--gutter)] md:flex-row md:gap-6 md:px-0 lg:will-change-transform"
        >
          {work.map((w, i) => (
            <WorkCard key={w.slug} work={w} index={i} />
          ))}
          <div className="hidden w-[10vw] shrink-0 md:block" aria-hidden="true" />
        </div>
      </div>

      {/* Progress bar: desktop pinned mode only */}
      <div className="container mt-10 hidden items-center gap-4 lg:flex">
        <span className="font-mono text-[12px] tabular-nums text-text-2">
          {pad(current)} / {pad(work.length)}
        </span>
        <div className="relative h-px flex-1 bg-line">
          <span
            className="absolute left-0 top-0 h-px bg-accent transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Tablet: horizontal scroll fallback (no pin) */}
      <style>{`
        @media (min-width: 768px) and (max-width: 1023px) {
          #work .work-viewport { overflow-x: auto; scroll-snap-type: x mandatory; padding-inline: var(--gutter); scrollbar-width: none; }
          #work .work-viewport::-webkit-scrollbar { display: none; }
          #work .work-card { scroll-snap-align: start; }
        }
      `}</style>
    </section>
  )
}
