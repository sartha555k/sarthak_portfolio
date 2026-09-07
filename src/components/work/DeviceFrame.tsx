import { useImageExists } from '@/lib/useImageExists'
import { cn } from '@/lib/cn'

type Props = {
  src?: string
  alt: string
  title: string
  kind?: 'desktop' | 'mobile'
  domain?: string
  className?: string
  priority?: boolean
  /** Hide entirely (instead of placeholder) when the file is missing. */
  hideIfMissing?: boolean
  children?: React.ReactNode
}

/** Minimal browser / phone chrome around a screenshot. Placeholder when the file is missing. */
export function DeviceFrame({ src, alt, title, kind = 'desktop', domain, className, priority, hideIfMissing, children }: Props) {
  const state = useImageExists(src)
  if (state === 'missing' && hideIfMissing) return null

  const isMobile = kind === 'mobile'
  const w = isMobile ? 390 : 1600
  const h = isMobile ? 844 : 1000

  return (
    <figure
      className={cn(
        'relative overflow-hidden border border-line bg-bg-2',
        isMobile ? 'rounded-[22px] p-[6px]' : 'rounded-[var(--radius)]',
        className,
      )}
    >
      {!isMobile && (
        <div className="flex h-8 items-center gap-2 border-b border-line px-3" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-text-3/60" />
          <span className="h-2 w-2 rounded-full bg-text-3/60" />
          <span className="h-2 w-2 rounded-full bg-text-3/60" />
          <span className="font-mono ml-3 flex h-5 flex-1 items-center rounded bg-bg px-2 text-[10px] text-text-3">
            {domain ?? 'localhost:5173'}
          </span>
        </div>
      )}
      <div className={cn('relative overflow-hidden bg-bg-3', isMobile && 'rounded-[16px]')} style={{ aspectRatio: `${w} / ${h}` }}>
        {state === 'ok' && src ? (
          <img
            src={src}
            alt={alt}
            width={w}
            height={h}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, var(--bg-3) 0%, #1f1f25 50%, var(--bg-2) 100%)`,
            }}
            role="img"
            aria-label={`${title} screenshot placeholder`}
          >
            <span
              className={cn(
                'font-display uppercase leading-none text-text opacity-20',
                isMobile ? 'text-[9vw] md:text-[40px]' : 'text-[14vw] md:text-[72px]',
              )}
              style={{ letterSpacing: '.02em' }}
            >
              {title}
            </span>
          </div>
        )}
        {children}
      </div>
    </figure>
  )
}
