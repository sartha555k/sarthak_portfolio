import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'
const KEY = 'sp.reducedMotion'

/**
 * Reduced motion is true when the OS asks for it OR the user toggled it
 * from the command palette (stored in localStorage). The toggle sets
 * `data-reduced` on <html> so CSS and GSAP matchMedia see the same answer.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(KEY) === '1') return true
    if (localStorage.getItem(KEY) === '0') return false
  } catch {
    /* storage blocked */
  }
  return window.matchMedia?.(QUERY).matches ?? false
}

export function setReducedMotion(value: boolean) {
  try {
    localStorage.setItem(KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
  applyReducedMotionAttr()
  window.dispatchEvent(new CustomEvent('sp:reduced-motion', { detail: value }))
}

export function applyReducedMotionAttr() {
  if (typeof document === 'undefined') return
  document.documentElement.toggleAttribute('data-reduced', prefersReducedMotion())
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion())
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setReduced(prefersReducedMotion())
    mq.addEventListener('change', update)
    window.addEventListener('sp:reduced-motion', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('sp:reduced-motion', update)
    }
  }, [])
  return reduced
}
