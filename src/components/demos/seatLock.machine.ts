/**
 * Seat locking, the way MovieBook's backend does it with ioredis:
 *   SET lock:<show>:<seat> <session> NX PX <ttl>
 * One shared store stands in for Redis. Two "clients" (tabs) talk to it.
 * No React in here; the component subscribes via useSyncExternalStore.
 */

export type ClientId = 'tabA' | 'tabB'

export type Seat =
  | { status: 'available' }
  | { status: 'locked'; by: ClientId; expiresAt: number }
  | { status: 'sold'; by: ClientId }

export type LogLevel = 'ok' | 'warn' | 'bad' | 'dim'
export type LogEntry = { id: number; t: number; text: string; level: LogLevel }

export type LockResult =
  | { ok: true; expiresAt: number }
  | { ok: false; status: 409; owner: ClientId; msLeft: number; message: string }
  | { ok: false; status: 410; message: string }

export type SeatLockState = {
  seats: Record<string, Seat>
  log: LogEntry[]
  ttlMs: number
}

export type SeatLockOptions = {
  rows?: number
  cols?: number
  ttlMs?: number
  showId?: string
  now?: () => number
  maxLog?: number
}

export const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
export const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export function seatId(row: number, col: number) {
  return `${ROW_LABELS[row]}${COL_LABELS[col]}`
}

export function createSeatLockStore(opts: SeatLockOptions = {}) {
  const rows = opts.rows ?? 6
  const cols = opts.cols ?? 8
  const ttlMs = opts.ttlMs ?? 12_000
  const showId = opts.showId ?? 'show1'
  const now = opts.now ?? (() => Date.now())
  const maxLog = opts.maxLog ?? 60

  const listeners = new Set<() => void>()
  let logId = 0
  let state: SeatLockState = { seats: freshSeats(), log: [], ttlMs }

  function freshSeats(): Record<string, Seat> {
    const seats: Record<string, Seat> = {}
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) seats[seatId(r, c)] = { status: 'available' }
    return seats
  }

  const key = (id: string) => `lock:${showId}:${id}`

  function emit() {
    for (const l of listeners) l()
  }

  function push(text: string, level: LogLevel = 'dim') {
    const entry: LogEntry = { id: ++logId, t: now(), text, level }
    const log = [...state.log, entry]
    state = { ...state, log: log.length > maxLog ? log.slice(log.length - maxLog) : log }
  }

  function setSeat(id: string, seat: Seat) {
    state = { ...state, seats: { ...state.seats, [id]: seat } }
  }

  /** Expire any lock whose TTL has elapsed. Redis does this itself; we do it on tick. */
  function sweep(): string[] {
    const t = now()
    const expired: string[] = []
    for (const [id, seat] of Object.entries(state.seats)) {
      if (seat.status === 'locked' && seat.expiresAt <= t) {
        expired.push(id)
        setSeat(id, { status: 'available' })
        push(`# TTL expired · ${key(id)} removed`, 'dim')
      }
    }
    return expired
  }

  const api = {
    getState: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    rows,
    cols,
    ttlMs,

    /** Runs the sweep. Call this on an interval from the UI. Returns expired seat ids. */
    tick(): string[] {
      const expired = sweep()
      if (expired.length) emit()
      return expired
    },

    lock(id: string, client: ClientId): LockResult {
      sweep()
      const seat = state.seats[id]
      if (!seat) throw new Error(`unknown seat ${id}`)
      const t = now()

      if (seat.status === 'sold') {
        push(`GET ${key(id)} → nil   # seat already sold`, 'bad')
        emit()
        return { ok: false, status: 410, message: `410 · seat ${id} is sold` }
      }

      if (seat.status === 'locked') {
        // Redis: SET ... NX returns nil when the key exists.
        const msLeft = Math.max(0, seat.expiresAt - t)
        push(`SET ${key(id)} ${client} NX PX ${ttlMs} → nil`, 'warn')
        push(`GET ${key(id)} → ${seat.by}`, 'dim')
        push(`PTTL ${key(id)} → ${msLeft}`, 'dim')
        emit()
        const s = Math.ceil(msLeft / 1000)
        return {
          ok: false,
          status: 409,
          owner: seat.by,
          msLeft,
          message: `409 · seat ${id} is locked by another session (${s}s left)`,
        }
      }

      const expiresAt = t + ttlMs
      setSeat(id, { status: 'locked', by: client, expiresAt })
      push(`SET ${key(id)} ${client} NX PX ${ttlMs} → OK`, 'ok')
      emit()
      return { ok: true, expiresAt }
    },

    /** Convert own lock to a permanent booking. Deletes the lock key, as the real API does. */
    pay(id: string, client: ClientId): boolean {
      sweep()
      const seat = state.seats[id]
      if (!seat || seat.status !== 'locked' || seat.by !== client) {
        push(`GET ${key(id)} → ${seat?.status === 'locked' ? seat.by : 'nil'}   # not your lock`, 'bad')
        emit()
        return false
      }
      push(`GET ${key(id)} → ${client}`, 'dim')
      setSeat(id, { status: 'sold', by: client })
      push(`# booking created · ${showId}/${id}`, 'ok')
      push(`DEL ${key(id)} → 1`, 'dim')
      emit()
      return true
    },

    /** Voluntarily release own lock (user deselects). */
    release(id: string, client: ClientId): boolean {
      sweep()
      const seat = state.seats[id]
      if (!seat || seat.status !== 'locked' || seat.by !== client) {
        emit()
        return false
      }
      setSeat(id, { status: 'available' })
      push(`DEL ${key(id)} → 1`, 'dim')
      emit()
      return true
    },

    reset() {
      state = { seats: freshSeats(), log: [], ttlMs }
      push(`FLUSHDB → OK`, 'dim')
      emit()
    },

    /** Locks held by a client (for the Pay button). */
    heldBy(client: ClientId): string[] {
      return Object.entries(state.seats)
        .filter(([, s]) => s.status === 'locked' && s.by === client)
        .map(([id]) => id)
    },
  }

  return api
}

export type SeatLockStore = ReturnType<typeof createSeatLockStore>
