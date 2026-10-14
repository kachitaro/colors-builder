import { describe, expect, it } from "vitest"

import { DEFAULT_CONFIG } from "@/registry/config"

import { buildPresetUrlUpdate, resolvePresetParams } from "./search-params"
import { SPECTRUM_URL_DEFAULTS } from "./spectrum-params"

describe("buildPresetUrlUpdate", () => {
  it("encodes design system params into preset and clears individual keys", () => {
    const update = buildPresetUrlUpdate({
      ...DEFAULT_CONFIG,
      ...SPECTRUM_URL_DEFAULTS,
      preset: "b0",
      template: "next",
      item: "preview-02",
      size: 100,
      custom: false,
    })

    expect(update.preset).toBeTypeOf("string")
    expect(update.style).toBeNull()
    expect(update.theme).toBeNull()
    expect(update.baseColor).toBeNull()
  })

  it("preserves template when syncing preset from ?template=start", () => {
    const update = buildPresetUrlUpdate({
      ...DEFAULT_CONFIG,
      ...SPECTRUM_URL_DEFAULTS,
      preset: "b0",
      template: "start",
      item: "preview-02",
      size: 100,
      custom: false,
    })

    expect(update.template).toBe("start")
    expect(update.preset).toBeTypeOf("string")
  })

  it("applies non-design-system updates from resolvedUpdates", () => {
    const update = buildPresetUrlUpdate(
      {
        ...DEFAULT_CONFIG,
        ...SPECTRUM_URL_DEFAULTS,
        preset: "b0",
        template: "next",
        item: "preview-02",
        size: 100,
        custom: false,
      },
      { template: "vite" }
    )

    expect(update.template).toBe("vite")
  })
})

describe("spectrum color params", () => {
  const raw = {
    ...DEFAULT_CONFIG,
    ...SPECTRUM_URL_DEFAULTS,
    preset: "b18OWG",
    template: "next" as const,
    item: "preview-02",
    size: 100,
    custom: false,
    neutral: "sand",
    primary: "2563eb",
    harmony: "triadic",
  }

  it("keeps spectrum params out of the shadcn preset code but in the URL", () => {
    const update = buildPresetUrlUpdate(raw)
    expect(update.primary).toBe("2563eb")
    expect(update.neutral).toBe("sand")
    expect(update.harmony).toBe("triadic")
  })

  it("pins shadcn base color, theme and chart color to defaults", () => {
    const params = resolvePresetParams(raw, new URLSearchParams())
    expect(params.baseColor).toBe(DEFAULT_CONFIG.baseColor)
    expect(params.theme).toBe(DEFAULT_CONFIG.theme)
    expect(params.chartColor).toBe(DEFAULT_CONFIG.chartColor)
    expect(params.primary).toBe("2563eb")
  })
})
