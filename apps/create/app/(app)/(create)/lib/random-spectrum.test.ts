import { describe, expect, test } from "vitest"
import { buildSpectrum } from "spectrum-colors/core"

import { randomSpectrum } from "@/app/(app)/(create)/lib/random-spectrum"
import {
  fromSpectrumOptions,
  toSpectrumOptions,
} from "@/app/(app)/(create)/lib/spectrum-params"

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe("randomSpectrum", () => {
  test("never yields a configuration that fails the audit, and survives the URL", () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 50; seed++) {
      const o = randomSpectrum(mulberry32(seed))
      expect(buildSpectrum(o).audit.fails).toHaveLength(0)
      expect(toSpectrumOptions(fromSpectrumOptions(o))).toEqual(o)
      seen.add(JSON.stringify(o))
    }
    expect(seen.size).toBeGreaterThan(40)
  }, 60_000)
})
