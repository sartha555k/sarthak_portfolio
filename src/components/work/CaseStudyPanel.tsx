import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowUpRight, Check, Copy, X } from 'lucide-react'
import { work, workBySlug } from '@/data/work'
import { DeviceFrame } from './DeviceFrame'
import { startScroll, stopScroll } from '@/lib/lenis'
import { gsap, useGSAP, NO_PREF, REDUCED } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/reducedMotion'

const SeatLockDemo = lazy(() => import('@/components/demos/SeatLockDemo').then((m) => ({ default: m.SeatLockDemo })))
const EventBusDemo = lazy(() => import('@/components/demos/EventBusDemo').then((m) => ({ default: m.EventBusDemo })))

export function CaseStudyPanel() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const item = workBySlug(slug)
  const panel = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const closing = useRef(false)

  const idx = work.findIndex((w) => w.slug === slug)
  const prev = idx > 0 ? work[idx - 1] : work[work.length - 1]
  const next = idx < work.length - 1 ? work[idx + 1] : work[0]

  function close() {
    if (closing.current) return
    closing.current = true
    const done = () => navigate('/')
    if (prefersReducedMotion() || !panel.current) return done()
    gsap.to(panel.current, { xPercent: 100, duration: 0.45, ease: 'power3.in' })
    gsap.to(backdrop.current, { opacity: 0, duration: 0.4, onComplete: done })
  }

  useEffect(() => {
    if (!item) {
      navigate('/', { replace: true })
      return
    }
    stopScroll()
    document.title = `${item.title} — Sarthak Patel`
    const prevFocus = document.activeElement as HTMLElement | null
    panel.current?.focus()
    return () => {
      startScroll()
      document.title = 'Sarthak Patel — Full-stack developer'
      prevFocus?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useEffect(() => {
    closing.current = false
    panel.current?.scrollTo({ top: 0 })
  }, [slug])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (e.key === 'Escape' || (e.key === 'ArrowLeft' && !inField)) {
        e.preventDefault()
        close()
      }
      if (e.key === 'Tab' && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea',
        )
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(NO_PREF, () => {
        gsap.fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.6, ease: 'expo.out' })
        gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.5 })
        gsap.fromTo(
          '.cs-reveal',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, delay: 0.2, ease: 'expo.out' },
        )
      })
      mm.add(REDUCED, () => {
        gsap.set(panel.current, { xPercent: 0 })
        gsap.set(backdrop.current, { opacity: 1 })
        gsap.set('.cs-reveal', { y: 0, opacity: 1 })
      })
      return () => mm.revert()
    },
    { scope: panel, dependencies: [slug] },
  )

  if (!item) return null

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <div ref={backdrop} className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cs-title"
        tabIndex={-1}
        data-lenis-prevent
        className="absolute inset-y-0 right-0 w-full overflow-y-auto border-l border-line bg-bg shadow-[-40px_0_120px_rgba(0,0,0,.6)] outline-none md:w-[720px]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg/85 px-6 py-3 backdrop-blur-[12px] md:px-10">
          <button type="button" onClick={close} className="btn btn-sm">
            <ArrowLeft size={12} aria-hidden="true" /> back
          </button>
          <span className="font-mono text-[11px] text-text-3">
            {String(idx + 1).padStart(2, '0')} / {String(work.length).padStart(2, '0')}
          </span>
          <button type="button" onClick={close} className="btn btn-sm" aria-label="Close case study">
            <X size={12} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pb-20 pt-8 md:px-10">
          <div className="cs-reveal eyebrow">
            {item.year} · {item.type} · {item.role}
          </div>
          <h2 id="cs-title" className="cs-reveal mt-3 text-[34px] font-semibold leading-tight tracking-[-.02em] md:text-[44px]">
            {item.title}
          </h2>
          <p className="cs-reveal mt-3 text-[18px] leading-snug text-text-2">{item.hook}</p>

          {/* Screenshot strip */}
          <div className="cs-reveal mt-10 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <DeviceFrame
              src={item.images.desktop}
              alt={`${item.title} desktop`}
              title={item.title}
              domain={item.liveDomain}
              priority
            />
            {item.images.mobile && (
              <DeviceFrame
                src={item.images.mobile}
                alt={`${item.title} mobile`}
                title={item.title}
                kind="mobile"
                className="w-[96px] md:w-[120px]"
              />
            )}
          </div>
          {item.images.detail && (
            <DeviceFrame
              src={item.images.detail}
              alt={`${item.title} detail`}
              title={item.title}
              domain={item.liveDomain}
              hideIfMissing
              className="cs-reveal mt-4"
            />
          )}

          <Block title="Problem" className="mt-12">
            <p className="text-text-2">{item.problem}</p>
          </Block>

          <Block title="Approach" className="mt-10">
            <ul className="flex flex-col gap-2 text-text-2">
              {item.approach.map((a) => (
                <li key={a} className="flex gap-3">
                  <span className="mt-[11px] h-px w-3 shrink-0 bg-accent-2" aria-hidden="true" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="The hard part" className="mt-10">
            <p className="text-text-2">{item.hardPart}</p>
            {item.code && <CodeBlock html={item.code} file={item.codeLang} />}
          </Block>

          {item.demo && (
            <Block title="Live demo" className="mt-12">
              <Suspense fallback={<div className="label p-6">loading demo…</div>}>
                {item.demo === 'seatlock' ? <SeatLockDemo /> : <EventBusDemo />}
              </Suspense>
            </Block>
          )}

          <Block title="Stack" className="mt-12">
            <ul className="flex flex-wrap gap-1.5">
              {item.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Links" className="mt-10">
            <div className="font-mono flex flex-wrap gap-5 text-[13px]">
              {item.live ? (
                <a
                  href={item.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex items-center gap-1 text-text"
                >
                  Live <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              ) : (
                <span className="text-text-3">Live: not deployed (Compose only)</span>
              )}
              <a
                href={item.source}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline inline-flex items-center gap-1 text-text"
              >
                Source <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            </div>
          </Block>

          <Block title="What I'd do next" className="mt-10">
            <ol className="font-mono flex flex-col gap-2 text-[13px] text-text-2">
              {item.next.map((n, i) => (
                <li key={n} className="flex gap-3">
                  <span className="text-text-3">{String(i + 1).padStart(2, '0')}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ol>
          </Block>

          <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-line pt-6" aria-label="Other projects">
            <Link to={`/work/${prev.slug}`} className="group flex flex-col gap-1">
              <span className="label">← prev</span>
              <span className="font-semibold text-text transition-colors group-hover:text-accent-2">{prev.title}</span>
            </Link>
            <Link to={`/work/${next.slug}`} className="group flex flex-col items-end gap-1 text-right">
              <span className="label">next →</span>
              <span className="font-semibold text-text transition-colors group-hover:text-accent-2">{next.title}</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}

function Block({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`cs-reveal ${className ?? ''}`}>
      <h3 className="eyebrow mb-3">{title}</h3>
      {children}
    </section>
  )
}

function CodeBlock({ html, file }: { html: string; file?: string }) {
  const [copied, setCopied] = useState(false)
  const pre = useRef<HTMLPreElement>(null)
  function copy() {
    const text = pre.current?.innerText ?? ''
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="relative mt-4">
      <div className="flex items-center justify-between rounded-t-[var(--radius)] border border-b-0 border-line bg-bg-2 px-3 py-1.5">
        <span className="font-mono text-[11px] text-text-3">{file ?? 'snippet'}</span>
        <button type="button" onClick={copy} className="btn btn-sm !py-0.5 !text-[11px]" aria-label="Copy code">
          {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region must be keyboard reachable */}
      <pre ref={pre} className="code !rounded-t-none" tabIndex={0}>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}
