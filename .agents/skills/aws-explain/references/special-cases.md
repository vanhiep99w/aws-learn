# Special Cases — Multi-select & Negation

> **File này chỉ load khi Bước 1 (Chuẩn hóa đầu vào) phát hiện trigger:**
>
> - Câu **multi-select** (`Select two`, `Select three`, `Choose all that apply`)
> - Câu **negation** (`NOT`, `except`, `incorrect`, `violates`, `không`, `cấm`, `không thể`, ...)
>
> Hai loại câu này KHÔNG được dùng template chuẩn trong `teaching-patterns.md`. Đọc file này thay thế (hoặc bổ sung) các quy tắc tương ứng.

## Mục lục

- [Xử lý câu multi-select (≥2 đáp án đúng)](#xử-lý-câu-multi-select-2-đáp-án-đúng)
- [Xử lý câu negation (NOT / except / incorrect)](#xử-lý-câu-negation-not--except--incorrect)

---

## Xử lý câu multi-select (≥2 đáp án đúng)

Câu multi-select (`Select two`, `Select three`, `Choose all that apply`) **KHÔNG được dùng template single-choice**. Cần điều chỉnh format.

### Quy tắc bắt buộc

1. **Banner đầu output:**
   ```
   📑 MULTI-SELECT — chọn N đáp án đúng
   ```

2. **Section "✅ ĐÁP ÁN" liệt kê tất cả option đúng**, mỗi option 1 dòng:
   ```
   **#X — <option 1>**
   **#Y — <option 3>**
   ```

3. **Section "Vì sao đúng" mỗi option đúng có heading riêng:**
   ```markdown
   #### ✅ #X — <option đúng 1>
   <Giải thích đầy đủ cho option này: mở bằng analogy/diagram (trực giác), rồi tự nhiên đi vào kỹ thuật + quote AWS. KHÔNG dùng heading "Pass 1", "Pass 2".>

   #### ✅ #Y — <option đúng 2>
   <Tương tự — viết liền mạch, ngôn ngữ tự nhiên.>
   ```

   - KHÔNG gộp các option đúng vào 1 explanation chung
   - Mỗi option tự đứng được — không phụ thuộc đọc option kia trước

4. **Section "Vì sao sai" thêm subsection "🪤 Bẫy / Near-miss"** giải thích option sai *trông giống* đúng (multi-select hay có 2-3 option na ná):

   ```markdown
   #### 🪤 Near-miss — #Z (trông giống đúng nhưng KHÔNG phải)

   Option này hấp dẫn vì <điểm đúng một phần>, nhưng thực ra <chỗ bẫy cụ thể>.
   Đặc biệt dễ chọn khi <điều kiện nào trong đề kích hoạt nhầm lẫn>.
   ```

5. **TL;DR cuối "Vì sao đúng" tổng cho cả N option** (không từng cái riêng):
   ```markdown
   > **TL;DR:** Cả #X và #Y đều cần thiết vì <chốt insight chung>. Không thể
   > chọn 1 trong 2 — chúng bổ sung cho nhau ở khía cạnh <X> và <Y>.
   ```

### Anti-pattern multi-select

- ❌ Coi multi-select như single-choice nối liền → mất rõ ràng từng option đứng độc lập
- ❌ Quên near-miss explanation → người đọc không học được cách phân biệt
- ❌ TL;DR riêng từng option đúng → loãng, lẽ ra phải có insight tổng

---

## Xử lý câu negation (NOT / except / incorrect)

**Phát hiện câu negation** trong Bước 1 chuẩn hóa đầu vào. Từ khóa kích hoạt:

- **EN:** `NOT`, `except`, `excluding`, `invalid`, `incorrect`, `violates`, `prohibited`, `disallowed`, `cannot`, `unable to`, `least likely`
- **VI:** `không`, `không được`, `sai`, `không phải`, `loại trừ`, `cấm`, `không thể`, `ít khả năng nhất`

→ Nếu phát hiện **negation question**, áp dụng các điều chỉnh sau.

### Quy tắc bắt buộc

1. **Banner đỏ đầu output (KHÔNG được bỏ qua):**
   ```
   ⚠️ NEGATION QUESTION — câu hỏi đang tìm option SAI / VI PHẠM
   ```

2. **Restate câu hỏi rõ ràng:** viết lại đề bài thành dạng khẳng định để chắc chắn không hiểu nhầm:
   ```markdown
   📋 CÂU HỎI

   <đề gốc>

   **Hỏi thực chất:** "Trong các option dưới đây, option nào KHÔNG phải là
   <hành vi/cấu hình hợp lệ> của <service>?"

   → Đáp án đúng = option mô tả điều VI PHẠM/SAI. 3 option còn lại đều HỢP LỆ.
   ```

3. **Đảo logic giải thích:**

   - "Vì sao đúng" → đổi tiêu đề thành **"Vì sao option này VI PHẠM / KHÔNG được phép"**
   - "Vì sao các đáp án khác sai" → đổi tiêu đề thành **"Vì sao 3 option còn lại HỢP LỆ"**

4. **Cấu trúc "Vì sao option này VI PHẠM":**
   - Nêu rõ **rule/quota/constraint AWS** mà option đó vi phạm
   - Quote nguồn AWS docs công bố rule
   - Nếu là edge case → giải thích bối cảnh

5. **Cấu trúc "Vì sao 3 option còn lại HỢP LỆ":** mỗi option 1-3 câu, không cần phân tích sâu (vì đề không hỏi về chúng) — chỉ cần xác nhận tính hợp lệ + nguồn nếu cần.

### Anti-pattern negation

- ❌ Quên banner → người đọc lướt qua, hiểu nhầm câu hỏi
- ❌ Trả lời như câu thường: "đáp án đúng là #X" → khó hiểu, "đúng" ở đây là "đúng với việc tìm cái sai"
- ❌ Phân tích 3 option hợp lệ dài như single-choice → lãng phí, nên ngắn gọn
- ❌ Bỏ qua quote rule AWS cho option vi phạm → kết luận thiếu nguồn

---

## Lưu ý chung

Các pattern sư phạm khác (analogy, ASCII diagram, comparison table, TL;DR, gọi tên design pattern, decision walkthrough, cost breakdown, "Đừng nhầm với..." callout) **vẫn áp dụng** cho câu multi-select và negation — chỉ khung output là điều chỉnh. Xem `teaching-patterns.md` cho các pattern này.
