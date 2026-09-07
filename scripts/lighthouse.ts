/**
 * Runs Lighthouse (mobile) against a URL and writes public/lighthouse.json,
 * which the footer reads to draw the four score rings.
 *
 *   npm run build && npm run preview &   # http://localhost:4173
 *   npm run lighthouse [url]
 */
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import { writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:4173/'

async function main() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
    })
    if (!result) throw new Error('lighthouse returned nothing')
    const cats = result.lhr.categories
    const score = (k: string) => Math.round((cats[k]?.score ?? 0) * 100)
    const json = {
      performance: score('performance'),
      accessibility: score('accessibility'),
      'best-practices': score('best-practices'),
      seo: score('seo'),
      url,
      fetchedAt: new Date().toISOString(),
    }
    const body = JSON.stringify(json, null, 2) + '\n'
    await writeFile('public/lighthouse.json', body)
    if (existsSync('dist')) await writeFile('dist/lighthouse.json', body)
    console.table(json)
  } finally {
    await chrome.kill()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
