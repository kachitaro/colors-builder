"use client"

import * as React from "react"
import { decodePreset } from "shadcn/preset"

import {
  type FontHeadingValue,
  type FontValue,
  type IconLibraryName,
  type MenuAccentValue,
  type MenuColorValue,
  type RadiusValue,
  type StyleName,
} from "@/registry/config"
import { useLocks } from "@/app/(app)/(create)/hooks/use-locks"
import { getPresetCode } from "@/app/(app)/(create)/lib/preset-code"
import { randomSpectrum } from "@/app/(app)/(create)/lib/random-spectrum"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"
import { fromSpectrumOptions } from "@/app/(app)/(create)/lib/spectrum-params"
import { SHUFFLE_PRESETS } from "@/app/(app)/(create)/lib/shuffle-presets"

function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function useRandom() {
  const { locks } = useLocks()
  const [params, setParams] = useDesignSystemSearchParams()

  const paramsRef = React.useRef(params)
  React.useEffect(() => {
    paramsRef.current = params
  }, [params])

  // Picks a random preset from the curated list instead of true random.
  // Locked params are preserved over the decoded preset values.
  const randomize = React.useCallback(() => {
    // Avoid re-picking the preset that is currently applied.
    const currentCode = getPresetCode(paramsRef.current)
    const availableCodes = SHUFFLE_PRESETS.filter(
      (code) => code !== currentCode
    )
    const decoded = decodePreset(
      randomItem(availableCodes.length > 0 ? availableCodes : SHUFFLE_PRESETS)
    )

    if (!decoded) {
      return
    }

    const current = paramsRef.current
    const spectrum = locks.has("spectrum")
      ? {}
      : fromSpectrumOptions(randomSpectrum(Math.random))

    const nextParams = {
      style: locks.has("style") ? current.style : (decoded.style as StyleName),
      iconLibrary: locks.has("iconLibrary")
        ? current.iconLibrary
        : (decoded.iconLibrary as IconLibraryName),
      font: locks.has("font") ? current.font : (decoded.font as FontValue),
      fontHeading: locks.has("fontHeading")
        ? current.fontHeading
        : (decoded.fontHeading as FontHeadingValue),
      menuAccent: locks.has("menuAccent")
        ? current.menuAccent
        : (decoded.menuAccent as MenuAccentValue),
      menuColor: locks.has("menuColor")
        ? current.menuColor
        : (decoded.menuColor as MenuColorValue),
      radius: locks.has("radius")
        ? current.radius
        : (decoded.radius as RadiusValue),
      ...spectrum,
    }

    // Keep the ref in sync so rapid repeats use the latest randomized state
    // even before the URL state finishes committing.
    paramsRef.current = {
      ...paramsRef.current,
      ...nextParams,
    }

    setParams(nextParams)
  }, [setParams, locks])

  const randomizeRef = React.useRef(randomize)
  React.useEffect(() => {
    randomizeRef.current = randomize
  }, [randomize])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "r" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        randomizeRef.current()
      }
    }

    document.addEventListener("keydown", down)
    return () => {
      document.removeEventListener("keydown", down)
    }
  }, [])

  return { randomize }
}
