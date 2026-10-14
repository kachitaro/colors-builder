"use client"

import * as React from "react"
import { buildSpectrum } from "spectrum-colors/core"

import { copyToClipboardWithMeta } from "@/components/copy-button"
import { Button } from "@/styles/base-nova/ui/button"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"
import { toSpectrumOptions } from "@/app/(app)/(create)/lib/spectrum-params"

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/css" }))
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

// Exports exactly what `bun run build` writes for the same options:
// colors.css (scales) and theme.css (shadcn tokens + Tailwind v4 @theme).
export function ExportCss() {
  const [params] = useDesignSystemSearchParams()
  const [copied, setCopied] = React.useState(false)
  const build = () => buildSpectrum(toSpectrumOptions(params))

  return (
    <>
      <Button
        variant="outline"
        className="hidden md:flex"
        onClick={() => {
          const r = build()
          copyToClipboardWithMeta(`${r.colorsCss}\n${r.themeCss}`)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? "Copied" : "Copy CSS"}
      </Button>
      <Button
        className="hidden md:flex"
        onClick={() => {
          const r = build()
          download("colors.css", r.colorsCss)
          download("theme.css", r.themeCss)
        }}
      >
        Download CSS
      </Button>
    </>
  )
}
