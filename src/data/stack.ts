export type NodeKind = 'client' | 'service' | 'store' | 'bus' | 'infra'

export type StackNode = {
  id: string
  title: string
  tech: string[]
  kind: NodeKind
  /** Position in the 1200×560 viewBox (desktop). */
  x: number
  y: number
  w: number
  h: number
  didWith: string
}

export type StackEdge = {
  id: string
  from: string
  to: string
  label?: string
  labelBelow?: boolean
  /** SVG path in viewBox coordinates. */
  d: string
  /** Packets on this edge may be duplicated and rejected (idempotency nod). */
  dupable?: boolean
}

export const nodes: StackNode[] = [
  {
    id: 'browser',
    title: 'Browser',
    tech: ['React', 'Next.js', 'Redux'],
    kind: 'client',
    x: 40, y: 200, w: 220, h: 84,
    didWith: 'Redux state shared across three interfaces at Alphawizz; SSR and route-level code splitting on the main Next.js app at DigiFlex.',
  },
  {
    id: 'gateway',
    title: 'API Gateway',
    tech: ['Express', 'Nest'],
    kind: 'service',
    x: 360, y: 200, w: 220, h: 84,
    didWith: 'Correlation ID minted here and carried through HTTP and NATS headers in eventbus-services. Zod on every boundary.',
  },
  {
    id: 'user-svc',
    title: 'User Service',
    tech: ['Node', 'TS', 'Prisma'],
    kind: 'service',
    x: 680, y: 60, w: 220, h: 84,
    didWith: 'Registers users, writes to Postgres via Prisma, publishes user.registered to JetStream. Never calls the notification service.',
  },
  {
    id: 'postgres',
    title: 'PostgreSQL',
    tech: ['Prisma'],
    kind: 'store',
    x: 980, y: 60, w: 180, h: 84,
    didWith: 'One database per service in eventbus-services. Currently reading about its internals.',
  },
  {
    id: 'booking-svc',
    title: 'Booking Service',
    tech: ['Express', 'Mongoose'],
    kind: 'service',
    x: 680, y: 200, w: 220, h: 84,
    didWith: 'MovieBook: showtime and seat-layout APIs, JWT auth, mock payment that converts a lock into a booking in one step.',
  },
  {
    id: 'mongo',
    title: 'MongoDB',
    tech: ['Mongoose'],
    kind: 'store',
    x: 980, y: 200, w: 180, h: 84,
    didWith: 'Bookings, shows and users in MovieBook; documents and sessions in ResumeX; survey rows in program-intel.',
  },
  {
    id: 'redis',
    title: 'Redis',
    tech: ['locks / TTL'],
    kind: 'store',
    x: 980, y: 320, w: 180, h: 84,
    didWith: 'Seat locks with TTL in MovieBook: SET lock:show:seat session NX PX 12000. Released on payment timeout.',
  },
  {
    id: 'nats',
    title: 'NATS JetStream',
    tech: ['durable consumers', 'acks'],
    kind: 'bus',
    x: 360, y: 400, w: 220, h: 84,
    didWith: 'USER_EVENTS stream. Explicit acks, redelivery on consumer death, idempotency key checked before any side effect.',
  },
  {
    id: 'notify-svc',
    title: 'Notification Service',
    tech: ['Node', 'TS'],
    kind: 'service',
    x: 680, y: 400, w: 220, h: 84,
    didWith: 'Consumes user.registered, records the idempotency key in the same transaction as the side effect, retries with back-off.',
  },
  {
    id: 'dlq',
    title: 'DLQ',
    tech: ['dead letters'],
    kind: 'store',
    x: 980, y: 440, w: 180, h: 64,
    didWith: 'After three failed deliveries a message lands here instead of looping forever. Inspectable, replayable.',
  },
]

export const edges: StackEdge[] = [
  { id: 'http', from: 'browser', to: 'gateway', label: 'HTTP', d: 'M 260 242 L 360 242' },
  { id: 'ws', from: 'gateway', to: 'browser', label: 'WebSockets', d: 'M 360 262 L 260 262' },
  { id: 'gw-user', from: 'gateway', to: 'user-svc', d: 'M 580 232 C 630 232, 630 102, 680 102' },
  { id: 'gw-booking', from: 'gateway', to: 'booking-svc', d: 'M 580 242 L 680 242' },
  { id: 'gw-nats', from: 'gateway', to: 'nats', d: 'M 470 284 L 470 400' },
  { id: 'user-pg', from: 'user-svc', to: 'postgres', d: 'M 900 102 L 980 102' },
  { id: 'booking-mongo', from: 'booking-svc', to: 'mongo', d: 'M 900 242 L 980 242' },
  { id: 'booking-redis', from: 'booking-svc', to: 'redis', d: 'M 900 262 C 940 262, 940 362, 980 362' },
  { id: 'user-nats', from: 'user-svc', to: 'nats', d: 'M 680 130 C 620 130, 600 400, 580 420' , dupable: true },
  { id: 'nats-notify', from: 'nats', to: 'notify-svc', label: 'user.registered', labelBelow: true, d: 'M 580 442 L 680 442', dupable: true },
  { id: 'notify-dlq', from: 'notify-svc', to: 'dlq', d: 'M 900 452 C 940 452, 940 472, 980 472' },
]

export const infra = ['Docker Compose', 'Vercel', 'GitHub Actions', 'AWS']
