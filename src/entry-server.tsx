import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import App from './App'

/**
 * Used by scripts/prerender.ts at build time. Produces the static HTML that client.tsx hydrates.
 * prerenderToNodeStream waits for Suspense boundaries (the lazy demo chunks), so the markup is
 * complete and hydration never has to recover from a missing boundary.
 */
export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  return new Promise((resolve, reject) => {
    let html = ''
    prelude.on('data', (chunk: Buffer | string) => {
      html += chunk.toString()
    })
    prelude.on('end', () => resolve(html))
    prelude.on('error', reject)
  })
}
