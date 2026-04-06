---
name: aws-explain
description: >
  Phân tích câu hỏi AWS dạng tự luận hoặc trắc nghiệm (single-choice hoặc multi-select),
  xác minh bằng tài liệu AWS chính thức, chọn đáp án đúng theo chứng cứ,
  rồi tự động lưu Q&A vào Cloudflare D1.
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
- **Tự động lưu mọi Q&A vào Cloudflare D1** để xây dựng knowledge base.

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

### Bước 5: Lưu vào D1

Sau khi hoàn tất phân tích, **bắt buộc** lưu Q&A vào Cloudflare D1. Xem chi tiết tại [Quy trình lưu D1](#quy-trình-lưu-d1).

## Mẫu đầu ra

Trả lời theo cấu trúc sau. Dùng visual markers rõ ràng. Nội dung section `🔍 GIẢI THÍCH CHI TIẾT` sẽ được **copy nguyên văn** vào D1 notes, nên phải viết đầy đủ chi tiết ngay từ đầu.

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
<Giải thích chi tiết nhiều đoạn. Bám sát nguồn AWS.
- Nêu rõ lý do kỹ thuật vì sao đây là đáp án đúng
- Trích dẫn nguyên văn (quote block) từ tài liệu AWS, ngay bên dưới mỗi quote thêm dòng dịch tiếng Việt **sát nghĩa** — dịch đúng nội dung câu gốc, không thêm diễn giải hay context ngoài những gì câu gốc nói:
  > "With Provisioned Throughput, you specify a level of throughput that the file system can drive independent of the file system's size or burst credit balance."
  > *→ Với Provisioned Throughput, bạn chỉ định mức throughput mà file system có thể duy trì, độc lập với dung lượng lưu trữ hay burst credit balance.*
- Nếu có quy trình hoạt động → liệt kê numbered steps
- Bold key terms quan trọng
- Đây là nội dung sẽ được copy nguyên văn vào D1 notes>

### Vì sao các đáp án khác sai

**#Y — <option>**
❌ <Giải thích chi tiết vì sao sai. Nêu rõ misconception/lý do kỹ thuật.
Viết 3-5 câu mỗi option, không viết ngắn gọn 1 câu.
Trích dẫn tài liệu AWS nếu cần để chứng minh option sai.>

**#Z — <option>**
❌ <Tương tự — giải thích đầy đủ, không rút gọn.>

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

## Quy trình lưu D1

Sau khi phân tích xong, lưu Q&A vào **Cloudflare D1** bằng 1 lệnh `curl` POST.

**Quan trọng — format newline**: Dùng `\n\n` (double newline) giữa mỗi option và mỗi section trong JSON string.

### Quy tắc nội dung notes — PHẢI GIỐNG HỆT câu trả lời đã hiển thị

**Quan trọng**: Nội dung trong `notes` phải là **bản sao nguyên văn** của các section "Vì sao đúng" và "Vì sao các đáp án khác sai" từ phần `🔍 GIẢI THÍCH CHI TIẾT` đã hiển thị cho user. KHÔNG được tóm tắt hay rút gọn. Copy nguyên xi nội dung đã viết.

### Lệnh lưu vào D1 (dùng Python để build JSON an toàn)

```bash
python3 -c "
import json, subprocess, sys

title = '<Tóm tắt câu hỏi (~60 ký tự)>'
description = '''Q: <Câu hỏi đầy đủ>

Options:

#1 — <option 1>

#2 — <option 2>

#3 — <option 3>

#4 — <option 4>

Answer: #X — <nội dung đáp án đúng>'''

notes = '''## Vì sao đúng

<COPY NGUYÊN VĂN từ section Vì sao đúng>

## Vì sao các đáp án khác sai

<COPY NGUYÊN VĂN từ section Vì sao các đáp án khác sai>

## Kiến thức cốt lõi

<COPY NGUYÊN VĂN từ section Kiến thức cốt lõi>

## Nguồn

<COPY NGUYÊN VĂN từ section Nguồn tham khảo>'''

payload = json.dumps({
    'title': title,
    'description': description,
    'notes': notes,
    'metadata': {'type':'aws-qa','service':'<service>','answer':'#X','verification':'direct','question_type':'single','domain':'<domain>'},
    'labels': ['aws', '<service>', '<domain>']
})

import os
api_key = os.environ.get('AWS_LEARN_API_KEY', '')
result = subprocess.run(
    ['curl', '-s', '-X', 'POST', 'https://aws-learn.pages.dev/api/questions',
     '-H', 'Content-Type: application/json',
     '-d', payload],
    capture_output=True, text=True
)
print(result.stdout)
"
```

### Yêu cầu chất lượng

- **notes = bản sao nguyên văn** của câu trả lời đã hiển thị, KHÔNG phải bản tóm tắt
- Mỗi option sai: heading riêng, blank line trước `#ID`, giải thích đầy đủ (không rút gọn)
- Tất cả trích dẫn tài liệu AWS phải có mặt trong notes
- Kiến thức cốt lõi viết dạng rule/pattern ôn tập
- Nếu câu trả lời có numbered steps, bold text, multiple paragraphs → notes cũng phải có

### Tham số

- **title**: Tóm tắt câu hỏi (~60 ký tự)
- **labels**: `["aws", "<service>", "<domain>"]` — service: `s3`, `ec2`, `lambda`... domain: `security`, `networking`, `compute`, `storage`, `database`, `serverless`, `monitoring`
- **metadata**: `{"type":"aws-qa","service":"...","answer":"#X","verification":"direct|inferred|unverified","question_type":"single|multi-select","domain":"..."}`

### Sau khi lưu

API trả về `{"id": "aws-learn-XXXXXXXX", "success": true}`. Hiển thị:

```
📝 Đã lưu → <id> | Labels: aws, <service> | https://aws-learn.pages.dev/beads/
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

## Query Q&A đã lưu

Xem câu hỏi đã lưu tại: https://aws-learn.pages.dev/beads/

Query trực tiếp D1:

```bash
npx wrangler d1 execute aws-question --remote \
  --command "SELECT id, title, updated_at FROM questions ORDER BY updated_at DESC LIMIT 10"
```
