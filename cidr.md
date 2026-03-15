# CIDR (Classless Inter-Domain Routing)

## Mục lục

- [CIDR là gì?](#cidr-là-gì)
- [Cách đọc CIDR](#cách-đọc-cidr)
- [Bảng tham chiếu nhanh](#bảng-tham-chiếu-nhanh)
- [Private IP Ranges](#private-ip-ranges)
- [CIDR trong AWS VPC](#cidr-trong-aws-vpc)
- [Chia Subnet](#chia-subnet)
- [Ví dụ thực tế](#ví-dụ-thực-tế)
- [Tips & Tricks](#tips--tricks)

---

## CIDR là gì?

**CIDR** (Classless Inter-Domain Routing) là cách viết gọn để mô tả **dải IP addresses**.

```
CIDR Notation:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    10.0.0.0/16                                                  │
│    ────┬────  ─┬─                                               │
│        │      │                                                 │
│   Base IP    Subnet Mask (số bit cố định)                       │
│                                                                 │
│   /16 = 16 bits đầu cố định, 16 bits sau thay đổi được          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Giải thích bằng hình ảnh

```
IP Address = 32 bits (4 octets × 8 bits)

10.0.0.0/16 nghĩa là:
┌────────────────────────────────────────────────────────────────┐
│  10      .    0       .    0       .    0                      │
│  ▼            ▼            ▼            ▼                      │
│ 00001010 . 00000000 . 00000000 . 00000000                      │
│ ├───────────────────┤ ├────────────────────┤                   │
│   16 bits CỐ ĐỊNH      16 bits THAY ĐỔI ĐƯỢC                   │
│   (Network portion)    (Host portion)                          │
│                                                                │
│ → Các IP từ 10.0.0.0 đến 10.0.255.255 đều thuộc dải này        │
│ → Tổng: 2^16 = 65,536 IPs                                      │
└────────────────────────────────────────────────────────────────┘
```

---

## Cách đọc CIDR

### Công thức tính số IP

```
Số IP = 2^(32 - subnet mask)

Ví dụ:
  /16 → 2^(32-16) = 2^16 = 65,536 IPs
  /24 → 2^(32-24) = 2^8  = 256 IPs
  /28 → 2^(32-28) = 2^4  = 16 IPs
  /32 → 2^(32-32) = 2^0  = 1 IP (chính xác 1 địa chỉ)
```

### Quy tắc nhớ nhanh

```
┌─────────────────────────────────────────────────────────────────┐
│  SUBNET MASK     SỐ IPs       GHI NHỚ                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     /8       16,777,216    (Class A - rất lớn)                  │
│     /16      65,536        (Class B - VPC mặc định)             │
│     /24      256           (Class C - subnet phổ biến)          │
│     /28      16            (Subnet nhỏ nhất AWS cho phép)       │
│     /32      1             (Chính xác 1 IP)                     │
│                                                                 │
│  Mỗi khi tăng 1:  /24 → /25 → /26 → /27                         │
│  Số IP giảm CÒN NỬA: 256 → 128 → 64 → 32                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Bảng tham chiếu nhanh

| CIDR | Subnet Mask | Số IPs | IPs khả dụng (AWS) | Use Case |
|------|-------------|--------|-------------------|----------|
| /8 | 255.0.0.0 | 16,777,216 | - | Class A network |
| /16 | 255.255.0.0 | 65,536 | 65,531 | VPC lớn |
| /20 | 255.255.240.0 | 4,096 | 4,091 | VPC vừa |
| /24 | 255.255.255.0 | 256 | 251 | Subnet phổ biến |
| /25 | 255.255.255.128 | 128 | 123 | Subnet vừa |
| /26 | 255.255.255.192 | 64 | 59 | Subnet nhỏ |
| /27 | 255.255.255.224 | 32 | 27 | Subnet nhỏ |
| /28 | 255.255.255.240 | 16 | 11 | Subnet nhỏ nhất (AWS) |

> ⚠️ **AWS Reserved IPs:** Mỗi subnet, AWS giữ lại **5 IPs** đầu và cuối (Network, Router, DNS, Reserved, Broadcast)

---

## Private IP Ranges

Theo RFC 1918, có 3 dải IP private (không dùng trên Internet):

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVATE IP RANGES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  10.0.0.0/8        10.0.0.0 → 10.255.255.255                    │
│                    16,777,216 IPs (Class A)                     │
│                    → Phổ biến cho VPC                           │
│                                                                 │
│  172.16.0.0/12     172.16.0.0 → 172.31.255.255                  │
│                    1,048,576 IPs (Class B)                      │
│                    → AWS Default VPC dùng 172.31.0.0/16         │
│                                                                 │
│  192.168.0.0/16    192.168.0.0 → 192.168.255.255                │
│                    65,536 IPs (Class C)                         │
│                    → Phổ biến cho home network                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Range | Class | Số IPs | Thường dùng cho |
|-------|-------|--------|-----------------|
| **10.0.0.0/8** | A | 16M | Enterprise, AWS VPC |
| **172.16.0.0/12** | B | 1M | AWS Default VPC |
| **192.168.0.0/16** | C | 65K | Home/Small office |

---

## CIDR trong AWS VPC

### VPC CIDR Block

```
AWS VPC cho phép:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   VPC CIDR:    /16 đến /28                                      │
│                                                                 │
│   /16 = 65,536 IPs    (lớn nhất)                                │
│   /28 = 16 IPs        (nhỏ nhất)                                │
│                                                                 │
│   Khuyến nghị: /16 cho production (nhiều subnet, room to grow)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AWS Reserved IPs trong mỗi Subnet

Khi bạn tạo subnet, **AWS tự động giữ lại 5 IPs** đầu tiên và cuối cùng - bạn **không thể dùng** những IP này cho EC2.

#### Ví dụ cụ thể: Subnet 10.0.1.0/24

```
Subnet 10.0.1.0/24 = 256 IPs (từ 10.0.1.0 đến 10.0.1.255)

┌────────────────┬──────────────────────────────┬─────────────────┐
│   IP Address   │   AWS dùng để làm gì?        │   Bạn dùng được?│
├────────────────┼──────────────────────────────┼─────────────────┤
│   10.0.1.0     │   Network address            │   ❌ Reserved   │
│   10.0.1.1     │   VPC Router (local gateway) │   ❌ Reserved   │
│   10.0.1.2     │   DNS Server                 │   ❌ Reserved   │
│   10.0.1.3     │   Reserved cho tương lai     │   ❌ Reserved   │
│   ─────────────│──────────────────────────────│─────────────────│
│   10.0.1.4     │   ← IP đầu tiên bạn dùng được│   ✅ Usable     │
│   10.0.1.5     │                              │   ✅ Usable     │
│   ...          │                              │   ✅ Usable     │
│   10.0.1.254   │   ← IP cuối cùng bạn dùng    │   ✅ Usable     │
│   ─────────────│──────────────────────────────│─────────────────│
│   10.0.1.255   │   Broadcast address          │   ❌ Reserved   │
└────────────────┴──────────────────────────────┴─────────────────┘

Tổng: 256 IPs - 5 Reserved = 251 IPs bạn dùng được
```

#### Giải thích từng IP Reserved

| IP | Tên | Mục đích |
|----|-----|----------|
| **x.x.x.0** | Network Address | Định danh subnet (quy ước mạng, không gán cho host) |
| **x.x.x.1** | VPC Router | Router nội bộ của VPC (local route dùng IP này) |
| **x.x.x.2** | DNS Server | DNS của VPC (VPC Base + 2, Route 53 Resolver) |
| **x.x.x.3** | Reserved | AWS giữ cho tương lai, chưa dùng |
| **x.x.x.255** | Broadcast | Địa chỉ broadcast (quy ước mạng) |

#### Ví dụ với subnet nhỏ /28

```
Bạn tạo subnet 10.0.1.0/28 (16 IPs):

10.0.1.0   ← Network (AWS reserved)
10.0.1.1   ← Router (AWS reserved)
10.0.1.2   ← DNS (AWS reserved)
10.0.1.3   ← Future (AWS reserved)
10.0.1.4   ← EC2 đầu tiên của bạn ✅
10.0.1.5   ← EC2 thứ hai ✅
...
10.0.1.14  ← EC2 cuối cùng ✅
10.0.1.15  ← Broadcast (AWS reserved)

→ Chỉ có 11 IPs dùng được (16 - 5 = 11)
```

#### Tại sao quan trọng?

```
⚠️ TRAP: Bạn nghĩ /28 = 16 IPs → Đủ cho 16 EC2?
   → SAI! Chỉ có 11 IPs thực sự dùng được!

TÍNH TOÁN ĐÚNG:
┌──────────┬────────────┬─────────────┐
│  Subnet  │  Tổng IPs  │  Usable IPs │
├──────────┼────────────┼─────────────┤
│   /28    │     16     │     11      │
│   /27    │     32     │     27      │
│   /26    │     64     │     59      │
│   /25    │    128     │    123      │
│   /24    │    256     │    251      │
└──────────┴────────────┴─────────────┘
```

> 💡 **Nhớ:** Luôn **trừ 5** khi tính số IP thực sự dùng được trong AWS subnet!

---

## Chia Subnet

### Ví dụ: Chia VPC 10.0.0.0/16 thành các subnets

```
VPC: 10.0.0.0/16 (65,536 IPs)
│
├── Public Subnet AZ-A:  10.0.0.0/24   (256 IPs) → 10.0.0.0 - 10.0.0.255
├── Public Subnet AZ-B:  10.0.1.0/24   (256 IPs) → 10.0.1.0 - 10.0.1.255
├── Private Subnet AZ-A: 10.0.10.0/24  (256 IPs) → 10.0.10.0 - 10.0.10.255
├── Private Subnet AZ-B: 10.0.11.0/24  (256 IPs) → 10.0.11.0 - 10.0.11.255
├── DB Subnet AZ-A:      10.0.20.0/24  (256 IPs) → 10.0.20.0 - 10.0.20.255
└── DB Subnet AZ-B:      10.0.21.0/24  (256 IPs) → 10.0.21.0 - 10.0.21.255
```

### Quy tắc chia subnet

```
┌─────────────────────────────────────────────────────────────────┐
│                    KHÔNG ĐƯỢC OVERLAP!                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ OK:                                                         │
│     10.0.0.0/24  (10.0.0.0 - 10.0.0.255)                        │
│     10.0.1.0/24  (10.0.1.0 - 10.0.1.255)                        │
│     → Không trùng nhau                                          │
│                                                                 │
│  ❌ WRONG:                                                      │
│     10.0.0.0/16  (10.0.0.0 - 10.0.255.255)                      │
│     10.0.1.0/24  (10.0.1.0 - 10.0.1.255)                        │
│     → /24 nằm trong /16, bị overlap!                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ví dụ thực tế

### 1. Startup nhỏ (10-50 EC2s)

```
VPC: 10.0.0.0/20 (4,096 IPs) - đủ dùng, tiết kiệm

├── Public:  10.0.0.0/24  (251 usable)
├── Private: 10.0.1.0/24  (251 usable)
└── DB:      10.0.2.0/24  (251 usable)
```

### 2. Production (100+ EC2s, multi-AZ)

```
VPC: 10.0.0.0/16 (65,536 IPs) - room to grow

AZ-A:
├── Public:  10.0.0.0/24
├── Private: 10.0.10.0/24
└── DB:      10.0.20.0/24

AZ-B:
├── Public:  10.0.1.0/24
├── Private: 10.0.11.0/24
└── DB:      10.0.21.0/24

AZ-C:
├── Public:  10.0.2.0/24
├── Private: 10.0.12.0/24
└── DB:      10.0.22.0/24
```

### 3. Multi-VPC / Multi-Region

```
⚠️ QUAN TRỌNG: Các VPC không được overlap CIDR nếu muốn peering!

Region US-East-1:
├── VPC-Prod:    10.0.0.0/16
└── VPC-Dev:     10.1.0.0/16    ← Khác block!

Region AP-Southeast-1:
├── VPC-Prod:    10.2.0.0/16    ← Khác block!
└── VPC-Dev:     10.3.0.0/16    ← Khác block!

→ Tất cả có thể peering với nhau vì không overlap!
```

---

## Tips & Tricks

### 1. Luôn plan trước

```
❌ Sai: Tạo VPC /24 rồi phát hiện không đủ IP
✅ Đúng: Tạo VPC /16, chia subnet /24 → room to grow
```

### 2. Naming convention cho subnets

```
10.0.[tier].[az].0/24

tier: 0-9 = public, 10-19 = private, 20-29 = database
az: 0 = AZ-A, 1 = AZ-B, 2 = AZ-C

Ví dụ:
  10.0.0.0/24  = Public AZ-A
  10.0.1.0/24  = Public AZ-B
  10.0.10.0/24 = Private AZ-A
  10.0.11.0/24 = Private AZ-B
  10.0.20.0/24 = Database AZ-A
  10.0.21.0/24 = Database AZ-B
```

### 3. Kiểm tra overlap online

Dùng các tool online để verify:
- [CIDR Calculator](https://www.ipaddressguide.com/cidr)
- [Subnet Calculator](https://www.calculator.net/ip-subnet-calculator.html)

### 4. Bảng cheat sheet

```
/16 = 65,536 IPs    = Chia được 256 subnet /24
/20 = 4,096 IPs     = Chia được 16 subnet /24
/24 = 256 IPs       = Subnet phổ biến nhất
/28 = 16 IPs        = Nhỏ nhất AWS cho phép (11 usable)
/32 = 1 IP          = Chính xác 1 địa chỉ (dùng trong Security Group)
```

---

## Liên kết

- [VPC](vpc.md) - Virtual Private Cloud
- [Security Groups](security-groups.md) - Firewall rules

> **Nguồn:** [AWS VPC CIDR blocks](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html)
