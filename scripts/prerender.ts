/**
 * Prerender every route to static HTML after `vite build`, so the copy is in the
 * DOM before any JavaScript runs (fast LCP, readable without JS, indexable).
 * main.tsx hydrates the markup on the client.
 *
 * Runs as part of `npm run build`. Output: dist/index.html and dist/work/<slug>.html
 */
import { build } from 'vite'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { work } from '../src/data/work'

const dist = path.resolve('dist')
const ssrDir = path.resolve('dist-ssr')

async function main() {
  await build({
    configFile: path.resolve('vite.config.ts'),
    logLevel: 'warn',
    build: { ssr: 'src/entry-server.tsx', outDir: ssrDir, emptyOutDir: true, copyPublicDir: false },
  })
  const mod = (await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href)) as {
    render: (url: string) => Promise<string>
  }
  let template = await readFile(path.join(dist, 'index.html'), 'utf8')

  // Inline the stylesheet: one fewer round trip before first paint. Fonts stay external.
  const cssLink = template.match(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/)
  if (cssLink) {
    const css = await readFile(path.join(dist, cssLink[1]), 'utf8')
    template = template.replace(cssLink[0], `<style>${css}</style>`)
  }

  // No <link rel="modulepreload"> for the app chunk on purpose. The entry script requests it one frame
  // after first paint; preloading it made Lighthouse's simulation chain first paint to the whole bundle.

  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const routes = ['/', ...work.map((w) => `/work/${w.slug}`)]
  for (const url of routes) {
    const item = work.find((w) => url === `/work/${w.slug}`)
    let html = template.replace('<div id="root"></div>', `<div id="root">${await mod.render(url)}</div>`)
    if (item) {
      // Per-route title and description so shared case-study links unfurl with the right text.
      const title = `${item.title} — Sarthak Patel`
      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
        .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escape(item.hook)}$2`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escape(item.hook)}$2`)
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escape(item.hook)}$2`)
    }
    const out = url === '/' ? path.join(dist, 'index.html') : path.join(dist, `${url.slice(1)}.html`)
    await mkdir(path.dirname(out), { recursive: true })
    await writeFile(out, html)
    console.log(`prerendered ${url} → ${path.relative(process.cwd(), out)}`)
  }
  await rm(ssrDir, { recursive: true, force: true })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
