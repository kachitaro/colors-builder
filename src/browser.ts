// Điểm vào cho trình duyệt: bundle vào picker.html để trang tự sinh thang từ mã hex, không cần server.
import { HUES, type Hue } from "./config.ts";
import { brandHue, HARMONY, harmonyHues, type Harmony } from "./harmony.ts";
import { hueScale, type Mode } from "./scale.ts";

const MODES: Mode[] = ["light", "dark"];

/** base: mã "#rrggbb" (sinh thêm thang brand) hoặc tên hue có sẵn (chỉ sinh màu phụ). */
function generate(base: string, harmony: Harmony | "", alphaBg: Record<Mode, string>) {
  const hex = base.startsWith("#");
  const root: Hue | undefined = hex ? brandHue(base) : HUES.find((h) => h.name === base);
  if (!root) throw new Error(`Không có hue "${base}"`);
  const hues = [...(hex ? [root] : []), ...(harmony ? harmonyHues(root, harmony) : [])];
  const out = {} as Record<Mode, Record<string, { kind: "hue"; steps: string[]; alpha: string[]; contrast: string }>>;
  for (const mode of MODES) {
    out[mode] = {};
    for (const h of hues) {
      const s = hueScale(h, mode, alphaBg[mode]);
      out[mode][h.name] = { kind: "hue", steps: s.steps.map((x) => x.hex), alpha: s.alpha, contrast: s.contrast };
    }
  }
  return out;
}

(globalThis as unknown as { Gen: unknown }).Gen = { generate, harmonies: Object.keys(HARMONY) };
