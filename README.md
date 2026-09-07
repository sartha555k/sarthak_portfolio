# sarthak-portfolio

Live_URL : sarthakportfolio-one.vercel.app

Personal site for Sarthak Patel. Single-page, scroll-driven, dark. Two live demos
(Redis-style seat locking, NATS-style event bus) run entirely in the browser.

Stack: Vite 6 · React 19 · TypeScript (strict) · Tailwind v4 · GSAP 3 + ScrollTrigger · Lenis · react-router 7.
No UI kit, no CSS-in-JS, no Three.js.

## Run

```bash
npm i
npm run dev          # http://localhost:5173
npm test             # vitest: the two demo state machines
npm run build        # tsc -b && vite build && prerender → dist/
npm run serve        # gzip static server for dist/ at http://localhost:4180
npm run lint
```

`npm run build` also prerenders `/` and every `/work/<slug>` to static HTML (`scripts/prerender.ts`),
inlines the stylesheet, and the client hydrates it. All copy is in the HTML before any JavaScript runs,
so the page is readable with JS off and the largest paint does not wait for the bundle.

## Where things live

```
src/data/        all copy and facts: profile, work (case studies), timeline, stack (diagram), commands (palette)
src/components/  one folder per section + chrome/ (nav, palette, footer) + demos/ (state machines + UI)
src/lib/         gsap.ts (plugins registered once), lenis.ts (smooth scroll + scrollTo), reducedMotion.ts
src/styles/      tokens.css (design tokens), typography.css, grain.css
scripts/         og.ts, screenshots.ts, lighthouse.ts
tests/           seatLock.test.ts, eventBus.test.ts
public/img/      every image asset (see CONTENT_TODO.md for the full list and specs)
```

## Adding images

The site renders placeholders for any image that is missing. Drop files into `public/img/`
with these exact names and the placeholders disappear with no code change. Which files exist is read
at build time into a manifest (`virtual:image-manifest`, see `vite.config.ts`), so nothing is ever
requested that is not there; the dev server reloads when a file is added or removed:

| Path                                            | Spec                                     |
| ----------------------------------------------- | ---------------------------------------- |
| `hero-cutout.png` and `hero-cutout@1x.png`      | transparent PNG, ~2400px / 1200px tall   |
| `about-portrait.webp`                           | WebP 3:4, 1200×1600                      |
| `work/<slug>/desktop.webp`                      | WebP 1600×1000                           |
| `work/<slug>/mobile.webp`                       | WebP 780×1688 (390×844 @2x), optional    |
| `work/<slug>/detail.webp`                       | WebP 1600×1000, optional                 |
| `timeline/<id>.webp`                            | WebP 16:9, 960×540, optional             |

Slugs: `eventbus-services`, `moviebook`, `resumex`, `program-intel`, `ott-desktop`, `crack-ai`.
Timeline ids: `jec`, `first-fullstack`, `alphawizz`, `digiflex`, `eventbus`.

### Screenshots from the live apps

```bash
npx playwright install chromium
npm run screenshots              # all projects with a live URL
npm run screenshots moviebook    # one project
```

Writes `public/img/work/<slug>/{desktop,mobile}.webp`. Detail shots are taken by hand.

### OG image and favicons

```bash
npm run og
```

Renders `public/og.png`, `public/favicon-32.png`, `public/apple-touch-icon.png` from the site's tokens
with satori + resvg. Re-run after changing the tagline or accent colour.

### Lighthouse rings in the footer

```bash
npm run build
npm run serve &                   # dist/ with gzip at http://localhost:4180
npm run lighthouse http://localhost:4180/   # or: npm run lighthouse https://your-domain
```

Writes `public/lighthouse.json` (and `dist/lighthouse.json` when dist exists). The footer shows `--` until it exists.
The file is git-ignored; run it in CI or before a deploy if you want live numbers.

The entry module only loads CSS and schedules the app one frame after first paint (`src/main.tsx` →
`src/client.tsx`). The app chunk is deliberately not `modulepreload`ed: hydration starts one round trip
later, hidden behind the boot sequence, and first paint no longer depends on the bundle.
`npx lighthouse <url> --throttling-method=devtools` measures with applied throttling instead of the simulation.

## Changing the accent colour

One variable: `--accent` in `src/styles/tokens.css`. `--accent-2` (warm gold) is the secondary.
The OG image uses the same hex in `scripts/og.ts`; re-run `npm run og` after changing it.

One token differs from the original spec on purpose: `--text-3` is `#85868f` instead of `#5f606a`.
The darker value fails the 4.5:1 contrast check for the 12px labels that use it; the lighter one passes
on both `--bg` and `--bg-3`. Change it back only if you accept the accessibility score dropping.

## Reduced motion

Everything checks `prefers-reduced-motion`. The command palette (`⌘K` → "Toggle reduced motion")
also lets a visitor force it on or off; the choice is stored in `localStorage` and reloads the page.

## Keyboard

`⌘K` / `Ctrl+K` / `/` open the palette. `g` then `s` `w` `t` `a` `c` jump to sections. `?` scrolls to the legend.
Inside a case study: `Esc` or `←` closes.

## Deploy (Vercel)

```bash
npx vercel
```

`vercel.json` rewrites `/work/:slug` to `index.html`, sets long-lived cache headers on `/assets/*`,
and adds security headers including a CSP that allows only `self` and `data:` images.
Set the canonical domain in `index.html` and `src/data/profile.ts` (`site`) once it is known.

## Bundle budget

`npm run build:analyze` writes `stats.html`. Target: ≤ 180 kB gzipped JS in total.
GSAP plugins are imported individually from `src/lib/gsap.ts`; the two demos are lazy chunks.
