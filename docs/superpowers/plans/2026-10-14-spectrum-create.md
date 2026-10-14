# Spectrum Create Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Một app kiểu shadcn `/create` trong monorepo, nơi phần màu do bộ sinh Spectrum (thang 12 bậc OKLCH, harmony, audit WCAG) đảm nhiệm, chạy trong trình duyệt.

**Architecture:** Bun workspaces: `packages/spectrum` (lõi sinh màu thuần + CLI mỏng) và `apps/create` (fork phần `(create)` của `shadcn-ui/ui` `apps/v4`). Preview là iframe nhận `design-system-params` qua postMessage; điểm chèn màu là `design-system-provider.tsx`, nơi thay `buildRegistryTheme` bằng CSS do `buildSpectrum` sinh. URL = mã preset shadcn (Style/Radius/Font/Icon/Menu) + tham số màu riêng.

**Tech Stack:** Bun workspaces, TypeScript, culori, Next.js 16 / React 19 / Tailwind v4, nuqs, gói npm `shadcn` (`shadcn/preset`, `shadcn/schema`, `shadcn/icons`), `bun test`.

**Spec:** `docs/superpowers/specs/2026-10-14-spectrum-create-design.md`

## Global Constraints

- Quản lý workspace: bun workspaces (`bun.lock`), không dùng pnpm.
- Cấu trúc: `packages/spectrum/`, `apps/create/`, `package.json` gốc có `workspaces: ["packages/*", "apps/*"]`. Tên package giữ `spectrum-colors`.
- Chỉ một bản logic sinh màu: `packages/spectrum/src` (`scale.ts`, `harmony.ts`, `config.ts`, `core.ts`). App import, không sao chép.
- Màu xuất từ app phải **trùng từng byte** với `bun run build -- <cùng tham số>` cho `colors.css`, `theme.css`.
- `bun run build` vẫn thất bại (exit 1) khi có cặp chữ/UI không đạt; app hiển thị cảnh báo khi có.
- Không dùng `shadcn init --preset` cho màu; không nhét hex vào mã preset bit-packed.
- Mã vendored từ upstream giữ thông báo MIT (`apps/create/LICENSE-shadcn`).
- Tham số màu trên URL parse an toàn: giá trị lạ → rơi về mặc định, không throw.
- Next.js 16 / React 19 / Tailwind v4 như upstream.

## Review Focus

1. Hex nhập dạng `#FFF`, `2563EB` (thiếu `#`), chữ hoa, có khoảng trắng → chuẩn hoá thành `#rrggbb` hoặc coi là không hợp lệ (rơi về `neutral`), không crash.
2. `harmony` khi `primary=neutral` → bỏ qua ở URL, vô hiệu ở UI (CLI vẫn throw như hiện nay).
3. Link cũ/ngoài: có `preset=` hợp lệ nhưng không có tham số màu; hoặc preset mã cũ chứa baseColor/theme của shadcn → mở được, màu = mặc định Spectrum.
4. Hue chữ tối (`yellow`, `amber`, `lime`, `sky`, `mint`) làm primary ở step 9–10; primary-step 1–12 và giá trị ngoài khoảng → kẹp về 9; kết quả audit hiển thị đúng.
5. Randomize (`R`) không bao giờ áp dụng cấu hình làm audit thất bại; dark mode và light mode đều được sinh/preview.

---

### Task 1: Chuyển repo thành monorepo

**Files:**
- Move: `src/`, `dist/`, `tsconfig.json`, `README.md`, `index.html`(tạm), `package.json` → `packages/spectrum/`
- Create: `package.json` (gốc, private, workspaces), `.gitignore` bổ sung `node_modules`, `.next`
- Modify: `.github/workflows/audit.yml`

**Interfaces:**
- Produces: lệnh gốc `bun run build` (= build package spectrum), `bun run typecheck`, `bun run test`; package `spectrum-colors` tại `packages/spectrum`.

- [ ] **Step 1: Ghi lại baseline.** Chạy `bun run build`, `git status` sạch (chứng minh `dist/` đã khớp).
- [ ] **Step 2: `git mv` các file trên vào `packages/spectrum/`**, giữ lịch sử.
- [ ] **Step 3: Tạo `package.json` gốc** `{ "private": true, "workspaces": ["packages/*","apps/*"], "scripts": { "build": "bun run --filter spectrum-colors build", "typecheck": "bun run --filter '*' typecheck", "test": "bun run --filter '*' test" } }`; `bun install`.
- [ ] **Step 4: Sửa CI**: `git diff --exit-code packages/spectrum/dist packages/spectrum/index.html`.
- [ ] **Step 5: Verify.** `bun run build` rồi `git status`: `dist/` và `index.html` không đổi. `bun run typecheck` đạt.
- [ ] **Step 6: Commit** `chore: convert to bun workspaces monorepo`.

### Task 2: Tách lõi sinh màu thuần khỏi CLI

**Files:**
- Create: `packages/spectrum/src/core.ts`, `packages/spectrum/src/core.test.ts`
- Modify: `packages/spectrum/src/build.ts` (còn là CLI mỏng), `packages/spectrum/package.json` (thêm export `"./core": "./src/core.ts"`, script `test`: `bun test`)

**Interfaces:**
- Produces (không `fs`, không `process.argv`, chạy được trong trình duyệt):
  ```ts
  export type SpectrumOptions = {
    neutral: string; primary: string; primaryStep: number;
    destructive: string; success: string; warning: string; info: string;
    chart: string[]; harmony: "" | Harmony;
  };
  export const DEFAULT_OPTIONS: SpectrumOptions; // = giá trị mặc định hiện ở build.ts
  export type AuditRow = { mode: Mode; where: string; pair: string; ratio: number; need: number; kind: "text"|"ui"|"info" };
  export type SpectrumResult = {
    colorsCss: string; themeCss: string; auditMd: string;
    tokens: unknown;
    audit: { rows: AuditRow[]; fails: AuditRow[]; infos: AuditRow[]; minChartDE: number };
  };
  export function buildSpectrum(opts?: Partial<SpectrumOptions>): SpectrumResult;
  ```
- `buildSpectrum` giữ nguyên mọi `throw` hiện có (harmony sai, harmony + neutral, hue không tồn tại).

- [ ] **Step 1: Viết test (golden).** Trong `core.test.ts`: đọc `dist/colors.css`, `dist/theme.css`, `dist/audit.md` đã commit; `expect(buildSpectrum().colorsCss).toBe(...)` cho ba file. Test thứ hai `"sand + #2563eb + triadic"`: chạy CLI vào thư mục tạm (`bun src/build.ts --neutral sand --primary "#2563eb" --harmony triadic --out <tmp>`) rồi so ba file với `buildSpectrum({neutral:"sand",primary:"#2563eb",harmony:"triadic"})`. Test thứ ba: `buildSpectrum({harmony:"triadic"})` (primary mặc định `neutral`) `toThrow`.
- [ ] **Step 2: Chạy `bun test`**, thấy FAIL (core chưa có).
- [ ] **Step 3: Chuyển phần tính toán của `build.ts` (từ `OPT`/scales/semantic/audit/chuỗi css/tokens/auditMd) vào `buildSpectrum`.** Chuyển trạng thái module-level (`OPT`, `extra`, `scales`, `rows`) thành biến cục bộ. `build.ts` chỉ: parse `process.argv` → `SpectrumOptions`, gọi lõi, `writeFileSync` các file, `console.log` tóm tắt, `await import("./picker.ts")`, đặt `exitCode = 1` nếu `audit.fails.length`.
- [ ] **Step 4: Chạy `bun test`**, PASS. `bun run build`: `git diff packages/spectrum/dist` chỉ có thể khác ở `tokens.json` phần `options`; `colors.css`, `theme.css`, `audit.md` không đổi. (Kiểm tra `picker.ts`/`picker.html` có đọc `tokens.options` không trước khi chấp nhận đổi.)
- [ ] **Step 5: Commit** `refactor: extract pure buildSpectrum core`.

### Task 3: Spike — chạy được `/create` của shadcn trong `apps/create`

**Files:**
- Create: `apps/create/` (vendored từ `shadcn-ui/ui` tại một commit cố định, ghi hash vào `apps/create/UPSTREAM.md`), `apps/create/LICENSE-shadcn`
- Chỉ lấy: `app/(app)/(create)/**`, `app/(view)/preview/**`, phần `registry/`, `styles/base-*`, `components/`, `hooks/`, `lib/` mà `/create` import (lập danh sách bằng grep các import `@/…`; thống kê hiện có ~30 nhóm: `@/registry/config`, `@/styles/base-nova/ui/*`, `@/components/copy-button`, `@/hooks/use-mounted`, `@/lib/font-definitions`, …).

**Interfaces:**
- Produces: `bun run --filter create dev` phục vụ `/create` giống upstream (chưa đổi màu); `apps/create/package.json` có script `typecheck`, `test`, `dev`, `build`.

- [ ] **Step 1: Clone shallow upstream ra thư mục tạm, sao chép tập tối thiểu**; thay `workspace:*` bằng gói npm `shadcn` (kiểm tra `shadcn/preset`, `shadcn/schema`, `shadcn/icons`, `shadcn/utils` đều có export).
- [ ] **Step 2: Chạy `bun install`, `bun run --filter create dev`**, sửa đến khi `/create` hiển thị. Loại bỏ route không cần (`init/v0`, devtools nếu kéo phụ thuộc lớn); ghi lại những gì đã loại vào `UPSTREAM.md`.
- [ ] **Step 3: Chạy các test upstream còn lại** (`search-params.test.ts`, `preset-query.test.ts`, `parse-config.test.ts`…) bằng `bun test`; test nào phụ thuộc phần đã loại thì xoá cùng phần đó.
- [ ] **Step 4: Smoke trong trình duyệt:** mở `http://localhost:4000/create?preset=b18OWG`, preview iframe hiện dashboard; đổi Radius/Font/Icon, thấy preview đổi; phím `R` randomize hoạt động.
- [ ] **Step 5: Commit** `feat(create): vendor shadcn /create app`.

### Task 4: Tham số màu trên URL

**Files:**
- Create: `apps/create/app/(app)/(create)/lib/spectrum-params.ts`, `apps/create/app/(app)/(create)/lib/spectrum-params.test.ts`

**Interfaces:**
- Consumes: `SpectrumOptions`, `DEFAULT_OPTIONS`, `HUES`, `NEUTRALS`, `HARMONY` từ `spectrum-colors/core` / `spectrum-colors/src/config`.
- Produces:
  ```ts
  export const spectrumParsers: Record<keyof SpectrumUrlParams, UseQueryStateOptions<...>>; // dùng với nuqs
  export type SpectrumUrlParams = { neutral: string; primary: string; step: number; harmony: string; destructive: string; success: string; warning: string; info: string; chart: string };
  export function toSpectrumOptions(p: SpectrumUrlParams): SpectrumOptions; // chuẩn hoá, rơi về mặc định
  export function fromSpectrumOptions(o: SpectrumOptions): SpectrumUrlParams;
  ```
  Tên tham số URL: `neutral`, `primary` (hex không kèm `#`, ví dụ `2563eb`, hoặc tên hue), `step`, `harmony`, `destructive`, `success`, `warning`, `info`, `chart` (danh sách phân tách bằng dấu phẩy).

- [ ] **Step 1: Viết test** (`bun test`): (a) khứ hồi `fromSpectrumOptions(toSpectrumOptions(p))` bằng nhau cho một cấu hình đầy đủ; (b) `primary=FFF`, `primary=#2563EB`, `primary=2563EB` → `#2563eb` hoặc, với `FFF`, mặc định `neutral`; (c) `neutral=nope`, `harmony=nope`, `step=99`, `step=abc` → mặc định (`gray`, `""`, `9`, `9`); (d) `harmony=triadic` + `primary=neutral` → `harmony: ""`; (e) `chart=blue,nope,red` → bỏ phần tử lạ, giữ phần còn lại, rỗng thì mặc định.
- [ ] **Step 2: Chạy test**, FAIL.
- [ ] **Step 3: Implement** `toSpectrumOptions`/`fromSpectrumOptions`/`spectrumParsers`; mặc định lấy từ `DEFAULT_OPTIONS` (không lặp giá trị).
- [ ] **Step 4: Chạy test**, PASS.
- [ ] **Step 5: Commit** `feat(create): spectrum color URL params`.

### Task 5: Tiêm CSS Spectrum vào preview

**Files:**
- Create: `apps/create/app/(app)/(create)/lib/spectrum-css.ts`, `…/spectrum-css.test.ts`
- Modify: `apps/create/app/(app)/(create)/components/design-system-provider.tsx` (khối `registryTheme`/`buildThemeCssText`, dòng ~189–230), `…/lib/search-params.ts` (thêm `spectrumParsers` vào bộ tham số thiết kế), `…/components/preview.tsx` / `use-iframe-sync` nếu cần để tham số mới đi qua postMessage

**Interfaces:**
- Consumes: `buildSpectrum`, `toSpectrumOptions` (Task 2, 4).
- Produces: `export function spectrumThemeCss(o: SpectrumOptions, pointer: boolean): { css: string; audit: SpectrumResult["audit"] }` — `css` = `colors.css` + khối biến ngữ nghĩa của `theme.css` (phần `:root,.light` và `.dark`, không gồm `@theme`/`@custom-variant`, vì Tailwind đã có trong app) + quy tắc con trỏ như `buildThemeCssText` hiện làm khi `pointer` bật; kết quả được memo theo `o`.

- [ ] **Step 1: Viết test:** với `o = {…DEFAULT_OPTIONS, neutral:"sand", primary:"#2563eb"}`, `spectrumThemeCss(o,false).css` chứa toàn bộ dòng `--<token>: …` của `buildSpectrum(o).themeCss` trong `:root` và `.dark`; và `audit.fails.length === 0`.
- [ ] **Step 2: Chạy**, FAIL.
- [ ] **Step 3: Implement `spectrumThemeCss`**; trong `design-system-provider.tsx` bỏ `buildRegistryTheme` cho màu, ghi `css` vào `<style id=THEME_STYLE_ELEMENT_ID>`; tham số màu đi cùng `design-system-params` vào iframe.
- [ ] **Step 4: Smoke:** mở `/create?primary=2563eb&neutral=slate`: preview dùng xanh `2563eb`; `?primary=2563eb&harmony=triadic` có thêm thang `brand-2/3`; bật dark mode vẫn đúng.
- [ ] **Step 5: Commit** `feat(create): drive preview theme from buildSpectrum`.

### Task 6: Bộ chọn màu Spectrum và bỏ bảng màu của shadcn

**Files:**
- Create: `…/components/spectrum-picker.tsx`
- Delete: `…/components/theme-picker.tsx`, `…/components/chart-color-picker.tsx`, `…/lib/merge-theme.ts`
- Modify: `…/components/customizer.tsx` (thay hai picker bằng `SpectrumPicker`), `…/lib/search-params.ts` (bỏ `baseColor`, `theme`, `chartColor`), `…/lib/preset-code.ts`, `…/lib/preset-query.ts`, `…/lib/parse-config.ts`, `…/lib/randomize-biases.ts`, `…/lib/shuffle-presets.ts`, `…/hooks/use-locks.tsx`, `…/hooks/use-random.tsx`, `…/hooks/use-design-system.ts`, `…/components/design-system-provider.tsx` (class `base-color-*`)
- Test: `…/lib/random-spectrum.test.ts`

**Interfaces:**
- Consumes: `spectrumParsers`, `toSpectrumOptions`, `buildSpectrum` (Task 2, 4).
- Produces: `export function randomSpectrum(rng: () => number): SpectrumOptions` (neutral ngẫu nhiên trong `NEUTRALS`, primary là hue hoặc hex ngẫu nhiên, harmony ngẫu nhiên hoặc rỗng, thử lại tối đa 20 lần đến khi `audit.fails.length === 0`).
- `getPresetCode` mã hoá các trường shadcn **còn lại**; `baseColor`/`theme`/`chartColor` đặt cố định ở giá trị mặc định của shadcn để `encodePreset` hợp lệ.

- [ ] **Step 1: Viết test `randomSpectrum`:** 200 seed khác nhau → mọi kết quả `buildSpectrum(...).audit.fails.length === 0` và `toSpectrumOptions(fromSpectrumOptions(o))` khứ hồi.
- [ ] **Step 2: Chạy**, FAIL.
- [ ] **Step 3: Implement `randomSpectrum`; nối vào `use-random`** để phím `R` đổi cả phần màu; khoá (`use-locks`) có khoá riêng cho nhóm màu.
- [ ] **Step 4: Dựng `SpectrumPicker`:** neutral (6), primary (danh sách hue + ô nhập hex), primary-step (1–12), harmony (ô chọn bị vô hiệu khi `primary=neutral`), destructive/success/warning/info, chart (8 ô); điều khiển ghi qua `spectrumParsers`.
- [ ] **Step 5: Xoá bảng màu shadcn** (các file/trường nêu trên), sửa mọi nơi tham chiếu; `bun run --filter create typecheck` đạt.
- [ ] **Step 6: Smoke:** đổi từng điều khiển, thấy preview đổi và URL đổi; bấm `R` 10 lần không lỗi; tải lại URL khôi phục đúng trạng thái.
- [ ] **Step 7: Commit** `feat(create): spectrum color picker replaces shadcn base color & theme`.

### Task 7: Preset, link chia sẻ, mở preset

**Files:**
- Modify: `…/components/copy-preset.tsx`, `…/components/share-button.tsx`, `…/components/open-preset.tsx`, `…/lib/parse-preset-input.ts`, `…/lib/preset-query.ts`
- Test: cập nhật `…/lib/parse-preset-input.test.ts`, `…/lib/preset-query.test.ts`

**Interfaces:**
- Consumes: `getPresetCode`, `fromSpectrumOptions`.
- Produces: link chia sẻ `…/create?preset=<mã>&neutral=…&primary=…&harmony=…`; "Open preset" nhận cả mã trần (`b18OWG`) lẫn URL đầy đủ.

- [ ] **Step 1: Viết test:** (a) khứ hồi: serialize một cấu hình rồi `parse-preset-input` trả lại cùng cấu hình (cả shadcn lẫn màu); (b) `b18OWG` trần → cấu hình shadcn đúng, màu mặc định; (c) preset có baseColor/theme cũ của shadcn → mở được, màu mặc định.
- [ ] **Step 2: Chạy**, FAIL. **Step 3: Implement.** **Step 4: Chạy**, PASS.
- [ ] **Step 5: Smoke:** bấm Share, dán link vào tab mới, trạng thái trùng; thử `?preset=b18OWG` trần.
- [ ] **Step 6: Commit** `feat(create): shareable link with spectrum params`.

### Task 8: Panel audit và xuất CSS

**Files:**
- Create: `…/components/audit-panel.tsx`, `…/components/export-css.tsx`
- Modify: `…/components/customizer.tsx` (đặt panel/nút)

**Interfaces:**
- Consumes: `spectrumThemeCss`/`buildSpectrum`.
- Produces: nút "Copy CSS"/"Download": `colors.css` và `theme.css` (đủ `@theme inline`, đúng như CLI); panel audit liệt kê cặp không đạt (`audit.fails`) và số cặp "info".

- [ ] **Step 1: Viết test (`bun test`):** nội dung do `export-css` sinh `toBe` `buildSpectrum(o).colorsCss` / `.themeCss` cho `o` mẫu (hex + harmony); so thêm với kết quả `bun src/build.ts` cùng tham số (byte-identical).
- [ ] **Step 2: Chạy**, FAIL. **Step 3: Implement.** **Step 4: Chạy**, PASS.
- [ ] **Step 5: Smoke:** chọn primary `#ffe600` ở step 9, panel hiển thị trạng thái audit đúng (đạt hoặc liệt kê cặp lỗi); tải file và so với CLI.
- [ ] **Step 6: Commit** `feat(create): audit panel and CSS export`.

### Task 9: Dọn trang cũ, CI, README, Pages

**Files:**
- Delete: `packages/spectrum/src/picker.html`, `picker.ts`, `browser.ts`, `packages/spectrum/index.html` (và bước `await import("./picker.ts")` trong `build.ts`)
- Modify: `.github/workflows/audit.yml` (thêm `bun run test`, build app), `README.md` gốc (mô tả monorepo, cách chạy `bun run --filter create dev`), `apps/create/next.config.*` (static export nếu giữ GitHub Pages)

- [ ] **Step 1: Xoá trang chọn màu cũ và mọi tham chiếu**; chạy `bun run typecheck && bun run test && bun run build`.
- [ ] **Step 2: Cập nhật CI**: typecheck, test, build spectrum, build app, `git diff --exit-code packages/spectrum/dist`.
- [ ] **Step 3: Pages:** thử `output: "export"`; route handler của upstream (`init/*`) bị loại ở Task 3 nên export phải build được. Nếu vẫn bị chặn, ghi rõ chặn gì vào README và báo lại, không bỏ qua.
- [ ] **Step 4: Verify cuối:** `bun run build` đạt, `bun run --filter create build` đạt, `bun run test` đạt.
- [ ] **Step 5: Commit** `chore: remove legacy picker, update CI and docs`.
