import type { StackNode } from '@/data/stack'
import { cn } from '@/lib/cn'

type Props = {
  node: StackNode
  active: boolean
  onActivate: (id: string | null) => void
}

const KIND_ACCENT: Record<StackNode['kind'], string> = {
  client: 'var(--text-2)',
  service: 'var(--text-2)',
  store: 'var(--accent-2)',
  bus: 'var(--accent)',
  infra: 'var(--text-3)',
}

/** SVG node for the desktop diagram. Focusable, hover/focus reveal the popover. */
export function NodeCard({ node, active, onActivate }: Props) {
  const { x, y, w, h, title, tech, kind } = node
  const chipY = y + h - 26
  let chipX = x + 12
  return (
    <g
      className={cn('node cursor-default outline-none', active && 'is-active')}
      tabIndex={0}
      role="button"
      aria-label={`${title}: ${node.didWith}`}
      aria-pressed={active}
      onMouseEnter={() => onActivate(node.id)}
      onMouseLeave={() => onActivate(null)}
      onFocus={() => onActivate(node.id)}
      onBlur={() => onActivate(null)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onActivate(null)
      }}
      data-node={node.id}
      style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill="var(--bg-3)"
        stroke={active ? 'var(--accent-2)' : 'var(--line)'}
        strokeWidth={1}
        className="transition-[stroke] duration-200"
      />
      <rect x={x} y={y} width={3} height={h} rx={1.5} fill={KIND_ACCENT[kind]} opacity={kind === 'store' || kind === 'bus' ? 1 : 0.35} />
      <text x={x + 14} y={y + 24} fontFamily="var(--font-mono)" fontSize="13" fill="var(--text)">
        {title}
      </text>
      {tech.map((t) => {
        const cw = t.length * 6.6 + 14
        const cx = chipX
        chipX += cw + 6
        if (cx + cw > x + w - 8) return null
        return (
          <g key={t}>
            <rect x={cx} y={chipY} width={cw} height={18} rx={9} fill="var(--bg-2)" stroke="var(--line)" />
            <text x={cx + 7} y={chipY + 12.5} fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-2)">
              {t}
            </text>
          </g>
        )
      })}
    </g>
  )
}
