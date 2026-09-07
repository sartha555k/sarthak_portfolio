import type { Commit as CommitT } from '@/data/timeline'
import { useImageExists } from '@/lib/useImageExists'
import { cn } from '@/lib/cn'

type Props = { commit: CommitT; index: number; active: boolean; isLast: boolean }

/** Lane x-offsets inside the graph column (px). */
export const LANE = { main: 0, work: 28, side: 56 } as const

export function Commit({ commit, active, isLast }: Props) {
  const img = useImageExists(commit.image)
  const lane = LANE[commit.branch]
  const isHead = commit.date === 'HEAD'

  return (
    <li
      className={cn('tl-row relative grid grid-cols-[56px_1fr] gap-4 md:grid-cols-[160px_1fr] md:gap-8', active && 'is-active')}
      data-branch={commit.branch}
    >
      {/* Graph cell */}
      <div className="relative min-h-[96px]">
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {/* Side branch: leave main, hold in lane, merge back. */}
          {lane > 0 && (
            <g className="tl-branch" fill="none" stroke="var(--accent-2)" strokeOpacity="0.5" strokeWidth="1.5">
              <path d={`M 20 0 C 20 20, ${20 + lane} 20, ${20 + lane} 40`} className="tl-branch-path" />
              <path d={`M ${20 + lane} 56 C ${20 + lane} 76, 20 76, 20 96`} className="tl-branch-path" />
            </g>
          )}
          {/* Node */}
          <g className="tl-node" style={{ transformOrigin: `${20 + lane}px 48px` }}>
            {isHead ? (
              <>
                <circle cx={20 + lane} cy={48} r={9} fill="none" stroke="var(--accent)" strokeWidth="1.5" className="tl-head-ring" />
                <circle cx={20 + lane} cy={48} r={4} fill="var(--accent)" />
              </>
            ) : (
              <>
                <circle cx={20 + lane} cy={48} r={6} fill="var(--bg)" stroke={lane ? 'var(--accent-2)' : 'var(--accent-2)'} strokeWidth="1.5" />
                <circle cx={20 + lane} cy={48} r={2.5} fill={active ? 'var(--accent)' : 'var(--accent-2)'} />
              </>
            )}
          </g>
        </svg>
        {/* Branch label on desktop */}
        {lane > 0 && (
          <span className="font-mono absolute left-[96px] top-[42px] hidden text-[10px] text-text-3 md:block">{commit.branch}</span>
        )}
      </div>

      {/* Row */}
      <div className={cn('relative border-l-2 pb-14 pl-5 transition-colors duration-300', active ? 'border-accent' : 'border-transparent')}>
        <div className="font-mono flex flex-wrap items-center gap-x-3 text-[12px] text-text-3">
          <span className="text-accent-2">{commit.hash}</span>
          <span>{isHead ? 'HEAD → now' : commit.date}</span>
          {isHead && <span className="chip !border-accent !text-accent">in progress</span>}
          {commit.verify && <span className="chip">verify</span>}
        </div>
        <h3 className="mt-2 text-[20px] font-semibold leading-tight tracking-[-.01em] text-text md:text-[22px]">{commit.title}</h3>
        <p className="mt-1.5 max-w-[60ch] text-[15px] text-text-2">{commit.body}</p>
        {commit.tags && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
            {commit.tags.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        )}
        {commit.image && img === 'ok' && (
          <img
            src={commit.image}
            alt=""
            width={960}
            height={540}
            loading="lazy"
            decoding="async"
            className="mt-4 w-[320px] max-w-full rounded-[var(--radius)] border border-line"
            style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
          />
        )}
        {isLast && <span className="sr-only">End of timeline</span>}
      </div>
    </li>
  )
}
