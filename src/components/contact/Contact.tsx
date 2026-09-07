import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Download } from 'lucide-react'
import { profile } from '@/data/profile'
import { SectionRule } from '@/components/chrome/SectionRule'
import { useReducedMotion } from '@/lib/reducedMotion'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  const reduced = useReducedMotion()

  // Slow radial glow follows the pointer on desktop. rAF-throttled. Static otherwise.
  useEffect(() => {
    const el = root.current
    if (!el || reduced || !window.matchMedia('(pointer: fine)').matches) return
    let raf = 0
    let x = 50
    let y = 50
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      x = ((e.clientX - r.left) / r.width) * 100
      y = ((e.clientY - r.top) / r.height) * 100
      if (!raf)
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--mx', `${x}%`)
          el.style.setProperty('--my', `${y}%`)
          raf = 0
        })
    }
    el.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  function copyEmail(e: React.MouseEvent) {
    e.preventDefault()
    navigator.clipboard?.writeText(profile.email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <section
      id="contact"
      ref={root}
      className="section relative overflow-hidden"
      aria-labelledby="contact-title"
      style={{ '--mx': '50%', '--my': '40%' } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(600px circle at var(--mx) var(--my), rgba(255,59,31,.08), transparent 70%)',
          transition: reduced ? 'none' : 'background-position 1.2s var(--ease-out)',
        }}
      />
      <div className="container">
        <SectionRule index="05" label="Contact" />

        <h2
          id="contact-title"
          className="mt-14 max-w-[16ch] font-semibold leading-[1.02] tracking-[-.03em] text-text"
          style={{ fontSize: 'clamp(36px, 6vw, 88px)' }}
          data-reveal
        >
          Have something worth building?
        </h2>

        <ul className="mt-14 grid gap-3 md:grid-cols-3" aria-label="Ways to reach me">
          <li data-reveal>
            <a
              href={`mailto:${profile.email}`}
              onClick={copyEmail}
              className="card font-mono group flex min-h-[112px] flex-col justify-between p-5 text-[13px] text-text transition-colors hover:border-accent-2"
              aria-label={`Copy email address ${profile.email}`}
            >
              <span className="label">email · click to copy</span>
              <span className="flex items-center justify-between gap-2 break-all">
                {profile.email}
                <span className="shrink-0 text-ok" aria-live="polite">
                  {copied ? 'copied ✓' : ''}
                </span>
              </span>
            </a>
          </li>
          <li data-reveal>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="card font-mono group flex min-h-[112px] flex-col justify-between p-5 text-[13px] text-text transition-colors hover:border-accent-2"
            >
              <span className="label">github</span>
              <span className="flex items-center justify-between gap-2 break-all">
                {profile.githubHandle} <ArrowUpRight size={14} className="shrink-0 text-text-3 group-hover:text-text" aria-hidden="true" />
              </span>
            </a>
          </li>
          <li data-reveal>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="card font-mono group flex min-h-[112px] flex-col justify-between p-5 text-[13px] text-text transition-colors hover:border-accent-2"
            >
              <span className="label">linkedin</span>
              <span className="flex items-center justify-between gap-2 break-all">
                {profile.linkedinHandle} <ArrowUpRight size={14} className="shrink-0 text-text-3 group-hover:text-text" aria-hidden="true" />
              </span>
            </a>
          </li>
        </ul>

        <div className="mt-8" data-reveal>
          <a href={profile.resume} download className="btn">
            <Download size={13} aria-hidden="true" /> Download résumé (PDF)
          </a>
        </div>
      </div>
    </section>
  )
}
