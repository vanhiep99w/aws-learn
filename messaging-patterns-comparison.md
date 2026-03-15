# Messaging Patterns Comparison: Queue vs Pub/Sub vs Streaming vs Event Bus


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. 4 Messaging Patterns](#1-4-messaging-patterns)
- [2. So sánh chi tiết](#2-so-sánh-chi-tiết)
- [3. Use Cases](#3-use-cases)
- [4. Decision Tree](#4-decision-tree)
- [5. Kết hợp các patterns](#5-kết-hợp-các-patterns)
- [6. Spring Boot Integration](#6-spring-boot-integration)
- [7. Exam Tips](#7-exam-tips)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

Tài liệu này so sánh **4 messaging patterns chính** trong AWS và giúp bạn hiểu khi nào dùng pattern nào.

**Tài liệu liên quan:**
- [SQS - Queue](./sqs.md)
- [SNS - Pub/Sub](./sns.md)
- [Kinesis - Streaming](./kinesis.md)
- [EventBridge - Event Bus](./eventbridge.md)
- [Amazon MQ - Traditional Messaging](./amazon-mq.md)

---

1. [4 Messaging Patterns](#1-4-messaging-patterns)
2. [So sánh chi tiết](#2-so-sánh-chi-tiết)
3. [Use Cases](#3-use-cases)
4. [Decision Tree](#4-decision-tree)
5. [Kết hợp các patterns](#5-kết-hợp-các-patterns)

---

## 1. 4 Messaging Patterns

### 1.1 QUEUE (Hàng đợi) - AWS SQS

```
┌─────────────────────────────────────────────────────────────────┐
│                          QUEUE                                  │
│                      📦 AWS: SQS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   🏪 Ví dụ thực tế: QUẦY GỌI MÓN TẠI NHÀ HÀNG                   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Khách gọi món                                         │   │
│   │        ↓                                                │   │
│   │   [Đơn1] [Đơn2] [Đơn3] [Đơn4] [Đơn5]  ← Queue           │   │
│   │        │                                                 │  │
│   │        ↓ (đầu bếp PULL đơn từ queue)                    │   │
│   │   ┌────────┐  ┌────────┐  ┌────────┐                     │  │
│   │   │ Bếp 1  │  │ Bếp 2  │  │ Bếp 3  │  ← Consumers        │  │
│   │   │ [Đơn1] │  │ [Đơn2] │  │ [Đơn3] │                     │  │
│   │   └────────┘  └────────┘  └────────┘                     │  │
│   │                                                         │   │
│   │   → Mỗi đầu bếp nhận 1 đơn khác nhau (load balancing)   │   │
│   │   → Làm xong → Đơn BIẾN MẤT khỏi queue                  │   │
│   │   → Đầu bếp chủ động lấy đơn (PULL model)               │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ĐẶC ĐIỂM:                                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  ✅ Point-to-Point: 1 message → 1 consumer              │   │
│   │  ✅ Persistence: Message lưu trong queue (14 ngày max)  │   │
│   │  ✅ Pull model: Consumer chủ động poll messages         │   │
│   │  ❌ No replay: Xử lý xong = xóa message                 │   │
│   │  ❌ No fan-out: Không gửi đến nhiều consumers           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**[📖 Chi tiết: SQS Documentation](./sqs.md)**

---

### 1.2 PUB/SUB (Publish/Subscribe) - AWS SNS

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUB/SUB                                  │
│                      📢 AWS: SNS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   📻 Ví dụ thực tế: ĐÀI PHÁT THANH                              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   DJ phát tin (Publisher)                               │   │
│   │        ↓                                                │   │
│   │   ┌───────────────────────┐                              │  │
│   │   │     📻 TOPIC          │  ← SNS Topic                 │  │
│   │   │   "breaking-news"     │                              │  │
│   │   └───────────────────────┘                              │  │
│   │        │ PUSH (chủ động gửi đến subscribers)             │  │
│   │        ↓                                                │   │
│   │   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │  │
│   │   │Người 1 │  │Người 2 │  │Người 3 │  │Người 4 │         │  │
│   │   │ "Tin!" │  │ "Tin!" │  │ "Tin!" │  │ "Tin!" │         │  │
│   │   └────────┘  └────────┘  └────────┘  └────────┘         │  │
│   │                                                         │   │
│   │   → TẤT CẢ subscribers đều nhận CÙNG message            │   │
│   │   → Gửi xong → Message BIẾN MẤT (không lưu)             │   │
│   │   → Push model: SNS chủ động đẩy đến subscribers        │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ĐẶC ĐIỂM:                                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  ✅ Fan-out: 1 message → TẤT CẢ subscribers             │   │
│   │  ✅ Push model: SNS chủ động push đến subscribers       │   │
│   │  ✅ Many protocols: SQS, Lambda, HTTP, Email, SMS...    │   │
│   │  ❌ No persistence: Message không lưu                   │   │
│   │  ❌ No replay: Đã gửi rồi thì xong                      │   │
│   │  ❌ No guaranteed delivery: "Fire and forget"           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**[📖 Chi tiết: SNS Documentation](./sns.md)**

---

### 1.3 STREAMING (Luồng dữ liệu) - AWS Kinesis / Kafka

```
┌──────────────────────────────────────────────────────────────────┐
│                       STREAMING                                  │
│                 🎥 AWS: Kinesis, Kafka (MSK)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   📹 Ví dụ thực tế: YOUTUBE VIDEO / CAMERA AN NINH               │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   Camera quay liên tục (Producers)                      │    │
│   │        ↓                                                │    │
│   │   ┌───────────────────────────────────────────────────┐   │  │
│   │   │  STREAM (lưu video 1-365 ngày)                    │   │  │
│   │   │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐     │    │  │
│   │   │  │ 9am │10am │11am │12pm │ 1pm │ 2pm │ 3pm │     │    │  │
│   │   │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘     │    │  │
│   │   │         ↑                           ↑             │   │  │
│   │   │    Consumer A              Consumer B             │   │  │
│   │   │   (xem từ 10am)          (xem live 3pm)           │   │  │
│   │   └───────────────────────────────────────────────────┘   │  │
│   │                                                         │    │
│   │   → Data được LƯU LẠI (như video YouTube)               │    │
│   │   → REPLAY: tua lại xem từ bất kỳ thời điểm nào         │    │
│   │   → Nhiều consumers đọc CÙNG 1 stream                   │    │
│   │   → Data vẫn còn sau khi đọc                            │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│   ĐẶC ĐIỂM:                                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  ✅ Persistence: Data lưu 1-365 ngày (Kinesis)          │    │
│   │  ✅ Replay: Đọc lại từ bất kỳ vị trí nào                │    │
│   │  ✅ Multiple consumers: Nhiều apps đọc cùng data        │    │
│   │  ✅ Consumer Groups: Chia việc trong nhóm (Kafka)       │    │
│   │  ✅ Ordering: Theo partition/shard                      │    │
│   │  ⚠️ Provisioned: Phải provision shards (capacity)       │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**[📖 Chi tiết: Kinesis Documentation](./kinesis.md)**

---

### 1.4 EVENT BUS (Xe buýt sự kiện) - AWS EventBridge

```
┌──────────────────────────────────────────────────────────────────┐
│                       EVENT BUS                                  │
│                   🚌 AWS: EventBridge                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   🚏 Ví dụ thực tế: TRUNG TÂM ĐIỀU PHỐI / BƯU ĐIỆN               │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   Events arrive (từ nhiều nguồn)                        │    │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐                  │  │
│   │   │ Order    │ │ S3 Event │ │ Partner  │                  │  │
│   │   │ Service  │ │          │ │ (Stripe) │                  │  │
│   │   └────┬─────┘ └────┬─────┘ └────┬─────┘                  │  │
│   │        │            │            │                        │  │
│   │        ↓            ↓            ↓                      │    │
│   │   ┌─────────────────────────────────────────────────┐     │  │
│   │   │              🚌 EVENT BUS                       │     │  │
│   │   │                                                 │     │  │
│   │   │  Rules:                                         │     │  │
│   │   │  IF source = "order" AND amount > $100          │     │  │
│   │   │     → Route to Lambda (send notification)       │     │  │
│   │   │  IF source = "order" AND type = "refund"        │     │  │
│   │   │     → Route to SQS (process refund)             │     │  │
│   │   │  IF source = "s3"                               │     │  │
│   │   │     → Route to Step Functions                   │     │  │
│   │   │                                                 │     │  │
│   │   └──────┬──────────────────┬──────────────┬───────┘      │  │
│   │          ↓                  ↓              ↓            │    │
│   │      ┌───────┐         ┌────────┐    ┌─────────┐          │  │
│   │      │Lambda │         │  SQS   │    │ Step    │          │  │
│   │      │       │         │        │    │Functions│          │  │
│   │      └───────┘         └────────┘    └─────────┘          │  │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│   ĐẶC ĐIỂM:                                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  ✅ Smart routing: 100+ rules với advanced filtering    │    │
│   │  ✅ Event transformation: Chuyển đổi format trước khi gửi│   │
│   │  ✅ Schema Registry: Quản lý event schemas              │    │
│   │  ✅ Archive & Replay: Lưu và replay events              │    │
│   │  ✅ Third-party: Tích hợp SaaS (Stripe, Zendesk...)     │    │
│   │  ✅ Serverless: Fully managed, no provisioning          │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**[📖 Chi tiết: EventBridge Documentation](./eventbridge.md)**

---

## 2. So sánh chi tiết

### 2.1 Bảng so sánh tổng quan

| Feature | **Queue (SQS)** | **Pub/Sub (SNS)** | **Streaming (Kinesis)** | **Event Bus (EventBridge)** |
|---------|-----------------|-------------------|------------------------|---------------------------|
| **Ví dụ đời thực** | Quầy gọi món | Đài phát thanh | YouTube video | Trung tâm điều phối |
| **Non-AWS Alternatives** | RabbitMQ, ActiveMQ | Google Pub/Sub, Redis Pub/Sub | **Kafka**, Pulsar | ❌ (không có exact match) |
| **Model** | Point-to-Point | Fan-out | Log/Stream | Event routing |
| **Delivery** | Pull (poll) | Push | Pull | Push |
| **1 msg → ? consumers** | 1 | ALL | ALL (consumer groups) | Depends on rules |
| **Persistence** | ✅ 14 days | ❌ No | ✅ 1-365 days | ✅ Archive |
| **Replay** | ❌ | ❌ | ✅ | ✅ (via Archive) |
| **Ordering** | FIFO only | FIFO Topics | Per shard | ❌ |
| **Filtering** | ❌ | Basic | ❌ | Advanced (100+ rules) |
| **Transform** | ❌ | ❌ | ❌ | ✅ |
| **Scaling** | Auto | Auto | Provision shards | Auto |
| **Max message size** | 256 KB | 256 KB | 1 MB | 256 KB |

### 2.1.1 Pull vs Push - Giới hạn chi tiết

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    PULL vs PUSH - LIMITS & BATCH BEHAVIOR                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🔽 PULL MODEL (Consumer chủ động lấy)                                      │
│   ─────────────────────────────────────                                      │
│                                                                              │
│   SQS:                                                                       │
│   • Max 10 messages/request (MaxNumberOfMessages)                            │
│   • Long polling: chờ tối đa 20 giây                                         │
│   • Batch send: tối đa 10 messages (SendMessageBatch)                        │
│   • FIFO: 300 msg/s (3000 msg/s với batching)                                │
│   • Standard: Unlimited throughput                                           │
│                                                                              │
│   Kinesis:                                                                   │
│   • Max 10,000 records hoặc 10 MB per GetRecords call                        │
│   • 5 GetRecords calls/second per shard (shared giữa consumers)              │
│   • Enhanced Fan-Out: 2 MB/s dedicated per consumer                          │
│   • Write: 1000 records/s hoặc 1 MB/s per shard                              │
│                                                                              │
│   📤 PUSH MODEL (Service chủ động gửi)                                       │
│   ────────────────────────────────────                                       │
│                                                                              │
│   SNS:                                                                       │
│   • Push TỪNG MESSAGE MỘT đến mỗi subscriber                                 │
│   • Push SONG SONG đến tất cả subscribers (không đợi nhau)                   │
│   • Throughput: 300 msg/s (10 MB/s với batching)                             │
│   • Max 12,500,000 subscribers per topic                                     │
│                                                                              │
│   EventBridge:                                                               │
│   • Push TỪNG EVENT MỘT đến mỗi target                                       │
│   • Push đến TẤT CẢ matching targets (theo rules)                            │
│   • Throughput: ~10,000 events/s (có thể request tăng)                       │
│   • Max 5 targets per rule, 300 rules per event bus                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Model | Service | Messages per Request | Throughput | Batch? |
|-------|---------|---------------------|------------|--------|
| **Pull** | SQS | 10 msgs/request | Unlimited (Standard) | ✅ Consumer pull batch |
| **Pull** | Kinesis | 10,000 records/request | 1 MB/s per shard (write) | ✅ Consumer pull batch |
| **Push** | SNS | 1 msg/subscriber | 300 msg/s | ❌ Push từng cái |
| **Push** | EventBridge | 1 event/target | 10,000 events/s | ❌ Push từng cái |

> [!TIP]
> **SNS/EventBridge push từng event một**, nhưng nếu target là **SQS**, thì downstream consumer (như Lambda) có thể **poll batch** từ SQS đó.
>
> Pattern phổ biến để batch processing:
> ```
> SNS/EventBridge → SQS → Lambda (batch poll tối đa 10 msgs)
> ```

### 2.1.2 Alternatives ngoài AWS

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  AWS vs Non-AWS Alternatives                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   QUEUE:                                                                     │
│   ───────                                                                    │
│   AWS: SQS                                                                   │
│   Alternatives: RabbitMQ, ActiveMQ, Redis Queue, Amazon MQ                   │
│                                                                              │
│   PUB/SUB:                                                                   │
│   ─────────                                                                  │
│   AWS: SNS                                                                   │
│   Alternatives: Google Pub/Sub, Redis Pub/Sub, RabbitMQ (exchange mode)      │
│                                                                              │
│   STREAMING:                                                                 │
│   ───────────                                                                │
│   AWS: Kinesis, MSK                                                          │
│   Alternatives: Apache Kafka, Apache Pulsar, Redpanda                        │
│                                                                              │
│   EVENT BUS:                                                                 │
│   ───────────                                                                │
│   AWS: EventBridge                                                           │
│   Alternatives: Không có exact match (gần giống: Kafka + Schema Registry)    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Pattern | AWS | Alternatives ngoài AWS | Loại |
|---------|-----|----------------------|------|
| **Queue** | SQS | RabbitMQ, ActiveMQ, Redis Queue | Point-to-Point |
| **Pub/Sub** | SNS | Google Pub/Sub, Redis Pub/Sub | Fan-out |
| **Streaming** | Kinesis, MSK | **Apache Kafka**, Apache Pulsar | Log-based |
| **Event Bus** | EventBridge | ❌ (không có exact match) | Rule-based routing |

> [!TIP]
> **Kafka** là **STREAMING** (giống Kinesis), KHÔNG phải Queue hay Pub/Sub đơn thuần.
> Kafka có **Consumer Groups** nên có thể làm cả 2:
> - Fan-out GIỮA các groups (như Pub/Sub)
> - Load balance TRONG group (như Queue)

### 2.2 So sánh theo câu hỏi

```
┌──────────────────────────────────────────────────────────────────┐
│                  COMPARISON BY QUESTIONS                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Q: Message sau khi đọc có còn không?                           │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  SQS:        BỊ XÓA sau khi consumer gọi Delete ❌      │    │
│   │              (retention 14 ngày = nếu CHƯA ai xử lý)    │    │
│   │  SNS:        KHÔNG LƯU từ đầu ❌                        │    │
│   │  Kinesis:    VẪN CÒN (1-365 ngày) ✅ → có thể replay    │    │
│   │  EventBridge: KHÔNG LƯU (trừ khi Archive) ⚠️            │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Q: Nhiều consumers có nhận được CÙNG message không?            │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  SQS:        ❌ NO - Mỗi message → 1 consumer           │    │
│   │  SNS:        ✅ YES - Tất cả subscribers nhận           │    │
│   │  Kinesis:    ✅ YES - Nhiều consumer groups             │    │
│   │  EventBridge: ⚠️ DEPENDS - Theo rules filtering         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Q: Có thể replay (đọc lại) messages không?                     │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  SQS:        ❌ NO                                      │    │
│   │  SNS:        ❌ NO                                      │    │
│   │  Kinesis:    ✅ YES - Tua lại từ bất kỳ thời điểm       │    │
│   │  EventBridge: ✅ YES - Nếu đã enable Archive            │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Q: Cần provision capacity không?                               │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  SQS:        ❌ NO - Unlimited, serverless              │    │
│   │  SNS:        ❌ NO - Unlimited, serverless              │    │
│   │  Kinesis:    ✅ YES - Provision shards (On-demand mode  │    │
│   │              có nhưng vẫn cần hiểu capacity)            │    │
│   │  EventBridge: ❌ NO - Serverless                        │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Consumer Model - Chi tiết

### 2.2.1 Streaming vs Event Bus - Dễ nhầm lẫn!

> [!TIP]
> Hai pattern này nhìn qua thì giống, nhưng **focus khác nhau hoàn toàn**!

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                   Streaming vs Event Bus - Khác biệt chính                     │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│   STREAMING (Kinesis/Kafka)              EVENT BUS (EventBridge)               │
│   ─────────────────────────              ──────────────────────                │
│                                                                                │
│   🎯 Focus: HIGH THROUGHPUT              🎯 Focus: SMART ROUTING               │
│   (millions events/sec)                  (filter & route events)               │
│                                                                                │
│   📦 Data STORAGE:                       📦 Data STORAGE:                      │
│   ✅ Lưu 1-365 ngày                      ❌ Không lưu (trừ Archive)            │
│   ✅ Replay từ bất kỳ đâu                ⚠️ Replay qua Archive                 │
│                                                                                │
│   🔀 ROUTING:                            🔀 ROUTING:                           │
│   ❌ Không có (tất cả vào stream)        ✅ 100+ rules phức tạp                │
│                                          ✅ Filter theo content                │
│                                          ✅ Transform trước khi gửi            │
│                                                                                │
│   📊 ORDERING:                           📊 ORDERING:                          │
│   ✅ Theo partition/shard                ❌ Không đảm bảo                      │
│                                                                                │
│   ⚙️ CAPACITY:                           ⚙️ CAPACITY:                          │
│   Provision shards (hoặc on-demand)      Serverless, auto-scale                │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

| Câu hỏi | Streaming | Event Bus |
|---------|-----------|-----------|
| Xử lý **millions events/sec**? | ✅ | ❌ |
| Cần **replay** data cũ? | ✅ | ⚠️ (Archive) |
| Cần **ordering**? | ✅ | ❌ |
| Cần **filter complex** (if amount > 100)? | ❌ | ✅ |
| Cần **transform** event? | ❌ | ✅ |
| Tích hợp **SaaS** (Stripe, Zendesk)? | ❌ | ✅ |
| **Cron jobs**/scheduled events? | ❌ | ✅ |

> **Ví von:**
> - **Streaming** = "Ống nước lớn" - chảy liên tục, lưu lại, replay được
> - **Event Bus** = "Bưu điện thông minh" - phân loại thư, gửi đúng nơi

---

### 2.3 Consumer Model - Chi tiết

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSUMER MODELS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SQS (Point-to-Point):                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Messages: [A] [B] [C] [D]                              │   │
│   │                ↓                                        │   │
│   │            Consumer 1 gets [A]                          │   │
│   │            Consumer 2 gets [B]                          │   │
│   │            Consumer 3 gets [C]                          │   │
│   │                                                         │   │
│   │  → Chia nhau xử lý (load balancing)                     │   │
│   │  → Mỗi message chỉ 1 consumer nhận                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   SNS (Fan-out):                                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Message: [A]                                           │   │
│   │              ├→ Subscriber 1 gets [A]                   │   │
│   │              ├→ Subscriber 2 gets [A]                   │   │
│   │              └→ Subscriber 3 gets [A]                    │  │
│   │                                                         │   │
│   │  → TẤT CẢ subscribers nhận CÙNG message                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Kinesis/Kafka (Consumer Groups):                              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Stream: [A] [B] [C] [D] [E] [F]                        │   │
│   │              │                                           │  │
│   │         ┌────┴────┐                                      │  │
│   │         ↓         ↓                                     │   │
│   │   ┌──────────┐ ┌──────────┐                              │  │
│   │   │Group A   │ │Group B   │   ← 2 consumer groups        │  │
│   │   │(Order)   │ │(Analytics)                              │  │
│   │   │C1→[A][B] │ │C1→ALL    │                              │  │
│   │   │C2→[C][D] │ │          │                              │  │
│   │   │C3→[E][F] │ │          │                              │  │
│   │   └──────────┘ └──────────┘                              │  │
│   │                                                         │   │
│   │  → TRONG 1 group: chia nhau (như SQS)                   │   │
│   │  → GIỮA các groups: tất cả nhận ALL (như SNS)           │   │
│   │  → BEST OF BOTH WORLDS!                                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   EventBridge (Rule-based):                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Event: {"type": "order", "amount": 150}                │   │
│   │              │                                           │  │
│   │         ┌────┴────┐                                      │  │
│   │         ↓         ↓                                     │   │
│   │   Rule 1:     Rule 2:                                   │   │
│   │   amount>100  type=order                                │   │
│   │      ↓            ↓                                     │   │
│   │   Lambda      SQS Queue                                 │   │
│   │                                                         │   │
│   │  → Events route theo rules matching                     │   │
│   │  → 1 event có thể match nhiều rules                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Use Cases

### 3.1 Khi nào dùng QUEUE (SQS)?

```
┌─────────────────────────────────────────────────────────────────┐
│                     SQS USE CASES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ✅ DÙNG KHI:                                                  │
│   • Cần task queue (mỗi task 1 worker xử lý)                    │
│   • Decoupling microservices                                    │
│   • Buffering requests lúc peak                                 │
│   • Need message persistence (up to 14 days)                    │
│   • Simple, no complex routing needed                           │
│                                                                 │
│   ❌ KHÔNG DÙNG KHI:                                            │
│   • Cần nhiều consumers nhận cùng 1 message                     │
│   • Cần replay messages                                         │
│   • Real-time streaming analytics                               │
│                                                                 │
│   📝 EXAMPLES:                                                  │
│   • Order processing queue                                      │
│   • Image resize queue                                          │
│   • Email sending queue                                         │
│   • Background job queue                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🏭 Ví dụ thực tế #1: E-commerce Order Processing

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Shopee/Tiki/Lazada - Xử lý đơn hàng                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • Flash sale 12:00 → 10,000 đơn/phút                          │
│   • Order service không thể xử lý kịp real-time                 │
│   • Nếu để user đợi xử lý xong → timeout, UX tệ                 │
│                                                                 │
│   SOLUTION với SQS:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   User đặt hàng                                         │   │
│   │        ↓                                                │   │
│   │   [API Gateway] → Return "Order received!" ngay         │   │
│   │        ↓                                                │   │
│   │   ┌────────────────────────────────────────────┐         │  │
│   │   │  SQS Queue: order-processing               │         │  │
│   │   │  [Order1] [Order2] [Order3] ... [Order10K] │         │  │
│   │   └────────────────────────────────────────────┘         │  │
│   │        ↓ (pull by workers)                              │   │
│   │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │  │
│   │   │EC2-1 │ │EC2-2 │ │EC2-3 │ │EC2-4 │ │EC2-5 │           │  │
│   │   │ [O1] │ │ [O2] │ │ [O3] │ │ [O4] │ │ [O5] │           │  │
│   │   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘           │  │
│   │        ↓                                                │   │
│   │   • Check inventory, reserve stock                      │   │
│   │   • Calculate shipping                                  │   │
│   │   • Process payment                                     │   │
│   │   • Send confirmation email                             │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO SQS?                                                  │
│   ✅ Mỗi đơn chỉ cần 1 worker xử lý (point-to-point)            │
│   ✅ Buffer 10K đơn, workers xử lý dần (không mất đơn)          │
│   ✅ Auto-scale workers dựa vào queue depth                     │
│   ✅ Retry tự động nếu worker fail                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🎬 Ví dụ thực tế #2: Video Transcoding Pipeline (YouTube/TikTok)

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Video processing sau khi user upload                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • User upload video 4K 500MB                                  │
│   • Cần convert sang nhiều quality: 1080p, 720p, 480p           │
│   • Mỗi video mất 5-10 phút xử lý                               │
│   • Không thể để user đợi                                       │
│                                                                 │
│   SOLUTION với SQS:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   User upload video → S3                                │   │
│   │        ↓                                                │   │
│   │   Lambda trigger → Push message to SQS                  │   │
│   │        ↓                                                │   │
│   │   ┌────────────────────────────────────────────┐         │  │
│   │   │  SQS Queue: video-transcoding              │         │  │
│   │   │  [Video1-1080p] [Video1-720p] [Video2...]  │         │  │
│   │   └────────────────────────────────────────────┘         │  │
│   │        ↓                                                │   │
│   │   EC2 GPU instances (hoặc MediaConvert)                 │   │
│   │        ↓                                                │   │
│   │   Output → S3 → CloudFront CDN                          │   │
│   │        ↓                                                │   │
│   │   Notify user: "Video ready!"                           │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO SQS?                                                  │
│   ✅ Each video task → 1 worker (không duplicate work)          │
│   ✅ Long-running task (5-10 min) với visibility timeout        │
│   ✅ Persistence: video job không mất nếu worker crash          │
│   ✅ DLQ: failed jobs → retry hoặc manual review                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 📧 Ví dụ thực tế #3: Email/SMS Notification System

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Gửi email marketing campaign 1 triệu users          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • Gửi 1M emails cùng lúc → SES rate limit (14 emails/sec)     │
│   • Gửi tuần tự → mất 20+ giờ                                   │
│   • Cần track delivery status                                   │
│                                                                 │
│   SOLUTION với SQS:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Marketing service creates campaign                    │   │
│   │        ↓                                                │   │
│   │   Batch push 1M messages to SQS                         │   │
│   │        ↓                                                │   │
│   │   ┌────────────────────────────────────────────┐         │  │
│   │   │  SQS Queue: email-sending                  │         │  │
│   │   │  [Email1] [Email2] [Email3] ... [Email1M]  │         │  │
│   │   └────────────────────────────────────────────┘         │  │
│   │        ↓                                                │   │
│   │   Lambda concurrency = 100 (parallel processing)        │   │
│   │        ↓                                                │   │
│   │   SES send email (respecting rate limits)               │   │
│   │        ↓                                                │   │
│   │   Update delivery status in DynamoDB                    │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO SQS?                                                  │
│   ✅ Rate limiting: control Lambda concurrency                  │
│   ✅ Retry: SES temporary failure → message back to queue       │
│   ✅ Persistence: 14 ngày để xử lý hết                          │
│   ✅ DLQ: bounced/invalid emails → separate handling            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Khi nào dùng PUB/SUB (SNS)?

```
┌─────────────────────────────────────────────────────────────────┐
│                     SNS USE CASES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ✅ DÙNG KHI:                                                  │
│   • Cần fan-out (1 event → nhiều services)                      │
│   • Notifications (email, SMS, push)                            │
│   • Alert broadcasting                                          │
│   • Kết hợp với SQS để fan-out + persistence                    │
│                                                                 │
│   ❌ KHÔNG DÙNG KHI:                                            │
│   • Cần message persistence                                     │
│   • Cần replay messages                                         │
│   • Complex event routing/filtering                             │
│                                                                 │
│   📝 EXAMPLES:                                                  │
│   • Order created → notify Analytics, Billing, Inventory        │
│   • CloudWatch Alarm → send to Email, SMS, PagerDuty            │
│   • S3 upload → trigger multiple Lambda functions               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🛒 Ví dụ thực tế #1: Order Completion Fanout (E-commerce)

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Khi đơn hàng hoàn thành, nhiều services cần biết    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • Order service KHÔNG NÊN biết về các services khác           │
│   • 5+ services cần xử lý khi có đơn mới                        │
│   • Nếu gọi trực tiếp → coupling, slow, complex                 │
│                                                                 │
│   SOLUTION với SNS:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Order completed                                       │   │
│   │        ↓                                                │   │
│   │   ┌───────────────────────────────────┐                  │  │
│   │   │  SNS Topic: order-completed       │                  │  │
│   │   │  {orderId, customerId, amount}    │                  │  │
│   │   └───────────────────────────────────┘                  │  │
│   │        │ PUSH to ALL subscribers (fan-out)               │  │
│   │        ↓                                                │   │
│   │   ┌──────────┬──────────┬──────────┬──────────┐          │  │
│   │   │          │          │          │          │          │  │
│   │   ↓          ↓          ↓          ↓          ↓         │   │
│   │ ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────────┐           │  │
│   │ │SQS │   │SQS │   │SQS │   │Lambda  │Email   │           │  │
│   │ │Inv │   │Bill│   │Ship│   │Analytics│Customer│          │  │
│   │ └────┘   └────┘   └────┘   └────────┘└────────┘          │  │
│   │   ↓         ↓         ↓         ↓         ↓             │   │
│   │ Update   Create    Print     Track    "Thank you        │   │
│   │ stock    invoice   label     metrics   for order!"      │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO SNS?                                                  │
│   ✅ Fan-out: 1 event → 5 different services                    │
│   ✅ Loose coupling: Order service chỉ publish, không care      │
│   ✅ Easy to add new subscribers (no code change)               │
│   ✅ SNS→SQS: fan-out + persistence for critical services       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🚨 Ví dụ thực tế #2: CloudWatch Alarm Broadcasting

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Server CPU 90% → Alert toàn team                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • Khi có incident, nhiều kênh cần nhận alert                  │
│   • DevOps → Slack, On-call → SMS, Manager → Email              │
│   • PagerDuty cần tự động create incident                       │
│                                                                 │
│   SOLUTION với SNS:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   CloudWatch Alarm: CPU > 90%                           │   │
│   │        ↓ trigger                                        │   │
│   │   ┌───────────────────────────────────┐                  │  │
│   │   │  SNS Topic: critical-alerts       │                  │  │
│   │   │  {alarmName, state, reason}       │                  │  │
│   │   └───────────────────────────────────┘                  │  │
│   │        │ PUSH simultaneously                             │  │
│   │        ↓                                                │   │
│   │   ┌──────────┬──────────┬──────────┬──────────┐          │  │
│   │   │          │          │          │          │          │  │
│   │   ↓          ↓          ↓          ↓          ↓         │   │
│   │ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌──────────┐       │  │
│   │ │Email │ │ SMS  │ │Lambda│ │PagerDuty │Slack Bot │       │  │
│   │ │Team  │ │On-call│ │Logger│ │HTTPS    │ │HTTPS    │      │  │
│   │ └──────┘ └──────┘ └──────┘ └────────┘ └──────────┘       │  │
│   │                                                         │   │
│   │   → Tất cả nhận CÙNG LÚC trong vài giây                 │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO SNS?                                                  │
│   ✅ Multi-protocol: Email, SMS, HTTPS, Lambda cùng lúc         │
│   ✅ Instant: Push ngay lập tức, không delay                    │
│   ✅ Native CloudWatch integration                              │
│   ✅ Filter by subscription: critical vs warning topics         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🏗️ Ví dụ thực tế #3: Microservices Event Notification

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: User signup → nhiều services cần initialize         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • User registers → Auth service creates account               │
│   • Marketing: send welcome email + add to mailing list         │
│   • Analytics: track conversion                                 │
│   • Billing: create Stripe customer                             │
│   • Notifications: send mobile push                             │
│                                                                 │
│   SOLUTION với SNS:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Auth Service: User created                            │   │
│   │        ↓ publish                                        │   │
│   │   ┌───────────────────────────────────┐                  │  │
│   │   │  SNS Topic: user-created          │                  │  │
│   │   │  {userId, email, name, plan}      │                  │  │
│   │   └───────────────────────────────────┘                  │  │
│   │        │                                                 │  │
│   │   ┌────┴────┬──────────┬──────────┬──────────┐           │  │
│   │   ↓         ↓          ↓          ↓          ↓          │   │
│   │ Marketing Analytics  Billing  Notification Audit        │   │
│   │ Service   Service   Service    Service    Service       │   │
│   │   ↓         ↓          ↓          ↓          ↓          │   │
│   │ Welcome   Track     Create    Send push   Log user      │   │
│   │ email    signup    Stripe ID  "Welcome!"  creation      │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO SNS?                                                  │
│   ✅ Decoupling: Auth service không biết về other services      │
│   ✅ Fan-out: 5 services process cùng 1 event                   │
│   ✅ Easy scaling: thêm service mới = add subscriber            │
│   ✅ Message filtering: filter by user.plan = "premium"         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Khi nào dùng STREAMING (Kinesis)?

```
┌─────────────────────────────────────────────────────────────────┐
│                   KINESIS USE CASES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ✅ DÙNG KHI:                                                  │
│   • Real-time streaming data                                    │
│   • Need message replay                                         │
│   • Multiple consumers reading same data independently          │
│   • Analytics, metrics, logs processing                         │
│   • Event sourcing pattern                                      │
│   • Ordering required (per shard)                               │
│                                                                 │
│   ❌ KHÔNG DÙNG KHI:                                            │
│   • Simple task queue (use SQS)                                 │
│   • Need complex routing (use EventBridge)                      │
│   • Low throughput, simple notifications (use SNS)              │
│                                                                 │
│   📝 EXAMPLES:                                                  │
│   • IoT sensor data streaming                                   │
│   • Application logs aggregation                                │
│   • Clickstream analytics                                       │
│   • Real-time leaderboard                                       │
│   • Stock price tracking                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🌡️ Ví dụ thực tế #1: IoT Sensor Data Pipeline (Smart Factory)

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Nhà máy thông minh với 10,000 sensors               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • 10,000 sensors gửi data mỗi giây (temperature, pressure)    │
│   • Real-time monitoring: phát hiện anomaly ngay                │
│   • Historical analysis: xem lại data tuần trước                │
│   • Multiple teams cần access: Operations, ML, Maintenance      │
│                                                                 │
│   SOLUTION với Kinesis:                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   10,000 Sensors (temperature, pressure, vibration)     │   │
│   │        ↓ (data mỗi giây)                                │   │
│   │   ┌──────────────────────────────────────────────────┐   │  │
│   │   │  Kinesis Data Stream: factory-sensors            │   │  │
│   │   │  [t:10:00] [t:10:01] [t:10:02] ... [t:10:59]     │   │  │
│   │   │  Retention: 7 days | Shards: 20                  │   │  │
│   │   └──────────────────────────────────────────────────┘   │  │
│   │        │                                                 │  │
│   │   ┌────┴────┬────────────┬────────────┬───────────┐      │  │
│   │   ↓         ↓            ↓            ↓           ↓     │   │
│   │ Lambda   Kinesis      Kinesis       ML Model   Firehose │   │
│   │ (Alert)  Analytics   (Dashboard)   (Anomaly)   (→S3)    │   │
│   │   ↓      (real-time)     ↓           ↓          ↓       │   │
│   │ Send     "AVG temp     Grafana    Predict    Archive    │   │
│   │ SMS if   last 5min"   real-time  failure    for later   │   │
│   │ temp>100                                    analysis    │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO KINESIS?                                              │
│   ✅ High throughput: 10K messages/sec                          │
│   ✅ Replay: ML team tua lại xem data tuần trước                │
│   ✅ Multiple consumers: 5 teams đọc cùng 1 stream              │
│   ✅ Ordering: Events từ same sensor giữ đúng thứ tự            │
│   ✅ Firehose: auto-archive to S3 for long-term storage         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 📊 Ví dụ thực tế #2: Real-time Clickstream Analytics (E-commerce)

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Track user behavior trên website e-commerce         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • Track every click, scroll, view trên website                │
│   • Real-time dashboard: "Bao nhiêu users online?"              │
│   • A/B testing: version nào có conversion cao hơn?             │
│   • Historical analysis: user journey analysis                  │
│                                                                 │
│   SOLUTION với Kinesis:                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Website/App (millions of events)                      │   │
│   │   - page_view, add_to_cart, checkout, click             │   │
│   │        ↓                                                │   │
│   │   ┌──────────────────────────────────────────────────┐   │  │
│   │   │  Kinesis Data Stream: clickstream                │   │  │
│   │   │  Partition by: userId (ordering per user)        │   │  │
│   │   │  Retention: 24 hours                             │   │  │
│   │   └──────────────────────────────────────────────────┘   │  │
│   │        │                                                 │  │
│   │   ┌────┴────┬────────────┬────────────┐                  │  │
│   │   ↓         ↓            ↓            ↓                 │   │
│   │ Kinesis   Lambda       Firehose    Lambda               │   │
│   │ Analytics (real-time)  (→S3→Athena)(personalization)    │   │
│   │   ↓         ↓            ↓            ↓                 │   │
│   │ "Users    Track       Historical  "You might            │   │
│   │ online    conversion  queries     like..."              │   │
│   │ now: 5K"  rate        with SQL                          │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO KINESIS?                                              │
│   ✅ Massive throughput: millions events/hour                   │
│   ✅ Real-time: dashboard update trong seconds                  │
│   ✅ Replay: A/B test team replay yesterday's data              │
│   ✅ Ordering by userId: user journey đúng thứ tự               │
│   ✅ Multiple consumers: Analytics, Personalization, Archive    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 📝 Ví dụ thực tế #3: Application Log Aggregation (Microservices)

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: 50 microservices gửi logs về central platform       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • 50 services generating logs constantly                      │
│   • Need real-time error alerting                               │
│   • Need to search logs across all services                     │
│   • Compliance: keep logs 90 days                               │
│   • Debug: replay logs từ thời điểm incident xảy ra             │
│                                                                 │
│   SOLUTION với Kinesis:                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   50 Microservices (containers/EC2/Lambda)              │   │
│   │   - CloudWatch Agent / Fluent Bit / SDK                 │   │
│   │        ↓                                                │   │
│   │   ┌──────────────────────────────────────────────────┐   │  │
│   │   │  Kinesis Data Stream: application-logs           │   │  │
│   │   │  Partition by: serviceName                       │   │  │
│   │   │  Retention: 7 days (for replay during incidents) │   │  │
│   │   └──────────────────────────────────────────────────┘   │  │
│   │        │                                                 │  │
│   │   ┌────┴────┬────────────┬────────────┐                  │  │
│   │   ↓         ↓            ↓            ↓                 │   │
│   │ Lambda   Firehose    Firehose    ElasticSearch          │   │
│   │ (Alert)  (→S3 raw)   (→S3 parquet) (real-time search)   │   │
│   │   ↓         ↓            ↓            ↓                 │   │
│   │ Slack:   Archive     Analytics   Kibana                 │   │
│   │ "ERROR   90 days     with Athena dashboard              │   │
│   │ in auth"                                                │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO KINESIS?                                              │
│   ✅ High write throughput: aggregating từ 50 services          │
│   ✅ Multiple destinations: S3 + ES + Lambda cùng lúc           │
│   ✅ Replay: debug incident bằng cách replay logs               │
│   ✅ Ordering: logs từ same service giữ đúng sequence           │
│   ✅ Firehose: auto-transform và archive to S3                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Khi nào dùng EVENT BUS (EventBridge)?

```
┌─────────────────────────────────────────────────────────────────┐
│                 EVENTBRIDGE USE CASES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ✅ DÙNG KHI:                                                  │
│   • Complex event routing với nhiều conditions                  │
│   • Event-driven architecture                                   │
│   • Need event transformation                                   │
│   • Cross-account/cross-region events                           │
│   • SaaS integration (Stripe, Zendesk, etc.)                    │
│   • Scheduled tasks (cron jobs)                                 │
│   • Schema management needed                                    │
│                                                                 │
│   ❌ KHÔNG DÙNG KHI:                                            │
│   • High throughput streaming (use Kinesis)                     │
│   • Simple queue processing (use SQS)                           │
│   • Need guaranteed ordering (use Kinesis/SQS FIFO)             │
│                                                                 │
│   📝 EXAMPLES:                                                  │
│   • AWS service events → trigger Lambda                         │
│   • Stripe payment webhook → process order                      │
│   • Schedule daily reports                                      │
│   • Cross-account event sharing                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 💳 Ví dụ thực tế #1: SaaS Webhook Integration (Stripe/Shopify)

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Xử lý Stripe payments với complex routing           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • Stripe gửi nhiều loại events: payment, refund, dispute      │
│   • Mỗi loại event cần route đến service khác nhau              │
│   • Cần filter theo amount (VIP orders > $500)                  │
│   • Transform event format trước khi gửi                        │
│                                                                 │
│   SOLUTION với EventBridge:                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Stripe (payment.succeeded, refund.created, etc.)      │   │
│   │        ↓ (Partner Event Source)                         │   │
│   │   ┌──────────────────────────────────────────────────┐   │  │
│   │   │  EventBridge: Partner Event Bus (Stripe)         │   │  │
│   │   │                                                  │   │  │
│   │   │  RULES:                                          │   │  │
│   │   │  ┌─────────────────────────────────────────────┐│    │  │
│   │   │  │Rule 1: source = "stripe"                    ││    │  │
│   │   │  │        AND detail.type = "payment.succeeded"││    │  │
│   │   │  │        AND detail.amount > 50000 (>$500)    ││    │  │
│   │   │  │        → Lambda: send-vip-notification      ││    │  │
│   │   │  │        → Transform: {orderId, amount, email}││    │  │
│   │   │  └─────────────────────────────────────────────┘│    │  │
│   │   │  ┌─────────────────────────────────────────────┐│    │  │
│   │   │  │Rule 2: detail.type = "refund.created"       ││    │  │
│   │   │  │        → SQS: refund-processing-queue       ││    │  │
│   │   │  └─────────────────────────────────────────────┘│    │  │
│   │   │  ┌─────────────────────────────────────────────┐│    │  │
│   │   │  │Rule 3: detail.type = "charge.dispute.**"    ││    │  │
│   │   │  │        → SNS: urgent-disputes               ││    │  │
│   │   │  │        → Step Functions: dispute-workflow   ││    │  │
│   │   │  └─────────────────────────────────────────────┘│    │  │
│   │   └──────────────────────────────────────────────────┘   │  │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO EVENTBRIDGE?                                          │
│   ✅ Native Stripe integration (Partner Event Source)           │
│   ✅ Complex filtering: type + amount + customer tier           │
│   ✅ Input transformation: chỉ gửi fields cần thiết             │
│   ✅ Multiple targets per rule: Lambda + SNS + Step Functions   │
│   ✅ Archive: replay events for debugging                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 🏢 Ví dụ thực tế #2: Cross-Account Event Sharing (Enterprise)

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Multi-account AWS organization với shared events    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • Enterprise có 20+ AWS accounts (dev, staging, prod)         │
│   • Security events cần gửi về Central Security Account         │
│   • Billing events cần aggregate về Finance Account             │
│   • Không muốn tạo complex IAM cross-account roles              │
│                                                                 │
│   SOLUTION với EventBridge:                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Account A (Dev)        Account B (Prod)               │   │
│   │   ┌─────────────┐       ┌─────────────┐                  │  │
│   │   │ GuardDuty   │       │ GuardDuty   │                  │  │
│   │   │ CloudTrail  │       │ CloudTrail  │                  │  │
│   │   └──────┬──────┘       └──────┬──────┘                  │  │
│   │          ↓                     ↓                        │   │
│   │   ┌─────────────┐       ┌─────────────┐                  │  │
│   │   │EventBridge  │       │EventBridge  │                  │  │
│   │   │Rule: forward│       │Rule: forward│                  │  │
│   │   │to Central   │       │to Central   │                  │  │
│   │   └──────┬──────┘       └──────┬──────┘                  │  │
│   │          │                     │                         │  │
│   │          └──────────┬──────────┘                         │  │
│   │                     ↓                                   │   │
│   │   ┌─────────────────────────────────────────────────┐    │  │
│   │   │  Central Security Account                       │    │  │
│   │   │  EventBridge: security-events-bus               │    │  │
│   │   │                                                 │    │  │
│   │   │  Rule: if severity = "HIGH"                     │    │  │
│   │   │        → SNS: page-security-team                │    │  │
│   │   │        → Lambda: create-jira-ticket             │    │  │
│   │   │                                                 │    │  │
│   │   │  Rule: all events                               │    │  │
│   │   │        → S3: security-logs (via Firehose)       │    │  │
│   │   │        → SIEM: Splunk                           │    │  │
│   │   └─────────────────────────────────────────────────┘    │  │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO EVENTBRIDGE?                                          │
│   ✅ Native cross-account: ko cần manage IAM roles              │
│   ✅ Event filtering at source: chỉ forward relevant events     │
│   ✅ Schema Registry: quản lý event format across accounts      │
│   ✅ Archive: audit trail cho compliance                        │
│   ✅ Centralized processing với smart routing                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### ⏰ Ví dụ thực tế #3: Scheduled Jobs & Orchestration

```
┌─────────────────────────────────────────────────────────────────┐
│   SCENARIO: Cron jobs cho data pipeline và maintenance tasks    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROBLEM:                                                      │
│   • Daily data export to S3 lúc 2AM                             │
│   • Weekly cleanup of old logs                                  │
│   • Monthly billing report generation                           │
│   • Không muốn chạy EC2 24/7 chỉ để run cron                    │
│                                                                 │
│   SOLUTION với EventBridge Scheduler:                           │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   EventBridge Scheduler                                 │   │
│   │   ┌─────────────────────────────────────────────────┐    │  │
│   │   │                                                 │    │  │
│   │   │ Schedule 1: cron(0 2 * * ? *)  "2AM daily"     │     │  │
│   │   │   → Step Functions: daily-data-export          │     │  │
│   │   │   Workflow:                                     │    │  │
│   │   │     1. Query RDS → export to S3                 │    │  │
│   │   │     2. Run Glue job → transform data            │    │  │
│   │   │     3. Notify Slack → "Export complete"         │    │  │
│   │   │                                                 │    │  │
│   │   │ Schedule 2: cron(0 3 ? * SUN *)  "3AM Sunday"   │    │  │
│   │   │   → Lambda: cleanup-old-logs                   │     │  │
│   │   │                                                 │    │  │
│   │   │ Schedule 3: cron(0 6 1 * ? *)  "First of month"│     │  │
│   │   │   → Step Functions: monthly-billing-report      │    │  │
│   │   │   Workflow:                                     │    │  │
│   │   │     1. Query Cost Explorer                      │    │  │
│   │   │     2. Generate PDF report                      │    │  │
│   │   │     3. Email to finance@company.com             │    │  │
│   │   │                                                 │    │  │
│   │   │ Schedule 4: rate(5 minutes)                     │    │  │
│   │   │   → Lambda: health-check-all-services           │    │  │
│   │   │                                                 │    │  │
│   │   └─────────────────────────────────────────────────┘    │  │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   TẠI SAO EVENTBRIDGE?                                          │
│   ✅ Serverless cron: no EC2 to manage                          │
│   ✅ Flexible schedule: cron expression hoặc rate               │
│   ✅ Multiple targets: Lambda, Step Functions, ECS, etc.        │
│   ✅ Built-in retry: automatic retry on failure                 │
│   ✅ Timezone support: schedule in local timezone               │
│   ✅ One-time schedules: cho ad-hoc tasks                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Decision Tree

```
┌──────────────────────────────────────────────────────────────────┐
│                     DECISION TREE                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   START: Bạn cần gì?                                             │
│         │                                                        │
│        ↓                                                         │
│   ┌───────────────────┐                                          │
│   │ Cần replay messages│                                         │
│   │ hoặc multiple     │                                          │
│   │ consumer groups?  │                                          │
│   └─────────┬─────────┘                                          │
│         YES │ NO                                                 │
│         ↓   └──────────────────────────────────────┐             │
│   ┌───────────────┐                                 │            │
│   │   KINESIS     │                                 │            │
│   │ (or Kafka/MSK)│                                ↓             │
│   └───────────────┘                     ┌───────────────────┐    │
│                                         │ Cần fan-out        │   │
│                                         │ (1 msg → nhiều     │   │
│                                         │ consumers)?        │   │
│                                         └─────────┬─────────┘    │
│                                               YES │ NO           │
│                               ┌───────────────────┘   │          │
│                               ↓                      ↓           │
│   ┌───────────────┐                     ┌───────────────────┐    │
│   │ Cần complex   │                     │     SQS           │    │
│   │ routing/filtering?│                     │ (simple queue) │   │
│   └─────────┬─────┘                     └───────────────────┘    │
│                          YES │ NO                                │
│                          ↓   │                                   │
│                ┌─────────────┘                                   │
│                ↓             ↓                                   │
│   ┌─────────────────┐  ┌─────────────┐                           │
│   │   EVENTBRIDGE   │  │ SNS + SQS   │                           │
│   │ (advanced rules)│  │ (fan-out)   │                           │
│   └─────────────────┘  └─────────────┘                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Quick Reference Table

| Scenario | Best Choice |
|----------|-------------|
| Simple task queue | **SQS** |
| Notify multiple services | **SNS** → SQS |
| Real-time analytics | **Kinesis** |
| Complex event routing | **EventBridge** |
| Message replay needed | **Kinesis** |
| Cron jobs/scheduling | **EventBridge** |
| SaaS webhooks | **EventBridge** |
| IoT data ingestion | **Kinesis** |
| Decouple microservices | **SQS** or **EventBridge** |

---

## 5. Kết hợp các patterns

### 5.1 SNS + SQS (Fan-out + Persistence)

```
┌─────────────────────────────────────────────────────────────────┐
│               SNS + SQS COMBINATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Problem: SNS fan-out nhưng không có persistence               │
│   Solution: SNS → Multiple SQS queues                           │
│                                                                 │
│   ┌──────────────┐                                              │
│   │ Order Service│                                              │
│   └──────┬───────┘                                              │
│          │ publish                                              │
│          ↓                                                      │
│   ┌──────────────┐                                              │
│   │  SNS Topic   │                                              │
│   └──────┬───────┘                                              │
│          │ fan-out                                              │
│   ┌──────┼──────┬──────────┐                                    │
│   ↓      ↓      ↓          ↓                                    │
│ ┌────┐ ┌────┐ ┌────┐   ┌────────┐                               │
│ │SQS │ │SQS │ │SQS │   │Lambda  │                               │
│ │ A  │ │ B  │ │ C  │   │        │                               │
│ └────┘ └────┘ └────┘   └────────┘                               │
│   ↓      ↓      ↓                                               │
│ Order  Billing Analytics                                        │
│                                                                 │
│   ✅ Fan-out (from SNS)                                         │
│   ✅ Persistence (from SQS)                                     │
│   ✅ Independent processing                                     │
│   ✅ DLQ support                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 EventBridge + SQS (Smart Routing + Persistence)

```
┌─────────────────────────────────────────────────────────────────┐
│            EVENTBRIDGE + SQS COMBINATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Events from various sources                                   │
│        ↓                                                        │
│   ┌──────────────────────────────────────┐                      │
│   │           EventBridge                │                      │
│   │                                      │                      │
│   │  Rule 1: if amount > 100 → SQS-VIP   │                      │
│   │  Rule 2: if amount < 100 → SQS-Std   │                      │
│   │  Rule 3: all orders → Analytics SQS  │                      │
│   │                                      │                      │
│   └────┬─────────────┬──────────────┬────┘                      │
│        ↓             ↓              ↓                           │
│   ┌────────┐   ┌────────┐    ┌────────────┐                     │
│   │SQS VIP │   │SQS Std │    │SQS Analytics                     │
│   │Orders  │   │Orders  │    │            │                     │
│   └────────┘   └────────┘    └────────────┘                     │
│                                                                 │
│   ✅ Smart routing based on content                             │
│   ✅ Persistence in SQS                                         │
│   ✅ Different processing per queue                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Kinesis + Lambda (Real-time Processing)

```
┌─────────────────────────────────────────────────────────────────┐
│             KINESIS + LAMBDA COMBINATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   IoT Sensors / Clickstream / Logs                              │
│        ↓                                                        │
│   ┌──────────────────────────────────────┐                      │
│   │       Kinesis Data Streams           │                      │
│   │  [data] [data] [data] [data] [data]  │                      │
│   └────┬─────────────────────────────────┘                      │
│        │                                                        │
│   ┌────┴────┬────────────┬───────────────┐                      │
│   ↓         ↓            ↓               ↓                      │
│ Lambda   Lambda    Kinesis Data    Kinesis Data                 │
│ (real-   (metrics) Analytics       Firehose                     │
│  time)              (SQL query)    (→ S3)                       │
│                                                                 │
│   ✅ Real-time processing with Lambda                           │
│   ✅ Analytics with Kinesis Data Analytics                      │
│   ✅ Archive to S3 with Firehose                                │
│   ✅ All consumers read same stream                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Spring Boot Integration

> **⚠️ Lưu ý quan trọng:** Tất cả các patterns đều có thể dùng với Spring Boot!

| Pattern | Library | Annotation |
|---------|---------|------------|
| **SQS** | spring-cloud-aws | `@SqsListener` |
| **SNS** | HTTP endpoint hoặc SNS→SQS | `@PostMapping` hoặc `@SqsListener` |
| **Kinesis** | AWS SDK hoặc KCL | Manual processing |
| **Kafka** | spring-kafka | `@KafkaListener` |

Chi tiết xem:
- [SQS Spring Boot Integration](./sqs.md#7-spring-boot-integration)
- [SNS Spring Boot Integration](./sns.md#5-spring-boot-integration)

---

## 7. Exam Tips

### Q1: SNS vs SQS - Khác biệt chính?
**A:** SNS = Push, fan-out, no persistence. SQS = Pull, point-to-point, persistence.

### Q2: Khi nào dùng Kinesis thay vì SQS?
**A:** Cần replay, multiple consumers đọc cùng data, real-time analytics.

### Q3: EventBridge vs SNS?
**A:** EventBridge = advanced routing/filtering, schema registry. SNS = simple fan-out.

### Q4: SNS + SQS pattern dùng khi nào?
**A:** Cần fan-out (SNS) + persistence/retry (SQS).

---

## Tài liệu tham khảo

- [SQS Documentation](./sqs.md)
- [SNS Documentation](./sns.md)
- [Kinesis Documentation](./kinesis.md)
- [EventBridge Documentation](./eventbridge.md)
- [Amazon MQ Documentation](./amazon-mq.md)
