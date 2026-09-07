import { defineConfig, type Plugin, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

// Bundle visualizer is off by default. Run `npm run build:analyze` to write stats.html.
const analyze = process.env.ANALYZE === '1'

/**
 * Preload the wordmark font so the hero is set in Bebas Neue at first paint.
 * Fontsource emits hashed names, so we collect them from the bundle and inject
 * <link rel="preload"> at the end. Body and mono fonts are not preloaded on purpose:
 * they have metric-matched fallbacks (no layout shift) and would compete with the
 * HTML and JS on slow links.
 */
function fontPreload(): Plugin {
  const wanted = [/bebas-neue-latin-400-normal.*\.woff2$/]
  const found = new Set<string>()
  return {
    name: 'sp:font-preload',
    apply: 'build',
    generateBundle(_, bundle) {
      for (const name of Object.keys(bundle)) if (wanted.some((re) => re.test(name))) found.add(name)
    },
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [...found].map((href) => ({
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${href}`, crossorigin: '' },
          injectTo: 'head-prepend' as const,
        }))
      },
    },
  }
}

/**
 * `virtual:image-manifest` exports a Set of every file under public/img, as "/img/..." paths.
 * Components check it instead of probing URLs at runtime, so a missing screenshot never
 * causes a request, a 404 in the console, or a placeholder flash. Drop a file in and
 * reload (dev) or rebuild (prod); no code changes.
 */
function imageManifest(): Plugin {
  const id = 'virtual:image-manifest'
  const resolved = '\0' + id
  const dir = path.resolve('public/img')
  const scan = (d: string, prefix: string, out: string[] = []): string[] => {
    let entries: string[] = []
    try {
      entries = readdirSync(d)
    } catch {
      return out
    }
    for (const name of entries) {
      if (name.startsWith('.')) continue
      const full = path.join(d, name)
      if (statSync(full).isDirectory()) scan(full, `${prefix}/${name}`, out)
      else out.push(`${prefix}/${name}`)
    }
    return out
  }
  return {
    name: 'sp:image-manifest',
    resolveId(source) {
      return source === id ? resolved : undefined
    },
    load(source) {
      if (source !== resolved) return
      return `export default new Set(${JSON.stringify(scan(dir, '/img').sort())})`
    },
    configureServer(server) {
      server.watcher.add(dir)
      const refresh = (file: string) => {
        if (!file.startsWith(dir)) return
        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    tailwindcss(),
    fontPreload(),
    imageManifest(),
    analyze &&
      (visualizer({
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
        open: false,
      }) as PluginOption),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(
      process.env.VITE_BUILD_DATE ?? new Date().toISOString().slice(0, 10),
    ),
  },
  build: {
    manifest: true,
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: isSsrBuild
      ? undefined
      : {
          output: {
            manualChunks: {
              gsap: ['gsap', 'gsap/ScrollTrigger', '@gsap/react'],
              vendor: ['react', 'react-dom', 'react-router', 'lenis'],
            },
          },
        },
  },
}))
