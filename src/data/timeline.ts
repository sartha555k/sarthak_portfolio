export type Commit = {
  id: string
  hash: string
  date: string
  title: string
  body: string
  branch: 'main' | 'work' | 'side'
  tags?: string[]
  image?: string
  verify?: boolean
}

/** Deterministic 7-char fake hash from an id. Same id, same hash, every build. */
export function fakeHash(id: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  // mix a second round so short ids do not collide visibly
  let h2 = h
  for (let i = id.length - 1; i >= 0; i--) {
    h2 ^= id.charCodeAt(i)
    h2 = Math.imul(h2, 0x01000193) >>> 0
  }
  return (h.toString(16) + h2.toString(16)).padStart(14, '0').slice(0, 7)
}

const raw: Omit<Commit, 'hash'>[] = [
  {
    id: 'jec',
    date: '2021-11',
    branch: 'main',
    title: 'Enrolled, B.Tech IT — Jabalpur Engineering College',
    body: 'Four years of DSA, DBMS, OS, and figuring out I liked the web more than the syllabus.',
    image: '/img/timeline/jec.webp',
  },
  {
    id: 'first-js',
    date: '2024-08',
    branch: 'side',
    title: 'First JavaScript repo',
    body: 'javascript-tutorial. The start of the JS ecosystem rabbit hole.',
    tags: ['javascript'],
  },
  {
    id: 'grad',
    date: '2025-01',
    branch: 'main',
    title: 'Graduated, CGPA 7.8',
    body: 'And immediately started shipping.',
  },
  {
    id: 'first-fullstack',
    date: '2025-07',
    branch: 'side',
    title: 'prime-bid & Chit-Chat',
    body: 'First real-time apps: a bidding system and a chat app. Learned WebSockets the hard way.',
    tags: ['websockets', 'node'],
    image: '/img/timeline/first-fullstack.webp',
  },
  {
    id: 'resumex',
    date: '2025-12',
    branch: 'side',
    title: 'ResumeX goes live',
    body: 'First deployed product with real users.',
    tags: ['react', 'openai'],
    verify: true,
  },
  {
    id: 'alphawizz',
    date: '2026-04',
    branch: 'work',
    title: 'Full Stack Developer Intern — Alphawizz',
    body: 'Real-time order tracking with WebSockets for a delivery app; Redux across three interfaces.',
    tags: ['react', 'redux', 'websockets'],
    image: '/img/timeline/alphawizz.webp',
  },
  {
    id: 'digiflex',
    date: '2026-06',
    branch: 'work',
    title: 'Full Stack Developer Intern — DigiFlex.ai',
    body: 'Shared React component package; SSR and code splitting on the main Next.js app.',
    tags: ['next.js', 'npm'],
    image: '/img/timeline/digiflex.webp',
  },
  {
    id: 'moviebook',
    date: '2026-06',
    branch: 'side',
    title: 'MovieBook',
    body: 'Redis seat locks. The project I get asked about most.',
    tags: ['redis', 'express'],
  },
  {
    id: 'eventbus',
    date: '2026-08',
    branch: 'side',
    title: 'eventbus-services',
    body: 'NATS JetStream, idempotency, DLQ. First time I built something I would call infrastructure.',
    tags: ['nats', 'prisma', 'docker'],
    image: '/img/timeline/eventbus.webp',
  },
  {
    id: 'now',
    date: 'HEAD',
    branch: 'main',
    title: 'now',
    body: 'Looking for the next hard problem.',
  },
]

export const commits: Commit[] = raw.map((c) => ({ ...c, hash: fakeHash(c.id) }))
