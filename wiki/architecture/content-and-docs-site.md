# Content pipeline và docs site

## Mục đích của kiến trúc

Repository giữ bài học ở dạng Markdown đơn giản tại root để dễ đọc/chỉnh sửa, nhưng website cần category, title/description metadata, sidebar order và URL ổn định. [`scripts/prepare-content.mjs`](../../scripts/prepare-content.mjs) là adapter giữa hai mô hình:

```text
Human-maintained                         Generated
────────────────                         ─────────
README.md (catalog/order/category) ┐
root/*.md (article body)           ├──► content/docs/<category>/*.md
                                  │    content/docs/**/meta.json
docs/diagrams/*                   ┘──► public/diagrams/*
                                               │
                                               ▼
                                  Fumadocs MDX source
                                               │
                                               ▼
                                  Next.js static export (dist/)
```

Kiến trúc Fumadocs/Next.js thay thế Astro Starlight theo lịch sử git. Các thay đổi gần đây tiếp tục củng cố ranh giới source/generated: commit diagram mới nhất bổ sung bước copy `docs/diagrams/` vào `public/diagrams/` thay vì dùng asset generated làm source.

## Catalog: `README.md` là source of truth

Parser chỉ nhận entry khớp dạng:

```markdown
- [x] [Tên hiển thị](filename.md) - Mô tả
```

Entry phải nằm dưới một `## Section` có trong `SECTION_TO_DIR`. Mapping hiện bao phủ 21 category, ví dụ `Compute → compute`, `Infrastructure as Code → iac`, `Monitoring & Management → monitoring-management`.

Mỗi entry cung cấp:

- category và URL prefix;
- title dùng làm fallback;
- description đưa vào YAML frontmatter generated;
- thứ tự trong category.

Các chi tiết dễ gây lỗi:

- Regex chỉ nhận lowercase `[x]`, filename kết thúc `.md` và có mô tả sau ` - `.
- `fileMap` là `Map` theo filename. Nếu một file xuất hiện nhiều lần, occurrence cuối ghi đè metadata/category trước đó.
- Hiện `iam-identity-center.md` bị lặp ở Account Management và Security; kết quả generated nằm dưới `security/`.
- Script parse 140 filename duy nhất tại thời điểm khảo sát, dù README có 141 checked rows.
- Category order trên sidebar không lấy trực tiếp từ thứ tự README; nó dùng hằng `CATEGORY_ORDER` riêng ở cuối script.

Khi thêm category mới, phải cập nhật cả `SECTION_TO_DIR` và `CATEGORY_ORDER`; chỉ thêm heading vào README là chưa đủ.

## Biến đổi một bài Markdown

Với mỗi file trong catalog, script:

1. Đọc title từ `# Heading` đầu tiên; fallback sang title trong README.
2. Xóa section TOC thủ công từ `## Mục lục` đến separator `---` kế tiếp.
3. Rewrite link dạng `[text](filename.md)` hoặc `[text](./filename.md)` thành URL `/<category>/<slug>/` nếu target có trong catalog.
4. Sinh frontmatter `title` và `description`.
5. Xóa dòng `# Heading` đầu tiên vì title sẽ do Fumadocs render.
6. Ghi vào `content/docs/<category>/<filename>`.
7. Sinh `meta.json` cho category và root sidebar.

Giới hạn cần biết:

- Link rewriter chỉ match filename lowercase bắt đầu bằng `[a-z]` và chứa `[a-z0-9-]`; link có path phức tạp hoặc target ngoài catalog được giữ nguyên.
- TOC remover phụ thuộc đúng heading `## Mục lục` và separator `---`.
- `content/docs/` không được clear toàn bộ trong script. Nếu xóa/đổi tên entry, output cũ có thể còn lại trong working tree generated; dùng clean regeneration khi kiểm tra thay đổi loại này.
- File source không nên có YAML frontmatter; frontmatter web được sinh từ catalog.

Xem workflow sửa bài tại [Authoring và AWS verification](../workflows/authoring-and-verification.md).

## Fumadocs và static routing

[`source.config.ts`](../../source.config.ts) khai báo `content/docs` là docs source và cài custom remark transform cho Mermaid. [`src/lib/source.ts`](../../src/lib/source.ts) nạp generated source với `baseUrl: '/'`.

Catch-all route [`src/app/[[...slug]]/page.tsx`](../../src/app/[[...slug]]/page.tsx):

- resolve trang bằng slug Fumadocs;
- render title, description, TOC và body;
- register các MDX component: `MermaidDiagram`, Callout, Cards, Steps, Tabs, Accordions và TypeTable;
- generate toàn bộ static params;
- redirect root slug sang `/fundamentals/aws-overview/`.

[`next.config.mjs`](../../next.config.mjs) đặt:

- `output: 'export'` — không có Next server runtime;
- `distDir: 'dist'` — output deploy;
- trailing slash URLs;
- unoptimized images để tương thích static hosting;
- remark plugin đổi GitHub-style admonitions sang directives.

Layout chung ở [`src/app/layout.tsx`](../../src/app/layout.tsx) dùng tiếng Việt và static search. Docs layout ở [`src/app/[[...slug]]/layout.tsx`](../../src/app/[[...slug]]/layout.tsx) lấy sidebar tree từ Fumadocs source.

## Search index

[`src/app/api/search/route.ts`](../../src/app/api/search/route.ts) là route được static-export, không phải Cloudflare Function. Search index chỉ gồm:

- title;
- description;
- URL/ID;
- headings.

Nội dung paragraph bị cố ý loại khỏi `structuredData.contents` để asset search không vượt giới hạn 25 MiB của Cloudflare Pages. Nếu mở rộng full-text search, phải đo kích thước `dist/api/search/*` và cân nhắc giới hạn deploy; đừng chỉ thay mapper.

## Mermaid và diagram assets

Có hai pipeline diagram khác nhau:

### Mermaid trong bài

`source.config.ts` đổi fenced code block `mermaid` thành `<MermaidDiagram chart="..." />`. Component client [`src/components/mermaid.tsx`](../../src/components/mermaid.tsx) dynamic-import Mermaid trong `useEffect`, render SVG và gắn vào DOM. Khi sửa:

- giữ component được register trong page MDX components;
- kiểm tra cả hydration và nhiều diagram trên cùng trang;
- chạy production build vì transform xảy ra trong MDX compilation.

### Diagram file

Source editable/rendered được version-control tại [`docs/diagrams/`](../../docs/diagrams/). Content preparation xóa `public/diagrams/`, tạo lại và copy cả directory; bài dùng đường dẫn tuyệt đối như:

```markdown
![Luồng SSH](/diagrams/vpc-ssh-full-flow-2-connections.png)
```

`public/diagrams/` bị gitignore; không chỉnh file ở đó. Commit bastion gần đây là mẫu tốt: giữ `.excalidraw` làm source, PNG làm rendered artifact trong `docs/diagrams/`, rồi để build publish bản copy.

## Static public pages và root route

Next static export copy nội dung `public/`, gồm Practice UI và favicon. Tuy nhiên `/` cũng là một generated catch-all route có redirect. Kết quả build hiện tại cho `dist/index.html` là redirect 307 tới docs, không phải HTML landing ở [`public/index.html`](../../public/index.html). Vì vậy:

- `/practice/` là static page độc lập đang được dùng;
- `public/index.html` là source landing có lịch sử thiết kế nhưng hiện không sở hữu route `/` trong output;
- nếu muốn phục hồi landing, phải giải quyết route ownership giữa public asset và `[[...slug]]`, rồi kiểm tra `dist/index.html` thay vì chỉ chạy compile.

Spec CloudPro trong [`docs/cflow/specs/`](../../docs/cflow/specs/) và artifacts trong [`landing-page/`](../../landing-page/) là tài liệu/design phụ, không tham gia docs build hiện tại.

## Checklist khi thay đổi pipeline

1. Xác nhận entry README được parser nhận và không duplicate filename ngoài chủ ý.
2. Nếu đổi category, cập nhật mapping lẫn sidebar order.
3. Regenerate sạch `content/docs/` khi đổi/xóa tên để phát hiện stale output.
4. Kiểm tra frontmatter generated, URL và cross-doc links của ít nhất một bài bị ảnh hưởng.
5. Kiểm tra diagram trong `public/diagrams/` sau prepare.
6. Chạy `npm run build`.
7. Mở một docs route, search và trang có Mermaid/diagram liên quan.
8. Không commit `content/docs/`, `.source/`, `.next/`, `public/diagrams/` hoặc `dist/`.
