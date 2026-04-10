# AGENTS.md

## Project Overview
AWS learning documentation repository - collection of Markdown files covering AWS services and concepts.

## Structure
- `README.md` - Table of contents with links to all topics
- `*.md` - Individual documentation files for each AWS service/topic

## Commands
No build/test commands - this is a documentation-only repository.

## Guidelines
- All documentation in Markdown format (.md)
- Use Vietnamese for content
- Keep `README.md` updated when adding new topics
- Organize files by AWS service category (Compute, Storage, Database, etc.)
- Use checkboxes `- [ ]` in README.md to track learning progress
- Include practical examples and diagrams where helpful
- Link related topics between documents

## Table of Contents (Mục lục)

Mỗi file documentation (trừ `README.md` và `AGENTS.md`) cần có **mục lục** ở đầu file:

- Đặt ngay sau tiêu đề chính (`# ...`)
- Sử dụng heading `## Mục lục`
- Liệt kê tất cả các `##` headings trong file dưới dạng links
- Kết thúc bằng `---`

**Format:**
```markdown
# Tên Service

## Mục lục

- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

---

## Section 1
...
```

**Lưu ý:**
- Chỉ thêm TOC cho file có ≥3 headings
- Anchor link: chuyển heading thành lowercase, thay space bằng `-`, bỏ ký tự đặc biệt
- Nếu heading có emoji, bỏ emoji trong anchor (ví dụ: `## 🎯 Tổng quan` → `#tổng-quan`)

## Accuracy & Sources (AWS)

- Khi trả lời câu hỏi về AWS hoặc tạo/cập nhật tài liệu AWS, **phải xác minh thông tin bằng MCP trước khi kết luận**.
- Thứ tự ưu tiên:
  - Ưu tiên `aws-knowledge` khi khả dụng, đặc biệt cho:
    - `aws___search_documentation` - tìm trang AWS chính thức liên quan
    - `aws___read_documentation` - đọc nội dung gốc (giới hạn, pricing, quotas, API fields, v.v.)
    - `aws___get_regional_availability` - kiểm tra tính khả dụng theo region
    - `aws___recommend` - tìm tài liệu liên quan
  - Nếu `aws-knowledge` bị rate limit, unavailable, hoặc lỗi transport, dùng `aws-documentation-mcp-server` làm fallback cho các tác vụ docs-first:
    - `search_documentation`
    - `read_documentation`
    - `read_sections`
    - `recommend`
  - Với câu hỏi về region support/availability:
    - Ưu tiên `aws___get_regional_availability`
    - Nếu fallback MCP không có dữ liệu tương đương, tra trực tiếp AWS Documentation/What's New/Regional Services và ghi rõ cách xác minh

- **Không suy đoán** hoặc dựa vào "kiến thức nhớ" cho các chi tiết dễ sai (tên API, giới hạn, hành vi mặc định, region support, ngày ra mắt).
  - Nếu không thể xác minh, ghi rõ: "Chưa xác minh được từ tài liệu AWS tại thời điểm viết"

- Khi viết tài liệu, **phải kèm link nguồn AWS chính thức** (AWS Documentation, What's New, Blog, Pricing) cho các điểm quan trọng

## Cloudflare D1 Questions API

API base: `https://aws-learn.pages.dev/api/questions` — không cần auth key.

### Lấy câu hỏi

```bash
# Theo ID
curl "https://aws-learn.pages.dev/api/questions?id=aws-learn-XXXXXXXX"

# Danh sách (mặc định 50)
curl "https://aws-learn.pages.dev/api/questions?limit=20&offset=0"
```

### Tạo câu hỏi mới (POST)

```bash
curl -X POST https://aws-learn.pages.dev/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "...",
    "description": "Q: ...\n\nOptions:\n\n#1 — ...\n\nAnswer: #X — ...",
    "notes": "## Giải thích câu hỏi\n\n...\n\n## Vì sao đúng\n\n...",
    "metadata": {"type":"aws-qa","service":"s3","answer":"#3","verification":"direct","question_type":"single","domain":"networking"},
    "labels": ["aws","s3","networking"]
  }'
```

### Update câu hỏi (PATCH)

```bash
curl -X PATCH "https://aws-learn.pages.dev/api/questions?id=aws-learn-XXXXXXXX" \
  -H "Content-Type: application/json" \
  -d '{"notes": "nội dung mới"}'
```

- Chỉ cần truyền fields muốn thay đổi — các field còn lại giữ nguyên.
- Có thể update: `title`, `description`, `notes`, `metadata`, `labels`, `status`.

### Cấu trúc `notes`

Notes dùng `## heading` để chia section, UI tự parse và render từng section riêng:

```
## Giải thích câu hỏi        ← màu amber, hiển thị đầu tiên
## Vì sao đúng               ← màu xanh lá
## Vì sao các đáp án khác sai ← màu đỏ
## Kiến thức cốt lõi         ← màu tím
## Nguồn                     ← màu teal
```

### Update notes giữ nguyên các section khác (Python)

```python
import json, subprocess, re

r = subprocess.run(['curl','-s','https://aws-learn.pages.dev/api/questions?id=aws-learn-XXXXXXXX'], capture_output=True, text=True)
existing_notes = json.loads(r.stdout)['row']['notes']

# Thay thế section cụ thể, giữ nguyên phần còn lại
new_explain = "## Giải thích câu hỏi\n\n<nội dung mới>\n\n"
stripped = re.sub(r'^.*?(## Vì sao đúng)', r'\1', existing_notes, flags=re.DOTALL)
new_notes = new_explain + stripped

payload = json.dumps({'notes': new_notes})
result = subprocess.run(
    ['curl','-s','-X','PATCH','https://aws-learn.pages.dev/api/questions?id=aws-learn-XXXXXXXX',
     '-H','Content-Type: application/json','-d', payload],
    capture_output=True, text=True)
print(result.stdout)
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
