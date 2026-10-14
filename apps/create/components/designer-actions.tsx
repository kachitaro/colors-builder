"use client"

import { Suspense } from "react"

import { Separator } from "@/registry/new-york-v4/ui/separator"
import { ExportCss } from "@/app/(app)/(create)/components/export-css"
import { ShareButton } from "@/app/(app)/(create)/components/share-button"

export function DesignerActions() {
  return (
    <>
      <div className="hidden items-center gap-2 group-has-data-[slot=designer]/layout:md:flex">
        <Separator orientation="vertical" />
        <Suspense fallback={null}>
          <ShareButton />
        </Suspense>
        <Suspense fallback={null}>
          <ExportCss />
        </Suspense>
      </div>
    </>
  )
}
