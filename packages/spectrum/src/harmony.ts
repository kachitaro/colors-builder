// Từ một mã màu bất kì → Hue nguồn cho bộ sinh thang, và các màu phụ theo quy tắc bánh xe màu.
// Góc tính trên hue OKLCH (không phải HSL), nên "đối diện" ở đây là đối diện theo cảm nhận.
import { converter } from "culori";
import { contrast } from "./scale.ts";
import type { Hue } from "./config.ts";

const toOklch = converter("oklch");

export const HARMONY = {
  complementary: [180], // đối diện: giật thị giác tối đa, dùng cho CTA/badge
  split: [150, 210], // hai màu cạnh màu đối diện: tương phản mạnh nhưng êm hơn
  analogous: [-30, 30], // liền kề: liền mạch, ít căng mắt
  triadic: [120, 240], // tam giác đều: nhiều danh mục mà vẫn hài hoà
} as const;
export type Harmony = keyof typeof HARMONY;

// Vùng vàng/chartreuse: bậc 9 phải sáng + chữ tối (giống yellow/lime/amber trong config.ts)
const light = (h: number) => h >= 60 && h <= 135;

export function brandHue(hex: string): Hue {
  const o = toOklch(hex.startsWith("#") ? hex : `#${hex}`);
  if (!o) throw new Error(`Mã màu không hợp lệ: ${hex}`);
  const h = o.h ?? 0; // màu xám thuần không có hue
  return {
    name: "brand",
    h,
    L: o.l,
    C: o.c ?? 0,
    fg: contrast(hex, "#ffffff") >= contrast(hex, "#1a1a1a") ? "light" : "dark",
    textShift: light(h) ? -20 : 0,
  };
}

export function harmonyHues(base: Hue, kind: Harmony): Hue[] {
  return HARMONY[kind].map((d, i) => {
    const h = (base.h + d + 360) % 360;
    const w = light(h);
    // chroma theo màu chính nhưng giới hạn 0.12–0.19 để màu phụ không xỉn hoặc chói hơn thang Radix
    return { name: `brand-${i + 2}`, h, L: w ? 0.85 : 0.6, C: Math.min(Math.max(base.C, 0.12), 0.19), fg: w ? "dark" : "light", textShift: w ? -20 : 0 };
  });
}
