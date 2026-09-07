import { useCallback, useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation, useMatch } from 'react-router'
import { Nav } from '@/components/chrome/Nav'
import { SideDots } from '@/components/chrome/SideDots'
import { CommandPalette } from '@/components/chrome/CommandPalette'
import { Footer } from '@/components/chrome/Footer'
import { Boot } from '@/components/boot/Boot'
import { shouldBoot } from '@/components/boot/shouldBoot'
import { Hero } from '@/components/hero/Hero'
import { SystemDiagram } from '@/components/system/SystemDiagram'
import { WorkGallery } from '@/components/work/WorkGallery'
import { CaseStudyPanel } from '@/components/work/CaseStudyPanel'
import { GitTimeline } from '@/components/timeline/GitTimeline'
import { About } from '@/components/about/About'
import { Contact } from '@/components/contact/Contact'
import { sections } from '@/data/profile'
import { initLenis, scrollTo } from '@/lib/lenis'
import { ScrollTrigger } from '@/lib/gsap'
import { initReveals } from '@/lib/reveal'
import { applyReducedMotionAttr } from '@/lib/reducedMotion'

export default function App() {
  // Server and first client render agree: boot on. Repeat visits and reduced motion turn it off right after mount.
  const [booting, setBooting] = useState(true)
  const [bootVisible, setBootVisible] = useState(true)
  const [palette, setPalette] = useState(false)
  const page = useRef<HTMLDivElement>(null)
  const panelOpen = Boolean(useMatch('/work/:slug'))
  const location = useLocation()

  const onBootDone = useCallback(() => setBooting(false), [])
  const onBootExited = useCallback(() => setBootVisible(false), [])

  // Smooth scroll + reveals, once the page is interactive.
  useEffect(() => {
    if (!shouldBoot()) {
      setBooting(false)
      setBootVisible(false)
    }
    applyReducedMotionAttr()
    initLenis()
    const cleanup = initReveals(page.current ?? document)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    const t = setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => {
      cleanup()
      clearTimeout(t)
    }
  }, [])

  // Page behind the case-study panel is inert (not focusable, not clickable).
  useEffect(() => {
    const el = page.current
    if (!el) return
    if (panelOpen) el.setAttribute('inert', '')
    else el.removeAttribute('inert')
  }, [panelOpen])

  // Landing directly on /work/:slug should scroll the page to the Work section underneath.
  useEffect(() => {
    if (panelOpen && location.state == null) {
      const t = setTimeout(() => scrollTo('#work', { immediate: true }), 50)
      return () => clearTimeout(t)
    }
  }, [panelOpen, location.state])

  // Keyboard: ⌘K / Ctrl+K / "/" open palette; "g" then a letter jumps; "?" goes to the legend.
  useEffect(() => {
    let pendingG = 0
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((v) => !v)
        return
      }
      if (typing || palette || panelOpen) return
      if (e.key === '/') {
        e.preventDefault()
        setPalette(true)
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        scrollTo('footer')
        return
      }
      const now = Date.now()
      if (e.key === 'g') {
        pendingG = now
        return
      }
      if (pendingG && now - pendingG < 900) {
        const s = sections.find((x) => x.key === e.key)
        if (s) {
          e.preventDefault()
          scrollTo(`#${s.id}`)
        }
        pendingG = 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [palette, panelOpen])

  return (
    <>
      {bootVisible && <Boot onDone={onBootDone} onExited={onBootExited} />}

      <div ref={page}>
        <Nav onOpenPalette={() => setPalette(true)} />
        <SideDots />
        <main id="main">
          <Hero ready={!booting} />
          <SystemDiagram />
          <WorkGallery />
          <GitTimeline />
          <About />
          <Contact />
        </main>
        <Footer />
      </div>

      <Routes>
        <Route path="/work/:slug" element={<CaseStudyPanel />} />
        <Route path="*" element={null} />
      </Routes>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />

      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
