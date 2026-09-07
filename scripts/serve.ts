/**
 * Minimal static server for dist/ with gzip and SPA fallback, so local Lighthouse
 * runs see the same transfer sizes Vercel sends. No dependencies.
 *
 *   npm run build && npm run serve      # http://localhost:4180
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { createGzip } from 'node:zlib'

const root = join(process.cwd(), 'dist')
const port = Number(process.argv[2] ?? process.env.PORT ?? 4180)

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}
const compressible = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml'])

createServer((req, res) => handle(req, res)).listen(port, () => console.log(`dist/ on http://localhost:${port}`))

function handle(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0])
  let file = normalize(join(root, url))
  if (!file.startsWith(root)) {
    res.writeHead(403).end()
    return
  }
  if (!existsSync(file) || statSync(file).isDirectory()) {
    // Clean URLs: /work/moviebook → work/moviebook.html (prerendered), like Vercel's cleanUrls.
    if (!extname(url) && existsSync(`${file}.html`)) file = `${file}.html`
    // Otherwise SPA fallback for extension-less routes; a missing asset is a 404, as on Vercel.
    else if (extname(url)) {
      res.writeHead(404, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }).end('not found')
      return
    } else file = join(root, 'index.html')
  }
  const ext = extname(file)
  const headers: Record<string, string> = {
    'Content-Type': types[ext] ?? 'application/octet-stream',
    'Cache-Control': url.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  }
  const gzip = compressible.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')
  if (gzip) headers['Content-Encoding'] = 'gzip'
  res.writeHead(200, headers)
  const stream = createReadStream(file)
  if (gzip) stream.pipe(createGzip({ level: 6 })).pipe(res)
  else stream.pipe(res)
}
