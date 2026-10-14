import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSpectrum } from "./core.ts";

const read = (dir: string, f: string) => readFileSync(join(dir, f), "utf8");
const dist = new URL("../dist", import.meta.url).pathname;

test("mặc định trùng từng byte với dist/ đã commit", () => {
  const r = buildSpectrum();
  expect(r.colorsCss).toBe(read(dist, "colors.css"));
  expect(r.themeCss).toBe(read(dist, "theme.css"));
  expect(r.auditMd).toBe(read(dist, "audit.md"));
});

test("sand + #2563eb + triadic trùng từng byte với CLI", () => {
  const out = mkdtempSync(join(tmpdir(), "spectrum-"));
  const cli = Bun.spawnSync(
    ["bun", "src/build.ts", "--neutral", "sand", "--primary", "#2563eb", "--harmony", "triadic", "--out", out, "--page", join(out, "p.html")],
    { cwd: new URL("..", import.meta.url).pathname },
  );
  expect(cli.exitCode).toBe(0);
  const r = buildSpectrum({ neutral: "sand", primary: "#2563eb", harmony: "triadic" });
  expect(r.colorsCss).toBe(read(out, "colors.css"));
  expect(r.themeCss).toBe(read(out, "theme.css"));
  expect(r.auditMd).toBe(read(out, "audit.md"));
});

test("harmony với primary neutral thì throw", () => {
  expect(() => buildSpectrum({ harmony: "triadic" })).toThrow();
});
