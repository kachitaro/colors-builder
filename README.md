# Spectrum monorepo

Bun workspaces:

| Đường dẫn | Nội dung |
|---|---|
| `packages/spectrum` | `spectrum-colors`: bộ sinh thang màu 12 bậc OKLCH + audit WCAG. Xem [README](packages/spectrum/README.md). |
| `apps/create` | Công cụ kiểu shadcn `/create` (fork `apps/v4` của [shadcn-ui/ui](https://github.com/shadcn-ui/ui), MIT). Phần màu do Spectrum đảm nhiệm. Xem [UPSTREAM.md](apps/create/UPSTREAM.md). |

## Chạy

```bash
bun install
bun run build        # sinh packages/spectrum/dist + audit
bun run test         # lõi sinh màu + phần logic của app create
cd apps/create
bun run registry:build   # lần đầu: sinh styles/ (gitignored)
bun run dev              # http://localhost:4000/create
```

`dev` dùng webpack (`next dev --webpack`): Turbopack không resolve được `next/font/google` ở bản fork này.

## Link chia sẻ

`/create?preset=<mã shadcn>&neutral=…&primary=…&harmony=…`

- Mã preset (bit-packed của shadcn) giữ Style, Font, Icon, Radius, Menu. Mã này không chứa màu: base color, theme và chart color của shadcn bị ghim ở mặc định.
- Màu đi bằng tham số riêng, chỉ ghi khi khác mặc định: `neutral`, `primary` (tên hue, `neutral`, hoặc hex không kèm `#`), `step` (1–12), `harmony` (`complementary|split|analogous|triadic`), `destructive`, `success`, `warning`, `info`, `chart` (danh sách hue, phân tách bằng dấu phẩy).
- Giá trị không hợp lệ rơi về mặc định, không lỗi.
- `shadcn init --preset` không áp dụng được phần màu. Dùng **Download CSS** / **Copy CSS** (cùng byte với `bun run build -- …` cho tham số tương ứng) và panel **Contrast audit**.

## GitHub Pages

```bash
cd apps/create
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/<tên-repo> bun run build   # xuất ra apps/create/out/ (đã thử: phục vụ dưới /colors-builder/ chạy đúng)
```

Workflow `audit.yml` chỉ build và kiểm tra; chưa có bước deploy. Muốn dùng Pages: Settings → Pages → Source `GitHub Actions` và thêm job đăng `apps/create/out/` bằng `actions/upload-pages-artifact` + `actions/deploy-pages`.
