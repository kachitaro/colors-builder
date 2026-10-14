import { isPresetCode } from "shadcn/preset"

import {
  fromSpectrumOptions,
  SPECTRUM_URL_DEFAULTS,
  toSpectrumOptions,
  type SpectrumUrlParams,
} from "@/app/(app)/(create)/lib/spectrum-params"

const PRESET_FLAG_PATTERN = /^--preset\b\s+(.+)$/i

function spectrumFromSearch(search: URLSearchParams): SpectrumUrlParams {
  const raw: SpectrumUrlParams = { ...SPECTRUM_URL_DEFAULTS }

  for (const key of Object.keys(raw) as (keyof SpectrumUrlParams)[]) {
    const value = search.get(key)
    if (value === null) continue
    if (key === "step") raw.step = Number(value)
    else raw[key] = value
  }

  return fromSpectrumOptions(toSpectrumOptions(raw))
}

// Accepts a bare preset code, a `--preset <code>` flag, or a full share link.
// Colors come only from a link; otherwise they reset to the Spectrum defaults.
export function parsePresetInput(value: string) {
  const input = value.trim()

  if (!input) {
    return null
  }

  if (/^https?:\/\//i.test(input)) {
    let url: URL
    try {
      url = new URL(input)
    } catch {
      return null
    }
    const preset = url.searchParams.get("preset")
    return preset && isPresetCode(preset)
      ? { preset, spectrum: spectrumFromSearch(url.searchParams) }
      : null
  }

  const preset = input.match(PRESET_FLAG_PATTERN)?.[1]?.trim() ?? input

  return isPresetCode(preset)
    ? { preset, spectrum: { ...SPECTRUM_URL_DEFAULTS } }
    : null
}
