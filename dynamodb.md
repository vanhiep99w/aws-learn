# Amazon DynamoDB


## Mục lục

- [Tổng quan](#tổng-quan)
- [1. Core Concepts](#1-core-concepts)
- [2. Primary Key](#2-primary-key)
- [3. Capacity Modes](#3-capacity-modes)
- [4. Secondary Indexes](#4-secondary-indexes)
- [5. Global Tables](#5-global-tables)
- [6. DynamoDB Streams](#6-dynamodb-streams)
- [7. DAX (DynamoDB Accelerator)](#7-dax-dynamodb-accelerator)
- [8. Transactions](#8-transactions)
- [9. TTL (Time to Live)](#9-ttl-time-to-live)
- [10. Best Practices](#10-best-practices)
- [11. Pricing](#11-pricing)
- [Summary](#summary)

---

## Tổng quan

**Amazon DynamoDB** là **fully managed NoSQL database service** cung cấp hiệu suất single-digit millisecond latency ở mọi quy mô. DynamoDB hỗ trợ cả **key-value** và **document data models**, phù hợp cho các ứng dụng yêu cầu throughput cao và latency thấp.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DYNAMODB ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    DYNAMODB TABLE                           │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│   │  │   Item 1    │  │   Item 2    │  │   Item 3    │          │   │
│   │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │          │   │
│   │  │ │PK: user1│ │  │ │PK: user2│ │  │ │PK: user3│ │          │   │
│   │  │ │SK: 2024 │ │  │ │SK: 2024 │ │  │ │SK: 2025 │ │          │   │
│   │  │ │Attrs... │ │  │ │Attrs... │ │  │ │Attrs... │ │          │   │
│   │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │          │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│   │                                                             │   │
│   │  Primary Key (PK): Partition Key hoặc (Partition Key + Sort Key)│   │
│   │  Item: Collection of attributes được identify bởi Primary Key │   │
│   │  Attribute: Fundamental data element (giống columns trong SQL) │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    DYNAMODB FEATURES                        │   │
│   │  • Serverless - Không quản lý infrastructure                │   │
│   │  • Auto-scaling - Tự động mở rộng capacity                  │   │
│   │  • Global Tables - Multi-region, multi-active replication   │   │
│   │  • On-Demand/Provisioned Capacity Modes                     │   │
│   │  • DynamoDB Streams - Change data capture                   │   │
│   │  • DAX - In-memory caching (microsecond latency)            │   │
│   │  • ACID Transactions - Multi-item transactions              │   │
│   │  • TTL - Automatic item expiration                          │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Use Cases phổ biến

| Use Case | Mô tả |
|----------|-------|
| **Web/Mobile Apps** | Session management, user profiles, shopping carts |
| **Gaming** | Leaderboards, player state, game data |
| **IoT** | Device state, sensor data, telemetry |
| **E-commerce** | Product catalogs, inventory, order processing |
| **Real-time Analytics** | Clickstream data, metrics, event logging |
| **Serverless Apps** | Backend cho Lambda functions |

> **Nguồn**: [What is Amazon DynamoDB?](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)

### EXAM TIP: "LEAST Operational Overhead for ANY Scale"

> [!IMPORTANT]
> Khi exam hỏi: "Which database has the **LEAST operational overhead** at **ANY scale**?"
> → Đáp án luôn là **DynamoDB**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DynamoDB = Zero Operational Overhead                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ✅ NO patching                 - AWS quản lý hoàn toàn                    │
│   ✅ NO capacity planning        - Auto scale up/down (On-Demand mode)      │
│   ✅ NO server management        - Serverless (không có instance)           │
│   ✅ NO replication setup        - Built-in multi-AZ                        │
│   ✅ NO backup management        - Continuous backup available              │
│   ✅ NO connection pooling       - HTTP-based API                           │
│                                                                             │
│   Scale: 0 → millions of requests/second (không cần thay đổi gì!)           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### So sánh Operational Overhead

| Task | DynamoDB | Aurora Serverless | RDS | EC2 + Self-managed |
|------|----------|-------------------|-----|---------------------|
| **Patching** | AWS | AWS | AWS | ❌ You |
| **Scaling** | ✅ **Automatic** | Automatic | Manual resize | ❌ You |
| **Capacity** | ✅ **On-Demand** | Auto pause | Pre-provision | ❌ You |
| **HA/Replication** | ✅ **Built-in** | Built-in | Multi-AZ config | ❌ You |
| **Backups** | ✅ **Automatic** | Automatic | Configure | ❌ You |

```
Operational Overhead:

Ít nhất ──────────────────────────────────────────► Nhiều nhất

┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
│ DynamoDB │   │  Aurora  │   │   RDS    │   │ Self-managed │
│          │   │Serverless│   │          │   │   on EC2     │
└──────────┘   └──────────┘   └──────────┘   └──────────────┘
   ✅ Best        Good          Manual         Everything!
```

### Sample Exam Questions

```
❓ "Which database provides the LEAST operational overhead at ANY scale?"

   A. Amazon RDS
   B. Amazon Aurora
   C. ✅ Amazon DynamoDB
   D. Amazon Redshift

❓ "Company needs a database that scales automatically with 
    no capacity planning. Which service?"

   A. RDS MySQL
   B. Aurora PostgreSQL  
   C. ✅ DynamoDB
   D. ElastiCache
```

---

## 1. Core Concepts

### 1.1 Table, Items, Attributes

```
┌────────────────────────────────────────────────────────────────────┐
│                     DYNAMODB DATA MODEL                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  TABLE: Movies                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ PARTITION KEY: MovieID (Number)                            │    │
│  │ SORT KEY: ReleaseYear (Number)                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ITEM 1:                                                           │
│  ┌─────────────┬────────────────────────────────────────────────┐  │
│  │ MovieID     │ 101                                             │ │
│  │ ReleaseYear │ 2024                                            │ │
│  │ Title       │ "The Cloud Architecture"                        │ │
│  │ Genre       │ ["Action", "Sci-Fi"]                            │ │
│  │ Rating      │ 8.5                                             │ │
│  │ BoxOffice   │ { "domestic": 5000000, "international": 8000000 }│ │
│  │ IsAvailable │ true                                            │ │
│  └─────────────┴────────────────────────────────────────────────┘  │
│                                                                    │
│  ITEM 2:                                                           │
│  ┌─────────────┬────────────────────────────────────────────────┐  │
│  │ MovieID     │ 102                                             │ │
│  │ ReleaseYear │ 2023                                            │ │
│  │ Title       │ "Serverless Adventures"                         │ │
│  │ Genre       │ ["Comedy"]                                      │ │
│  │ Rating      │ 7.2                                             │ │
│  │ BoxOffice   │ { "domestic": 3000000 }                         │ │
│  │ IsAvailable │ false                                           │ │
│  └─────────────┴────────────────────────────────────────────────┘  │
│                                                                    │
│  NOTES:                                                            │
│  • Mỗi item có thể có attributes khác nhau (schema-less)           │
│  • Item size limit: 400 KB (tính cả attribute names + values)      │
│  • Table không có limit số items hoặc table size                   │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Types

| Category | Types | Examples |
|----------|-------|----------|
| **Scalar** | String, Number, Binary, Boolean, Null | `"name"`, `123`, `true` |
| **Document** | List, Map | `["a", "b"]`, `{"a": 1}` |
| **Set** | String Set, Number Set, Binary Set | `SS: ["a", "b"]`, `NS: [1, 2, 3]` |

### 1.3 Read Consistency

#### RCU là gì? RCU đo lường cái gì?

**RCU (Read Capacity Unit)** là đơn vị đo lường **CAPACITY (năng lực/khả năng xử lý)** cho read operations trong DynamoDB.

**RCU dùng để đo lường:**
- Khả năng đọc data của table trong **Provisioned Capacity Mode**
- Tương tự như "mã lực" của xe - cho biết table có thể đọc bao nhiêu data mỗi giây

```
┌─────────────────────────────────────────────────────────────────────┐
│                RCU ĐO LƯỜNG CÁI GÌ?                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  VÍ DỤ THỰC TẾ:                                                     │
│                                                                     │
│  Giống như đường cao tốc:                                           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │     RCU = Số làn đường (capacity/lane)                        │  │
│  │                                                               │  │
│  │  5 RCU = Đường 5 làn ───────────────────────────────►         │  │
│  │        Cho phép 5 xe đi song song mỗi giây                    │  │
│  │                                                               │  │
│  │  100 RCU = Đường 100 làn ──────────────────────────►          │  │
│  │          Cho phép 100 xe đi song song mỗi giây                │  │
│  │          (đường cao tốc lớn, xử lý được traffic cao)          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TRONG DYNAMODB:                                                    │
│                                                                     │
│  1 RCU = 1 "làn đường" cho read operations:                         │
│                                                                     │
│  ┌─ 1 RCU cho phép đọc:                                             │
│  │    • 1 item ≤ 4 KB với Strongly Consistent Read MỖI GIÂY         │
│  │    HOẶC                                                          │
│  │    • 2 items ≤ 4 KB với Eventually Consistent Read MỖI GIÂY      │
│  │                                                                  │
│  │  → Nếu bạn set 10 RCU cho table, tức là bạn "thuê" 10 làn đường  │
│  │    table có thể đọc tối đa 10 items (4KB) mỗi giây               │
│  │                                                                  │
│  │  → Nếu traffic vượt quá 10 RCU (ví dụ 15 reads/giây)?            │
│  │    Requests thứ 11-15 sẽ bị THROTTLE (lỗi ProvisionedThroughputExceeded)│
│  │                                                                  │
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  QUAN TRỌNG:                                                        │
│  • RCU chỉ áp dụng cho PROVISIONED CAPACITY MODE                    │
│  • ON-DEMAND MODE không dùng RCU - dùng RRU (Read Request Unit)     │
│  • RCU tính theo GIÂY, RRU tính theo REQUEST                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CÁCH TÍNH RCU CHI TIẾT                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1 RCU = Khả năng đọc 1 item có kích thước ≤ 4 KB                   │
│          với Strongly Consistent Read MỖI GIÂY                      │
│                                                                     │
│  HOẶC                                                               │
│                                                                     │
│  1 RCU = Khả năng đọc 2 items có kích thước ≤ 4 KB mỗi item         │
│          với Eventually Consistent Read MỖI GIÂY                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  VÍ DỤ TÍNH RCU:                                                    │
│                                                                     │
│  Scenario 1: Read 1 item (3 KB)                                     │
│  ├─ Strongly Consistent: 1 RCU                                      │
│  └─ Eventually Consistent: 0.5 RCU                                  │
│                                                                     │
│  Scenario 2: Read 1 item (6 KB)                                     │
│  ├─ Strongly Consistent: 2 RCU (6KB / 4KB = 1.5 → round up to 2)    │
│  └─ Eventually Consistent: 1 RCU                                    │
│                                                                     │
│  Scenario 3: Read 10 items (mỗi item 2 KB)                          │
│  ├─ Strongly Consistent: 10 RCU (10 × 0.5 = 5, nhưng minimum 1/item)│
│  └─ Eventually Consistent: 5 RCU                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Eventually Consistent vs Strongly Consistent - Khác nhau như thế nào?

**Điểm khác biệt CỐT LÕI:** Cách DynamoDB đọc data từ các Availability Zones (AZs)

```
┌─────────────────────────────────────────────────────────────────────┐
│         DYNAMODB REPLICATION ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Khi write data vào DynamoDB, data được replicate đến 3 AZs:        │
│                                                                     │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐      │
│  │    AZ-1       │     │    AZ-2       │     │    AZ-3       │      │
│  │   (Primary)   │────►│   (Replica 1) │────►│   (Replica 2) │      │
│  │               │     │               │     │               │      │
│  │  "New Data"   │     │  "New Data"   │     │  "New Data"   │      │
│  │      ✓        │     │      ✓        │     │      ✓        │      │
│  └───────────────┘     └───────────────┘     └───────────────┘      │
│                                                                     │
│  Write xong → Data replicate ngay → Tất cả 3 AZs đều có data giống  │
│  nhau (thường < 1 giây)                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│    EVENTUALLY CONSISTENT READ (Giá: 0.5 RCU)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CƠ CHẾ: DynamoDB trả về data từ AZ GẦN NHẤT, không kiểm tra        │
│          các AZs khác có data mới nhất chưa                         │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │  Timeline: Write vừa xong (T+0)                               │  │
│  │                                                               │  │
│  │  AZ-1: "New Data" ✓      AZ-2: "Old Data" ◐      AZ-3: "Old" ◐│  │
│  │       (có new data)       (chưa replicate)      (chưa replicate)│  │
│  │                                                               │  │
│  │  App Read ──► DynamoDB chọn AZ-2 (gần nhất)                   │  │
│  │               │                                               │  │
│  │               ▼                                               │  │
│  │          Return "Old Data" ⚠️                                  │  │
│  │                                                               │  │
│  │  → App thấy data CŨ, không thấy write vừa xong!               │  │
│  │  → Nhưng sau 1-2 giây, tất cả AZs đều có "New Data"           │  │
│  │  → Gọi là "Eventually" (cuối cùng) consistent                 │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ✓ ƯU ĐIỂM: Giá rẻ (0.5 RCU), latency thấp hơn                      │
│  ✗ NHƯỢC ĐIỂM: Có thể đọc được data cũ trong < 1s sau write         │
│                                                                     │
│  TỶ LỆ STALE DATA: Rất thấp (~0.1%), nhưng vẫn có thể xảy ra        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│    STRONGLY CONSISTENT READ (Giá: 1 RCU)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CƠ CHẾ: DynamoDB đợi và đảm bảo TẤT CẢ AZs đều có data mới nhất    │
│          rồi mới trả về cho app                                     │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │  Timeline: Write vừa xong (T+0)                               │  │
│  │                                                               │  │
│  │  AZ-1: "New Data" ✓      AZ-2: "Old Data" ◐      AZ-3: "Old" ◐│  │
│  │                                                               │  │
│  │  App Read ──► DynamoDB kiểm tra TẤT CẢ 3 AZs                  │  │
│  │               │                                               │  │
│  │               ├─► AZ-1: Có New Data ✓                         │  │
│  │               ├─► AZ-2: Chưa có → ĐỢI replicate...            │  │
│  │               ├─► AZ-3: Chưa có → ĐỢI replicate...            │  │
│  │               │                                               │  │
│  │               (Sau ~10-50ms)                                  │  │
│  │               │                                               │  │
│  │               Tất cả AZs đều có "New Data" ✓✓✓                │  │
│  │               │                                               │  │
│  │               ▼                                               │  │
│  │          Return "New Data" ✓                                  │  │
│  │                                                               │  │
│  │  → App LUÔN thấy data MỚI NHẤT sau write!                     │  │
│  │  → Không bao giờ stale data                                   │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ✓ ƯU ĐIỂM: Luôn đọc được data mới nhất, 100% consistency           │
│  ✗ NHƯỢC ĐIỂM: Giá đắt gấp đôi (1 RCU), latency cao hơn ~10-50ms    │
│                                                                     │
│  CHI PHÍ CAO HƠN VÌ:                                                │
│  • Phải query/check tất cả 3 AZs thay vì 1 AZ                       │
│  • Phải đợi replication hoàn tất                                    │
│  • Coordination overhead giữa các AZs                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### So sánh chi tiết: Eventually vs Strongly Consistent

| Tiêu chí | Eventually Consistent | Strongly Consistent |
|----------|----------------------|---------------------|
| **Giá tiền** | Rẻ (0.5 RCU cho 4KB) | Đắt gấp đôi (1 RCU cho 4KB) |
| **Latency** | Nhanh (~1-5ms) | Chậm hơn (~5-15ms) |
| **Cơ chế** | Đọc từ 1 AZ gần nhất | Đọc và đồng bộ tất cả 3 AZs |
| **Data mới nhất** | Không đảm bảo (có thể stale) | Luôn đảm bảo 100% |
| **Thời gian stale** | Thường < 1 giây sau write | Không bao giờ stale |
| **Use Case** | Social feeds, analytics, recommendations | Banking, inventory, auth |

#### Ví dụ thực tế

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRACTICAL EXAMPLES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ NÊN DÙNG EVENTUALLY CONSISTENT:                                 │
│                                                                     │
│  1. Facebook Feed                                                   │
│     - User A vừa đăng status                                        │
│     - Friend B refresh feed ngay lập tức                            │
│     - Có thể chưa thấy status mới ngay (chấp nhận delay 1-2s)       │
│     - Giảm 50% read cost ✓                                          │
│                                                                     │
│  2. Product Recommendations                                         │
│     - "Khách hàng cũng mua" suggestions                             │
│     - Không cần real-time chính xác từng giây                       │
│                                                                     │
│  3. Analytics Dashboard                                             │
│     - Metrics có thể delay vài giây không sao                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ NÊN DÙNG STRONGLY CONSISTENT:                                   │
│                                                                     │
│  1. Bank Account Balance                                            │
│     - User vừa chuyển tiền ($100 → $50)                             │
│     - Ngay sau đó kiểm tra số dư                                    │
│     - PHẢI thấy $50, không thể thấy $100 (stale)                    │
│     - Wrong balance = financial error ⚠️                             │
│                                                                     │
│  2. Inventory Management                                            │
│     - Item stock: 5 → 4 (sau khi bán 1)                             │
│     - Customer tiếp theo check stock                                │
│     - PHẢI thấy 4, không thể thấy 5 (overselling)                   │
│                                                                     │
│  3. User Authentication                                             │
│     - User vừa đổi password                                         │
│     - Login ngay sau đó                                             │
│     - PHẢI sử dụng password mới, không thể dùng cũ                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **Nguồn**: [DynamoDB Read Consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html)

#### WCU là gì? (Bonus: Write Capacity Unit)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   WRITE CAPACITY UNITS (WCU)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1 WCU = Khả năng write 1 item có kích thước ≤ 1 KB mỗi giây        │
│                                                                     │
│  VÍ DỤ TÍNH WCU:                                                    │
│                                                                     │
│  Scenario 1: Write 1 item (0.5 KB)                                  │
│  └─ 1 WCU (0.5 KB ≤ 1 KB)                                           │
│                                                                     │
│  Scenario 2: Write 1 item (2 KB)                                    │
│  └─ 2 WCU (2 KB / 1 KB = 2)                                         │
│                                                                     │
│  Scenario 3: Write 1 item (10 KB)                                   │
│  └─ 10 WCU (10 KB / 1 KB = 10)                                      │
│                                                                     │
│  Scenario 4: Write 100 items (mỗi item 0.5 KB) mỗi giây             │
│  └─ 50 WCU (100 items × 0.5 KB / 1 KB = 50, nhưng minimum 1/item)   │
│                                                                     │
│  💡 QUAN TRỌNG:                                                     │
│  • WCU calculation phức tạp hơn RCU vì phải tính toàn bộ item size  │
│  • Write thêm 1 attribute cũng tăng WCU                             │
│  • Update toàn bộ item = Write lại toàn bộ item                     │
│  • Transaction Write = 2× WCU (prepare + commit phases)             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Summary: RCU vs WCU

| Đơn vị | Dùng cho | 1 Unit = | Tính theo |
|--------|----------|----------|-----------|
| **RCU** | Read operations | 4 KB item | Per read request |
| **WCU** | Write operations | 1 KB item | Per write request |
| **RRU** | Read (On-Demand) | 4 KB item | Pay-per-request |
| **WRU** | Write (On-Demand) | 1 KB item | Pay-per-request |

---

## 2. Primary Key

### 2.1 Simple Primary Key (Partition Key only)

```
┌─────────────────────────────────────────────────────────────────────┐
│             SIMPLE PRIMARY KEY (Partition Key Only)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Table: Users                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Primary Key: UserID (String)                                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Items:                                                             │
│  ┌──────────────┬──────────────┬──────────────┐                  │  │
│  │   UserID     │   Email      │   Name       │                  │  │
│  ├──────────────┼──────────────┼──────────────┤                  │  │
│  │ "user_123"   │"a@email.com" │  "Alice"     │                  │  │
│  │ "user_456"   │"b@email.com" │  "Bob"       │                  │  │
│  │ "user_789"   │"c@email.com" │  "Charlie"   │                  │  │
│  └──────────────┴──────────────┴──────────────┘                  │  │
│                                                                     │
│  ✓ Mỗi item được identify duy nhất bởi UserID                    │  │
│  ✓ UserID phải unique trong table                                │  │
│  ✓ Query/GetItem chỉ cần UserID                                  │  │
│                                                                  │  │
│  ⚠️ CONSTRAINTS:                                                  │  │
│  ✗ Partition Key KHÔNG được NULL (required)                      │  │
│  ✗ Partition Key KHÔNG được empty với Binary type                │  │
│  ✓ String type có thể empty "" nhưng KHÔNG được null             │  │
│  → Insert item thiếu PK sẽ lỗi ValidationException               │  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Composite Primary Key (Partition Key + Sort Key)

```
┌─────────────────────────────────────────────────────────────────────┐
│           COMPOSITE PRIMARY KEY (Partition + Sort Key)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Table: Orders                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Partition Key: CustomerID (String)                           │  │
│  │  Sort Key: OrderTimestamp (Number - Unix timestamp)           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Items:                                                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐   │  │
│  │ CustomerID   │ OrderTime    │ OrderID      │ Total        │   │  │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤   │  │
│  │  "cust_001"  │ 1704067200   │ "ord_1001"   │ 150.00       │   │  │
│  │  "cust_001"  │ 1704153600   │ "ord_1002"   │ 230.50       │   │  │
│  │  "cust_001"  │ 1704240000   │ "ord_1003"   │ 89.99        │   │  │
│  │  "cust_002"  │ 1704067200   │ "ord_2001"   │ 450.00       │   │  │
│  │  "cust_002"  │ 1704326400   │ "ord_2002"   │ 120.00       │   │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘   │  │
│                                                                  │  │
│  ✓ Partition Key: Xác định partition (logical grouping)          │  │
│  ✓ Sort Key: Sắp xếp items trong cùng partition                  │  │
│  ✓ Combination (CustomerID + OrderTime) phải unique              │  │
│  ✓ Query có thể filter theo range trên Sort Key                  │  │
│                                                                  │  │
│  ⚠️ CONSTRAINTS:                                                  │  │
│  ✗ Partition Key KHÔNG được NULL (required)                      │  │
│  ✗ Sort Key KHÔNG được NULL (required)                           │  │
│  ✗ Primary Key TỐI ĐA 2 attributes (PK + SK), không thể 3+       │  │
│  → Insert item thiếu PK hoặc SK sẽ lỗi ValidationException       │  │
│                                                                  │  │
│  💡 WORKAROUND cho 3+ attributes:                                │  │
│  Concatenate nhiều values thành 1 Sort Key:                      │  │
│  Ví dụ: SK = "2024#01#15" (Year#Month#Day)                       │  │
│                                                                  │  │
│  Query Examples:                                                 │  │
│  • Query(CustomerID="cust_001") → 3 orders                       │  │
│  • Query(CustomerID="cust_001", SortKey BETWEEN t1 AND t2)       │  │
│                                                                  │  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Partition Key Distribution

**Partition Key Distribution** là cách DynamoDB **phân chia data** vào các partitions dựa trên giá trị của Partition Key.

```
┌─────────────────────────────────────────────────────────────────────┐
│              CƠ CHẾ PARTITION (Giống Kafka!)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   DynamoDB nhận Partition Key → Hash function → Partition ID        │
│                                                                     │
│   "user_001" ──► hash() ──► Partition A                             │
│   "user_002" ──► hash() ──► Partition B                             │
│   "user_003" ──► hash() ──► Partition A                             │
│   "user_004" ──► hash() ──► Partition C                             │
│                                                                     │
│   Mỗi Partition:                                                    │
│   • Tối đa ~10 GB storage                                           │
│   • Tối đa 3,000 RCU / 1,000 WCU                                    │
│   • Được lưu trên physical storage riêng                            │
│   • Auto-split khi vượt limit (không cần manual như Kafka)          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│   SO SÁNH VỚI KAFKA:                                                │
│                                                                     │
│   Khía cạnh       │ DynamoDB              │ Kafka                   │
│   ────────────────┼───────────────────────┼──────────────────────   │
│   Key             │ Partition Key         │ Message Key             │
│   Cơ chế          │ Hash(PK) → Partition  │ Hash(Key) → Partition   │
│   Hot Partition   │ ✅ Có thể xảy ra       │ ✅ Có thể xảy ra       │
│   Ordering        │ Trong partition (SK)  │ Trong partition (offset)│
│   Scale           │ Auto-split            │ Manual add partitions   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              PARTITION KEY DISTRIBUTION (Important!)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ❌ BAD: Partition Key không đều (Hot Partition)                    │
│                                                                     │
│  Partition Key: Date (YYYY-MM-DD)                                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Partition A (2024-01-01) - 90% traffic ⚠️ HOT               │    │
│  │  Partition B (2024-01-02) - 5% traffic                      │    │
│  │  Partition C (2024-01-03) - 5% traffic                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  → Partition A bị quá tải, requests bị THROTTLE!                    │
│                                                                     │
│  ✅ GOOD: Partition Key phân phối đều                               │
│                                                                     │
│  Partition Key: UserID (UUID v4 hoặc hash)                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Partition A - 25% traffic ✓                                │    │
│  │  Partition B - 25% traffic ✓                                │    │
│  │  Partition C - 25% traffic ✓                                │    │
│  │  Partition D - 25% traffic ✓                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  💡 BEST PRACTICES:                                                 │
│  • Sử dụng UUID, hash của natural key, hoặc high-cardinality values │
│  • Tránh partition key với low cardinality (date, status, category) │
│  • Nếu bắt buộc dùng date → thêm suffix random ("2024-01-01#a3f2")  │
│  • Mỗi partition tối đa ~10 GB và 3,000 RCU / 1,000 WCU             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **Nguồn**: [DynamoDB Keys](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey)

### 2.4 Partition Storage & Multi-AZ Replication

```
┌─────────────────────────────────────────────────────────────────────┐
│              DYNAMODB PARTITION REPLICATION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Mỗi Partition được replicate tự động đến 3 AZs:                   │
│                                                                     │
│   Partition A (data của user_001, user_003, ...)                    │
│   ┌───────────┐    ┌───────────┐    ┌───────────┐                   │
│   │   AZ-1    │    │   AZ-2    │    │   AZ-3    │                   │
│   │  (Copy 1) │◄──►│  (Copy 2) │◄──►│  (Copy 3) │                   │
│   │   ✓       │    │   ✓       │    │   ✓       │                   │
│   └───────────┘    └───────────┘    └───────────┘                   │
│        │                │                │                          │
│        └────────────────┴────────────────┘                          │
│              Synchronous replication                                │
│                                                                     │
│   ✅ Tự động, không cần cấu hình (built-in)                         │
│   ✅ Synchronous replication (data consistent)                      │
│   ✅ High availability - 1 AZ fail vẫn hoạt động                    │
│   ✅ 99.99% SLA (99.999% với Global Tables)                         │
│   ✅ Durability: 99.999999999% (11 nines)                           │
│   ✅ Không tính phí thêm - đã bao gồm trong giá                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│   SO SÁNH VỚI CÁC SERVICES KHÁC:                                    │
│                                                                     │
│   Service      │ Multi-AZ          │ Config                         │
│   ─────────────┼───────────────────┼──────────────────────────      │
│   DynamoDB     │ ✅ Luôn 3 AZs     │ Tự động, miễn phí              │
│   RDS          │ ❌ Phải enable    │ Manual, trả thêm tiền          │
│   Aurora       │ ✅ 6 copies/3 AZs │ Tự động, bao gồm trong giá     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Capacity Modes

DynamoDB cung cấp **hai capacity modes** để xử lý read và write throughput:

### 3.1 On-Demand Capacity Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ON-DEMAND CAPACITY MODE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✓ Serverless - Không cần capacity planning                         │
│  ✓ Auto-scaling - Tự động scale đến hàng ngàn requests/second       │
│  ✓ Pay-per-request - Chỉ trả tiền cho requests thực tế              │
│  ✓ Instant scaling - Adapt ngay lập tức với traffic spikes          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   PRICING (per request)                     │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  Write Request Unit (WRU): 1 KB write                       │    │
│  │  Read Request Unit (RRU): 4 KB eventually consistent read   │    │
│  │  Read Request Unit (RRU): 4 KB strongly consistent read = 2 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Best for:                                                          │
│  • Applications mới, traffic unpredictable                          │
│  • Development/testing environments                                 │
│  • Seasonal/cyclical traffic patterns                               │
│  • Không muốn manage capacity                                       │
│                                                                     │
│  Limits:                                                            │
│  • Double previous peak trong 30 mins                               │
│  • Không có limit tuyệt đối - scales vô hạn                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Provisioned Capacity Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│                PROVISIONED CAPACITY MODE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✓ Pre-allocated capacity - Tự define RCU/WCU                       │
│  ✓ Cost predictable - Pay cho capacity provisioned, không phải usage│
│  ✓ Auto Scaling Policies - Tự động điều chỉnh capacity              │
│  ✓ Reserved Capacity - Giảm giá khi commit capacity                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                 CAPACITY UNITS                              │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  Write Capacity Unit (WCU): 1 write/second cho item ≤1 KB   │    │
│  │  Read Capacity Unit (RCU): 2 eventually consistent reads/sec│    │
│  │                            hoặc 1 strongly consistent read  │    │
│  │                             cho item ≤4 KB                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Calculations:                                                      │
│  • Write 100 items (2 KB each)/second = 200 WCU                     │
│  • Read 100 items (4 KB each)/second (eventual) = 50 RCU            │
│                                                                     │
│  Best for:                                                          │
│  • Applications có traffic predictable, steady                      │
│  • Production workloads với consistent traffic                      │
│  • Cost optimization khi utilization cao                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Capacity Mode Comparison

| Feature | On-Demand | Provisioned |
|---------|-----------|-------------|
| **Setup** | Zero config | Cần specify RCU/WCU |
| **Scaling** | Instant, automatic | Auto Scaling policies |
| **Billing** | Per-request | Per-hour cho capacity |
| **Cost** | Higher per-request | Lower nếu high utilization |
| **Predictability** | Variable | Fixed hourly cost |
| **Throttling** | Không bao giờ | Có thể nếu vượt capacity |
| **Reserved Capacity** | ❌ | ✅ |

> **Nguồn**: [DynamoDB Read/Write Capacity Modes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)

---

## 4. Secondary Indexes

### 4.1 Global Secondary Index (GSI)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GLOBAL SECONDARY INDEX (GSI)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Base Table: Movies                                                 │
│  PK: MovieID, SK: ReleaseYear                                       │
│                                                                     │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │ MovieID    │ ReleaseYear│ Title      │ Genre       │             │
│  ├────────────┼────────────┼────────────┼────────────┤              │
│  │ mov_001    │ 2024       │ "Action X" │ "Action"    │             │
│  │ mov_002    │ 2023       │ "Comedy Y" │ "Comedy"    │             │
│  │ mov_003    │ 2024       │ "Drama Z"  │ "Drama"     │             │
│  └────────────┴────────────┴────────────┴────────────┘              │
│                                                                     │
│  GSI: GenreIndex                                                    │
│  PK: Genre, SK: ReleaseYear                                         │
│                                                                     │
│  ┌────────────┬────────────┬────────────┐                           │
│  │ Genre      │ ReleaseYear│ MovieID    │                           │
│  ├────────────┼────────────┼────────────┤                           │
│  │ "Action"   │ 2024       │ mov_001    │                           │
│  │ "Comedy"   │ 2023       │ mov_002    │                           │
│  │ "Drama"    │ 2024       │ mov_003    │                           │
│  └────────────┴────────────┴────────────┘                           │
│                                                                     │
│  ✓ GSI có partition key và sort key KHÁC base table                 │
│  ✓ Eventually consistent (async replication)                        │
│  ✓ Query trên GSI: Query(Genre="Action", ReleaseYear > 2020)        │
│  ✓ Phải provision separate RCU/WCU cho GSI                          │
│  ✓ Maximum 20 GSIs per table                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Local Secondary Index (LSI)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LOCAL SECONDARY INDEX (LSI)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Base Table: Orders                                                 │
│  PK: CustomerID, SK: OrderTimestamp                                 │
│                                                                     │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │ CustomerID │ OrderTime  │ OrderID    │ Status      │             │
│  ├────────────┼────────────┼────────────┼────────────┤              │
│  │ cust_001   │ 1704067200 │ ord_1001   │ "pending"   │             │
│  │ cust_001   │ 1704153600 │ ord_1002   │ "shipped"   │             │
│  │ cust_002   │ 1704067200 │ ord_2001   │ "pending"   │             │
│  └────────────┴────────────┴────────────┴────────────┘              │
│                                                                     │
│  LSI: CustomerStatusIndex                                           │
│  PK: CustomerID (SAME as base), SK: Status                          │
│                                                                     │
│  ✓ LSI giữ nguyên partition key của base table                      │
│  ✓ Chỉ có thể thêm LSI khi tạo table (không thêm sau)               │
│  ✓ Strongly consistent reads available                              │
│  ✓ Share RCU/WCU với base table (không cần provision riêng)         │
│  ✓ Maximum 5 LSIs per table                                         │
│                                                                     │
│  Query: Query(CustomerID="cust_001", Status="shipped")              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Index Comparison

| Feature | GSI | LSI |
|---------|-----|-----|
| **Partition Key** | Different from base table | Same as base table |
| **Sort Key** | Different | Different |
| **Created after table creation** | ✅ Yes | ❌ No (only at create time) |
| **Consistency** | Eventually consistent | Strongly consistent available |
| **Capacity Units** | Separate RCU/WCU | Shares with base table |
| **Max per table** | 20 | 5 |
| **Projected attributes** | Any subset | Any subset |

### 4.4 Index Key Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│              INDEX KEY STRUCTURE (Tối đa 2 attributes!)             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   GSI (Global Secondary Index):                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Option 1: [New Partition Key]                  → 1 attr    │   │
│   │  Option 2: [New Partition Key] + [New Sort Key] → 2 attrs   │   │
│   │                                                             │   │
│   │  ✓ Sort Key là optional                                     │   │
│   │  ✓ Partition Key có thể khác hoàn toàn base table           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   LSI (Local Secondary Index):                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Luôn: [Same Partition Key] + [Different Sort Key] → 2 attrs│   │
│   │                                                             │   │
│   │  ✗ Partition Key PHẢI giống base table                      │   │
│   │  ✗ Bắt buộc phải có Sort Key                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│   PROJECTED ATTRIBUTES (Khác với Key Attributes!)                   │
│                                                                     │
│   Ngoài 2 key attributes, index có thể project thêm attributes:     │
│                                                                     │
│   Projection Type  │ Mô tả                                          │
│   ─────────────────┼─────────────────────────────────────────────── │
│   KEYS_ONLY        │ Chỉ key attributes                             │
│   INCLUDE          │ Keys + chọn attributes cụ thể                  │
│   ALL              │ Tất cả attributes từ base table                │
│                                                                     │
│   ⚠️ Key structure vẫn chỉ tối đa 2 attributes!                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **Nguồn**: [Secondary Indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html)

---

## 5. Global Tables

### Global Tables là gì?

**Global Tables = Multi-region replication** - 1 table tự động sync giữa nhiều AWS regions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TẠI SAO CẦN GLOBAL TABLES?                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Scenario: App có users ở cả US và EU                               │
│                                                                     │
│  ❌ KHÔNG CÓ Global Tables:                                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  US User ──► US DynamoDB ◄── EU User                        │    │
│  │             (N. Virginia)     (cross-region ~200ms!)        │    │
│  │                                                             │    │
│  │  → EU users bị lag cao khi access data ở US                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✅ CÓ Global Tables:                                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  ┌──────────┐   auto-sync (<1s)   ┌──────────┐               │   │
│  │  │ US DDB   │◄──────────────────►│ EU DDB   │                │   │
│  │  └────▲─────┘                     └────▲─────┘               │   │
│  │       │ ~5ms                           │ ~5ms                │   │
│  │    US User                          EU User                 │    │
│  │                                                             │    │
│  │  → Mỗi user access local region → LOW LATENCY!              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Đặc điểm Global Tables

| Feature | Giải thích |
|---------|------------|
| **Active-Active** | Write được ở BẤT KỲ region nào (không phải chỉ 1 master) |
| **Auto sync** | Data tự động đồng bộ giữa regions (<1 giây) |
| **Conflict resolution** | Last Writer Wins (timestamp mới nhất thắng) |
| **No downtime** | Nếu 1 region chết, traffic tự động chuyển sang region khác |

### Khi nào dùng Global Tables?

| ✅ Nên dùng | ❌ Không cần |
|------------|-------------|
| Users ở nhiều regions (US, EU, Asia) | Users chỉ ở 1 region |
| Cần Disaster Recovery tự động | Chấp nhận downtime khi có sự cố |
| Cần low latency cho global users | Latency không quan trọng |

> **Nguồn**: [Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)

---

## 6. DynamoDB Streams

### Streams là gì?

**DynamoDB Streams = Event log** - Ghi lại MỌI thay đổi (INSERT/UPDATE/DELETE) xảy ra trong table.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TẠI SAO CẦN STREAMS?                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Scenario: E-commerce - Khi order được tạo, cần:                    │
│  • Gửi email confirmation cho customer                              │
│  • Update inventory                                                 │
│  • Ghi log cho audit                                                │
│                                                                     │
│  ❌ KHÔNG CÓ Streams (Polling):                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  App phải liên tục query: "Có order mới không?"             │    │
│  │  → Tốn RCU, không real-time, phức tạp                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✅ CÓ Streams (Event-driven):                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  Order Created ──► Stream Record ──► Lambda ──► Send Email  │    │
│  │                         │                                    │   │
│  │                         ├──► Lambda ──► Update Inventory    │    │
│  │                         │                                    │   │
│  │                         └──► Kinesis ──► Audit Log           │   │
│  │                                                             │    │
│  │  → Real-time, không cần polling, event-driven!              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Stream Record Types

| Type | Nội dung | Use case |
|------|----------|----------|
| **NEW_IMAGE** | Data SAU thay đổi | Sync data sang service khác |
| **OLD_IMAGE** | Data TRƯỚC thay đổi | Audit, rollback |
| **NEW_AND_OLD_IMAGES** | Cả trước và sau | So sánh thay đổi, analytics |
| **KEYS_ONLY** | Chỉ primary key | Lightweight triggers |

### Khi nào dùng Streams?

| ✅ Nên dùng | ❌ Không cần |
|------------|-------------|
| Cần react khi data thay đổi | Chỉ cần CRUD đơn giản |
| Sync data sang Elasticsearch, S3 | Không cần real-time processing |
| Audit/compliance logging | Không có event-driven workflows |
| Trigger notifications | |

> **Retention**: Stream records được giữ **24 giờ**

> **Nguồn**: [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)

---

## 7. DAX (DynamoDB Accelerator)

### DAX là gì?

**DAX = In-memory cache** đặt giữa App và DynamoDB để tăng tốc đọc.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TẠI SAO CẦN DAX?                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Scenario: Game leaderboard - 1 triệu users cùng xem top 100        │
│                                                                     │
│  ❌ KHÔNG CÓ DAX:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  1M users ──► DynamoDB                                      │    │
│  │              │                                               │   │
│  │              └─ 1M requests × 1 RCU = 1M RCU/giây            │   │
│  │              └─ Latency: ~5-10ms mỗi request                 │   │
│  │              └─ THROTTLING! (vượt quá capacity)              │   │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✅ CÓ DAX:                                                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  1M users ──► DAX (cache) ──► DynamoDB                      │    │
│  │              │                   │                           │   │
│  │              │ Cache HIT         │ Cache MISS (chỉ 1 lần)    │   │
│  │              │ ~0.001ms          │ ~5ms                      │   │
│  │              │ Không tốn RCU!    │                           │   │
│  │              │                                               │   │
│  │  → 1M requests nhưng chỉ tốn ~1 RCU (cache refresh)         │    │
│  │  → Latency: MICROSECONDS thay vì milliseconds               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### So sánh có/không có DAX

| Metric | Không có DAX | Có DAX |
|--------|-------------|--------|
| **Read latency** | 5-10ms | **Microseconds** (~0.001ms) |
| **RCU cost** | Mỗi request tốn RCU | Cache hit = **FREE** |
| **Hot partition** | Dễ bị throttle | Cache giảm tải |

### Khi nào dùng DAX?

| ✅ Nên dùng DAX | ❌ Không nên dùng |
|-----------------|-------------------|
| Read-heavy workloads (90%+ reads) | Write-heavy workloads |
| Cùng items được đọc nhiều lần | Mỗi item chỉ đọc 1 lần |
| Cần microsecond latency (gaming, trading) | Milliseconds là đủ |
| Muốn giảm RCU cost | Cần strongly consistent reads |

> **Lưu ý**: DAX chỉ hỗ trợ **Eventually Consistent Reads**. Nếu cần Strongly Consistent, phải bypass DAX.

> **Nguồn**: [DAX](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html)

### So sánh DAX vs Global Tables vs Streams

> [!IMPORTANT]
> **Exam Tip**: Phân biệt 3 features quan trọng này!

| Feature | Mục đích | Khi nào dùng |
|---------|----------|--------------|
| **DAX** | **Tăng tốc đọc** (in-memory cache) | Read-heavy, cần microsecond latency, giảm RCU cost |
| **Global Tables** | **Multi-region sync** | Global users, disaster recovery, low latency ở nhiều regions |
| **Streams** | **Capture changes** (event log) | Event-driven workflows, audit, sync to other services |

---

## 8. Transactions

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DYNAMODB TRANSACTIONS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ACID transactions across multiple items và tables                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    TRANSACTION EXAMPLE                      │    │
│  │                                                             │    │
│  │  Transfer $100 from Account A to Account B:                 │    │
│  │                                                             │    │
│  │  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐   │   │
│  │  │ Account A   │      │ Account B   │      │ Audit Log   │   │   │
│  │  │ -$100       │──────│ +$100       │──────│ Created     │   │   │
│  │  │             │      │             │      │             │   │   │
│  │  └─────────────┘      └─────────────┘      └─────────────┘   │   │
│  │         ▲                                           ▲       │    │
│  │         └───────────────────────────────────────────┘        │   │
│  │                                                             │    │
│  │  Atomic: Tất cả operations thành công hoặc tất cả fail      │    │
│  │  Consistent: Mọi reader thấy kết quả transaction            │    │
│  │  Isolated: Không có partial results nhìn thấy               │    │
│  │  Durable: Kết quả được persist ngay lập tức                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Transaction APIs:                                                  │
│  • TransactWriteItems: Multiple Put, Update, Delete, ConditionCheck │
│  • TransactGetItems: Multiple Get operations trong 1 request        │
│                                                                     │
│  Limits:                                                            │
│  • Maximum 25 items per transaction                                 │
│  • Maximum 4 MB payload                                             │
│  • Không thể target cùng item nhiều lần trong 1 transaction         │
│  • Items phải ở trong cùng AWS Region và Account                    │
│                                                                     │
│  Cost: 2x regular operations (read/write twice - prepare + commit)  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **Nguồn**: [DynamoDB Transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)

### 8.1 BatchWriteItem vs TransactWriteItems

```
┌─────────────────────────────────────────────────────────────────────┐
│         BATCH WRITE vs TRANSACTION (Quan trọng!)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BatchWriteItem (25 items/request):                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                            │
│  │ ✓   │ │ ✓   │ │ ✗   │ │ ✓   │ │ ✓   │  ← Partial success         │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘    (một số fail OK)        │
│  → KHÔNG có ACID                                                    │
│  → SDK có thể auto-split nếu > 25 items                             │
│  → Mỗi item write độc lập                                           │
│                                                                     │
│  TransactWriteItems (25 items max):                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                            │
│  │ ✓   │ │ ✓   │ │ ✓   │ │ ✓   │ │ ✓   │  ← ALL or NOTHING          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                            │
│  → CÓ ACID đầy đủ                                                   │
│  → KHÔNG bao giờ auto-split (hard limit 25)                         │
│  → Error nếu vượt 25 items                                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│   SO SÁNH:                                                          │
│                                                                     │
│   Operation           │ Limit        │ Auto-split? │ ACID?          │
│   ────────────────────┼──────────────┼─────────────┼────────────    │
│   BatchWriteItem      │ 25/request   │ ✅ Có thể   │ ❌ Không       │
│   TransactWriteItems  │ 25 total     │ ❌ Không    │ ✅ Có          │
│                                                                     │
│   ⚠️ Nếu cần ACID cho > 25 items → KHÔNG THỂ trong 1 transaction!    │
│   → Phải thiết kế lại data model hoặc chấp nhận eventual consistency│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 DynamoDB Operators

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DYNAMODB OPERATORS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   COMPARISON OPERATORS (Filter & Condition Expressions):            │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  Operator          │ Mô tả                    │ Ví dụ        │  │
│   │  ──────────────────┼──────────────────────────┼──────────── │   │
│   │  =                 │ Bằng                     │ age = 30     │  │
│   │  <>                │ Khác                     │ status <> X  │  │
│   │  <                 │ Nhỏ hơn                  │ price < 100  │  │
│   │  <=                │ Nhỏ hơn hoặc bằng       │ qty <= 10     │  │
│   │  >                 │ Lớn hơn                  │ score > 90   │  │
│   │  >=                │ Lớn hơn hoặc bằng       │ rating >= 4   │  │
│   │  BETWEEN           │ Trong khoảng             │ BETWEEN 1-10 │  │
│   │  IN                │ Trong danh sách          │ IN (a, b, c) │  │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   LOGICAL OPERATORS:                                                │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  AND               │ Tất cả conditions true   │ a=1 AND b=2  │  │
│   │  OR                │ Ít nhất 1 condition true │ a=1 OR b=2   │  │
│   │  NOT               │ Phủ định condition       │ NOT a=1      │  │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   FUNCTION OPERATORS:                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  attribute_exists(path)     │ Attribute tồn tại              │  │
│   │  attribute_not_exists(path) │ Attribute không tồn tại        │  │
│   │  attribute_type(path, type) │ Check type (S, N, B, SS...)    │  │
│   │  begins_with(path, substr)  │ String bắt đầu bằng            │  │
│   │  contains(path, operand)    │ String/Set chứa value          │  │
│   │  size(path)                 │ Kích thước attribute           │  │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   KEY CONDITION OPERATORS (chỉ cho Query trên Sort Key):            │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  =                         │ Exact match                     │  │
│   │  <, <=, >, >=              │ Range comparison                │  │
│   │  BETWEEN                   │ Range (inclusive)               │  │
│   │  begins_with               │ Prefix match (String only)      │  │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   UPDATE EXPRESSION OPERATORS:                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  SET                       │ Add/modify attributes           │  │
│   │  REMOVE                    │ Delete attributes               │  │
│   │  ADD                       │ Add to Number/Set               │  │
│   │  DELETE                    │ Remove from Set                 │  │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. TTL (Time to Live)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TIME TO LIVE (TTL)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Tự động xóa items sau một thời điểm được định trước                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  TTL EXAMPLE                                │    │
│  │                                                             │    │
│  │  Session Management:                                        │    │
│  │                                                             │    │
│  │  Item: {                                                    │    │
│  │    UserID: "user_123",                                      │    │
│  │    SessionData: {...},                                      │    │
│  │    ExpireAt: 1704067200  ← Unix timestamp (TTL attribute)   │    │
│  │  }                                                          │    │
│  │                                                             │    │
│  │  Timeline:                                                  │    │
│  │  │                                                           │   │
│  │  ├─ T+0: Item created, ExpireAt = current_time + 24h        │    │
│  │  ├─ T+12h: Item still exists ✓                              │    │
│  │  ├─ T+24h: Item automatically deleted 🗑️                     │    │
│  │  └─ T+48h: No trace of item                                  │   │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✓ Zero-cost deletion - Không tính WCU cho delete operations        │
│  ✓ Background process - DynamoDB tự động scan và delete             │
│  ✓ Eventually consistent - Items có thể tồn tại 48h sau TTL         │
│  ✓ DynamoDB Streams - Delete events vẫn được ghi lại                │
│                                                                     │
│  Use Cases:                                                         │
│  • Session data expiration                                          │
│  • Temporary data (verification codes, tokens)                      │
│  • Log rotation và data lifecycle management                        │
│  • Cache invalidation                                               │
│                                                                     │
│  Setup:                                                             │
│  1. Enable TTL trên table                                           │
│  2. Specify attribute name (ví dụ: "ExpireAt")                      │
│  3. Store Unix timestamp (seconds since epoch) trong attribute      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **Nguồn**: [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)

---

## 10. Best Practices

### 10.1 Data Modeling

| Practice | Mô tả |
|----------|-------|
| **Single-Table Design** | Một table cho nhiều entity types, sử dụng composite keys |
| **Access Patterns First** | Thiết kế schema dựa trên cách data sẽ được query |
| **Denormalization** | Duplicate data để tránh joins, optimize cho read |
| **Sparse Indexes** | Sử dụng GSI với projected attributes phù hợp |

### 10.2 Partition Key

| Do ✅ | Don't ❌ |
|-------|----------|
| Sử dụng UUID hoặc high-cardinality values | Sequential keys (timestamps, auto-increment IDs) |
| Hash của natural keys nếu cần | Low-cardinality (status, category, date) |
| Thêm prefix/suffix để distribute | Monotonically increasing values |

### 10.3 Read/Write Optimization

| Practice | Benefit |
|----------|---------|
| **Batch Operations** | BatchGetItem, BatchWriteItem (tối đa 25 items) |
| **Parallel Scan** | Phân chia scan workload cho large tables |
| **Projection Expressions** | Chỉ retrieve cần thiết attributes |
| **Pagination** | Sử dụng LastEvaluatedKey cho large result sets |
| **Conditional Writes** | Optimistic locking để tránh conflicts |

### 10.4 Cost Optimization

| Strategy | Mô tả |
|----------|-------|
| **Use On-Demand cho unpredictable** | Không cần capacity planning |
| **Use Provisioned cho steady traffic** | Reserved capacity giảm cost |
| **Enable Auto Scaling** | Scale capacity theo demand |
| **Use DAX for read-heavy** | Giảm read operations cost |
| **Table Classes** | Standard-IA cho infrequently accessed data |
| **TTL** | Tự động xóa không cần thiết data |

### 10.5 Security

| Feature | Implementation |
|---------|----------------|
| **Encryption at Rest** | AWS owned keys hoặc KMS CMK |
| **Encryption in Transit** | TLS 1.2+ |
| **IAM Policies** | Fine-grained access control |
| **VPC Endpoints** | Private connectivity |
| **Point-in-Time Recovery** | 35-day backup window |
| **Continuous Backups** | Cross-region backup |

> **Nguồn**: [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

## 11. Pricing

### 11.1 Core Pricing Components

| Component | On-Demand | Provisioned |
|-----------|-----------|-------------|
| **Write** | $1.25 per million WRUs | $0.00065 per WCU/hour |
| **Read** | $0.25 per million RRUs | $0.00013 per RCU/hour |
| **Storage** | $0.25 per GB/month (Standard) | $0.25 per GB/month |
| **Storage IA** | $0.10 per GB/month | $0.10 per GB/month |

### 11.2 Optional Features Pricing

| Feature | Giá |
|---------|-----|
| **DynamoDB Streams** | $0.02 per 100,000 read request units |
| **Global Tables** | Replicated write requests × số regions |
| **DAX** | EC2 instance cost cho DAX nodes |
| **Transactions** | 2× regular read/write cost |
| **On-Demand Backup** | $0.10 per GB |
| **Point-in-Time Recovery** | $0.20 per GB |
| **Data Transfer** | AWS standard data transfer rates |

### 11.3 Free Tier

| Resource | Limit |
|----------|-------|
| **Write Capacity** | 200 million WRUs/month |
| **Read Capacity** | 2.5 million RRUs/month |
| **Storage** | 25 GB |
| **Streams Read** | 2.5 million read request units |

### 11.4 Cost Example

```
Scenario: 1M writes/day (1KB each), 10M reads/day (4KB eventual)

On-Demand Mode:
• Write: 1M × $1.25/million = $1.25/day = $37.50/month
• Read: 10M × $0.25/million = $2.50/day = $75/month
• Storage (50GB): $0.25 × 50 = $12.50/month
• Total: ~$125/month

Provisioned Mode (with 100% utilization):
• WCU: 1M writes/day = ~12 WCU → $0.00065 × 12 × 730 = $5.69/month
• RCU: 10M reads/day (eventual = 0.5 RCU each) = ~58 RCU → $0.00013 × 58 × 730 = $5.50/month
• Storage: $12.50/month
• Total: ~$24/month (saving ~$100/month)

Note: Provisioned cần buffer capacity, actual cost sẽ cao hơn nếu utilization < 80%
```

> **Nguồn**: [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)

---

## Summary

| Feature | Key Point |
|---------|-----------|
| **Type** | NoSQL key-value và document database |
| **Performance** | Single-digit millisecond latency ở mọi scale |
| **Capacity Modes** | On-Demand (pay-per-request) hoặc Provisioned (capacity-based) |
| **Primary Key** | Simple (Partition Key) hoặc Composite (Partition + Sort Key) |
| **Secondary Indexes** | GSI (khác partition key) và LSI (cùng partition key) |
| **Global Tables** | Multi-region active-active replication |
| **Streams** | Change data capture cho event-driven architectures |
| **DAX** | In-memory caching (microsecond latency) |
| **Transactions** | ACID operations trên multiple items/tables |
| **TTL** | Tự động xóa items theo timestamp |

---

_Đánh dấu [x] trong README.md khi hoàn thành topic này_
