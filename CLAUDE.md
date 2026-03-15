# CLAUDE.md

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

Mỗi file documentation (trừ `README.md` và `CLAUDE.md`) cần có **mục lục** ở đầu file:

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

<!-- BEGIN BEADS INTEGRATION -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
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

<!-- END BEADS INTEGRATION -->
