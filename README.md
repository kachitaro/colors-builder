# Spectrum

Bộ màu trung lập, chưa gắn với thương hiệu nào. Nó lấy **sự đa dạng của Radix Colors** (31 thang, mỗi thang 12 bậc có công dụng cố định) và **sự hệ thống hoá của shadcn/ui** (component chỉ đọc token ngữ nghĩa như `background`, `primary`, `muted`).

Không có mã hex nào viết tay. Mọi màu được sinh trong không gian **OKLCH** từ `src/config.ts`, và mỗi lần build đều tự kiểm tra độ tương phản WCAG.

## Dùng với shadcn + Tailwind v4

```css
@import "tailwindcss";
@import "spectrum-colors/colors.css"; /* thang gốc + alpha, light & dark */
@import "spectrum-colors/theme.css";  /* token shadcn + @theme inline */
```

- Token shadcn dùng như bình thường: `bg-background`, `text-muted-foreground`, `bg-primary`.
- Thang gốc cũng có class: `bg-blue-3`, `text-red-11`, `border-slate-a6`.
- Dark mode bật bằng class `.dark` trên `<html>`, giống shadcn.

Chưa publish lên npm thì copy hai file trong `dist/` vào dự án là xong.

## Ba tầng

1. **Thang gốc**: `gray-1` … `bronze-12`, kèm bản alpha `-a1…a12` và màu chữ `-contrast`.
2. **Token ngữ nghĩa** (tên giống hệt shadcn): `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `border`, `input`, `ring`, `destructive`, `sidebar-*`. Mỗi token là một alias trỏ vào một bậc.
3. **Phần mở rộng**: `success`, `warning`, `info`, mỗi cái gồm `-foreground`, `-subtle`, `-border`, `-text`. Thêm `destructive-subtle/-border/-text` và `chart-1…8`.

## 12 bậc

| Bậc | Việc | Token dùng nó |
|---|---|---|
| 1 | Nền app | `background` |
| 2 | Nền phụ | `card` (dark), `sidebar` |
| 3 | Nền component | `muted`, `secondary`, `*-subtle` |
| 4 | Nền component khi hover | `accent` |
| 5 | Nền component khi active hoặc đã chọn | |
| 6 | Viền nhạt | `border`, `*-border` |
| 7 | Viền UI | `input` |
| 8 | Viền đậm | |
| 9 | Màu đặc | `primary`, `destructive`, `ring`, `chart-*` |
| 10 | Hover của màu đặc | |
| 11 | Chữ tương phản thấp | `muted-foreground`, `*-text` |
| 12 | Chữ tương phản cao | `foreground` |

Chữ đặt trên bậc 9 và 10 dùng `<thang>-contrast`. Giá trị này là trắng, hoặc một màu tối cùng hue với `sky`, `mint`, `lime`, `yellow` và `amber`.

## Các thang

- **Neutral (6):** `gray`, `slate`, `mauve`, `sage`, `olive`, `sand`
- **Hue (25):** tomato, red, ruby, crimson, pink, plum, purple, violet, iris, indigo, blue, cyan, sky, teal, jade, mint, green, grass, lime, yellow, amber, orange, brown, gold, bronze

Cặp neutral và hue đi cùng nhau: `slate` với `blue`/`indigo`, `mauve` với `violet`/`plum`, `sage` với `teal`/`jade`, `olive` với `grass`/`lime`, `sand` với `amber`/`orange`/`brown`.

## Cách sinh màu

- **Bậc 1–8**: một đường cong lightness và chroma chung cho mọi hue. Nhờ đó `blue-3` và `orange-3` có cùng trọng lượng thị giác.
- **Bậc 9**: L được chỉnh cho đến khi chữ `-contrast` đạt **4.5:1**. Hue dùng chữ tối được chừa biên để bậc 10 vẫn đạt chuẩn.
- **Bậc 11**: chọn màu gần nền nhất đạt ≥5:1 trên bậc 2 (≥6:1 ở dark) **và** ≥4.5:1 trên bậc 5.
- **Bậc 12**: đạt ≥11:1 trên bậc 2 (≥13:1 ở dark).
- **Alpha**: dùng phép "color to alpha" chính xác, trên nền trắng (light) hoặc `gray-1` (dark).
- Hue giữ nguyên suốt thang. Riêng `yellow`, `amber` và `lime` được xoay hue ở bậc chữ để không ngả màu olive.

## Phát triển

```bash
bun install
bun run build                                   # sinh dist/ + audit + index.html (trang chọn màu)
bun run build -- --neutral sand --primary amber # theme cho một thương hiệu
```

Các tuỳ chọn: `--neutral`, `--primary` (tên hue hoặc mã hex như `"#2563eb"`; mặc định `neutral`, tức đen/trắng như shadcn), `--primary-step` (1–12), `--harmony complementary|split|analogous|triadic` (sinh màu phụ `brand-2`, `brand-3`), `--destructive`, `--success`, `--warning`, `--info`, `--chart a,b,c`, `--out`.

Thêm hue mới bằng một dòng trong `src/config.ts`:

```ts
{ name: "honey", h: 75, L: 0.72, C: 0.14, fg: "dark" },
```

Build sẽ **thất bại** nếu có cặp chữ hoặc UI không đạt chuẩn. Chi tiết nằm trong `dist/audit.md`.

## Cấu trúc

```
src/config.ts   hue nguồn, đường cong, ngưỡng
src/scale.ts    toán màu: sinh thang, giải tương phản, alpha
src/build.ts    ánh xạ token, audit, xuất file
dist/           colors.css · theme.css · tokens.json · audit.md (commit sẵn)
```

CI (`.github/workflows/audit.yml`) chạy typecheck, build và kiểm tra rằng `dist/` khớp với `src/`.

## Kiểm tra hiện tại

Có 434 cặp màu được kiểm tra, 0 cặp chữ hoặc UI không đạt. `border` và `input` dưới 3:1 so với nền, giống shadcn và Radix. Nếu form cần đạt WCAG 1.4.11, hãy trỏ `input` sang bậc 8.

## Quy tắc

- Component chỉ dùng token ngữ nghĩa. Thang gốc chỉ dùng cho phần trang trí (tag, avatar, minh hoạ).
- Cần màu trong suốt thì dùng bản `-a*`, không dùng `opacity`.
- Chữ trên màu đặc luôn dùng `-contrast`.
- Không phân biệt trạng thái chỉ bằng hue. Kèm icon hoặc chữ.

## Trang chọn màu (GitHub Pages)

`index.html` ở gốc repo là trang chọn màu tự chứa (không gọi mạng), sinh bởi `bun run build`. Luôn commit bản sinh từ build mặc định (không kèm `--primary`…). Bật Pages: Settings → Pages → Source `Deploy from a branch` → Branch `main`, thư mục `/ (root)` → Save.
