import { mkdirSync, writeFileSync } from "node:fs";
import { buildSpectrum, DEFAULT_OPTIONS, type SpectrumOptions } from "./core.ts";

// CLI: bun src/build.ts --neutral slate --primary blue --harmony triadic ...
const arg = (k: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const D = DEFAULT_OPTIONS;
const opts: SpectrumOptions = {
  neutral: arg("neutral") ?? D.neutral,
  primary: arg("primary") ?? D.primary,
  primaryStep: Number(arg("primary-step") ?? D.primaryStep),
  destructive: arg("destructive") ?? D.destructive,
  success: arg("success") ?? D.success,
  warning: arg("warning") ?? D.warning,
  info: arg("info") ?? D.info,
  chart: arg("chart")?.split(",") ?? D.chart,
  harmony: (arg("harmony") ?? D.harmony) as SpectrumOptions["harmony"],
};
const out = arg("out") ?? "dist";

const r = buildSpectrum(opts);

mkdirSync(out, { recursive: true });
writeFileSync(`${out}/colors.css`, r.colorsCss);
writeFileSync(`${out}/theme.css`, r.themeCss);
writeFileSync(`${out}/tokens.json`, JSON.stringify(r.tokens, null, 2));
writeFileSync(`${out}/audit.md`, r.auditMd);

const { rows, fails, infos, minChartDE, closeChart } = r.audit;
console.log(`${r.scales.light.length} thang × 12 bậc × 2 mode`);
console.log(`audit: ${rows.length} cặp, ${fails.length} không đạt, ${infos.length} info; ΔE chart min ${minChartDE.toFixed(3)}`);
for (const f of fails) console.log(`  FAIL ${f.mode} ${f.where} ${f.pair} ${f.ratio.toFixed(2)} < ${f.need}`);
for (const c of closeChart) console.log(`  chart gần nhau: ${c.mode} ${c.a}/${c.b} ${c.d.toFixed(3)}`);

// CI: thoát với mã lỗi nếu có cặp chữ/UI không đạt
if (fails.length) process.exitCode = 1;
