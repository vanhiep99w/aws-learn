# Amazon Aurora

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tại sao Aurora nhanh hơn RDS?](#tại-sao-aurora-nhanh-hơn-rds)
- [Aurora Storage Architecture](#aurora-storage-architecture)
- [Aurora Replicas](#aurora-replicas)
- [Aurora Endpoints](#aurora-endpoints)
- [Aurora Serverless](#aurora-serverless)
- [Aurora Global Database](#aurora-global-database)
- [Aurora Multi-Master](#aurora-multi-master)
- [Aurora Machine Learning](#aurora-machine-learning)
- [Backup và Recovery](#backup-và-recovery)
- [Aurora vs RDS](#aurora-vs-rds)
- [Pricing](#pricing)
- [Best Practices](#best-practices)
- [Exam Tips](#exam-tips)

---

## Tổng quan

**Amazon Aurora** là database engine của AWS, được thiết kế từ đầu cho cloud. Tương thích với **MySQL** và **PostgreSQL**.

### Key Features

| Feature | Giá trị |
|---------|---------|
| **Hiệu suất** | 5x MySQL, 3x PostgreSQL |
| **Storage** | Auto-scaling 10GB → 128TB |
| **Replicas** | Tối đa 15 Aurora Replicas |
| **Failover** | ~30 giây (nhanh hơn RDS) |
| **Durability** | 6 copies across 3 AZs |
| **Compatibility** | MySQL 5.7/8.0, PostgreSQL 10-16 |

---

## Tại sao Aurora nhanh hơn RDS?

Aurora nhanh hơn **không phải vì thay đổi MySQL/PostgreSQL engine**, mà vì **AWS thiết kế lại hoàn toàn tầng storage**.

### Kiến trúc truyền thống (RDS MySQL/PostgreSQL)

```
┌─────────────────────────────────────────────────────────────┐
│              MYSQL/POSTGRESQL TRUYỀN THỐNG                  │
│                                                             │
│   DB Engine ──▶ Write full pages (16KB) ──▶ EBS Primary    │
│                        │                                    │
│                        └──▶ Replicate 16KB ──▶ Standby EBS │
│                                                             │
│   ❌ Ghi toàn bộ page 16KB dù chỉ thay đổi 1 byte          │
│   ❌ Network I/O rất nặng                                   │
│   ❌ Replica lag cao (seconds)                              │
└─────────────────────────────────────────────────────────────┘
```

### Kiến trúc Aurora

```
┌─────────────────────────────────────────────────────────────┐
│                     AMAZON AURORA                           │
│                                                             │
│   DB Engine ──▶ Write only REDO LOG (~bytes)               │
│                        │                                    │
│                        ▼                                    │
│   ┌─────────────────────────────────────────────────┐      │
│   │      Aurora Distributed Storage (6 copies)      │      │
│   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│      │
│   │  │AZ-a │ │AZ-a │ │AZ-b │ │AZ-b │ │AZ-c │ │AZ-c ││      │
│   │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│      │
│   └─────────────────────────────────────────────────┘      │
│                                                             │
│   ✅ Chỉ gửi log records (~bytes) - Giảm 90%+ I/O         │
│   ✅ Storage nodes tự rebuild pages                         │
│   ✅ Quorum writes: Chỉ cần 4/6 nodes ACK = COMMIT         │
│   ✅ Replica lag ~10-20ms                                   │
└─────────────────────────────────────────────────────────────┘
```

### So sánh cụ thể

| Thao tác | RDS MySQL | Aurora |
|----------|-----------|--------|
| UPDATE 1 row (100 bytes) | Ghi page 16KB + replicate | Gửi log ~100 bytes |
| Network I/O | Nặng | Giảm 90%+ |
| Replica lag | Seconds | ~10-20ms |
| Failover | 1-2 phút | ~30 giây |

---

## Aurora Storage Architecture

### 6 Copies Across 3 AZs

Khi bạn ghi **1 record** vào Aurora, Aurora **TỰ ĐỘNG sao chép** record đó ra **6 bản**, lưu ở **3 Availability Zones** khác nhau.

> [!NOTE]
> Đây là ở tầng **STORAGE** (ổ đĩa), **MẶC ĐỊNH** và **TỰ ĐỘNG** - bạn KHÔNG cần config gì cả!

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA STORAGE LAYER (TỰ ĐỘNG)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Bạn có 1 Aurora Instance:                                                 │
│         │                                                                    │
│         ▼  INSERT INTO users VALUES ('John')                                │
│                                                                              │
│   Aurora tự động tạo 6 copies:                                              │
│   ┌───────────────────────────────────────────────────────────────┐         │
│   │   AZ-a              AZ-b              AZ-c                    │         │
│   │  ┌──────────┐      ┌──────────┐      ┌──────────┐            │         │
│   │  │Copy 1:   │      │Copy 3:   │      │Copy 5:   │            │         │
│   │  │ John     │      │ John     │      │ John     │            │         │
│   │  ├──────────┤      ├──────────┤      ├──────────┤            │         │
│   │  │Copy 2:   │      │Copy 4:   │      │Copy 6:   │            │         │
│   │  │ John     │      │ John     │      │ John     │            │         │
│   │  └──────────┘      └──────────┘      └──────────┘            │         │
│   │   2 copies          2 copies          2 copies   = 6 total   │         │
│   └───────────────────────────────────────────────────────────────┘         │
│                                                                              │
│   ✅ MẶC ĐỊNH - Bạn không cần làm gì                                       │
│   ✅ Mục đích: Data durability (không bao giờ mất data)                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tại sao cần 6 copies?

**Để đảm bảo data KHÔNG BAO GIỜ mất!**

```
Scenario 1: Mất 1 ổ đĩa
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Copy 1  │   │ Copy 3  │   │ Copy 5  │
│ Copy 2❌│   │ Copy 4  │   │ Copy 6  │
└─────────┘   └─────────┘   └─────────┘
→ Còn 5 copies → VẪN AN TOÀN ✅

Scenario 2: Mất cả 1 AZ (động đất, mất điện)
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Copy 1❌│   │ Copy 3  │   │ Copy 5  │
│ Copy 2❌│   │ Copy 4  │   │ Copy 6  │
└─────────┘   └─────────┘   └─────────┘
   AZ-a DOWN!
→ Còn 4 copies ở AZ-b và AZ-c → VẪN AN TOÀN ✅
```

### Quorum: 4/6 để ghi, 3/6 để đọc

**Vấn đề**: Nếu phải đợi cả 6 copies ghi xong thì rất chậm, và nếu 1 ổ hỏng thì bị treo!

**Giải pháp**: Chỉ cần **ĐA SỐ** đồng ý là được (Quorum)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUORUM WRITES (4/6)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INSERT INTO users VALUES ('John')                                         │
│                                                                              │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                                │
│   │ ✅ │ │ ✅ │ │ ✅ │ │ ✅ │ │ ⏳ │ │ ⏳ │                                │
│   └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                                │
│     1      2      3      4      5      6                                    │
│     └────────────────────────┘                                              │
│           4 copies OK                                                        │
│           → Trả SUCCESS ngay!                                               │
│           → Copy 5, 6 sẽ sync sau (background)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao 4/6 và 3/6?**

```
Write Quorum (W) + Read Quorum (R) > Tổng copies (N)
      4         +        3         >      6
                 7 > 6 ✅

→ Đảm bảo READ luôn đọc được data MỚI NHẤT!
```

### Aurora biết data nào mới nhất bằng LSN

**LSN (Log Sequence Number)** = Số thứ tự phiên bản (như version number)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LSN - CÁCH AURORA BIẾT DATA NÀO MỚI                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Sau UPDATE balance = 1000:                                                │
│   • 4 copies đã cập nhật (LSN = 101)                                        │
│   • 2 copies chưa sync (LSN = 100)                                          │
│                                                                              │
│   Khi READ (lấy 3 copies bất kỳ):                                           │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│   │ Copy A           │  │ Copy B           │  │ Copy C           │          │
│   │ balance = 1000   │  │ balance = 500    │  │ balance = 500    │          │
│   │ LSN = 101    ✅  │  │ LSN = 100    ❌  │  │ LSN = 100    ❌  │          │
│   │ (MỚI)            │  │ (CŨ)             │  │ (CŨ)             │          │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│            │                   │                    │                       │
│            └───────────────────┴────────────────────┘                       │
│                                │                                            │
│                         Aurora so sánh:                                      │
│                         MAX(101, 100, 100) = 101                            │
│                                │                                            │
│                         → Lấy data từ LSN=101                               │
│                         → balance = 1000 (ĐÚNG!) ✅                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Tóm tắt:**
> - **6 copies** = Data cực kỳ an toàn
> - **4/6 write** = Nhanh, không đợi tất cả
> - **3/6 read** = Luôn đọc được data mới nhất (nhờ LSN)

### Storage Auto-Scaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STORAGE AUTO-SCALING                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Bắt đầu: 10 GB                                                            │
│   ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│                                                                              │
│   Data tăng → Storage TỰ ĐỘNG tăng (10GB increments)                        │
│   ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│                                                                              │
│   Tối đa: 128 TB                                                            │
│   ████████████████████████████████████████████████████████████████████████  │
│                                                                              │
│   ✅ Không cần provision trước                                              │
│   ✅ Chỉ trả tiền cho storage đang dùng                                     │
│   ✅ Không downtime khi scaling                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Aurora Replicas

### So sánh với RDS Read Replicas

| Đặc điểm | RDS Read Replica | Aurora Replica |
|----------|------------------|----------------|
| **Số lượng tối đa** | 5 | **15** |
| **Replication** | Async (lag seconds) | **Sync** (lag ~10-20ms) |
| **Storage** | Riêng biệt | **Shared** (cùng storage layer) |
| **Failover tự động** | ❌ Manual promote | ✅ Tự động |
| **Reader Endpoint** | ❌ Không có | ✅ Có sẵn |

### Aurora Replica Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA REPLICAS                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│   │ WRITER  │     │REPLICA 1│     │REPLICA 2│     │REPLICA 3│              │
│   │ (RW)    │     │  (RO)   │     │  (RO)   │     │  (RO)   │              │
│   └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘              │
│        │               │               │               │                    │
│        └───────────────┴───────────────┴───────────────┘                    │
│                               │                                              │
│                    ┌──────────▼──────────┐                                  │
│                    │   SHARED STORAGE    │                                  │
│                    │   (6 copies/3 AZs)  │                                  │
│                    └─────────────────────┘                                  │
│                                                                              │
│   ✅ Tất cả đọc từ CÙNG storage layer                                       │
│   ✅ Không cần replicate data giữa instances                                │
│   ✅ Lag chỉ ~10-20ms (chờ cache invalidation)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Replica Auto Scaling

```yaml
# Aurora Replica Auto Scaling
Target: CPU Utilization hoặc Connections
Min Replicas: 1
Max Replicas: 15

# Ví dụ: Scale khi CPU > 70%
ScalingPolicy:
  MetricType: RDSReaderAverageCPUUtilization
  TargetValue: 70
```

---

## Aurora Endpoints

Aurora có **4 loại endpoints**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA ENDPOINTS                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CLUSTER ENDPOINT (Writer)                                               │
│     mydb.cluster-xxx.region.rds.amazonaws.com                               │
│     → Luôn trỏ đến Writer instance                                          │
│     → Dùng cho: INSERT, UPDATE, DELETE                                      │
│                                                                              │
│  2. READER ENDPOINT                                                          │
│     mydb.cluster-ro-xxx.region.rds.amazonaws.com                            │
│     → Load balance giữa TẤT CẢ Aurora Replicas                              │
│     → Dùng cho: SELECT (general reads)                                      │
│                                                                              │
│  3. CUSTOM ENDPOINTS                                                         │
│     mydb-analytics.cluster-custom-xxx.region.rds.amazonaws.com              │
│     → Bạn tự định nghĩa subset of instances                                 │
│     → Dùng cho: Workload-specific routing                                   │
│                                                                              │
│  4. INSTANCE ENDPOINTS                                                       │
│     mydb-instance-1.xxx.region.rds.amazonaws.com                            │
│     → Trỏ trực tiếp đến 1 instance cụ thể                                   │
│     → Dùng cho: Debugging, testing                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Custom Endpoints Use Case

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOM ENDPOINTS                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Scenario: Có 2 loại workload khác nhau                                    │
│                                                                              │
│   OLTP Workload (nhẹ, nhanh):                                               │
│   ┌─────────────────────────────────────────────────┐                       │
│   │  Custom Endpoint: oltp.cluster-custom-xxx       │                       │
│   │  → Replica 1 (r5.large)                         │                       │
│   │  → Replica 2 (r5.large)                         │                       │
│   └─────────────────────────────────────────────────┘                       │
│                                                                              │
│   Analytics Workload (nặng, lâu):                                           │
│   ┌─────────────────────────────────────────────────┐                       │
│   │  Custom Endpoint: analytics.cluster-custom-xxx  │                       │
│   │  → Replica 3 (r5.4xlarge) ← Instance lớn hơn   │                       │
│   │  → Replica 4 (r5.4xlarge)                       │                       │
│   └─────────────────────────────────────────────────┘                       │
│                                                                              │
│   → Analytics queries KHÔNG ảnh hưởng OLTP performance!                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Aurora Serverless

### Aurora Serverless v1 vs v2

| Feature | Serverless v1 | Serverless v2 |
|---------|---------------|---------------|
| **Scaling** | Pause/Resume (có gap) | **Continuous** (smooth) |
| **Min capacity** | 0 ACUs (pause) | 0.5 ACUs |
| **Max capacity** | 256 ACUs | 128 ACUs |
| **Scale time** | 30 giây - vài phút | **Giây** |
| **Read replicas** | ❌ | ✅ |
| **Global Database** | ❌ | ✅ |

### ACU (Aurora Capacity Units)

```
1 ACU ≈ 2 GB RAM + proportional CPU + networking

Ví dụ pricing (us-east-1):
- Aurora MySQL Serverless v2: $0.12/ACU-hour
- 8 ACUs chạy 24/7: 8 × $0.12 × 24 × 30 = $691.20/tháng
```

### Serverless v2 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA SERVERLESS V2                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Traffic thấp:                                                             │
│   ┌─────┐                                                                   │
│   │ 0.5 │ ACUs                                                              │
│   │ ACU │                                                                   │
│   └─────┘                                                                   │
│                                                                              │
│   Traffic tăng → Scale NGAY LẬP TỨC (giây):                                │
│   ┌─────┐┌─────┐┌─────┐┌─────┐                                             │
│   │     ││     ││     ││     │                                             │
│   │     ││     ││     ││     │  8 ACUs                                      │
│   │     ││     ││     ││     │                                             │
│   └─────┘└─────┘└─────┘└─────┘                                             │
│                                                                              │
│   Traffic giảm → Scale down (smooth):                                       │
│   ┌─────┐┌─────┐                                                            │
│   │     ││     │  2 ACUs                                                    │
│   └─────┘└─────┘                                                            │
│                                                                              │
│   ✅ Pay per use (không cần chọn instance size)                             │
│   ✅ No cold starts như v1                                                  │
│   ✅ Mixed với Provisioned instances trong cùng cluster                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Use Cases

| Use Case | Chọn gì? |
|----------|----------|
| Unpredictable workloads | Serverless v2 |
| Dev/Test environments | Serverless v2 |
| Variable traffic (spiky) | Serverless v2 |
| Consistent high traffic | Provisioned |
| Cost optimization cần pause | Serverless v1 (0 ACUs) |

---

## Aurora Global Database

### Cross-Region Replication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA GLOBAL DATABASE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PRIMARY REGION (us-east-1)           SECONDARY REGION (eu-west-1)         │
│   ┌─────────────────────────┐         ┌─────────────────────────┐           │
│   │  ┌────────┐ ┌────────┐  │         │  ┌────────┐ ┌────────┐  │           │
│   │  │ Writer │ │Replica │  │   ───►  │  │Replica │ │Replica │  │           │
│   │  └────────┘ └────────┘  │ <1 giây │  └────────┘ └────────┘  │           │
│   │         │               │         │         │               │           │
│   │  ┌──────▼──────────┐    │         │  ┌──────▼──────────┐    │           │
│   │  │ Storage Layer   │    │  ────►  │  │ Storage Layer   │    │           │
│   │  └─────────────────┘    │         │  └─────────────────┘    │           │
│   └─────────────────────────┘         └─────────────────────────┘           │
│                                                                              │
│   Replication lag: < 1 giây (typically ~100ms)                              │
│   Failover to secondary: < 1 phút                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Value |
|---------|-------|
| **Replication lag** | < 1 giây (typically ~100ms) |
| **Secondary regions** | Tối đa 5 |
| **Replicas per region** | Tối đa 16 |
| **Cross-region failover** | < 1 phút (manual hoặc planned) |
| **Write forwarding** | Secondary có thể forward writes về Primary |

### Use Cases

1. **Disaster Recovery**: Failover sang region khác khi primary region down
2. **Low-latency reads**: Users ở EU đọc từ EU region
3. **Data locality**: Compliance requirements (GDPR)

---

## Aurora Multi-Master

> ⚠️ **Deprecated**: Aurora Multi-Master đã bị deprecated. Thay thế bằng **Aurora Serverless v2** hoặc **Aurora Global Database**.

```
Trước đây:
┌────────┐  ┌────────┐  ┌────────┐
│ Master │  │ Master │  │ Master │  ← Tất cả đều ghi được
└────────┘  └────────┘  └────────┘

Hiện tại: KHÔNG còn support Multi-Master
→ Dùng Aurora Global Database với Write Forwarding nếu cần multi-region writes
```

---

## Aurora Machine Learning

Aurora có thể gọi **AWS ML services** trực tiếp từ SQL:

```sql
-- Gọi Amazon Comprehend để phân tích sentiment
SELECT 
    review_text,
    aws_comprehend_detect_sentiment(review_text, 'en') AS sentiment
FROM product_reviews;

-- Gọi Amazon SageMaker endpoint
SELECT 
    customer_id,
    aws_sagemaker_invoke_endpoint('churn-predictor', features) AS churn_probability
FROM customers;
```

### Supported Services

| Service | Function |
|---------|----------|
| **Amazon Comprehend** | Sentiment analysis, entity detection |
| **Amazon SageMaker** | Custom ML models |

---

## Backup và Recovery

### Automated Backups

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA BACKUP                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CONTINUOUS BACKUP to S3 (tự động)                                         │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │ Aurora Storage ──► S3 (continuous, incremental)                  │     │
│   │                                                                   │     │
│   │ Retention: 1-35 days                                             │     │
│   │ Point-in-Time Recovery: Bất kỳ giây nào trong retention window   │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│   ✅ Không ảnh hưởng performance                                           │
│   ✅ Không cần maintenance window                                          │
│   ✅ Backup storage FREE (up to 100% of DB size)                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backtrack (Aurora MySQL only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA BACKTRACK                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Scenario: Accidentally DELETE important data                              │
│                                                                              │
│   Timeline:                                                                  │
│   ────●────────●────────●────────●────────●────────●────                   │
│       │        │        │        │        │        │                        │
│     10:00    10:15    10:30    10:45    11:00    Now                       │
│                         │                                                   │
│                     DELETE!                                                 │
│                                                                              │
│   Traditional restore: Cần restore từ snapshot → 30+ phút                   │
│   Backtrack: "Rewind" database về 10:29 → GIÂY!                            │
│                                                                              │
│   ✅ Không cần restore                                                      │
│   ✅ In-place recovery                                                      │
│   ✅ Window: up to 72 hours                                                 │
│   ❌ Chỉ Aurora MySQL                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Clone

```
Original cluster                    Clone (copy-on-write)
┌─────────────────┐                ┌─────────────────┐
│                 │                │                 │
│   100 TB data   │   Clone →     │   0 TB initial  │
│                 │   (seconds)    │   (share data)  │
└─────────────────┘                └─────────────────┘
         │                                  │
         └──────────► Shared storage ◄──────┘
                      (copy-on-write)

✅ Clone terabytes trong giây
✅ Không tốn thêm storage ban đầu
✅ Chỉ tốn storage khi có changes
```

---

## Aurora vs RDS

| Tiêu chí | RDS MySQL/PostgreSQL | Aurora |
|----------|----------------------|--------|
| **Performance** | Baseline | **5x MySQL, 3x PostgreSQL** |
| **Storage** | EBS (provision) | **Auto-scaling 10GB-128TB** |
| **Replication** | Async | **Sync** (~10-20ms lag) |
| **Max Replicas** | 5 | **15** |
| **Failover** | 1-2 phút | **~30 giây** |
| **Reader Endpoint** | ❌ | ✅ |
| **Backtrack** | ❌ | ✅ (MySQL only) |
| **Clone** | ❌ | ✅ (seconds) |
| **Serverless** | ❌ | ✅ v1 và v2 |
| **Global Database** | ❌ | ✅ |
| **Giá** | Thấp hơn | **~20% cao hơn** |

### Khi nào chọn gì?

| Scenario | Chọn |
|----------|------|
| Budget constrained, performance đủ dùng | **RDS** |
| Need high performance, low latency | **Aurora** |
| Cross-region DR | **Aurora Global Database** |
| Unpredictable workloads | **Aurora Serverless v2** |
| Simple apps, predictable load | **RDS** |

---

## Pricing

### Components

| Component | Pricing (us-east-1) |
|-----------|---------------------|
| **Instance** | $0.073/hr (db.r6g.large) |
| **Storage** | $0.10/GB-month |
| **I/O** | $0.20 per 1 million requests |
| **Backup** | Free up to DB size |

### Aurora I/O-Optimized

```
Standard:
- Storage: $0.10/GB-month
- I/O: $0.20/million requests

I/O-Optimized:
- Storage: $0.225/GB-month (cao hơn)
- I/O: $0 (included!)

→ Chọn I/O-Optimized khi I/O > 25% total Aurora cost
```

---

## Best Practices

1. **Dùng Reader Endpoint** cho tất cả reads (Amazon tự động load balance)

2. **Custom Endpoints** để tách biệt OLTP và Analytics workloads

3. **Aurora Serverless v2** cho dev/test để tối ưu cost

4. **Enable Backtrack** (MySQL) để recover từ human errors nhanh

5. **Clone** thay vì snapshot để test với production data

6. **Global Database** cho multi-region DR và low-latency reads

7. **Performance Insights** để monitor và tune queries

---

## Exam Tips

1. **Aurora nhanh hơn** vì log-based replication, shared storage layer

2. **Failover ~30 giây** (nhanh hơn RDS 1-2 phút)

3. **Reader Endpoint có sẵn** (RDS Read Replicas không có)

4. **15 replicas** (RDS chỉ có 5)

5. **Backtrack** = "rewind" database (chỉ MySQL)

6. **Clone** = copy terabytes trong seconds

7. **Serverless v2** = continuous scaling (v1 có cold start)

8. **Global Database** = cross-region < 1 giây lag

9. **Storage auto-scaling** 10GB → 128TB (RDS phải provision)

10. **6 copies across 3 AZs** = high durability
