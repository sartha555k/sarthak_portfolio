/**
 * Renders public/og.png (1200×630), public/favicon-32.png and public/apple-touch-icon.png
 * from the same tokens the site uses. Run: npm run og
 */
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

type Node = Parameters<typeof satori>[0]

const require = createRequire(import.meta.url)
const out = (f: string) => path.resolve('public', f)

const BG = '#0a0a0b'
const ACCENT = '#ff3b1f'
const TEXT = '#ededef'
const MUTED = '#9a9ba3'
const LINE = '#26262c'

async function font(pkgPath: string) {
  return readFile(require.resolve(pkgPath))
}

async function main() {
  const bebas = await font('@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff')
  let inter: Buffer | null = null
  try {
    inter = await font('@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff')
  } catch {
    /* fall back to Bebas everywhere */
  }
  const fonts = [
    { name: 'Bebas Neue', data: bebas, weight: 400 as const, style: 'normal' as const },
    ...(inter ? [{ name: 'Inter Tight', data: inter, weight: 400 as const, style: 'normal' as const }] : []),
  ]
  const sans = inter ? 'Inter Tight' : 'Bebas Neue'

  // OG image
  const og = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BG,
          color: TEXT,
          padding: 64,
          fontFamily: sans,
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: 16, color: MUTED, fontSize: 20, letterSpacing: 3 },
              children: [
                { type: 'div', props: { style: { height: 1, width: 48, background: LINE } } },
                { type: 'div', props: { children: 'WELCOME · PORTFOLIO v1' } },
                { type: 'div', props: { style: { height: 1, flex: 1, background: LINE } } },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { fontFamily: 'Bebas Neue', fontSize: 236, lineHeight: 0.86, letterSpacing: 4, color: ACCENT },
                    children: 'SARTHAK',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { marginTop: 28, fontSize: 34, color: TEXT },
                    children: 'Building things nobody asked for. Yet.',
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', justifyContent: 'space-between', color: MUTED, fontSize: 22 },
              children: [
                { type: 'div', props: { children: 'Full-stack developer · Indore, IN' } },
                { type: 'div', props: { children: 'react · node · typescript · redis · nats' } },
              ],
            },
          },
        ],
      },
    } as unknown as Node,
    { width: 1200, height: 630, fonts },
  )
  await writeFile(out('og.png'), new Resvg(og, { fitTo: { mode: 'width', value: 1200 } }).render().asPng())
  console.log('wrote public/og.png')

  // Favicon PNGs from the same monogram
  const mark = (size: number) =>
    satori(
      {
        type: 'div',
        props: {
          style: {
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: BG,
            borderRadius: size * 0.19,
            fontFamily: 'Bebas Neue',
            fontSize: size * 0.66,
            color: TEXT,
            letterSpacing: size * 0.01,
          },
          children: [
            { type: 'span', props: { children: 'SP' } },
            { type: 'span', props: { style: { color: ACCENT }, children: '.' } },
          ],
        },
      } as unknown as Node,
      { width: size, height: size, fonts: [fonts[0]] },
    )
  for (const [name, size] of [
    ['favicon-32.png', 32],
    ['apple-touch-icon.png', 180],
  ] as const) {
    const svg = await mark(size)
    await writeFile(out(name), new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng())
    console.log(`wrote public/${name}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
