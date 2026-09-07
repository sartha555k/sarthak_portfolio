import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { profile } from '@/data/profile'

type Scores = { performance?: number; accessibility?: number; 'best-practices'?: number; seo?: number; fetchedAt?: string }

const RING = [
  { key: 'performance', label: 'Perf' },
  { key: 'accessibility', label: 'A11y' },
  { key: 'best-practices', label: 'Best' },
  { key: 'seo', label: 'SEO' },
] as const

function Ring({ value, label }: { value?: number; label: string }) {
  const r = 14
  const c = 2 * Math.PI * r
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value))
  const color = value == null ? 'var(--text-3)' : pct >= 90 ? 'var(--ok)' : pct >= 50 ? 'var(--warn)' : 'var(--bad)'
  return (
    <div className="flex flex-col items-center gap-1" title={`Lighthouse ${label}: ${value ?? '--'}`}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          transform="rotate(-90 20 20)"
        />
        <text x="20" y="24" textAnchor="middle" fontSize="10" fill="var(--text)" fontFamily="var(--font-mono)">
          {value ?? '--'}
        </text>
      </svg>
      <span className="label text-[10px]">{label}</span>
    </div>
  )
}

export function Footer() {
  const [scores, setScores] = useState<Scores | null>(null)
  useEffect(() => {
    fetch('/lighthouse.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setScores(j))
      .catch(() => {})
  }, [])

  const buildDate = import.meta.env.VITE_BUILD_DATE ?? '—'

  return (
    <footer className="border-t border-line">
      <div className="container grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="eyebrow mb-4">Built with</div>
          <ul className="font-mono flex flex-wrap gap-x-3 gap-y-2 text-[12px] text-text-2">
            {profile.builtWith.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="eyebrow mb-4">Lighthouse · mobile</div>
          <div className="flex gap-4">
            {RING.map((r) => (
              <Ring key={r.key} value={scores?.[r.key]} label={r.label} />
            ))}
          </div>
          <p className="label mt-2 text-[10px]">
            {scores?.fetchedAt ? `measured ${scores.fetchedAt.slice(0, 10)}` : 'run npm run lighthouse to fill these'}
          </p>
        </div>

        <div className="font-mono text-[12px] text-text-2 md:text-right">
          <a
            href={profile.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline inline-flex items-center gap-1 text-text"
          >
            View source <ArrowUpRight size={12} aria-hidden="true" />
          </a>
          <p className="mt-3 text-text-3">Last deployed {buildDate}</p>
          <p className="mt-1 text-text-3">© 2026 Sarthak Patel · Indore</p>
        </div>
      </div>

      <div className="container pb-10">
        <div className="font-mono flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-text-3" aria-label="Keyboard shortcuts">
          <span>
            <kbd className="chip">⌘K</kbd> palette
          </span>
          <span>
            <kbd className="chip">/</kbd> search
          </span>
          <span>
            <kbd className="chip">g</kbd> then <kbd className="chip">s</kbd> <kbd className="chip">w</kbd>{' '}
            <kbd className="chip">t</kbd> <kbd className="chip">a</kbd> <kbd className="chip">c</kbd> jump
          </span>
          <span>
            <kbd className="chip">esc</kbd> close
          </span>
          <span>
            <kbd className="chip">?</kbd> this legend
          </span>
        </div>
      </div>
    </footer>
  )
}
