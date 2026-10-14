import Link from "next/link"

import { DesignerActions } from "@/components/designer-actions"
import { ModeSwitcher } from "@/components/mode-switcher"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="flex h-(--header-height) items-center px-6">
        <Link href="/create" className="font-semibold">
          Spectrum Create
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ModeSwitcher />
          <DesignerActions />
        </div>
      </div>
    </header>
  )
}
