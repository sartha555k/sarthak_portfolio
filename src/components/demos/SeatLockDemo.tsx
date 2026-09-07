import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Lock, RotateCcw } from 'lucide-react'
import { createSeatLockStore, seatId, type ClientId, type Seat } from './seatLock.machine'
import { useReducedMotion } from '@/lib/reducedMotion'
import { cn } from '@/lib/cn'

type Props = { compact?: boolean }

const CAPTION = 'Everything here runs in your browser; the real one uses ioredis (SET NX PX) — see source.'

export function SeatLockDemo({ compact = false }: Props) {
  const rows = compact ? 3 : 6
  const cols = 8
  const store = useMemo(() => createSeatLockStore({ rows, cols, ttlMs: 12_000 }), [rows, cols])
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  const [toast, setToast] = useState<{ client: ClientId; text: string } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const toastTimer = useRef<number>(0)
  const reduced = useReducedMotion()
  const logRef = useRef<HTMLDivElement>(null)

  // Sweep expired locks and drive the countdown rings.
  useEffect(() => {
    const id = window.setInterval(
      () => {
        store.tick()
        setNow(Date.now())
      },
      reduced ? 1000 : 200,
    )
    return () => clearInterval(id)
  }, [store, reduced])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [state.log.length])

  function showToast(client: ClientId, text: string) {
    setToast({ client, text })
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }

  function onSeat(id: string, client: ClientId) {
    const seat = state.seats[id]
    if (seat.status === 'locked' && seat.by === client) {
      store.release(id, client)
      return
    }
    const res = store.lock(id, client)
    if (!res.ok) showToast(client, res.message)
  }

  const held = { tabA: store.heldBy('tabA'), tabB: store.heldBy('tabB') }

  return (
    <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-4')} aria-label="Seat lock demo">
      <div className={cn('grid gap-3', compact ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]')}>
        {(['tabA', 'tabB'] as ClientId[]).map((client) => (
          <div key={client} className={cn('card relative', compact ? 'p-2' : 'p-4')}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[12px] text-text">
                {client === 'tabA' ? 'Tab A' : 'Tab B'}
                {!compact && <span className="text-text-3"> · session {client}</span>}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-accent"
                disabled={held[client].length === 0}
                onClick={() => held[client].forEach((id) => store.pay(id, client))}
              >
                Pay{held[client].length ? ` (${held[client].length})` : ''}
              </button>
            </div>

            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              role="grid"
              aria-label={`Seats as seen by ${client === 'tabA' ? 'Tab A' : 'Tab B'}`}
            >
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const id = seatId(r, c)
                  return (
                    <SeatButton
                      key={id}
                      id={id}
                      seat={state.seats[id]}
                      client={client}
                      now={now}
                      ttl={state.ttlMs}
                      compact={compact}
                      reduced={reduced}
                      onClick={() => onSeat(id, client)}
                    />
                  )
                }),
              )}
            </div>

            {!compact && (
              <div className="font-mono mt-2 flex items-center justify-between text-[10px] text-text-3" aria-hidden="true">
                <span className="flex items-center gap-1">
                  <i className="inline-block h-2 w-2 rounded-[2px] border border-line bg-bg-2" /> free
                </span>
                <span className="flex items-center gap-1">
                  <i className="inline-block h-2 w-2 rounded-[2px] bg-warn" /> locked 12s
                </span>
                <span className="flex items-center gap-1">
                  <i className="inline-block h-2 w-2 rounded-[2px] bg-bad" /> sold
                </span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-3 bottom-8 flex justify-center" aria-live="polite">
              {toast?.client === client && (
                <div className="toast font-mono rounded-md border border-bad/60 bg-bg px-3 py-1.5 text-[11px] text-bad shadow-lg">
                  {toast.text}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!compact ? (
        <>
          <div className="flex items-center justify-between">
            <span className="label">redis · what the backend runs</span>
            <button type="button" className="btn btn-sm" onClick={() => store.reset()}>
              <RotateCcw size={11} aria-hidden="true" /> Reset
            </button>
          </div>
          <div ref={logRef} className="log" role="log" aria-label="Redis command log" data-lenis-prevent>
            {state.log.length === 0 && <div className="dim"># click a seat in Tab A, then try the same seat in Tab B</div>}
            {state.log.map((l) => (
              <div key={l.id} className={l.level}>
                {l.text}
              </div>
            ))}
          </div>
          <p className="label">{CAPTION}</p>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <span className="label text-[10px]">lock in A, try in B · 12s TTL</span>
          <button type="button" className="btn btn-sm" onClick={() => store.reset()}>
            Reset
          </button>
        </div>
      )}
    </div>
  )
}

type SeatProps = {
  id: string
  seat: Seat
  client: ClientId
  now: number
  ttl: number
  compact: boolean
  reduced: boolean
  onClick: () => void
}

function SeatButton({ id, seat, client, now, ttl, compact, reduced, onClick }: SeatProps) {
  const mine = seat.status === 'locked' && seat.by === client
  const theirs = seat.status === 'locked' && seat.by !== client
  const sold = seat.status === 'sold'
  const remaining = seat.status === 'locked' ? Math.max(0, seat.expiresAt - now) : 0
  const frac = seat.status === 'locked' ? remaining / ttl : 0
  const secs = Math.ceil(remaining / 1000)

  const label = sold
    ? `Seat ${id}, sold`
    : theirs
      ? `Seat ${id}, locked by another session, ${secs} seconds left`
      : mine
        ? `Seat ${id}, locked by you, ${secs} seconds left. Click to release`
        : `Seat ${id}, available`

  return (
    <button
      type="button"
      role="gridcell"
      onClick={onClick}
      aria-label={label}
      aria-disabled={sold || theirs}
      className={cn(
        'relative flex aspect-square items-center justify-center rounded-[3px] border font-mono text-[9px] leading-none transition-colors duration-150',
        seat.status === 'available' && 'border-line bg-bg-2 text-text-3 hover:border-accent-2 hover:text-text',
        mine && 'border-warn bg-warn/90 text-bg',
        theirs && 'cursor-not-allowed border-warn/50 bg-warn/25 text-warn',
        sold && 'cursor-not-allowed border-bad bg-bad text-bg',
        compact && 'text-[8px]',
      )}
    >
      {theirs ? <Lock size={compact ? 8 : 10} aria-hidden="true" /> : id}
      {mine && !reduced && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="none" stroke="var(--bg)" strokeOpacity="0.35" strokeWidth="2" />
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="var(--bg)"
            strokeWidth="2"
            strokeDasharray={2 * Math.PI * 14}
            strokeDashoffset={2 * Math.PI * 14 * (1 - frac)}
            transform="rotate(-90 16 16)"
            style={{ transition: 'stroke-dashoffset .2s linear' }}
          />
        </svg>
      )}
      {mine && reduced && (
        <span className="absolute -right-1 -top-1 rounded bg-bg px-0.5 text-[8px] text-warn">{secs}</span>
      )}
    </button>
  )
}
