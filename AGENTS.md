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

- Khi trả lời câu hỏi về AWS hoặc tạo/cập nhật tài liệu AWS, **phải xác minh thông tin bằng các MCP tools của `aws-knowledge` trước khi kết luận**:
  - `aws___search_documentation` - tìm trang AWS chính thức liên quan
  - `aws___read_documentation` - đọc nội dung gốc (giới hạn, pricing, quotas, API fields, v.v.)
  - `aws___get_regional_availability` - kiểm tra tính khả dụng theo region
  - `aws___recommend` - tìm tài liệu liên quan

- **Không suy đoán** hoặc dựa vào "kiến thức nhớ" cho các chi tiết dễ sai (tên API, giới hạn, hành vi mặc định, region support, ngày ra mắt).
  - Nếu không thể xác minh, ghi rõ: "Chưa xác minh được từ tài liệu AWS tại thời điểm viết"

- Khi viết tài liệu, **phải kèm link nguồn AWS chính thức** (AWS Documentation, What's New, Blog, Pricing) cho các điểm quan trọng
