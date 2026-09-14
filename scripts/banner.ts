/**
 * Renders .github/profile/banner.png (1600×560) for the GitHub README, using the same
 * tokens and fonts as the site. Run: npm run banner
 */
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

type Node = Parameters<typeof satori>[0]
const require = createRequire(import.meta.url)

const BG = '#0a0a0b'
const BG2 = '#111114'
const LINE = '#26262c'
const ACCENT = '#ff3b1f'
const GOLD = '#f5b942'
const TEXT = '#ededef'
const MUTED = '#9a9ba3'
const DIM = '#85868f'
const OK = '#3ddc84'

const font = (p: string) => readFile(require.resolve(p))

async function main() {
  const [bebas, inter, mono] = await Promise.all([
    font('@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff'),
    font('@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff'),
    font('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'),
  ])
  const fonts = [
    { name: 'Bebas Neue', data: bebas, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter Tight', data: inter, weight: 400 as const, style: 'normal' as const },
    { name: 'JetBrains Mono', data: mono, weight: 400 as const, style: 'normal' as const },
  ]

  const line = (k: string, v: string, color = TEXT) => ({
    type: 'div',
    props: {
      style: { display: 'flex', gap: 0, fontSize: 17, lineHeight: 1.7 },
      children: [
        { type: 'span', props: { style: { color: k.startsWith('$') ? TEXT : DIM }, children: k } },
        { type: 'span', props: { style: { color }, children: v } },
      ],
    },
  })

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: 1600,
          height: 560,
          display: 'flex',
          background: BG,
          color: TEXT,
          fontFamily: 'Inter Tight',
          position: 'relative',
        },
        children: [
          // left: wordmark + tagline
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 0 56px 72px', width: 960 },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', alignItems: 'center', gap: 16, color: DIM, fontFamily: 'JetBrains Mono', fontSize: 15, letterSpacing: 3 },
                    children: [
                      { type: 'div', props: { style: { height: 1, width: 40, background: LINE } } },
                      { type: 'div', props: { children: 'GITHUB.COM/SARTHA555K' } },
                      { type: 'div', props: { style: { height: 1, width: 220, background: LINE } } },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column' },
                    children: [
                      { type: 'div', props: { style: { fontFamily: 'Bebas Neue', fontSize: 250, lineHeight: 0.86, letterSpacing: 4, color: ACCENT }, children: 'SARTHAK' } },
                      { type: 'div', props: { style: { marginTop: 22, fontSize: 30, color: TEXT }, children: 'Building things nobody asked for. Yet.' } },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', gap: 28, color: MUTED, fontFamily: 'JetBrains Mono', fontSize: 15 },
                    children: [
                      { type: 'div', props: { children: 'react 19' } },
                      { type: 'div', props: { children: 'typescript' } },
                      { type: 'div', props: { children: 'vite 6' } },
                      { type: 'div', props: { children: 'gsap' } },
                      { type: 'div', props: { children: 'lenis' } },
                      { type: 'div', props: { children: 'tailwind v4' } },
                    ],
                  },
                },
              ],
            },
          },
          // right: terminal card
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                right: 72,
                top: 96,
                width: 520,
                display: 'flex',
                flexDirection: 'column',
                background: BG2,
                border: `1px solid ${LINE}`,
                borderRadius: 14,
                overflow: 'hidden',
                fontFamily: 'JetBrains Mono',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${LINE}` },
                    children: [
                      { type: 'div', props: { style: { width: 10, height: 10, borderRadius: 5, background: '#3a3a42' } } },
                      { type: 'div', props: { style: { width: 10, height: 10, borderRadius: 5, background: '#3a3a42' } } },
                      { type: 'div', props: { style: { width: 10, height: 10, borderRadius: 5, background: '#3a3a42' } } },
                      { type: 'div', props: { style: { marginLeft: 8, color: DIM, fontSize: 13 }, children: 'zsh' } },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', padding: '18px 22px 22px' },
                    children: [
                      line('$\u00a0', 'whoami'),
                      line('', 'sarthak', MUTED),
                      line('$\u00a0', 'sarthak --stack'),
                      line('', 'react · next · node · ts · redis · nats', MUTED),
                      line('$\u00a0', 'npm run build'),
                      line('', '17 tests passed · 159 kB gz · LH 98/100/100/100', OK),
                      line('$\u00a0', 'open portfolio'),
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 17 },
                          children: [
                            { type: 'span', props: { style: { color: TEXT }, children: '$\u00a0' } },
                            { type: 'div', props: { style: { width: 10, height: 20, background: GOLD } } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          // bottom hairline
          { type: 'div', props: { style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: ACCENT } } },
        ],
      },
    } as unknown as Node,
    { width: 1600, height: 560, fonts },
  )

  await mkdir('.github/profile', { recursive: true })
  const out = path.resolve('.github/profile/banner.png')
  await writeFile(out, new Resvg(svg, { fitTo: { mode: 'width', value: 1600 } }).render().asPng())
  console.log('wrote .github/profile/banner.png')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
