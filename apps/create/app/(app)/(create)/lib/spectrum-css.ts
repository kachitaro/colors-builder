import {
  buildSpectrum,
  type SpectrumOptions,
  type SpectrumResult,
} from "spectrum-colors/core"

const TAILWIND_MARKER = "\n/* Tailwind v4 */"
const cache = new Map<string, { css: string; audit: SpectrumResult["audit"] }>()

// CSS for the preview iframe: raw scales + semantic tokens (light & dark).
// Tailwind's @theme/@custom-variant are left out (the app already has them)
// and --radius is left to the radius picker.
export function spectrumThemeCss(o: SpectrumOptions) {
  const key = JSON.stringify(o)
  const hit = cache.get(key)
  if (hit) {
    return hit
  }

  const r = buildSpectrum(o)
  const semantic = r.themeCss
    .slice(0, r.themeCss.indexOf(TAILWIND_MARKER))
    .replace(/^ {2}--radius: [^;]+;\n/m, "")
  const value = { css: `${r.colorsCss}\n${semantic}`, audit: r.audit }

  if (cache.size > 50) {
    cache.clear()
  }
  cache.set(key, value)
  return value
}
