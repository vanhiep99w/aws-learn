# Consistent Hashing

## Mục lục

- [1. Vấn đề của hashing thông thường](#1-vấn-đề-của-hashing-thông-thường)
- [2. Consistent Hashing là gì?](#2-consistent-hashing-là-gì)
- [3. Thêm / Xóa node](#3-thêm--xóa-node)
- [4. Virtual Nodes — Giải quyết phân bố không đều](#4-virtual-nodes--giải-quyết-phân-bố-không-đều)
- [5. Ví dụ thực tế trong AWS](#5-ví-dụ-thực-tế-trong-aws)
- [6. So sánh: Hashing thường vs Consistent Hashing](#6-so-sánh-hashing-thường-vs-consistent-hashing)

---

## 1. Vấn đề của hashing thông thường

### Modular Hashing (cách đơn giản nhất)

Chia data vào N servers bằng phép chia dư:

```
server = hash(key) % N

Ví dụ: 4 servers (N=4)
hash("user_A") = 13  → 13 % 4 = 1 → Server 1
hash("user_B") = 27  → 27 % 4 = 3 → Server 3
hash("user_C") = 42  → 42 % 4 = 2 → Server 2
hash("user_D") = 8   →  8 % 4 = 0 → Server 0
```

### Vấn đề: Thêm hoặc bớt server → DISASTER

```
TRƯỚC: 4 servers (N=4)
hash("user_A") = 13  → 13 % 4 = 1 → Server 1
hash("user_B") = 27  → 27 % 4 = 3 → Server 3
hash("user_C") = 42  → 42 % 4 = 2 → Server 2

THÊM 1 server: 5 servers (N=5)
hash("user_A") = 13  → 13 % 5 = 3 → Server 3  ← THAY ĐỔI!
hash("user_B") = 27  → 27 % 5 = 2 → Server 2  ← THAY ĐỔI!
hash("user_C") = 42  → 42 % 5 = 2 → Server 2  ← giữ nguyên (may mắn)

→ ~75-80% data phải DI CHUYỂN sang server khác!
→ Nếu data là cache → hầu hết cache MISS → database bị tải đột ngột
→ Có thể gây DOWN toàn bộ hệ thống (cache stampede)
```

```
┌─────────────────────────────────────────────────────────────────┐
│           VẤN ĐỀ CỦA MODULAR HASHING                           │
│                                                                 │
│   4 servers → 5 servers:                                        │
│   ┌─────────────────────────────────────────────┐               │
│   │ ████████████████████████████████████░░░░░░░░│               │
│   │ ←── 75-80% data phải di chuyển ──→│← giữ →│               │
│   └─────────────────────────────────────────────┘               │
│                                                                 │
│   → Thêm 1 server mà gần như TOÀN BỘ data bị ảnh hưởng!       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Consistent Hashing là gì?

Thay vì dùng `%N`, consistent hashing sắp xếp cả **keys** và **servers** trên một **vòng tròn** (hash ring):

### Bước 1: Đặt servers lên vòng tròn

```
Hash mỗi server name → 1 vị trí trên vòng tròn (0 → 2^32)

hash("Server-A") = 1000
hash("Server-B") = 4000
hash("Server-C") = 7000
hash("Server-D") = 9000
```

### Bước 2: Đặt keys lên vòng tròn

```
hash("user_1") = 500
hash("user_2") = 3000
hash("user_3") = 5500
hash("user_4") = 8000
```

### Bước 3: Mỗi key đi theo CHIỀU KIM ĐỒNG HỒ đến server GẦN NHẤT

Vòng tròn trải thẳng ra (0 → 10000 → quay lại 0):

```
  0       1000      3000  4000      5500      7000  8000  9000      10000→0
  │        │          │    │          │          │    │      │          │
  ├────────┼──────────┼────┼──────────┼──────────┼────┼──────┼──────────┤
  │        │          │    │          │          │    │      │          │
  │     Server-A      │  Server-B    │       Server-C │   Server-D     │
  │      [■]          │   [■]        │        [■]     │    [■]         │
  │                   │              │                │                │
  │    user_1         │              │                │                │
  │     [●]        user_2         user_3           user_4              │
  │                [●]            [●]              [●]                 │
  │                   │              │                │                │
  │   ┌───────────┐   │  ┌────────┐  │  ┌──────────┐ │  ┌──────────┐  │
  │   │user_1→   A│   │  │user_2→B│  │  │user_3→  C│ │  │user_4→ D│  │
  │   └───────────┘   │  └────────┘  │  └──────────┘ │  └──────────┘  │
  └────────────────────────────────────────────────────────────────────┘
                    ──────── chiều kim đồng hồ ────────→
```

```
  Giải thích: Mỗi key tìm server GẦN NHẤT theo chiều →

  ● user_1 (500)  ───→ gặp ■ Server-A (1000) đầu tiên  ✅
  ● user_2 (3000) ───→ gặp ■ Server-B (4000) đầu tiên  ✅
  ● user_3 (5500) ───→ gặp ■ Server-C (7000) đầu tiên  ✅
  ● user_4 (8000) ───→ gặp ■ Server-D (9000) đầu tiên  ✅
```

---

## 3. Thêm / Xóa node

### Thêm Server-E (vị trí 6000)

```
                    TRƯỚC                          SAU (thêm Server-E)
                                         
    Server-B(4000)                       Server-B(4000)
         │                                    │
    user_3(5500)                          user_3(5500)
         │                                    │
         ↓                                    ↓
    Server-C(7000)  ← user_3 ở đây      Server-E(6000) ← user_3 CHUYỂN sang đây
                                              │
                                         Server-C(7000)

    Chỉ có user_3 bị ảnh hưởng!
    user_1 → vẫn Server-A ✅
    user_2 → vẫn Server-B ✅
    user_3 → Server-C → Server-E (di chuyển) ⚡
    user_4 → vẫn Server-D ✅
```

```
┌─────────────────────────────────────────────────────────────────┐
│           CONSISTENT HASHING KHI THÊM NODE                     │
│                                                                 │
│   4 servers → 5 servers:                                        │
│   ┌─────────────────────────────────────────────┐               │
│   │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░│               │
│   │ ←── KHÔNG ảnh hưởng ──────────────→│move│   │               │
│   └─────────────────────────────────────────────┘               │
│                                                                 │
│   Chỉ ~1/N data phải di chuyển (tốt hơn 75-80%)               │
│   Với 5 servers: chỉ ~20% data di chuyển                       │
└─────────────────────────────────────────────────────────────────┘
```

### Xóa 1 node (Server-C chết)

```
    TRƯỚC:                              SAU (Server-C chết):

    user_3(5500) → Server-C(7000)       user_3(5500) → Server-D(9000)
                                        (đi tiếp theo chiều kim đồng hồ
                                         đến server tiếp theo còn sống)

    → Chỉ data của Server-C bị ảnh hưởng
    → Data được phân bổ sang server KẾ TIẾP trên vòng tròn
    → Các server khác KHÔNG BỊ ẢNH HƯỞNG
```

---

## 4. Virtual Nodes — Giải quyết phân bố không đều

### Vấn đề: Servers phân bố không đều trên ring

```
Nếu 3 servers đều hash vào 1 góc:

    Server-A(1000)
    Server-B(1500)──── 3 servers chen nhau ở đây
    Server-C(2000)
         │
         │
         │  ← KHOẢNG TRỐNG LỚN (2000 → 10000)
         │     → Không có server nào xử lý
         │     → Server-A phải gánh tất cả data ở khoảng này
         │
    (quay lại Server-A)

→ Server-A bị quá tải, B và C rảnh → KHÔNG CÂN BẰNG
```

### Giải pháp: Virtual Nodes (vnodes)

Mỗi server THẬT tạo ra nhiều điểm ẢO trên vòng tròn:

```
Server-A thật → tạo 3 virtual nodes: A-1, A-2, A-3
Server-B thật → tạo 3 virtual nodes: B-1, B-2, B-3
Server-C thật → tạo 3 virtual nodes: C-1, C-2, C-3

    hash("A-1") = 1000     hash("B-1") = 2500     hash("C-1") = 4000
    hash("A-2") = 5000     hash("B-2") = 6500     hash("C-2") = 8000
    hash("A-3") = 9500     hash("B-3") = 3000     hash("C-3") = 7000

Vòng tròn bây giờ:
    A-1(1000) → B-1(2500) → B-3(3000) → C-1(4000) → A-2(5000) →
    B-2(6500) → C-3(7000) → C-2(8000) → A-3(9500) → quay lại

→ 9 điểm phân bố ĐỀU hơn trên vòng tròn
→ Mỗi server gánh ~1/3 data (cân bằng!)
```

```
Thực tế: mỗi server tạo 100-200 virtual nodes
→ Phân bố CỰC ĐỀU trên vòng tròn
→ Sai lệch < 5-10%
```

### Server mạnh hơn → nhiều virtual nodes hơn

```
Server-A (16 CPU, 64GB RAM) → 200 virtual nodes
Server-B (8 CPU, 32GB RAM)  → 100 virtual nodes
Server-C (4 CPU, 16GB RAM)  →  50 virtual nodes

→ Server-A chiếm nhiều "chỗ" hơn trên ring
→ Nhận nhiều data hơn → tận dụng hardware mạnh
→ WEIGHTED consistent hashing
```

---

## 5. Ví dụ thực tế trong AWS

### 5.1. DynamoDB — Partition Key

```
DynamoDB dùng consistent hashing để phân data vào partitions:

Table "Products":
  hash("PROD#001") → Partition 3
  hash("PROD#002") → Partition 1
  hash("PROD#003") → Partition 3
  hash("PROD#004") → Partition 2

Khi traffic tăng, DynamoDB thêm partition MỚI:
  → Chỉ ~1/N data di chuyển
  → KHÔNG ảnh hưởng toàn bộ table
  → Users KHÔNG nhận ra (transparent)
```

### 5.2. ElastiCache (Redis Cluster)

```
Redis Cluster chia data thành 16,384 hash slots:

Node 1: slots 0-5460
Node 2: slots 5461-10922
Node 3: slots 10923-16383

Key "session:user1" → CRC16("session:user1") % 16384 = 8742 → Node 2

Thêm Node 4:
→ Một phần slots từ Node 1, 2, 3 chuyển sang Node 4
→ Chỉ ~25% data di chuyển (1/4)
```

### 5.3. Elastic Load Balancer (Sticky Sessions)

```
ALB dùng hashing để route user đến cùng 1 target:

hash(cookie/IP) → Target Group instance

Khi 1 instance chết:
→ Chỉ users của instance đó bị redirect
→ Users ở instances khác KHÔNG ảnh hưởng
```

### 5.4. CloudFront — Cache Distribution

```
CloudFront Edge Locations dùng consistent hashing:

hash(URL) → Edge Location cache

Khi thêm Edge Location mới:
→ Chỉ 1 phần content cần cache lại
→ Phần lớn cache vẫn HIT → performance ổn định
```

---

## 6. So sánh: Hashing thường vs Consistent Hashing

| Tiêu chí | Modular Hashing (`%N`) | Consistent Hashing |
|---|---|---|
| **Thêm/xóa node** | ~75-80% data di chuyển | ~1/N data di chuyển |
| **Độ phức tạp** | Đơn giản (`%N`) | Phức tạp hơn (hash ring) |
| **Cân bằng tải** | Tốt (nếu `N` cố định) | Cần virtual nodes |
| **Scale** | ❌ Rất khó | ✅ Dễ dàng |
| **Use case** | Data cố định, ít thay đổi | Distributed systems, caching |

### Tóm lại

```
"Tại sao cần Consistent Hashing?"

→ Vì distributed systems LUÔN thay đổi:
  - Server chết → phải xóa khỏi cluster
  - Traffic tăng → phải thêm server
  - Maintenance → tạm tắt server

→ Modular hashing: mỗi lần thay đổi = DI CHUYỂN GẦN HẾT data = CHẾT
→ Consistent hashing: mỗi lần thay đổi = di chuyển 1/N data = ỔN

→ Đây là nền tảng của HẦU HẾT distributed database:
  DynamoDB, Cassandra, Redis Cluster, MongoDB Sharding, ...
```

> **Consistent Hashing = cách phân data thông minh để KHÔNG phải xáo trộn toàn bộ khi thêm/bớt server**. Kết hợp với Virtual Nodes để đảm bảo phân bố đều, đây là thuật toán nền tảng của mọi hệ thống phân tán hiện đại.
