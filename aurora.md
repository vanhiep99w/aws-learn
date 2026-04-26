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
│   DB Engine ──▶ Write full pages (16KB) ──▶ EBS Primary     │
│                        │                                    │
│                        └──▶ Replicate 16KB ──▶ Standby EBS  │
│                                                             │
│   ❌ Ghi toàn bộ page 16KB dù chỉ thay đổi 1 byte           │
│   ❌ Network I/O rất nặng                                   │
│   ❌ Replica lag cao (seconds)                              │
└─────────────────────────────────────────────────────────────┘
```

### Kiến trúc Aurora

```
┌─────────────────────────────────────────────────────────────┐
│                     AMAZON AURORA                           │
│                                                             │
│   DB Engine ──▶ Write only REDO LOG (~bytes)                │
│                        │                                    │
│                        ▼                                    │
│   ┌─────────────────────────────────────────────────┐       │
│   │      Aurora Distributed Storage (6 copies)      │       │
│   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │      │
│   │  │AZ-a │ │AZ-a │ │AZ-b │ │AZ-b │ │AZ-c │ │AZ-c │ │      │
│   │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │      │
│   └─────────────────────────────────────────────────┘       │
│                                                             │
│   ✅ Chỉ gửi log records (~bytes) - Giảm 90%+ I/O           │
│   ✅ Storage nodes tự rebuild pages                         │
│   ✅ Quorum writes: Chỉ cần 4/6 nodes ACK = COMMIT          │
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

### 6 Copies Across 3 AZs (Cluster Volume)

Khi bạn ghi **1 record** vào Aurora, Aurora **TỰ ĐỘNG sao chép** record đó ra **6 bản**, lưu ở **3 Availability Zones** khác nhau.

> [!NOTE]
> **Cluster Volume** là tên chính thức của AWS cho storage layer này. Các tên khác: Shared Storage, Aurora Storage, Distributed Storage - đều là cùng 1 thứ!

> [!NOTE]
> Đây là ở tầng **STORAGE** (ổ đĩa), **MẶC ĐỊNH** và **TỰ ĐỘNG** - bạn KHÔNG cần config gì cả!

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA STORAGE LAYER (TỰ ĐỘNG)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Bạn có 1 Aurora Instance:                                                 │
│        │                                                                    │
│         ▼  INSERT INTO users VALUES ('John')                                │
│                                                                             │
│   Aurora tự động tạo 6 copies:                                              │
│   ┌───────────────────────────────────────────────────────────────┐         │
│   │   AZ-a              AZ-b              AZ-c                    │         │
│   │  ┌──────────┐      ┌──────────┐      ┌──────────┐             │         │
│   │  │Copy 1:   │      │Copy 3:   │      │Copy 5:   │             │         │
│   │  │ John     │      │ John     │      │ John     │             │         │
│   │  ├──────────┤      ├──────────┤      ├──────────┤             │         │
│   │  │Copy 2:   │      │Copy 4:   │      │Copy 6:   │             │         │
│   │  │ John     │      │ John     │      │ John     │             │         │
│   │  └──────────┘      └──────────┘      └──────────┘             │         │
│   │   2 copies          2 copies          2 copies   = 6 total    │         │
│   └───────────────────────────────────────────────────────────────┘         │
│                                                                             │
│   ✅ MẶC ĐỊNH - Bạn không cần làm gì                                        │
│   ✅ Mục đích: Data durability (không bao giờ mất data)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tại sao cần 6 copies? (Không phải 3?)

> [!IMPORTANT]
> **6 copies là MẶC ĐỊNH**, luôn luôn, không đổi được! Dù bạn có 1 Primary hay 15 Replicas → storage vẫn là 6 copies. Bạn CHỈ TRẢ TIỀN 1 LẦN (không x6).

**Nếu chỉ có 3 copies (1 per AZ):**

```
┌─────────┐   ┌─────────┐   ┌─────────┐
│  AZ-a   │   │  AZ-b   │   │  AZ-c   │
│ Copy 1  │   │ Copy 2  │   │ Copy 3  │
└─────────┘   └─────────┘   └─────────┘
     │
     ▼ Mất 1 AZ = còn 2 copies
     ▼ Mất thêm 1 disk = còn 1 copy = NGUY HIỂM! ⚠️
```

**Với 6 copies (2 per AZ):**

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
→ Còn 4 copies → VẪN GHI ĐƯỢC (cần 4/6) ✅

Scenario 3: Mất 1 AZ + 1 disk
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Copy 1❌│   │ Copy 3  │   │ Copy 5❌│
│ Copy 2❌│   │ Copy 4  │   │ Copy 6  │
└─────────┘   └─────────┘   └─────────┘
→ Còn 3 copies → VẪN ĐỌC ĐƯỢC (cần 3/6) ✅
```

### Tác dụng của 6 copies

| Tác dụng | Chi tiết |
|----------|----------|
| 🛡️ **Durability** | Mất 3 copies vẫn an toàn (11 nines: 99.999999999%) |
| ⚡ **Write Performance** | Chỉ cần 4/6 ACK = không đợi slow disks |
| 📖 **Read Performance** | Đọc từ copy nào gần/nhanh nhất |
| 🔧 **Self-healing** | AWS tự động rebuild copy bị hỏng |
| 🌍 **AZ Failure Tolerance** | Mất cả 1 AZ (2 copies) vẫn hoạt động bình thường |

### Quorum: 4/6 để ghi, 3/6 để đọc

**Vấn đề**: Nếu phải đợi cả 6 copies ghi xong thì rất chậm, và nếu 1 ổ hỏng thì bị treo!

**Giải pháp**: Chỉ cần **ĐA SỐ** đồng ý là được (Quorum)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUORUM WRITES (4/6)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   INSERT INTO users VALUES ('John')                                         │
│                                                                             │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                                 │
│   │ ✅ │ │ ✅ │ │ ✅ │ │ ✅ │ │ ⏳ │ │ ⏳ │                                 │
│   └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                                 │
│     1      2      3      4      5      6                                    │
│     └────────────────────────┘                                              │
│           4 copies OK                                                       │
│           → Trả SUCCESS ngay!                                               │
│           → Copy 5, 6 sẽ sync sau (background)                              │
│                                                                             │
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
│                    LSN - CÁCH AURORA BIẾT DATA NÀO MỚI                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Sau UPDATE balance = 1000:                                                │
│   • 4 copies đã cập nhật (LSN = 101)                                        │
│   • 2 copies chưa sync (LSN = 100)                                          │
│                                                                             │
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
│                         Aurora so sánh:                                     │
│                         MAX(101, 100, 100) = 101                            │
│                                │                                            │
│                         → Lấy data từ LSN=101                               │
│                         → balance = 1000 (ĐÚNG!) ✅                         │
│                                                                             │
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
│                    STORAGE AUTO-SCALING                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Bắt đầu: 10 GB                                                            │
│   ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             │
│                                                                             │
│   Data tăng → Storage TỰ ĐỘNG tăng (10GB increments)                        │
│   ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             │
│                                                                             │
│   Tối đa: 128 TB                                                            │
│   ████████████████████████████████████████████████████████████████████████  │
│                                                                             │
│   ✅ Không cần provision trước                                              │
│   ✅ Chỉ trả tiền cho storage đang dùng                                     │
│   ✅ Không downtime khi scaling                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Aurora Replicas

### So sánh với RDS Read Replicas

| Đặc điểm | RDS Read Replica | Aurora Replica |
|----------|------------------|----------------|
| **Số lượng tối đa** | 5 | **15** |
| **Replication** | Async physical/binlog theo DB engine | **Async log consumption ở reader**; storage layer sync/quorum |
| **Storage** | Riêng biệt cho từng replica | **Shared cluster volume** (cùng storage layer) |
| **Lag** | Có thể giây → phút khi replica không theo kịp | Thường rất thấp, AWS ghi nhận thường **≤100ms** |
| **Failover tự động** | ❌ Manual promote | ✅ Tự động promote Aurora Replica |
| **Reader Endpoint** | ❌ Không có | ✅ Có sẵn |

### Aurora Replica Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA REPLICAS                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│   │ WRITER  │     │REPLICA 1│     │REPLICA 2│     │REPLICA 3│               │
│   │ (RW)    │     │  (RO)   │     │  (RO)   │     │  (RO)   │               │
│   └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘               │
│        │               │               │               │                    │
│        └───────────────┴───────────────┴───────────────┘                    │
│                              │                                              │
│                    ┌──────────▼──────────┐                                  │
│                    │   SHARED STORAGE    │                                  │
│                    │   (6 copies/3 AZs)  │                                  │
│                    └─────────────────────┘                                  │
│                                                                             │
│   ✅ Tất cả dùng CÙNG cluster volume                                        │
│   ✅ Không copy data file riêng cho từng replica                            │
│   ✅ Reader nhận log stream async để cập nhật buffer cache/trạng thái       │
│   ✅ Replica lag thường rất thấp (AWS: thường ≤100ms)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Aurora Replica lag: vì sao shared storage vẫn có async?

Aurora Replicas **không copy data file riêng** như RDS Read Replica truyền thống. Tất cả DB instances dùng chung **cluster volume**. Tuy nhiên mỗi reader vẫn có **CPU/RAM/buffer cache/query engine riêng**, nên reader cần consume **log stream** từ writer để cập nhật các page đang nằm trong cache của reader.

- **Storage replication = synchronous/quorum**: Aurora cluster volume replicate dữ liệu across storage nodes/AZs để đảm bảo durability.
- **Aurora Replica = asynchronous log consumption**: writer commit độc lập với việc reader đã apply xong log vào cache/trạng thái đọc hay chưa.
- Vì vậy Aurora Replica có thể có **replica lag**, nhưng thường rất thấp; AWS Prescriptive Guidance ghi nhận thường **100ms hoặc ít hơn**.
- Nếu cần **read-after-write consistency** tuyệt đối, đọc lại từ **cluster/writer endpoint**; reader endpoint phù hợp cho read chấp nhận stale ngắn.

**Các nguyên nhân làm Aurora Replica lag tăng:** write spike, reader instance yếu hơn writer, query/report nặng trên reader, quá nhiều connections, hoặc thay đổi schema/DDL lớn.

**Nguồn AWS chính thức:**

- [Amazon Aurora DB clusters](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.html)
- [Aurora Replicas](https://docs.aws.amazon.com/prescriptive-guidance/latest/aurora-replication-options/aurora-replicas.html)
- [Amazon CloudWatch metrics for Amazon Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraMonitoring.Metrics.html)

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
│                    AURORA ENDPOINTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CLUSTER ENDPOINT (Writer)                                               │
│     mydb.cluster-xxx.region.rds.amazonaws.com                               │
│     → Luôn trỏ đến Writer instance                                          │
│     → Dùng cho: INSERT, UPDATE, DELETE                                      │
│                                                                             │
│  2. READER ENDPOINT                                                         │
│     mydb.cluster-ro-xxx.region.rds.amazonaws.com                            │
│     → Load balance giữa TẤT CẢ Aurora Replicas                              │
│     → Dùng cho: SELECT (general reads)                                      │
│     → Nếu không có Replica, trỏ về Primary                                  │
│                                                                             │
│  3. CUSTOM ENDPOINTS                                                        │
│     mydb-analytics.cluster-custom-xxx.region.rds.amazonaws.com              │
│     → Bạn tự định nghĩa subset of instances                                 │
│     → Dùng cho: Workload-specific routing                                   │
│     → Tối đa: 5 custom endpoints per cluster                                │
│                                                                             │
│  4. INSTANCE ENDPOINTS                                                      │
│     mydb-instance-1.xxx.region.rds.amazonaws.com                            │
│     → Trỏ trực tiếp đến 1 instance cụ thể                                   │
│     → Dùng cho: Debugging, testing                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Số lượng Endpoints

| Loại Endpoint | Số lượng | Tự động/Manual |
|---------------|----------|----------------|
| **Cluster (Writer)** | 1 | Tự động tạo |
| **Reader** | 1 | Tự động tạo |
| **Instance** | = số instances | Tự động tạo |
| **Custom** | Tối đa **5** | Bạn tự tạo |

**Ví dụ: 1 Primary + 2 Replicas**

```
┌────────────────────────────────────────────────────────────────────────┐
│    1 Primary + 2 Replicas = 5 Endpoints mặc định                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐                     │
│   │ PRIMARY  │      │REPLICA 1 │      │REPLICA 2 │                     │
│   └──────────┘      └──────────┘      └──────────┘                     │
│        ▲                 ▲                 ▲                           │
│        │                 │                 │                           │
│   Instance EP-1     Instance EP-2     Instance EP-3                    │
│        │                 │                 │                           │
│        │                 └────────┬────────┘                           │
│        │                          │                                    │
│   Cluster EP               Reader EP                                   │
│   (→ Primary)         (load balance → Replica 1 & 2)                   │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│   Mặc định: 1 + 1 + 3 = 5 endpoints                                    │
│   + Custom: Tối đa 5 (tùy bạn tạo)                                     │
│   = Tối đa 10 endpoints                                                │
└────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Endpoints hoàn toàn MIỄN PHÍ!** Bạn chỉ trả tiền cho Instances, Storage và I/O. Endpoints chỉ là DNS routing - AWS không charge.

### Custom Endpoints Use Case

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOM ENDPOINTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Scenario: Có 2 loại workload khác nhau                                    │
│                                                                             │
│   OLTP Workload (nhẹ, nhanh):                                               │
│   ┌─────────────────────────────────────────────────┐                       │
│   │  Custom Endpoint: oltp.cluster-custom-xxx       │                       │
│   │  → Replica 1 (r5.large)                         │                       │
│   │  → Replica 2 (r5.large)                         │                       │
│   └─────────────────────────────────────────────────┘                       │
│                                                                             │
│   Analytics Workload (nặng, lâu):                                           │
│   ┌─────────────────────────────────────────────────┐                       │
│   │  Custom Endpoint: analytics.cluster-custom-xxx  │                       │
│   │  → Replica 3 (r5.4xlarge) ← Instance lớn hơn    │                       │
│   │  → Replica 4 (r5.4xlarge)                       │                       │
│   └─────────────────────────────────────────────────┘                       │
│                                                                             │
│   → Analytics queries KHÔNG ảnh hưởng OLTP performance!                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Aurora Serverless

> [!IMPORTANT]
> **Serverless scale RESOURCE (CPU/RAM) của instance**, KHÔNG phải số lượng instances! Đây khác với Replica Auto Scaling (thêm/bớt replicas).

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

### Serverless Scaling - Dựa vào đâu?

Aurora Serverless v2 **tự động** monitor và scale dựa trên:

| Metric | Mô tả |
|--------|-------|
| **CPU Utilization** | % CPU đang sử dụng |
| **Memory Pressure** | RAM cần thiết cho workload |
| **Active Connections** | Số connections đang hoạt động |
| **Buffer Pool Usage** | Bộ nhớ đệm cho queries |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVERLESS AUTO SCALING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Bạn config:  Min ACUs: 0.5  │  Max ACUs: 32                               │
│                                                                             │
│   Aurora tự động:                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │   CPU ↑ cao   ──────►  Thêm ACUs (trong giây)                     │     │
│   │   Memory ↑    ──────►  Thêm ACUs                                  │     │
│   │   Connections ↑ ────►  Thêm ACUs                                  │     │
│   │                                                                   │     │
│   │   CPU ↓ thấp  ──────►  Giảm ACUs (từ từ, tránh flapping)          │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│   ✅ Scale UP: Rất nhanh (giây)                                             │
│   ✅ Scale DOWN: Chậm hơn (tránh scale lên xuống liên tục)                  │
│   ✅ Số instances KHÔNG ĐỔI - chỉ thay đổi resources!                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### So sánh: Serverless vs Replica Auto Scaling

| | Serverless (ACU Scaling) | Replica Auto Scaling |
|--|--------------------------|---------------------|
| **Scale gì?** | Resources (CPU/RAM) của instance | Số lượng replicas |
| **Dựa vào** | CPU, Memory, Connections (tự động) | Bạn config: CPU target hoặc Connections |
| **Hướng** | Vertical (instance mạnh hơn) | Horizontal (thêm instances) |

### Serverless v2 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA SERVERLESS V2                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Traffic thấp:                                                             │
│   ┌─────┐                                                                   │
│   │ 0.5 │ ACUs                                                              │
│   │ ACU │                                                                   │
│   └─────┘                                                                   │
│                                                                             │
│   Traffic tăng → Scale NGAY LẬP TỨC (giây):                                 │
│   ┌─────┐┌─────┐┌─────┐┌─────┐                                              │
│   │     ││     ││     ││     │                                              │
│   │     ││     ││     ││     │  8 ACUs                                      │
│   │     ││     ││     ││     │                                              │
│   └─────┘└─────┘└─────┘└─────┘                                              │
│                                                                             │
│   Traffic giảm → Scale down (smooth):                                       │
│   ┌─────┐┌─────┐                                                            │
│   │     ││     │  2 ACUs                                                    │
│   └─────┘└─────┘                                                            │
│                                                                             │
│   ✅ Pay per use (không cần chọn instance size)                             │
│   ✅ No cold starts như v1                                                  │
│   ✅ Mixed với Provisioned instances trong cùng cluster                     │
│                                                                             │
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

### Aurora Global Database là gì?

**Aurora Global Database** là mô hình triển khai Aurora trên nhiều AWS Region:

- 1 **primary Region** (đọc/ghi chính)
- Tối đa **10 secondary Regions** (read-only)
- Dữ liệu từ primary được replicate sang secondary qua hạ tầng chuyên dụng của Aurora, độ trễ replication thường **dưới 1 giây**

Mục tiêu chính:

1. **Global reads với local latency** (người dùng ở EU đọc từ EU, APAC đọc từ APAC)
2. **Disaster Recovery cấp Region** (khi primary Region gặp sự cố có thể promote secondary)
3. Giữ nguyên mô hình **RDBMS Aurora (SQL, transaction, engine compatibility)**

### Cross-Region Replication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA GLOBAL DATABASE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
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
│                                                                             │
│   Replication lag: < 1 giây (typically ~100ms)                              │
│   Switchover/failover: promote secondary thành primary khi cần              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cách hoạt động (ngắn gọn)

1. Ứng dụng ghi dữ liệu vào **writer endpoint** của global database (luôn trỏ về primary writer)
2. Aurora replicate thay đổi từ primary sang các secondary Region ở tầng storage
3. Ứng dụng gần người dùng đọc từ reader endpoint ở Region gần nhất
4. Khi cần DR:
   - **Switchover**: chuyển primary có kế hoạch
   - **Failover**: chuyển primary khi primary Region lỗi

> Lưu ý quan trọng cho thiết kế:
> Aurora Global Database replicate ở mức **cluster/database**, không phải chọn riêng từng table trong cùng cluster để global.

### Key Features

| Feature | Value |
|---------|-------|
| **Replication lag** | Thường < 1 giây |
| **Secondary regions** | Tối đa 10 |
| **Replicas per region** | Tối đa 16 |
| **Write endpoint** | Global writer endpoint luôn trỏ primary writer |
| **Switchover/Failover** | Hỗ trợ chuyển primary cross-Region |
| **Write forwarding** | Secondary có thể forward write về primary (nếu bật) |

### Use Cases

1. **Gaming/SaaS toàn cầu**: người dùng nhiều châu lục cần read latency thấp
2. **Region-level DR**: yêu cầu RTO/RPO tốt hơn replication truyền thống
3. **Mở rộng quốc tế nhưng muốn ít refactor**: vẫn dùng Aurora SQL thay vì chuyển NoSQL

### Khi nào KHÔNG nên dùng?

1. Cần **multi-master write độc lập ở nhiều Region** (Global DB có 1 primary writer tại một thời điểm)
2. Chỉ chạy trong 1 Region, không cần global reads/DR cross-Region
3. Workload chủ yếu key-value đơn giản, không cần relational features (có thể cân nhắc DynamoDB)

### Ví dụ thực tế dễ hình dung

- Công ty game hiện chạy ở `us-east-1`, mở rộng sang EU và APAC
- Đặt primary ở `us-east-1`, tạo secondary ở `eu-west-1` và `ap-southeast-1`
- Người chơi EU đọc leaderboard/profiles từ `eu-west-1` để giảm latency
- Nếu primary Region gặp sự cố, secondary Region có thể được promote thành primary để tiếp tục phục vụ

### Nguồn AWS chính thức

- Aurora Global Database (User Guide): https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html
- Aurora Global Database (Product page): https://aws.amazon.com/rds/aurora/global-database/

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
│                    AURORA BACKUP                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CONTINUOUS BACKUP to S3 (tự động)                                         │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │ Aurora Storage ──► S3 (continuous, incremental)                  │      │
│   │                                                                  │      │
│   │ Retention: 1-35 days                                             │      │
│   │ Point-in-Time Recovery: Bất kỳ giây nào trong retention window   │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│   ✅ Không ảnh hưởng performance                                            │
│   ✅ Không cần maintenance window                                           │
│   ✅ Backup storage FREE (up to 100% of DB size)                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backtrack (Aurora MySQL only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA BACKTRACK                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Scenario: Accidentally DELETE important data                              │
│                                                                             │
│   Timeline:                                                                 │
│   ────●────────●────────●────────●────────●────────●────                    │
│       │        │        │        │        │        │                        │
│     10:00    10:15    10:30    10:45    11:00    Now                        │
│                         │                                                   │
│                     DELETE!                                                 │
│                                                                             │
│   Traditional restore: Cần restore từ snapshot → 30+ phút                   │
│   Backtrack: "Rewind" database về 10:29 → GIÂY!                             │
│                                                                             │
│   ✅ Không cần restore                                                      │
│   ✅ In-place recovery                                                      │
│   ✅ Window: up to 72 hours                                                 │
│   ❌ Chỉ Aurora MySQL                                                       │
│                                                                             │
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

### So sánh tổng quan

| Tiêu chí | RDS MySQL/PostgreSQL | Aurora |
|----------|----------------------|--------|
| **Performance** | Baseline | **5x MySQL, 3x PostgreSQL** |
| **Storage** | EBS (provision trước) | **Auto-scaling 10GB-128TB** |
| **Max Storage** | 64TB | **128TB** |
| **Replication** | Async (lag seconds) | **Sync** (~10-20ms lag) |
| **Max Replicas** | 5 | **15** |
| **Failover** | 1-2 phút | **~30 giây** |
| **Reader Endpoint** | ❌ | ✅ |
| **Backtrack** | ❌ | ✅ (MySQL only) |
| **Clone** | ❌ (snapshot restore) | ✅ (seconds) |
| **Serverless** | ❌ | ✅ v1 và v2 |
| **Global Database** | ❌ | ✅ |
| **Giá** | Thấp hơn ~20% | Cao hơn |

### So sánh High Availability (HA)

| Tiêu chí | RDS Multi-AZ | Aurora |
|----------|--------------|--------|
| **Kiến trúc** | Primary + Standby (riêng biệt) | Primary + Shared Storage |
| **Standby đọc được?** | ❌ Không (chỉ failover) | ✅ Replicas đọc được |
| **Số lượng standby** | 1 (hoặc 2 với Multi-AZ Cluster) | Tối đa 15 replicas |
| **Failover time** | 1-2 phút | ~30 giây |
| **Data sync** | Standby sync block-level, không đọc được | Storage sync/quorum; Aurora Replicas async log consumption |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RDS MULTI-AZ                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────┐              ┌───────────────┐                          │
│   │   PRIMARY     │  Sync Block  │   STANDBY     │                          │
│   │               │─────────────▶│               │                          │
│   │   ┌───────┐   │  Replication │   ┌───────┐   │                          │
│   │   │  EBS  │   │              │   │  EBS  │   │                          │
│   │   │ 100GB │   │              │   │ 100GB │   │  ❌ Không đọc được       │
│   │   └───────┘   │              │   └───────┘   │                          │
│   └───────────────┘              └───────────────┘                          │
│        AZ-a                           AZ-b                                  │
│                                                                             │
│   → Failover: 1-2 phút (DNS propagation + recovery)                         │
│   → Storage: 2 × 100GB = 200GB cost                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    AURORA HA                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐                             │
│   │  PRIMARY  │   │ REPLICA 1 │   │ REPLICA 2 │                             │
│   │  (Writer) │   │  (Reader) │   │  (Reader) │  ✅ Đọc được!               │
│   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘                             │
│         │               │               │                                   │
│         └───────────────┴───────────────┘                                   │
│                        │                                                    │
│              ┌──────────▼──────────┐                                        │
│              │   SHARED STORAGE    │                                        │
│              │   (6 copies/3 AZs)  │                                        │
│              │       100GB         │                                        │
│              └─────────────────────┘                                        │
│                                                                             │
│   → Failover: ~30 giây (chỉ promote replica)                                │
│   → Storage: 100GB cost (shared, trả 1 lần)                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### So sánh Replication

| Tiêu chí | RDS Read Replica | Aurora Replica |
|----------|------------------|----------------|
| **Cơ chế** | Async theo DB engine, replica có storage riêng | Shared storage; reader consume log stream async |
| **Replica lag** | Có thể seconds → minutes | Thường rất thấp, AWS ghi nhận thường ≤100ms |
| **Cross-region** | ✅ (lag cao hơn) | ✅ Global Database (<1 giây) |
| **Failover tự động** | ❌ Manual promote | ✅ Tự động |
| **Reader Endpoint** | ❌ Phải tự load balance | ✅ Có sẵn |
| **Storage cost** | × số replicas | Shared (1 lần) |

### So sánh Storage Architecture

| Tiêu chí | RDS | Aurora |
|----------|-----|--------|
| **Storage type** | EBS (gp2, gp3, io1, io2) | Distributed SSD (tự quản lý) |
| **Provisioning** | Phải chọn trước | Auto-scaling |
| **Scaling** | Cần modify + có thể downtime | Tự động, không downtime |
| **Max size** | 64TB | 128TB |
| **Durability** | EBS: 99.999% | 6 copies/3 AZs: 99.999999999% |
| **IOPS** | Phải provision (io1/io2) | Included (scale với storage) |

### So sánh Features

| Feature | RDS | Aurora |
|---------|-----|--------|
| **Multi-AZ** | ✅ | ✅ (mặc định với replicas) |
| **Read Replicas** | ✅ (max 5) | ✅ (max 15) |
| **Automated Backups** | ✅ | ✅ |
| **Point-in-Time Recovery** | ✅ | ✅ |
| **Backtrack** | ❌ | ✅ (MySQL) |
| **Clone** | ❌ | ✅ |
| **Serverless** | ❌ | ✅ |
| **Global Database** | ❌ | ✅ |
| **Blue/Green Deployments** | ✅ | ✅ |
| **Performance Insights** | ✅ | ✅ |
| **IAM DB Authentication** | ✅ | ✅ |
| **Secrets Manager Integration** | ✅ | ✅ |

### Khi nào chọn gì?

| Scenario | Chọn | Lý do |
|----------|------|-------|
| Budget constrained | **RDS** | Rẻ hơn ~20% |
| Simple apps, predictable load | **RDS** | Đủ dùng, tiết kiệm |
| High performance, low latency | **Aurora** | 5x faster |
| Need fast failover (<1 phút) | **Aurora** | 30 giây failover |
| Many read replicas (>5) | **Aurora** | Max 15 replicas |
| Cross-region DR | **Aurora** | Global Database |
| Unpredictable workloads | **Aurora Serverless v2** | Auto-scale ACUs |
| Need to pause DB (dev/test) | **Aurora Serverless v1** | 0 ACUs = $0 |
| Quick recovery từ human error | **Aurora** | Backtrack (seconds) |
| Test với production data | **Aurora** | Clone (seconds) |

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
