import { clampChroma, converter, formatHex, wcagContrast, displayable } from "culori";
import { AA, CURVE, type Hue, type Neutral } from "./config.ts";

const toOklch = converter("oklch");
const toRgb = converter("rgb");

export type Mode = "light" | "dark";
export type Step = { L: number; C: number; h: number; hex: string };
export type Scale = {
  name: string;
  kind: "neutral" | "hue";
  steps: Step[]; // 12 bậc
  alpha: string[]; // 12 bậc dạng #rrggbbaa
  contrast: string; // màu chữ trên bậc 9
};

// ─── tiện ích màu ─────────────────────────────────────────────────────────
export function make(L: number, C: number, h: number): Step {
  const c = clampChroma({ mode: "oklch", l: L, c: C, h }, "oklch");
  const hex = formatHex(c)!;
  const o = toOklch(hex)!;
  return { L: o.l, C: o.c ?? 0, h: o.h ?? h, hex };
}

export const contrast = (a: string, b: string) => wcagContrast(a, b);

// Chroma lớn nhất còn nằm trong gamut sRGB tại (L, h)
function maxChroma(L: number, h: number) {
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 22; i++) {
    const m = (lo + hi) / 2;
    displayable({ mode: "oklch", l: L, c: m, h }) ? (lo = m) : (hi = m);
  }
  return lo;
}

// Tìm L sao cho màu đạt `target` trên `bg`, càng gần bg càng tốt
// (light mode: sáng nhất có thể; dark mode: tối nhất có thể).
function solveText(bg: string, target: number, C: number, h: number, mode: Mode): Step {
  let lo = 0, hi = 1, best: Step | null = null;
  for (let i = 0; i < 30; i++) {
    const L = (lo + hi) / 2;
    const s = make(L, Math.min(C, maxChroma(L, h)), h);
    const ok = contrast(s.hex, bg) >= target;
    if (mode === "light") ok ? ((best = s), (lo = L)) : (hi = L);
    else ok ? ((best = s), (hi = L)) : (lo = L);
  }
  return best ?? make(mode === "light" ? 0 : 1, 0, h);
}

// Bậc 11: đạt ngưỡng trên bậc 2 VÀ ≥ AA trên bậc 5 (nền active) → dùng được trên mọi nền 1–5.
// Bậc 12: đạt ngưỡng trên bậc 2.
function textSteps(steps: Step[], cv: (typeof CURVE)["light"], C: number, h: number, mode: Mode): Step[] {
  const pick = (a: Step, b: Step) => (mode === "light" ? (a.L < b.L ? a : b) : a.L > b.L ? a : b);
  const s11 = pick(
    solveText(steps[1].hex, cv.contrast[0], C * cv.textC[0], h, mode),
    solveText(steps[4].hex, AA + 0.05, C * cv.textC[0], h, mode),
  );
  const s12 = solveText(steps[1].hex, cv.contrast[1], C * cv.textC[1], h, mode);
  return [s11, s12];
}

// ─── alpha: "color to alpha" chính xác trên nền cho trước ───────────────────
export function toAlpha(target: string, bg: string): string {
  const t = toRgb(target)!, b = toRgb(bg)!;
  const T = [t.r, t.g, t.b], B = [b.r, b.g, b.b];
  let a = 0;
  for (let i = 0; i < 3; i++) {
    const d = T[i] - B[i];
    if (Math.abs(d) < 1e-6) continue;
    const F = d > 0 ? 1 : 0;
    a = Math.max(a, d / (F - B[i]));
  }
  a = Math.min(1, Math.ceil(a * 255) / 255);
  if (a === 0) return formatHex(b) + "00";
  const F = T.map((v, i) => Math.min(1, Math.max(0, B[i] + (v - B[i]) / a)));
  const hex = formatHex({ mode: "rgb", r: F[0], g: F[1], b: F[2] })!;
  return hex + Math.round(a * 255).toString(16).padStart(2, "0");
}

// ─── bậc 9: chỉnh L tới khi màu chữ tương ứng đạt AA ──────────────────────
const WHITE = "#ffffff";
function darkInk(h: number) {
  return make(0.21, 0.035, h).hex;
}

function solveSolid(hue: Hue): { solid: Step; ink: string } {
  const ink = hue.fg === "light" ? WHITE : darkInk(hue.h);
  let L = hue.L;
  let s = make(L, hue.C, hue.h);
  // chữ trắng → hạ L; chữ tối → nâng L
  const dir = hue.fg === "light" ? -1 : 1;
  // chữ tối: cần thêm biên để bậc 10 (tối hơn 0.035) vẫn đạt AA
  const ok = (L: number) =>
    contrast(make(L, hue.C, hue.h).hex, ink) >= AA &&
    (hue.fg === "light" || contrast(make(L - 0.035, hue.C, hue.h).hex, ink) >= AA);
  for (let i = 0; i < 200 && !ok(L); i++) {
    L += dir * 0.0025;
    s = make(L, hue.C, hue.h);
  }
  return { solid: s, ink };
}

// ─── sinh thang ───────────────────────────────────────────────────────────
export function hueScale(hue: Hue, mode: Mode, alphaBg: string): Scale {
  const cv = CURVE[mode];
  const { solid, ink } = solveSolid(hue);
  const steps: Step[] = cv.L.map((L, i) => make(L, hue.C * cv.C[i], hue.h));

  // bậc 9 giữ nguyên ở cả 2 mode (giống Radix); bậc 10 = hover
  steps.push(solid);
  // hover luôn tối hơn bậc 9 (bậc 9 đã chừa biên cho chữ tối)
  steps.push(make(solid.L - 0.035, hue.C, hue.h));

  // bậc 11–12: giải theo tương phản trên bậc 2
  const th = mode === "light" ? hue.h + (hue.textShift ?? 0) : hue.h;
  steps.push(...textSteps(steps, cv, hue.C, th, mode));

  return {
    name: hue.name,
    kind: "hue",
    steps,
    alpha: steps.map((s) => toAlpha(s.hex, alphaBg)),
    contrast: ink,
  };
}

export function neutralScale(n: Neutral, mode: Mode, alphaBg: string): Scale {
  const cv = CURVE[mode];
  // neutral: chroma theo đường cong nhưng chuẩn hoá về C rất nhỏ
  const peak = n.C;
  const shape = (i: number) => peak * Math.min(1, cv.C[i] / 0.6);
  const steps: Step[] = cv.L.map((L, i) => make(L, shape(i), n.h));
  // bậc 9–10: xám trung tính dùng làm "solid" phụ
  // bậc 9 neutral: hạ L tới khi chữ trắng đạt AA (+ biên nhỏ)
  let L9 = 0.62;
  while (contrast(make(L9, peak, n.h).hex, WHITE) < AA + 0.05) L9 -= 0.0025;
  steps.push(make(L9, peak, n.h));
  steps.push(make(L9 - 0.04, peak, n.h)); // hover tối hơn → giữ tương phản với chữ trắng
  steps.push(...textSteps(steps, cv, peak / cv.textC[0], n.h, mode));
  return {
    name: n.name,
    kind: "neutral",
    steps,
    alpha: steps.map((s) => toAlpha(s.hex, alphaBg)),
    contrast: WHITE,
  };
}

export const fmt = (s: Step) =>
  `oklch(${(s.L * 100).toFixed(1)}% ${s.C.toFixed(4)} ${(s.h || 0).toFixed(1)})`;
