import { describe, expect, it } from "vitest"

import {
  decodeHistoryEntry,
  historyEntryFromSearch,
} from "./history-entry"
import { buildResetParams } from "./reset-params"
import { SPECTRUM_URL_DEFAULTS } from "./spectrum-params"
import { DEFAULT_CONFIG } from "@/registry/config"

const entry = (q: string) => historyEntryFromSearch(new URLSearchParams(q))

describe("history entries", () => {
  it("changes when only a color param changes", () => {
    expect(entry("preset=b0&primary=2563eb")).not.toBe(entry("preset=b0"))
    expect(entry("preset=b0&harmony=x&primary=2563eb")).not.toBe(
      entry("preset=b0&harmony=triadic&primary=2563eb")
    )
  })

  it("is stable across spellings of the same colors", () => {
    expect(entry("preset=b0&neutral=gray&step=9")).toBe(entry("preset=b0"))
    expect(entry("preset=b0&primary=2563EB")).toBe(
      entry("preset=b0&primary=2563eb")
    )
  })

  it("restores both preset and colors", () => {
    const { preset, spectrum } = decodeHistoryEntry(
      entry("preset=b18OWG&primary=2563eb&neutral=slate")
    )
    expect(preset).toBe("b18OWG")
    expect(spectrum).toEqual({
      ...SPECTRUM_URL_DEFAULTS,
      primary: "2563eb",
      neutral: "slate",
    })
  })

  it("decodes the initial empty entry to no preset and default colors", () => {
    expect(decodeHistoryEntry("")).toEqual({
      preset: "",
      spectrum: SPECTRUM_URL_DEFAULTS,
    })
  })
})

describe("buildResetParams", () => {
  it("also resets Spectrum colors to defaults", () => {
    const p = buildResetParams(
      { base: "base", style: "nova", item: "preview-02" },
      DEFAULT_CONFIG
    )
    expect(p).toMatchObject(SPECTRUM_URL_DEFAULTS)
    expect(p.style).toBe("nova")
  })
})
