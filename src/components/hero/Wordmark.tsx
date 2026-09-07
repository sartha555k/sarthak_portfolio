import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  text?: string
  className?: string
  style?: React.CSSProperties
  /** Only one copy should be read by assistive tech. */
  decorative?: boolean
}

/** Splits the word into per-letter spans so GSAP can stagger them. Same metrics on every copy. */
export const Wordmark = forwardRef<HTMLDivElement, Props>(function Wordmark(
  { text = 'SARTHAK', className, style, decorative = false },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('wordmark flex justify-between select-none', className)}
      style={style}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : text}
      role={decorative ? undefined : 'img'}
    >
      {text.split('').map((ch, i) => (
        <span key={i} className="wm-clip inline-block overflow-hidden pb-[0.04em]" aria-hidden="true">
          <span className="wm-letter inline-block will-change-transform">{ch}</span>
        </span>
      ))}
    </div>
  )
})
