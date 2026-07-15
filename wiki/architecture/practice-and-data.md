# Practice Q&A và data model

## Product behavior

[`public/practice/index.html`](../../public/practice/index.html) là một ứng dụng single-file HTML/CSS/JavaScript, độc lập với React/Fumadocs. Nó cung cấp hai mode:

- **Practice** — yêu cầu username, cho chọn đáp án, chỉ reveal đúng/sai và phần giải thích sau khi submit; lưu lịch sử, score và note theo username.
- **Review** — hiện đúng/sai và giải thích ngay; không hiển thị score/result indicator và không cần history flow như Practice.

UI hỗ trợ filter theo service/domain/question type/result, filter câu đã note, sort ngày tạo, lookup bằng ID hoặc sequence number, lazy loading, retry/next, resizable question-answer panes, theme và optional polling 60 giây.

Business flow chính:

```text
GET list (lightweight rows, 20/page)
          │
          ├─ select card ─► GET by id (hydrate description + notes)
          │
          ├─ filter active ─► GET up to 500 list rows
          │
          └─ Practice username ─► GET /api/practice-history
                                      │
                     submit/retry/note/reset
                                      │
                                      ▼
                          POST/DELETE practice-history
```

Việc tách list row khỏi detail được thêm để giảm D1 reads/payload. Đừng đưa `description`/`notes` trở lại list mode mà không đo ảnh hưởng.

## Q&A document contract

Một question được UI hiểu qua ba field kết hợp:

### `description`

Format producer mong đợi:

```text
Q: <question stem>

Options:

#1 — <option>

#2 — <option>

Answer: #2 — <answer text>
```

Parser [`parseQuestion`](../../public/practice/index.html) nhận option bằng `#<number> —|-|– ...`. Answer correctness thực tế không lấy từ dòng `Answer:` mà lấy ID trong `metadata.answer`.

### `metadata`

API lưu dưới dạng JSON string; UI parse thành object. Các key quan trọng từ AWS explain workflow:

```json
{
  "type": "aws-qa",
  "service": "s3",
  "answer": "#2",
  "verification": "direct",
  "question_type": "single",
  "domain": "storage"
}
```

- `answer` có thể chứa nhiều `#N` cho multi-select.
- `question_type === "multi-select"` cho phép chọn nhiều option.
- `service`/`domain` bổ sung labels/filter khi labels API thiếu.

Correctness là set equality theo cách UI đánh dấu: mọi option đúng phải được chọn và mọi option sai không được chọn.

### `notes`

UI chia notes theo các heading `##`. Các title được nhận diện để tô style gồm “Giải thích câu hỏi”, “Vì sao đúng”, “Vì sao các đáp án khác sai”, “Nguồn”. Section “Kiến thức cốt lõi” cũ bị ẩn khỏi UI. Notes được render bằng `marked`.

Vì contract này được parse bằng text/regex thay vì schema versioned, thay heading hoặc format option phải được test đồng thời với dữ liệu cũ.

## Questions API

Cloudflare Pages tự route [`functions/api/questions.js`](../../functions/api/questions.js) thành `/api/questions`. D1 binding là `env.DB`, khai báo trong [`wrangler.toml`](../../wrangler.toml).

### GET list

`GET /api/questions?limit=&offset=&sort=&mode=list&labels=&count=`:

- chỉ trả rows có `status = 'open'`;
- default limit 50, cap 500;
- sort hỗ trợ `created-asc`, `created-desc`, mặc định `updated_at DESC`;
- `mode=list` bỏ `description` và `notes`;
- `labels=0` bỏ query labels;
- `count=1` thêm tổng số open questions;
- labels được query theo batch 90 ID để tránh practical SQLite/D1 variable bound;
- `hasMore` hiện chỉ phản ánh page có đủ `limit` rows nếu không có total.

### GET detail

`GET /api/questions?id=<id>` hoặc `?number=<question_number>` trả một row đầy đủ và labels. Lookup bằng `id` được ưu tiên nếu cả hai có mặt. Detail lookup không áp điều kiện `status = 'open'`.

### POST

`POST /api/questions` yêu cầu `title`, tự tạo ID `aws-learn-<8 chars>`, lấy sequence bằng `question_sequence`, rồi insert question mặc định `open`, priority `3`, issue type `decision`; labels được batch insert.

### PATCH

`PATCH /api/questions?id=<id>` là partial update cho title/status/priority/issue type/description/notes/metadata và có thể thay toàn bộ labels. Nếu truyền labels, field phải là array.

### Trust boundary

API trả CORS `*` và source hiện **không có authentication** cho POST/PATCH. Git history cho thấy API key check đã được chủ ý gỡ bỏ. Đồng thời Practice UI render Markdown thành HTML trong DOM. Vì vậy dữ liệu D1 phải được coi là input không tin cậy; mọi thay đổi cho phép nhiều producer hơn cần review authentication, validation và HTML sanitization cùng nhau.

## Practice history API

[`functions/api/practice-history.js`](../../functions/api/practice-history.js) route thành `/api/practice-history`.

Username được trim và cắt tối đa 80 ký tự; không có account/authentication. Cùng một username nghĩa là cùng namespace tiến độ.

### GET

`GET ?username=<name>` union answer history và noted-only questions, trả selected IDs, submitted/correct flags, timestamps và noted state.

### POST answer

```json
{
  "username": "learner",
  "question_id": "aws-learn-...",
  "selected": ["2"],
  "submitted": true,
  "isCorrect": true,
  "answeredAt": "..."
}
```

Dùng upsert theo `(username, question_id)`.

### POST note

Nếu body có field `noted`, request chuyển sang note branch: `true` upsert note, `false` delete note. Các field answer khác không được xử lý trong request đó.

### DELETE

- Có `question_id`: xóa history của một question, không xóa note.
- Không có ID, `scope=history` mặc định: xóa answer history.
- `scope=notes`: xóa notes.
- `scope=all`: xóa cả hai.

API gọi `ensureTable()` trên mọi request để tạo history/note tables và indexes nếu thiếu. Điều này giúp runtime self-heal nhưng thêm DDL vào request path.

## D1 data model

[`schema.sql`](../../schema.sql) khai báo:

```text
questions
  id PK
  question_number UNIQUE
  title/status/priority/issue_type
  description/notes/metadata
  created_at/updated_at

question_sequence
  number AUTOINCREMENT PK
  question_id UNIQUE

question_labels
  (question_id, label) composite PK

practice_answer_history
  (username, question_id) composite PK
  selected_json/submitted/is_correct/timestamps
```

Quan hệ logic:

```text
questions 1 ─── * question_labels
    │
    ├── 1 ─── 0..1 question_sequence
    │
    └── 1 ─── * practice_answer_history (logical, no FK)
               * practice_question_notes (runtime-created, no FK)
```

Schema không khai báo foreign keys/cascades. API cũng không có DELETE question endpoint, nên lifecycle hiện chủ yếu là đổi `status`.

**Schema drift đã biết:** `practice_question_notes` và index của nó chỉ nằm trong `ensureTable()`, chưa có trong `schema.sql`. Khi provision database mới, request đầu tiên sẽ tạo table; nếu chuyển sang migration kiểm soát chặt, cần đồng bộ hai nguồn.

## Client state và loading rules

LocalStorage chỉ giữ preferences/identity nhẹ:

- username;
- Practice/Review mode;
- theme;
- created sort;
- split-pane width.

Answer history và notes được load từ D1. UI mặc định lấy 20 list rows; khi filter active, nó request tối đa 500 và ngừng pagination. Note filter có thể fetch từng noted question còn thiếu. Tổng score dùng `count=1` lần đầu rồi cache trong session.

Auto-refresh khởi tạo ở trạng thái off; khi bật, poll mỗi 60 giây và flash rows có `updated_at` thay đổi.

## Thay đổi an toàn theo domain

### Đổi question format

1. Cập nhật `.agents/skills/aws-explain/SKILL.md` producer rules.
2. Cập nhật `parseQuestion`/`parseNotes` nếu cần.
3. Test single-choice, multi-select và question không options.
4. Test một record cũ để giữ backward compatibility.

### Đổi API fields/query

1. Cập nhật Function và UI fetch/normalizer cùng lúc.
2. Giữ list/detail payload split nếu không có lý do đo lường được để bỏ.
3. Test open/closed status, pagination >20 và filters gần/qua 500 records.
4. Kiểm tra CORS/auth/input validation.

### Đổi schema

1. Cập nhật `schema.sql` và migration script/idempotent SQL.
2. Review runtime `ensureTable()` để tránh hai schema definitions lệch nhau.
3. Test database local trước; migration number script mặc định target remote nếu không truyền flag.
4. Không dựa vào foreign keys vì schema hiện không có chúng.
