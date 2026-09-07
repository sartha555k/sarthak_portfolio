export type Work = {
  slug: string
  title: string
  year: string
  type: string
  role: string
  hook: string
  problem: string
  approach: string[]
  hardPart: string
  /** Pre-highlighted HTML for a <pre class="code">. Token classes: k s f c n p t. */
  code?: string
  codeLang?: string
  stack: string[]
  live?: string
  liveDomain?: string
  source: string
  next: string[]
  demo?: 'seatlock' | 'eventbus'
  images: { desktop: string; mobile?: string; detail?: string }
  verify?: string[]
}

export const work: Work[] = [
  {
    slug: 'eventbus-services',
    title: 'eventbus-services',
    year: '2026',
    type: 'Backend',
    role: 'Solo',
    hook: 'Two services that never call each other. Messages that never get processed twice.',
    problem:
      'Service-to-service HTTP calls fail in the worst possible places: mid-request, after a side effect, with no record of what happened. I wanted a backend where the user service and the notification service share nothing but a stream, and where a redelivered message is harmless.',
    approach: [
      'NATS JetStream USER_EVENTS stream with durable consumers and explicit acks',
      'Idempotency key subject:userId:seq checked before any side effect',
      'Automatic retries with back-off, then a dead-letter queue',
      'Zod on every HTTP boundary',
      'Correlation ID injected at the gateway and carried in HTTP and NATS headers',
      'Prisma + Postgres per service, Docker Compose to run everything with one command',
    ],
    hardPart:
      'Making redelivery boring. JetStream will redeliver a message if the consumer dies before ack, so the notification service records the idempotency key in the same transaction as the side effect, and checks it first on every message. The demo above shows the exact behaviour.',
    codeLang: 'notification-service/consumer.ts',
    code: `<span class="k">const</span> key <span class="p">=</span> <span class="s">\`\${msg.subject}:\${payload.userId}:\${msg.seq}\`</span>

<span class="k">await</span> prisma.<span class="f">$transaction</span>(<span class="k">async</span> (tx) <span class="p">=&gt;</span> {
  <span class="k">const</span> seen <span class="p">=</span> <span class="k">await</span> tx.processedMessage.<span class="f">findUnique</span>({ <span class="t">where</span>: { key } })
  <span class="k">if</span> (seen) { msg.<span class="f">ack</span>(); <span class="k">return</span> }          <span class="c">// redelivery: harmless</span>

  <span class="k">await</span> <span class="f">sendWelcomeEmail</span>(payload)                <span class="c">// the side effect</span>
  <span class="k">await</span> tx.processedMessage.<span class="f">create</span>({ <span class="t">data</span>: { key } })
})

msg.<span class="f">ack</span>()`,
    stack: ['TypeScript', 'Express', 'NATS JetStream', 'Prisma', 'PostgreSQL', 'Zod', 'Docker Compose'],
    source: 'https://github.com/sartha555k/eventbus-services',
    next: [
      'Outbox table so publish and DB write are atomic',
      'OpenTelemetry traces across the NATS hop',
      'k8s manifests',
    ],
    demo: 'eventbus',
    images: { desktop: '/img/work/eventbus-services/desktop.webp' },
    verify: ['source URL after rename'],
  },
  {
    slug: 'moviebook',
    title: 'MovieBook',
    year: '2026',
    type: 'Full-stack',
    role: 'Solo',
    hook: 'Two people cannot buy the same seat, even if they click at the same millisecond.',
    problem:
      'Seat maps are a classic race: two users see the same free seat, both pay, one gets a refund and a bad day. The lock has to be atomic and has to expire on its own if the user walks away.',
    approach: [
      'SET lock:<show>:<seat> <session> NX PX <ttl> in Redis (ioredis) for an atomic, self-expiring hold',
      'Seat layout API returns availability merged with live locks',
      'Payment converts a lock to a booking in one step and deletes the lock',
      'JWT auth',
      'Redux Toolkit with persisted state on the client',
    ],
    hardPart:
      'Getting the TTL right and being honest about it in the UI: the countdown the user sees is the same TTL Redis holds, and when it expires the seat opens for everyone at once.',
    codeLang: 'server/locks.ts',
    code: `<span class="k">export async function</span> <span class="f">lockSeat</span>(showId: <span class="t">string</span>, seat: <span class="t">string</span>, session: <span class="t">string</span>) {
  <span class="k">const</span> key <span class="p">=</span> <span class="s">\`lock:\${showId}:\${seat}\`</span>
  <span class="c">// NX: only if absent. PX: expire in ms. One round-trip, atomic.</span>
  <span class="k">const</span> ok <span class="p">=</span> <span class="k">await</span> redis.<span class="f">set</span>(key, session, <span class="s">'NX'</span>, <span class="s">'PX'</span>, <span class="n">12_000</span>)
  <span class="k">if</span> (ok <span class="p">!==</span> <span class="s">'OK'</span>) {
    <span class="k">const</span> owner <span class="p">=</span> <span class="k">await</span> redis.<span class="f">get</span>(key)
    <span class="k">const</span> ttl <span class="p">=</span> <span class="k">await</span> redis.<span class="f">pttl</span>(key)
    <span class="k">throw new</span> <span class="f">HttpError</span>(<span class="n">409</span>, <span class="s">\`seat \${seat} is locked by another session (\${Math.ceil(ttl / 1000)}s left)\`</span>, { owner })
  }
  <span class="k">return</span> { key, expiresAt: Date.<span class="f">now</span>() <span class="p">+</span> <span class="n">12_000</span> }
}`,
    stack: ['React', 'Redux Toolkit', 'Express', 'MongoDB', 'Redis', 'JWT', 'Tailwind'],
    live: 'https://movie-booking-creative-upaay.vercel.app',
    liveDomain: 'movie-booking-creative-upaay.vercel.app',
    source: 'https://github.com/sartha555k/moviebook',
    next: ['Real payment webhook', 'Lock renewal on activity', 'Seat-hold analytics'],
    demo: 'seatlock',
    images: {
      desktop: '/img/work/moviebook/desktop.webp',
      mobile: '/img/work/moviebook/mobile.webp',
      detail: '/img/work/moviebook/detail.webp',
    },
    verify: ['live URL will change after rename', 'source URL after rename'],
  },
  {
    slug: 'resumex',
    title: 'ResumeX',
    year: '2025–26',
    type: 'Full-stack',
    role: 'Solo',
    hook: 'Fill a form, watch the résumé render live, let a model write the boring parts.',
    problem:
      'Most résumé tools either give you a Word template or lock your data in. I wanted live preview, real templates, export, and an assistant that drafts summaries without inventing facts.',
    approach: [
      'Redux Toolkit keeps form state and preview in sync without re-rendering the whole document',
      'Multiple templates as React components sharing one data model',
      "OpenAI API for summary and skills drafting with the user's own inputs as the only source",
      'ImageKit for image handling',
      'History, sessions and public share URLs on the backend',
    ],
    hardPart:
      'Preview performance. Every keystroke used to re-render an SVG-heavy template; memoising per section and batching updates fixed it.',
    codeLang: 'client/preview/Section.tsx',
    code: `<span class="c">// Each section subscribes to its own slice, so a keystroke in</span>
<span class="c">// "experience" never re-renders "education".</span>
<span class="k">const</span> ExperienceSection <span class="p">=</span> <span class="f">memo</span>(<span class="k">function</span> <span class="f">ExperienceSection</span>() {
  <span class="k">const</span> items <span class="p">=</span> <span class="f">useAppSelector</span>(selectExperience, shallowEqual)
  <span class="k">return</span> &lt;<span class="t">Block</span> title=<span class="s">"Experience"</span>&gt;{items.<span class="f">map</span>(renderItem)}&lt;/<span class="t">Block</span>&gt;
})

<span class="c">// Inputs dispatch through a 32ms batcher instead of on every change.</span>
<span class="k">const</span> update <span class="p">=</span> <span class="f">useBatchedDispatch</span>(setField, <span class="n">32</span>)`,
    stack: ['React 19', 'Vite', 'Redux Toolkit', 'Tailwind', 'Node.js', 'Express', 'MongoDB', 'OpenAI API', 'ImageKit'],
    live: 'https://resume-x-8s55.vercel.app',
    liveDomain: 'resume-x-8s55.vercel.app',
    source: 'https://github.com/sartha555k/ResumeX',
    next: ['PDF export via server-side render', 'ATS check', 'Template marketplace'],
    images: { desktop: '/img/work/resumex/desktop.webp', mobile: '/img/work/resumex/mobile.webp' },
    verify: ['OpenAI vs Gemini (résumé says OpenAI API)'],
  },
  {
    slug: 'program-intel',
    title: 'program-intel',
    year: '2026',
    type: 'Full-stack',
    role: 'Solo',
    hook: 'CSV exports in, monthly review in.',
    problem:
      'A nonprofit collects school-level survey data every month and has to turn it into review meetings and grant reports by hand.',
    approach: [
      'CSV ingestion into MongoDB with a normalised schema',
      'Filters (month, district, block, grade, subject) that drive every metric',
      'Month-on-month movement and 3-month trends',
      'A deterministic risk tier per school: On Track ≥75%, Behind 60–74%, At Risk 35–59%, Critical <35%',
      'Grant-reporting view where every number traces to its source rows',
      'Recommended actions with owner and due date',
    ],
    hardPart:
      'Traceability. Every headline number in the grant view can be clicked to see the rows that produced it; the aggregation layer keeps row IDs all the way up.',
    codeLang: 'server/aggregate.ts',
    code: `<span class="k">type</span> <span class="t">Metric</span> <span class="p">=</span> { value: <span class="t">number</span>; rows: <span class="t">ObjectId</span>[] }   <span class="c">// never lose the rows</span>

<span class="k">export function</span> <span class="f">tier</span>(pct: <span class="t">number</span>) {
  <span class="k">if</span> (pct <span class="p">&gt;=</span> <span class="n">75</span>) <span class="k">return</span> <span class="s">'on-track'</span>
  <span class="k">if</span> (pct <span class="p">&gt;=</span> <span class="n">60</span>) <span class="k">return</span> <span class="s">'behind'</span>
  <span class="k">if</span> (pct <span class="p">&gt;=</span> <span class="n">35</span>) <span class="k">return</span> <span class="s">'at-risk'</span>
  <span class="k">return</span> <span class="s">'critical'</span>
}

<span class="k">export function</span> <span class="f">merge</span>(a: <span class="t">Metric</span>, b: <span class="t">Metric</span>): <span class="t">Metric</span> {
  <span class="k">return</span> { value: a.value <span class="p">+</span> b.value, rows: [...a.rows, ...b.rows] }
}`,
    stack: ['React (Vite)', 'Node.js', 'Express', 'MongoDB'],
    live: 'https://mantra-4-change.vercel.app',
    liveDomain: 'mantra-4-change.vercel.app',
    source: 'https://github.com/sartha555k/program-intel',
    next: ['Role-based access', 'Scheduled ingestion', 'PDF report export'],
    images: {
      desktop: '/img/work/program-intel/desktop.webp',
      mobile: '/img/work/program-intel/mobile.webp',
      detail: '/img/work/program-intel/detail.webp',
    },
    verify: ['live URL after rename', 'source URL after rename'],
  },
  {
    slug: 'ott-desktop',
    title: 'ott-desktop',
    year: '2026',
    type: 'Frontend',
    role: 'Solo',
    hook: 'A mobile site, rebuilt for a 27-inch screen.',
    problem:
      "The platform's web app was a scaled-up phone layout. Vertical 9:16 dramas need a desktop grammar of their own.",
    approach: [
      'Next.js App Router with TypeScript',
      'Auto-rotating hero carousel with pause-on-hover',
      '9:16 VideoCards with hover preview',
      'CSS scroll-snap rows with hidden scrollbars and chevrons',
      'Dual theme via context',
      'Natural-language "find me a drama" search',
    ],
    hardPart:
      'Keeping 60fps with dozens of hover-scaling video cards in view: content-visibility, will-change only on hover, and pausing offscreen previews.',
    codeLang: 'components/VideoCard.module.css',
    code: `<span class="t">.row</span> { <span class="k">content-visibility</span>: auto; <span class="k">contain-intrinsic-size</span>: <span class="n">auto 420px</span>; }

<span class="t">.card</span> {
  <span class="k">transition</span>: transform <span class="n">.35s</span> <span class="f">cubic-bezier</span>(<span class="n">.16</span>,<span class="n">1</span>,<span class="n">.3</span>,<span class="n">1</span>);
}
<span class="c">/* promote to its own layer only while it needs one */</span>
<span class="t">.card:hover</span> { <span class="k">will-change</span>: transform; <span class="k">transform</span>: <span class="f">scale</span>(<span class="n">1.06</span>); }
<span class="t">.card:not(:hover) video</span> { <span class="k">visibility</span>: hidden; }`,
    stack: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion'],
    live: 'https://bullet-alpha.vercel.app',
    liveDomain: 'bullet-alpha.vercel.app',
    source: 'https://github.com/sartha555k/ott-desktop',
    next: ['Real playback with HLS', 'Watch history', 'Keyboard navigation for rows'],
    images: {
      desktop: '/img/work/ott-desktop/desktop.webp',
      mobile: '/img/work/ott-desktop/mobile.webp',
      detail: '/img/work/ott-desktop/detail.webp',
    },
    verify: ['live URL after rename', 'source URL after rename'],
  },
  {
    slug: 'crack-ai',
    title: 'Crack.AI',
    year: '2026',
    type: 'Full-stack',
    role: 'Solo',
    hook: 'An interviewer that asks, listens, and scores.',
    problem:
      'Practising interviews alone has no feedback loop. I wanted questions that adapt to the role and difficulty, answers by voice or text, and a review afterwards.',
    approach: [
      'Interview sessions by role and difficulty',
      'Speech-to-text for spoken answers',
      'Real-time scoring and per-question feedback',
      'Session resume and history',
      'JWT auth',
    ],
    hardPart:
      'Latency between the end of a spoken answer and the next question; streaming the model response and pre-fetching the next question hid most of it.',
    codeLang: 'client/hooks/useNextQuestion.ts',
    code: `<span class="c">// While the user is still answering Q(n), Q(n+1) is already being drafted.</span>
<span class="k">const</span> next <span class="p">=</span> <span class="f">useRef</span>&lt;Promise&lt;<span class="t">Question</span>&gt;&gt;()

<span class="k">function</span> <span class="f">onAnswerStart</span>() {
  next.current <span class="p">=</span> api.<span class="f">draftQuestion</span>({ role, difficulty, history })
}

<span class="k">async function</span> <span class="f">onAnswerEnd</span>(audio: <span class="t">Blob</span>) {
  <span class="k">const</span> [transcript, question] <span class="p">=</span> <span class="k">await</span> Promise.<span class="f">all</span>([api.<span class="f">transcribe</span>(audio), next.current])
  <span class="f">score</span>(transcript)              <span class="c">// streams tokens into the feedback panel</span>
  <span class="f">show</span>(question)
}`,
    stack: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'FastAPI', 'Whisper', 'Ollama', 'Socket.IO', 'Monaco'],
    source: 'https://github.com/sartha555k/Crack.AI',
    next: ['Interviewer personas', 'Coding round with an editor', 'Shareable score card'],
    images: { desktop: '/img/work/crack-ai/desktop.webp', mobile: '/img/work/crack-ai/mobile.webp' },
    verify: [
      'live URL (deploy first)',
      'stack: résumé lists FastAPI, Whisper, Ollama, Socket.IO, Monaco; keep only what is in the repo',
    ],
  },
]

export const workBySlug = (slug: string) => work.find((w) => w.slug === slug)
