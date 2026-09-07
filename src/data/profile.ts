export const profile = {
  name: 'Sarthak Patel',
  tagline: 'Building things nobody asked for. Yet.',
  role: 'Full-stack developer',
  location: 'Indore, IN',
  tz: 'IST (UTC+5:30)',
  email: 'sarthak.code30@gmail.com',
  github: 'https://github.com/sartha555k',
  githubHandle: 'github.com/sartha555k',
  linkedin: 'https://www.linkedin.com/in/sarthak-patel-14938322a/',
  linkedinHandle: 'linkedin.com/in/sarthak-patel-14938322a',
  resume: '/resume/Sarthak_Patel_Resume.pdf',
  repo: 'https://github.com/sartha555k/portfolio', // VERIFY
  site: 'https://sarthakpatel.dev', // VERIFY
  about: [
    "The tagline is only half a joke. Most of what's on my GitHub started because I wanted something to exist and nobody was going to build it for me.",
    'I build web apps end to end, mostly in TypeScript: React or Next.js on the front, Node and Express behind it, Postgres or Mongo underneath, Redis when something needs to be fast or locked, NATS when two services should not know about each other.',
    'The part I like is when a vague requirement turns into a thing that runs. I care less about which framework wins.',
  ],
  now: {
    building: 'eventbus-services v2 (outbox pattern, k8s manifests)', // VERIFY
    learning: 'PostgreSQL internals, Go', // VERIFY
    openTo: 'full-time roles · contract work · pairing on hard problems',
    location: 'Indore, IN · IST (UTC+5:30) · remote-friendly',
  },
  builtWith: ['React 19', 'TypeScript', 'Vite', 'Tailwind v4', 'GSAP', 'Lenis', 'Vercel'],
} as const

export const sections = [
  { id: 'top', label: 'Top', short: 'Top', key: 'h' },
  { id: 'system', label: 'System', short: '01', key: 's' },
  { id: 'work', label: 'Work', short: '02', key: 'w' },
  { id: 'timeline', label: 'Timeline', short: '03', key: 't' },
  { id: 'about', label: 'About', short: '04', key: 'a' },
  { id: 'contact', label: 'Contact', short: '05', key: 'c' },
] as const

export type SectionId = (typeof sections)[number]['id']
