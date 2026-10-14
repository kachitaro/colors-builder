"use client"

import * as React from "react"
import { Share03Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { copyToClipboardWithMeta } from "@/components/copy-button"
import { Button } from "@/styles/base-nova/ui/button"
import { usePresetCode } from "@/app/(app)/(create)/hooks/use-design-system"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"
import { buildShareUrl } from "@/app/(app)/(create)/lib/share-link"
import {
  fromSpectrumOptions,
  toSpectrumOptions,
} from "@/app/(app)/(create)/lib/spectrum-params"

export function ShareButton() {
  const [params] = useDesignSystemSearchParams()
  const presetCode = usePresetCode()
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [hasCopied])

  const handleCopy = React.useCallback(() => {
    const shareUrl = buildShareUrl(
      window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH ?? ""),
      {
        preset: presetCode,
        item: params.item,
        pointer: params.pointer,
        spectrum: fromSpectrumOptions(toSpectrumOptions(params)),
      }
    )
    copyToClipboardWithMeta(shareUrl, {
      name: "copy_create_share_url",
      properties: {
        url: shareUrl,
      },
    })
    setHasCopied(true)
  }, [params, presetCode])

  return (
    <Button variant="outline" className="hidden md:flex" onClick={handleCopy}>
      {hasCopied ? (
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
      ) : (
        <HugeiconsIcon
          icon={Share03Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
      )}
      Share
    </Button>
  )
}
