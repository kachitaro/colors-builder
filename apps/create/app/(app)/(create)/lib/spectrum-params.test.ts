import { describe, expect, test } from "vitest"
import { DEFAULT_OPTIONS } from "spectrum-colors/core"

import {
  fromSpectrumOptions,
  toSpectrumOptions,
  type SpectrumUrlParams,
} from "@/app/(app)/(create)/lib/spectrum-params"

const defaults = fromSpectrumOptions(DEFAULT_OPTIONS)
const url = (p: Partial<SpectrumUrlParams>): SpectrumUrlParams => ({
  ...defaults,
  ...p,
})

describe("spectrum URL params", () => {
  test("round-trips a full configuration", () => {
    const o = {
      ...DEFAULT_OPTIONS,
      neutral: "sand",
      primary: "#2563eb",
      primaryStep: 10,
      harmony: "triadic" as const,
      destructive: "ruby",
      chart: ["blue", "red"],
    }
    expect(toSpectrumOptions(fromSpectrumOptions(o))).toEqual(o)
  })

  test("serializes hex primary without '#'", () => {
    expect(
      fromSpectrumOptions({ ...DEFAULT_OPTIONS, primary: "#2563eb" }).primary
    ).toBe("2563eb")
  })

  test("normalizes hex spellings, rejects short hex", () => {
    expect(toSpectrumOptions(url({ primary: "2563EB" })).primary).toBe("#2563eb")
    expect(toSpectrumOptions(url({ primary: "#2563EB" })).primary).toBe("#2563eb")
    expect(toSpectrumOptions(url({ primary: " 2563eb " })).primary).toBe("#2563eb")
    expect(toSpectrumOptions(url({ primary: "FFF" })).primary).toBe("neutral")
  })

  test("accepts a hue name as primary", () => {
    expect(toSpectrumOptions(url({ primary: "amber" })).primary).toBe("amber")
  })

  test("prototype keys are not valid names", () => {
    expect(toSpectrumOptions(url({ neutral: "constructor", primary: "toString", harmony: "valueOf" })).primary).toBe("neutral")
    expect(toSpectrumOptions(url({ neutral: "constructor" })).neutral).toBe("gray")
  })

  test("unknown values fall back to defaults", () => {
    const o = toSpectrumOptions(
      url({ neutral: "nope", harmony: "nope", step: 99, destructive: "zzz" })
    )
    expect(o.neutral).toBe("gray")
    expect(o.harmony).toBe("")
    expect(o.primaryStep).toBe(9)
    expect(o.destructive).toBe("red")
    expect(toSpectrumOptions(url({ step: Number.NaN })).primaryStep).toBe(9)
    expect(toSpectrumOptions(url({ step: 0 })).primaryStep).toBe(9)
  })

  test("harmony is ignored when primary is neutral", () => {
    expect(
      toSpectrumOptions(url({ primary: "neutral", harmony: "triadic" })).harmony
    ).toBe("")
    expect(
      toSpectrumOptions(url({ primary: "2563eb", harmony: "triadic" })).harmony
    ).toBe("triadic")
  })

  test("chart drops unknown entries; empty falls back to default", () => {
    expect(toSpectrumOptions(url({ chart: "blue,nope,red" })).chart).toEqual([
      "blue",
      "red",
    ])
    expect(toSpectrumOptions(url({ chart: "nope" })).chart).toEqual(
      DEFAULT_OPTIONS.chart
    )
    expect(toSpectrumOptions(url({ chart: "" })).chart).toEqual(
      DEFAULT_OPTIONS.chart
    )
  })
})

describe("chart length", () => {
  test("a long chart list is capped, not processed unbounded", () => {
    const o = toSpectrumOptions(url({ chart: "blue,".repeat(60) }))
    expect(o.chart.length).toBeLessThanOrEqual(DEFAULT_OPTIONS.chart.length)
  })
})
