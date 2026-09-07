import '@fontsource-variable/inter-tight/index.css'
import '@fontsource/bebas-neue/index.css'
import '@fontsource-variable/jetbrains-mono/index.css'
import './index.css'

/**
 * Paint first, hydrate next. The HTML is prerendered, so the page is already on
 * screen; the app bundle is preloaded from <head> and evaluated one frame after
 * the first paint instead of before it.
 */
const start = () => import('./client').then((m) => m.mount())

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => setTimeout(start, 0)), { once: true })
} else {
  requestAnimationFrame(() => setTimeout(start, 0))
}
