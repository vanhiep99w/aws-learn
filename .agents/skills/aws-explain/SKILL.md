---
name: aws-explain
description: >
  Phân tích câu hỏi AWS dạng tự luận hoặc trắc nghiệm (single-choice hoặc multi-select),
  xác minh bằng tài liệu AWS chính thức, chọn đáp án đúng theo chứng cứ,
  rồi tự động lưu Q&A vào beads database.
  Use when cần kiểm tra đáp án AWS, phản biện đáp án đã được đánh dấu sẵn,
  so sánh các phương án, xác minh chi tiết kỹ thuật AWS,
  đối chiếu tài liệu trong repo, và lưu trữ kiến thức AWS đã học.
---

# AWS Explain

## Mục tiêu

- Xử lý câu hỏi AWS có hoặc không có danh sách đáp án.
- Luôn kiểm chứng bằng MCP `aws-knowledge` trước khi kết luận.
- Nếu input có đáp án được đánh dấu, coi đó là giả thuyết cần thẩm định lại.
- Chọn đáp án đúng theo chứng cứ, giải thích chi tiết từng phương án.
- Giữ nguyên thứ tự và vị trí đáp án gốc (`#1`, `#4`).
- Đối chiếu tài liệu markdown trong repo hiện tại.
- **Tự động lưu mọi Q&A vào beads** để xây dựng knowledge base.

## Quy trình bắt buộc

### Bước 1: Chuẩn hóa đầu vào

- Tách câu hỏi, ngữ cảnh, danh sách đáp án (nếu có), đáp án đã đánh dấu (nếu có).
- Gán ID cố định theo vị trí gốc: `#1`, `#2`, `#3`, ...
- Xác định single-choice hay multi-select (`Select two`, `Select three`, ...).
- Các nhãn sẵn (`Correct selection`, `Your selection is correct/incorrect`) chỉ là tham chiếu, không phải kết luận.
- Xác định phạm vi xác minh: service, API, limit/quota, default behavior, region, thời điểm phát hành.

### Bước 2: Xác minh bằng tài liệu AWS

- Gọi `aws___search_documentation` với topic phù hợp:
  - `reference_documentation` — API/CLI/SDK, tham số, hành vi kỹ thuật.
  - `troubleshooting` — lỗi, tình huống "không hoạt động".
  - `current_awareness` — tính năng mới, ngày ra mắt, trạng thái hỗ trợ.
  - `general` — kiến trúc, best practices.
- Đọc tài liệu gốc bằng `aws___read_documentation` cho kết quả chính — không kết luận chỉ từ snippet.
- Dùng `aws___recommend` nếu cần mở rộng nguồn hoặc có mâu thuẫn.
- Câu hỏi liên quan region → dùng `aws___get_regional_availability`.

### Bước 3: Chọn đáp án

- Đánh giá từng đáp án theo bằng chứng. Không mặc định tin đáp án đã đánh dấu.
- Multi-select → trả đúng số lượng yêu cầu.
- Single-choice → chọn đúng một đáp án tốt nhất.
- Không có options → trả lời trực tiếp + nêu bằng chứng.
- Công bố đáp án theo cả vị trí gốc (`#1`, `#4`) và nội dung đầy đủ.

### Bước 4: Đánh dấu mức xác minh

- `Đề cập trực tiếp` — tài liệu nói rõ kết luận.
- `Suy luận hợp lý` — suy ra rõ ràng từ nội dung chính thức.
- `Chưa xác minh được` — chưa đủ chứng cứ từ tài liệu AWS.

### Bước 5: Lưu vào beads

Sau khi hoàn tất phân tích, **bắt buộc** lưu Q&A vào beads database. Xem chi tiết tại [Quy trình lưu beads](#quy-trình-lưu-beads).

## Mẫu đầu ra

Trả lời theo cấu trúc sau. Dùng visual markers rõ ràng.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CÂU HỎI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<Viết lại rõ ngữ cảnh + yêu cầu>

- Loại: <single-choice | multi-select (chọn N)>
- Phương án:
  #1 — <Option 1>
  #2 — <Option 2>
  #3 — <Option 3>
  #4 — <Option 4>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ĐÁP ÁN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#X — <nội dung option đúng>**
<nếu multi-select, liệt kê thêm>

Xác minh: <Đề cập trực tiếp | Suy luận hợp lý | Chưa xác minh được>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 GIẢI THÍCH CHI TIẾT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Vì sao đúng

**#X — <option>**
<Giải thích chi tiết, bám sát nguồn AWS. Trích dẫn câu/đoạn quan trọng từ tài liệu.>

### Vì sao các đáp án khác sai

**#Y — <option>**
❌ <Lý do sai ngắn gọn + nguồn>

**#Z — <option>**
❌ <Lý do sai ngắn gọn + nguồn>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 KIẾN THỨC CỐT LÕI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<2-4 bullet points tổng kết kiến thức quan trọng rút ra từ câu hỏi này.
Viết dạng ghi nhớ, dễ ôn tập lại.>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGUỒN THAM KHẢO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- <Tiêu đề tài liệu> — <URL>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 ĐỐI CHIẾU REPO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Trạng thái: <Đã đề cập | Đã đề cập nhưng mâu thuẫn | Chưa đề cập>
- Files: <path/to/file.md> — <heading>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔖 ĐỐI CHIẾU ĐÁP ÁN ĐỀ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<Chỉ hiện nếu đề có đáp án đánh dấu sẵn>
- Kết quả: <Khớp toàn bộ | Khớp một phần | Không khớp>
- Chi tiết: <giải thích khác biệt nếu có>
```

## Quy trình lưu beads

Sau khi phân tích xong, lưu Q&A bằng **đúng 1 lệnh `bd create`** (bao gồm cả description và notes).

**Quan trọng — format newline**: Dùng **blank line** (double newline) giữa mỗi option và mỗi section. BD UI không tôn trọng single newline.

### Lệnh tạo bead (1 lệnh duy nhất)

Dùng `--stdin` cho description + `--notes` cho giải thích chi tiết, tất cả trong cùng 1 lệnh:

```bash
bd create "<Tóm tắt câu hỏi (~60 ký tự)>" \
  -t decision -p 3 \
  -l "aws,<service>,<domain>" \
  --metadata '{"type":"aws-qa","service":"<service>","answer":"#X","verification":"direct","question_type":"single","domain":"<domain>"}' \
  --notes "$(cat <<'NOTES_EOF'
## Vì sao đúng

#X — <option đúng>

<Giải thích chi tiết 3-5 câu. Trích dẫn tài liệu AWS.>

Trích dẫn: "<quote từ tài liệu AWS>"
— <Tên tài liệu> (<URL>)

## Vì sao các đáp án khác sai

#Y — <option sai 1>

❌ <Giải thích 2-3 câu. Nêu rõ misconception.>

#Z — <option sai 2>

❌ <Giải thích 2-3 câu.>

#W — <option sai 3>

❌ <Giải thích 2-3 câu.>

## Kiến thức cốt lõi

- <Rule/pattern 1 — viết dạng ghi nhớ>

- <Rule/pattern 2>

- <Rule/pattern 3>

## Nguồn

- <Tên tài liệu> — <URL>
NOTES_EOF
)" \
  --stdin <<'BEAD_EOF'
Q: <Câu hỏi đầy đủ>

Options:

#1 — <option 1>

#2 — <option 2>

#3 — <option 3>

#4 — <option 4>

Answer: #X — <nội dung đáp án đúng>
BEAD_EOF
```

### Yêu cầu chất lượng notes

- Mỗi option sai: heading riêng, blank line trước `#ID`
- Giải thích đủ chi tiết để đọc lại hiểu ngay
- Trích dẫn tài liệu AWS cho đáp án đúng
- Kiến thức cốt lõi viết dạng rule/pattern ôn tập

### Tham số bead

- **title**: Tóm tắt câu hỏi (~60 ký tự)
- **type**: `decision`
- **priority**: `3`
- **labels**: `aws,<service>,<domain>` — service: `s3`, `ec2`, `lambda`... domain: `security`, `networking`, `compute`, `storage`, `database`, `serverless`, `monitoring`
- **metadata**: `{"type":"aws-qa","service":"...","answer":"#X","verification":"direct|inferred|unverified","question_type":"single|multi-select","domain":"..."}`

### Sau khi tạo bead

```
📝 Đã lưu → <bead-id> | Labels: aws, <service> | bd show <bead-id>
```

## Quy tắc chất lượng

- Không suy đoán tên API, default behavior, quota, hoặc region support.
- Không dựa vào trí nhớ khi chưa có chứng cứ từ tài liệu AWS chính thức.
- Ưu tiên nguồn: AWS Documentation > AWS What's New > AWS Blog > AWS Pricing.
- Luôn kèm link nguồn cho kết luận quan trọng.
- Nếu dùng mốc thời gian tương đối → đổi sang ngày cụ thể.
- Tài liệu repo chỉ để đối chiếu, không thay thế xác minh AWS chính thức.
- Không đổi thứ tự phương án — luôn bám ID vị trí gốc.
- **Section "Kiến thức cốt lõi"** phải có giá trị ôn tập: viết dạng rule/pattern, không lặp lại đề bài.
- Khi trích dẫn tài liệu, ghi rõ đoạn nào là quote gốc vs diễn giải.

## Query beads đã lưu

Các lệnh hữu ích để tra cứu Q&A đã lưu:

```bash
bd list -l "aws"                        # Tất cả Q&A AWS
bd list -l "aws,s3"                     # Q&A về S3
bd list -l "aws,security"              # Q&A về security
bd list -t decision -l "aws"           # Tất cả decisions AWS
bd show <bead-id>                       # Xem chi tiết một Q&A
```
