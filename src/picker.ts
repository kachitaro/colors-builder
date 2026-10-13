// Nhúng tokens.json vào picker.html → <out>/picker.html (mở thẳng bằng file://, không cần server).
import { readFileSync, writeFileSync } from "node:fs";

const i = process.argv.indexOf("--out");
const out = i > -1 ? process.argv[i + 1] : "dist";
const tokens = readFileSync(`${out}/tokens.json`, "utf8");
const html = readFileSync(new URL("./picker.html", import.meta.url), "utf8").replace("/*TOKENS*/null", () => tokens);
writeFileSync(`${out}/picker.html`, html);
