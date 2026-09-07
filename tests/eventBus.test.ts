import { describe, it, expect, beforeEach } from 'vitest'
import { createEventBusStore, delayFor, MAX_RETRIES, type EventBusStore } from '@/components/demos/eventBus.machine'

let store: EventBusStore
const logText = () => store.getState().log.map((l) => l.text)

beforeEach(() => {
  store = createEventBusStore()
})

describe('event bus store', () => {
  it('publish moves through stream and consumer, then acks and increments sent', () => {
    const msg = store.publish()
    expect(msg?.seq).toBe(42)
    expect(msg?.key).toBe('user.registered:u_9:42')
    expect(store.getState().inflight?.stage).toBe('publishing')

    store.advance()
    expect(store.getState().inflight?.stage).toBe('queued')
    expect(store.getState().queue).toHaveLength(1)

    store.advance()
    expect(store.getState().inflight?.stage).toBe('consuming')

    store.advance()
    const s = store.getState()
    expect(s.inflight).toBeNull()
    expect(s.queue).toHaveLength(0)
    expect(s.notificationsSent).toBe(1)
    expect(s.seen).toEqual(['user.registered:u_9:42'])
    expect(s.lastOutcome).toBe('ACK')
    expect(logText()).toContain('PUB user.registered seq=42 user=u_9')
    expect(logText()).toContain('ACK seq=42')
  })

  it('refuses to publish while a message is in flight', () => {
    store.publish()
    expect(store.publish()).toBeNull()
    store.drain()
    expect(store.publish()?.seq).toBe(43)
  })

  it('redelivery with the same key is skipped and sent does not change', () => {
    store.publish()
    store.drain()
    expect(store.getState().notificationsSent).toBe(1)

    const re = store.redeliverLast()
    expect(re?.seq).toBe(42)
    expect(re?.redelivery).toBe(true)
    store.drain()

    const s = store.getState()
    expect(s.notificationsSent).toBe(1)
    expect(s.seen).toHaveLength(1)
    expect(s.lastOutcome).toBe('DUP')
    expect(s.queue).toHaveLength(0)
    expect(logText()).toContain('SKIP dup key=user.registered:u_9:42')
  })

  it('redeliver does nothing before anything was published', () => {
    expect(store.redeliverLast()).toBeNull()
  })

  it('fail next retries 3× with back-off then moves to DLQ', () => {
    store.failNext()
    expect(store.getState().failNext).toBe(true)
    store.publish()
    store.drain()

    const s = store.getState()
    expect(s.dlq).toHaveLength(1)
    expect(s.dlq[0].seq).toBe(42)
    expect(s.dlq[0].attempts).toBe(MAX_RETRIES + 1)
    expect(s.notificationsSent).toBe(0)
    expect(s.seen).toHaveLength(0)
    expect(s.queue).toHaveLength(0)
    expect(s.failNext).toBe(false)
    expect(s.lastOutcome).toBe('DLQ')

    const naks = logText().filter((l) => l.startsWith('NAK seq=42'))
    expect(naks).toEqual([
      'NAK seq=42 retry=1 backoff=250ms',
      'NAK seq=42 retry=2 backoff=500ms',
      'NAK seq=42 retry=3 backoff=1000ms',
    ])
    expect(logText()).toContain('DLQ seq=42 after 3 retries')
  })

  it('exposes back-off delays for the UI', () => {
    store.failNext()
    store.publish()
    store.advance() // queued
    store.advance() // consuming
    store.advance() // NAK retry=1 → retry-wait
    expect(store.getState().inflight?.stage).toBe('retry-wait')
    expect(delayFor(store.getState())).toBe(250)
    store.advance() // consuming
    store.advance() // NAK retry=2
    expect(delayFor(store.getState())).toBe(500)
    store.advance()
    store.advance() // NAK retry=3
    expect(delayFor(store.getState())).toBe(1000)
  })

  it('after a DLQ the next publish succeeds normally', () => {
    store.failNext()
    store.publish()
    store.drain()
    store.publish()
    store.drain()
    expect(store.getState().notificationsSent).toBe(1)
    expect(store.getState().dlq).toHaveLength(1)
  })

  it('reset clears everything', () => {
    store.publish()
    store.drain()
    store.failNext()
    store.publish()
    store.drain()
    store.reset()
    const s = store.getState()
    expect(s.seq).toBe(41)
    expect(s.queue).toEqual([])
    expect(s.seen).toEqual([])
    expect(s.dlq).toEqual([])
    expect(s.notificationsSent).toBe(0)
    expect(s.inflight).toBeNull()
    expect(s.lastPublished).toBeNull()
    expect(logText()).toEqual(['# reset · stream purged, seen cleared'])
  })
})
