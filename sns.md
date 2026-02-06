# Amazon SNS (Simple Notification Service)


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. Core Concepts](#1-core-concepts)
- [2. Subscription Types](#2-subscription-types)
- [3. Message Filtering](#3-message-filtering)
- [4. SNS + SQS Fan-out](#4-sns-sqs-fan-out)
- [5. Spring Boot Integration](#5-spring-boot-integration)
- [6. FIFO Topics](#6-fifo-topics)
- [6. Security](#6-security)
- [7. Best Practices](#7-best-practices)
- [8. SNS vs SQS vs EventBridge](#8-sns-vs-sqs-vs-eventbridge)
- [9. Common Exam Questions](#9-common-exam-questions)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Amazon SNS** là fully managed **pub/sub** messaging service để gửi notifications đến nhiều subscribers cùng lúc.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SNS PUB/SUB MODEL                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Publisher (1)                                                 │
│       │                                                         │
│       ↓                                                         │
│   ┌───────────────────────────────────────┐                    │
│   │           SNS TOPIC                   │                    │
│   │    "order-created-topic"              │                    │
│   └───────────────────────────────────────┘                    │
│       │           │           │           │                     │
│       ↓           ↓           ↓           ↓                     │
│   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐                │
│   │  SQS  │   │Lambda │   │ Email │   │ HTTP  │                │
│   │ Queue │   │       │   │       │   │Endpoint│               │
│   └───────┘   └───────┘   └───────┘   └───────┘                │
│                                                                 │
│   Subscribers (many) - TẤT CẢ đều nhận message                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SNS vs SQS

| | **SNS** | **SQS** |
|---|---------|---------|
| **Model** | Pub/Sub (push) | Queue (pull) |
| **Message Delivery** | 1 message → ALL subscribers | 1 message → 1 consumer |
| **Persistence** | No (instant delivery) | Yes (up to 14 days) |
| **Consumer** | Passive (receive push) | Active (poll messages) |

---

## 1. Core Concepts

### 1.1 Topic

```
┌─────────────────────────────────────────────────────────────────┐
│                       SNS TOPIC                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Topic = "Channel" để publishers gửi messages                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Topic ARN: arn:aws:sns:us-east-1:123456789:my-topic    │  │
│   │                                                         │  │
│   │  Limits:                                                │  │
│   │  • Up to 12,500,000 subscriptions per topic             │  │
│   │  • Up to 100,000 topics per account                     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Message Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    SNS MESSAGE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  {                                                      │  │
│   │    "Type": "Notification",                              │  │
│   │    "MessageId": "uuid",                                 │  │
│   │    "TopicArn": "arn:aws:sns:...",                       │  │
│   │    "Subject": "Optional subject",                       │  │
│   │    "Message": "Your actual message content",            │  │
│   │    "Timestamp": "2024-01-01T00:00:00.000Z",             │  │
│   │    "MessageAttributes": {                               │  │
│   │      "OrderType": {"Type": "String", "Value": "online"} │  │
│   │    }                                                    │  │
│   │  }                                                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Max message size: 256 KB                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Publishers

| Publisher | Mô tả |
|-----------|-------|
| **AWS SDK** | Publish API từ applications |
| **CloudWatch Alarms** | Alert notifications |
| **S3 Events** | Bucket notifications |
| **Lambda** | Function triggers |
| **Many AWS Services** | EventBridge, CodePipeline... |

---

## 2. Subscription Types

### 2.1 Tất cả Subscription Protocols

```
┌─────────────────────────────────────────────────────────────────┐
│                  SUBSCRIPTION PROTOCOLS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   APPLICATION INTEGRATION:                                      │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • SQS Queue     → Fan-out to queues                    │  │
│   │  • Lambda        → Serverless processing                │  │
│   │  • Kinesis       → Data Firehose (via Firehose)         │  │
│   │  • HTTP/HTTPS    → Custom webhooks                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   DIRECT NOTIFICATIONS:                                         │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • Email/Email-JSON  → User notifications               │  │
│   │  • SMS               → Mobile text messages             │  │
│   │  • Mobile Push       → iOS, Android, Fire OS            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Protocol Details

| Protocol | Use Case | Confirmation |
|----------|----------|--------------|
| **SQS** | Decouple processing | Auto-confirmed |
| **Lambda** | Serverless processing | Auto-confirmed |
| **HTTP/HTTPS** | Webhooks, APIs | Must confirm subscription |
| **Email** | User alerts | Must confirm via link |
| **SMS** | Mobile alerts | No confirmation needed |
| **Mobile Push** | App notifications | Device registration |

### 2.3 Subscription Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│              SUBSCRIPTION CONFIRMATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   HTTP/HTTPS & Email subscriptions require confirmation:        │
│                                                                 │
│   1. Create subscription → Status: "Pending confirmation"       │
│                                 ↓                               │
│   2. SNS sends confirmation message                             │
│      • HTTP: POST with SubscribeURL                             │
│      • Email: Click confirmation link                           │
│                                 ↓                               │
│   3. Subscriber confirms                                        │
│                                 ↓                               │
│   4. Status: "Confirmed" → Ready to receive messages            │
│                                                                 │
│   ⚠️  Unconfirmed subscriptions auto-delete after 3 days        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Message Filtering

### 3.1 Filter Policy

```
┌─────────────────────────────────────────────────────────────────┐
│                   MESSAGE FILTERING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Without Filter: ALL subscribers receive ALL messages          │
│                                                                 │
│   With Filter Policy (JSON):                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Publisher sends:                                       │  │
│   │  Message: "Order placed"                                │  │
│   │  MessageAttributes: {                                   │  │
│   │    "eventType": "order",                                │  │
│   │    "store": "online",                                   │  │
│   │    "price": 150                                         │  │
│   │  }                                                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                        ↓                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Subscriber 1 (Online Orders Only):                     │  │
│   │  FilterPolicy: {"store": ["online"]}                    │  │
│   │  → ✅ RECEIVES                                          │  │
│   ├─────────────────────────────────────────────────────────┤  │
│   │  Subscriber 2 (In-Store Orders Only):                   │  │
│   │  FilterPolicy: {"store": ["in-store"]}                  │  │
│   │  → ❌ FILTERED OUT                                      │  │
│   ├─────────────────────────────────────────────────────────┤  │
│   │  Subscriber 3 (High Value Orders):                      │  │
│   │  FilterPolicy: {"price": [{"numeric": [">=", 100]}]}    │  │
│   │  → ✅ RECEIVES (150 >= 100)                             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Filter Policy Operators

| Operator | Example | Matches |
|----------|---------|---------|
| **Exact match** | `{"color": ["red"]}` | color = "red" |
| **OR** | `{"color": ["red", "blue"]}` | color = "red" OR "blue" |
| **Prefix** | `{"region": [{"prefix": "us-"}]}` | region starts with "us-" |
| **Numeric** | `{"price": [{"numeric": [">", 100]}]}` | price > 100 |
| **Exists** | `{"color": [{"exists": true}]}` | color attribute exists |
| **Anything-but** | `{"color": [{"anything-but": "red"}]}` | color != "red" |

### 3.3 Filter Policy Scope

```
┌─────────────────────────────────────────────────────────────────┐
│              FILTER POLICY SCOPE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   MessageAttributes (default):                                  │
│   • Filter based on message metadata                            │
│   • FilterPolicyScope: "MessageAttributes"                      │
│                                                                 │
│   MessageBody:                                                  │
│   • Filter based on message content (JSON)                      │
│   • FilterPolicyScope: "MessageBody"                            │
│   • Message body must be valid JSON                             │
│                                                                 │
│   Example (MessageBody filter):                                 │
│   Message: {"customer": {"type": "premium"}, "amount": 500}     │
│   FilterPolicy: {"customer": {"type": ["premium"]}}             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. SNS + SQS Fan-out

### 4.1 Vấn đề và Giải pháp

**Vấn đề**: Một event cần trigger **nhiều xử lý độc lập**

```
Ví dụ: User upload ảnh → cần làm:
  1. Tạo thumbnail
  2. Phân tích AI
  3. Archive lên Glacier
  4. Gửi email thông báo

❌ KHÔNG TỐT: 1 Lambda xử lý TẤT CẢ
   → Nếu step 3 fail → ảnh hưởng cả hệ thống
   → Không scale được từng phần riêng
```

**Giải pháp: Fan-out = "Phân nhánh" message ra nhiều hướng**

```
                      S3 (upload ảnh)
                           │
                           ↓
                    ┌─────────────┐
                    │  SNS Topic  │  ← Nhận 1 event
                    └─────────────┘
                           │
        ┌──────────┬───────┴───────┬──────────┐
        ↓          ↓               ↓          ↓
    ┌──────┐   ┌──────┐       ┌──────┐   ┌──────┐
    │SQS 1 │   │SQS 2 │       │SQS 3 │   │Lambda│
    └──────┘   └──────┘       └──────┘   └──────┘
        ↓          ↓               ↓          ↓
    Thumbnail   AI phân tích   Archive    Email
```

### 4.2 Tại sao dùng SQS thay vì Lambda trực tiếp?

| | SNS → Lambda | SNS → SQS → Consumer |
|---|---|---|
| **Buffering** | ❌ Lambda phải sẵn sàng | ✅ SQS giữ message khi app down |
| **Retry** | Lambda tự handle | ✅ SQS có built-in retry |
| **DLQ** | Phức tạp hơn | ✅ DLQ dễ config |
| **Rate limiting** | ❌ Lambda bị overwhelm | ✅ Consumer xử lý theo tốc độ |

### 4.3 Fan-out với Message Filtering

> ⚠️ **QUAN TRỌNG**: Filter xảy ra **ở tầng SNS**, TRƯỚC KHI gửi đến SQS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MESSAGE FILTERING FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Publisher gửi: { "orderType": "online" }                                   │
│                          │                                                   │
│                          ↓                                                   │
│                   ┌─────────────┐                                            │
│                   │  SNS Topic  │                                            │
│                   └──────┬──────┘                                            │
│                          │                                                   │
│        ┌─────────────────┼─────────────────┐                                 │
│        ↓                 ↓                 ↓                                 │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐                            │
│   │Filter:   │     │Filter:   │     │Filter:   │  ← Filter Policy gắn       │
│   │"online"  │     │"in-store"│     │ (none)   │    VÀO SUBSCRIPTION        │
│   └────┬─────┘     └────┬─────┘     └────┬─────┘                            │
│        │                │                │                                   │
│    ✅ MATCH         ❌ SKIP          ✅ MATCH                                │
│        │                ✖                │                                   │
│        ↓                                 ↓                                   │
│   ┌──────────┐                     ┌──────────┐                             │
│   │SQS Online│                     │SQS All   │                             │
│   └──────────┘                     └──────────┘                             │
│                                                                              │
│   ⚡ SNS filter TRƯỚC → Không match = KHÔNG gửi → Tiết kiệm cost!           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao filter ở SNS tốt hơn filter ở SQS/Consumer?**

| | Filter ở Consumer | Filter ở SNS |
|---|---|---|
| **Flow** | SQS nhận TẤT CẢ → Consumer đọc rồi bỏ | SNS chỉ gửi message match |
| **Cost** | ❌ Tốn tiền SQS requests | ✅ Tiết kiệm |
| **Load** | ❌ Consumer xử lý message không cần | ✅ Giảm load |

### 4.4 Cross-Region Fan-out

```
┌─────────────────────────────────────────────────────────────────┐
│              CROSS-REGION REPLICATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   US-EAST-1                           EU-WEST-1                 │
│   ┌──────────────┐                   ┌──────────────┐          │
│   │  SNS Topic   │ ───────Cross───→  │  SQS Queue   │          │
│   │              │     Region        │              │          │
│   └──────────────┘                   └──────────────┘          │
│         │                                   │                   │
│         ↓                                   ↓                   │
│   ┌──────────────┐                   ┌──────────────┐          │
│   │ Local SQS    │                   │ EU Consumer  │          │
│   └──────────────┘                   └──────────────┘          │
│                                                                 │
│   Use Cases:                                                    │
│   • Data replication across regions                             │
│   • Low-latency processing near users                           │
│   • Disaster recovery                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Spring Boot Integration

### 5.1 Spring Boot có thể nhận SNS messages?

> **Có!** Nhưng có 2 cách:

```
┌─────────────────────────────────────────────────────────────────┐
│              SPRING BOOT + SNS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   OPTION 1: SNS → HTTP Endpoint (Spring Boot expose API)        │
│   ┌───────────────────────────────────────────────────────────┐│
│   │  SNS Topic ──PUSH──→ https://your-app.com/sns-endpoint    ││
│   │                           ↓                               ││
│   │                    @PostMapping("/sns-endpoint")          ││
│   │                    public void handle(@RequestBody...)    ││
│   │                                                           ││
│   │  ⚠️ Cần public URL, xử lý subscription confirmation       ││
│   └───────────────────────────────────────────────────────────┘│
│                                                                 │
│   OPTION 2: SNS → SQS → Spring Boot (RECOMMENDED!)              │
│   ┌───────────────────────────────────────────────────────────┐│
│   │  SNS Topic ──→ SQS Queue ←── Spring Boot @SqsListener     ││
│   │                                                           ││
│   │  ✅ Better: decoupled, retry, DLQ support                 ││
│   │  ✅ No need for public URL                                ││
│   │  ✅ Buffering when app is down                            ││
│   └───────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Option 1: HTTP Endpoint

```java
@RestController
public class SnsController {

    @PostMapping("/sns-endpoint")
    public ResponseEntity<String> handleSns(@RequestBody String payload,
                                            @RequestHeader("x-amz-sns-message-type") String messageType) {
        
        // 1. Handle subscription confirmation
        if ("SubscriptionConfirmation".equals(messageType)) {
            // Extract SubscribeURL and call it to confirm
            return ResponseEntity.ok("Subscribed");
        }
        
        // 2. Handle actual notifications
        if ("Notification".equals(messageType)) {
            // Process the message
            processMessage(payload);
        }
        
        return ResponseEntity.ok("OK");
    }
}
```

### 5.3 Option 2: SNS → SQS → Spring Boot (Recommended)

```java
@Component
public class OrderEventConsumer {

    // SNS publishes to SQS, Spring Boot listens to SQS
    @SqsListener("order-events-queue")
    public void handleOrderEvent(String message) {
        // Message contains SNS wrapper, parse it
        SnsNotification notification = objectMapper.readValue(message, SnsNotification.class);
        String actualMessage = notification.getMessage();
        
        // Process the actual message
        processOrderEvent(actualMessage);
    }
}
```

### 5.4 So sánh các patterns

| Pattern | Pros | Cons |
|---------|------|------|
| **SNS → HTTP** | Simple, direct | Need public URL, handle retries |
| **SNS → SQS → App** | Decoupled, buffering, DLQ | Extra hop, slight delay |
| **SNS → Lambda** | Serverless, auto-scale | Cold start, 15 min timeout |

---

## 6. FIFO Topics

### 5.1 FIFO Topic Features

```
┌─────────────────────────────────────────────────────────────────┐
│                   SNS FIFO TOPICS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Standard Topic:                                               │
│   • Best-effort ordering                                        │
│   • At-least-once delivery                                      │
│   • Unlimited throughput                                        │
│                                                                 │
│   FIFO Topic:                                                   │
│   • Strict ordering (by Message Group ID)                       │
│   • Exactly-once delivery                                       │
│   • 300 msg/s (or 10 MB/s with batching)                        │
│   • Name must end with ".fifo"                                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  SNS FIFO Topic ──────→ SQS FIFO Queue ONLY             │  │
│   │  (Cannot subscribe to Standard SQS or Lambda)           │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Message Group ID

```
┌─────────────────────────────────────────────────────────────────┐
│                  MESSAGE GROUP ID                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Publisher sends with MessageGroupId:                          │
│                                                                 │
│   Group "user-123": [Order1] → [Order2] → [Order3]              │
│   Group "user-456": [Order1] → [Order2]                         │
│                                                                 │
│   Delivery guarantees:                                          │
│   • Messages trong SAME group → Ordered                         │
│   • Messages across groups → Parallel processing                │
│                                                                 │
│   FIFO Deduplication:                                           │
│   • Content-based: SNS auto-generates dedup ID                  │
│   • Message-based: You provide MessageDeduplicationId           │
│   • 5-minute deduplication window                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Security

### 6.1 Encryption

```
┌─────────────────────────────────────────────────────────────────┐
│                       ENCRYPTION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   IN-FLIGHT:                                                    │
│   • HTTPS endpoints required                                    │
│   • TLS for all API calls                                       │
│                                                                 │
│   AT-REST (SSE):                                                │
│   • SSE-KMS for message encryption                              │
│   • Key: AWS managed or Customer managed CMK                    │
│   • Messages encrypted before stored (temporary)                │
│                                                                 │
│   ⚠️  Note: SNS doesn't store messages long-term               │
│       Encryption mostly for in-transit protection               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   IAM POLICIES:                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Control WHO can Publish/Subscribe                      │  │
│   │  Attached to IAM users/roles                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   SNS ACCESS POLICIES (Resource-based):                         │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Attached to SNS topic                                  │  │
│   │  Allow cross-account publish/subscribe                  │  │
│   │  Allow AWS services (S3, CloudWatch)                    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**SNS Access Policy Example (Allow S3 to publish):**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "s3.amazonaws.com"},
    "Action": "sns:Publish",
    "Resource": "arn:aws:sns:region:account:topic",
    "Condition": {
      "ArnLike": {
        "aws:SourceArn": "arn:aws:s3:::my-bucket"
      }
    }
  }]
}
```

---

## 7. Best Practices

### 7.1 Design Patterns

| Pattern | Description |
|---------|-------------|
| **Fan-out** | SNS → Multiple SQS queues |
| **Event-driven** | SNS → Lambda |
| **Cross-account** | SNS topic in Account A, SQS in Account B |
| **Cross-region** | SNS topic in region A, SQS in region B |

### 7.2 Message Filtering Best Practices

| Practice | Recommendation |
|----------|---------------|
| **Filter at SNS** | Don't filter in Lambda/Consumer |
| **Use MessageAttributes** | More efficient than body filtering |
| **Keep policies simple** | Complex policies = slower processing |

### 7.3 Reliability

```
┌─────────────────────────────────────────────────────────────────┐
│                  RELIABILITY TIPS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SNS → SQS:                                                    │
│   • Configure DLQ on SQS for failed messages                    │
│                                                                 │
│   SNS → Lambda:                                                 │
│   • Configure DLQ on Lambda                                     │
│   • Set appropriate retry count                                 │
│                                                                 │
│   SNS → HTTP:                                                   │
│   • SNS retries with exponential backoff                        │
│   • Configure DLQ on SNS subscription                           │
│   • 3 immediate retries + 23 retries over 3 hours               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Cost Optimization

| Strategy | Description |
|----------|-------------|
| **Message Filtering** | Reduce unnecessary deliveries |
| **Batch Publishing** | PublishBatch API (up to 10 msgs) |
| **Right Protocol** | SQS cheaper than SMS for alerts |

---

## 8. SNS vs SQS vs EventBridge

```
┌─────────────────────────────────────────────────────────────────┐
│            SNS vs SQS vs EVENTBRIDGE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SNS:                                                          │
│   • Pub/Sub, fan-out                                            │
│   • Simple message filtering                                    │
│   • Many subscription types                                     │
│   • No persistence                                              │
│                                                                 │
│   SQS:                                                          │
│   • Queue, point-to-point                                       │
│   • Message persistence                                         │
│   • Consumer polling                                            │
│   • No native fan-out                                           │
│                                                                 │
│   EventBridge:                                                  │
│   • Event bus                                                   │
│   • Advanced filtering (100+ rules)                             │
│   • Event transformation                                        │
│   • Schema registry                                             │
│   • Event replay                                                │
│   • Third-party integration                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Feature | SNS | SQS | EventBridge |
|---------|-----|-----|-------------|
| **Model** | Pub/Sub | Queue | Event Bus |
| **Filtering** | Simple (attributes) | None | Advanced (100+ rules) |
| **Persistence** | No | Yes | Archive/Replay |
| **Targets** | Many protocols | Consumer apps | AWS services |
| **Transform** | No | No | Yes |
| **Use Case** | Fan-out | Decouple | Event-driven |

---

## 9. Common Exam Questions

### Q1: SNS vs SQS delivery model?
**A:** SNS = Push to all subscribers. SQS = Consumer pulls messages, 1 per message.

### Q2: SNS FIFO can subscribe to what?
**A:** Only SQS FIFO queues. Cannot subscribe to Lambda or Standard SQS.

### Q3: Message filtering là gì?
**A:** Filter policy trên subscription để chỉ nhận messages matching criteria.

### Q4: Max subscriptions per topic?
**A:** 12,500,000 subscriptions

### Q5: SNS message max size?
**A:** 256 KB

### Q6: How to ensure SQS receives from SNS?
**A:** Configure SQS access policy cho phép SNS topic gửi messages.

---

## Tài liệu tham khảo

- [Amazon SNS Developer Guide](https://docs.aws.amazon.com/sns/latest/dg/)
- [SNS Message Filtering](https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html)
- [SNS FAQs](https://aws.amazon.com/sns/faqs/)
