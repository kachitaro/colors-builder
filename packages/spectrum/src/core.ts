// Lõi sinh màu thuần: không đọc argv, không ghi file. Chạy được trong Node, Bun và trình duyệt.
import { differenceEuclidean } from "culori";
import { AA, HUES, NEUTRALS, NON_TEXT, type Hue } from "./config.ts";
import { brandHue, HARMONY, harmonyHues, type Harmony } from "./harmony.ts";
import { contrast, fmt, hueScale, neutralScale, type Mode, type Scale } from "./scale.ts";

// độ phân biệt giữa các màu chart (ΔE OKLab)
const dE = differenceEuclidean("oklab");
const CHART_MIN_DE = 0.08;
const MODES: Mode[] = ["light", "dark"];

export type SpectrumOptions = {
  neutral: string;
  /** "neutral" = kiểu shadcn mặc định (đen/trắng); tên hue; hoặc mã "#rrggbb" (sinh thang "brand"). */
  primary: string;
  /** bậc dùng cho primary khi primary là một hue (1–12) */
  primaryStep: number;
  destructive: string;
  success: string;
  warning: string;
  info: string;
  chart: string[];
  /** sinh thêm thang brand-2, brand-3 làm màu phụ */
  harmony: "" | Harmony;
};

export const DEFAULT_OPTIONS: SpectrumOptions = {
  neutral: "gray",
  primary: "neutral",
  primaryStep: 9,
  destructive: "red",
  success: "green",
  warning: "amber",
  info: "blue",
  chart: ["blue", "orange", "teal", "violet", "pink", "grass", "red", "brown"],
  harmony: "",
};

export type AuditRow = { mode: Mode; where: string; pair: string; ratio: number; need: number; kind: "text" | "ui" | "info" };

export type SpectrumResult = {
  colorsCss: string;
  themeCss: string;
  auditMd: string;
  tokens: unknown;
  /** thang đã sinh, theo mode (cho preview/UI) */
  scales: Record<Mode, Scale[]>;
  audit: { rows: AuditRow[]; fails: AuditRow[]; infos: AuditRow[]; minChartDE: number; closeChart: { mode: Mode; a: string; b: string; d: number }[] };
};

type RefMap = Record<string, string>;

export function buildSpectrum(input: Partial<SpectrumOptions> = {}): SpectrumResult {
  const OPT: SpectrumOptions = { ...DEFAULT_OPTIONS, ...input };

  // primary "#rrggbb" sinh thang "brand"; harmony sinh thêm brand-2, brand-3.
  const extra: Hue[] = [];
  const base = /^#?[0-9a-f]{6}$/i.test(OPT.primary) ? brandHue(OPT.primary) : HUES.find((h) => h.name === OPT.primary);
  if (base?.name === "brand") (extra.push(base), (OPT.primary = "brand"));
  if (OPT.harmony) {
    if (!(OPT.harmony in HARMONY)) throw new Error(`harmony phải là một trong: ${Object.keys(HARMONY).join(", ")}`);
    if (!base) throw new Error("harmony cần primary là mã hex hoặc tên một hue (không dùng được với neutral)");
    extra.push(...harmonyHues(base, OPT.harmony));
  }
  const SECONDARY = extra.filter((h) => h.name !== "brand").map((h) => h.name);

  // ─── sinh toàn bộ thang ─────────────────────────────────────────────────
  const scales: Record<Mode, Scale[]> = { light: [], dark: [] };
  for (const mode of MODES) {
    // nền tham chiếu cho alpha: trắng (light) / bậc 1 của gray dark
    const gray = neutralScale(NEUTRALS[0], mode, "#ffffff");
    const alphaBg = mode === "light" ? "#ffffff" : gray.steps[0].hex;
    for (const n of NEUTRALS) scales[mode].push(neutralScale(n, mode, alphaBg));
    for (const h of [...HUES, ...extra]) scales[mode].push(hueScale(h, mode, alphaBg));
  }
  const find = (mode: Mode, name: string) => {
    const s = scales[mode].find((x) => x.name === name);
    if (!s) throw new Error(`Không có thang "${name}"`);
    return s;
  };
  const resolve = (mode: Mode, ref: string) => {
    const [name, step] = [ref.slice(0, ref.lastIndexOf("-")), ref.slice(ref.lastIndexOf("-") + 1)];
    const s = find(mode, name);
    return step === "contrast" ? s.contrast : s.steps[+step - 1].hex;
  };

  // ─── tầng ngữ nghĩa (shadcn) ────────────────────────────────────────────
  // Giá trị là tham chiếu "<thang>-<bậc>" hoặc "<thang>-contrast".
  // Chữ trên nền primary: lấy phương án đầu tiên đạt AA (contrast → bậc 1 → bậc 12), nếu không có thì lấy tốt nhất.
  const primaryForeground = (mode: Mode, name: string, step: number): string => {
    const s = find(mode, name);
    const bg = s.steps[step - 1].hex;
    const cands = [[`${name}-contrast`, s.contrast], [`${name}-1`, s.steps[0].hex], [`${name}-12`, s.steps[11].hex]] as const;
    return (cands.find(([, hex]) => contrast(hex, bg) >= AA) ?? cands.reduce((a, b) => (contrast(b[1], bg) > contrast(a[1], bg) ? b : a)))[0];
  };

  // Tách các màu chart gần nhau (ΔE < CHART_MIN_DE): dời màu đứng sau sang bậc 8/10/7/11 của cùng thang
  // (vẫn là alias vào thang Radix, không sinh màu mới), chọn bậc xa nhất mà vẫn đạt NON_TEXT trên nền.
  const spreadChart = (mode: Mode, m: RefMap) => {
    const bg = find(mode, OPT.neutral).steps[0].hex;
    const hex = (k: number) => resolve(mode, m[`chart-${k + 1}`]);
    const minTo = (k: number, c: string) => Math.min(...OPT.chart.map((_, o) => (o === k ? Infinity : dE(c, hex(o)))));
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (let i = 0; i < OPT.chart.length; i++)
        for (let j = i + 1; j < OPT.chart.length; j++) {
          if (dE(hex(i), hex(j)) >= CHART_MIN_DE) continue;
          const s = find(mode, OPT.chart[j]);
          let best = { step: 9, d: minTo(j, hex(j)) };
          for (const step of [8, 10, 7, 11]) {
            const c = s.steps[step - 1].hex;
            const d = minTo(j, c);
            if (contrast(c, bg) >= NON_TEXT && d > best.d) best = { step, d };
          }
          if (best.step !== 9 || m[`chart-${j + 1}`] !== `${OPT.chart[j]}-9`) {
            m[`chart-${j + 1}`] = `${OPT.chart[j]}-${best.step}`;
            moved = true;
          }
        }
      if (!moved) break;
    }
  };

  const semantic = (mode: Mode): RefMap => {
    const N = OPT.neutral;
    const neutralPrimary = OPT.primary === "neutral";
    const P = neutralPrimary ? N : OPT.primary;
    const dark = mode === "dark";
    const m: RefMap = {
      background: `${N}-1`,
      foreground: `${N}-12`,
      card: dark ? `${N}-2` : `${N}-1`,
      "card-foreground": `${N}-12`,
      popover: dark ? `${N}-2` : `${N}-1`,
      "popover-foreground": `${N}-12`,
      primary: neutralPrimary ? `${N}-12` : `${P}-${OPT.primaryStep}`,
      "primary-foreground": neutralPrimary ? `${N}-1` : primaryForeground(mode, P, OPT.primaryStep),
      secondary: `${N}-3`,
      "secondary-foreground": `${N}-12`,
      muted: `${N}-3`,
      "muted-foreground": `${N}-11`,
      accent: `${N}-4`,
      "accent-foreground": `${N}-12`,
      border: `${N}-6`,
      input: `${N}-7`,
      // bậc 9 của hue sáng (vàng, lime…) không đạt 3:1 trên nền trắng → lùi sang bậc 10/11
      ring: `${P}-${[9, 10, 11].find((s) => contrast(find(mode, P).steps[s - 1].hex, find(mode, N).steps[0].hex) >= NON_TEXT) ?? 11}`,
    };
    // trạng thái: solid / subtle / border / text
    const status: [string, string][] = [
      ["destructive", OPT.destructive],
      ["success", OPT.success],
      ["warning", OPT.warning],
      ["info", OPT.info],
      ...SECONDARY.map((n): [string, string] => [n, n]),
    ];
    for (const [k, s] of status) {
      m[k] = `${s}-9`;
      m[`${k}-foreground`] = `${s}-contrast`;
      m[`${k}-subtle`] = `${s}-3`;
      m[`${k}-border`] = `${s}-6`;
      m[`${k}-text`] = `${s}-11`;
    }
    OPT.chart.forEach((c, i) => (m[`chart-${i + 1}`] = `${c}-9`));
    spreadChart(mode, m);
    Object.assign(m, {
      sidebar: `${N}-2`,
      "sidebar-foreground": `${N}-12`,
      "sidebar-primary": m.primary,
      "sidebar-primary-foreground": m["primary-foreground"],
      "sidebar-accent": `${N}-4`,
      "sidebar-accent-foreground": `${N}-12`,
      "sidebar-border": `${N}-6`,
      "sidebar-ring": m.ring,
    });
    return m;
  };

  // ─── audit ──────────────────────────────────────────────────────────────
  const rows: AuditRow[] = [];
  const check = (mode: Mode, where: string, pair: string, fg: string, bg: string, need: number, kind: AuditRow["kind"]) =>
    rows.push({ mode, where, pair, ratio: contrast(fg, bg), need, kind });

  for (const mode of MODES) {
    for (const s of scales[mode]) {
      const st = s.steps.map((x) => x.hex);
      check(mode, s.name, "11 / 2", st[10], st[1], AA, "text");
      check(mode, s.name, "11 / 4", st[10], st[3], AA, "text");
      check(mode, s.name, "12 / 2", st[11], st[1], 7, "text");
      check(mode, s.name, "contrast / 9", s.contrast, st[8], AA, "text");
      check(mode, s.name, "contrast / 10", s.contrast, st[9], AA, "text");
      check(mode, s.name, "8 / 1", st[7], st[0], NON_TEXT, "info");
    }
    const m = semantic(mode);
    const pairs: [string, string, number, AuditRow["kind"]][] = [
      ["foreground", "background", 7, "text"],
      ["card-foreground", "card", 7, "text"],
      ["muted-foreground", "background", AA, "text"],
      ["muted-foreground", "muted", AA, "text"],
      ["secondary-foreground", "secondary", AA, "text"],
      ["accent-foreground", "accent", AA, "text"],
      ["primary-foreground", "primary", AA, "text"],
      ["sidebar-foreground", "sidebar", AA, "text"],
      ["ring", "background", NON_TEXT, "ui"],
      ["input", "background", NON_TEXT, "info"],
      ["border", "background", NON_TEXT, "info"],
    ];
    for (const k of ["destructive", "success", "warning", "info", ...SECONDARY]) {
      pairs.push([`${k}-foreground`, k, AA, "text"], [`${k}-text`, `${k}-subtle`, AA, "text"], [`${k}-text`, "background", AA, "text"]);
    }
    OPT.chart.forEach((_, i) => pairs.push([`chart-${i + 1}`, "background", NON_TEXT, "ui"]));
    for (const [fg, bg, need, kind] of pairs) check(mode, "theme", `${fg} / ${bg}`, resolve(mode, m[fg]), resolve(mode, m[bg]), need, kind);
  }

  // ΔE giữa các màu chart sau khi đã tách
  const chartDist: { mode: Mode; a: string; b: string; d: number }[] = [];
  for (const mode of MODES) {
    const m = semantic(mode);
    for (let i = 0; i < OPT.chart.length; i++)
      for (let j = i + 1; j < OPT.chart.length; j++)
        chartDist.push({ mode, a: m[`chart-${i + 1}`], b: m[`chart-${j + 1}`], d: dE(resolve(mode, m[`chart-${i + 1}`]), resolve(mode, m[`chart-${j + 1}`])) });
  }

  // ─── xuất ───────────────────────────────────────────────────────────────
  const sel = (mode: Mode) => (mode === "light" ? ":root, .light" : ".dark");

  let colorsCss = `/* Sinh tự động bởi src/build.ts — đừng sửa tay. */\n`;
  for (const mode of MODES) {
    colorsCss += `\n${sel(mode)} {\n`;
    for (const s of scales[mode]) {
      s.steps.forEach((st, i) => (colorsCss += `  --${s.name}-${i + 1}: ${fmt(st)};\n`));
      s.alpha.forEach((a, i) => (colorsCss += `  --${s.name}-a${i + 1}: ${a};\n`));
      colorsCss += `  --${s.name}-contrast: ${s.contrast};\n`;
    }
    colorsCss += `}\n`;
  }

  let themeCss = `/* Token ngữ nghĩa kiểu shadcn. Cần import colors.css trước.\n   neutral=${OPT.neutral} primary=${OPT.primary} */\n`;
  for (const mode of MODES) {
    const m = semantic(mode);
    themeCss += `\n${sel(mode)} {\n`;
    if (mode === "light") themeCss += `  --radius: 0.625rem;\n`;
    for (const [k, ref] of Object.entries(m)) themeCss += `  --${k}: var(--${ref});\n`;
    themeCss += `}\n`;
  }
  themeCss += `\n/* Tailwind v4 */\n@custom-variant dark (&:is(.dark *));\n\n@theme inline {\n`;
  for (const k of Object.keys(semantic("light"))) themeCss += `  --color-${k}: var(--${k});\n`;
  themeCss += `  --radius-sm: calc(var(--radius) - 4px);\n  --radius-md: calc(var(--radius) - 2px);\n  --radius-lg: var(--radius);\n  --radius-xl: calc(var(--radius) + 4px);\n\n  /* thang gốc: bg-blue-3, text-red-11, border-slate-a6 ... */\n`;
  for (const s of scales.light) {
    for (let i = 1; i <= 12; i++) themeCss += `  --color-${s.name}-${i}: var(--${s.name}-${i});\n`;
    for (let i = 1; i <= 12; i++) themeCss += `  --color-${s.name}-a${i}: var(--${s.name}-a${i});\n`;
    themeCss += `  --color-${s.name}-contrast: var(--${s.name}-contrast);\n`;
  }
  themeCss += `}\n`;

  const tokens = {
    options: OPT,
    scales: Object.fromEntries(
      MODES.map((mode) => [
        mode,
        Object.fromEntries(scales[mode].map((s) => [s.name, { kind: s.kind, steps: s.steps.map((x) => x.hex), alpha: s.alpha, contrast: s.contrast }])),
      ]),
    ),
    semantic: Object.fromEntries(MODES.map((mode) => [mode, Object.fromEntries(Object.entries(semantic(mode)).map(([k, ref]) => [k, { ref, hex: resolve(mode, ref) }]))])),
  };

  const fails = rows.filter((r) => r.kind !== "info" && r.ratio < r.need);
  const infos = rows.filter((r) => r.kind === "info" && r.ratio < r.need);
  const minChartDE = Math.min(...chartDist.map((c) => c.d));
  let auditMd = `# Audit tương phản\n\n- Cặp kiểm tra: ${rows.length}\n- Không đạt (chữ/UI): ${fails.length}\n- Dưới 3:1 (chỉ thông tin): ${infos.length}\n- ΔE nhỏ nhất giữa các màu chart: ${minChartDE.toFixed(3)}\n\n`;
  if (fails.length) {
    auditMd += `## Không đạt\n\n| mode | nơi | cặp | tỉ lệ | cần |\n|---|---|---|---|---|\n`;
    for (const r of fails) auditMd += `| ${r.mode} | ${r.where} | ${r.pair} | ${r.ratio.toFixed(2)} | ${r.need} |\n`;
  }
  auditMd += `\n## Theme\n\n| mode | cặp | tỉ lệ | cần | |\n|---|---|---|---|---|\n`;
  for (const r of rows.filter((r) => r.where === "theme")) auditMd += `| ${r.mode} | ${r.pair} | ${r.ratio.toFixed(2)} | ${r.need} | ${r.ratio >= r.need ? "PASS" : r.kind === "info" ? "info" : "FAIL"} |\n`;

  return { colorsCss, themeCss, auditMd, tokens, scales, audit: { rows, fails, infos, minChartDE, closeChart: chartDist.filter((c) => c.d < CHART_MIN_DE) } };
}
