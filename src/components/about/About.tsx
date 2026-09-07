import { useRef } from 'react'
import { profile } from '@/data/profile'
import { Terminal } from './Terminal'
import { SectionRule } from '@/components/chrome/SectionRule'
import { useImageExists } from '@/lib/useImageExists'
import { gsap, useGSAP, NO_PREF } from '@/lib/gsap'

const PORTRAIT = '/img/about-portrait.webp'

export function About() {
  const root = useRef<HTMLElement>(null)
  const img = useImageExists(PORTRAIT)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(NO_PREF, () => {
        const t = gsap.fromTo(
          '.about-portrait-inner',
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
          },
        )
        return () => {
          t.scrollTrigger?.kill()
          t.kill()
        }
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  const rows = [
    { key: 'building', value: profile.now.building, verify: true },
    { key: 'learning', value: profile.now.learning, verify: true },
    { key: 'open to', value: profile.now.openTo },
    { key: 'location', value: profile.now.location },
  ]

  return (
    <section id="about" ref={root} className="section" aria-labelledby="about-title">
      <div className="container">
        <SectionRule index="04" label="About" />
        <h2 id="about-title" className="sr-only">
          About
        </h2>

        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
          <div className="about-portrait relative overflow-hidden rounded-[var(--radius)] border border-line bg-bg-3" style={{ aspectRatio: '3 / 4' }} data-reveal>
            <div className="about-portrait-inner absolute inset-[-8%]">
              {img === 'ok' ? (
                <img
                  src={PORTRAIT}
                  alt="Sarthak Patel, waist-up portrait"
                  width={1200}
                  height={1600}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-bg-3" aria-hidden="true" title="Placeholder: drop public/img/about-portrait.webp here" />
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-8">
            <div className="flex flex-col gap-5 text-[17px] leading-[1.65] text-text-2 md:text-[18px]">
              <p className="font-display text-[34px] leading-none tracking-[.01em] text-text md:text-[44px]" data-reveal>
                {profile.tagline}
              </p>
              {profile.about.map((p, i) => (
                <p key={i} data-reveal>
                  {p}
                </p>
              ))}
            </div>
            <div data-reveal>
              <Terminal file="now.txt" rows={rows} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
