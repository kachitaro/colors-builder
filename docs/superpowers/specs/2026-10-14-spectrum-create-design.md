# Spectrum Create — design

## Intent

Nâng trang chọn màu (`picker.html`) thành công cụ kiểu shadcn `/create`: tuỳ chỉnh toàn bộ design system (Style, Radius, Font, Icon, preview trực tiếp, mã chia sẻ, phím `R` để randomize), nhưng **phần màu do bộ sinh của repo này đảm nhiệm** thay cho bảng màu của shadcn: thang 12 bậc OKLCH, màu phụ theo harmony, audit WCAG.

## Goals

- Giữ đầy đủ các điều khiển của `/create`: Style, Base/Theme (thay bằng màu Spectrum), Radius, Font (+ heading font), Icon library, Menu, Chart color, preview, history, lock, random, reset, share.
- Màu nhập tự do: neutral (6 thang), primary (tên hue hoặc hex bất kỳ), `primary-step`, `harmony` (`complementary|split|analogous|triadic`), `destructive/success/warning/info`, `chart`. Tương đương các tuỳ chọn `build.ts` hiện có.
- Bộ sinh chạy **trong trình duyệt**, cùng mã với CLI (`scale.ts`, `harmony.ts`, `config.ts`), preview đổi màu theo thời gian thực.
- Link chia sẻ gồm hai phần: mã preset của shadcn (Style/Radius/Font/Icon/...) và tham số màu riêng.
- Kết quả cuối: copy / tải `colors.css` và `theme.css` đúng định dạng README hiện tại, kèm báo cáo audit.

## Non-goals

- Không hỗ trợ `shadcn init --preset` cho phần màu (đã quyết định: bỏ).
- Không nhét hex tuỳ ý vào mã preset bit-packed của shadcn (không khả thi: mã là chỉ số trong danh sách cố định).
- Không xuất lên npm trong đợt này; không làm v0 / backend riêng.

## Anti-goals (thất bại dù chạy được)

- Màu xuất ra không đạt audit WCAG hoặc khác kết quả `bun run build` cho cùng tham số.
- Hai bản logic sinh màu (một trong CLI, một trong app). Chỉ được có một.
- Mất khả năng chạy CLI hiện tại.

## Decisions (người dùng đã chọn)

1. Hướng B: fork app `/create` mã nguồn mở của `shadcn-ui/ui` (`apps/v4/app/(app)/(create)`), thay phần màu.
2. Mã chia sẻ cách 2: `?preset=<mã shadcn>&neutral=..&primary=..&harmony=..` (màu đi bằng tham số riêng).
3. Bỏ `shadcn init --preset` cho màu.
4. Dựng thành **monorepo** trong repo `colors-builder`.

## Calls tôi tự quyết (cần bạn duyệt)

- **Quản lý workspace: bun workspaces** (repo hiện đã dùng bun, `bun.lock`). shadcn dùng pnpm; ta không theo.
- **Cấu trúc:**
  ```
  packages/spectrum/   package hiện tại (src/, dist/, build, audit). Tên giữ `spectrum-colors`.
  apps/create/         bản fork app /create (Next.js)
  package.json         workspaces: ["packages/*", "apps/*"]
  ```
  `packages/spectrum` export thêm lõi sinh màu (`scale`, `harmony`, `config`, hàm dựng token) để app import. `build.ts` chỉ còn là CLI mỏng gọi lõi đó.
- **Phụ thuộc shadcn:** dùng gói npm `shadcn` (cho `shadcn/preset`: `encodePreset`/`decodePreset`) thay vì sao chép `packages/shadcn`. Chỉ vendored phần `(create)` và các registry/preview mà nó cần.
- **Giữ nguyên** thứ chưa liên quan màu: Style, Radius, Font, Icon, preview, history, lock, random.
- **Thay**: `theme-picker`, `chart-color-picker`, `merge-theme.ts`, phần `baseColor/theme/chartColor` của `search-params.ts`, `preset-code`/`preset-query` (tách tham số màu ra khỏi mã shadcn), `design-system-provider` (tiêm CSS vars sinh ra thay cho `buildTheme`).
- **GitHub Pages**: trang chọn màu tự chứa cũ (`index.html`) bị thay bằng app mới; CI cần build/export static (`output: "export"`) nếu muốn tiếp tục dùng Pages. Là hạng mục phụ, làm sau cùng.

## Constraints

- Bản fork nhắm Next.js 16 / React 19 / Tailwind v4 như upstream. Preview component của shadcn nằm trong `registry/` (rất nhiều file); chỉ lấy phần cần.
- Giấy phép upstream: MIT; giữ thông báo bản quyền khi vendored mã.
- Build CLI phải **vẫn thất bại** khi audit không đạt; app phải hiển thị cảnh báo khi cặp chữ/UI không đạt.
- Mã tham số màu phải parse an toàn (hex không hợp lệ, hue không tồn tại → rơi về mặc định, không crash).

## Left to the builder

- Thứ tự cắt `apps/v4` thành app độc lập: kiểm tra phụ thuộc thực tế vào `registry/`, `components/`, workspace packages. **Làm spike trước** để biết phần nào kéo theo phần nào.
- Cách mã hoá tham số màu trên URL (tên tham số, độ dài), miễn là parse/serialize khứ hồi.
- Cách tiêm CSS vars vào iframe preview (upstream dùng `use-iframe-sync`).
- Cách chia lõi sinh màu cho dùng chung Node + trình duyệt (`culori` đã dùng được cả hai).

## Verification (phải chứng minh được)

- Cùng tham số màu: kết quả `colors.css`/`theme.css` từ app **trùng từng byte** với `bun run build -- ...`.
- Mở app, đổi primary/neutral/harmony → preview đổi, audit hiển thị đúng; reload từ link chia sẻ khôi phục đúng trạng thái.
- `bun run build` trong `packages/spectrum` vẫn đạt, `dist/` khớp CI.
