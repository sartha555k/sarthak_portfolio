import { useEffect, useRef, useState } from 'react'
import { nodes, edges, infra } from '@/data/stack'
import { NodeCard } from './NodeCard'
import { firePacket } from './Packet'
import { gsap, useGSAP, ScrollTrigger, NO_PREF, REDUCED } from '@/lib/gsap'
import { SectionHeader } from '@/components/chrome/SectionRule'
import { useReducedMotion } from '@/lib/reducedMotion'
import { cn } from '@/lib/cn'

const VB_W = 1200
const VB_H = 560

export function SystemDiagram() {
  const root = useRef<HTMLElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const packetLayer = useRef<SVGGElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const [paused, setPaused] = useState(true)
  const reduced = useReducedMotion()

  const activeNode = nodes.find((n) => n.id === active)

  // Reveal: nodes scale in on a diagonal stagger, edges draw in.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(NO_PREF, () => {
        const nodeEls = gsap.utils.toArray<SVGGElement>('.node', svgRef.current)
        const edgeEls = gsap.utils.toArray<SVGPathElement>('.edge', svgRef.current)
        edgeEls.forEach((p) => {
          const len = p.getTotalLength()
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 })
        })
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top 70%', once: true },
        })
        tl.fromTo(
          nodeEls,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: { each: 0.06, grid: 'auto', from: 'start' } },
        ).to(
          edgeEls,
          {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: 'power2.inOut',
            stagger: 0.04,
            onComplete: () => {
              edgeEls.forEach((p) => {
                gsap.set(p, { strokeDasharray: '6 6', strokeDashoffset: 0 })
                p.classList.add('edge-dash')
              })
            },
          },
          0.3,
        )
        return () => tl.kill()
      })
      mm.add(REDUCED, () => {
        gsap.set('.node', { scale: 1, opacity: 1 })
        gsap.set('.edge', { opacity: 1, strokeDasharray: '6 6' })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  // Packets: only while on screen, never under reduced motion.
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => setPaused(!self.isActive),
    })
    return () => st.kill()
  }, [])

  useEffect(() => {
    if (paused || reduced || !packetLayer.current || !svgRef.current) return
    const layer = packetLayer.current
    const svg = svgRef.current
    const tweens = new Set<gsap.core.Timeline>()
    const fire = () => {
      const edge = edges[Math.floor(Math.random() * edges.length)]
      const path = svg.querySelector<SVGPathElement>(`[data-edge="${edge.id}"]`)
      if (!path) return
      const t = firePacket(layer, path)
      tweens.add(t)
      t.eventCallback('onComplete', () => tweens.delete(t))
      if (edge.dupable && Math.random() < 0.25) {
        const t2 = gsap.delayedCall(0.35, () => {
          const d = firePacket(layer, path, { dup: true })
          tweens.add(d)
          d.eventCallback('onComplete', () => tweens.delete(d))
        })
        tweens.add(t2 as unknown as gsap.core.Timeline)
      }
    }
    fire()
    const id = window.setInterval(fire, 2400)
    return () => {
      clearInterval(id)
      tweens.forEach((t) => t.kill())
      layer.replaceChildren()
    }
  }, [paused, reduced])

  return (
    <section id="system" ref={root} className="section" aria-labelledby="system-title">
      <div className="container">
        <SectionHeader
          index="01"
          label="System"
          id="system-title"
          title="How I build things."
          sub="A typical app I ship, and what I've actually done in each box. Hover a node."
        />

        {/* Desktop / tablet: SVG diagram */}
        <div className="relative hidden md:block">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="h-auto w-full overflow-visible"
            role="group"
            aria-label="Architecture diagram: browser, API gateway, services, databases, NATS JetStream"
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-3)" />
              </marker>
            </defs>

            <g className={cn(paused && 'paused')}>
              {edges.map((e) => (
                <g key={e.id}>
                  <path
                    d={e.d}
                    data-edge={e.id}
                    className={cn('edge', paused && 'paused')}
                    fill="none"
                    stroke="var(--text-3)"
                    strokeWidth={1.25}
                    markerEnd="url(#arrow)"
                    opacity={0}
                  />
                  {e.label && <EdgeLabel d={e.d} label={e.label} below={e.labelBelow} />}
                </g>
              ))}
            </g>

            {nodes.map((n) => (
              <NodeCard key={n.id} node={n} active={active === n.id} onActivate={setActive} />
            ))}

            <g ref={packetLayer} aria-hidden="true" />
          </svg>

          {/* Popover, positioned in SVG-percentage space so it tracks the node. */}
          {activeNode && (
            <div
              role="tooltip"
              className="card pointer-events-none absolute z-10 w-[280px] p-4 shadow-[0_20px_50px_rgba(0,0,0,.5)]"
              style={{
                left: `${((activeNode.x + activeNode.w / 2) / VB_W) * 100}%`,
                top: `${((activeNode.y + activeNode.h) / VB_H) * 100}%`,
                transform: `translate(${activeNode.x + activeNode.w / 2 > VB_W * 0.7 ? '-90%' : '-50%'}, 10px)`,
                borderColor: 'var(--accent-2)',
              }}
            >
              <div className="eyebrow mb-2 text-[10px] text-accent-2">{activeNode.title}</div>
              <p className="text-[14px] leading-snug text-text-2">{activeNode.didWith}</p>
            </div>
          )}
        </div>

        {/* Mobile: vertical stack */}
        <ol className="flex flex-col gap-3 md:hidden" aria-label="Architecture, as a list">
          {nodes.map((n, i) => (
            <li key={n.id} className="relative">
              {i > 0 && <span className="absolute -top-3 left-6 h-3 w-px bg-line" aria-hidden="true" />}
              <details className="card group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="font-mono text-[13px] text-text">{n.title}</span>
                  <span className="flex flex-wrap justify-end gap-1">
                    {n.tech.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </span>
                </summary>
                <p className="mt-3 text-[14px] leading-snug text-text-2">{n.didWith}</p>
              </details>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-2" data-reveal>
          <span className="label mr-2">runs on</span>
          {infra.map((i) => (
            <span key={i} className="chip">
              {i}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function EdgeLabel({ d, label, below }: { d: string; label: string; below?: boolean }) {
  // Midpoint of a straight-ish path from its M and last L/C coordinates.
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
  if (nums.length < 4) return null
  const x1 = nums[0], y1 = nums[1]
  const x2 = nums[nums.length - 2], y2 = nums[nums.length - 1]
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <text x={mx} y={below ? my + 16 : my - 7} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-3)" letterSpacing="1">
      {label}
    </text>
  )
}
