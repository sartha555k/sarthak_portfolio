import { gsap } from '@/lib/gsap'

/**
 * Imperative packet factory. Creates an SVG circle in `layer`, animates it
 * along `path`, then removes it. Returns the tween so callers can kill it.
 * A `dup` packet follows the first one and gets rejected at the end.
 */
export function firePacket(layer: SVGGElement, path: SVGPathElement, opts: { dup?: boolean } = {}) {
  const svgNS = 'http://www.w3.org/2000/svg'
  const g = document.createElementNS(svgNS, 'g')
  const dot = document.createElementNS(svgNS, 'circle')
  dot.setAttribute('r', '4')
  dot.setAttribute('fill', opts.dup ? 'var(--accent-2)' : 'var(--accent)')
  g.appendChild(dot)
  layer.appendChild(g)

  // Follow the path by arc length. No MotionPathPlugin needed for a straight or single-curve edge.
  const len = path.getTotalLength()
  const pos = { t: 0 }
  const place = () => {
    const p = path.getPointAtLength(pos.t * len)
    gsap.set(g, { x: p.x, y: p.y })
  }
  place()
  gsap.set(g, { opacity: 0 })

  const tl = gsap.timeline({
    onComplete: () => {
      g.remove()
    },
  })

  tl.to(g, { opacity: 1, duration: 0.15 })
    .to(pos, { t: 1, duration: 1.6, ease: 'power1.inOut', onUpdate: place }, 0)

  if (opts.dup) {
    // Rejected on arrival: flash red, tiny label, shrink away.
    const label = document.createElementNS(svgNS, 'text')
    label.textContent = 'dup'
    label.setAttribute('x', '8')
    label.setAttribute('y', '-8')
    label.setAttribute('font-size', '10')
    label.setAttribute('font-family', 'var(--font-mono)')
    label.setAttribute('fill', 'var(--bad)')
    label.setAttribute('opacity', '0')
    g.appendChild(label)
    tl.to(dot, { attr: { fill: 'var(--bad)' }, duration: 0.1 }, 1.55)
      .to(label, { opacity: 1, duration: 0.15 }, 1.55)
      .to(g, { scale: 0.4, opacity: 0, duration: 0.5, ease: 'power2.in' }, 1.9)
  } else {
    tl.to(g, { opacity: 0, duration: 0.3 }, 1.5)
  }

  return tl
}
