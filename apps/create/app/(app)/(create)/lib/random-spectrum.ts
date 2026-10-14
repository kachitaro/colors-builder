import {
  buildSpectrum,
  DEFAULT_OPTIONS,
  HARMONY,
  HUES,
  NEUTRALS,
  type SpectrumOptions,
} from "spectrum-colors/core"

const MAX_TRIES = 20
const pick = <T>(rng: () => number, items: readonly T[]) =>
  items[Math.floor(rng() * items.length)]

function randomHex(rng: () => number) {
  const n = Math.floor(rng() * 0x1000000)
  return `#${n.toString(16).padStart(6, "0")}`
}

function passesAudit(o: SpectrumOptions) {
  try {
    return buildSpectrum(o).audit.fails.length === 0
  } catch {
    return false
  }
}

// Random neutral / primary (hue or hex) / harmony. Retries until the WCAG
// audit passes; falls back to the defaults, which always pass.
export function randomSpectrum(rng: () => number): SpectrumOptions {
  for (let i = 0; i < MAX_TRIES; i++) {
    const primary = rng() < 0.5 ? pick(rng, HUES).name : randomHex(rng)
    const candidate: SpectrumOptions = {
      ...DEFAULT_OPTIONS,
      neutral: pick(rng, NEUTRALS).name,
      primary,
      harmony:
        rng() < 0.5
          ? (pick(rng, Object.keys(HARMONY)) as SpectrumOptions["harmony"])
          : "",
    }
    if (passesAudit(candidate)) {
      return candidate
    }
  }
  return DEFAULT_OPTIONS
}
