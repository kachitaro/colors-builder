import {
  SPECTRUM_URL_DEFAULTS,
  spectrumParamsFromSearch,
  type SpectrumUrlParams,
} from "@/app/(app)/(create)/lib/spectrum-params"

// One undo/redo entry = shadcn preset code + Spectrum colors (the preset code
// no longer carries colors). Stored as a string so equal states compare equal.
export function historyEntryFromSearch(search: URLSearchParams) {
  return JSON.stringify({
    preset: search.get("preset") ?? "",
    spectrum: spectrumParamsFromSearch(search),
  })
}

export function decodeHistoryEntry(entry: string): {
  preset: string
  spectrum: SpectrumUrlParams
} {
  // "" is the initial entry, before the URL has been read.
  if (!entry) {
    return { preset: "", spectrum: SPECTRUM_URL_DEFAULTS }
  }
  return JSON.parse(entry)
}
