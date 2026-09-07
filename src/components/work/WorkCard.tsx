import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Play } from 'lucide-react'
import type { Work } from '@/data/work'
import { DeviceFrame } from './DeviceFrame'
import { cn } from '@/lib/cn'

const SeatLockDemo = lazy(() => import('@/components/demos/SeatLockDemo').then((m) => ({ default: m.SeatLockDemo })))
const EventBusDemo = lazy(() => import('@/components/demos/EventBusDemo').then((m) => ({ default: m.EventBusDemo })))

type Props = { work: Work; index: number; className?: string; style?: React.CSSProperties }

export function WorkCard({ work, index, className, style }: Props) {
  const [showDemo, setShowDemo] = useState(false)
  const hasDemo = Boolean(work.demo)

  return (
    <article
      className={cn('work-card group relative flex w-full flex-col gap-5 md:w-[560px] md:shrink-0', className)}
      style={style}
      aria-labelledby={`work-${work.slug}-title`}
    >
      <div
        className="relative"
        onMouseEnter={() => hasDemo && window.matchMedia('(hover: hover)').matches && setShowDemo(true)}
        onMouseLeave={() => setShowDemo(false)}
      >
        <DeviceFrame
          src={work.images.desktop}
          alt={`${work.title} desktop screenshot`}
          title={work.title}
          domain={work.liveDomain}
          priority={index === 0}
        >
          {hasDemo && showDemo && (
            <div className="absolute inset-0 z-10 overflow-auto bg-bg/95 px-3 pb-3 pt-12" data-lenis-prevent>
              <Suspense fallback={<div className="label p-4">loading demo…</div>}>
                {work.demo === 'seatlock' ? <SeatLockDemo compact /> : <EventBusDemo compact />}
              </Suspense>
            </div>
          )}
        </DeviceFrame>

        {work.images.mobile && (
          <DeviceFrame
            src={work.images.mobile}
            alt={`${work.title} mobile screenshot`}
            title={work.title}
            kind="mobile"
            hideIfMissing
            className="absolute -bottom-4 -right-2 w-[28%] shadow-[0_20px_40px_rgba(0,0,0,.6)] md:-right-4"
          />
        )}

        {hasDemo && (
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="font-mono absolute left-3 top-11 z-20 inline-flex items-center gap-1.5 rounded-full border border-accent bg-bg/90 px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-accent"
            aria-pressed={showDemo}
          >
            <Play size={10} aria-hidden="true" />
            {showDemo ? 'close demo' : 'live demo inside'}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 pr-2">
        <div className="eyebrow">
          {work.year} · {work.type}
        </div>
        <h3 id={`work-${work.slug}-title`} className="text-[26px] font-semibold leading-tight tracking-[-.02em] text-text">
          {work.title}
        </h3>
        <p className="text-[15px] leading-snug text-text-2">{work.hook}</p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
          {work.stack.slice(0, 6).map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
          {work.stack.length > 6 && <li className="chip">+{work.stack.length - 6}</li>}
        </ul>
        <div className="font-mono mt-1 flex flex-wrap items-center gap-5 text-[12px]">
          <Link to={`/work/${work.slug}`} className="link-underline text-text">
            Case study →
          </Link>
          {work.live && (
            <a
              href={work.live}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline inline-flex items-center gap-1 text-text-2"
            >
              Live <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          )}
          <a
            href={work.source}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline inline-flex items-center gap-1 text-text-2"
          >
            Source <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  )
}
