---
name: aws-explain
description: >
  Phân tích câu hỏi AWS dạng tự luận hoặc trắc nghiệm (single-choice hoặc multi-select),
  xác minh bằng tài liệu AWS chính thức, chọn đáp án đúng theo chứng cứ,
  rồi tự động lưu Q&A vào Cloudflare D1.
  Use when cần kiểm tra đáp án AWS, phản biện đáp án đã được đánh dấu sẵn,
  so sánh các phương án, xác minh chi tiết kỹ thuật AWS,
  và lưu trữ kiến thức AWS đã học.
---

# AWS Explain

## Mục tiêu

- Xử lý câu hỏi AWS có hoặc không có danh sách đáp án.
- Luôn kiểm chứng bằng MCP trước khi kết luận; ưu tiên `aws-knowledge`, fallback sang `aws-documentation-mcp-server` khi cần.
- Nếu input có đáp án được đánh dấu, coi đó là giả thuyết cần thẩm định lại.
- Chọn đáp án đúng theo chứng cứ, giải thích chi tiết từng phương án.
- Giữ nguyên thứ tự và vị trí đáp án gốc (`#1`, `#4`).
- **Tự động lưu mọi Q&A vào Cloudflare D1** để xây dựng knowledge base.

## Quy trình bắt buộc

### Bước 1: Chuẩn hóa đầu vào

- Tách câu hỏi, ngữ cảnh, danh sách đáp án (nếu có), đáp án đã đánh dấu (nếu có).
- Gán ID cố định theo vị trí gốc: `#1`, `#2`, `#3`, ...
- Xác định single-choice hay multi-select (`Select two`, `Select three`, ...).
  - Nếu **multi-select** → load thêm `references/special-cases.md` và áp dụng template riêng. KHÔNG dùng template single-choice.
- **Phát hiện negation question:** Nếu đề chứa `NOT`, `except`, `invalid`, `incorrect`, `violates`, `cannot`, `không`, `không được`, `sai`, `loại trừ`, `cấm`, `không thể`, `ít khả năng nhất` → load thêm `references/special-cases.md` và áp dụng quy tắc đảo logic.
- Các nhãn sẵn (`Correct selection`, `Your selection is correct/incorrect`) chỉ là tham chiếu, không phải kết luận.
- Xác định phạm vi xác minh: service, API, limit/quota, default behavior, region, thời điểm phát hành.
- **Phát hiện cost-driven question:** nếu đề có `cost-optimal`, `lowest cost`, `cheapest`, `minimize spend`, `reduce charges`, `chi phí thấp nhất`, `tối ưu chi phí` → bắt buộc áp dụng Pattern 10 (Cost component breakdown).
- **Phát hiện comparison ≥3 options:** nếu các option thuộc category khác nhau (vd: NLB vs ALB vs PrivateLink vs EIP) → bắt buộc áp dụng Pattern 9 (Decision walkthrough).
- **Phát hiện service dễ nhầm:** đối chiếu catalog "near-twin services" trong Pattern 11 — nếu match → thêm callout "⚠️ Đừng nhầm với...".

### Bước 2: Xác minh bằng tài liệu AWS

- Mặc định ưu tiên `aws-knowledge`.
- Nếu `aws-knowledge` bị rate limit, unavailable, hoặc lỗi transport, chuyển sang `aws-documentation-mcp-server` cho các thao tác docs-first.
- Với `aws-knowledge`, gọi `aws___search_documentation` với topic phù hợp:
  - `reference_documentation` — API/CLI/SDK, tham số, hành vi kỹ thuật.
  - `troubleshooting` — lỗi, tình huống "không hoạt động".
  - `current_awareness` — tính năng mới, ngày ra mắt, trạng thái hỗ trợ.
  - `general` — kiến trúc, best practices.
- Đọc tài liệu gốc bằng `aws___read_documentation` cho kết quả chính — không kết luận chỉ từ snippet.
- Dùng `aws___recommend` nếu cần mở rộng nguồn hoặc có mâu thuẫn.
- Fallback tool mapping với `aws-documentation-mcp-server`:
  - `aws___search_documentation` -> `search_documentation`
  - `aws___read_documentation` -> `read_documentation`
  - `aws___recommend` -> `recommend`
  - Khi cần đọc section cụ thể -> `read_sections`
- Câu hỏi liên quan region:
  - Ưu tiên `aws___get_regional_availability`
  - Nếu fallback MCP không có dữ liệu tương đương, tra trực tiếp AWS Documentation, What's New, hoặc Regional Services List và ghi rõ đây là fallback ngoài MCP

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

> **📖 Đọc trước khi viết phần giải thích:** [`references/teaching-patterns.md`](references/teaching-patterns.md)
>
> File này có 2 phần:
>
> - **Component toolkit** — danh sách component (Mermaid/ASCII diagram, comparison table, step table, code block, callout, blockquote quote+dịch, bullet/numbered list, ...) và **khi nào nên dùng từng loại**.
> - **Pattern catalog (1-11)** — các framework tư duy: analogy, diagram, comparison table, decision walkthrough, cost breakdown, "Đừng nhầm với...", anticipated follow-up, TL;DR, gọi tên design pattern.
>
> **🎯 Triết lý viết: structure cố định, content linh hoạt.**
>
> - **Cố định** (không đổi): output frame (📋 / ✅ / 🔍 / 📚 / 🔖), heading subsection (`### Giải thích câu hỏi`, `### Vì sao đúng`, `#### ❌ #N — ...`, `#### ✅ #N — ...` cho multi-select), banner cho special cases, format quote+dịch trong blockquote, TL;DR cuối "Vì sao đúng".
> - **Linh hoạt** (chọn theo nội dung): bên trong mỗi subsection, **chọn component và pattern fit nội dung nhất** — không phải câu nào cũng cần ASCII diagram, không phải câu nào cũng cần cost table. Mục tiêu là *đầy đủ và dễ hiểu nhất*, không phải tick đủ checklist. Một câu về IAM policy → code block JSON đáng giá hơn analogy. Một câu về topology → diagram đáng giá hơn bullet list.
>
> **⚠️ Phong cách viết:** KHÔNG dùng meta-label như `Pass 1 — Trực giác`, `Pass 2 — Kỹ thuật`, `Decision walkthrough:` làm heading hiển thị. Viết liền mạch, ngôn ngữ tự nhiên — pattern là khung tư duy nội bộ.
>
> **📎 Load có điều kiện:** [`references/special-cases.md`](references/special-cases.md) — CHỈ load khi Bước 1 phát hiện trigger **multi-select** hoặc **negation**. KHÔNG load mặc định để tiết kiệm context.
>
> **Triggers BẮT BUỘC pattern tương ứng** (xác định trong Bước 1, không bỏ qua):
> - ≥3 options khác category → Pattern 9 (Decision walkthrough)
> - Cost-driven (`cost-optimal`, `cheapest`, `chi phí thấp nhất`, ...) → Pattern 10 (Cost breakdown table)
> - Service có near-twin dễ nhầm → Pattern 11 ("Đừng nhầm với..." callout)
> - Multi-select / Negation → load `special-cases.md`
>
> Ngoài các trigger trên, **tự do chọn component nào fit nội dung nhất** — đó là chỗ "linh hoạt" của câu trả lời.

**Special-case banners (nếu áp dụng):**

```
📑 MULTI-SELECT — chọn N đáp án đúng    ← cho multi-select
⚠️ NEGATION QUESTION — câu hỏi đang tìm option SAI / VI PHẠM    ← cho negation
```

Đặt các banner này ngay trên section `📋 CÂU HỎI`.

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

### Giải thích câu hỏi

<Viết theo **storytelling order** (xem `references/teaching-patterns.md` mục "Cấu trúc Giải thích câu hỏi"): vấn đề mấu chốt → tại sao yêu cầu khó → câu hệ quả "→ Cần ___".

**Component nên cân nhắc** (chọn 1-3 cái fit nhất, không cần dùng hết):

- **Bullet list** liệt kê context/keyword đề bài rồi gắn ý nghĩa từng cái
- **Bảng "Keyword → loại class giải pháp nào"** khi đề có ≥3 keyword cần phân tích đối chiếu
- **Mermaid hoặc ASCII diagram nhỏ** khi vấn đề là về topology/luồng (vd. minh họa "ALB không có IP cố định" bằng client → DNS → IP đổi)
- **Code block / config snippet** khi đề có policy/CLI/IAM rule cần highlight cụ thể
- **Blockquote** để làm nổi câu chốt vấn đề mấu chốt và câu hệ quả
- **Bold** các từ khóa quan trọng (`scalable`, `minimal config`, `cost-optimal`, ...)

**Yêu cầu chất lượng (mandatory dù chọn component nào):**
1. **Vấn đề mấu chốt** (1-2 câu): bài toán cốt lõi là gì, *tại sao* nó khó. KHÔNG diễn đạt lại đề nguyên xi.
2. **Tại sao yêu cầu của đề khó**: phân tích keyword — mỗi keyword loại trừ class giải pháp nào.
3. **Hệ quả** (1 câu chốt highlight): "→ Cần một giải pháp mà ___ KHÔNG ___."

Ví dụ tham khảo:
> **Vấn đề mấu chốt:** ALB **KHÔNG có IP cố định**. AWS chỉ cấp DNS name; IP đằng sau liên tục đổi khi scale...
> Đề nhấn mạnh: *scalable* (nhiều Region, traffic biến động) + *minimal config* (không muốn cứ vài ngày update firewall).
> → **Cần giải pháp mà IP entry point KHÔNG BAO GIỜ ĐỔI**, dù ALB phía sau scale kiểu gì.

Tránh: liệt kê constraint kiểu báo cáo → phải tạo cảm giác "vấn đề" trước khi đi vào option.>

### Vì sao đúng

**#X — <option>**

<Viết một bài giải thích **liền mạch, ngôn ngữ tự nhiên** (xem `references/teaching-patterns.md` mục "Cấu trúc Vì sao đúng" + "Component toolkit"). KHÔNG dùng heading "Pass 1", "Pass 2", "Decision walkthrough:", "Trực giác:", "Kỹ thuật:" — các label đó chỉ là khung tư duy nội bộ, không hiển thị ra.

**🧩 Cách tiếp cận: chọn component fit nội dung, không phải tick checklist cứng.** Output viết liền mạch từ trực giác → kỹ thuật → quote AWS → (follow-up nếu có) → TL;DR. Các đoạn dưới đây là HƯỚNG DẪN nội bộ — KHÔNG copy số thứ tự `[1]`-`[5]` vào output thực tế.

**[1] Mở đầu — cho người đọc *cảm thấy* tại sao đúng (mandatory, linh hoạt cách thực hiện):**

Chọn **1 hoặc kết hợp** các component sau theo loại nội dung:

| Loại câu hỏi | Component khuyến nghị |
|---|---|
| Concept trừu tượng (control plane, eventual consistency, indirection) | **Analogy đời thường** 1-2 câu (Pattern 1) |
| Topology, fan-out, request flow, failover sequence | **Mermaid hoặc ASCII diagram** (Pattern 2) |
| Phân biệt 2-3 entity dễ nhầm là chính | **Comparison table** mở đầu trực tiếp (Pattern 3) |
| Service ít người biết, cần intro | **Bullet list định nghĩa nhanh** + 1 câu tóm tắt vai trò |
| Câu xoay quanh 1 setting/parameter/policy | **Code block** snippet config minh họa |

Sau component mở đầu, kèm **1 câu tóm tắt cơ chế** trước khi đi vào kỹ thuật.

**[2] Phần kỹ thuật — bám tài liệu AWS:**

Dẫn vào bằng câu nối tự nhiên (vd. *"Cụ thể trong AWS..."*, *"Tài liệu AWS mô tả..."*). Pick các component phù hợp:

- **Quote + dịch (mandatory khi cần chứng minh kết luận):** blockquote với quote nguyên văn AWS, xuống dòng mới thêm dịch tiếng Việt sát nghĩa trong cùng blockquote:
  > "With Provisioned Throughput, you specify a level of throughput that the file system can drive independent of the file system's size or burst credit balance."
  >
  > *→ Với Provisioned Throughput, bạn chỉ định mức throughput mà file system có thể duy trì, độc lập với dung lượng lưu trữ hay burst credit balance.*

- **Numbered steps hoặc bảng "Bước / Việc làm"** — khi có quy trình triển khai/sự kiện
- **Comparison table** — khi cần phân biệt thuộc tính (2-4 cột, 5-7 dòng)
- **Mermaid/ASCII diagram** — khi cơ chế là về topology, flow, hoặc state transition
- **Code block** (```bash / ```json / ```yaml) — CLI command, IAM policy, SDK call, CloudFormation/Terraform snippet, sample API request/response
- **Inline code** (`backtick`) cho tên API, tham số, config key
- **Bold** key terms quan trọng

**[3] Trigger BẮT BUỘC pattern (nếu Bước 1 phát hiện):**

- ≥3 options khác category → **decision walkthrough** dạng numbered list (Pattern 9), trước khi quote AWS, dẫn vào bằng câu kiểu *"Đi qua từng option theo thứ tự constraint của đề:"*
- Câu cost-driven → **cost breakdown table** với hidden cost row + dòng total (Pattern 10)
- Service có near-twin dễ nhầm → callout **`⚠️ Đừng nhầm với...`** đặt gần cuối, trước TL;DR (Pattern 11)

**[4] Khuyến nghị (optional — dùng khi tăng giá trị sư phạm):**

- **Anticipated follow-up:** đặt 1 câu hỏi mà người mới CHẮC CHẮN sẽ thắc mắc, rồi trả lời ngay với heading `### Câu hỏi quan trọng: <follow-up>`, sau đó trả lời ngắn 1 dòng + giải thích 2-4 đoạn.
- **Bằng chứng quan sát được:** đoạn văn xuôi mở bằng *"Kiểm chứng nhanh:"* mô tả observation từ Console/CLI/API confirm cơ chế (không heading).
- **Gọi tên design pattern AWS** (stable indirection, decoupling via queue, eventual consistency boundary, ...) lồng vào TL;DR hoặc đoạn cuối (Pattern 8).

**[5] TL;DR cuối section (mandatory):**

1-2 câu chốt insight cốt lõi, dạng dễ thuộc, key term in đậm:

> **TL;DR:** <chốt insight với key term in đậm>

Đây là nội dung sẽ được copy nguyên văn vào D1 notes — viết đầy đủ ngay từ đầu.>

### Vì sao các đáp án khác sai

<Mỗi option sai dùng heading có emoji ❌ và bám theo nguyên tắc (xem `references/teaching-patterns.md` mục "Cấu trúc Vì sao sai"). **Component bên trong mỗi option linh hoạt** — chọn cái fit misconception nhất:>

#### ❌ #Y — <option>

<**Mở đầu cô đọng misconception** — chọn cách fit nhất:
- *Analogy 1 câu* — vd: *"Giống như cử người chạy ra hỏi IP rồi gọi điện cho IT update firewall."*
- *Diagram nhỏ* hoặc *minimal table* nếu misconception là về topology/so sánh sai
- *1 câu pin-point* nếu misconception đã rõ ngay từ tên option (vd: "Tier này là cold storage, không phục vụ low-latency read")
- *Inline code/config* nếu option sai do tham số/policy không hợp lệ

**Bắt buộc có trong mỗi option:**
- **MISCONCEPTION** — vì sao người làm bài bị lừa chọn nó (1-2 câu)
- **Lý do kỹ thuật** 3-5 câu — dùng component fit:
  - **Quote+dịch AWS** nếu cần chứng minh sai bằng nguồn chính thức
  - **Code block** nếu cần show API/policy minh họa lý do sai
  - **Inline comparison table** nếu cần đối chiếu nhanh option sai vs đáp án đúng
  - **Bullet list** liệt kê các vi phạm/giới hạn
- **Constraint cứng vi phạm** (nếu có) — vd: *"VPC bị giới hạn trong 1 Region nên không cross-Region được"*

Tránh: rút gọn quá mức (1-2 câu chung chung) → không có giá trị sư phạm.>

#### ❌ #Z — <option>

<Tương tự — chọn component fit misconception. Không rút gọn.>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGUỒN THAM KHẢO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- <Tiêu đề tài liệu> — <URL>

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

notes = '''## Giải thích câu hỏi

<COPY NGUYÊN VĂN từ section Giải thích câu hỏi>

## Vì sao đúng

<COPY NGUYÊN VĂN từ section Vì sao đúng>

## Vì sao các đáp án khác sai

<COPY NGUYÊN VĂN từ section Vì sao các đáp án khác sai>

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
- Ưu tiên công cụ: `aws-knowledge` > `aws-documentation-mcp-server` > tra trực tiếp AWS official docs.
- Luôn kèm link nguồn cho kết luận quan trọng.
- Nếu dùng mốc thời gian tương đối → đổi sang ngày cụ thể.
- Không đổi thứ tự phương án — luôn bám ID vị trí gốc.
- Khi trích dẫn tài liệu, ghi rõ đoạn nào là quote gốc vs diễn giải.

### Yêu cầu sư phạm (xem `references/teaching-patterns.md` để có Component toolkit + ví dụ đầy đủ)

**🎯 Triết lý: structure cố định, content linh hoạt.** Output frame và heading subsection là cố định; bên trong chọn component (Mermaid/ASCII/table/list/code/callout/quote+dịch/...) fit nội dung nhất.

**Cố định (không đổi, áp mọi câu):**

- Heading subsection: `### Giải thích câu hỏi`, `### Vì sao đúng`, `### Vì sao các đáp án khác sai`, `#### ❌ #N — ...` cho option sai (emoji ❌ trong heading). Multi-select dùng `#### ✅ #N — ...` cho option đúng.
- **TL;DR cuối "Vì sao đúng"** — 1-2 câu chốt, key term in đậm (mandatory).
- **Quote AWS docs format** — blockquote nguyên văn + xuống dòng dịch tiếng Việt sát nghĩa cùng blockquote.
- **"Giải thích câu hỏi" theo storytelling order**: vấn đề mấu chốt → tại sao yêu cầu khó → câu hệ quả "→ Cần ___". KHÔNG liệt kê constraint kiểu báo cáo.
- **"Vì sao đúng" phải có phần mở đầu trực giác** trước phần kỹ thuật (component cụ thể là analogy/diagram/table/list/code/... tùy nội dung).
- **"Vì sao sai" mỗi option phải nêu rõ MISCONCEPTION** (component cô đọng tùy chọn: analogy/diagram nhỏ/1 câu pin-point/inline code).
- **KHÔNG dùng meta-label** như `Pass 1 — Trực giác`, `Pass 2 — Kỹ thuật`, `Decision walkthrough:`, `Trực giác:`, `Kỹ thuật:` làm heading hiển thị. Câu trả lời đọc như một bài giảng liền mạch — pattern là khung tư duy nội bộ, không hiển thị.

**Linh hoạt (chọn component fit nội dung — không tick checklist cứng):**

- **Diagram:** Mermaid (cho webapp render đẹp) hoặc ASCII (an toàn mọi nơi) — khi cơ chế là về topology/flow/state. KHÔNG ép buộc câu nào cũng phải có diagram.
- **Table:** comparison table (≥2 entity dễ nhầm), step table (quy trình), keyword→loại class table ("Giải thích câu hỏi"), cost breakdown table (cost-driven).
- **Code block:** CLI (`bash`), IAM/bucket policy (`json`), CloudFormation/Terraform (`yaml`/`hcl`), SDK call (`python`/`typescript`) — khi câu hỏi xoay quanh config/policy/API.
- **List:** bullet (liệt kê đặc điểm), numbered (quy trình tuần tự, decision walkthrough).
- **Callout/blockquote:** highlight câu hệ quả, "Đừng nhầm với...", TL;DR, "Kiểm chứng nhanh:", quote+dịch AWS.
- **Inline code & bold:** key terms, tên API/parameter, thuật ngữ AWS quan trọng.
- **Anticipated follow-up + bằng chứng quan sát được:** khuyến nghị mạnh khi đáp án đúng còn vẻ "magic" hoặc có cơ chế ẩn.

**Trigger BẮT BUỘC pattern (áp dụng có điều kiện — không skip được):**

- **≥3 options khác category** → BẮT BUỘC có decision walkthrough (Pattern 9) trước khi quote AWS, dạng numbered list, KHÔNG heading "Decision walkthrough:".
- **Câu cost-driven** (`cost-optimal`, `lowest cost`, `cheapest`, `chi phí thấp nhất`, ...) → BẮT BUỘC có **Cost breakdown table** (Pattern 10) với hidden cost row + dòng total.
- **Service có near-twin dễ nhầm** (ALB/NLB, EBS/EFS, KDS/Firehose, Dedicated Instance/Host, ...) → BẮT BUỘC có callout **⚠️ Đừng nhầm với...** (Pattern 11).
- **Multi-select** → load `references/special-cases.md` và áp template riêng: heading `#### ✅ #N — ...` cho mỗi option đúng, có subsection **🪤 Near-miss** giải thích option sai trông giống đúng.
- **Negation question** (`NOT`, `except`, `incorrect`, `không`, ...) → load `references/special-cases.md` và áp template riêng: banner `⚠️ NEGATION QUESTION` đầu output, restate câu hỏi dạng khẳng định, đảo logic "Vì sao đúng" → "Vì sao option này VI PHẠM".

**Khi câu hỏi minh họa design pattern AWS phổ biến** (stable indirection, decoupling via queue, eventual consistency boundary, ...) → gọi tên pattern ngay trong "Vì sao đúng" hoặc lồng vào TL;DR (Pattern 8).

## Query Q&A đã lưu

Xem câu hỏi đã lưu tại: https://aws-learn.pages.dev/beads/

Query trực tiếp D1:

```bash
npx wrangler d1 execute aws-question --remote \
  --command "SELECT id, title, updated_at FROM questions ORDER BY updated_at DESC LIMIT 10"
```
