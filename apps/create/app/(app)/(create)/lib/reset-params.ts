import { DEFAULT_CONFIG, type DesignSystemConfig } from "@/registry/config"
import { SPECTRUM_URL_DEFAULTS } from "@/app/(app)/(create)/lib/spectrum-params"

// Everything "Reset" writes: the preset's shadcn options plus default colors.
export function buildResetParams(
  current: Pick<DesignSystemConfig, "base" | "style" | "item">,
  preset: Pick<
    DesignSystemConfig,
    | "baseColor"
    | "theme"
    | "chartColor"
    | "iconLibrary"
    | "font"
    | "fontHeading"
    | "menuAccent"
    | "menuColor"
    | "radius"
  >
) {
  return {
    base: current.base,
    style: current.style,
    baseColor: preset.baseColor,
    theme: preset.theme,
    chartColor: preset.chartColor,
    iconLibrary: preset.iconLibrary,
    font: preset.font,
    fontHeading: preset.fontHeading,
    menuAccent: preset.menuAccent,
    menuColor: preset.menuColor,
    radius: preset.radius,
    template: DEFAULT_CONFIG.template,
    item: current.item,
    ...SPECTRUM_URL_DEFAULTS,
  }
}
