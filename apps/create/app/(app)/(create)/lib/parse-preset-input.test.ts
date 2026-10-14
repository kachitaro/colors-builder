import { describe, expect, it } from "vitest"
import { DEFAULT_OPTIONS } from "spectrum-colors/core"

import { parsePresetInput } from "./parse-preset-input"
import { buildShareUrl } from "./share-link"
import { fromSpectrumOptions, SPECTRUM_URL_DEFAULTS } from "./spectrum-params"

const custom = fromSpectrumOptions({
  ...DEFAULT_OPTIONS,
  neutral: "sand",
  primary: "#2563eb",
  primaryStep: 10,
  harmony: "triadic",
  chart: ["blue", "red"],
})

describe("parsePresetInput", () => {
  it("accepts a raw preset code, with default colors", () => {
    expect(parsePresetInput("b18OWG")).toEqual({
      preset: "b18OWG",
      spectrum: SPECTRUM_URL_DEFAULTS,
    })
  })

  it("accepts a --preset flag", () => {
    expect(parsePresetInput(" --preset b0 ")?.preset).toBe("b0")
  })

  it("rejects invalid preset input", () => {
    expect(parsePresetInput("open sesame")).toBeNull()
    expect(parsePresetInput("https://x.test/create?preset=nope!")).toBeNull()
    expect(parsePresetInput("https://x.test/create")).toBeNull()
  })

  it("round-trips a share link: shadcn preset and spectrum colors", () => {
    const url = buildShareUrl("https://x.test", {
      preset: "b18OWG",
      item: "preview-02",
      pointer: false,
      spectrum: custom,
    })
    expect(parsePresetInput(url)).toEqual({ preset: "b18OWG", spectrum: custom })
  })

  it("normalizes colors read from a link (hex case, unknown hue)", () => {
    const parsed = parsePresetInput(
      "https://x.test/create?preset=b0&primary=2563EB&neutral=nope&step=99"
    )
    expect(parsed?.spectrum.primary).toBe("2563eb")
    expect(parsed?.spectrum.neutral).toBe("gray")
    expect(parsed?.spectrum.step).toBe(9)
  })

  it("link without color params means default colors", () => {
    expect(parsePresetInput("https://x.test/create?preset=b18OWG")?.spectrum).toEqual(
      SPECTRUM_URL_DEFAULTS
    )
  })
})

describe("buildShareUrl", () => {
  it("omits color params that equal the defaults", () => {
    const url = new URL(
      buildShareUrl("https://x.test", {
        preset: "b0",
        item: "preview-02",
        pointer: false,
        spectrum: SPECTRUM_URL_DEFAULTS,
      })
    )
    expect([...url.searchParams.keys()].sort()).toEqual(["item", "preset"])
  })

  it("includes only changed color params, hex without '#'", () => {
    const url = new URL(
      buildShareUrl("https://x.test", {
        preset: "b0",
        item: "preview-02",
        pointer: true,
        spectrum: { ...SPECTRUM_URL_DEFAULTS, primary: "2563eb", harmony: "split" },
      })
    )
    expect(url.pathname).toBe("/create")
    expect(url.searchParams.get("primary")).toBe("2563eb")
    expect(url.searchParams.get("harmony")).toBe("split")
    expect(url.searchParams.get("pointer")).toBe("true")
    expect(url.searchParams.has("neutral")).toBe(false)
  })
})
