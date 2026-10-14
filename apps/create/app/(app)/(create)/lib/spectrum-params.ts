import { parseAsInteger, parseAsString } from "nuqs/server"
import {
  DEFAULT_OPTIONS,
  HARMONY,
  HUES,
  NEUTRALS,
  type SpectrumOptions,
} from "spectrum-colors/core"

// URL form of SpectrumOptions. `primary` is "neutral", a hue name, or a hex
// without "#". `chart` is a comma-separated list of hue names.
export type SpectrumUrlParams = {
  neutral: string
  primary: string
  step: number
  harmony: string
  destructive: string
  success: string
  warning: string
  info: string
  chart: string
}

const D = DEFAULT_OPTIONS
export const SPECTRUM_URL_DEFAULTS: SpectrumUrlParams = {
  neutral: D.neutral,
  primary: D.primary,
  step: D.primaryStep,
  harmony: D.harmony,
  destructive: D.destructive,
  success: D.success,
  warning: D.warning,
  info: D.info,
  chart: D.chart.join(","),
}

export const spectrumParsers = {
  neutral: parseAsString.withDefault(SPECTRUM_URL_DEFAULTS.neutral),
  primary: parseAsString.withDefault(SPECTRUM_URL_DEFAULTS.primary),
  step: parseAsInteger.withDefault(SPECTRUM_URL_DEFAULTS.step),
  harmony: parseAsString.withDefault(SPECTRUM_URL_DEFAULTS.harmony),
  destructive: parseAsString.withDefault(SPECTRUM_URL_DEFAULTS.destructive),
  success: parseAsString.withDefault(SPECTRUM_URL_DEFAULTS.success),
  warning: parseAsString.withDefault(SPECTRUM_URL_DEFAULTS.warning),
  info: parseAsString.withDefault(SPECTRUM_URL_DEFAULTS.info),
  chart: parseAsString.withDefault(SPECTRUM_URL_DEFAULTS.chart),
}

const hueNames: Record<string, true> = Object.fromEntries(HUES.map((h) => [h.name, true]))
const neutralNames: Record<string, true> = Object.fromEntries(NEUTRALS.map((n) => [n.name, true]))
const HEX6 = /^#?([0-9a-f]{6})$/i

const hue = (v: string, fallback: string) => (Object.hasOwn(hueNames, v) ? v : fallback)

function parsePrimary(raw: string) {
  const v = raw.trim()
  if (v === "neutral" || Object.hasOwn(hueNames, v)) return v
  const hex = HEX6.exec(v)
  return hex ? `#${hex[1].toLowerCase()}` : D.primary
}

// Never throws: any invalid value falls back to its default.
export function toSpectrumOptions(p: SpectrumUrlParams): SpectrumOptions {
  const primary = parsePrimary(p.primary)
  const chart = p.chart
    .split(",")
    .filter((c) => Object.hasOwn(hueNames, c))
    .slice(0, D.chart.length) // bounds the cost of buildSpectrum for crafted links
  return {
    neutral: Object.hasOwn(neutralNames, p.neutral) ? p.neutral : D.neutral,
    primary,
    primaryStep:
      Number.isInteger(p.step) && p.step >= 1 && p.step <= 12
        ? p.step
        : D.primaryStep,
    harmony:
      primary !== "neutral" && Object.hasOwn(HARMONY, p.harmony)
        ? (p.harmony as SpectrumOptions["harmony"])
        : "",
    destructive: hue(p.destructive, D.destructive),
    success: hue(p.success, D.success),
    warning: hue(p.warning, D.warning),
    info: hue(p.info, D.info),
    chart: chart.length ? chart : D.chart,
  }
}

export function fromSpectrumOptions(o: SpectrumOptions): SpectrumUrlParams {
  return {
    neutral: o.neutral,
    primary: o.primary.replace(/^#/, ""),
    step: o.primaryStep,
    harmony: o.harmony,
    destructive: o.destructive,
    success: o.success,
    warning: o.warning,
    info: o.info,
    chart: o.chart.join(","),
  }
}

// Reads the Spectrum params from a URL query, normalized; missing = default.
export function spectrumParamsFromSearch(
  search: URLSearchParams
): SpectrumUrlParams {
  const raw: SpectrumUrlParams = { ...SPECTRUM_URL_DEFAULTS }

  for (const key of Object.keys(raw) as (keyof SpectrumUrlParams)[]) {
    const value = search.get(key)
    if (value === null) continue
    if (key === "step") raw.step = Number(value)
    else raw[key] = value
  }

  return fromSpectrumOptions(toSpectrumOptions(raw))
}
