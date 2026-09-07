import { gsap, ScrollTrigger, NO_PREF, REDUCED } from './gsap'

/**
 * Generic scroll reveal for every `[data-reveal]` element in `scope`.
 * Motion: y 24 → 0, opacity 0 → 1, batched so siblings stagger.
 * Reduced motion: final state, nothing else.
 */
export function initReveals(scope: HTMLElement | Document = document) {
  const mm = gsap.matchMedia()
  const targets = () => gsap.utils.toArray<HTMLElement>('[data-reveal]', scope)

  mm.add(NO_PREF, () => {
    const els = targets()
    gsap.set(els, { y: 24, opacity: 0 })
    const batch = ScrollTrigger.batch(els, {
      start: 'top 88%',
      once: true,
      onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08, overwrite: true }),
    })
    return () => batch.forEach((t) => t.kill())
  })

  mm.add(REDUCED, () => {
    gsap.set(targets(), { y: 0, opacity: 1 })
  })

  return () => mm.revert()
}
