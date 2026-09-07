import { describe, it, expect, beforeEach } from 'vitest'
import { createSeatLockStore, type SeatLockStore } from '@/components/demos/seatLock.machine'

let t = 1_000_000
const now = () => t
let store: SeatLockStore

beforeEach(() => {
  t = 1_000_000
  store = createSeatLockStore({ now, ttlMs: 12_000 })
})

describe('seat lock store', () => {
  it('starts with a 6×8 grid of available seats', () => {
    const seats = Object.values(store.getState().seats)
    expect(seats).toHaveLength(48)
    expect(seats.every((s) => s.status === 'available')).toBe(true)
  })

  it('lock is exclusive: second client gets 409 with seconds left', () => {
    const a = store.lock('3C', 'tabA')
    expect(a.ok).toBe(true)
    t += 3_000
    const b = store.lock('3C', 'tabB')
    expect(b.ok).toBe(false)
    if (!b.ok && b.status === 409) {
      expect(b.owner).toBe('tabA')
      expect(b.msLeft).toBe(9_000)
      expect(b.message).toBe('409 · seat 3C is locked by another session (9s left)')
    } else {
      throw new Error('expected 409')
    }
    expect(store.getState().seats['3C']).toMatchObject({ status: 'locked', by: 'tabA' })
  })

  it('logs the Redis commands it would run', () => {
    store.lock('3C', 'tabA')
    store.lock('3C', 'tabB')
    const text = store.getState().log.map((l) => l.text)
    expect(text[0]).toBe('SET lock:show1:3C tabA NX PX 12000 → OK')
    expect(text[1]).toBe('SET lock:show1:3C tabB NX PX 12000 → nil')
    expect(text[2]).toBe('GET lock:show1:3C → tabA')
  })

  it('lock expires after the TTL and the seat is available to everyone', () => {
    store.lock('1A', 'tabA')
    t += 11_999
    expect(store.tick()).toEqual([])
    expect(store.getState().seats['1A'].status).toBe('locked')
    t += 1
    expect(store.tick()).toEqual(['1A'])
    expect(store.getState().seats['1A'].status).toBe('available')
    const b = store.lock('1A', 'tabB')
    expect(b.ok).toBe(true)
  })

  it('pay converts an own lock to sold and deletes the lock key', () => {
    store.lock('2B', 'tabA')
    expect(store.pay('2B', 'tabA')).toBe(true)
    expect(store.getState().seats['2B']).toEqual({ status: 'sold', by: 'tabA' })
    const text = store.getState().log.map((l) => l.text)
    expect(text).toContain('DEL lock:show1:2B → 1')
    // sold seats never expire
    t += 100_000
    store.tick()
    expect(store.getState().seats['2B'].status).toBe('sold')
    const again = store.lock('2B', 'tabB')
    expect(again.ok).toBe(false)
    if (!again.ok) expect(again.status).toBe(410)
  })

  it('pay fails for a seat locked by someone else', () => {
    store.lock('2B', 'tabA')
    expect(store.pay('2B', 'tabB')).toBe(false)
    expect(store.getState().seats['2B'].status).toBe('locked')
  })

  it('release gives the seat back', () => {
    store.lock('4D', 'tabA')
    expect(store.release('4D', 'tabB')).toBe(false)
    expect(store.release('4D', 'tabA')).toBe(true)
    expect(store.getState().seats['4D'].status).toBe('available')
  })

  it('reset clears seats and log', () => {
    store.lock('1A', 'tabA')
    store.pay('1A', 'tabA')
    store.lock('1B', 'tabB')
    store.reset()
    const seats = Object.values(store.getState().seats)
    expect(seats.every((s) => s.status === 'available')).toBe(true)
    expect(store.getState().log.map((l) => l.text)).toEqual(['FLUSHDB → OK'])
  })

  it('notifies subscribers on change', () => {
    let calls = 0
    const unsub = store.subscribe(() => calls++)
    store.lock('1A', 'tabA')
    store.pay('1A', 'tabA')
    unsub()
    store.reset()
    expect(calls).toBe(2)
  })
})
