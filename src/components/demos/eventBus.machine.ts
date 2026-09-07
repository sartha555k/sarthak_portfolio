/**
 * eventbus-services, in miniature:
 *   User Service → [USER_EVENTS stream] → Notification Service → (DLQ)
 *
 * The machine advances in discrete steps so the UI can animate each hop
 * with a delay while tests call drain() and check the end state.
 * Idempotency key: `${subject}:${userId}:${seq}`.
 */

export type Stage = 'publishing' | 'queued' | 'consuming' | 'retry-wait'

export type Message = {
  seq: number
  subject: 'user.registered'
  userId: string
  key: string
  redelivery: boolean
  attempts: number
}

export type LogLevel = 'ok' | 'warn' | 'bad' | 'dim'
export type LogEntry = { id: number; text: string; level: LogLevel }

export type Outcome = 'ACK' | 'DUP' | 'NAK' | 'DLQ' | null

export type EventBusState = {
  seq: number
  userCounter: number
  inflight: { msg: Message; stage: Stage } | null
  /** Messages persisted in the stream and not yet acked/terminated. */
  queue: Message[]
  seen: string[]
  dlq: Message[]
  notificationsSent: number
  failNext: boolean
  lastPublished: Message | null
  /** Badge to show on the consumer for the most recent outcome. */
  lastOutcome: Outcome
  log: LogEntry[]
}

export const MAX_RETRIES = 3
export const BACKOFF_MS = [250, 500, 1000]

/** Delay (ms) the UI should wait before calling advance() from a given stage. */
export function delayFor(state: EventBusState): number {
  const f = state.inflight
  if (!f) return 0
  switch (f.stage) {
    case 'publishing':
      return 450
    case 'queued':
      return 350
    case 'consuming':
      return 400
    case 'retry-wait':
      return BACKOFF_MS[Math.min(f.msg.attempts - 1, BACKOFF_MS.length - 1)]
  }
}

export function createEventBusStore(opts: { maxLog?: number } = {}) {
  const maxLog = opts.maxLog ?? 60
  const listeners = new Set<() => void>()
  let logId = 0

  const initial = (): EventBusState => ({
    seq: 41,
    userCounter: 8,
    inflight: null,
    queue: [],
    seen: [],
    dlq: [],
    notificationsSent: 0,
    failNext: false,
    lastPublished: null,
    lastOutcome: null,
    log: [],
  })

  let state = initial()

  function emit() {
    for (const l of listeners) l()
  }
  function push(text: string, level: LogLevel = 'dim') {
    const log = [...state.log, { id: ++logId, text, level }]
    state = { ...state, log: log.length > maxLog ? log.slice(log.length - maxLog) : log }
  }
  function set(patch: Partial<EventBusState>) {
    state = { ...state, ...patch }
  }

  const api = {
    getState: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    isBusy: () => state.inflight !== null,

    /** User Service publishes user.registered with a fresh seq. */
    publish(): Message | null {
      if (state.inflight) return null
      const seq = state.seq + 1
      const userId = `u_${state.userCounter + 1}`
      const msg: Message = {
        seq,
        subject: 'user.registered',
        userId,
        key: `user.registered:${userId}:${seq}`,
        redelivery: false,
        attempts: 0,
      }
      set({ seq, userCounter: state.userCounter + 1, inflight: { msg, stage: 'publishing' }, lastPublished: msg, lastOutcome: null })
      push(`PUB ${msg.subject} seq=${seq} user=${userId}`, 'ok')
      emit()
      return msg
    },

    /** JetStream redelivers the last message: same seq, same key, attempts reset. */
    redeliverLast(): Message | null {
      if (state.inflight || !state.lastPublished) return null
      const msg: Message = { ...state.lastPublished, redelivery: true, attempts: 0 }
      set({ inflight: { msg, stage: 'publishing' }, lastOutcome: null })
      push(`REDELIVER seq=${msg.seq} (consumer died before ack)`, 'warn')
      emit()
      return msg
    },

    /** Arm the consumer to throw on the next message. */
    failNext() {
      set({ failNext: !state.failNext })
      push(state.failNext ? `# consumer armed to throw on next message` : `# consumer disarmed`, 'dim')
      emit()
    },

    /** Move the in-flight message one hop. Returns false when idle. */
    advance(): boolean {
      const f = state.inflight
      if (!f) return false
      const { msg } = f

      switch (f.stage) {
        case 'publishing': {
          // Persisted in the stream.
          const queue = state.queue.some((m) => m.seq === msg.seq) ? state.queue : [...state.queue, msg]
          set({ queue, inflight: { msg, stage: 'queued' } })
          push(`# stream USER_EVENTS persisted seq=${msg.seq}`, 'dim')
          break
        }
        case 'queued': {
          set({ inflight: { msg, stage: 'consuming' } })
          push(`DELIVER seq=${msg.seq} → notification-service${msg.attempts ? ` attempt=${msg.attempts + 1}` : ''}`, 'dim')
          break
        }
        case 'retry-wait': {
          set({ inflight: { msg, stage: 'consuming' } })
          push(`DELIVER seq=${msg.seq} → notification-service attempt=${msg.attempts + 1}`, 'dim')
          break
        }
        case 'consuming': {
          // 1. idempotency check comes before any side effect
          if (state.seen.includes(msg.key)) {
            set({ queue: state.queue.filter((m) => m.seq !== msg.seq), inflight: null, lastOutcome: 'DUP' })
            push(`SKIP dup key=${msg.key}`, 'warn')
            push(`ACK seq=${msg.seq}   # acked without side effect`, 'dim')
            break
          }
          // 2. simulated failure
          if (state.failNext) {
            const attempts = msg.attempts + 1
            const next: Message = { ...msg, attempts }
            if (attempts <= MAX_RETRIES) {
              set({ inflight: { msg: next, stage: 'retry-wait' }, lastOutcome: 'NAK' })
              push(`NAK seq=${msg.seq} retry=${attempts} backoff=${BACKOFF_MS[attempts - 1]}ms`, 'bad')
            } else {
              set({
                queue: state.queue.filter((m) => m.seq !== msg.seq),
                dlq: [...state.dlq, next],
                inflight: null,
                failNext: false,
                lastOutcome: 'DLQ',
              })
              push(`DLQ seq=${msg.seq} after ${MAX_RETRIES} retries`, 'bad')
            }
            break
          }
          // 3. side effect + record key, then ack
          set({
            seen: [...state.seen, msg.key],
            notificationsSent: state.notificationsSent + 1,
            queue: state.queue.filter((m) => m.seq !== msg.seq),
            inflight: null,
            lastOutcome: 'ACK',
          })
          push(`# sendWelcomeEmail(${msg.userId}) · processed_message(${msg.key}) in one tx`, 'dim')
          push(`ACK seq=${msg.seq}`, 'ok')
          break
        }
      }
      emit()
      return state.inflight !== null
    },

    /** Advance until idle. For tests and reduced-motion mode. */
    drain(): number {
      let steps = 0
      while (api.advance()) steps++
      return steps
    },

    reset() {
      state = initial()
      push(`# reset · stream purged, seen cleared`, 'dim')
      emit()
    },
  }

  return api
}

export type EventBusStore = ReturnType<typeof createEventBusStore>
