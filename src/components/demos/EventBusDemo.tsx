import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { AlertTriangle, RotateCcw, Send, Repeat } from 'lucide-react'
import { createEventBusStore, delayFor, type Outcome } from './eventBus.machine'
import { useReducedMotion } from '@/lib/reducedMotion'
import { cn } from '@/lib/cn'

type Props = { compact?: boolean }

const CAPTION = 'Everything here runs in your browser; the real one uses NATS JetStream with durable consumers — see source.'

export function EventBusDemo({ compact = false }: Props) {
  const store = useMemo(() => createEventBusStore(), [])
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  const reduced = useReducedMotion()
  const logRef = useRef<HTMLDivElement>(null)

  // Drive the machine: one hop per delay. Reduced motion: drain instantly.
  useEffect(() => {
    if (!state.inflight) return
    if (reduced) {
      store.drain()
      return
    }
    const id = window.setTimeout(() => store.advance(), delayFor(state))
    return () => clearTimeout(id)
  }, [state, store, reduced])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [state.log.length])

  const stage = state.inflight?.stage ?? null
  const busy = state.inflight !== null
  const inflightMsg = state.inflight?.msg

  const packetCol =
    stage === 'publishing' ? 0 : stage === 'queued' ? 1 : stage === 'consuming' || stage === 'retry-wait' ? 2 : -1

  return (
    <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-4')} aria-label="Event bus demo">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-accent" onClick={() => store.publish()} disabled={busy}>
          <Send size={11} aria-hidden="true" /> register user
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => store.redeliverLast()}
          disabled={busy || !state.lastPublished}
        >
          <Repeat size={11} aria-hidden="true" /> redeliver last
        </button>
        <button
          type="button"
          className={cn('btn btn-sm', state.failNext && '!border-bad !text-bad')}
          onClick={() => store.failNext()}
          disabled={busy}
          aria-pressed={state.failNext}
        >
          <AlertTriangle size={11} aria-hidden="true" /> fail next
        </button>
        <button type="button" className="btn btn-sm ml-auto" onClick={() => store.reset()}>
          <RotateCcw size={11} aria-hidden="true" /> reset
        </button>
      </div>

      <div
        className={cn(
          'grid items-stretch gap-2',
          compact
            ? 'grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,0.7fr)]'
            : 'grid-cols-[repeat(2,minmax(0,1fr))] md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)]',
        )}
        role="img"
        aria-label={`User service, USER_EVENTS stream with ${state.queue.length} queued, notification service with ${state.notificationsSent} sent, DLQ with ${state.dlq.length}`}
      >
        <Col title="User Service" sub="publisher" compact={compact} active={packetCol === 0}>
          <div className="font-mono text-[11px] text-text-2">
            seq → <span className="text-text">{state.seq}</span>
          </div>
          {packetCol === 0 && <Packet label={`seq=${inflightMsg?.seq}`} redelivery={inflightMsg?.redelivery} />}
        </Col>

        <Col title="USER_EVENTS" sub="JetStream · durable" compact={compact} active={packetCol === 1} kind="bus">
          <ul className="flex flex-col gap-1" aria-label="Queue">
            {state.queue.length === 0 && <li className="label text-[10px]">empty</li>}
            {state.queue.map((m) => (
              <li
                key={m.seq}
                className={cn(
                  'font-mono flex items-center justify-between rounded border border-line bg-bg px-2 py-1 text-[10px]',
                  inflightMsg?.seq === m.seq && 'border-accent text-text',
                )}
              >
                <span>seq={m.seq}</span>
                <span className="text-text-3">{m.attempts > 0 ? `att ${m.attempts + 1}` : m.redelivery ? 're' : ''}</span>
              </li>
            ))}
          </ul>
        </Col>

        <Col title="Notification Svc" sub="consumer" compact={compact} active={packetCol === 2}>
          <div className="font-mono flex items-center justify-between text-[11px] text-text-2">
            <span>
              sent <span className="text-ok">{state.notificationsSent}</span>
            </span>
            <Badge outcome={stage === 'retry-wait' ? 'NAK' : state.inflight ? null : state.lastOutcome} />
          </div>
          {stage === 'retry-wait' && inflightMsg && (
            <div className="font-mono mt-1 text-[10px] text-bad">
              retry {inflightMsg.attempts}/3 · backoff {delayFor(state)}ms
            </div>
          )}
          {!compact && (
            <div className="mt-2">
              <div className="label text-[10px]">seen</div>
              <ul
                className="font-mono mt-1 flex max-h-16 flex-col gap-0.5 overflow-auto text-[10px] text-text-3"
                aria-label="Seen idempotency keys"
                data-lenis-prevent
              >
                {state.seen.length === 0 && <li>∅</li>}
                {state.seen.map((k) => (
                  <li key={k} className="truncate">
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Col>

        <Col title="DLQ" sub="dead letters" compact={compact} active={false} kind="dlq">
          <ul className="flex flex-col gap-1">
            {state.dlq.length === 0 && <li className="label text-[10px]">empty</li>}
            {state.dlq.map((m) => (
              <li key={m.seq} className="font-mono rounded border border-bad/50 bg-bad/10 px-2 py-1 text-[10px] text-bad">
                seq={m.seq}
              </li>
            ))}
          </ul>
        </Col>
      </div>

      {!compact && (
        <>
          <div ref={logRef} className="log" role="log" aria-label="Event log" data-lenis-prevent>
            {state.log.length === 0 && (
              <div className="dim"># press “register user”, then “redeliver last” to see the idempotency check</div>
            )}
            {state.log.map((l) => (
              <div key={l.id} className={l.level}>
                {l.text}
              </div>
            ))}
          </div>
          <p className="label">{CAPTION}</p>
        </>
      )}
    </div>
  )
}

function Col({
  title,
  sub,
  children,
  compact,
  active,
  kind,
}: {
  title: string
  sub: string
  children: React.ReactNode
  compact: boolean
  active: boolean
  kind?: 'bus' | 'dlq'
}) {
  return (
    <div
      className={cn(
        'card relative flex min-h-[96px] flex-col transition-colors duration-200',
        compact ? 'p-2' : 'p-3',
        active && 'border-accent-2',
        kind === 'bus' && 'border-l-2 border-l-accent',
        kind === 'dlq' && 'border-l-2 border-l-bad/60',
      )}
    >
      <div className="font-mono mb-2 text-[11px] leading-tight text-text">
        {title}
        {!compact && <div className="text-[10px] text-text-3">{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function Packet({ label, redelivery }: { label: string; redelivery?: boolean }) {
  return (
    <div className="font-mono mt-2 inline-flex items-center gap-1.5 text-[10px] text-text">
      <span className={cn('h-2 w-2 rounded-full', redelivery ? 'bg-warn' : 'bg-accent')} />
      {label}
    </div>
  )
}

function Badge({ outcome }: { outcome: Outcome }) {
  if (!outcome) return <span className="chip opacity-0">—</span>
  const cls = outcome === 'ACK' ? 'border-ok text-ok' : outcome === 'DUP' ? 'border-warn text-warn' : 'border-bad text-bad'
  return <span className={cn('chip', cls)}>{outcome}</span>
}
