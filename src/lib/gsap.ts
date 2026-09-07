import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register once. Every component imports from here, never from 'gsap' directly.
gsap.registerPlugin(ScrollTrigger, useGSAP)

gsap.defaults({ ease: 'expo.out', duration: 0.9 })

if (typeof window !== 'undefined') ScrollTrigger.config({ ignoreMobileResize: true })

export const EASE = 'expo.out'
export const REDUCED = '(prefers-reduced-motion: reduce)'
export const NO_PREF = '(prefers-reduced-motion: no-preference)'

export { gsap, ScrollTrigger, useGSAP }
