import {
  SPECTRUM_URL_DEFAULTS,
  type SpectrumUrlParams,
} from "@/app/(app)/(create)/lib/spectrum-params"

// Share link = shadcn preset code (style, fonts, icons, radius, menu) plus the
// Spectrum color params that differ from the defaults.
export function buildShareUrl(
  origin: string,
  {
    preset,
    item,
    pointer,
    spectrum,
  }: { preset: string; item: string; pointer: boolean; spectrum: SpectrumUrlParams }
) {
  const search = new URLSearchParams({ preset, item })

  if (pointer) {
    search.set("pointer", "true")
  }

  for (const key of Object.keys(SPECTRUM_URL_DEFAULTS) as (keyof SpectrumUrlParams)[]) {
    if (spectrum[key] !== SPECTRUM_URL_DEFAULTS[key]) {
      search.set(key, String(spectrum[key]))
    }
  }

  return `${origin}/create?${search.toString()}`
}
