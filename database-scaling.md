# Database Scaling: Relational vs NoSQL

## Mục lục

- [1. Scaling là gì?](#1-scaling-là-gì)
- [2. Vertical Scaling (Scale Up)](#2-vertical-scaling-scale-up)
- [3. Horizontal Scaling (Scale Out)](#3-horizontal-scaling-scale-out)
- [4. Replication vs Sharding — Hai cách Scale Horizontally](#4-replication-vs-sharding--hai-cách-scale-horizontally)
- [5. Tại sao Relational DB khó Scale Horizontally?](#5-tại-sao-relational-db-khó-scale-horizontally)
- [6. Tại sao NoSQL dễ Scale Horizontally?](#6-tại-sao-nosql-dễ-scale-horizontally)
- [7. Ví dụ thực tế: Hệ thống E-Commerce](#7-ví-dụ-thực-tế-hệ-thống-e-commerce)
- [8. Ví dụ thực tế: Hệ thống Chat/Messaging](#8-ví-dụ-thực-tế-hệ-thống-chatmessaging)
- [9. So sánh tổng hợp](#9-so-sánh-tổng-hợp)
- [10. Trong AWS](#10-trong-aws)
- [11. Kết luận](#11-kết-luận)
- [12. NoSQL Data Modeling — Embed vs Reference](#12-nosql-data-modeling--embed-vs-reference)
- [13. Consistency Deep-Dive — Hai loại consistency khác nhau](#13-consistency-deep-dive--hai-loại-consistency-khác-nhau)
- [14. CRUD Thực tế trong NoSQL](#14-crud-thực-tế-trong-nosql)
- [15. SQL vs MongoDB vs DynamoDB](#15-sql-vs-mongodb-vs-dynamodb)

---

## 1. Scaling là gì?

**Scaling** là quá trình tăng khả năng xử lý của hệ thống khi lượng dữ liệu hoặc traffic tăng lên.

Hãy tưởng tượng bạn có **1 quán phở** đang đông khách:

- **Vertical Scaling** = Mở rộng quán hiện tại: thêm bàn, mở rộng bếp, thuê đầu bếp giỏi hơn → nhưng quán chỉ có thể mở rộng đến một giới hạn nhất định (diện tích có hạn).
- **Horizontal Scaling** = Mở thêm chi nhánh mới: mở thêm quán phở ở các vị trí khác → gần như không giới hạn số chi nhánh.

```
┌─────────────────────────────────────────────────────────────┐
│                    VERTICAL SCALING                         │
│                                                             │
│   Trước:          Sau:                                      │
│   ┌──────┐        ┌──────────────┐                          │
│   │Server│   →    │  BIG Server  │  (Thêm CPU, RAM, SSD)   │
│   │ 4 CPU│        │  32 CPU      │                          │
│   │ 8 GB │        │  128 GB      │                          │
│   └──────┘        └──────────────┘                          │
│                                                             │
│   → Có giới hạn vật lý (không thể tăng mãi)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   HORIZONTAL SCALING                        │
│                                                             │
│   Trước:          Sau:                                      │
│   ┌──────┐        ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│   │Server│   →    │Server│ │Server│ │Server│ │Server│      │
│   │ 4 CPU│        │ 4 CPU│ │ 4 CPU│ │ 4 CPU│ │ 4 CPU│     │
│   └──────┘        └──────┘ └──────┘ └──────┘ └──────┘     │
│                                                             │
│   → Gần như không giới hạn (thêm server thoải mái)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Vertical Scaling (Scale Up)

### Cách hoạt động

Tăng tài nguyên (CPU, RAM, Storage) cho **một server duy nhất**.

### Ưu điểm

- **Đơn giản**: Không cần thay đổi code, chỉ cần nâng cấp phần cứng.
- **Consistency dễ đảm bảo**: Tất cả dữ liệu trên 1 server → không lo đồng bộ.
- **Không cần thay đổi kiến trúc**: Ứng dụng chạy y như cũ.

### Nhược điểm

- **Có giới hạn vật lý**: Server lớn nhất cũng chỉ có một mức tài nguyên tối đa (ví dụ AWS RDS lớn nhất: `db.r6g.16xlarge` = 64 vCPU, 512 GB RAM).
- **Single Point of Failure**: Nếu server này chết → toàn bộ hệ thống sập.
- **Chi phí tăng theo cấp số nhân**: Server càng lớn → giá tăng rất nhanh, không tuyến tính.

### Ví dụ cụ thể

```
Ban đầu: 100 users → Server: 2 CPU, 4 GB RAM    → $50/tháng
Tăng:    1,000 users → Server: 8 CPU, 32 GB RAM  → $400/tháng
Tăng:    10,000 users → Server: 32 CPU, 128 GB    → $3,000/tháng
Tăng:    100,000 users → Server: 64 CPU, 512 GB   → $10,000/tháng
Tăng:    1,000,000 users → ??? KHÔNG THỂ TĂNG NỮA! (đã max phần cứng)
```

---

## 3. Horizontal Scaling (Scale Out)

### Cách hoạt động

Thêm **nhiều server nhỏ** hơn, mỗi server chịu trách nhiệm một phần dữ liệu.

### Ưu điểm

- **Gần như không giới hạn**: Cứ thêm server khi cần.
- **Fault tolerant**: 1 server chết → các server khác vẫn hoạt động.
- **Chi phí tuyến tính**: Thêm 1 server ≈ thêm cùng 1 khoản chi phí.

### Nhược điểm

- **Phức tạp hơn**: Cần quản lý nhiều server, đồng bộ dữ liệu.
- **Consistency khó đảm bảo hơn**: Dữ liệu phân tán → có thể đọc dữ liệu cũ (eventual consistency).
- **Code phải thiết kế phù hợp**: Không phải ứng dụng nào cũng scale out được dễ dàng.

### Ví dụ cụ thể

```
Ban đầu: 100 users → 1 Server (4 CPU, 8 GB)      → $100/tháng
Tăng:    1,000 users → 3 Servers                   → $300/tháng
Tăng:    10,000 users → 10 Servers                  → $1,000/tháng
Tăng:    100,000 users → 50 Servers                 → $5,000/tháng
Tăng:    1,000,000 users → 200 Servers              → $20,000/tháng
Tăng:    10,000,000 users → 500 Servers             → $50,000/tháng
          → VẪN CÒN CÓ THỂ TĂNG TIẾP!
```

---

## 4. Replication vs Sharding — Hai cách Scale Horizontally

Đây là 2 khái niệm rất hay bị nhầm lẫn. Cả hai đều thêm server, nhưng **mục đích hoàn toàn khác nhau**.

### 4.1. Replication — "Photocopy" dữ liệu

**Replication** = sao chép **toàn bộ dữ liệu giống hệt nhau** sang các server khác.

```
┌──────────────────────────────────────────────────────────────────┐
│                       REPLICATION                                │
│          "Photocopy" — mỗi server có BẢN SAO GIỐNG HỆT          │
│                                                                  │
│   Server 1 (Primary)    Server 2 (Replica)   Server 3 (Replica) │
│   ┌──────────────┐      ┌──────────────┐     ┌──────────────┐   │
│   │ User A       │      │ User A       │     │ User A       │   │
│   │ User B       │ ───→ │ User B       │ ──→ │ User B       │   │
│   │ User C       │      │ User C       │     │ User C       │   │
│   │ User D       │      │ User D       │     │ User D       │   │
│   └──────────────┘      └──────────────┘     └──────────────┘   │
│                                                                  │
│   → 3 servers đều có CÙNG DỮ LIỆU (A, B, C, D)                 │
│   → WRITE chỉ vào Primary, sau đó sync sang Replicas            │
└──────────────────────────────────────────────────────────────────┘
```

**Tác dụng của Replication:**

| Tác dụng | Giải thích | Ví dụ |
|---|---|---|
| **High Availability** | Server chính chết → replica lên thay ngay | RDS Multi-AZ: Primary chết → Standby tự lên thay, downtime ~30s |
| **Scale READ** | Chia tải đọc cho nhiều replicas | 10,000 người xem sản phẩm → chia cho 3 replicas |
| **Disaster Recovery** | Dữ liệu có bản sao → không sợ mất | Datacenter cháy → replica ở datacenter khác vẫn còn |
| **Giảm latency** | Đặt replica gần user | User ở VN đọc replica Singapore (10ms) thay vì US (200ms) |

> **Hạn chế**: Replication **CHỈ scale READ**, WRITE vẫn chỉ đi vào 1 Primary duy nhất.

### 4.2. Sharding — "Chia bánh" dữ liệu

**Sharding** = chia dữ liệu ra nhiều server, mỗi server giữ **một phần dữ liệu khác nhau**.

```
┌──────────────────────────────────────────────────────────────────┐
│                        SHARDING                                  │
│          "Chia bánh" — mỗi server giữ 1 PHẦN dữ liệu           │
│                                                                  │
│   Shard 1               Shard 2              Shard 3            │
│   ┌──────────────┐      ┌──────────────┐     ┌──────────────┐   │
│   │ User A       │      │ User C       │     │ User E       │   │
│   │ User B       │      │ User D       │     │ User F       │   │
│   └──────────────┘      └──────────────┘     └──────────────┘   │
│                                                                  │
│   → Mỗi server có DỮ LIỆU KHÁC NHAU                             │
│   → Mỗi shard xử lý cả READ + WRITE cho phần data của mình     │
└──────────────────────────────────────────────────────────────────┘
```

**Tác dụng của Sharding:**

| Tác dụng | Giải thích | Ví dụ |
|---|---|---|
| **Scale WRITE** | Chia tải ghi cho nhiều servers | 100K đơn hàng/phút → 10 shards × 10K writes mỗi shard |
| **Scale Storage** | Mỗi server chỉ giữ 1 phần data | 10TB → 10 shards × 1TB, không cần 1 server khổng lồ |
| **Scale READ + WRITE** | Mỗi shard xử lý cả 2 | Query user A → chỉ hỏi shard chứa user A → nhanh |

### 4.3. So sánh Replication vs Sharding

| | Replication | Sharding |
|---|---|---|
| **Ví dụ đời thường** | 3 thư viện, mỗi nơi có **cùng tất cả** sách | 3 thư viện, mỗi nơi giữ **thể loại khác nhau** |
| **Dữ liệu** | **Giống nhau** trên mỗi server | **Khác nhau** trên mỗi server |
| **Scale READ** | ✅ Chia read cho nhiều replicas | ✅ Mỗi shard đọc phần của mình |
| **Scale WRITE** | ❌ Vẫn 1 Primary | ✅ Mỗi shard write phần của mình |
| **Dung lượng** | Mỗi server chứa **TOÀN BỘ** data | Mỗi server chứa **1 PHẦN** data |
| **Giải quyết** | Server chết / đọc chậm | Data quá lớn / ghi chậm |
| **1 từ khóa** | **Availability + Read** | **Capacity + Write** |

### 4.4. Thực tế: Dùng CẢ HAI cùng lúc

```
┌──────────────────────────────────────────────────────────────────┐
│          SHARDING + REPLICATION (thực tế production)            │
│                                                                  │
│   Shard 1                          Shard 2                      │
│   ┌─────────────┐                  ┌─────────────┐              │
│   │ Primary     │                  │ Primary     │              │
│   │ User A, B   │                  │ User C, D   │              │
│   └──┬──────┬───┘                  └──┬──────┬───┘              │
│      │      │                        │      │                   │
│      ▼      ▼                        ▼      ▼                   │
│   ┌──────┐┌──────┐               ┌──────┐┌──────┐              │
│   │Rep 1 ││Rep 2 │               │Rep 1 ││Rep 2 │              │
│   │A, B  ││A, B  │               │C, D  ││C, D  │              │
│   └──────┘└──────┘               └──────┘└──────┘              │
│                                                                  │
│   Sharding → chia data ra nhiều phần (scale write + storage)    │
│   Replication → sao chép MỖI shard (HA + scale read)           │
└──────────────────────────────────────────────────────────────────┘
```

### 4.5. Vậy cái nào mới là "Horizontal Scaling thực sự"?

```
"Relational DB khó scale horizontally"

                Replication              Sharding
SQL (RDS):      ✅ Làm được (replicas)   ❌ Rất khó (JOIN, ACID, FK)
NoSQL (Dynamo): ✅ Làm được              ✅ Tự động, dễ dàng

→ Cả hai đều replication được
→ Nhưng SHARDING mới là thứ khó
→ Sharding mới scale được WRITE → đây là "horizontal scaling thực sự"
```

> **Khi nói "horizontal scaling", người ta chủ yếu nói về SHARDING** — chia dữ liệu ra nhiều server để mỗi server xử lý write cho phần của mình. Replication chỉ là "horizontal scaling nửa vời" vì chỉ scale được read.

> Trong AWS: **DynamoDB tự làm cả hai** (tự shard + tự replicate 3 copies across 3 AZs). **RDS** chỉ hỗ trợ replication (Multi-AZ, Read Replicas), còn sharding thì phải **tự làm** ở tầng application.

---

## 5. Tại sao Relational DB khó Scale Horizontally?

Đây là phần quan trọng nhất. Có **3 lý do chính**:

### 4.1. Vấn đề JOIN giữa các bảng

Relational DB lưu dữ liệu theo **bảng có quan hệ**. Khi query, bạn thường phải **JOIN** nhiều bảng lại.

**Ví dụ: Hệ thống quản lý đơn hàng**

```sql
-- Bảng Users
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

-- Bảng Products
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2)
);

-- Bảng Orders
CREATE TABLE orders (
    id INT PRIMARY KEY,
    user_id INT REFERENCES users(id),      -- FK → users
    product_id INT REFERENCES products(id), -- FK → products
    quantity INT,
    order_date DATE
);
```

**Query lấy thông tin đơn hàng:**

```sql
SELECT u.name, p.name AS product, o.quantity, o.order_date
FROM orders o
JOIN users u ON o.user_id = u.id          -- JOIN bảng users
JOIN products p ON o.product_id = p.id    -- JOIN bảng products
WHERE o.order_date > '2024-01-01';
```

**Vấn đề khi scale horizontally (chia ra 3 servers):**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DỮ LIỆU BỊ CHIA RA 3 SERVERS                   │
│                                                                     │
│   Server 1           Server 2           Server 3                    │
│   ┌──────────┐       ┌──────────┐       ┌──────────┐              │
│   │ users    │       │ products │       │ orders   │               │
│   │ id=1..100│       │ id=1..500│       │ id=1..1M │              │
│   └──────────┘       └──────────┘       └──────────┘              │
│                                                                     │
│   Query: SELECT u.name, p.name FROM orders o                        │
│          JOIN users u ON o.user_id = u.id                           │
│          JOIN products p ON o.product_id = p.id                     │
│                                                                     │
│   → Server 3 có orders, nhưng cần dữ liệu từ Server 1 (users)     │
│     VÀ Server 2 (products)                                         │
│   → Phải gửi request qua NETWORK giữa các servers                  │
│   → RẤT CHẬM so với truy cập dữ liệu local                        │
│   → Càng nhiều JOINs → càng nhiều network calls → càng chậm        │
└─────────────────────────────────────────────────────────────────────┘
```

> **Kết luận**: JOIN giữa các bảng nằm trên các server khác nhau → phải truyền dữ liệu qua network → chậm và phức tạp.

### 4.2. Vấn đề ACID và Transactions

Relational DB đảm bảo **ACID**:

| Tính chất | Ý nghĩa | Ví dụ |
|---|---|---|
| **A**tomicity | Một transaction hoặc thành công toàn bộ, hoặc thất bại toàn bộ | Chuyển tiền: trừ A và cộng B phải cùng thành công |
| **C**onsistency | Dữ liệu luôn hợp lệ sau mỗi transaction | Tổng tiền trong hệ thống không đổi sau chuyển tiền |
| **I**solation | Các transaction chạy đồng thời không ảnh hưởng nhau | 2 người cùng mua hàng không bị conflict |
| **D**urability | Dữ liệu đã commit thì không bao giờ mất | Mất điện → dữ liệu vẫn còn |

**Ví dụ: Chuyển tiền ngân hàng**

```sql
-- Transaction: Chuyển 1,000,000 VND từ A sang B
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 1000000 WHERE user_id = 'A';
-- Kiểm tra: balance của A >= 0 (constraint)

UPDATE accounts SET balance = balance + 1000000 WHERE user_id = 'B';

COMMIT;
-- Nếu bất kỳ bước nào lỗi → ROLLBACK toàn bộ
```

**Vấn đề khi dữ liệu nằm trên nhiều servers:**

```
┌─────────────────────────────────────────────────────────────────────┐
│          TRANSACTION CHUYỂN TIỀN GIỮA 2 SERVERS                    │
│                                                                     │
│   Server 1 (có tài khoản A)    Server 2 (có tài khoản B)          │
│   ┌──────────────────┐         ┌──────────────────┐               │
│   │ A: 5,000,000 VND │         │ B: 2,000,000 VND │               │
│   └──────────────────┘         └──────────────────┘               │
│                                                                     │
│   Bước 1: Trừ tiền A trên Server 1  ✅                             │
│   Bước 2: Cộng tiền B trên Server 2  ❌ (Server 2 bị lỗi!)       │
│                                                                     │
│   → Phải ROLLBACK bước 1 trên Server 1                             │
│   → Cần "2-Phase Commit" protocol để đồng bộ                       │
│   → Rất chậm, phức tạp, dễ deadlock                                │
│   → Nếu network bị đứt giữa 2 servers → DỮ LIỆU INCONSISTENT!    │
└─────────────────────────────────────────────────────────────────────┘
```

> **Kết luận**: Đảm bảo ACID khi dữ liệu phân tán trên nhiều server rất khó → cần 2-Phase Commit (2PC) → chậm và phức tạp.

### 4.3. Vấn đề Foreign Keys và Data Integrity

```sql
-- Foreign Key: order.user_id PHẢI tồn tại trong bảng users
INSERT INTO orders (user_id, product_id, quantity)
VALUES (999, 1, 5);
-- → DB phải kiểm tra: user_id=999 có tồn tại không?
-- → Nếu bảng users ở SERVER KHÁC → phải gọi qua network để verify
-- → CHẬM!
```

```
┌─────────────────────────────────────────────────────────────────────┐
│           FOREIGN KEY CHECK GIỮA CÁC SERVERS                       │
│                                                                     │
│   Server 1 (orders)              Server 2 (users)                  │
│   ┌────────────────┐             ┌────────────────┐                │
│   │ INSERT order   │──verify──→  │ user_id=999    │                │
│   │ user_id=999    │             │ exists?        │                │
│   └────────────────┘             └────────────────┘                │
│                                                                     │
│   Mỗi INSERT/UPDATE đều phải check FK qua network                  │
│   → Latency tăng                                                    │
│   → Throughput giảm                                                 │
│   → Nếu network lỗi → không INSERT được                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Tại sao NoSQL dễ Scale Horizontally?

NoSQL giải quyết các vấn đề trên bằng cách **thay đổi cách lưu trữ dữ liệu**.

### 5.1. Không có JOIN → Mỗi record chứa đầy đủ thông tin

**Cùng ví dụ đơn hàng, nhưng trong DynamoDB (NoSQL):**

```json
// Mỗi item trong DynamoDB chứa ĐẦY ĐỦ thông tin, không cần JOIN
{
    "order_id": "ORD-001",
    "order_date": "2024-06-15",
    "quantity": 2,

    // Thông tin user được NHÚNG trực tiếp vào (denormalized)
    "user": {
        "id": "U-123",
        "name": "Nguyễn Văn A",
        "email": "a@example.com"
    },

    // Thông tin product cũng được NHÚNG trực tiếp
    "product": {
        "id": "P-456",
        "name": "iPhone 15",
        "price": 25000000
    }
}
```

```
┌─────────────────────────────────────────────────────────────────────┐
│          NOSQL: MỖI RECORD ĐẦY ĐỦ THÔNG TIN                       │
│                                                                     │
│   Server 1                Server 2                Server 3          │
│   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐   │
│   │ ORD-001     │        │ ORD-501     │        │ ORD-1001    │    │
│   │  user: {...}│        │  user: {...}│        │  user: {...}│    │
│   │  prod: {...}│        │  prod: {...}│        │  prod: {...}│    │
│   │             │        │             │        │             │    │
│   │ ORD-002     │        │ ORD-502     │        │ ORD-1002    │    │
│   │  user: {...}│        │  user: {...}│        │  user: {...}│    │
│   │  prod: {...}│        │  prod: {...}│        │  prod: {...}│    │
│   └─────────────┘        └─────────────┘        └─────────────┘   │
│                                                                     │
│   Query: Lấy đơn hàng ORD-501?                                     │
│   → Chỉ cần hỏi Server 2, KHÔNG cần hỏi server nào khác!          │
│   → Nhanh, đơn giản, không phụ thuộc server khác                   │
└─────────────────────────────────────────────────────────────────────┘
```

> **Trade-off**: Dữ liệu bị **lặp lại** (user info lặp ở mỗi order). Nhưng disk rẻ → chấp nhận được đổi lấy tốc độ.

### 5.2. Eventual Consistency thay vì Strong Consistency

NoSQL chấp nhận **BASE** model:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENTUAL CONSISTENCY                              │
│                                                                     │
│   Thời điểm T0: User A cập nhật tên thành "Nguyễn Văn B"           │
│                                                                     │
│   Server 1 (write)       Server 2 (replica)      Server 3 (replica)│
│   ┌─────────────┐       ┌─────────────┐         ┌─────────────┐   │
│   │ name: "B"   │  ──→  │ name: "A"   │   ──→   │ name: "A"   │   │
│   │ (đã update) │  sync │ (chưa sync) │   sync  │ (chưa sync) │   │
│   └─────────────┘       └─────────────┘         └─────────────┘   │
│                                                                     │
│   Thời điểm T0 + 50ms:                                             │
│   ┌─────────────┐       ┌─────────────┐         ┌─────────────┐   │
│   │ name: "B"   │       │ name: "B"   │         │ name: "A"   │   │
│   │ (đã update) │       │ (đã sync)   │         │ (chưa sync) │   │
│   └─────────────┘       └─────────────┘         └─────────────┘   │
│                                                                     │
│   Thời điểm T0 + 100ms: TẤT CẢ đã sync                            │
│   ┌─────────────┐       ┌─────────────┐         ┌─────────────┐   │
│   │ name: "B"   │       │ name: "B"   │         │ name: "B"   │   │
│   └─────────────┘       └─────────────┘         └─────────────┘   │
│                                                                     │
│   → Trong khoảng 50-100ms, đọc từ Server 3 sẽ thấy dữ liệu CŨ    │
│   → Nhưng SAU ĐÓ, tất cả sẽ consistent                            │
│   → Đổi lấy: tốc độ write cực nhanh + dễ scale                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3. Partition Key → Tự động chia dữ liệu

NoSQL dùng **Partition Key** để quyết định dữ liệu nằm trên server nào:

```
┌─────────────────────────────────────────────────────────────────────┐
│           PARTITION KEY TRONG DYNAMODB                               │
│                                                                     │
│   Partition Key = user_id                                           │
│   Hash function quyết định dữ liệu đi đâu                         │
│                                                                     │
│   hash("U-001") = 0x3A → Partition 1                                │
│   hash("U-002") = 0x7F → Partition 2                                │
│   hash("U-003") = 0xB2 → Partition 3                                │
│   hash("U-004") = 0x15 → Partition 1                                │
│                                                                     │
│   Partition 1          Partition 2          Partition 3              │
│   ┌──────────┐        ┌──────────┐        ┌──────────┐            │
│   │ U-001    │        │ U-002    │        │ U-003    │             │
│   │ U-004    │        │          │        │          │             │
│   └──────────┘        └──────────┘        └──────────┘            │
│                                                                     │
│   Khi cần thêm capacity → DynamoDB tự chia thêm partitions         │
│   → Hoàn toàn tự động, không cần can thiệp                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Ví dụ thực tế: Hệ thống E-Commerce

### Scenario: Shopee/Tiki với 10 triệu users

#### Cách tiếp cận với Relational DB (MySQL/PostgreSQL)

```
Ban đầu: 1 server MySQL
├── Bảng users (10 triệu rows)
├── Bảng products (5 triệu rows)
├── Bảng orders (100 triệu rows)
├── Bảng order_items (500 triệu rows)
├── Bảng reviews (50 triệu rows)
└── Bảng payments (100 triệu rows)

Vấn đề khi traffic tăng:
1. Query "Lấy tất cả đơn hàng của user X với chi tiết sản phẩm"
   → JOIN 4 bảng → chậm khi dữ liệu lớn

2. Mùa Flash Sale: 100,000 đơn hàng/phút
   → 1 server MySQL không xử lý nổi
   → Scale vertical: upgrade lên server 64 CPU?
   → Vẫn không đủ!

3. Muốn scale horizontal (sharding):
   → Chia users theo user_id range (1-5M → Server1, 5M-10M → Server2)
   → Nhưng query "tất cả orders của product X" phải hỏi TẤT CẢ servers
   → Cross-shard JOIN rất chậm
   → Code phải viết lại hoàn toàn để handle sharding logic
```

#### Cách tiếp cận với NoSQL (DynamoDB)

```
DynamoDB tables:
├── UserOrders (PK: user_id, SK: order_date#order_id)
│   → Chứa thông tin đầy đủ: user + order + products
│   → Query tất cả orders của 1 user: chỉ cần query 1 partition
│
├── ProductCatalog (PK: product_id)
│   → Chứa đầy đủ thông tin product
│   → Get product: single item read, cực nhanh
│
└── UserProfiles (PK: user_id)
    → Chứa đầy đủ thông tin user

Khi traffic tăng:
1. Flash Sale 100,000 đơn hàng/phút?
   → DynamoDB tự thêm partitions
   → Chỉ cần tăng WCU (Write Capacity Units)
   → Hoặc dùng On-Demand mode → tự scale

2. 10 triệu users?
   → Dữ liệu tự phân tán đều trên hàng nghìn partitions
   → Mỗi query chỉ access 1 partition → nhanh

3. Không cần viết lại code, không cần quản lý servers
```

---

## 8. Ví dụ thực tế: Hệ thống Chat/Messaging

### Scenario: Ứng dụng chat như Zalo/Messenger

#### Relational DB approach

```sql
-- Schema
CREATE TABLE messages (
    id BIGINT PRIMARY KEY,
    conversation_id INT,
    sender_id INT REFERENCES users(id),
    content TEXT,
    sent_at TIMESTAMP,
    read_at TIMESTAMP
);

-- Query: Lấy 50 tin nhắn mới nhất của conversation
SELECT m.*, u.name AS sender_name, u.avatar
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = 12345
ORDER BY m.sent_at DESC
LIMIT 50;

-- Vấn đề:
-- 1 tỷ messages → 1 bảng messages quá lớn
-- JOIN với users table mỗi lần load chat
-- Index trên conversation_id + sent_at rất lớn
-- Scale horizontal? → messages và users ở servers khác nhau → JOIN chậm
```

#### NoSQL (DynamoDB) approach

```json
// Mỗi message chứa đầy đủ thông tin sender
// Table: Messages
// PK: conversation_id, SK: sent_at#message_id
{
    "conversation_id": "CONV-12345",
    "sent_at#message_id": "2024-06-15T10:30:00#MSG-789",
    "content": "Xin chào!",
    "sender": {
        "id": "U-001",
        "name": "Nguyễn Văn A",
        "avatar": "https://cdn.example.com/avatar/001.jpg"
    },
    "read_by": ["U-002", "U-003"]
}

// Query: Lấy 50 tin nhắn mới nhất
// → Chỉ cần query trên 1 partition (conversation_id)
// → Không cần JOIN
// → Cực nhanh, dù có 1 tỷ messages tổng cộng
// → Scale horizontal tự động
```

---

## 9. So sánh tổng hợp

### ACID vs BASE

```
┌──────────────────────────────────────────────────────────────┐
│                     ACID (Relational DB)                      │
│                                                              │
│   ✅ Dữ liệu LUÔN chính xác                                 │
│   ✅ Phù hợp: Ngân hàng, tài chính, kế toán                 │
│   ❌ Khó scale horizontal                                    │
│   ❌ Chậm hơn khi phân tán                                   │
│                                                              │
│   Ví dụ: Chuyển tiền ngân hàng                               │
│   → PHẢI đảm bảo trừ A và cộng B CÙNG thành công            │
│   → Không chấp nhận "eventually" correct                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      BASE (NoSQL)                            │
│                                                              │
│   ✅ Scale horizontal dễ dàng                                │
│   ✅ Throughput cao, latency thấp                            │
│   ❌ Dữ liệu có thể "tạm thời" không nhất quán             │
│   ❌ Dữ liệu lặp lại (denormalized)                         │
│                                                              │
│   Ví dụ: Like trên Facebook                                 │
│   → 1 giây chênh lệch giữa "1,000 likes" và "1,001 likes"  │
│   → Không ai quan tâm → chấp nhận được                      │
└──────────────────────────────────────────────────────────────┘
```

### Bảng so sánh chi tiết

| Tiêu chí | Relational DB (SQL) | NoSQL |
|---|---|---|
| **Data Model** | Bảng + quan hệ (normalized) | Document, Key-Value, Graph (denormalized) |
| **Schema** | Cố định, phải định nghĩa trước | Linh hoạt, mỗi record có thể khác nhau |
| **Scaling chính** | Vertical (scale up) | Horizontal (scale out) |
| **JOIN** | Hỗ trợ, rất mạnh | Không hỗ trợ hoặc hạn chế |
| **Transactions** | ACID - strong consistency | BASE - eventual consistency |
| **Query** | SQL - rất linh hoạt | API-based - hạn chế hơn |
| **Phù hợp cho** | Dữ liệu có quan hệ phức tạp, cần chính xác | Dữ liệu lớn, cần speed, cần scale |
| **Ví dụ AWS** | RDS, Aurora | DynamoDB, ElastiCache, DocumentDB |
| **Ví dụ ngoài** | MySQL, PostgreSQL, Oracle | MongoDB, Cassandra, Redis |
| **Max scale** | Giới hạn bởi phần cứng lớn nhất | Gần như không giới hạn |

---

## 10. Trong AWS

### RDS (Relational)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RDS SCALING OPTIONS                             │
│                                                                     │
│   Vertical Scaling:                                                 │
│   db.t3.micro → db.t3.medium → db.r6g.xlarge → db.r6g.16xlarge    │
│   (2 vCPU)      (2 vCPU)       (4 vCPU)         (64 vCPU)         │
│   → Có giới hạn: max 64 vCPU, 512 GB RAM                          │
│                                                                     │
│   Read Replicas (một dạng horizontal scaling CHỈ cho READ):        │
│   ┌──────────┐     ┌──────────┐                                    │
│   │  Primary │────→│ Replica 1│  (read-only)                       │
│   │  (R+W)   │────→│ Replica 2│  (read-only)                       │
│   │          │────→│ Replica 3│  (read-only)                        │
│   └──────────┘     └──────────┘                                    │
│   → Max 5-15 replicas tùy engine                                   │
│   → CHỈ scale READ, KHÔNG scale WRITE                              │
│   → Write vẫn phải đi qua 1 Primary duy nhất                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Aurora (Relational - tốt hơn RDS)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AURORA SCALING OPTIONS                            │
│                                                                     │
│   → Lên tới 15 Read Replicas (tốt hơn RDS)                        │
│   → Auto Scaling replicas dựa trên load                            │
│   → Aurora Serverless: tự scale compute                            │
│   → Storage tự động tăng (max 128 TB)                              │
│                                                                     │
│   NHƯNG VẪN:                                                        │
│   → 1 Primary instance cho WRITE                                    │
│   → Không thể chia dữ liệu ra nhiều write nodes dễ dàng            │
│   → Multi-Master có nhưng giới hạn (max 4 write nodes)             │
└─────────────────────────────────────────────────────────────────────┘
```

### DynamoDB (NoSQL)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   DYNAMODB SCALING                                  │
│                                                                     │
│   Horizontal Scaling TỰ ĐỘNG:                                      │
│                                                                     │
│   Traffic thấp:                                                     │
│   ┌────────┐ ┌────────┐ ┌────────┐                                │
│   │ Part 1 │ │ Part 2 │ │ Part 3 │      (3 partitions)            │
│   └────────┘ └────────┘ └────────┘                                │
│                                                                     │
│   Traffic cao (tự động split):                                      │
│   ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐        │
│   │ P1 ││ P2 ││ P3 ││ P4 ││ P5 ││ P6 ││ P7 ││ P8 ││ P9 │       │
│   └────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘        │
│   (9 partitions - tự động, không cần can thiệp)                    │
│                                                                     │
│   ✅ Không giới hạn throughput (On-Demand mode)                     │
│   ✅ Không giới hạn storage                                        │
│   ✅ Single-digit millisecond latency dù TB dữ liệu               │
│   ✅ Không cần quản lý servers                                     │
│   ✅ CẢ READ VÀ WRITE đều scale                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. Kết luận

### Câu nói gốc: "Relational databases cannot scale horizontally as easily as NoSQL databases"

**→ ĐÚNG ✅**

Tóm tắt lý do:

1. **JOIN operations** → dữ liệu phân tán trên nhiều server → JOIN qua network rất chậm.
2. **ACID transactions** → đảm bảo consistency khi dữ liệu phân tán cần 2-Phase Commit → phức tạp, chậm.
3. **Foreign Keys** → kiểm tra ràng buộc giữa các server → overhead lớn.
4. **Schema cứng** → thay đổi schema trên nhiều server phức tạp.

NoSQL giải quyết bằng cách:
1. **Denormalization** → không cần JOIN.
2. **Eventual Consistency** → chấp nhận dữ liệu tạm thời chưa đồng bộ.
3. **Partition Key** → tự động chia dữ liệu, mỗi query chỉ cần 1 partition.

### Khi nào dùng cái nào?

| Use Case | Nên dùng | Lý do |
|---|---|---|
| Ngân hàng, tài chính | **Relational (RDS/Aurora)** | Cần ACID, chính xác tuyệt đối |
| E-commerce catalog | **NoSQL (DynamoDB)** | Dữ liệu lớn, cần speed |
| User authentication | **Relational** | Schema rõ ràng, cần consistency |
| IoT sensor data | **NoSQL** | Dữ liệu khổng lồ, chỉ append |
| Chat/Messaging | **NoSQL** | Throughput cao, dữ liệu đơn giản |
| Accounting/ERP | **Relational** | Quan hệ phức tạp, transactions |
| Gaming leaderboard | **NoSQL (ElastiCache)** | Speed cực nhanh |
| Social media feed | **NoSQL** | Scale lớn, eventual consistency OK |

> **Lưu ý**: Trong thực tế, nhiều hệ thống dùng **CẢ HAI** (Polyglot Persistence). Ví dụ: Shopee dùng MySQL cho orders/payments (cần ACID) + Redis/DynamoDB cho product catalog, sessions, caching (cần speed).

---

## 12. NoSQL Data Modeling — Embed vs Reference

### 12.1. SQL lưu 3 bảng, NoSQL lưu thế nào?

**Trong SQL:**

```sql
users ←──FK──── orders ────FK──→ products
-- 3 bảng riêng, JOIN khi cần
```

**Trong NoSQL:** 3 tables riêng + NHÚNG (copy) khi cần:

```json
// TABLE 1: Users (bản gốc, query độc lập được)
{ "PK": "USER#001", "name": "Nguyễn Văn A", "email": "a@example.com" }

// TABLE 2: Products (bản gốc, query độc lập được)
{ "PK": "PROD#001", "name": "iPhone 15", "price": 25000000 }

// TABLE 3: Orders (NHÚNG COPY của user + product)
{
    "PK": "USER#001",
    "SK": "ORDER#2024-06-15#ORD-001",
    "quantity": 2,
    "user_name": "Nguyễn Văn A",       // ← copy từ Users
    "product_id": "PROD#001",
    "product_name": "iPhone 15",        // ← copy từ Products
    "product_price": 25000000           // ← copy giá TẠI THỜI ĐIỂM MUA
}
```

> **Quan trọng**: Nhúng = **COPY**, không phải **MOVE**. Bản gốc Users và Products vẫn tồn tại, vẫn query độc lập được.

### 12.2. Embed vs Reference — Khi nào dùng cái nào?

**Embed (nhúng):** Lưu data trực tiếp vào document.

```json
// Products với tags được NHÚNG
{ "_id": "PROD-001", "name": "iPhone 15", "price": 25000000,
  "tags": ["electronics", "sale", "smartphone", "apple"] }
```

**Reference:** Chỉ lưu ID, query riêng khi cần.

```json
// Order chỉ lưu product_id (reference)
{ "_id": "ORD-001", "product_id": "PROD-001", "quantity": 2 }
// → Muốn biết tên product → phải query Products table riêng
```

**Quy tắc chọn:**

| Tiêu chí | Dùng Embed | Dùng Reference |
|---|---|---|
| Data thay đổi thường xuyên? | ❌ Ít thay đổi → embed | ✅ Thay đổi nhiều → reference |
| Cần truy cập độc lập? | ❌ Không → embed | ✅ Có → reference + collection riêng |
| Kích thước data? | Nhỏ → embed | Lớn → reference (tránh document quá to) |
| Quan hệ 1-nhiều ít? | ✅ → embed | Nhiều (hàng nghìn) → reference |

### 12.3. Update product khi đã nhúng — Có cần update orders cũ?

```
Seller đổi giá iPhone từ 25tr → 22tr

1. Products table → UPDATE giá mới ✅
2. Orders cũ       → KHÔNG CẦN update!
   → Vì 25tr là giá lúc khách MUA, đó là giá chính xác (giống hóa đơn)
   → Orders mới từ bây giờ sẽ copy giá 22tr
```

> **Nguyên tắc**: Chỉ nhúng dữ liệu mà bạn **KHÔNG CẦN đồng bộ** sau này (snapshot/lịch sử). Dữ liệu "sống" (thay đổi liên tục) → lưu reference (ID) và query riêng khi cần.

### 12.4. Cần collection riêng không khi đã nhúng?

```
Dữ liệu nhúng có cần TRUY CẬP ĐỘC LẬP không?

├── CÓ (products, users)    → VẪN CẦN collection riêng
│                             → Nhúng chỉ là COPY để đọc nhanh
│
└── KHÔNG (shipping address, order items)
    → KHÔNG CẦN collection riêng
    → Nhúng là nơi lưu DUY NHẤT
```

| Data | Cần collection riêng? | Lý do |
|---|---|---|
| Products | ✅ Cần | Cần xem, sửa, tìm kiếm độc lập |
| Users | ✅ Cần | Cần login, xem profile độc lập |
| Shipping address | ❌ Không | Chỉ tồn tại trong order |
| Order items | ❌ Không | Chỉ tồn tại trong order |
| Tags (string list) | ❌ Không | Nhúng mảng string đơn giản đủ dùng |

### 12.5. Lấy tất cả tags trong NoSQL?

Trong SQL: `SELECT DISTINCT name FROM tags;` → 1 dòng, xong.

Trong NoSQL — phổ biến nhất: tạo **metadata document**:

```json
// Document riêng lưu danh sách tất cả tags
{ "PK": "METADATA", "SK": "ALL_TAGS",
  "tags": ["electronics", "sale", "smartphone", "apple", "laptop"] }

// Query: GET 1 item → cực nhanh
// Khi thêm tag mới → App phải cập nhật 2 chỗ:
//   1. Thêm tag vào product
//   2. Thêm tag vào metadata document (nếu chưa tồn tại)
```

> NoSQL chuyển sự phức tạp từ **DATABASE** sang **APPLICATION**.

---

## 13. Consistency Deep-Dive — Hai loại consistency khác nhau

### 13.1. Hai vấn đề khác nhau

```
┌──────────────────────────────────────────────────────────────────┐
│  LOẠI 1: WRITE CONFLICT (2 người ghi cùng lúc)                 │
│  → Giải quyết bằng: Version Locking, Atomic Ops                │
│  → Cả SQL và NoSQL đều gặp                                     │
│                                                                  │
│  LOẠI 2: READ STALE DATA (đọc data cũ từ replica)              │
│  → Đây mới là EVENTUAL CONSISTENCY                              │
│  → Xảy ra khi có ASYNC REPLICATION                              │
│  → Cả SQL và NoSQL đều CÓ THỂ gặp                              │
└──────────────────────────────────────────────────────────────────┘
```

### 13.2. Write Conflict — Giải quyết bằng Version Locking

```javascript
// DynamoDB: Optimistic Locking
// Document lưu thêm field "version"
{ PK: "PROD#001", name: "iPhone 15", stock: 10, version: 1 }

// Update với ConditionExpression:
await dynamodb.update({
    Key: { PK: "PROD#001" },
    UpdateExpression: "SET stock = :s, version = :newV",
    ConditionExpression: "version = :curV",   // chỉ update nếu version CHƯA ĐỔI
    ExpressionAttributeValues: {
        ":s": 9, ":newV": 2, ":curV": 1
    }
});
// → Nếu ai đó đã đổi version → thất bại → đọc lại → thử lại
```

Hoặc đơn giản hơn — **Atomic Operations** (cho counter):

```javascript
// DynamoDB: Atomic counter — KHÔNG cần version
await dynamodb.update({
    Key: { PK: "PROD#001" },
    UpdateExpression: "SET stock = stock - :qty",
    ConditionExpression: "stock >= :qty",
    ExpressionAttributeValues: { ":qty": 1 }
});
// → DB đảm bảo atomic, 2 người update cùng lúc vẫn đúng
```

| Trường hợp | Dùng gì | Ví dụ |
|---|---|---|
| Trừ/cộng số | **Atomic Ops** | stock, likes, views |
| Update nhiều fields | **Version Locking** | name + price + description |
| Multi-document transaction | **Dùng SQL** | Trừ A + cộng B cùng lúc |

### 13.3. Eventual Consistency — Đọc data cũ từ replica

```
T0: User A ghi stock = 9 vào Primary

    Primary              Replica
    ┌──────────┐        ┌──────────┐
    │ stock: 9 │──sync──│ stock:10 │  ← CHƯA KỊP SYNC
    └──────────┘   ...  └──────────┘

T0 + 5ms: User B đọc từ Replica → thấy stock = 10 (SAI!)
T0 + 50ms: Replica sync xong → stock = 9 (ĐÚNG)

→ Trong 50ms, data "tạm thời" sai → "Eventually" sẽ đúng
```

### 13.4. Sync vs Async Replication

```
Sync:  Client ghi → Primary ghi → ĐỢI Replica ghi → OK
       → Chậm hơn, nhưng LUÔN consistent

Async: Client ghi → Primary ghi → OK (Replica sync SAU)
       → Nhanh hơn, nhưng Replica CÓ THỂ chưa có data mới
```

**Trong AWS:**

| Service | Replication | Ghi chú |
|---|---|---|
| **RDS Multi-AZ** (Standby) | **Sync** | Luôn consistent, nhưng Standby không đọc được |
| **RDS Read Replicas** | **Async** | CÓ THỂ đọc data cũ — SQL CŨNG BỊ eventual consistency! |
| **Aurora** | Storage sync, Replicas async | Replica lag ~10-20ms |
| **DynamoDB** | Ghi 2/3 replicas trước khi confirm | Default eventual, opt-in strong |

### 13.5. Tại sao nói NoSQL "eventual consistency" nhiều hơn?

```
SQL mặc định:   1 server → không replica → STRONG consistency
                 Chỉ khi thêm Read Replicas → mới bị eventual

NoSQL mặc định:  LUÔN replicate (3 copies, 3 AZs)
                  → TỪ ĐẦU đã eventual consistency

→ Eventual consistency = hệ quả của ASYNC REPLICATION
→ Ai có async replica thì bị, CẢ SQL LẪN NOSQL
→ NoSQL luôn có replica (by design) nên LUÔN gặp
→ SQL có thể chọn không dùng replica (nhưng mất HA)
```

NoSQL CHỌN eventual consistency làm mặc định, **hy sinh** chính xác tức thì để **đổi lấy** tốc độ + scalability. Khi cần chính xác → vẫn có option Strong Read (đắt hơn).

---

## 14. CRUD Thực tế trong NoSQL

Ví dụ CRUD cho hệ thống Orders (DynamoDB):

### 14.1. CREATE

```javascript
await dynamodb.put({
    TableName: "Products",
    Item: {
        PK: "PROD#001", name: "iPhone 15 Pro Max", price: 25000000,
        category: "smartphones", tags: ["apple", "flagship"],
        images: ["https://cdn.example.com/iphone15.jpg"],
        created_at: "2024-06-15T10:00:00Z"
    }
});
// → 1 API call, single-digit ms. SQL cần INSERT vào nhiều bảng (products + tags + images).
```

### 14.2. READ

```javascript
// Lấy 1 product
const product = await dynamodb.get({ TableName: "Products", Key: { PK: "PROD#001" } });
// → Trả về ĐẦY ĐỦ (kể cả tags, images), không cần JOIN

// Lấy products theo category (dùng GSI)
const phones = await dynamodb.query({
    TableName: "Products", IndexName: "CategoryIndex",
    KeyConditionExpression: "category = :cat",
    ExpressionAttributeValues: { ":cat": "smartphones" }
});
```

### 14.3. UPDATE

```javascript
// Cập nhật giá + thêm tag (chỉ update fields cần thiết)
await dynamodb.update({
    TableName: "Products", Key: { PK: "PROD#001" },
    UpdateExpression: "SET price = :p, tags = list_append(tags, :t)",
    ExpressionAttributeValues: { ":p": 22000000, ":t": ["hot-deal"] }
});
```

### 14.4. DELETE

```javascript
// Xóa 1 item: đơn giản
await dynamodb.delete({ TableName: "Carts", Key: { PK: "USER#001", SK: "PROD#001" } });

// Xóa product + tất cả reviews: phải xóa TỪNG item (không có CASCADE)
const items = await dynamodb.query({
    TableName: "Products", KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: { ":pk": "PROD#001" }
});
await dynamodb.batchWrite({
    RequestItems: { Products: items.Items.map(i => ({ DeleteRequest: { Key: { PK: i.PK, SK: i.SK } } })) }
});
// SQL: DELETE FROM products WHERE id = 1 (CASCADE tự xóa liên quan)
```

---

## 15. SQL vs MongoDB vs DynamoDB

MongoDB nằm **ở giữa** SQL và DynamoDB:

```
Strong Consistency ◄────────────────────────────► Eventual Consistency
(Chính xác)                                       (Nhanh, Scale)

    SQL (RDS)           MongoDB              DynamoDB
       ●───────────────────●────────────────────●
    "Phải đúng"    "Cố gắng đúng,         "Nhanh trước,
                    nhưng vẫn nhanh"       đúng sau"
```

### 15.1. MongoDB — "Best of both worlds" nhưng cũng "Master of none"

**So với SQL, MongoDB YẾU hơn ở:**

| Tiêu chí | SQL | MongoDB |
|---|---|---|
| Transaction performance | Tối ưu sẵn, nhanh | Có nhưng **chậm hơn 20-50%** |
| JOIN phức tạp | SQL optimizer tự động | `$lookup` chậm, **không hoạt động cross-shard** |
| Reporting / Analytics | GROUP BY, SUM, AVG cực mạnh | Aggregation phức tạp hơn, chậm hơn |
| Data integrity | FK, constraints ở DB level | App phải tự kiểm tra |

**So với DynamoDB, MongoDB YẾU hơn ở:**

| Tiêu chí | DynamoDB | MongoDB |
|---|---|---|
| Auto-scaling | Hoàn toàn tự động, 0 ops | Phải cấu hình sharding thủ công |
| Latency | LUÔN single-digit ms | Thay đổi tùy query phức tạp |
| Chi phí vận hành | 0 DevOps | Cần 1-2 DevOps quản lý |
| Managed service | Serverless, AWS native | DocumentDB (không phải MongoDB thật) |

### 15.2. Bảng so sánh tổng hợp

| Tiêu chí | SQL thắng | MongoDB thắng | DynamoDB thắng |
|---|---|---|---|
| Transactions phức tạp | ✅ | | |
| JOIN / Reporting | ✅ | | |
| Data integrity (FK) | ✅ | | |
| Linh hoạt query + scale | | ✅ | |
| Schema linh hoạt | | ✅ | |
| Auto-scale vô hạn | | | ✅ |
| Zero operations | | | ✅ |
| Latency ổn định | | | ✅ |

### 15.3. Khi nào dùng cái nào?

```
┌─────────────────────────────────────────────────────────────────┐
│   Cần ACID / Transactions phức tạp?                             │
│   ├── CÓ → SQL (RDS/Aurora)                                    │
│   └── KHÔNG ↓                                                   │
│                                                                 │
│   Cần scale lớn + không muốn quản lý server?                   │
│   ├── CÓ → DynamoDB                                            │
│   └── KHÔNG ↓                                                   │
│                                                                 │
│   Cần query linh hoạt + team tự quản lý được?                  │
│   ├── CÓ → MongoDB                                             │
│   └── KHÔNG → SQL (mặc định, đơn giản nhất)                    │
└─────────────────────────────────────────────────────────────────┘
```

> **Kết luận**: Đừng nghĩ "SQL hay NoSQL?". Hãy nghĩ **"Thành phần nào dùng cái gì?"**. Mỗi database có thế mạnh riêng — dùng đúng chỗ thì phát huy tối đa, dùng sai chỗ thì đau khổ. E-commerce thực tế thường dùng **cả SQL + NoSQL** (Polyglot Persistence).
