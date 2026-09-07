import { useRef } from 'react'
import { Wordmark } from './Wordmark'
import { profile } from '@/data/profile'
import { gsap, useGSAP, NO_PREF, REDUCED } from '@/lib/gsap'
import { cn } from '@/lib/cn'
import { imageExists, useImageExists } from '@/lib/useImageExists'

type Props = { ready: boolean }

const CUTOUT = '/img/hero-cutout.png'
const CUTOUT_1X = '/img/hero-cutout@1x.png'

export function Hero({ ready }: Props) {
  const root = useRef<HTMLElement>(null)
  const imgState = useImageExists(CUTOUT)

  useGSAP(
    () => {
      if (!ready) return
      const mm = gsap.matchMedia()

      mm.add(NO_PREF, () => {
        const letters = gsap.utils.toArray<HTMLElement>('.wm-letter', root.current)
        const gradLetters = gsap.utils.toArray<HTMLElement>('.wm-back .wm-letter', root.current)
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

        const back = root.current?.querySelector('.wm-back')
        tl.set(gradLetters, { backgroundPosition: '0% 50%' })
          .add(() => back?.classList.add('wm-grad'), 0)
          .fromTo(letters, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.035 }, 0)
          .to(gradLetters, { backgroundPosition: '100% 50%', duration: 1.2, ease: 'power2.inOut' }, 0.1)
          .add(() => back?.classList.remove('wm-grad'), 1.3)
          .fromTo('.hero-cutout', { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 1.2 }, 0.25)
          .fromTo('.hero-eyebrow, .hero-meta', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.9)

        // Parallax + fade across the first viewport.
        const st = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
          },
        })
        st.to('.hero-wordmarks', { y: '-12vh', ease: 'none' }, 0)
          .to('.hero-cutout', { y: '-6vh', ease: 'none' }, 0)
          .to('.hero-wordmarks, .hero-cutout', { opacity: 0.35, ease: 'none' }, 0)

        return () => {
          tl.kill()
          st.kill()
        }
      })

      mm.add(REDUCED, () => {
        gsap.set('.wm-letter', { yPercent: 0 })
        gsap.set('.hero-cutout, .hero-eyebrow, .hero-meta', { opacity: 1, scale: 1, y: 0 })
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [ready] },
  )


  return (
    <section
      id="top"
      ref={root}
      className={cn('relative isolate flex h-[100svh] min-h-[560px] flex-col overflow-hidden')}
      aria-labelledby="hero-title"
    >
      <style>{`
        #top .wm-back .wm-letter { color: var(--accent); }
        #top .wm-back.wm-grad .wm-letter {
          color: transparent;
          background-image: linear-gradient(90deg, #f5b942 0%, #ff3b1f 55%, #ff3b1f 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
        }
        #top .wm-front { clip-path: inset(0 0 var(--hero-clip) 0); color: var(--accent); }
      `}</style>

      <h1 id="hero-title" className="sr-only">
        Sarthak Patel, full-stack developer in Indore, India
      </h1>

      <p className="hero-eyebrow eyebrow absolute inset-x-0 top-[26%] z-[4] text-center">── Welcome · Portfolio v1 ──</p>

      {/* Layer stack: back wordmark (z1) · cutout (z2) · clipped front wordmark (z3).
          Each copy gets its own wrapper because transforms create stacking contexts. */}
      <div className="hero-wordmarks absolute inset-x-0 top-[38%] z-[1] px-[2vw]">
        <Wordmark className="wm-back" />
      </div>
      <div className="hero-wordmarks absolute inset-x-0 top-[38%] z-[3] px-[2vw]" aria-hidden="true">
        <Wordmark className="wm-front" decorative />
      </div>

      <div className="hero-cutout pointer-events-none absolute inset-x-0 bottom-[8%] z-[2] flex justify-center" style={{ height: '78vh' }}>
        {imgState !== 'ok' ? (
          <div
            className="h-full w-[34vw] max-w-[380px] rounded-[40%_40%_18px_18px/22%_22%_18px_18px] bg-bg-3"
            aria-hidden="true"
            title="Placeholder: drop public/img/hero-cutout.png here"
          />
        ) : (
          <img
            src={CUTOUT}
            srcSet={imageExists(CUTOUT_1X) ? `${CUTOUT_1X} 1x, ${CUTOUT} 2x` : undefined}
            alt=""
            width={1200}
            height={2400}
            fetchPriority="high"
            decoding="async"
            className="h-full w-auto object-contain object-bottom"
          />
        )}
      </div>

      <div className="hero-meta absolute inset-x-0 bottom-6 z-[4] flex items-end justify-between px-[var(--gutter)]">
        <p className="font-mono text-[12px] text-text-2">
          {profile.role} · {profile.location}
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] text-text-3">↓ scroll</span>
          <span className="scroll-line block h-10 w-px bg-text-3" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
