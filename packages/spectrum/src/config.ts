// Định nghĩa các hue nguồn. Mọi thang 12 bậc đều được SINH từ đây,
// không có mã hex viết tay nào khác trong hệ thống.
//
// h      : hue OKLCH (độ), giữ cố định suốt thang
// L, C   : lightness / chroma mong muốn cho bậc 9 (màu đặc)
// fg     : màu chữ trên bậc 9 — "light" (chữ trắng) hoặc "dark" (chữ tối).
//          Bộ sinh sẽ chỉnh L của bậc 9 cho đến khi cặp này đạt AA 4.5:1.
// textShift : dịch hue cho bậc 11–12 ở light mode (tránh vàng bị ngả olive)

export type Hue = {
  name: string;
  h: number;
  L: number;
  C: number;
  fg: "light" | "dark";
  textShift?: number;
};

export type Neutral = {
  name: string;
  h: number;
  C: number; // chroma tối đa (ở các bậc giữa) — rất nhỏ, chỉ để "nhuộm"
};

export const NEUTRALS: Neutral[] = [
  { name: "gray", h: 0, C: 0 },
  { name: "slate", h: 255, C: 0.018 },
  { name: "mauve", h: 310, C: 0.016 },
  { name: "sage", h: 165, C: 0.014 },
  { name: "olive", h: 125, C: 0.016 },
  { name: "sand", h: 75, C: 0.016 },
];

export const HUES: Hue[] = [
  // đỏ → hồng
  { name: "tomato", h: 35, L: 0.64, C: 0.2, fg: "light" },
  { name: "red", h: 22, L: 0.63, C: 0.2, fg: "light" },
  { name: "ruby", h: 12, L: 0.62, C: 0.2, fg: "light" },
  { name: "crimson", h: 2, L: 0.63, C: 0.21, fg: "light" },
  { name: "pink", h: 348, L: 0.61, C: 0.2, fg: "light" },
  // tím
  { name: "plum", h: 322, L: 0.57, C: 0.18, fg: "light" },
  { name: "purple", h: 303, L: 0.56, C: 0.19, fg: "light" },
  { name: "violet", h: 287, L: 0.55, C: 0.19, fg: "light" },
  { name: "iris", h: 277, L: 0.56, C: 0.18, fg: "light" },
  { name: "indigo", h: 266, L: 0.55, C: 0.19, fg: "light" },
  // xanh dương
  { name: "blue", h: 253, L: 0.62, C: 0.19, fg: "light" },
  { name: "cyan", h: 220, L: 0.66, C: 0.13, fg: "light" },
  { name: "sky", h: 225, L: 0.85, C: 0.1, fg: "dark" },
  // xanh lục
  { name: "teal", h: 180, L: 0.64, C: 0.12, fg: "light" },
  { name: "jade", h: 165, L: 0.64, C: 0.13, fg: "light" },
  { name: "mint", h: 175, L: 0.86, C: 0.11, fg: "dark" },
  { name: "green", h: 155, L: 0.64, C: 0.15, fg: "light" },
  { name: "grass", h: 145, L: 0.65, C: 0.16, fg: "light" },
  { name: "lime", h: 128, L: 0.88, C: 0.18, fg: "dark", textShift: -8 },
  // vàng → cam → nâu
  { name: "yellow", h: 100, L: 0.92, C: 0.18, fg: "dark", textShift: -25 },
  { name: "amber", h: 82, L: 0.85, C: 0.16, fg: "dark", textShift: -18 },
  { name: "orange", h: 48, L: 0.68, C: 0.19, fg: "light" },
  { name: "brown", h: 60, L: 0.62, C: 0.08, fg: "light" },
  { name: "gold", h: 85, L: 0.62, C: 0.06, fg: "light" },
  { name: "bronze", h: 40, L: 0.63, C: 0.06, fg: "light" },
];

// ─── Đường cong lightness / chroma theo bậc ───────────────────────────────
// Bậc 9–10 lấy từ hue; bậc 11–12 được GIẢI theo độ tương phản, không cố định.
export const CURVE = {
  light: {
    L: [0.993, 0.982, 0.957, 0.93, 0.902, 0.868, 0.82, 0.75],
    C: [0.02, 0.06, 0.16, 0.26, 0.36, 0.46, 0.6, 0.8],
    textC: [0.95, 0.55], // hệ số chroma cho bậc 11, 12
    contrast: [5.0, 11.0], // tương phản tối thiểu của bậc 11, 12 trên bậc 2
  },
  dark: {
    L: [0.178, 0.205, 0.25, 0.287, 0.322, 0.362, 0.425, 0.51],
    C: [0.06, 0.1, 0.28, 0.38, 0.46, 0.52, 0.6, 0.72],
    textC: [0.85, 0.35],
    contrast: [6.0, 13.0],
  },
};

// Ngưỡng
export const AA = 4.5;
export const NON_TEXT = 3.0;
