import { useEffect, useRef, useState } from 'react'
import { BOOT_KEY } from './shouldBoot'

const LINES = [
  { text: '$ whoami', cmd: true },
  { text: 'sarthak', cmd: false },
  { text: '$ sarthak --stack', cmd: true },
  { text: 'react · next · node · typescript · redis · nats · postgres', cmd: false },
  { text: '$ open portfolio', cmd: true },
]

const CHAR_MS = 18
type Props = { onDone: () => void; onExited: () => void }

/** 1.2 s terminal boot. Types command lines char by char, prints output instantly. */
export function Boot({ onDone, onExited }: Props) {
  const [typed, setTyped] = useState<string[]>(['$ whoami'])
  const [fading, setFading] = useState(false)
  const done = useRef(false)

  useEffect(() => {
    try {
      sessionStorage.setItem(BOOT_KEY, '1')
    } catch {
      /* ignore */
    }
    let cancelled = false
    const timers: number[] = []

    const finish = () => {
      if (done.current) return
      done.current = true
      setFading(true)
      onDone()
      timers.push(window.setTimeout(onExited, 280))
    }

    // Total budget ≤ 1.3 s: we type only the commands, outputs appear whole.
    let t = 0
    const out: string[] = LINES.map((l, i) => (i === 0 ? l.text : ''))
    LINES.forEach((line, li) => {
      if (li === 0) return
      if (line.cmd) {
        for (let ci = 1; ci <= line.text.length; ci++) {
          t += CHAR_MS
          timers.push(
            window.setTimeout(() => {
              if (cancelled) return
              out[li] = line.text.slice(0, ci)
              setTyped([...out])
            }, t),
          )
        }
        t += 40
      } else {
        t += 60
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return
            out[li] = line.text
            setTyped([...out])
          }, t),
        )
      }
    })
    timers.push(window.setTimeout(finish, Math.min(t + 180, 1250)))

    const skip = () => finish()
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [onDone, onExited])

  return (
    <div
      className="boot-overlay fixed inset-0 z-[90] flex items-center justify-center bg-bg transition-opacity duration-250"
      style={{ opacity: fading ? 0 : 1 }}
      aria-label="Loading"
      role="status"
    >
      <pre className="font-mono w-[min(560px,90vw)] text-[13px] leading-[1.9] text-text-2 md:text-[14px]">
        {LINES.map((line, i) => {
          const val = typed[i] ?? ''
          if (!val) return null
          const isLast = typed.filter(Boolean).length - 1 === i
          return (
            <div key={i} className={line.cmd ? 'text-text' : 'text-text-2'}>
              {val}
              {isLast && line.cmd && !fading && <span className="caret ml-0.5" aria-hidden="true" />}
            </div>
          )
        })}
      </pre>
      <span className="label absolute bottom-6 text-[11px]">click to skip</span>
    </div>
  )
}
