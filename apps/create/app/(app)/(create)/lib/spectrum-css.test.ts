import { describe, expect, test } from "vitest"
import { buildSpectrum, DEFAULT_OPTIONS } from "spectrum-colors/core"

import { spectrumThemeCss } from "@/app/(app)/(create)/lib/spectrum-css"

const o = { ...DEFAULT_OPTIONS, neutral: "sand", primary: "#2563eb" }

describe("spectrumThemeCss", () => {
  const { css, audit } = spectrumThemeCss(o)
  const built = buildSpectrum(o)

  test("contains every semantic token declaration of theme.css", () => {
    const semantic = built.themeCss.slice(
      0,
      built.themeCss.indexOf("/* Tailwind v4 */")
    )
    const decls = semantic.match(/^ {2}--[a-z0-9-]+: var\(--[^)]+\);$/gm) ?? []
    expect(decls.length).toBeGreaterThan(40)
    for (const d of decls) expect(css).toContain(d)
  })

  test("contains the raw scales, light and dark", () => {
    expect(css).toContain("--brand-9:")
    expect(css).toContain(".dark {")
    expect(css).toContain(":root, .light {")
  })

  test("does not override --radius or emit Tailwind at-rules", () => {
    expect(css).not.toContain("--radius")
    expect(css).not.toContain("@theme")
    expect(css).not.toContain("@custom-variant")
  })

  test("reports the audit and passes for this config", () => {
    expect(audit.fails).toHaveLength(0)
    expect(audit.rows.length).toBe(built.audit.rows.length)
  })

  test("same options return the cached result", () => {
    expect(spectrumThemeCss({ ...o }).css).toBe(css)
  })
})
