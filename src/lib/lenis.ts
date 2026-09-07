import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './reducedMotion'

let lenis: Lenis | null = null
let tickerFn: ((time: number) => void) | null = null

export function initLenis(): Lenis | null {
  if (lenis) return lenis
  if (typeof window === 'undefined') return null
  // Reduced motion: native scrolling, ScrollTrigger still works off window scroll.
  if (prefersReducedMotion()) return null
  // Touch devices: native scrolling feels better and costs nothing.
  if (window.matchMedia('(pointer: coarse)').matches) return null

  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: false })
  lenis.on('scroll', ScrollTrigger.update)
  tickerFn = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tickerFn)
  gsap.ticker.lagSmoothing(0)
  document.documentElement.classList.add('lenis')
  return lenis
}

export function destroyLenis() {
  if (tickerFn) gsap.ticker.remove(tickerFn)
  lenis?.destroy()
  lenis = null
  tickerFn = null
  document.documentElement.classList.remove('lenis')
}

export function getLenis() {
  return lenis
}

export function stopScroll() {
  lenis?.stop()
  document.documentElement.classList.add('lenis-stopped')
  if (!lenis) document.documentElement.style.overflow = 'hidden'
}
export function startScroll() {
  lenis?.start()
  document.documentElement.classList.remove('lenis-stopped')
  if (!lenis) document.documentElement.style.overflow = ''
}

/** Scroll to a selector or element. Works with or without Lenis. */
export function scrollTo(target: string | HTMLElement, opts: { offset?: number; immediate?: boolean } = {}) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!el) return
  const offset = opts.offset ?? 0
  if (lenis) {
    lenis.scrollTo(el, { offset, immediate: opts.immediate, duration: 1.1, force: Boolean(opts.immediate) })
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top, behavior: opts.immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
  }
}
