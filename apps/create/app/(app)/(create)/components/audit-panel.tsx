"use client"

import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"
import { spectrumThemeCss } from "@/app/(app)/(create)/lib/spectrum-css"
import { toSpectrumOptions } from "@/app/(app)/(create)/lib/spectrum-params"

// WCAG contrast audit of the colors currently being previewed.
export function AuditPanel() {
  const [params] = useDesignSystemSearchParams()
  const { audit } = spectrumThemeCss(toSpectrumOptions(params))
  const failing = audit.fails.length > 0

  return (
    <details
      open={failing}
      className="rounded-md text-left"
      data-audit={failing ? "fail" : "pass"}
    >
      <summary className="cursor-pointer text-xs text-muted-foreground select-none">
        Contrast audit:{" "}
        <span className={failing ? "text-destructive-text" : "text-success-text"}>
          {failing ? `${audit.fails.length} failing` : "all pass"}
        </span>{" "}
        ({audit.rows.length} pairs)
      </summary>
      <div className="mt-2 flex flex-col gap-1 text-xs text-foreground">
        {audit.fails.map((r, i) => (
          <div key={i} className="flex justify-between gap-2 font-mono">
            <span className="truncate">
              {r.mode} {r.where} {r.pair}
            </span>
            <span>
              {r.ratio.toFixed(2)} &lt; {r.need}
            </span>
          </div>
        ))}
        <div className="text-muted-foreground">
          {audit.infos.length} pairs under 3:1 (informational), min chart ΔE{" "}
          {audit.minChartDE.toFixed(3)}
        </div>
      </div>
    </details>
  )
}
