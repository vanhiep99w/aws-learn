# Amazon SQS (Simple Queue Service)


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. Queue Types](#1-queue-types)
  - [FIFO - Message Group Processing](#14-fifo---message-group-processing)
  - [FIFO - Hot Partition Problem](#15-fifo---hot-partition-problem)
  - [FIFO - Head-of-Line Blocking](#16-fifo---head-of-line-blocking)
- [2. Message Lifecycle](#2-message-lifecycle)
- [3. SQS Features](#3-sqs-features)
  - [Long Polling vs Short Polling](#31-long-polling-vs-short-polling)
  - [Message Failure và Retry Flow](#32-message-failure--retry-flow)
  - [Dead Letter Queue](#33-dead-letter-queue-dlq)
- [4. Security](#4-security)
- [5. Integration Patterns](#5-integration-patterns)
- [6. Best Practices](#6-best-practices)
  - [Auto Scaling Consumers với CloudWatch Alarms](#64-auto-scaling-consumers-với-cloudwatch-alarms)
- [7. Spring Boot Integration](#7-spring-boot-integration)
- [8. SQS vs SNS vs Kinesis](#8-sqs-vs-sns-vs-kinesis)
- [8. SQS Message Distribution & So sánh với Kafka](#8-sqs-message-distribution-so-sánh-với-kafka)
- [9. Common Exam Questions](#9-common-exam-questions)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Amazon SQS** là fully managed message queuing service giúp **decouple** và **scale** microservices, distributed systems, và serverless applications.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SQS ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│   │   Producer   │───→│   SQS Queue  │───→│   Consumer   │      │
│   │  (Send Msg)  │    │  (Store Msg) │    │ (Receive Msg)│      │
│   └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
│   • Producers gửi messages vào queue                            │
│   • Messages được lưu trữ tạm thời                              │
│   • Consumers poll và xử lý messages                            │
│   • Messages bị xóa sau khi xử lý thành công                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lợi ích chính

| Feature | Mô tả |
|---------|-------|
| **Fully Managed** | Không cần quản lý infrastructure |
| **Unlimited Throughput** | Không giới hạn số messages/giây |
| **Unlimited Queue Size** | Lưu trữ không giới hạn messages |
| **Decoupling** | Tách biệt producers và consumers |
| **Durability** | Messages được replicate qua nhiều AZs |

---

## 1. Queue Types

### 1.1 Standard Queue vs FIFO Queue

```
┌─────────────────────────────────────────────────────────────────┐
│                STANDARD vs FIFO QUEUE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   STANDARD QUEUE:                                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Send: A → B → C → D                                    │   │
│   │  Receive: A → C → B → A → D  (Best-effort ordering)     │   │
│   │           ↑                                             │   │
│   │      Có thể trùng!                                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   FIFO QUEUE:                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Send: A → B → C → D                                    │   │
│   │  Receive: A → B → C → D  (Exact ordering)               │   │
│   │                                                         │   │
│   │  Exactly-once processing                                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 So sánh chi tiết

| Feature | Standard Queue | FIFO Queue |
|---------|---------------|------------|
| **Throughput** | Unlimited | 300 API calls/s per action (batch 10: ~3000 msg/s) |
| **Ordering** | Best-effort | Guaranteed (FIFO) |
| **Delivery** | At-least-once | Exactly-once |
| **Deduplication** | No | Yes (5 min window) |
| **Queue Name** | Any | Must end with `.fifo` |
| **Use Case** | High throughput | Ordering important |

> [!TIP]
> **`Per action` trong FIFO nghĩa là gì?**
>
> `300 API calls/s per action` nghĩa là mỗi nhóm API có quota riêng:
> - `SendMessage` / `SendMessageBatch`
> - `ReceiveMessage`
> - `DeleteMessage` / `DeleteMessageBatch`
> - Trong AWS docs, quota mặc định này áp trên từng partition của FIFO queue (non-high throughput mode)
>
> Throughput messages phụ thuộc `batch size`:
> - Batch 1 (không batch): ~`300 msg/s`
> - Batch 2: ~`600 msg/s`
> - Batch 4: ~`1200 msg/s`
> - Batch 10: ~`3000 msg/s`
>
> Công thức nhanh: `messages/s ≈ requests/s × batch_size`

> [!NOTE]
> Các con số trên là baseline FIFO thường dùng trong exam (non-high throughput FIFO).
> SQS FIFO High Throughput mode có quota cao hơn và phụ thuộc Region.

> [!WARNING]
> **Best-effort Ordering nghĩa là gì?**
>
> SQS Standard Queue là **distributed system** (nhiều servers). Messages phân tán trên nhiều servers nên thứ tự **KHÔNG ĐẢM BẢO**:
> ```
> Gửi:  [1] → [2] → [3] → [4] → [5]
> Nhận: [2] → [1] → [4] → [3] → [5]  (có thể sai thứ tự!)
> ```
> "Best-effort" = SQS **cố gắng** giữ thứ tự, nhưng **không hứa**.

> [!CAUTION]
> **Duplicate Processing - Khi Visibility Timeout hết trong lúc đang xử lý**
>
> ```
> T=0s: Consumer A nhận message, bắt đầu xử lý
> T=30s: Visibility Timeout HẾT HẠN (A vẫn đang xử lý)
> T=31s: Message VISIBLE lại → Consumer B nhận được
> 
> KẾT QUẢ: CẢ A VÀ B ĐANG XỬ LÝ CÙNG 1 MESSAGE!
> ```
>
> **Giải pháp:**
> 1. Set `Visibility Timeout` > thời gian xử lý
> 2. Gọi `ChangeMessageVisibility` API để extend timeout
> 3. Code consumer phải **IDEMPOTENT** (chạy 2 lần = kết quả giống nhau)

### 1.3 FIFO Queue Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIFO QUEUE CONCEPTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   MESSAGE GROUP ID:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Group "OrderA": [1] → [2] → [3]  (Processed in order)  │   │
│   │  Group "OrderB": [1] → [2] → [3]  (Parallel processing) │   │
│   │  Group "OrderC": [1] → [2] → [3]  (Different consumer)  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   → Messages cùng Group ID được xử lý theo thứ tự               │
│   → Khác Group ID có thể xử lý parallel                         │
│                                                                 │
│   DEDUPLICATION ID:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Message với cùng Deduplication ID trong 5 phút         │   │
│   │  sẽ bị reject (prevent duplicates)                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Deduplication Methods:**
1. **Content-based**: SQS tự hash message body
2. **Message Deduplication ID**: Developer tự đặt ID

### 1.4 FIFO - Message Group Processing

> [!IMPORTANT]
> **1 Message Group = Chỉ 1 message "in-flight" tại 1 thời điểm**
>
> ```
> Group "OrderA": [1] [2] [3]
>                  ↓
> Consumer nhận [1] → [2] và [3] bị BLOCK!
>                  ↓
> Consumer xử lý xong [1], xóa → [2] mới available
> ```
>
> | Điều kiện | Xử lý song song? |
> |-----------|-----------------|
> | **Cùng Group** | ❌ KHÔNG - phải tuần tự |
> | **Khác Group** | ✅ CÓ - song song được |

### 1.5 FIFO - Hot Partition Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOT PARTITION PROBLEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Group "VIP-Customer": [1][2][3]...[1000]  ← HOT! 🔥           │
│   Group "Normal-1":     [1][2]              ← bình thường       │
│   Group "Normal-2":     [1]                 ← bình thường       │
│                                                                 │
│   Vấn đề: VIP-Customer có 1000 msgs nhưng chỉ xử lý 1 lúc 1!    │
│   → BOTTLENECK!                                                 │
│                                                                 │
│   Giải pháp: Chia nhỏ Group ID                                  │
│   ───────────────────────────                                   │
│   ❌ Trước: Group ID = "customer-123"                           │
│   ✅ Sau:   Group ID = "customer-123-order-456"                 │
│                                                                 │
│   → Mỗi order là 1 group riêng → scale tốt hơn                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.6 FIFO - Head-of-Line Blocking

> [!CAUTION]
> **Message đầu fail → BLOCK tất cả messages phía sau trong cùng Group!**
>
> ```
> Group "OrderA": [1] [2] [3] [4] [5]
>                  ↓
> [1] fail, retry... fail, retry... fail
>                  ↓
> [2] [3] [4] [5] VẪN BỊ BLOCK! 🚫
> ```
>
> **Giải pháp: Dead Letter Queue (DLQ)**
> ```
> [1] fail > maxReceiveCount → [1] vào DLQ
>                            → [2] bây giờ available! ✅
> ```

> [!WARNING]
> **FIFO Queue BẮT BUỘC phải có DLQ!**
> Nếu không → 1 message lỗi có thể block cả group mãi mãi!

## 2. Message Lifecycle

### 2.1 Flow chi tiết

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. SEND MESSAGE                                               │
│   Producer ──────────────────→ SQS Queue                        │
│   (SendMessage API)            (Message stored)                 │
│                                                                 │
│   2. RECEIVE MESSAGE                                            │
│   Consumer ←────────────────── SQS Queue                        │
│   (ReceiveMessage API)         (Up to 10 msgs/call)             │
│            │                                                    │
│            ↓                                                    │
│   3. VISIBILITY TIMEOUT (message invisible)                     │
│   ┌───────────────────────────────────────────────────────┐     │
│   │ Message "locked" - other consumers can't see it       │     │
│   │ Default: 30 seconds, Max: 12 hours                    │     │
│   └───────────────────────────────────────────────────────┘     │
│            │                                                    │
│       ┌────┴────┐                                               │
│       ↓         ↓                                               │
│   SUCCESS    FAILURE                                            │
│      │          │                                               │
│      ↓          ↓                                               │
│   4. DELETE   Message becomes                                   │
│   MESSAGE     visible again                                     │
│   (DeleteMessage API)                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Visibility Timeout

```
┌─────────────────────────────────────────────────────────────────┐
│                  VISIBILITY TIMEOUT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Timeline khi Consumer receive message:                        │
│                                                                 │
│   ────────────────────────────────────────────────────────────  │
│   │ Receive │←── Visibility Timeout (30s) ──→│ Visible again │  │
│   ────────────────────────────────────────────────────────────  │
│       ↓                                          ↓              │
│   Message invisible                         Nếu chưa delete,    │
│   to other consumers                        consumer khác       │
│                                             có thể receive      │
│                                                                 │
│   ChangeMessageVisibility API:                                  │
│   • Extend timeout nếu cần xử lý lâu hơn                        │
│   • Set to 0 để release message ngay                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Best Practice:**
- Set visibility timeout > Thời gian xử lý message
- Sử dụng `ChangeMessageVisibility` nếu cần thêm thời gian

### 2.3 Message Retention

| Setting | Value |
|---------|-------|
| **Default** | 4 days |
| **Minimum** | 1 minute |
| **Maximum** | 14 days |

---

## 3. SQS Features

### 3.1 Long Polling vs Short Polling

```
┌─────────────────────────────────────────────────────────────────┐
│              LONG POLLING vs SHORT POLLING                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SHORT POLLING (Default):                                      │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Consumer: "Any messages?" → SQS: "No" (empty response) │   │
│   │  Consumer: "Any messages?" → SQS: "No"                  │   │
│   │  Consumer: "Any messages?" → SQS: "Yes, here's 1"       │   │
│   │                                                         │   │
│   │  → Nhiều API calls, tốn tiền, có thể miss messages      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   LONG POLLING (Recommended):                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Consumer: "Any messages? I'll wait up to 20s"          │   │
│   │        ↓                                                │   │
│   │  SQS waits... waits...                                  │   │
│   │        ↓                                                │   │
│   │  SQS: "Here's your message!" (or timeout after 20s)     │   │
│   │                                                         │   │
│   │  → Ít API calls, tiết kiệm tiền, không miss messages    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Enable Long Polling:**
- Queue level: `ReceiveMessageWaitTimeSeconds` > 0
- API level: `WaitTimeSeconds` parameter (1-20 seconds)

**Polling Limits:**

| Parameter | Value | Mô tả |
|-----------|-------|-------|
| **MaxNumberOfMessages** | 1-10 | Số messages tối đa mỗi lần poll |
| **WaitTimeSeconds** | 0-20s | Thời gian chờ Long Polling |
| **VisibilityTimeout** | 0s - 12h | Thời gian message bị "lock" |

### 3.2 Message Failure & Retry Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              KHI CONSUMER XỬ LÝ MESSAGE FAIL                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Timeline:                                                     │
│   ┌─────────┬──────────────────────────┬───────────────────────┐│
│   │ Receive │   Visibility Timeout     │ Message visible lại   ││
│   │ Message │   (message invisible)    │ trong queue           ││
│   └─────────┴──────────────────────────┴───────────────────────┘│
│       ↓                                        ↓                │
│   Consumer nhận                          Consumer khác          │
│   message & FAIL                         có thể nhận lại        │
│                                                                 │
│   Retry Flow:                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Receive 1 → Fail → Visible lại                         │   │
│   │  Receive 2 → Fail → Visible lại                         │   │
│   │  Receive 3 → Fail → Visible lại                         │   │
│   │  ...                                                    │   │
│   │  Receive N (= maxReceiveCount) → Fail → CHUYỂN ĐẾN DLQ  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ⚠️ Lưu ý:                                                      │
│   • Message KHÔNG tự động bị xóa khi fail                       │
│   • Visibility Timeout hết → message quay lại queue             │
│   • Consumer khác (hoặc chính nó) có thể nhận lại               │
│   • Sau maxReceiveCount lần fail → chuyển sang DLQ              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Scenario | Hành vi |
|----------|---------|
| **Consumer xử lý SUCCESS** | Gọi `DeleteMessage` → Message bị xóa |
| **Consumer xử lý FAIL** | Visibility Timeout hết → Message visible lại |
| **Consumer crash** | Visibility Timeout hết → Message visible lại |
| **Fail > maxReceiveCount lần** | Message chuyển sang DLQ |

### 3.3 Dead Letter Queue (DLQ)

```
┌─────────────────────────────────────────────────────────────────┐
│                   DEAD LETTER QUEUE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │   Producer   │                                              │
│   └──────┬───────┘                                              │
│          ↓                                                      │
│   ┌──────────────┐     Failed > maxReceiveCount                 │
│   │  Main Queue  │ ──────────────────────────────→ ┌─────────┐  │
│   └──────────────┘                                 │   DLQ    │ │
│          ↓                                         └──────────────┘                                              │
│   ┌──────────────┐                                      ↓       │
│   │   Consumer   │                              ┌──────────────┐│
│   │   (retry)    │                              │ Investigate  ││
│   └──────────────┘                              │   & Debug    ││
│   └──────────────┘                                              │
│   maxReceiveCount = Số lần retry trước khi chuyển đến DLQ       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**DLQ Redrive:**
- Sau khi fix bug, có thể "redrive" messages từ DLQ về main queue
- Console: "Start DLQ redrive"
- Redrive policy: tối đa bao nhiêu messages sẽ redrive/giây

### 3.3 Delay Queue

```
┌─────────────────────────────────────────────────────────────────┐
│                      DELAY QUEUE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producer sends message                                        │
│       ↓                                                         │
│   ┌───────────────────────────────────────────────────────┐     │
│   │ DELAY PERIOD (0 - 15 minutes)                         │     │
│   │ Message invisible to consumers                        │     │
│   └───────────────────────────────────────────────────────┘     │
│       ↓                                                         │
│   Message becomes available for consumers                       │
│                                                                 │
│   2 ways to set delay:                                          │
│   • Queue level: DelaySeconds (applies to all messages)         │
│   • Message level: DelaySeconds parameter (override queue)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Message Attributes

```
┌─────────────────────────────────────────────────────────────────┐
│                   MESSAGE STRUCTURE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     MESSAGE                             │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  Body (Required):                                       │   │
│   │  • String (max 256 KB)                                  │   │
│   │  • JSON, XML, or plain text                             │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  Attributes (Optional, up to 10):                       │   │
│   │  • Name-Type-Value                                      │   │
│   │  • Types: String, Number, Binary                        │   │
│   │  • Used for metadata                                    │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  System Attributes:                                     │   │
│   │  • MessageId, ReceiptHandle                             │   │
│   │  • ApproximateReceiveCount                              │   │
│   │  • SentTimestamp, ApproximateFirstReceiveTimestamp      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Large Messages (Extended Client)

```
┌─────────────────────────────────────────────────────────────────┐
│           LARGE MESSAGES (>256KB)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SQS Extended Client Library (Java):                           │
│                                                                 │
│   ┌──────────────┐                                              │
│   │   Producer   │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ↓                                                      │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  1. Upload large payload to S3                           │  │
│   │  2. Send message with S3 reference to SQS                │  │
│   └──────────────────────────────────────────────────────────┘  │
│          │                   │                                  │
│          ↓                   ↓                                  │
│   ┌──────────────┐    ┌──────────────┐                          │
│   │     S3       │    │  SQS Queue   │                          │
│   │ (Large data) │    │ (Reference)  │                          │
│   └──────────────┘    └──────────────┘                          │
│                              │                                  │
│                              ↓                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  Consumer: receive SQS message → fetch data from S3      │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Security

### 4.1 Encryption

```
┌─────────────────────────────────────────────────────────────────┐
│                       ENCRYPTION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   IN-FLIGHT (HTTPS):                                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Producer ──── HTTPS ────→ SQS ←──── HTTPS ──── Consumer│   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   AT-REST (SSE-SQS / SSE-KMS):                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  SSE-SQS: AWS managed keys (default, free)              │   │
│   │  SSE-KMS: Customer managed keys (more control)          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   CLIENT-SIDE ENCRYPTION:                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Producer encrypts → SQS (encrypted) → Consumer decrypts│   │
│   │  (Application handles encryption/decryption)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   IAM POLICIES:                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Attached to IAM users/roles                            │   │
│   │  Control "who can access what"                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   SQS ACCESS POLICIES (Resource-based):                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Attached to SQS queue                                  │   │
│   │  Allow cross-account access                             │   │
│   │  Allow other AWS services (SNS, S3, etc.)               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**SQS Access Policy Example (Allow SNS to send):**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "sns.amazonaws.com"},
    "Action": "sqs:SendMessage",
    "Resource": "arn:aws:sqs:region:account:queue",
    "Condition": {
      "ArnEquals": {
        "aws:SourceArn": "arn:aws:sns:region:account:topic"
      }
    }
  }]
}
```

---

## 5. Integration Patterns

### 5.1 SQS + Lambda

```
┌─────────────────────────────────────────────────────────────────┐
│                    SQS + LAMBDA                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│   │   Producer   │───→│  SQS Queue   │───→│   Lambda     │      │
│   └──────────────┘    └──────────────┘    │  (Trigger)   │      │
│                              │            └──────────────┘      │
│                              │                   │              │
│                              ↓                   ↓              │
│                       ┌──────────────┐    ┌──────────────┐      │
│                       │     DLQ      │    │  Process &   │      │
│                       │ (on failure) │    │   Delete     │      │
│                       └──────────────┘    └──────────────┘      │
│                                                                 │
│   Lambda Event Source Mapping:                                  │
│   • Batch size: 1-10 (Standard), 1-10,000 (FIFO)                │
│   • Batch window: 0-300 seconds                                 │
│   • Concurrency: Up to 1000 concurrent Lambda invocations       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Lambda Scaling với SQS:**
- Lambda polls SQS với long polling
- Auto-scale based on queue depth
- Max 1000 concurrent executions (default)

### 5.2 SNS + SQS (Fan-out Pattern)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SNS + SQS FAN-OUT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌──────────────┐                             │
│                    │   Producer   │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
│                           ↓                                     │
│                    ┌──────────────┐                             │
│                    │  SNS Topic   │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
│           ┌───────────────┼───────────────┐                     │
│           ↓               ↓               ↓                     │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│   │  SQS Queue A │ │  SQS Queue B │ │  SQS Queue C │            │
│   │  (Analytics) │ │  (Billing)   │ │  (Inventory) │            │
│   └──────────────┘ └──────────────┘ └──────────────┘            │
│           ↓               ↓               ↓                     │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│   │  Consumer A  │ │  Consumer B  │ │  Consumer C  │            │
│   └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                 │
│   Benefits:                                                     │
│   • One message → Multiple consumers                            │
│   • Decoupled & independent processing                          │
│   • Each queue can have different processing logic              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 S3 Event → SQS

```
┌─────────────────────────────────────────────────────────────────┐
│                    S3 + SQS                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│   │  S3 Bucket   │───→│  SQS Queue   │───→│   Consumer   │      │
│   │  (Upload)    │    │              │    │  (Process)   │      │
│   └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
│   S3 Event Types:                                               │
│   • s3:ObjectCreated:*                                          │
│   • s3:ObjectRemoved:*                                          │
│   • s3:ObjectRestore:*                                          │
│                                                                 │
│   Use Case: Image/video processing pipeline                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Request-Response Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│              REQUEST-RESPONSE PATTERN                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Requester                                    Responder        │
│   ┌────────────┐                              ┌────────────┐    │
│   │            │──── Request ────────────────→│            │    │
│   │            │    (CorrelationId: 123)      │            │    │
│   │            │    (ReplyTo: response-queue) │            │    │
│   │            │                              │            │    │
│   │            │←─── Response ────────────────│            │    │
│   │            │    (CorrelationId: 123)      │            │    │
│   └────────────┘                              └────────────┘    │
│        ↓                                            ↓           │
│   ┌──────────────┐                        ┌──────────────┐      │
│   │Response Queue│                        │Request Queue │      │
│   │ (Temporary)  │                        │              │      │
│   └──────────────┘                        └──────────────┘      │
│                                                                 │
│   SQS Temporary Queues:                                         │
│   • Auto-delete after idle timeout                              │
│   • Use for request-response patterns                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Best Practices

### 6.1 Producer Best Practices

| Practice | Mô tả |
|----------|-------|
| **Batch Messages** | Sử dụng `SendMessageBatch` (up to 10 msgs) |
| **Message Deduplication** | Set Deduplication ID cho FIFO |
| **Handle Throttling** | Implement exponential backoff |
| **Message Size** | Keep < 256KB, use S3 for larger |

### 6.2 Consumer Best Practices

| Practice | Mô tả |
|----------|-------|
| **Long Polling** | Set `WaitTimeSeconds` = 20 |
| **Batch Receive** | `MaxNumberOfMessages` = 10 |
| **Visibility Timeout** | Set > processing time |
| **Delete After Process** | Always delete successful messages |
| **DLQ** | Configure for failed messages |

### 6.3 Scaling Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                   SCALING CONSUMERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Horizontal Scaling:                                           │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    SQS Queue                            │   │
│   │ (ApproximateNumberOfMessages = queue depth)             │   │
│   └─────────────────────────────────────────────────────────┘   │
│         │         │         │         │          │              │
│         ↓         ↓         ↓         ↓         ↓               │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│   │Consumer1│ │Consumer2│ │Consumer3│ │Consumer4│ │Consumer5│   │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                 │
│   Auto Scaling with CloudWatch:                                 │
│   • Metric: ApproximateNumberOfMessagesVisible                  │
│   • Alarm → Scale EC2/ECS tasks                                 │
│   • Target Tracking: messages per consumer                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Auto Scaling Consumers với CloudWatch Alarms

> [!IMPORTANT]
> **Tự động scale consumer** là key pattern để SQS hoạt động hiệu quả với workload biến động. AWS cung cấp các SQS metrics trong CloudWatch để bạn có thể setup Auto Scaling.

#### 6.4.1 SQS Metrics trong CloudWatch

| Metric | Mô tả | Use Case |
|--------|-------|----------|
| **ApproximateNumberOfMessagesVisible** | Số messages sẵn sàng để receive | Scale-out trigger chính |
| **ApproximateNumberOfMessagesNotVisible** | Số messages đang "in-flight" (đang xử lý) | Monitor processing capacity |
| **ApproximateAgeOfOldestMessage** | Tuổi của message cũ nhất (giây) | Phát hiện bottleneck |
| **NumberOfMessagesSent** | Số messages gửi vào queue | Monitor producer throughput |
| **NumberOfMessagesDeleted** | Số messages xóa khỏi queue | Monitor consumer throughput |
| **NumberOfMessagesReceived** | Số messages được consumer nhận | Monitor polling activity |

```
┌─────────────────────────────────────────────────────────────────┐
│           CLOUDWATCH METRICS FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SQS Queue                                                     │
│   ┌───────────────────────────────────────────────────────┐     │
│   │ [A] [B] [C] [D] [E] [F] [G] [H] [I] [J]               │     │
│   │      ↓                                                │     │
│   │ ApproximateNumberOfMessagesVisible = 10               │     │
│   │ ApproximateAgeOfOldestMessage = 300s                  │     │
│   └───────────────────────────────────────────────────────┘     │
│                       ↓                                         │
│              CloudWatch Metrics                                 │
│                       ↓                                         │
│   ┌───────────────────────────────────────────────────────┐     │
│   │ CloudWatch Alarm: "Queue depth > 100 for 2 periods"   │     │
│   │                       ↓                               │     │
│   │ Trigger → Auto Scaling Group → Launch new EC2         │     │
│   └───────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.4.2 Custom Metric: Messages Per Consumer (Backlog Per Instance)

> [!TIP]
> **AWS Recommended Metric:** Thay vì dùng `ApproximateNumberOfMessagesVisible` đơn thuần, AWS khuyến nghị tính **Backlog per Instance** để scale chính xác hơn.

```
┌─────────────────────────────────────────────────────────────────┐
│           BACKLOG PER INSTANCE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Công thức:                                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 ApproximateNumberOfMessagesVisible      │   │
│   │   Backlog = ─────────────────────────────────────────   │   │
│   │                   Current Number of Consumers           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Ví dụ:                                                        │
│   • Queue có 1000 messages                                      │
│   • Có 5 consumers                                              │
│   • Backlog per instance = 1000 / 5 = 200 msgs/consumer         │
│                                                                 │
│   Target:                                                       │
│   • Nếu mỗi consumer xử lý 50 msgs/phút                         │
│   • Target backlog = 100 (≈ 2 phút xử lý)                       │
│   • Khi backlog > 100 → Scale OUT                               │
│   • Khi backlog < 100 → Scale IN                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Publish Custom Metric Example (Lambda):**
```python
import boto3

def publish_backlog_metric():
    cloudwatch = boto3.client('cloudwatch')
    sqs = boto3.client('sqs')
    asg = boto3.client('autoscaling')
    
    # Get queue depth
    response = sqs.get_queue_attributes(
        QueueUrl='https://sqs.region.amazonaws.com/account/my-queue',
        AttributeNames=['ApproximateNumberOfMessagesVisible']
    )
    queue_depth = int(response['Attributes']['ApproximateNumberOfMessagesVisible'])
    
    # Get current ASG capacity
    asg_response = asg.describe_auto_scaling_groups(
        AutoScalingGroupNames=['my-consumer-asg']
    )
    capacity = asg_response['AutoScalingGroups'][0]['DesiredCapacity']
    
    # Calculate backlog per instance
    backlog = queue_depth / max(capacity, 1)
    
    # Publish custom metric
    cloudwatch.put_metric_data(
        Namespace='Custom/SQS',
        MetricData=[{
            'MetricName': 'BacklogPerInstance',
            'Value': backlog,
            'Unit': 'Count',
            'Dimensions': [
                {'Name': 'QueueName', 'Value': 'my-queue'},
                {'Name': 'AutoScalingGroupName', 'Value': 'my-consumer-asg'}
            ]
        }]
    )
```

#### 6.4.3 CloudWatch Alarm Setup

**Scale-Out Alarm:**
```yaml
# CloudFormation Example
ScaleOutAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: SQS-HighBacklog-ScaleOut
    AlarmDescription: Scale out when queue depth is high
    MetricName: ApproximateNumberOfMessagesVisible
    Namespace: AWS/SQS
    Dimensions:
      - Name: QueueName
        Value: !Ref MyQueue
    Statistic: Average
    Period: 60                    # Check mỗi 60s
    EvaluationPeriods: 2          # Cần 2 periods liên tiếp
    Threshold: 100                # > 100 messages
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref ScaleOutPolicy       # Trigger scale-out policy

ScaleInAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: SQS-LowBacklog-ScaleIn
    MetricName: ApproximateNumberOfMessagesVisible
    Namespace: AWS/SQS
    Dimensions:
      - Name: QueueName
        Value: !Ref MyQueue
    Statistic: Average
    Period: 300                   # Check mỗi 5 phút
    EvaluationPeriods: 3          # Cần 3 periods (15 phút)
    Threshold: 10                 # < 10 messages
    ComparisonOperator: LessThanThreshold
    AlarmActions:
      - !Ref ScaleInPolicy        # Trigger scale-in policy
```

#### 6.4.4 Auto Scaling Policies

```
┌─────────────────────────────────────────────────────────────────┐
│           AUTO SCALING POLICY TYPES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. TARGET TRACKING SCALING (Recommended):                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ "Giữ backlog per instance = 100"                        │   │
│   │                                                         │   │
│   │ • AWS tự động scale để duy trì target                   │   │
│   │ • Tự động tạo CloudWatch alarms                         │   │
│   │ • Cooldown tự động                                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   2. STEP SCALING:                                              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ IF queue_depth 100-500   → Add 1 instance               │   │
│   │ IF queue_depth 500-1000  → Add 2 instances              │   │
│   │ IF queue_depth > 1000    → Add 5 instances              │   │
│   │                                                         │   │
│   │ • Scale theo mức độ severity                            │   │
│   │ • Cần define CloudWatch alarms riêng                    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   3. SIMPLE SCALING:                                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ IF alarm triggered → Add/Remove X instances             │   │
│   │                                                         │   │
│   │ • Đơn giản nhất                                         │   │
│   │ • Có cooldown cứng                                      │   │
│   │ • Không linh hoạt                                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Target Tracking Policy Example (CloudFormation):**
```yaml
TargetTrackingPolicy:
  Type: AWS::AutoScaling::ScalingPolicy
  Properties:
    AutoScalingGroupName: !Ref MyConsumerASG
    PolicyType: TargetTrackingScaling
    TargetTrackingConfiguration:
      TargetValue: 100                    # Target: 100 msgs/consumer
      CustomizedMetricSpecification:
        MetricName: BacklogPerInstance
        Namespace: Custom/SQS
        Dimensions:
          - Name: QueueName
            Value: !Ref MyQueue
        Statistic: Average
      ScaleOutCooldown: 60                # Wait 60s trước khi scale-out tiếp
      ScaleInCooldown: 300                # Wait 5 phút trước khi scale-in
```

**Step Scaling Policy Example:**
```yaml
StepScalingPolicy:
  Type: AWS::AutoScaling::ScalingPolicy
  Properties:
    AutoScalingGroupName: !Ref MyConsumerASG
    PolicyType: StepScaling
    AdjustmentType: ChangeInCapacity
    StepAdjustments:
      - MetricIntervalLowerBound: 0
        MetricIntervalUpperBound: 400     # 100-500 msgs
        ScalingAdjustment: 1              # Add 1 instance
      - MetricIntervalLowerBound: 400
        MetricIntervalUpperBound: 900     # 500-1000 msgs
        ScalingAdjustment: 2              # Add 2 instances
      - MetricIntervalLowerBound: 900     # > 1000 msgs
        ScalingAdjustment: 5              # Add 5 instances
```

#### 6.4.5 Kiến trúc hoàn chỉnh

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SQS AUTO SCALING ARCHITECTURE                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐         ┌──────────────────────────────────────────┐  │
│   │   Producer   │────────→│              SQS Queue                   │  │
│   └──────────────┘         │  ApproximateNumberOfMessagesVisible: 500 │  │
│                            └─────────────────┬────────────────────────┘  │
│                                              │                           │
│                                              ↓                           │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                      CloudWatch                                  │   │
│   │  ┌────────────────────────────────────────────────────────────┐   │  │
│   │  │ Metric: ApproximateNumberOfMessagesVisible = 500           │   │  │
│   │  │ Custom Metric: BacklogPerInstance = 500/2 = 250            │   │  │
│   │  └────────────────────────────────────────────────────────────┘   │  │
│   │         │                                                         │  │
│   │         ↓                                                        │   │
│   │  ┌────────────────────────────────────────────────────────────┐   │  │
│   │  │ Alarm: BacklogPerInstance > 100 for 2 periods → ALARM!     │   │  │
│   │  └────────────────────────────────────────────────────────────┘   │  │
│   └───────────┬──────────────────────────────────────────────────────┘   │
│               │                                                          │
│               ↓                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                   Auto Scaling Group                             │   │
│   │  ┌─────────────────────────────────────────────────────────────┐  │  │
│   │  │ Target Tracking Policy: BacklogPerInstance = 100            │  │  │
│   │  │                                                             │  │  │
│   │  │ Min: 1    Desired: 2 → 5    Max: 20                         │  │  │
│   │  │                 ↓                                           │  │  │
│   │  │ Launch 3 new EC2 instances!                                 │  │  │
│   │  └─────────────────────────────────────────────────────────────┘  │  │
│   │                                                                  │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │  │
│   │  │Consumer1│ │Consumer2│ │Consumer3│ │Consumer4│ │Consumer5│      │  │
│   │  │  (old)  │ │  (old)  │ │  (new)  │ │  (new)  │ │  (new)  │      │  │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │  │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Sau khi scale: BacklogPerInstance = 500/5 = 100 ✓ (đạt target)         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 6.4.6 Best Practices cho Auto Scaling

| Practice | Mô tả |
|----------|-------|
| **Use Target Tracking** | AWS tự động tính toán scale, ít phức tạp hơn |
| **Custom Metric (Backlog/Instance)** | Chính xác hơn raw queue depth |
| **Longer Scale-In Cooldown** | 5-10 phút để tránh flapping |
| **Short Scale-Out Cooldown** | 60s để phản ứng nhanh với traffic burst |
| **Set Min Capacity ≥ 1** | Luôn có consumer để xử lý message |
| **Monitor OldestMessage Age** | Alert nếu messages quá cũ → bottleneck |
| **Use Predictive Scaling** | Cho workload có pattern (vd: daily peak) |

> [!WARNING]
> **Đừng scale dựa trên CPU/Memory!**
>
> Với SQS consumers, CPU/Memory thường KHÔNG phản ánh đúng workload:
> - Consumer có thể idle (chờ messages) → CPU thấp, nhưng cần scale OUT
> - Consumer đang xử lý → CPU cao, nhưng queue depth thấp → KHÔNG cần scale
>
> **Luôn scale dựa trên Queue Depth hoặc Backlog per Instance!**

### 6.5 Cost Optimization

| Strategy | Description |
|----------|-------------|
| **Long Polling** | Reduces API calls (saves $$$) |
| **Batch Operations** | 10 messages = 1 API call |
| **Right-size Visibility Timeout** | Avoid unnecessary retries |
| **Delete Messages Promptly** | Don't pay for storage |

---

## 7. Spring Boot Integration

### 7.1 Spring Boot làm SQS Consumer (HOÀN TOÀN ĐƯỢC!)

> **⚠️ Lưu ý:** Nhiều người lầm tưởng SQS chỉ dùng được với Lambda. Thực tế bạn **HOÀN TOÀN CÓ THỂ** dùng Spring Boot (hoặc bất kỳ app nào) làm consumer!

```
┌─────────────────────────────────────────────────────────────────┐
│              SPRING BOOT + SQS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SQS Queue                         Spring Boot App             │
│   ┌───────────┐                    ┌───────────────────────┐    │
│   │  [A] [B]  │  ←── POLL ──────── │ @SqsListener          │    │
│   │  [C] [D]  │      (long poll)   │                       │    │
│   └───────────┘                    │ public void process(  │    │
│                                    │   String message) {    │   │
│                                    │   // xử lý message     │   │
│                                    │ }                      │   │
│                                    └───────────────────────┘    │
│                                                                 │
│   Thư viện: spring-cloud-aws-messaging hoặc aws-sdk-java        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Code Example

**Maven dependency:**
```xml
<dependency>
    <groupId>io.awspring.cloud</groupId>
    <artifactId>spring-cloud-aws-messaging</artifactId>
    <version>3.0.0</version>
</dependency>
```

**Consumer code:**
```java
@Component
public class OrderConsumer {

    @SqsListener("order-queue")
    public void processOrder(String message) {
        log.info("Received order: {}", message);
        // Xử lý order
        orderService.process(message);
        // Message tự động được delete sau khi method return success
    }
    
    // Hoặc với object mapping:
    @SqsListener("order-queue")
    public void processOrder(Order order) {
        orderService.process(order);
    }
}
```

### 7.3 So sánh Consumer Types

| Consumer Type | Use Case | Pros | Cons |
|---------------|----------|------|------|
| **Spring Boot + SQS** | Long-running apps, microservices | Full control, existing infrastructure | Manage scaling yourself |
| **Lambda + SQS Trigger** | Serverless, event-driven | Auto-scaling, pay per use | Cold start, 15 min timeout |
| **ECS/EKS + SQS** | Containerized workloads | Container orchestration | More complex setup |

### 7.4 Kafka vs SQS - Điểm khác biệt THỰC SỰ

> Khác biệt **KHÔNG PHẢI** là Spring Boot có thể làm consumer hay không (đều được!), mà là:

| | **Kafka** | **SQS** |
|---|-----------|---------|
| **Consumer library** | `@KafkaListener` | `@SqsListener` |
| **Sau khi đọc** | Message VẪN CÒN | Message BỊ XÓA |
| **Consumer Groups** | ✅ Native | ❌ Không có |
| **Replay** | ✅ Có | ❌ Không |
| **Nhiều apps đọc cùng data** | ✅ Dễ dàng | ❌ Phải dùng SNS fan-out |

```
KAFKA:    Topic ─┬→ App A (đọc tất cả)   ← CÙNG DATA
                 └→ App B (đọc tất cả)   ← CÙNG DATA
                 
SQS:      Queue ─→ App A hoặc App B (MỖI msg chỉ 1 app nhận)
                 
SNS+SQS:  SNS ─┬→ Queue A → App A (nhận copy)
              └→ Queue B → App B (nhận copy)
```

---

## 8. SQS vs SNS vs Kinesis

```
┌─────────────────────────────────────────────────────────────────┐
│              SQS vs SNS vs KINESIS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SQS:                                                          │
│   • Consumer "pulls" messages                                   │
│   • Messages deleted after consumed                             │
│   • No need to provision throughput                             │
│   • Ordering only with FIFO                                     │
│                                                                 │
│   SNS:                                                          │
│   • "Push" to subscribers                                       │
│   • No persistence (instant delivery)                           │
│   • Many subscribers (fan-out)                                  │
│   • Up to 12,500,000 subscribers                                │
│                                                                 │
│   Kinesis Data Streams:                                         │
│   • Consumer "pulls" data                                       │
│   • Data persists (replay capability)                           │
│   • Provisioned throughput (shards)                             │
│   • Ordering at shard level                                     │
│   • Real-time big data streaming                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Feature | SQS | SNS | Kinesis |
|---------|-----|-----|---------|
| **Model** | Pull (poll) | Push | Pull |
| **Persistence** | Yes (14 days) | No | Yes (1-365 days) |
| **Consumers** | 1 per message | Many (fan-out) | Many (shared) |
| **Ordering** | FIFO only | No | Per shard |
| **Replay** | No | No | Yes |
| **Throughput** | Unlimited | Unlimited | Provisioned |
| **Use Case** | Decoupling | Notifications | Streaming |

---

## 8. SQS Message Distribution & So sánh với Kafka

### 8.1 SQS là Point-to-Point (KHÔNG phải Fan-out)

> **⚠️ Lưu ý quan trọng:** SQS KHÔNG gửi message đến tất cả consumers. Mỗi message chỉ được **MỘT** consumer xử lý.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SQS: POINT-TO-POINT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producer sends: [A] [B] [C] [D] [E]                           │
│                         ↓                                       │
│                   ┌───────────┐                                 │
│                   │ SQS Queue │                                 │
│                   └───────────┘                                 │
│                    ↓    ↓    ↓                                  │
│              Consumer1  Consumer2  Consumer3                    │
│                 [A]       [B]        [C]                        │
│                 [D]       [E]                                   │
│                                                                 │
│   → Mỗi message CHỈ được 1 consumer nhận & xử lý                │
│   → Sau khi xử lý xong, message bị XÓA khỏi queue               │
│   → Consumers chia nhau xử lý (load balancing)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Nếu muốn Fan-out (1 message → nhiều consumers)?

Sử dụng **SNS + SQS Pattern**:

```
┌─────────────────────────────────────────────────────────────────┐
│              SNS + SQS FAN-OUT PATTERN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producer sends: [Order Created]                               │
│                         ↓                                       │
│                   ┌───────────┐                                 │
│                   │ SNS Topic │  ← Publish 1 lần                │
│                   └───────────┘                                 │
│                    ↓    ↓    ↓                                  │
│               ┌────┐ ┌────┐ ┌────┐                              │
│               │SQS1│ │SQS2│ │SQS3│ ← Mỗi queue nhận COPY        │
│               └────┘ └────┘ └────┘                              │
│                 ↓      ↓      ↓                                 │
│            Analytics Billing Inventory                          │
│                                                                 │
│   → 1 message gửi đến SNS                                       │
│   → TẤT CẢ SQS queues đều nhận copy của message đó              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 SQS KHÔNG có Topic và Consumer Group như Kafka

```
┌─────────────────────────────────────────────────────────────────┐
│                    KAFKA ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Topic "orders"                                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Partition 0: [msg1] [msg4] [msg7]                       │   │
│   │ Partition 1: [msg2] [msg5] [msg8]                       │   │
│   │ Partition 2: [msg3] [msg6] [msg9]                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                    ↓                  ↓                         │
│        ┌──────────────────┐  ┌──────────────────┐               │
│        │ Consumer Group A │  │ Consumer Group B │               │
│        │ (Each gets ALL)  │  │ (Each gets ALL)  │               │
│        └──────────────────┘  └──────────────────┘               │
│                                                                 │
│   Kafka features:                                               │
│   → Topic: logical channel for messages                         │
│   → Consumer Group: mỗi group nhận TẤT CẢ messages              │
│   → Consumers trong group chia partition                        │
│   → Messages được giữ lại, có thể replay                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SQS ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Queue "orders-queue"                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ [msg1] [msg2] [msg3] [msg4] [msg5] ...                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│              ↓         ↓         ↓                              │
│         Consumer1  Consumer2  Consumer3                         │
│           [msg1]     [msg2]     [msg3]                          │
│                                                                 │
│   SQS limitations:                                              │
│   → KHÔNG có Topic (1 queue = 1 channel)                        │
│   → KHÔNG có Consumer Group                                     │
│   → Message bị XÓA sau khi xử lý                                │
│   → KHÔNG thể replay                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Bảng so sánh SQS vs Kafka

| Feature | **Kafka** | **SQS** | **AWS tương đương** |
|---------|-----------|---------|---------------------|
| **Topic** | ✅ Có | ❌ Không | **SNS Topic** |
| **Consumer Group** | ✅ Có | ❌ Không | Không có tương đương |
| **Partitions** | ✅ Có | ❌ Không | **FIFO Message Group ID** (tương tự) |
| **Message Replay** | ✅ Có | ❌ Không | **Kinesis Data Streams** |
| **Message Retention** | Days - Years | Max 14 days | Kinesis: 1-365 days |
| **Ordering** | Per partition | FIFO queues only | Kinesis: Per shard |
| **Multiple Consumer Groups** | ✅ Có | ❌ Không | SNS + nhiều SQS queues |
| **Throughput** | Very high | Unlimited | Kinesis: Provisioned |

### 8.5 Khi nào dùng gì?

| Use Case | Recommend |
|----------|-----------|
| Simple decoupling, task queue | **SQS** |
| Need message replay | **Kinesis** hoặc **MSK** |
| Need Consumer Groups | **Kinesis** hoặc **MSK** |
| Fan-out to multiple services | **SNS + SQS** |
| Real-time streaming analytics | **Kinesis** |
| Full Kafka compatibility | **Amazon MSK** |

### 8.6 AWS Alternatives cho Kafka-like behavior

```
┌─────────────────────────────────────────────────────────────────┐
│          AWS OPTIONS FOR KAFKA-LIKE BEHAVIOR                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. KINESIS DATA STREAMS (AWS Native):                         │
│      • Shards ≈ Partitions                                      │
│      • Data replay ✅                                           │
│      • Ordering per shard ✅                                    │
│      • Multiple consumers (Enhanced Fan-out) ✅                 │
│      • Retention: 1-365 days                                    │
│                                                                 │
│   2. AMAZON MSK (Managed Kafka):                                │
│      • Actual Kafka on AWS                                      │
│      • 100% Kafka API compatible                                │
│      • Topics, Consumer Groups, Partitions ✅                   │
│      • Use existing Kafka code                                  │
│                                                                 │
│   3. SNS + SQS (Fan-out Pattern):                               │
│      • Fan-out to multiple queues ✅                            │
│      • Each queue = independent consumer                        │
│      • No replay, no ordering guarantee                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Common Exam Questions

### Q1: Standard vs FIFO Queue?
**A:** Standard = unlimited throughput, at-least-once, best-effort ordering. FIFO = 300 API calls/s per action (~300 msg/s không batch, ~3000 msg/s khi batch 10), exactly-once, guaranteed ordering.

### Q2: Visibility Timeout default?
**A:** 30 seconds (min: 0s, max: 12 hours)

### Q3: How to enable Long Polling?
**A:** Set `ReceiveMessageWaitTimeSeconds` > 0 (1-20 seconds)

### Q4: DLQ là gì?
**A:** Queue chứa messages failed processing sau `maxReceiveCount` retries

### Q5: Max message size?
**A:** 256 KB. Use S3 + Extended Client for larger.

### Q6: Message retention default/max?
**A:** Default: 4 days. Max: 14 days.

---

## Tài liệu tham khảo

- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/)
- [Amazon SQS message quotas](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html)
- [Amazon SQS FIFO and high throughput mode](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fifo-queues.html)
- [SQS Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-best-practices.html)
- [SQS FAQs](https://aws.amazon.com/sqs/faqs/)
