import { mkdirSync, writeFileSync } from "node:fs";
import { differenceEuclidean } from "culori";
import { AA, HUES, NEUTRALS, NON_TEXT } from "./config.ts";
import { contrast, fmt, hueScale, neutralScale, type Mode, type Scale } from "./scale.ts";

// ─── tuỳ chọn theme (CLI: --neutral slate --primary blue ...) ─────────────
const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const OPT = {
  neutral: arg("neutral", "gray"),
  primary: arg("primary", "neutral"), // "neutral" = kiểu shadcn mặc định (đen/trắng)
  primaryStep: arg("primary-step", "9"), // bậc dùng cho primary khi primary là một hue (1–12)
  destructive: arg("destructive", "red"),
  success: arg("success", "green"),
  warning: arg("warning", "amber"),
  info: arg("info", "blue"),
  chart: arg("chart", "blue,orange,teal,violet,pink,grass,red,brown").split(","),
  out: arg("out", "dist"),
};

// ─── sinh toàn bộ thang ───────────────────────────────────────────────────
const MODES: Mode[] = ["light", "dark"];
const scales: Record<Mode, Scale[]> = { light: [], dark: [] };

for (const mode of MODES) {
  // nền tham chiếu cho alpha: trắng (light) / bậc 1 của gray dark
  const gray = neutralScale(NEUTRALS[0], mode, "#ffffff");
  const alphaBg = mode === "light" ? "#ffffff" : gray.steps[0].hex;
  for (const n of NEUTRALS) scales[mode].push(neutralScale(n, mode, alphaBg));
  for (const h of HUES) scales[mode].push(hueScale(h, mode, alphaBg));
}
const find = (mode: Mode, name: string) => {
  const s = scales[mode].find((x) => x.name === name);
  if (!s) throw new Error(`Không có thang "${name}"`);
  return s;
};

// ─── tầng ngữ nghĩa (shadcn) ──────────────────────────────────────────────
// Giá trị là tham chiếu "<thang>-<bậc>" hoặc "<thang>-contrast".
type Map = Record<string, string>;
function semantic(mode: Mode): Map {
  const N = OPT.neutral;
  const neutralPrimary = OPT.primary === "neutral";
  const P = neutralPrimary ? N : OPT.primary;
  const dark = mode === "dark";
  const m: Map = {
    background: `${N}-1`,
    foreground: `${N}-12`,
    card: dark ? `${N}-2` : `${N}-1`,
    "card-foreground": `${N}-12`,
    popover: dark ? `${N}-2` : `${N}-1`,
    "popover-foreground": `${N}-12`,
    primary: neutralPrimary ? `${N}-12` : `${P}-${OPT.primaryStep}`,
    "primary-foreground": neutralPrimary ? `${N}-1` : `${P}-contrast`,
    secondary: `${N}-3`,
    "secondary-foreground": `${N}-12`,
    muted: `${N}-3`,
    "muted-foreground": `${N}-11`,
    accent: `${N}-4`,
    "accent-foreground": `${N}-12`,
    border: `${N}-6`,
    input: `${N}-7`,
    ring: `${P}-9`,
  };
  // trạng thái: solid / subtle / border / text
  const status: [string, string][] = [
    ["destructive", OPT.destructive],
    ["success", OPT.success],
    ["warning", OPT.warning],
    ["info", OPT.info],
  ];
  for (const [k, s] of status) {
    m[k] = `${s}-9`;
    m[`${k}-foreground`] = `${s}-contrast`;
    m[`${k}-subtle`] = `${s}-3`;
    m[`${k}-border`] = `${s}-6`;
    m[`${k}-text`] = `${s}-11`;
  }
  OPT.chart.forEach((c, i) => (m[`chart-${i + 1}`] = `${c}-9`));
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
}

const resolve = (mode: Mode, ref: string) => {
  const [name, step] = [ref.slice(0, ref.lastIndexOf("-")), ref.slice(ref.lastIndexOf("-") + 1)];
  const s = find(mode, name);
  return step === "contrast" ? s.contrast : s.steps[+step - 1].hex;
};

// ─── audit ────────────────────────────────────────────────────────────────
type Row = { mode: Mode; where: string; pair: string; ratio: number; need: number; kind: "text" | "ui" | "info" };
const rows: Row[] = [];
const check = (mode: Mode, where: string, pair: string, fg: string, bg: string, need: number, kind: Row["kind"]) =>
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
  const pairs: [string, string, number, Row["kind"]][] = [
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
  for (const k of ["destructive", "success", "warning", "info"]) {
    pairs.push([`${k}-foreground`, k, AA, "text"], [`${k}-text`, `${k}-subtle`, AA, "text"], [`${k}-text`, "background", AA, "text"]);
  }
  OPT.chart.forEach((_, i) => pairs.push([`chart-${i + 1}`, "background", NON_TEXT, "ui"]));
  for (const [fg, bg, need, kind] of pairs) check(mode, "theme", `${fg} / ${bg}`, resolve(mode, m[fg]), resolve(mode, m[bg]), need, kind);
}

// độ phân biệt giữa các màu chart (ΔE OKLab)
const dE = differenceEuclidean("oklab");
const chartDist: { mode: Mode; a: string; b: string; d: number }[] = [];
for (const mode of MODES)
  for (let i = 0; i < OPT.chart.length; i++)
    for (let j = i + 1; j < OPT.chart.length; j++)
      chartDist.push({ mode, a: OPT.chart[i], b: OPT.chart[j], d: dE(find(mode, OPT.chart[i]).steps[8].hex, find(mode, OPT.chart[j]).steps[8].hex) });

// ─── xuất file ────────────────────────────────────────────────────────────
mkdirSync(OPT.out, { recursive: true });
const sel = (mode: Mode) => (mode === "light" ? ":root, .light" : ".dark");

let colors = `/* Sinh tự động bởi src/build.ts — đừng sửa tay. */\n`;
for (const mode of MODES) {
  colors += `\n${sel(mode)} {\n`;
  for (const s of scales[mode]) {
    s.steps.forEach((st, i) => (colors += `  --${s.name}-${i + 1}: ${fmt(st)};\n`));
    s.alpha.forEach((a, i) => (colors += `  --${s.name}-a${i + 1}: ${a};\n`));
    colors += `  --${s.name}-contrast: ${s.contrast};\n`;
  }
  colors += `}\n`;
}
writeFileSync(`${OPT.out}/colors.css`, colors);

const v = (ref: string) => `var(--${ref})`;
let theme = `/* Token ngữ nghĩa kiểu shadcn. Cần import colors.css trước.\n   neutral=${OPT.neutral} primary=${OPT.primary} */\n`;
for (const mode of MODES) {
  const m = semantic(mode);
  theme += `\n${sel(mode)} {\n`;
  if (mode === "light") theme += `  --radius: 0.625rem;\n`;
  for (const [k, ref] of Object.entries(m)) theme += `  --${k}: ${v(ref)};\n`;
  theme += `}\n`;
}
theme += `\n/* Tailwind v4 */\n@custom-variant dark (&:is(.dark *));\n\n@theme inline {\n`;
for (const k of Object.keys(semantic("light"))) theme += `  --color-${k}: var(--${k});\n`;
theme += `  --radius-sm: calc(var(--radius) - 4px);\n  --radius-md: calc(var(--radius) - 2px);\n  --radius-lg: var(--radius);\n  --radius-xl: calc(var(--radius) + 4px);\n\n  /* thang gốc: bg-blue-3, text-red-11, border-slate-a6 ... */\n`;
for (const s of scales.light) {
  for (let i = 1; i <= 12; i++) theme += `  --color-${s.name}-${i}: var(--${s.name}-${i});\n`;
  for (let i = 1; i <= 12; i++) theme += `  --color-${s.name}-a${i}: var(--${s.name}-a${i});\n`;
  theme += `  --color-${s.name}-contrast: var(--${s.name}-contrast);\n`;
}
theme += `}\n`;
writeFileSync(`${OPT.out}/theme.css`, theme);

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
writeFileSync(`${OPT.out}/tokens.json`, JSON.stringify(tokens, null, 2));

// báo cáo
const fails = rows.filter((r) => r.kind !== "info" && r.ratio < r.need);
const infos = rows.filter((r) => r.kind === "info" && r.ratio < r.need);
const minChart = Math.min(...chartDist.map((c) => c.d));
let audit = `# Audit tương phản\n\n- Cặp kiểm tra: ${rows.length}\n- Không đạt (chữ/UI): ${fails.length}\n- Dưới 3:1 (chỉ thông tin): ${infos.length}\n- ΔE nhỏ nhất giữa các màu chart: ${minChart.toFixed(3)}\n\n`;
if (fails.length) {
  audit += `## Không đạt\n\n| mode | nơi | cặp | tỉ lệ | cần |\n|---|---|---|---|---|\n`;
  for (const r of fails) audit += `| ${r.mode} | ${r.where} | ${r.pair} | ${r.ratio.toFixed(2)} | ${r.need} |\n`;
}
audit += `\n## Theme\n\n| mode | cặp | tỉ lệ | cần | |\n|---|---|---|---|---|\n`;
for (const r of rows.filter((r) => r.where === "theme")) audit += `| ${r.mode} | ${r.pair} | ${r.ratio.toFixed(2)} | ${r.need} | ${r.ratio >= r.need ? "PASS" : r.kind === "info" ? "info" : "FAIL"} |\n`;
writeFileSync(`${OPT.out}/audit.md`, audit);

console.log(`${scales.light.length} thang × 12 bậc × 2 mode`);
console.log(`audit: ${rows.length} cặp, ${fails.length} không đạt, ${infos.length} info; ΔE chart min ${minChart.toFixed(3)}`);
for (const r of fails) console.log(`  FAIL ${r.mode} ${r.where} ${r.pair} ${r.ratio.toFixed(2)} < ${r.need}`);
const close = chartDist.filter((c) => c.d < 0.08);
for (const c of close) console.log(`  chart gần nhau: ${c.mode} ${c.a}/${c.b} ${c.d.toFixed(3)}`);

await import("./picker.ts"); // sinh trang chọn màu từ tokens.json vừa ghi

// CI: thoát với mã lỗi nếu có cặp chữ/UI không đạt
if (fails.length) process.exitCode = 1;
