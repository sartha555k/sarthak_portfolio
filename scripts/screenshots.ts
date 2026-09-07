/**
 * Captures live-site screenshots into public/img/work/<slug>/{desktop,mobile}.webp.
 * Run: npx playwright install chromium && npm run screenshots [slug ...]
 *
 * Desktop  1600×1000  (viewport 1600×1000 @1x)
 * Mobile    780×1688  (viewport 390×844 @2x)
 * Playwright writes PNG; sharp converts to WebP. The site expects .webp.
 */
import { chromium } from 'playwright'
import { mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { work } from '../src/data/work'

const only = process.argv.slice(2)

async function toWebp(png: string, webp: string) {
  const sharp = (await import('sharp')).default
  await sharp(png).webp({ quality: 82 }).toFile(webp)
  await unlink(png)
}

async function main() {
  const browser = await chromium.launch()
  try {
    for (const w of work) {
      if (only.length && !only.includes(w.slug)) continue
      if (!w.live) {
        console.log(`skip ${w.slug}: no live URL`)
        continue
      }
      const dir = path.resolve('public/img/work', w.slug)
      await mkdir(dir, { recursive: true })

      for (const shot of [
        { name: 'desktop', viewport: { width: 1600, height: 1000 }, scale: 1 },
        { name: 'mobile', viewport: { width: 390, height: 844 }, scale: 2 },
      ]) {
        const ctx = await browser.newContext({
          viewport: shot.viewport,
          deviceScaleFactor: shot.scale,
          colorScheme: 'dark',
          isMobile: shot.name === 'mobile',
        })
        const page = await ctx.newPage()
        await page.goto(w.live, { waitUntil: 'networkidle', timeout: 60_000 })
        await page.waitForTimeout(1500)
        const png = path.join(dir, `${shot.name}.png`)
        await page.screenshot({ path: png, fullPage: false })
        await toWebp(png, path.join(dir, `${shot.name}.webp`))
        console.log(`wrote ${path.relative(process.cwd(), path.join(dir, `${shot.name}.webp`))}`)
        await ctx.close()
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
