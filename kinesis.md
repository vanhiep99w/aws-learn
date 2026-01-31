# Amazon Kinesis


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. Kinesis Data Streams](#1-kinesis-data-streams)
- [2. Kinesis Data Firehose](#2-kinesis-data-firehose)
- [3. Kinesis Data Analytics](#3-kinesis-data-analytics)
- [4. So sánh Kinesis vs SQS vs Kafka](#4-so-sánh-kinesis-vs-sqs-vs-kafka)
- [5. Best Practices](#5-best-practices)
- [6. Common Exam Questions](#6-common-exam-questions)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

---

## Tổng quan

**Amazon Kinesis** là platform để thu thập, xử lý và phân tích **real-time streaming data** ở bất kỳ quy mô nào.

```
┌─────────────────────────────────────────────────────────────────┐
│                    KINESIS FAMILY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐                      │
│   │ Kinesis Data    │  │ Kinesis Data    │                      │
│   │ Streams         │  │ Firehose        │                      │
│   │ (Real-time)     │  │ (Near real-time)│                      │
│   └─────────────────┘  └─────────────────┘                      │
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐                      │
│   │ Kinesis Data    │  │ Kinesis Video   │                      │
│   │ Analytics       │  │ Streams         │                      │
│   │ (SQL on stream) │  │ (Video streams) │                      │
│   └─────────────────┘  └─────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Kinesis Services Overview

| Service | Mục đích | Latency | Use Case |
|---------|----------|---------|----------|
| **Data Streams** | Ingest & store streaming data | Real-time (~200ms) | Custom processing |
| **Data Firehose** | Load data to destinations | Near real-time (60s+) | ETL to S3/Redshift |
| **Data Analytics** | SQL queries on streams | Real-time | Analytics, dashboards |
| **Video Streams** | Stream video for ML | Real-time | Video analytics |

---

1. [Kinesis Data Streams](#1-kinesis-data-streams)
2. [Kinesis Data Firehose](#2-kinesis-data-firehose)
3. [Kinesis Data Analytics](#3-kinesis-data-analytics)
4. [So sánh Kinesis vs SQS vs Kafka](#4-so-sánh-kinesis-vs-sqs-vs-kafka)
5. [Best Practices](#5-best-practices)

---

## 1. Kinesis Data Streams

### 1.1 Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│               KINESIS DATA STREAMS ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producers                                                     │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│   │  App   │ │  IoT   │ │ Logs   │ │ Clicks │                  │
│   └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘                  │
│        │          │          │          │                       │
│        └──────────┴────┬─────┴──────────┘                       │
│                        ↓                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              KINESIS DATA STREAM                        │  │
│   │  ┌─────────────────────────────────────────────────┐    │  │
│   │  │ Shard 1: [rec1] [rec4] [rec7] [rec10]           │    │  │
│   │  │ Shard 2: [rec2] [rec5] [rec8] [rec11]           │    │  │
│   │  │ Shard 3: [rec3] [rec6] [rec9] [rec12]           │    │  │
│   │  └─────────────────────────────────────────────────┘    │  │
│   │                                                         │  │
│   │  Data Retention: 1 day (default) - 365 days             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                        │                                        │
│        ┌───────────────┼───────────────┐                        │
│        ↓               ↓               ↓                        │
│   ┌────────┐      ┌────────┐      ┌────────┐                   │
│   │ Lambda │      │  EC2   │      │Kinesis │                   │
│   │        │      │  App   │      │Analytics│                  │
│   └────────┘      └────────┘      └────────┘                   │
│   Consumers (có thể đọc lại - replay!)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Shard - Đơn vị cơ bản

```
┌─────────────────────────────────────────────────────────────────┐
│                         SHARD                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Mỗi Shard có capacity cố định:                                │
│                                                                 │
│   WRITE (Ingestion):                                            │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  1 MB/second  OR  1000 records/second                   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   READ (Consumption):                                           │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Standard: 2 MB/second (shared across consumers)        │  │
│   │  Enhanced Fan-out: 2 MB/second PER consumer             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Billing: Pay per shard hour + data transfer                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Ví dụ tính Shard:**
- Bạn cần ingest 5 MB/s → Cần ít nhất **5 shards**
- Bạn có 10 consumers với enhanced fan-out → Mỗi consumer nhận full 2 MB/s

### 1.3 Partition Key & Ordering

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARTITION KEY                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producer gửi record với Partition Key:                        │
│                                                                 │
│   Record { PartitionKey: "user-123", Data: "..." }              │
│                      ↓                                          │
│   Hash(PartitionKey) → Shard mapping                            │
│                      ↓                                          │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ Shard 1: user-123, user-456  (same key → same shard)    │  │
│   │ Shard 2: user-789, user-012                             │  │
│   │ Shard 3: user-345, user-678                             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ✅ Records với CÙNG partition key → CÙNG shard → ORDERING     │
│   ⚠️  Hot partition: quá nhiều records với cùng key             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Producers

| Producer Type | Mô tả | Use Case |
|---------------|-------|----------|
| **AWS SDK** | PutRecord, PutRecords API | Custom apps |
| **Kinesis Producer Library (KPL)** | Batching, compression, retry | High throughput |
| **Kinesis Agent** | Pre-built agent for logs | Log files to Kinesis |
| **CloudWatch Logs** | Direct integration | Log streaming |
| **AWS IoT** | IoT Rule action | IoT devices |

**Kinesis Producer Library (KPL):**
```
┌─────────────────────────────────────────────────────────────────┐
│                    KPL FEATURES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    Producer App                         │  │
│   │  ┌─────────────────────────────────────────────────┐    │  │
│   │  │ Record 1 ─┐                                     │    │  │
│   │  │ Record 2 ─┼──→ Batch → Compress → Send          │    │  │
│   │  │ Record 3 ─┘         ↓                           │    │  │
│   │  │                 Retry on failure                │    │  │
│   │  │                 Async & non-blocking            │    │  │
│   │  └─────────────────────────────────────────────────┘    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Batching: Aggregate user records → fewer API calls            │
│   Compression: Optional compression                             │
│   Retry: Automatic retry with backoff                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 Consumers

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSUMER TYPES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. SHARED CONSUMER (Classic):                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Shard ←──── Poll ──── Consumer 1                       │  │
│   │  (2 MB/s)←── Poll ──── Consumer 2                       │  │
│   │        ←── Poll ──── Consumer 3                         │  │
│   │                                                         │  │
│   │  → 2 MB/s SHARED giữa tất cả consumers                  │  │
│   │  → GetRecords API (pull model)                          │  │
│   │  → Max 5 GetRecords calls/second per shard              │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   2. ENHANCED FAN-OUT (EFO):                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Shard ────→ Push ────→ Consumer 1 (2 MB/s)             │  │
│   │        ────→ Push ────→ Consumer 2 (2 MB/s)             │  │
│   │        ────→ Push ────→ Consumer 3 (2 MB/s)             │  │
│   │                                                         │  │
│   │  → Mỗi consumer nhận RIÊNG 2 MB/s                       │  │
│   │  → SubscribeToShard API (push model via HTTP/2)         │  │
│   │  → ~70ms latency (vs ~200ms classic)                    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**So sánh Shared vs Enhanced Fan-out:**

| Feature | Shared (Classic) | Enhanced Fan-out |
|---------|------------------|------------------|
| **Throughput** | 2 MB/s shared | 2 MB/s per consumer |
| **Model** | Pull (GetRecords) | Push (SubscribeToShard) |
| **Latency** | ~200 ms | ~70 ms |
| **Cost** | Lower | Higher |
| **Max Consumers** | Limited by throughput | Up to 20 per stream |

### 1.6 Kinesis Client Library (KCL)

```
┌─────────────────────────────────────────────────────────────────┐
│                    KCL ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                  Kinesis Stream                         │  │
│   │  [Shard 1] [Shard 2] [Shard 3] [Shard 4]                │  │
│   └─────────────────────────────────────────────────────────┘  │
│         │          │          │          │                      │
│         ↓          ↓          ↓          ↓                      │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              KCL Application (2 instances)              │  │
│   │  ┌──────────────────┐  ┌──────────────────┐             │  │
│   │  │   Worker 1       │  │   Worker 2       │             │  │
│   │  │  Shard 1, 2      │  │  Shard 3, 4      │             │  │
│   │  └──────────────────┘  └──────────────────┘             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                        │                                        │
│                        ↓                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                  DynamoDB                               │  │
│   │  (Checkpoint tracking - which records processed)         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Rules:                                                        │
│   • 1 shard = max 1 KCL worker có thể read                      │
│   • 4 shards, 4 workers → 1:1 mapping                           │
│   • 4 shards, 2 workers → mỗi worker đọc 2 shards               │
│   • 4 shards, 6 workers → 2 workers sẽ idle!                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**KCL Features:**
- **Checkpointing**: Track vị trí đã xử lý (lưu trong DynamoDB)
- **Load Balancing**: Tự động phân chia shards cho workers
- **Fault Tolerance**: Worker fail → KCL reassign shards
- **Shard Splitting/Merging**: Tự handle khi stream scale

### 1.7 Capacity Modes

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPACITY MODES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PROVISIONED MODE:                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • Bạn chọn số shards                                   │  │
│   │  • Manual scaling (UpdateShardCount API)                │  │
│   │  • Pay per shard per hour (~$0.015/shard/hour)          │  │
│   │  • Predictable cost                                     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ON-DEMAND MODE:                                               │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • Auto scales based on throughput                      │  │
│   │  • No capacity planning                                 │  │
│   │  • Pay per GB in/out                                    │  │
│   │  • Default: 4 MB/s write, tự scale lên 200 MB/s write   │  │
│   │  • Đắt hơn ~2-3x so với provisioned                     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.8 Data Retention & Replay

```
┌─────────────────────────────────────────────────────────────────┐
│                 DATA RETENTION & REPLAY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Retention Period:                                             │
│   • Default: 24 hours                                           │
│   • Maximum: 365 days                                           │
│                                                                 │
│   Replay Capability:                                            │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Timeline: ──────────────────────────────────────────── │  │
│   │            │ Hour 1 │ Hour 2 │ Hour 3 │ Hour 4 │ Now   │  │
│   │                                                         │  │
│   │  Consumer 1: Reading Hour 4 (current)                   │  │
│   │  Consumer 2: Replaying from Hour 1 (reprocess all)      │  │
│   │                                                         │  │
│   │  → Same stream, different consumers, different positions│  │
│   │  → Mỗi consumer có riêng checkpoint                     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Iterator Types:                                               │
│   • TRIM_HORIZON: Đọc từ oldest record                          │
│   • LATEST: Chỉ đọc new records                                 │
│   • AT_TIMESTAMP: Đọc từ một thời điểm cụ thể                   │
│   • AT_SEQUENCE_NUMBER: Đọc từ một sequence cụ thể              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Kinesis Data Firehose

### 2.1 Tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│              KINESIS DATA FIREHOSE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Fully managed, auto-scaling, NO administration                │
│                                                                 │
│   Sources               Firehose                 Destinations   │
│   ┌────────┐         ┌─────────────┐           ┌────────────┐  │
│   │Producer│────────→│             │──────────→│    S3      │  │
│   │  SDK   │         │  Transform  │           │ Redshift   │  │
│   └────────┘         │  (Lambda)   │           │ OpenSearch │  │
│   ┌────────┐         │             │           │ Splunk     │  │
│   │Kinesis │────────→│  Buffer     │           │ HTTP       │  │
│   │Streams │         │  (size/time)│           │ Endpoint   │  │
│   └────────┘         └─────────────┘           └────────────┘  │
│   ┌────────┐                │                                   │
│   │  IoT   │────────────────┘                                   │
│   └────────┘                                                    │
│                                                                 │
│   Near Real-time: Min 60 seconds buffer (or 1MB)                │
│   → KHÔNG real-time như Data Streams!                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Firehose Destinations

| Destination | Mô tả |
|-------------|-------|
| **Amazon S3** | Most common, any format |
| **Amazon Redshift** | Via S3 COPY command |
| **Amazon OpenSearch** | Log analytics |
| **Splunk** | SIEM integration |
| **HTTP Endpoint** | Custom destinations |
| **3rd Party** | Datadog, New Relic, MongoDB... |

### 2.3 Data Transformation

```
┌─────────────────────────────────────────────────────────────────┐
│              FIREHOSE TRANSFORMATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌────────────┐    ┌────────────┐    ┌────────────┐           │
│   │   Source   │───→│   Lambda   │───→│   S3       │           │
│   │   Records  │    │ Transform  │    │ (output)   │           │
│   └────────────┘    └────────────┘    └────────────┘           │
│                           │                                     │
│                           ↓                                     │
│                    ┌────────────┐                               │
│                    │ S3 Backup  │                               │
│                    │ (original) │                               │
│                    └────────────┘                               │
│                                                                 │
│   Lambda can:                                                   │
│   • Convert formats (CSV → JSON)                                │
│   • Enrich data (add metadata)                                  │
│   • Filter records                                              │
│   • Compress data                                               │
│                                                                 │
│   Built-in conversions:                                         │
│   • JSON → Parquet/ORC (for Athena/Redshift)                    │
│   • GZIP, Snappy compression                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Buffering

| Setting | Min | Max | Default |
|---------|-----|-----|---------|
| **Buffer Size** | 1 MB | 128 MB | 5 MB |
| **Buffer Interval** | 60 sec | 900 sec | 300 sec |

> Firehose delivers khi **một trong hai** điều kiện đạt (size OR time)

### 2.5 Data Streams vs Firehose

```
┌─────────────────────────────────────────────────────────────────┐
│           DATA STREAMS vs FIREHOSE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   DATA STREAMS:                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • Real-time (~200ms latency)                           │  │
│   │  • Custom consumers (Lambda, EC2, KCL)                  │  │
│   │  • Data replay ✅                                       │  │
│   │  • Manage scaling (shards)                              │  │
│   │  • Multiple consumers on same data                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   FIREHOSE:                                                     │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  • Near real-time (60s+ latency)                        │  │
│   │  • Managed destinations (S3, Redshift, OpenSearch)      │  │
│   │  • NO replay (data delivered then gone)                 │  │
│   │  • Auto scaling                                         │  │
│   │  • Data transformation (Lambda, format conversion)      │  │
│   │  • Serverless, no administration                        │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Feature | Data Streams | Firehose |
|---------|--------------|----------|
| **Latency** | Real-time (~200ms) | Near real-time (60s+) |
| **Scaling** | Manual (shards) | Automatic |
| **Processing** | Custom code | Built-in + Lambda |
| **Replay** | ✅ Yes | ❌ No |
| **Destinations** | Any (custom) | AWS services, HTTP |
| **Administration** | Manage shards | Serverless |

---

## 3. Kinesis Data Analytics

### 3.1 Tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│              KINESIS DATA ANALYTICS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Real-time analytics using SQL or Apache Flink                 │
│                                                                 │
│   ┌────────────┐    ┌────────────────┐    ┌────────────┐       │
│   │  Kinesis   │───→│                │───→│  Kinesis   │       │
│   │  Streams   │    │ SQL / Flink    │    │  Streams   │       │
│   └────────────┘    │                │    └────────────┘       │
│   ┌────────────┐    │ Process &      │    ┌────────────┐       │
│   │  Firehose  │───→│ Analyze        │───→│  Firehose  │       │
│   └────────────┘    │                │    └────────────┘       │
│                     └────────────────┘    ┌────────────┐       │
│                                           │   Lambda   │       │
│                                           └────────────┘       │
│                                                                 │
│   Use Cases:                                                    │
│   • Real-time dashboards                                        │
│   • Anomaly detection                                           │
│   • Streaming ETL                                               │
│   • Real-time metrics                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Two Flavors

| | SQL Application | Apache Flink |
|---|-----------------|--------------|
| **Language** | SQL | Java, Scala, Python |
| **Complexity** | Simple queries | Complex processing |
| **Use Case** | Quick analytics | Production apps |
| **Learning Curve** | Low | Higher |

---

## 4. So sánh Kinesis vs SQS vs Kafka

### 4.1 Queue vs Streaming - Khác biệt cốt lõi

```
┌─────────────────────────────────────────────────────────────────┐
│                        QUEUE (SQS)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producer → [A] [B] [C] [D] [E] → Consumer                     │
│                     ↓                                           │
│              Sau khi xử lý xong                                 │
│                     ↓                                           │
│              MESSAGE BỊ XÓA ❌                                   │
│                                                                 │
│   Giống như: HỘP THƯ                                            │
│   • Bạn nhận thư, đọc xong, VỨT ĐI                              │
│   • Người khác không thể đọc lại thư đó                         │
│   • 1 thư = 1 người đọc                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     STREAMING (Kinesis/Kafka)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producer → [A] [B] [C] [D] [E] ← Consumer 1 đọc               │
│                                 ← Consumer 2 đọc                │
│                                 ← Consumer 3 đọc                │
│                     ↓                                           │
│              CÁC MESSAGE VẪN CÒN ĐÓ ✅                          │
│              (Lưu 1-365 ngày)                                   │
│                                                                 │
│   Giống như: YOUTUBE VIDEO / BĂNG GHI ÂM                        │
│   • Bạn xem video, video VẪN CÒN ĐÓ                             │
│   • Người khác có thể xem lại                                   │
│   • Bạn có thể tua lại xem từ đầu                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Kinesis vs Kafka - So sánh chi tiết

```
┌─────────────────────────────────────────────────────────────────┐
│                KINESIS vs KAFKA ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   KAFKA:                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Topic "orders"                                         │  │
│   │  ┌───────────────────────────────────────────────────┐  │  │
│   │  │ Partition 0: [A] [D] [G]                          │  │  │
│   │  │ Partition 1: [B] [E] [H]                          │  │  │
│   │  │ Partition 2: [C] [F] [I]                          │  │  │
│   │  └───────────────────────────────────────────────────┘  │  │
│   │           ↓                          ↓                  │  │
│   │  ┌─────────────────┐        ┌─────────────────┐         │  │
│   │  │Consumer Group A │        │Consumer Group B │         │  │
│   │  │C1→P0, C2→P1, C3→P2      │ C1→P0,P1,P2     │         │  │
│   │  └─────────────────┘        └─────────────────┘         │  │
│   │                                                         │  │
│   │  → Có Consumer Groups (native)                          │  │
│   │  → Trong 1 group: mỗi msg → 1 consumer                  │  │
│   │  → Nhiều groups: mỗi group nhận TẤT CẢ messages         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   KINESIS:                                                      │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Stream "orders"                                        │  │
│   │  ┌───────────────────────────────────────────────────┐  │  │
│   │  │ Shard 1: [A] [D] [G]                              │  │  │
│   │  │ Shard 2: [B] [E] [H]                              │  │  │
│   │  │ Shard 3: [C] [F] [I]                              │  │  │
│   │  └───────────────────────────────────────────────────┘  │  │
│   │           ↓                          ↓                  │  │
│   │  ┌─────────────────┐        ┌─────────────────┐         │  │
│   │  │KCL App A        │        │KCL App B        │         │  │
│   │  │(reads all shards)       │(reads all shards)│         │  │
│   │  └─────────────────┘        └─────────────────┘         │  │
│   │                                                         │  │
│   │  → KHÔNG có Consumer Groups (native)                    │  │
│   │  → Dùng Enhanced Fan-out hoặc KCL để làm tương tự       │  │
│   │  → Mỗi KCL app = tương đương 1 consumer group           │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Consumer Group - Giải thích chi tiết

```
┌─────────────────────────────────────────────────────────────────┐
│              KAFKA CONSUMER GROUP DETAIL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Topic "orders" với 3 partitions                               │
│                                                                 │
│   SCENARIO 1: 1 Consumer Group với 3 consumers                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Group "order-service"                                  │  │
│   │  ┌────────┐  ┌────────┐  ┌────────┐                     │  │
│   │  │  C1    │  │  C2    │  │  C3    │                     │  │
│   │  │  P0    │  │  P1    │  │  P2    │                     │  │
│   │  │ [A][D] │  │ [B][E] │  │ [C][F] │                     │  │
│   │  └────────┘  └────────┘  └────────┘                     │  │
│   │                                                         │  │
│   │  → Mỗi consumer nhận 1 phần messages (load balancing)   │  │
│   │  → GIỐNG SQS behavior trong 1 group!                    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   SCENARIO 2: 2 Consumer Groups                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Group "order-service"        Group "analytics"         │  │
│   │  ┌────────────────────┐      ┌────────────────────┐     │  │
│   │  │ C1(P0) C2(P1) C3(P2)│      │     C1(ALL)        │     │  │
│   │  └────────────────────┘      └────────────────────┘     │  │
│   │  Nhận: A,B,C,D,E,F            Nhận: A,B,C,D,E,F          │  │
│   │  (chia cho 3 consumers)       (1 consumer nhận all)      │  │
│   │                                                         │  │
│   │  → CẢ HAI groups đều nhận TẤT CẢ messages!              │  │
│   │  → Khác SQS: SQS chỉ có 1 "group"                       │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Kinesis tương đương Kafka Consumer Groups

```
┌─────────────────────────────────────────────────────────────────┐
│           KINESIS: EMULATING CONSUMER GROUPS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   OPTION 1: Multiple KCL Applications                           │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Stream "orders"                                        │  │
│   │         ↓                     ↓                         │  │
│   │  ┌─────────────────┐   ┌─────────────────┐              │  │
│   │  │KCL App A        │   │KCL App B        │              │  │
│   │  │"order-service"  │   │"analytics"      │              │  │
│   │  │DynamoDB Table A │   │DynamoDB Table B │              │  │
│   │  └─────────────────┘   └─────────────────┘              │  │
│   │                                                         │  │
│   │  → Mỗi KCL app có riêng checkpoint table                │  │
│   │  → Cả 2 apps đều đọc TẤT CẢ data                        │  │
│   │  → Giống Kafka 2 consumer groups!                       │  │
│   │  ⚠️ Shared throughput (2 MB/s per shard)               │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   OPTION 2: Enhanced Fan-out                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Stream "orders"                                        │  │
│   │         ↓ (push)          ↓ (push)                      │  │
│   │  ┌─────────────────┐   ┌─────────────────┐              │  │
│   │  │Consumer A       │   │Consumer B       │              │  │
│   │  │2 MB/s dedicated │   │2 MB/s dedicated │              │  │
│   │  └─────────────────┘   └─────────────────┘              │  │
│   │                                                         │  │
│   │  → Mỗi consumer nhận RIÊNG 2 MB/s                       │  │
│   │  → Up to 20 consumers per stream                        │  │
│   │  → Giống Kafka consumer groups hơn!                     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Bảng so sánh Kinesis vs Kafka

| Feature | **Kinesis** | **Kafka (MSK)** |
|---------|-------------|-----------------|
| **Managed** | ✅ Fully serverless | ⚠️ Semi-managed (broker management) |
| **Consumer Groups** | Via KCL apps / Enhanced Fan-out | ✅ Native |
| **Partitioning** | Shards (manual/on-demand) | Partitions |
| **Retention** | 1-365 days | Unlimited (disk-based) |
| **Throughput per shard/partition** | 1 MB/s write, 2 MB/s read | Depends on broker config |
| **Message Size** | 1 MB max | 1 MB default (configurable) |
| **Protocol** | AWS SDK / HTTP | Kafka Protocol |
| **Ecosystem** | AWS integrations | Kafka Connect, Schema Registry |
| **Cost Model** | Per shard hour + data | Per broker hour |
| **Scaling** | Shard split/merge | Add partitions |
| **Replay** | ✅ Via iterator | ✅ Via offset |
| **Ordering** | Per shard | Per partition |
| **Exactly-once** | ❌ At-least-once | ✅ Transactions |
| **Multi-Region** | ❌ Single region | ✅ MirrorMaker |

### 4.6 So sánh với SQS

| Feature | **Kinesis/Kafka** | **SQS** |
|---------|-------------------|---------|
| **Message sau xử lý** | VẪN CÒN | BỊ XÓA |
| **Replay** | ✅ Yes | ❌ No |
| **Consumer Groups** | ✅ Yes | ❌ No (1 "group" only) |
| **Ordering** | Per shard/partition | FIFO queues only |
| **Use case** | Event streaming, analytics | Task queue, job processing |
| **Scaling** | Provision shards | Unlimited |
| **Latency** | ~200ms | ~10ms |

### 4.7 Khi nào dùng gì?

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION TREE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Cần message replay?                                           │
│        │                                                        │
│   ┌────┴────┐                                                   │
│   ↓         ↓                                                   │
│  YES       NO                                                   │
│   │         │                                                   │
│   ↓         ↓                                                   │
│ Kinesis/   Cần real-time processing?                            │
│ Kafka          │                                                │
│           ┌────┴────┐                                           │
│           ↓         ↓                                           │
│          YES       NO                                           │
│           │         │                                           │
│           ↓         ↓                                           │
│       Kinesis     SQS                                           │
│       Streams  (simple queue)                                   │
│                                                                 │
│                                                                 │
│   Đang dùng Kafka on-prem? Cần Kafka ecosystem?                 │
│        │                                                        │
│   ┌────┴────┐                                                   │
│   ↓         ↓                                                   │
│  YES       NO                                                   │
│   │         │                                                   │
│   ↓         ↓                                                   │
│ Amazon    Kinesis                                               │
│  MSK      (AWS native, simpler)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| New AWS project, need streaming | **Kinesis** |
| Migrate from Kafka on-prem | **Amazon MSK** |
| Need Kafka Connect ecosystem | **Amazon MSK** |
| Simple task queue | **SQS** |
| Fan-out to multiple services | **SNS + SQS** |
| Real-time analytics | **Kinesis** |
| Need exactly-once semantics | **Kafka/MSK** |


---

## 5. Best Practices

### 5.1 Kinesis Data Streams

| Practice | Recommendation |
|----------|---------------|
| **Partition Key** | Use high-cardinality keys to avoid hot shards |
| **Shard Count** | Start with estimate, monitor CloudWatch |
| **Enhanced Fan-out** | Use when > 2-3 consumers or need low latency |
| **KPL** | Use for high-throughput producers (batching) |
| **KCL** | Use for processing with checkpointing |
| **Retention** | Increase if need replay capability |

### 5.2 Hot Shard Prevention

```
┌─────────────────────────────────────────────────────────────────┐
│                  AVOID HOT SHARDS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ❌ BAD: Low cardinality partition key                         │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  PartitionKey = "device-type"                           │  │
│   │  Values: "mobile", "web", "tablet" (only 3!)            │  │
│   │                                                         │  │
│   │  → 80% traffic might go to "mobile" shard               │  │
│   │  → Hot shard, throttling                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ✅ GOOD: High cardinality partition key                       │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  PartitionKey = "user-id" or "device-id"                │  │
│   │  Values: millions of unique values                      │  │
│   │                                                         │  │
│   │  → Even distribution across shards                      │  │
│   │  → Ordering maintained per user                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Firehose

| Practice | Recommendation |
|----------|---------------|
| **Buffer Size** | Larger = fewer files, better for analytics |
| **Buffer Interval** | Smaller = more real-time |
| **Compression** | Enable GZIP for cost savings |
| **Format** | Convert to Parquet for Athena queries |
| **Backup** | Enable source backup to S3 |

---

## 6. Common Exam Questions

### Q1: Kinesis Data Streams vs Firehose?
**A:** Streams = real-time, custom processing, replay. Firehose = near real-time, managed delivery to S3/Redshift, no replay.

### Q2: How many shards needed for 6 MB/s ingestion?
**A:** 6 shards (each shard = 1 MB/s write)

### Q3: Shard iterator expired error?
**A:** Consumer too slow, record moved past retention. Increase retention or speed up processing.

### Q4: Enhanced Fan-out vs Shared consumer?
**A:** Enhanced = dedicated 2 MB/s per consumer, push model, lower latency. Shared = 2 MB/s divided, pull model.

### Q5: Data retention default/max?
**A:** Default: 24 hours. Max: 365 days.

### Q6: Firehose minimum latency?
**A:** 60 seconds (buffer time minimum)

---

## Tài liệu tham khảo

- [Amazon Kinesis Data Streams Developer Guide](https://docs.aws.amazon.com/streams/latest/dev/)
- [Amazon Kinesis Data Firehose Developer Guide](https://docs.aws.amazon.com/firehose/latest/dev/)
- [Kinesis vs SQS Comparison](https://aws.amazon.com/kinesis/data-streams/faqs/)
