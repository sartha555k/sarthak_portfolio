import { prefersReducedMotion } from '@/lib/reducedMotion'

export const BOOT_KEY = 'booted'

/** First visit in this tab, motion allowed → run the terminal boot. */
export function shouldBoot(): boolean {
  if (typeof window === 'undefined') return false
  if (prefersReducedMotion()) return false
  try {
    return sessionStorage.getItem(BOOT_KEY) !== '1'
  } catch {
    return true
  }
}
