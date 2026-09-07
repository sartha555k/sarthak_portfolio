import images from 'virtual:image-manifest'

export type ImgState = 'ok' | 'missing'

/**
 * Does this "/img/..." file exist in public/img? Answered from a build-time manifest
 * (see imageManifest() in vite.config.ts), so the answer is the same on the server and
 * on the first client render, and it never costs a request.
 */
export function imageExists(src?: string): boolean {
  return Boolean(src && images.has(src))
}

export function useImageExists(src?: string): ImgState {
  return imageExists(src) ? 'ok' : 'missing'
}
