---
name: aws-explain
description: Phân tích câu hỏi AWS dạng tự luận hoặc trắc nghiệm (single-choice hoặc multi-select), xác minh bằng tài liệu AWS chính thức, rồi chọn đáp án đúng theo chứng cứ. Use when cần kiểm tra đáp án AWS, phản biện đáp án đã được đánh dấu sẵn, so sánh các phương án, xác minh chi tiết kỹ thuật AWS, và đối chiếu xem tài liệu trong repo hiện tại đã đề cập câu trả lời đúng hay chưa.
---

# AWS Explain

## Mục tiêu

- Xử lý câu hỏi AWS có hoặc không có danh sách đáp án.
- Luôn kiểm chứng bằng MCP `aws-knowledge` trước khi kết luận.
- Nếu input đã có đáp án được đánh dấu đúng, coi đó là giả thuyết và tự thẩm định lại.
- Chọn lại đáp án đúng theo chứng cứ.
- Giải thích vì sao đáp án đúng và vì sao từng đáp án còn lại sai.
- Giữ nguyên thứ tự và vị trí đáp án như đề gốc (ví dụ: `#1`, `#4`), không đổi numbering theo thứ tự trình bày mới.
- Kiểm tra tài liệu liên quan có đề cập trực tiếp kết luận hay chưa.
- Đối chiếu tài liệu markdown trong repo hiện tại để kiểm tra kiến thức đã có/chưa có/mâu thuẫn.

## Quy trình bắt buộc

1. Chuẩn hóa đầu vào.

- Tách câu hỏi, ngữ cảnh, danh sách đáp án (nếu có), đáp án được đánh dấu (nếu có).
- Gán ID cố định cho từng phương án theo vị trí xuất hiện trong đề: `#1`, `#2`, `#3`, ...
- Xác định rõ yêu cầu chọn bao nhiêu đáp án (`Select two`, `Select three`, ...). Nếu không có, coi là single-choice.
- Ghi rõ các nhãn đánh dấu trong đề (`Correct selection`, `Your selection is correct`, `Your selection is incorrect`) chỉ là dữ liệu tham chiếu, không xem là kết luận cuối.
- Xác định phạm vi cần xác minh: service, API, limit/quota, default behavior, region support, thời điểm phát hành.

2. Xác minh bằng tài liệu AWS.

- Gọi `aws___search_documentation` khi cần reference.
- Chọn topic phù hợp:
  - `reference_documentation` cho API/CLI/SDK, tham số, hành vi kỹ thuật.
  - `troubleshooting` cho lỗi và tình huống "không hoạt động".
  - `current_awareness` cho tính năng mới, ngày ra mắt, trạng thái hỗ trợ.
  - `general` cho kiến trúc và best practices.
- Đọc tài liệu gốc bằng `aws___read_documentation` cho các kết quả chính; không kết luận chỉ từ snippet search.
- Dùng `aws___recommend` nếu cần mở rộng nguồn liên quan hoặc có mâu thuẫn.
- Nếu câu hỏi liên quan region, dùng `aws___get_regional_availability`.

3. Chọn đáp án.

- Đánh giá từng đáp án theo bằng chứng đã đọc.
- Không mặc định tin đáp án được đánh dấu trong input.
- Nếu đề multi-select, trả đúng số lượng đáp án đề yêu cầu.
- Nếu đề single-choice, chọn đúng một đáp án tốt nhất.
- Nếu câu hỏi không có options, trả lời trực tiếp và nêu bằng chứng.
- Luôn công bố đáp án theo 2 dạng:
  - Vị trí theo đề gốc (`#1`, `#4`)
  - Nội dung đầy đủ của phương án tương ứng

4. Đánh dấu mức độ xác minh.

- `Đề cập trực tiếp`: tài liệu nói rõ kết luận.
- `Suy luận hợp lý`: không nói nguyên văn nhưng suy ra rõ ràng từ nội dung chính thức.
- `Chưa xác minh được`: chưa đủ chứng cứ từ tài liệu AWS.
- Ghi rõ phần nào là suy luận.

## Mẫu đầu ra

Luôn trả lời theo cấu trúc này:

```markdown
## Tóm tắt đề bài

- Câu hỏi chi tiết: <viết lại rõ ngữ cảnh + tác vụ cần làm + tiêu chí đúng/sai>
- Loại câu hỏi: <single-choice | multi-select>
- Số đáp án cần chọn: <1 | 2 | 3 ...>
- Danh sách phương án theo vị trí gốc:
1. `#1` <Option 1>
2. `#2` <Option 2>
3. `#3` <Option 3>
4. `#4` <Option 4>

## Kết luận

- Đáp án đúng theo vị trí gốc: <#1, #4>
- Đáp án đúng theo nội dung:
1. `#1` <nội dung option>
2. `#4` <nội dung option>
- Trạng thái kiểm chứng: <Đề cập trực tiếp | Suy luận hợp lý | Chưa xác minh được>

## Vì sao đúng

- `#1` <nội dung option>: <Giải thích ngắn gọn, bám theo nguồn AWS>
- `#4` <nội dung option>: <Giải thích ngắn gọn, bám theo nguồn AWS>

## Phân tích các đáp án còn lại

- `#2` <nội dung option>: <Đúng/Sai theo yêu cầu đề + lý do + nguồn>
- `#3` <nội dung option>: <Đúng/Sai theo yêu cầu đề + lý do + nguồn>
- `#5` <nội dung option nếu có>: <Đúng/Sai theo yêu cầu đề + lý do + nguồn>

## Tài liệu AWS đã kiểm tra

- <Tiêu đề tài liệu> - <URL>
- <Tiêu đề tài liệu> - <URL>

## Đối chiếu tài liệu repo hiện tại

- Trạng thái: <Đã đề cập phù hợp | Đã đề cập nhưng mâu thuẫn | Chưa đề cập>
- File liên quan:
- <path/to/file.md> - <heading hoặc tóm tắt ngắn>
- <path/to/file.md> - <heading hoặc tóm tắt ngắn>

## Ghi chú

- Nếu đề có nhãn chấm điểm sẵn, ghi một dòng đối chiếu:
  - `Đối chiếu đáp án đã đánh dấu trong đề`: <khớp toàn bộ | khớp một phần | không khớp>
- Nếu thiếu chứng cứ: "Chưa xác minh được từ tài liệu AWS tại thời điểm trả lời."
```

## Quy tắc chất lượng

- Không suy đoán tên API, default behavior, quota, hoặc region support.
- Không dựa vào trí nhớ khi chưa có chứng cứ từ tài liệu AWS chính thức.
- Ưu tiên nguồn chính thức: AWS Documentation, AWS What's New, AWS Blog chính thức, AWS Pricing.
- Luôn kèm link nguồn cho các kết luận quan trọng.
- Nếu người dùng dùng mốc thời gian tương đối (hôm nay, mới nhất, gần đây), đổi sang ngày cụ thể trong câu trả lời.
- Tài liệu trong repo nội bộ chỉ dùng để đối chiếu mức độ bao phủ kiến thức, không thay thế xác minh từ nguồn AWS chính thức.
- Không đổi thứ tự phương án khi trình bày kết quả; luôn bám ID vị trí gốc của đề.
