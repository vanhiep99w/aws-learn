# AWS Learn — Quickstart

## Repository này là gì?

`aws-learn` là một kho kiến thức AWS tiếng Việt có hai bề mặt sản phẩm chính:

1. **Trang tài liệu**: các bài Markdown ở thư mục gốc được biên dịch thành website Fumadocs/Next.js dạng static export.
2. **Practice Q&A**: một ứng dụng HTML/JavaScript độc lập để luyện câu hỏi AWS ở chế độ Practice hoặc Review; dữ liệu và tiến độ được lưu trong Cloudflare D1 qua Pages Functions.

[`README.md`](../README.md) vừa là mục lục học tập vừa là **source of truth cho tập tài liệu được xuất bản**. Tại thời điểm khảo sát, parser nhận 140 file Markdown duy nhất trong 21 category. Các con số `116` đang hard-code trong [`public/index.html`](../public/index.html) và [`src/app/layout.tsx`](../src/app/layout.tsx) đã cũ, không nên dùng làm số liệu chuẩn.

## Kiến trúc ở mức cao

```text
README.md + root/*.md + docs/diagrams/*
                  │
                  ▼
       scripts/prepare-content.mjs
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
content/docs/*         public/diagrams/*
(generated MDX)        (generated assets)
        │
        ▼
Fumadocs + Next.js static export ─────────► dist/
        │                                    │
        │                         Cloudflare Pages
        │                                    │
        └──── public/practice/index.html      ├─ /api/questions
                                              ├─ /api/practice-history
                                              └─ Cloudflare D1
```

Các lớp chính:

- **Knowledge source** — [`README.md`](../README.md), khoảng 140 bài `*.md` ở root và diagram nguồn trong [`docs/diagrams/`](../docs/diagrams/).
- **Build pipeline** — [`scripts/prepare-content.mjs`](../scripts/prepare-content.mjs) tạo content Fumadocs, metadata category, link nội bộ và assets.
- **Docs runtime/build** — [`src/`](../src/), [`source.config.ts`](../source.config.ts), [`next.config.mjs`](../next.config.mjs).
- **Static experiences** — [`public/practice/index.html`](../public/practice/index.html); [`public/index.html`](../public/index.html) tồn tại nhưng static build hiện tạo redirect `/` từ catch-all route và ghi đè entrypoint root này.
- **Serverless API/data** — [`functions/api/`](../functions/api/), [`schema.sql`](../schema.sql), [`wrangler.toml`](../wrangler.toml).
- **Agent workflow** — [`.agents/skills/aws-explain/`](../.agents/skills/aws-explain/) xác minh câu hỏi bằng nguồn AWS và lưu Q&A vào D1.

## Bắt đầu local

Yêu cầu thực tế từ manifest: Node.js/npm và Wrangler khi preview/deploy Cloudflare.

```bash
npm ci
npm run dev
```

`predev` tự chạy content preparation trước khi khởi động Next dev server. Quality gate chính hiện có là:

```bash
npm run build
```

Lệnh này chạy `prebuild` → tạo lại `content/docs/` và `public/diagrams/` → type-check/compile → static export vào `dist/`.

Để mô phỏng Cloudflare Pages sau khi đã build:

```bash
npm run preview
```

Không có test suite, lint script riêng hay workflow CI được track trong repository. Vì vậy, khi đổi UI/API nên kết hợp `npm run build` với kiểm tra thủ công các route liên quan. Xem [Development & deployment](workflows/development-and-deployment.md).

## Nên đọc gì theo loại thay đổi?

| Việc cần làm | Đọc trước | Source bắt đầu |
|---|---|---|
| Thêm/sửa bài AWS | [Authoring & verification](workflows/authoring-and-verification.md) | `README.md`, bài `*.md` tương ứng |
| Sửa category, sidebar, link docs | [Content & docs site](architecture/content-and-docs-site.md) | `scripts/prepare-content.mjs` |
| Sửa trang docs/MDX/Mermaid/search | [Content & docs site](architecture/content-and-docs-site.md) | `src/app/`, `source.config.ts` |
| Sửa Practice/Review UI | [Practice & data](architecture/practice-and-data.md) | `public/practice/index.html` |
| Sửa questions/history API hoặc D1 | [Practice & data](architecture/practice-and-data.md) | `functions/api/`, `schema.sql` |
| Build, preview, deploy, migration | [Development & deployment](workflows/development-and-deployment.md) | `package.json`, `wrangler.toml`, `scripts/` |
| Phân tích/lưu một AWS Q&A | [Authoring & verification](workflows/authoring-and-verification.md) | `.agents/skills/aws-explain/SKILL.md` |

## Quy ước quan trọng cần nhớ

- **Không chỉnh `content/docs/`, `.source/`, `public/diagrams/` hay `dist/` như source**: đây là output generated/ignored.
- Bài mới chỉ xuất hiện trên web khi có entry chính xác `- [x] [Title](file.md) - Description` dưới một section được parser hỗ trợ trong `README.md`.
- Nội dung AWS phải viết bằng tiếng Việt, có TOC khi đủ lớn và phải xác minh chi tiết bằng tài liệu AWS chính thức theo [`AGENTS.md`](../AGENTS.md).
- Diagram editable nằm ở `docs/diagrams/`; Markdown nên tham chiếu rendered asset bằng `/diagrams/<file>`.
- Practice UI phụ thuộc chặt vào format `description`, `metadata.answer` và các heading `##` trong `notes`; đổi contract phải cập nhật cả producer, API và parser UI.
- Questions API hiện cho phép đọc/ghi cross-origin mà không có authentication. Đây là hành vi có chủ ý trong source/history hiện tại, nhưng là rủi ro cần đánh giá trước mọi thay đổi public.

## Rule loading

Trước khi sửa repository:

1. Đọc [global Harness rules](./_rules.md).
2. Đọc mọi section `_rules.md` áp dụng cho file mục tiêu trước khi chỉnh sửa.
3. Nếu phạm vi công việc chuyển sang domain khác, đọc lại rules của domain đó.

Hiện wiki chưa có section `_rules.md` ngoài [`wiki/_rules.md`](./_rules.md). Không chỉnh bất kỳ `wiki/**/_rules.md` nào ngoài Harness proposal/approval/apply workflow.

## Các trang wiki

### Architecture

- [Content pipeline và docs site](architecture/content-and-docs-site.md) — cách README và Markdown trở thành Fumadocs static site.
- [Practice Q&A và data model](architecture/practice-and-data.md) — UI, API contract, D1 và business rules của luyện tập.

### Workflows

- [Authoring và AWS verification](workflows/authoring-and-verification.md) — viết bài, diagram, nguồn AWS và tạo Q&A.
- [Development và deployment](workflows/development-and-deployment.md) — command, generated artifacts, kiểm thử, Cloudflare và migration.

## Caveat đã biết

- `README.md` hiện có 141 checked entries nhưng chỉ 140 filename duy nhất vì `iam-identity-center.md` xuất hiện ở cả Account Management và Security. Parser dùng `Map`, nên occurrence cuối cùng thắng và bài được build dưới `security/`.
- `schema.sql` có `practice_answer_history` nhưng chưa khai báo `practice_question_notes`; API history tự tạo cả hai table/index khi có request.
- Root route của catch-all docs tạo redirect sang `/fundamentals/aws-overview/`; do đó landing HTML ở `public/index.html` không phải nội dung `/` trong output `dist/index.html` hiện tại.
- README nói push `main` sẽ auto-deploy, nhưng cấu hình kết nối Cloudflare Pages nằm ngoài repository; chỉ build/deploy scripts được version-control ở đây.
