"use client"

import * as React from "react"
import { HARMONY, HUES, NEUTRALS } from "spectrum-colors/core"

import { LockButton } from "@/app/(app)/(create)/components/lock-button"
import {
  Picker,
  PickerContent,
  PickerGroup,
  PickerRadioGroup,
  PickerRadioItem,
  PickerSeparator,
  PickerTrigger,
} from "@/app/(app)/(create)/components/picker"
import { usePreviewOverride } from "@/app/(app)/(create)/components/preview-override"
import { useDesignSystemSearchParams } from "@/app/(app)/(create)/lib/search-params"
import {
  SPECTRUM_URL_DEFAULTS,
  toSpectrumOptions,
  type SpectrumUrlParams,
} from "@/app/(app)/(create)/lib/spectrum-params"

type PickerProps = {
  isMobile: boolean
  anchorRef: React.RefObject<HTMLDivElement | null>
}

const hueSwatch = (name: string) => {
  const h = HUES.find((x) => x.name === name)
  if (h) return `oklch(${h.L} ${h.C} ${h.h})`
  const n = NEUTRALS.find((x) => x.name === name)
  return n ? `oklch(0.6 ${Math.max(n.C * 4, 0.01)} ${n.h})` : "transparent"
}

const Swatch = ({ color }: { color: string }) => (
  <span
    aria-hidden
    className="inline-block size-3 shrink-0 rounded-full border border-foreground/10"
    style={{ background: color }}
  />
)

const toParam = (param: keyof SpectrumUrlParams, v: string) =>
  param === "step" ? Number(v) : v

type Option = { value: string; label: string; color?: string }

// One dropdown that writes a single Spectrum URL param.
function SpectrumSelect({
  label,
  param,
  options,
  value,
  display,
  swatch,
  disabled,
  lock,
  isMobile,
  anchorRef,
}: PickerProps & {
  label: string
  param: keyof SpectrumUrlParams
  options: Option[]
  value: string
  display: string
  swatch?: string
  disabled?: boolean
  lock?: boolean
}) {
  const [, setParams] = useDesignSystemSearchParams()
  const { setOverride, clearOverride } = usePreviewOverride()

  return (
    <div className="group/picker relative">
      <Picker onOpenChange={(open) => !open && clearOverride()}>
        <PickerTrigger disabled={disabled}>
          <div className="flex flex-col justify-start text-left">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-medium text-foreground">{display}</div>
          </div>
          {swatch && (
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 md:right-2.5">
              <Swatch color={swatch} />
            </span>
          )}
        </PickerTrigger>
        <PickerContent
          anchor={isMobile ? anchorRef : undefined}
          side={isMobile ? "top" : "right"}
          align={isMobile ? "center" : "start"}
          className="max-h-92"
          onMouseLeave={clearOverride}
        >
          <PickerRadioGroup
            value={value}
            onValueChange={(v) => setParams({ [param]: toParam(param, v) })}
            onItemPreview={
              isMobile ? undefined : (v) => setOverride({ [param]: toParam(param, v) })
            }
          >
            <PickerGroup>
              {options.map((o) => (
                <PickerRadioItem
                  key={o.value}
                  value={o.value}
                  closeOnClick={isMobile}
                >
                  <span className="flex items-center gap-2">
                    {o.color && <Swatch color={o.color} />}
                    {o.label}
                  </span>
                </PickerRadioItem>
              ))}
            </PickerGroup>
          </PickerRadioGroup>
        </PickerContent>
      </Picker>
      {lock && (
        <LockButton
          param="spectrum"
          className="absolute top-1/2 right-8 -translate-y-1/2"
        />
      )}
    </div>
  )
}

const HEX6 = /^#?[0-9a-f]{6}$/i

function HexField({ value }: { value: string }) {
  const [, setParams] = useDesignSystemSearchParams()
  const isHex = HEX6.test(value)
  const [text, setText] = React.useState(isHex ? `#${value}` : "")

  React.useEffect(() => {
    setText(HEX6.test(value) ? `#${value}` : "")
  }, [value])

  const commit = (v: string) => {
    if (HEX6.test(v.trim())) {
      setParams({ primary: v.trim().replace(/^#/, "").toLowerCase() })
    } else {
      setText(isHex ? `#${value}` : "")
    }
  }

  return (
    <label className="flex flex-col gap-1 text-left">
      <span className="text-xs text-muted-foreground">Primary hex</span>
      <input
        type="text"
        value={text}
        placeholder="#2563eb"
        spellCheck={false}
        aria-label="Primary hex color"
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit(e.currentTarget.value)}
        className="h-8 rounded-md border bg-transparent px-2 font-mono text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-foreground/60"
      />
    </label>
  )
}

const HUE_OPTIONS: Option[] = HUES.map((h) => ({
  value: h.name,
  label: h.name,
  color: hueSwatch(h.name),
}))

function NativeHue({
  label,
  param,
  value,
}: {
  label: string
  param: keyof SpectrumUrlParams
  value: string
}) {
  const [, setParams] = useDesignSystemSearchParams()
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => setParams({ [param]: e.target.value })}
        className="h-7 w-28 rounded-md border bg-card px-1 text-sm text-foreground"
      >
        {HUES.map((h) => (
          <option key={h.name} value={h.name}>
            {h.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function ChartField({ chart }: { chart: string }) {
  const [, setParams] = useDesignSystemSearchParams()
  const items = toSpectrumOptions({ ...SPECTRUM_URL_DEFAULTS, chart }).chart
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">Chart colors</span>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((c, i) => (
          <select
            key={i}
            aria-label={`Chart color ${i + 1}`}
            value={c}
            onChange={(e) =>
              setParams({
                chart: items
                  .map((x, j) => (j === i ? e.target.value : x))
                  .join(","),
              })
            }
            className="h-7 rounded-md border bg-card px-1 text-sm text-foreground"
          >
            {HUES.map((h) => (
              <option key={h.name} value={h.name}>
                {h.name}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  )
}

export function SpectrumPicker(props: PickerProps) {
  const [params, setParams] = useDesignSystemSearchParams()
  const o = toSpectrumOptions(params)
  const neutralPrimary = o.primary === "neutral"

  return (
    <>
      <SpectrumSelect
        {...props}
        label="Neutral"
        param="neutral"
        value={o.neutral}
        display={o.neutral}
        swatch={hueSwatch(o.neutral)}
        options={NEUTRALS.map((n) => ({
          value: n.name,
          label: n.name,
          color: hueSwatch(n.name),
        }))}
      />
      <SpectrumSelect
        {...props}
        lock
        label="Primary"
        param="primary"
        value={o.primary}
        display={o.primary}
        swatch={
          o.primary.startsWith("#")
            ? o.primary
            : neutralPrimary
              ? hueSwatch(o.neutral)
              : hueSwatch(o.primary)
        }
        options={[
          { value: "neutral", label: "neutral (black / white)" },
          ...HUE_OPTIONS,
        ]}
      />
      <HexField value={params.primary} />
      <SpectrumSelect
        {...props}
        label="Primary step"
        param="step"
        value={String(o.primaryStep)}
        display={String(o.primaryStep)}
        disabled={neutralPrimary}
        options={Array.from({ length: 12 }, (_, i) => ({
          value: String(i + 1),
          label: String(i + 1),
        }))}
      />
      <SpectrumSelect
        {...props}
        label="Harmony"
        param="harmony"
        value={o.harmony}
        display={o.harmony || "none"}
        disabled={neutralPrimary}
        options={[
          { value: "", label: "none" },
          ...Object.keys(HARMONY).map((k) => ({ value: k, label: k })),
        ]}
      />
      <PickerSeparator />
      <details className="group/adv rounded-md text-left">
        <summary className="cursor-pointer text-xs text-muted-foreground select-none">
          Status &amp; chart colors
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <NativeHue label="Destructive" param="destructive" value={o.destructive} />
          <NativeHue label="Success" param="success" value={o.success} />
          <NativeHue label="Warning" param="warning" value={o.warning} />
          <NativeHue label="Info" param="info" value={o.info} />
          <ChartField chart={params.chart} />
          <button
            type="button"
            className="self-start text-xs underline underline-offset-4"
            onClick={() =>
              setParams({
                destructive: SPECTRUM_URL_DEFAULTS.destructive,
                success: SPECTRUM_URL_DEFAULTS.success,
                warning: SPECTRUM_URL_DEFAULTS.warning,
                info: SPECTRUM_URL_DEFAULTS.info,
                chart: SPECTRUM_URL_DEFAULTS.chart,
              })
            }
          >
            Reset status &amp; chart
          </button>
        </div>
      </details>
    </>
  )
}
