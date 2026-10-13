// Nhúng tokens.json + bộ sinh thang (bundle từ browser.ts) vào picker.html → <out>/picker.html.
// Trang tự chứa, không gọi mạng: mở bằng file:// hoặc đưa lên bất kỳ static host nào.
import { readFileSync, writeFileSync } from "node:fs";

const i = process.argv.indexOf("--out");
const out = i > -1 ? process.argv[i + 1] : "dist";
const tokens = readFileSync(`${out}/tokens.json`, "utf8");

const built = await Bun.build({ entrypoints: [new URL("./browser.ts", import.meta.url).pathname], target: "browser", format: "iife", minify: true });
if (!built.success) throw new Error(built.logs.join("\n"));
const bundle = await built.outputs[0].text();

const html = readFileSync(new URL("./picker.html", import.meta.url), "utf8")
  .replace("/*TOKENS*/null", () => tokens)
  .replace("/*BUNDLE*/", () => bundle);
writeFileSync(`${out}/picker.html`, html);
