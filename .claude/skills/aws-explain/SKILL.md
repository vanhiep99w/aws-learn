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

## Quy tắc ngôn ngữ (QUAN TRỌNG)

- **Câu hỏi và đáp án**: Luôn viết bằng **tiếng Anh** — giữ nguyên ngôn ngữ gốc, KHÔNG dịch sang tiếng Việt.
- **Giải thích**: Viết bằng **tiếng Việt** — toàn bộ phần phân tích, lý do đúng/sai, kiến thức cốt lõi.
- Trích dẫn từ tài liệu AWS giữ nguyên tiếng Anh, diễn giải/phân tích bằng tiếng Việt.

## Quy trình bắt buộc

### Bước 1: Chuẩn hóa đầu vào

- Tách câu hỏi, ngữ cảnh, danh sách đáp án (nếu có), đáp án đã đánh dấu (nếu có).
- Gán ID cố định theo vị trí gốc: `#1`, `#2`, `#3`, ...
- Xác định single-choice hay multi-select (`Select two`, `Select three`, ...).
  - Nếu **multi-select** → áp dụng template riêng (xem `references/teaching-patterns.md` mục "Xử lý câu multi-select"). KHÔNG dùng template single-choice.
- **Phát hiện negation question:** Nếu đề chứa `NOT`, `except`, `invalid`, `incorrect`, `violates`, `cannot`, `không`, `không được`, `sai`, `loại trừ`, `cấm`, `không thể`, `ít khả năng nhất` → đánh dấu là negation question và áp dụng quy tắc đảo logic (xem `references/teaching-patterns.md` mục "Xử lý câu negation").
- Các nhãn sẵn (`Correct selection`, `Your selection is correct/incorrect`) chỉ là tham chiếu, không phải kết luận.
- Xác định phạm vi xác minh: service, API, limit/quota, default behavior, region, thời điểm phát hành.
- **Phát hiện cost-driven question:** nếu đề có `cost-optimal`, `lowest cost`, `cheapest`, `minimize spend`, `reduce charges`, `chi phí thấp nhất`, `tối ưu chi phí` → bắt buộc áp dụng Pattern 10 (Cost component breakdown).
- **Phát hiện comparison ≥3 options:** nếu các option thuộc category khác nhau (vd: NLB vs ALB vs PrivateLink vs EIP) → bắt buộc áp dụng Pattern 9 (Decision walkthrough).
- **Phát hiện service dễ nhầm:** đối chiếu catalog "near-twin services" trong Pattern 11 — nếu match → thêm callout "⚠️ Đừng nhầm với...".

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

> **📖 BẮT BUỘC đọc trước khi viết phần giải thích:** [`references/teaching-patterns.md`](references/teaching-patterns.md)
>
> File này định nghĩa các pattern sư phạm bắt buộc:
>
> - **Pattern 1-8:** 2-pass (trực giác → kỹ thuật), analogy đời thường, ASCII diagram, comparison table, anticipated follow-up, TL;DR, gọi tên design pattern.
> - **Pattern 9-11:** Decision walkthrough, Cost component breakdown, "Đừng nhầm với..." callout.
> - **Special cases:** template riêng cho **multi-select** và **negation question** — KHÔNG dùng template chuẩn dưới đây cho 2 loại này.
>
> Áp dụng đúng các pattern này là yêu cầu chất lượng, không phải optional. Trước khi viết, identify các trigger trong Bước 1 (negation? multi-select? cost-driven? ≥3 options? near-twin service?) và pick patterns tương ứng.

**Special-case banners (nếu áp dụng):**

```
📑 MULTI-SELECT — chọn N đáp án đúng    ← cho multi-select
⚠️ NEGATION QUESTION — câu hỏi đang tìm option SAI / VI PHẠM    ← cho negation
```

Đặt các banner này ngay trên section `📋 QUESTION`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<Restate the question clearly in English — keep original language, do NOT translate>

- Type: <single-choice | multi-select (select N)>
- Options:
  #1 — <Option 1 in English>
  #2 — <Option 2 in English>
  #3 — <Option 3 in English>
  #4 — <Option 4 in English>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ANSWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#X — <correct option content in English>**
<if multi-select, list all correct options in English>

Xác minh: <Đề cập trực tiếp | Suy luận hợp lý | Chưa xác minh được>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 GIẢI THÍCH CHI TIẾT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Giải thích câu hỏi

<Viết bằng **tiếng Việt** theo **storytelling order** (xem `references/teaching-patterns.md` mục "Cấu trúc Giải thích câu hỏi"):

1. **Vấn đề mấu chốt** (1-2 câu): Bài toán cốt lõi là gì, *tại sao* nó khó. KHÔNG diễn đạt lại đề nguyên xi.
2. **Tại sao yêu cầu của đề khó** (1 đoạn): Phân tích các từ khóa quan trọng ("scalable", "minimal config", "low latency", "cost-optimal", "multi-Region"...) — mỗi từ khóa loại trừ class giải pháp nào.
3. **Hệ quả** (1 câu chốt highlight): "→ Cần một giải pháp mà ___ KHÔNG ___."

Ví dụ:
> **Vấn đề mấu chốt:** ALB **KHÔNG có IP cố định**. AWS chỉ cấp DNS name; IP đằng sau liên tục đổi khi scale...
> Đề nhấn mạnh: *scalable* (nhiều Region, traffic biến động) + *minimal config* (không muốn cứ vài ngày update firewall).
> → **Cần giải pháp mà IP entry point KHÔNG BAO GIỜ ĐỔI**, dù ALB phía sau scale kiểu gì.

Tránh format "liệt kê constraint kiểu báo cáo" — phải tạo cảm giác "vấn đề" trước khi đi vào option.>

### Vì sao đúng

**#X — <option in English>**

<Viết bằng **tiếng Việt** theo cấu trúc 2-pass (xem `references/teaching-patterns.md` mục "Cấu trúc Vì sao đúng — checklist"):

**Pass 1 — Trực giác (mandatory):**
- Mở đầu bằng **analogy đời thường** HOẶC **ASCII diagram** (chọn 1, hoặc cả hai nếu phù hợp)
- 1 câu tóm tắt cơ chế trước khi đi vào kỹ thuật

**Pass 2 — Kỹ thuật (mandatory):**
- Nếu câu có **≥3 options ở category khác nhau** → mở Pass 2 bằng **Decision walkthrough** (Pattern 9) — block 3-5 bước loại trừ tuần tự, đặt TRƯỚC quote AWS.
- Trích dẫn nguyên văn (quote block) từ tài liệu AWS giữ nguyên tiếng Anh, sau đó **xuống dòng mới** thêm dòng dịch tiếng Việt **sát nghĩa** (dòng dịch là dòng riêng biệt trong cùng blockquote):
  > "With Provisioned Throughput, you specify a level of throughput that the file system can drive independent of the file system's size or burst credit balance."
  >
  > *→ Với Provisioned Throughput, bạn chỉ định mức throughput mà file system có thể duy trì, độc lập với dung lượng lưu trữ hay burst credit balance.*
- Nếu có quy trình hoạt động → numbered steps hoặc bảng "Bước / Việc làm"
- Nếu có ≥2 entity dễ nhầm (vd: "IP của ALB" vs "IP của Global Accelerator") → comparison table
- Nếu câu **cost-driven** → bắt buộc thêm **Cost breakdown** bảng (Pattern 10), với hidden cost row.
- Nếu service đáp án có **near-twin** dễ nhầm → thêm callout **⚠️ Đừng nhầm với...** (Pattern 11) cuối Pass 2, trước TL;DR.
- Bold key terms quan trọng

**Anticipated follow-up (mạnh mẽ khuyến nghị):**
- Đặt 1 câu hỏi mà người mới CHẮC CHẮN sẽ thắc mắc, rồi trả lời ngay:

  ```
  ### Câu hỏi quan trọng: <follow-up bằng tiếng Việt>
  **<Trả lời ngắn 1 dòng>**
  <Giải thích 2-4 đoạn bằng tiếng Việt>
  ```

**Bằng chứng quan sát được (optional):**
- Nếu có observation từ Console/CLI/API confirm cơ chế → thêm 1 đoạn "Kiểm chứng nhanh:"

**TL;DR cuối section (mandatory):**
- 1-2 câu chốt lại insight cốt lõi, dạng dễ thuộc:
  > **TL;DR:** <chốt insight với key term in đậm>

Đây là nội dung sẽ được copy nguyên văn vào D1 notes — viết đầy đủ ngay từ đầu.>

### Vì sao các đáp án khác sai

<Mỗi option sai dùng heading có emoji ❌ và tuân theo checklist (xem `references/teaching-patterns.md` mục "Cấu trúc Vì sao sai — checklist"). Tên option giữ nguyên tiếng Anh, giải thích bằng tiếng Việt.>

#### ❌ #Y — <option in English>

<- **Mở đầu bằng analogy 1 câu** (tiếng Việt) cô đọng misconception:
  *"Giống như cử người chạy ra hỏi IP rồi gọi điện cho IT update firewall."*
- Nêu rõ MISCONCEPTION mà option đó đánh trúng (vì sao người làm bài bị lừa chọn nó)
- Lý do kỹ thuật 3-5 câu bằng tiếng Việt, có quote AWS (tiếng Anh) + dịch nếu cần chứng minh sai
- Constraint cứng vi phạm (nếu có) — vd: "VPC bị giới hạn trong 1 Region nên không cross-Region được">

#### ❌ #Z — <option in English>

<Tương tự — analogy + misconception + lý do kỹ thuật + constraint vi phạm. Không rút gọn.>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 KIẾN THỨC CỐT LÕI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<2-4 bullet points tổng kết kiến thức quan trọng rút ra từ câu hỏi này.
Viết dạng ghi nhớ, dễ ôn tập lại. Bằng tiếng Việt.

**Mạnh mẽ khuyến nghị**: thêm 1 bullet **gọi tên design pattern** nếu câu hỏi minh họa pattern AWS phổ biến (xem catalog đầy đủ tại `references/teaching-patterns.md` mục "Pattern 8 — Gọi tên design pattern"):

- **Pattern thiết kế:** <tên pattern> — <giải thích 1 câu> (gặp lại ở: <list service>)

Ví dụ:
- **Pattern thiết kế:** *Stable indirection layer* — tách "địa chỉ public client thấy" (cố định) khỏi "địa chỉ thực phía sau" (động). Gặp lại ở: Global Accelerator, Route 53, CloudFront, ALB DNS.
- **Pattern thiết kế:** *Decoupling via queue* — tách producer khỏi consumer bằng queue trung gian, hỗ trợ retry + DLQ. Gặp lại ở: SQS, EventBridge, SNS+SQS fan-out.

Việc gọi tên pattern giúp người đọc gắn câu trả lời vào framework rộng hơn, dễ áp dụng cho câu mới.>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGUỒN THAM KHẢO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- <Document title> — <URL>

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

Sau khi phân tích xong, lưu Q&A vào **Cloudflare D1** bằng 1 lệnh Python.

**Quan trọng — format newline**: Dùng **blank line** (double newline) giữa mỗi option và mỗi section. UI không tôn trọng single newline.

### Quy tắc nội dung notes — PHẢI GIỐNG HỆT câu trả lời đã hiển thị

**Quan trọng**: Nội dung trong `notes` phải là **bản sao nguyên văn** của các section "Vì sao đúng" và "Vì sao các đáp án khác sai" từ phần `🔍 GIẢI THÍCH CHI TIẾT` đã hiển thị cho user. KHÔNG được tóm tắt hay rút gọn. Copy nguyên xi nội dung đã viết.

**Quy tắc ngôn ngữ trong D1**:
- `description` (Q, Options, Answer): viết bằng **tiếng Anh**
- `notes` (giải thích, lý do): viết bằng **tiếng Việt**
- `title` (~60 ký tự): viết bằng **tiếng Anh**

### Lệnh lưu vào D1 (dùng Python để build JSON an toàn)

```bash
python3 -c "
import json, subprocess, os

title = '<Summary of question in English (~60 chars)>'

description = '''Q: <Full question text in English>

Options:

#1 — <option 1>

#2 — <option 2>

#3 — <option 3>

#4 — <option 4>

Answer: #X — <correct option content in English>'''

notes = '''## Giải thích câu hỏi

<COPY NGUYÊN VĂN toàn bộ nội dung từ section \"Giải thích câu hỏi\" trong phần 🔍 GIẢI THÍCH CHI TIẾT đã hiển thị cho user.>

## Vì sao đúng

<COPY NGUYÊN VĂN toàn bộ nội dung từ section \"Vì sao đúng\" trong phần 🔍 GIẢI THÍCH CHI TIẾT đã hiển thị cho user.
Bao gồm: tên option (tiếng Anh), giải thích nhiều đoạn tiếng Việt, tất cả trích dẫn AWS, numbered steps nếu có.
KHÔNG tóm tắt. KHÔNG rút gọn. Giữ nguyên mọi quote block và bold text.>

## Vì sao các đáp án khác sai

<COPY NGUYÊN VĂN toàn bộ nội dung từ section \"Vì sao các đáp án khác sai\" trong phần 🔍 GIẢI THÍCH CHI TIẾT.
Mỗi option sai giữ nguyên heading riêng (tên option tiếng Anh), blank line trước #ID, toàn bộ giải thích chi tiết tiếng Việt.>

## Kiến thức cốt lõi

<COPY NGUYÊN VĂN từ section 💡 KIẾN THỨC CỐT LÕI đã hiển thị>

## Nguồn

<COPY NGUYÊN VĂN từ section 📚 NGUỒN THAM KHẢO đã hiển thị>'''

payload = json.dumps({
    'title': title,
    'description': description,
    'notes': notes,
    'metadata': {
        'type': 'aws-qa',
        'service': '<service>',
        'answer': '#X',
        'verification': 'direct',
        'question_type': 'single',
        'domain': '<domain>'
    },
    'labels': ['aws', '<service>', '<domain>']
})

api_key = os.environ.get('AWS_LEARN_API_KEY', '')
result = subprocess.run(
    ['curl', '-s', '-X', 'POST', 'https://aws-learn.pages.dev/api/questions',
     '-H', 'Content-Type: application/json',
     '-H', f'X-API-Key: {api_key}',
     '-d', payload],
    capture_output=True, text=True
)
print(result.stdout)
"
```

### Yêu cầu chất lượng notes

- **notes = bản sao nguyên văn** của câu trả lời đã hiển thị, KHÔNG phải bản tóm tắt
- Mỗi option sai: heading riêng, blank line trước `#ID`, giải thích đầy đủ (không rút gọn)
- Tất cả trích dẫn tài liệu AWS phải có mặt trong notes
- Kiến thức cốt lõi viết dạng rule/pattern ôn tập
- Nếu câu trả lời có numbered steps, bold text, multiple paragraphs → notes cũng phải có

### Tham số

- **title**: Tóm tắt câu hỏi bằng tiếng Anh (~60 ký tự)
- **description**: Q + Options + Answer — tiếng Anh, blank line giữa mỗi option
- **notes**: Giải thích chi tiết — tiếng Việt, copy nguyên văn từ output đã hiển thị
- **labels**: `["aws", "<service>", "<domain>"]` — service: `s3`, `ec2`, `lambda`, `rds`... domain: `security`, `networking`, `compute`, `storage`, `database`, `serverless`, `monitoring`
- **metadata**: `{"type":"aws-qa","service":"...","answer":"#X","verification":"direct|inferred|unverified","question_type":"single|multi-select","domain":"..."}`

### Sau khi lưu

API trả về `{"id": "aws-learn-XXXXXXXX", "success": true}`. Hiển thị:

```
📝 Đã lưu → <id> | Labels: aws, <service> | https://aws-learn.pages.dev/questions/
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

### Yêu cầu sư phạm (xem `references/teaching-patterns.md` để có ví dụ đầy đủ)

**Quy tắc chung (mọi câu):**
- **"Vì sao đúng" phải có Pass 1 (trực giác) trước Pass 2 (kỹ thuật)** — analogy đời thường HOẶC ASCII diagram, KHÔNG nhảy thẳng vào quote AWS.
- **"Vì sao đúng" phải kết bằng TL;DR** 1-2 câu, key term in đậm.
- **"Vì sao sai" mỗi option mở đầu bằng analogy 1 câu** cô đọng misconception, sau đó mới tới lý do kỹ thuật.
- **"Vì sao sai" dùng heading `#### ❌ #N — ...`** (có emoji ❌ trong heading).
- **"Giải thích câu hỏi" theo storytelling order**: vấn đề mấu chốt → tại sao yêu cầu khó → câu hệ quả "→ Cần ___". KHÔNG liệt kê constraint kiểu báo cáo.
- **Khi câu hỏi minh họa design pattern AWS phổ biến** (stable indirection, decoupling via queue, eventual consistency boundary, ...) → gọi tên pattern trong "Kiến thức cốt lõi".
- **Anticipated follow-up + bằng chứng quan sát được** là khuyến nghị mạnh khi đáp án đúng còn vẻ "magic" hoặc có cơ chế ẩn.

**Quy tắc theo trigger (áp dụng có điều kiện):**
- **≥3 options khác category** → BẮT BUỘC có **Decision walkthrough** (Pattern 9) ở đầu Pass 2.
- **Câu cost-driven** (`cost-optimal`, `lowest cost`, `cheapest`, ...) → BẮT BUỘC có **Cost breakdown table** (Pattern 10) với hidden cost row + dòng total.
- **Service có near-twin dễ nhầm** (ALB/NLB, EBS/EFS, KDS/Firehose, Dedicated Instance/Host, ...) → BẮT BUỘC có callout **⚠️ Đừng nhầm với...** (Pattern 11).
- **Multi-select** → áp dụng template riêng (Xử lý câu multi-select): heading `#### ✅ #N — ...` cho mỗi option đúng, có subsection **🪤 Near-miss** giải thích option sai trông giống đúng.
- **Negation question** (`NOT`, `except`, `incorrect`, `không`, ...) → áp dụng template riêng (Xử lý câu negation): banner `⚠️ NEGATION QUESTION` đầu output, restate câu hỏi dạng khẳng định, đảo logic "Vì sao đúng" → "Vì sao option này VI PHẠM".

## Query Q&A đã lưu

Xem câu hỏi đã lưu tại: https://aws-learn.pages.dev/questions/

Query trực tiếp D1:

```bash
npx wrangler d1 execute aws-question --remote \
  --command "SELECT id, title, updated_at FROM questions ORDER BY updated_at DESC LIMIT 10"
```
