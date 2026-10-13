// Nhúng tokens.json + bộ sinh thang (bundle từ browser.ts) vào picker.html → index.html ở gốc repo.
// Trang tự chứa, không gọi mạng: mở bằng file:// hoặc đưa lên bất kỳ static host nào.
import { readFileSync, writeFileSync } from "node:fs";

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const out = arg("out", "dist");
const page = arg("page", "index.html"); // GitHub Pages phục vụ index.html ở gốc repo
const tokens = readFileSync(`${out}/tokens.json`, "utf8");

const built = await Bun.build({ entrypoints: [new URL("./browser.ts", import.meta.url).pathname], target: "browser", format: "iife", minify: true });
if (!built.success) throw new Error(built.logs.join("\n"));
const bundle = await built.outputs[0].text();

const html = readFileSync(new URL("./picker.html", import.meta.url), "utf8")
  .replace("/*TOKENS*/null", () => tokens)
  .replace("/*BUNDLE*/", () => bundle);
writeFileSync(page, html);
