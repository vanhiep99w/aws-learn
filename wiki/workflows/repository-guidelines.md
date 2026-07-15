# Quy tắc làm việc trong repository

Trang này là nơi tập trung các hướng dẫn dự án trước đây bị lặp trong `AGENTS.md` và `CLAUDE.md`. Hai file root giờ chỉ đóng vai trò bootstrap, yêu cầu agent đọc [`wiki/quickstart.md`](../quickstart.md) trước khi làm việc.

> Đây là hướng dẫn vận hành của repository, không phải reviewed Harness prompt rule. Các file [`wiki/_rules.md`](../_rules.md) và section `_rules.md` vẫn có precedence và chỉ được thay đổi qua Harness proposal/approval/apply workflow.

## Phạm vi dự án và source of truth

`aws-learn` là repository tài liệu học AWS tiếng Việt, đồng thời chứa Fumadocs webapp và Practice Q&A trên Cloudflare Pages.

- [`README.md`](../../README.md) là catalog/source of truth cho webapp.
- Các bài AWS nguồn là file `*.md` ở root.
- `content/docs/` do [`scripts/prepare-content.mjs`](../../scripts/prepare-content.mjs) sinh ra và bị gitignore.
- Không chỉnh trực tiếp `content/docs/`, `.source/`, `.next/`, `public/diagrams/` hoặc `dist/`.
- Kiến trúc đầy đủ nằm ở [Content pipeline và docs site](../architecture/content-and-docs-site.md).

Các quality gate và command thực tế lấy từ `package.json`:

```bash
npm run prepare-content
npm run dev
npm run build
npm run preview
```

Repository chưa có automated test suite hoặc lint script riêng; `npm run build` là gate chính cho thay đổi content/build code. Xem [Development và deployment](development-and-deployment.md).

## Quy tắc thêm và sửa tài liệu AWS

### Bài mới bắt buộc có README entry

Webapp chỉ build file có entry đúng dạng dưới một category được hỗ trợ:

```markdown
- [x] [Tên Hiển Thị](ten-file.md) - Mô tả ngắn
```

File mới phải:

1. nằm ở repository root;
2. dùng `# Heading` làm title, không có YAML frontmatter;
3. được thêm vào đúng section của `README.md`;
4. viết bằng tiếng Việt;
5. liên kết các chủ đề liên quan khi hữu ích;
6. có ví dụ thực tế và diagram khi chúng làm rõ nội dung.

Các section hợp lệ:

`Fundamentals` · `Compute` · `Storage` · `Database` · `Migration` · `Data Integration` · `Analytics` · `Networking` · `Account Management` · `Security` · `Partner & Marketplace` · `Monitoring & Management` · `Developer Tools` · `Infrastructure as Code` · `Messaging & Streaming` · `Global Applications Architecture` · `Cost Management` · `Support` · `AI/ML Services` · `End User Computing` · `Application Integration`

Quy trình chi tiết, caveat duplicate filename và link rewriting nằm ở [Authoring và AWS verification](authoring-and-verification.md).

### Mục lục

Mỗi bài documentation có ít nhất ba `##` headings phải có TOC ngay sau H1:

```markdown
# Tên Service

## Mục lục

- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

---
```

TOC phải liệt kê toàn bộ H2. Anchor dùng lowercase, thay space bằng `-`, bỏ ký tự đặc biệt và bỏ emoji khỏi anchor.

## Accuracy và nguồn AWS

Khi trả lời câu hỏi AWS hoặc tạo/cập nhật bài AWS, phải xác minh bằng tài liệu AWS chính thức trước khi kết luận.

Thứ tự công cụ:

1. Ưu tiên MCP server `aws-knowledge`:
   - `aws___search_documentation` để tìm tài liệu;
   - `aws___read_documentation` để đọc nội dung gốc;
   - `aws___get_regional_availability` cho Region support;
   - `aws___recommend` để mở rộng nguồn.
2. Nếu server chính rate-limit, unavailable hoặc lỗi transport, dùng `aws-documentation-mcp-server`: `search_documentation`, `read_documentation`, `read_sections`, `recommend`.
3. Nếu không có fallback tương đương cho Region, kiểm tra trực tiếp AWS Documentation, What's New hoặc Regional Services và ghi rõ cách xác minh.

Không suy đoán tên API, quota/limit, default behavior, Region availability hoặc launch date. Nếu không thể xác minh, ghi rõ:

> Chưa xác minh được từ tài liệu AWS tại thời điểm viết.

Các điểm quan trọng phải có link AWS official. Thứ tự ưu tiên nguồn là AWS Documentation, What's New, AWS Blog rồi AWS Pricing. Với workflow Q&A đầy đủ, dùng [AWS Explain skill](../../.agents/skills/aws-explain/SKILL.md), không tự rút gọn quy trình xác minh.

## Cloudflare D1 Questions API

API base public là:

```text
https://aws-learn.pages.dev/api/questions
```

Source hiện không yêu cầu auth key. Đây là trust boundary cần review nếu thay đổi producer hoặc expose thêm write behavior.

### Đọc

```bash
curl "https://aws-learn.pages.dev/api/questions?id=aws-learn-XXXXXXXX"
curl "https://aws-learn.pages.dev/api/questions?limit=20&offset=0"
```

### Tạo

`POST /api/questions` dùng JSON với các field chính:

- `title` — bắt buộc;
- `description` — question, `Options:` và `Answer:` theo contract Practice UI;
- `notes` — explanation sections;
- `metadata` — type, service, answer, verification, question type và domain;
- `labels` — thường gồm `aws`, service và domain.

### Cập nhật

`PATCH /api/questions?id=<id>` là partial update. Các field có thể cập nhật gồm `title`, `description`, `notes`, `metadata`, `labels` và `status`; field không truyền được giữ nguyên.

Notes dùng H2 để UI chia section:

```markdown
## Giải thích câu hỏi
## Vì sao đúng
## Vì sao các đáp án khác sai
## Nguồn
```

Một số record cũ có `## Kiến thức cốt lõi`; Practice UI hiện ẩn section này. Khi sửa một section notes, phải giữ nguyên các section còn lại. API contract, data model và các caveat bảo mật nằm ở [Practice Q&A và data model](../architecture/practice-and-data.md).

## Hoàn tất một work session

Work chưa hoàn tất cho đến khi thay đổi đã được kiểm tra, commit và push thành công.

1. Tạo issue cho phần việc thực sự còn lại, nếu có.
2. Chạy quality gates phù hợp; với code/content build changes, tối thiểu chạy `npm run build`.
3. Cập nhật trạng thái issue liên quan.
4. Đồng bộ và push:

   ```bash
   git pull --rebase
   git push
   git status
   ```

5. Kiểm tra stash; prune remote refs/branches khi phù hợp mà không xóa work của người khác.
6. Xác nhận mọi thay đổi thuộc session đã được commit, push và branch up to date với origin.
7. Handoff ngắn gọn: nội dung đã đổi, quality gate, caveat và việc còn lại.

Không dừng ở trạng thái “ready to push”; nếu push fail, xử lý nguyên nhân và retry. Trước khi commit, luôn kiểm tra `git status`/`git diff` để không ghi đè hoặc vô tình stage thay đổi có sẵn của người dùng.
