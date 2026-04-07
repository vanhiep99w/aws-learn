# Amazon EC2 (Elastic Compute Cloud)


## Mục lục

- [Tổng quan](#tổng-quan)
- [Các thành phần chính](#các-thành-phần-chính)
- [Pricing Models](#pricing-models)
- [Placement Groups](#placement-groups)
- [Cách truy cập EC2](#cách-truy-cập-ec2)
- [Các dịch vụ liên quan](#các-dịch-vụ-liên-quan)
- [EC2 Hibernate](#ec2-hibernate)
- [Best Practices](#best-practices)
- [Tham khảo thêm](#tham-khảo-thêm)

---

## Tổng quan

**Amazon EC2** là dịch vụ cung cấp **compute capacity có thể mở rộng** (scalable) trong AWS Cloud. EC2 cho phép bạn khởi tạo các **virtual servers** (gọi là **instances**) theo nhu cầu, không cần đầu tư phần cứng vật lý trước.

### Lợi ích chính
- **Scale up/down linh hoạt**: Thêm/giảm capacity theo workload thực tế
- **Pay-as-you-go**: Chỉ trả tiền cho những gì sử dụng (tính theo giây, tối thiểu 60 giây)
- **Triển khai nhanh**: Khởi tạo instance trong vài phút
- **Đa dạng cấu hình**: Nhiều instance types với các tổ hợp CPU, memory, storage, network khác nhau

> **Nguồn**: [What is Amazon EC2?](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html)

---

## Các thành phần chính

### 1. EC2 Instance
- Virtual server chạy trong AWS Cloud
- Mỗi instance có cấu hình phần cứng được xác định bởi **instance type**

### 2. Amazon Machine Image (AMI)
- **Template** chứa OS và phần mềm cần thiết để khởi tạo instance
- Có thể sử dụng AMI có sẵn của AWS, AWS Marketplace, hoặc tự tạo custom AMI

### 3. Instance Types
Các loại instance được phân loại theo mục đích sử dụng:

| Category | Mô tả | Use Cases |
|----------|-------|-----------|
| **General Purpose** (M, T series) | Cân bằng compute, memory, network | Web servers, small databases |
| **Compute Optimized** (C series) | CPU mạnh | Batch processing, gaming servers |
| **Memory Optimized** (R, X series) | RAM lớn | In-memory databases, real-time analytics |
| **Storage Optimized** (I, D series) | High IOPS | Data warehousing, distributed file systems |
| **Accelerated Computing** (P, G series) | GPU/hardware accelerators | Machine learning, graphics rendering |

> **Nguồn**: [Amazon EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/)

### 4. Storage Options

| Loại | Đặc điểm | Persistence |
|------|----------|-------------|
| **Amazon EBS** | Block storage, có thể attach/detach | Persistent (tồn tại sau khi terminate nếu cấu hình) |
| **Instance Store** | Storage vật lý gắn với host | Ephemeral (mất khi stop/terminate) |

### 5. Key Pairs
- Cặp **public/private key** để đăng nhập instance an toàn
- AWS giữ public key, bạn giữ private key

### 6. Security Groups

- **Virtual firewall** kiểm soát traffic vào/ra instance
- Quy định protocol, port, source/destination IP được phép

| Đặc điểm | Chi tiết |
|----------|----------|
| **Rules** | ✅ **Chỉ có ALLOW** - không có DENY rules |
| **Default** | Block tất cả (implicit deny) |
| **Stateful** | ✅ Response tự động được allow |
| **Level** | Instance (ENI) |
| **Chi phí** | ✅ Miễn phí |

> 💡 **Exam tip:** Nếu cần **DENY specific IPs** → dùng **NACL**, không phải Security Group!

```
Security Group hoạt động:
─────────────────────────
❌ Mọi thứ bị BLOCK by default
         ↓
✅ Chỉ những gì bạn ALLOW mới được vào/ra
         ↓
→ Không cần "deny rule" vì mặc định đã deny hết!
```

Xem chi tiết tại [Security Groups](security-groups.md).

---

## Pricing Models

Amazon EC2 cung cấp **7 mô hình pricing** chính để tối ưu chi phí theo từng use case:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EC2 PRICING MODELS OVERVIEW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   💰 On-Demand ────────▶ Linh hoạt nhất, không cam kết                      │
│                                                                             │
│   📅 Reserved Instance ─▶ Cam kết 1-3 năm, giảm tới 72%                     │
│                                                                             │
│   💳 Savings Plans ────▶ Cam kết $/giờ, linh hoạt instance type             │
│                                                                             │
│   🔖 Spot Instances ────▶ Capacity thừa, giảm tới 90% (có thể bị interrupt) │
│                                                                             │
│   🏠 Dedicated Hosts ──▶ Physical server riêng, BYOL support                │
│                                                                             │
│   🔒 Dedicated Instances▶ Instance chạy trên hardware riêng                 │
│                                                                             │
│   📦 Capacity Reservations▶ Đảm bảo capacity trong AZ cụ thể                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Mô hình | Discount | Cam kết | Phù hợp với |
|---------|----------|---------|-------------|
| **On-Demand** | 0% | Không | Workload ngắn hạn, testing |
| **Reserved Instances** | Lên đến 72% | 1-3 năm | Workload ổn định, biết trước cấu hình |
| **Savings Plans** | Lên đến 72% | 1-3 năm ($/giờ) | Workload ổn định, linh hoạt instance |
| **Spot Instances** | Lên đến 90% | Không | Fault-tolerant, batch processing |
| **Dedicated Hosts** | Varies | Tùy chọn | Compliance, BYOL |
| **Dedicated Instances** | +2$/giờ | Không | Hardware isolation |
| **Capacity Reservations** | 0% | Không | Đảm bảo capacity |

---

### 1. On-Demand Instances

**Mô hình cơ bản nhất** - trả tiền theo thời gian sử dụng, không cần cam kết trước.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ON-DEMAND PRICING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Không cần thanh toán trước (No upfront payment)             │
│  ✅ Không cam kết dài hạn (No long-term commitment)             │
│  ✅ Tăng/giảm capacity bất kỳ lúc nào                           │
│  ❌ Giá cao nhất trong các mô hình                              │
│                                                                 │
│  Billing:                                                       │
│  • Linux/Ubuntu: Per-second (min 60 giây)                       │
│  • Windows/RHEL/SUSE: Per-hour                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Use Cases:**
- 🧪 **Development/Testing** - environments cần spin up/down nhanh
- 📊 **Unpredictable workloads** - traffic không dự đoán được
- 🆕 **Short-term applications** - chạy một vài tuần/tháng
- 🔬 **Proof of concept** - thử nghiệm trước khi commit dài hạn

**Ví dụ giá (us-east-1):**
| Instance Type | vCPU | RAM | On-Demand/giờ |
|---------------|------|-----|---------------|
| t3.micro | 2 | 1 GB | $0.0104 |
| t3.medium | 2 | 4 GB | $0.0416 |
| m5.large | 2 | 8 GB | $0.096 |
| c5.xlarge | 4 | 8 GB | $0.17 |

> **Nguồn**: [On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/)

---

### 2. Reserved Instances (RI)

**Cam kết sử dụng 1 hoặc 3 năm** để nhận mức giảm giá đáng kể so với On-Demand.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESERVED INSTANCES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Commitment: 1 năm hoặc 3 năm                                               │
│  Discount: Lên đến 72% so với On-Demand                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    HAI LOẠI RESERVED INSTANCES                      │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  STANDARD RI                    CONVERTIBLE RI                      │    │
│  │  ─────────────                  ──────────────                      │    │
│  │  • Discount cao hơn (~72%)      • Discount thấp hơn (~66%)          │    │
│  │  • Không đổi được instance      • Có thể đổi sang instance          │    │
│  │    family (vd: m5 → m5)           family khác (vd: m5 → c5)         │    │
│  │  • Có thể modify size            • Linh hoạt hơn cho tương lai      │    │
│  │    trong cùng family                                                │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1 Payment Options (Upfront Payment)

**Upfront Payment** = **Trả trước** - Bạn trả một khoản tiền ngay khi mua Reserved Instance, thay vì trả hàng tháng.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    3 PAYMENT OPTIONS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ NO UPFRONT (Không trả trước)                                            │
│     • Trả: $0 ngay + monthly payment                                        │
│     • Discount: Thấp nhất                                                   │
│     • Phù hợp: Không muốn bỏ tiền trước nhiều                               │
│                                                                             │
│  2️⃣ PARTIAL UPFRONT (Trả trước một phần)                                    │
│     • Trả: ~50% upfront + reduced monthly                                   │
│     • Discount: Trung bình                                                  │
│     • Phù hợp: Cân bằng giữa upfront và monthly                             │
│                                                                             │
│  3️⃣ ALL UPFRONT (Trả trước 100%)                                            │
│     • Trả: 100% ngay từ đầu, $0 monthly                                     │
│     • Discount: Cao nhất                                                    │
│     • Phù hợp: Có sẵn tiền, muốn tiết kiệm tối đa                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Quy tắc nhớ:** Trả trước càng nhiều → Discount càng cao
> 
> All Upfront > Partial Upfront > No Upfront

| Payment Option | Upfront | Monthly | Discount |
|----------------|---------|---------|----------|
| **All Upfront** | 100% | $0 | Cao nhất |
| **Partial Upfront** | ~50% | ~50% | Trung bình |
| **No Upfront** | $0 | 100% | Thấp nhất |

**Ví dụ so sánh (m5.large, 1 năm, us-east-1):**

| Option | Upfront | Monthly | Total/năm | So với On-Demand |
|--------|---------|---------|-----------|------------------|
| On-Demand | $0 | $69.12 | $829.44 | - |
| No Upfront RI | $0 | $52.56 | $630.72 | Giảm 24% |
| Partial Upfront RI | $308 | $25.55 | $614.60 | Giảm 26% |
| All Upfront RI | $596 | $0 | $596.00 | Giảm 28% |

#### 2.2 Scope: Regional vs Zonal

> [!TIP]
> **Regional RI là MẶC ĐỊNH** khi mua trên AWS Console. AWS khuyến khích dùng Regional RI vì linh hoạt hơn.

| Scope | Mô tả | Flexibility | Capacity Reservation |
|-------|-------|-------------|---------------------|
| **Regional** (Default) | Áp dụng cho toàn Region | Tự động apply cho instances trong Region | ❌ Không |
| **Zonal** | Chỉ định cụ thể AZ | Chỉ apply cho AZ đó | ✅ Có (đảm bảo capacity) |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REGIONAL vs ZONAL RI                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REGIONAL RI (Default - Khuyến nghị)                                        │
│  ───────────────────────────────────                                        │
│                                                                             │
│       ┌───────────────────────────────────────────────────────┐             │
│       │                    us-east-1                          │             │
│       │   ┌─────────┐   ┌─────────┐   ┌─────────┐             │             │
│       │   │  1a ✅  │   │  1b ✅  │   │  1c ✅  │             │             │
│       │   │ Discount│   │ Discount│   │ Discount│             │             │
│       │   └─────────┘   └─────────┘   └─────────┘             │             │
│       │                                                       │             │
│       │   Discount áp dụng ở BẤT KỲ AZ nào trong Region!      │             │
│       └───────────────────────────────────────────────────────┘             │
│                                                                             │
│  ✅ AZ Flexibility: Launch ở AZ nào cũng được discount                      │
│  ✅ Size Flexibility: m5.large = 2 × m5.medium (cùng family)                │
│  ❌ Không có capacity reservation                                           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ZONAL RI (Chọn AZ cụ thể)                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│       ┌───────────────────────────────────────────────────────┐             │
│       │                    us-east-1                          │             │
│       │   ┌─────────┐   ┌─────────┐   ┌─────────┐             │             │
│       │   │  1a ✅  │   │  1b ❌  │   │  1c ❌  │             │             │
│       │   │ Discount│   │ No disc │   │ No disc │             │             │
│       │   │+Capacity│   │         │   │         │             │             │
│       │   └─────────┘   └─────────┘   └─────────┘             │             │
│       │                                                       │             │
│       │   Discount CHỈ ở AZ đã chọn (us-east-1a)!             │             │
│       └───────────────────────────────────────────────────────┘             │
│                                                                             │
│  ✅ Capacity Reservation: Đảm bảo LUÔN có máy sẵn trong AZ                  │
│  ❌ Không có AZ flexibility                                                 │
│  ❌ Không có Size flexibility                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Capacity Reservation là gì?**

| Không có Capacity Reservation | Có Capacity Reservation |
|-------------------------------|-------------------------|
| Launch EC2 → Có thể bị lỗi "InsufficientCapacity" nếu AZ hết máy | Launch EC2 → **LUÔN thành công** vì AWS giữ máy sẵn cho bạn |
| Giống mua voucher giảm giá nhưng không đặt ghế | Giống đặt trước ghế máy bay |

**Điều kiện để được RI discount (quan trọng cho exam!):**

| RI Type | Điều kiện matching |
|---------|-------------------|
| **Regional RI** | Cùng **Region** + Instance Type + Platform |
| **Zonal RI** | Cùng **AZ** + Instance Type + Platform |

**Ví dụ: RI Sharing trong Consolidated Billing (AWS Organizations)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│      RI Sharing - Regional RI vs Zonal RI trong Consolidated Billing        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Scenario: Susan (Account A) mua 5 RIs m5.large                             │
│            Bob (Account B) chạy 3 instances m5.large                        │
│            Cả hai trong cùng AWS Organization                               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Nếu Susan mua REGIONAL RI (us-east-1):                                     │
│ │                                                                           │
│  │  Susan chạy ở: us-east-1a                                                │
│  │  Bob chạy ở:   us-east-1b  ← KHÁC AZ                                     │
│ │                                                                           │
│  │  → Bob VẪN được discount! (Regional RI flexible across AZs)              │
│ │                                                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Nếu Susan mua ZONAL RI (us-east-1a):                                       │
│ │                                                                           │
│  │  Susan chạy ở: us-east-1a ✅                                             │
│  │  Bob chạy ở:   us-east-1b ❌ KHÔNG được discount!                        │
│ │                                                                           │
│  │  → Bob phải chạy ở us-east-1a thì mới được discount                      │
│ │                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Khi nào dùng loại nào?**

| Scenario | Nên dùng |
|----------|----------|
| Workload có thể chạy ở bất kỳ AZ | **Regional RI** ✅ |
| Cần linh hoạt scale size (large ↔ xlarge) | **Regional RI** ✅ |
| Database production - cần đảm bảo LUÔN có máy | **Zonal RI** |
| Disaster Recovery - cần guarantee capacity | **Zonal RI** |
| Mission-critical không chấp nhận "InsufficientCapacity" | **Zonal RI** |

#### 2.3 Instance Size Flexibility (Chỉ Regional RI)

Reserved Instance có thể apply cho các size khác nhau trong cùng instance family dựa trên **Normalization Factor**:

| Instance Size | Normalization Factor |
|---------------|---------------------|
| nano | 0.25 |
| micro | 0.5 |
| small | 1 |
| medium | 2 |
| large | 4 |
| xlarge | 8 |
| 2xlarge | 16 |
| 4xlarge | 32 |

**Ví dụ:** 1 RI cho `m5.xlarge` (factor = 8) có thể cover:
- 1 × m5.xlarge (8)
- 2 × m5.large (4 + 4 = 8)
- 4 × m5.medium (2 + 2 + 2 + 2 = 8)
- 8 × m5.small (1 × 8 = 8)

#### 2.4 Reserved Instance Marketplace

Có thể **mua/bán** Reserved Instances chưa sử dụng hết trên marketplace:

```
┌─────────────────────────────────────────────────────────────────┐
│                 RI MARKETPLACE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BÁN RI:                                                        │
│  • Bán RI còn thời hạn (tối thiểu 1 tháng remaining)            │
│  • AWS giữ 12% fee                                              │
│  • Chỉ bán được Standard RI (không bán Convertible)             │
│                                                                 │
│  MUA RI:                                                        │
│  • Mua RI của seller khác với giá rẻ hơn                        │
│  • Thời hạn còn lại ngắn hơn (vd: 6 tháng thay vì 12)           │
│  • Phù hợp nếu cần RI ngắn hạn                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Use Cases cho Reserved Instances:**
- 🏢 **Production workloads** - chạy 24/7, ổn định
- 🗄️ **Database servers** - RDS, self-managed databases
- 🌐 **Web servers** - baseline capacity
- 📈 **Workloads có thể dự đoán** - biết trước nhu cầu

> **Nguồn**: [Reserved Instances](https://aws.amazon.com/ec2/pricing/reserved-instances/)

---

### 3. Savings Plans

**Mô hình linh hoạt hơn Reserved Instances** - cam kết một mức chi tiêu ($/giờ) thay vì cam kết instance type cụ thể.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SAVINGS PLANS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Commitment: Cam kết số $/giờ trong 1 hoặc 3 năm                            │
│  Discount: Lên đến 72% so với On-Demand                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    BA LOẠI SAVINGS PLANS                            │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  1. COMPUTE SAVINGS PLANS (Linh hoạt nhất)                          │    │
│  │     • Áp dụng cho: EC2, Fargate, Lambda                             │    │
│  │     • Không quan tâm: Region, Instance family, OS, Tenancy          │    │
│  │     • Discount: Lên đến 66%                                         │    │
│  │                                                                     │    │
│  │  2. EC2 INSTANCE SAVINGS PLANS (Discount cao hơn)                   │    │
│  │     • Cam kết: Instance family + Region (vd: M5 ở us-east-1)        │    │
│  │     • Linh hoạt: Size, OS, Tenancy trong family đó                  │    │
│  │     • Discount: Lên đến 72%                                         │    │
│  │                                                                     │    │
│  │  3. SAGEMAKER SAVINGS PLANS                                         │    │
│  │     • Áp dụng cho: SageMaker ML instances                           │    │
│  │     • Discount: Lên đến 64%                                         │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.1 So sánh Savings Plans

| Loại | Commitment | Flexibility | Discount |
|------|------------|-------------|----------|
| **Compute Savings Plans** | $/giờ | EC2 + Fargate + Lambda, bất kỳ Region/family | ~66% |
| **EC2 Instance Savings Plans** | $/giờ + Region + Family | Size, OS, Tenancy trong family | ~72% |

#### 3.2 Cách hoạt động

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SAVINGS PLANS WORKFLOW                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Bước 1: Bạn cam kết $10/giờ trong 1 năm                                     │
│           ↓                                                                  │
│  Bước 2: Mỗi giờ, AWS tự động apply Savings Plans discount                   │
│           ↓                                                                  │
│  Bước 3: Usage vượt $10/giờ → phần thừa tính theo On-Demand                  │
│                                                                              │
│  VÍ DỤ:                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                                                                     │     │
│  │  Cam kết: $10/giờ                                                   │     │
│  │                                                                     │     │
│  │  Giờ 1: Usage = $8   → Trả $10 (cam kết), $2 không dùng hết         │     │
│  │  Giờ 2: Usage = $10  → Trả $10 (đúng cam kết)                       │     │
│  │  Giờ 3: Usage = $15  → Trả $10 (cam kết) + $5 (On-Demand) = $15     │     │
│  │                                                                     │     │
│  │  ⚠️ Lưu ý: Cam kết phải trả dù có dùng hay không!                   │     │
│  │                                                                     │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3 Savings Plans vs Reserved Instances

| Tiêu chí | Savings Plans | Reserved Instances |
|----------|---------------|-------------------|
| **Commitment** | $/giờ | Instance type cụ thể |
| **Flexibility** | Cao (đổi instance type dễ dàng) | Thấp (Standard) / Trung bình (Convertible) |
| **Scope** | EC2 + Fargate + Lambda | Chỉ EC2 |
| **Quản lý** | Đơn giản hơn | Phức tạp hơn |
| **Discount** | Tương đương | Tương đương |
| **Marketplace** | ❌ Không bán được | ✅ Có (Standard RI) |

> [!TIP]
> **AWS khuyến nghị sử dụng Savings Plans** thay cho Reserved Instances vì linh hoạt hơn mà vẫn có mức discount tương đương.

**Use Cases:**
- 🔄 **Workloads thay đổi** - có thể đổi instance type mà không mất discount
- ☁️ **Multi-service** - chạy cả EC2, Fargate, Lambda
- 🌍 **Multi-region** - với Compute Savings Plans

> **Nguồn**: [Savings Plans](https://aws.amazon.com/savingsplans/)

---

### 4. Spot Instances

**Sử dụng EC2 capacity thừa của AWS** với mức giá giảm lên đến **90%** so với On-Demand. Tuy nhiên, **AWS có thể thu hồi (interrupt) bất kỳ lúc nào** với 2 phút cảnh báo.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SPOT INSTANCES                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  💰 Discount: Lên đến 90% so với On-Demand                                   │
│  ⚠️ Risk: Có thể bị interrupt với 2 phút warning                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    SPOT INSTANCE LIFECYCLE                          │     │
│  ├─────────────────────────────────────────────────────────────────────┤     │
│  │                                                                     │     │
│  │  Request ──▶ Running ──▶ Interrupted (khi AWS cần capacity)         │     │
│  │                 │                    │                              │     │
│  │                 │         ┌──────────┴──────────┐                   │     │
│  │                 │         ▼                     ▼                   │     │
│  │                 │    Terminate            Hibernate/Stop            │     │
│  │                 │                                                   │     │
│  │                 └──▶ User Terminate                                 │     │
│  │                                                                     │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 4.1 Spot Pricing

- **Giá biến động** theo supply và demand
- **Không cần bidding** - bạn trả giá Spot hiện tại (AWS đã bỏ bidding từ 2017)
- Có thể set **max price** - nếu Spot price vượt max, instance bị terminate
- **Spot Price History** - xem biến động giá trong 90 ngày qua

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPOT PRICE EXAMPLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  m5.large (us-east-1):                                          │
│                                                                 │
│  On-Demand:  $0.096/giờ                                         │
│  Spot:       $0.035/giờ (biến động)                             │
│  Savings:    63%                                                │
│                                                                 │
│  Spot price biến động theo:                                     │
│  • Availability Zone                                            │
│  • Instance type                                                │
│  • Thời điểm trong ngày/tuần                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Spot Instance Interruption

Khi AWS cần capacity, Spot Instance sẽ nhận **2-minute warning** qua:
- **EC2 metadata** - check `http://169.254.169.254/latest/meta-data/spot/termination-time`
- **CloudWatch Events / EventBridge** - trigger automation

**Interruption behavior options:**
| Option | Mô tả | Use Case |
|--------|-------|----------|
| **Terminate** | Instance bị terminate, EBS bị xóa (nếu DeleteOnTermination=true) | Stateless workloads |
| **Stop** | Instance stop, EBS giữ lại (chỉ EBS-backed) | Resume sau |
| **Hibernate** | RAM saved to EBS, resume nhanh (chỉ supported instances) | Stateful applications |

**Tần suất bị interrupt (Interruption Frequency):**

> [!NOTE]
> **Thực tế**: Spot Instances **không thường xuyên** bị interrupt. AWS thống kê chỉ khoảng **< 5% instances** bị interrupt trong một tháng, tùy thuộc vào instance type và region.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPOT INTERRUPTION FREQUENCY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Trung bình: < 5% instances bị interrupt trong 1 tháng                      │
│                                                                             │
│  Tỷ lệ thay đổi theo:                                                       │
│                                                                             │
│  📍 REGION                                                                  │
│  • us-east-1 (phổ biến) → nhiều demand → interrupt cao hơn                  │
│  • Region ít popular → interrupt thấp hơn                                   │
│                                                                             │
│  💻 INSTANCE TYPE                                                           │
│  • Instance phổ biến (m5, c5) → interrupt cao hơn                           │
│  • Instance ít dùng (m5a, m6i) → interrupt thấp hơn                         │
│                                                                             │
│  🕐 THỜI ĐIỂM                                                               │
│  • Peak hours → interrupt cao hơn                                           │
│  • Off-peak, weekends → interrupt thấp hơn                                  │
│                                                                             │
│  📦 AVAILABILITY ZONE                                                       │
│  • AZ khác nhau có tỷ lệ khác nhau                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cách giảm nguy cơ bị interrupt:**
- ✅ Chọn instance **ít phổ biến** (ví dụ: m5a thay vì m5, hoặc newer generation)
- ✅ Dùng **Spot Fleet** với nhiều instance types + AZs (diversify)
- ✅ Chọn **capacityOptimized** allocation strategy (AWS tự chọn pool ít interrupt)
- ✅ Check **Spot Instance Advisor** trong Console để xem tỷ lệ interrupt

> 💡 **Thực tế**: Nhiều công ty lớn (Netflix, Lyft, Yelp) dùng Spot cho phần lớn workload và tiết kiệm hàng triệu USD. Họ thiết kế application **fault-tolerant** nên không sợ bị interrupt.

#### 4.3 Spot Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPOT STRATEGIES                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SPOT FLEET                                                              │
│     • Kết hợp nhiều instance types + AZs                                    │
│     • Tự động thay thế khi bị interrupt                                     │
│     • Allocation strategies: lowestPrice, capacityOptimized, diversified    │
│                                                                             │
│  2. EC2 AUTO SCALING với MIXED INSTANCES POLICY                             │
│     • Base capacity: On-Demand (đảm bảo baseline)                           │
│     • Scale capacity: Spot (tiết kiệm chi phí)                              │
│     • Ví dụ: 2 On-Demand + 8 Spot                                           │
│                                                                             │
│  3. SPOT BLOCK (Đã deprecated)                                              │
│     • Đặt Spot trong 1-6 giờ, không bị interrupt                            │
│     • AWS đã ngừng offering mới từ 07/2021                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.4 Spot Allocation Strategies

| Strategy | Mô tả | Best For |
|----------|-------|----------|
| **lowestPrice** | Chọn pool có giá thấp nhất | Cost optimization |
| **capacityOptimized** | Chọn pool có capacity cao nhất (ít bị interrupt) | Workloads cần stability |
| **diversified** | Phân bổ đều qua các pools | Long-running workloads |
| **priceCapacityOptimized** | Cân bằng giữa giá và capacity | **Recommended** |

**Use Cases phù hợp với Spot:**
- 🔄 **Batch processing** - có thể retry nếu bị interrupt
- 🧪 **CI/CD pipelines** - build/test jobs
- 🎮 **Gaming servers** - non-critical game servers
- 📊 **Big data analytics** - Spark, Hadoop clusters
- 🤖 **Machine Learning** - training jobs (với checkpointing)
- 🖼️ **Image/Video processing** - rendering, transcoding

**Use Cases KHÔNG phù hợp:**
- ❌ **Databases** - cần uptime cao
- ❌ **Critical production workloads** - không thể bị interrupt
- ❌ **Stateful applications** - không thể mất state

> **Nguồn**: [Spot Instances](https://aws.amazon.com/ec2/spot/)

---

### 5. Dedicated Hosts

**Physical server EC2 hoàn toàn dành riêng cho bạn**. Bạn có thể control placement của instances trên physical server đó.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DEDICATED HOSTS                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Physical Server ──────────────────────────────────────────────────────      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  Host ID: h-0abc123def456789                                        │     │
│  │  Instance Family: m5                                                │     │
│  │  Sockets: 2  │  Cores: 48  │  Available Instances: varies           │     │
│  │                                                                     │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │     │
│  │  │ m5.lg   │ │ m5.lg   │ │ m5.xl   │ │ m5.2xl  │ │ (empty) │        │     │
│  │  │ Your    │ │ Your    │ │ Your    │ │ Your    │ │         │        │     │
│  │  │ Instance│ │ Instance│ │ Instance│ │ Instance│ │         │        │     │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │     │
│  │                                                                     │     │
│  │  ⚠️ Bạn control: Physical server có bao nhiêu instances chạy        │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1 Đặc điểm

| Feature | Mô tả |
|---------|-------|
| **Physical isolation** | Hardware không chia sẻ với account khác |
| **Socket/Core visibility** | Biết chính xác số sockets, cores |
| **Instance placement** | Control instances chạy trên host nào |
| **BYOL support** | Sử dụng existing licenses (Windows Server, SQL Server, SUSE, etc.) |
| **Compliance** | Đáp ứng các yêu cầu regulatory |

#### 5.2 Instance Placement Control là gì?

**Placement** nghĩa là bạn có thể **chọn chính xác physical server nào** để launch EC2 instances lên đó.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLACEMENT CONTROL                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CÓ Dedicated Host (On-Demand/Spot thường):                           │
│  ─────────────────────────────────────────────────                          │
│  Bạn launch EC2 → AWS tự động chọn physical server cho bạn                  │
│  Bạn KHÔNG BIẾT instance chạy trên server nào                               │
│                                                                             │
│                     ┌──────────────────────┐                                │
│  Launch EC2 ──────▶ │  AWS chọn server     │ ──▶ Instance chạy ở đâu đó     │
│                     │  (bạn ko control)    │                                │
│                     └──────────────────────┘                                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CÓ Dedicated Host:                                                         │
│  ─────────────────                                                          │
│  Bạn có physical server riêng với Host ID (vd: h-0abc123def)                │
│  Bạn có thể QUYẾT ĐỊNH instances chạy trên host nào                         │
│                                                                             │
│  Launch EC2 ──────▶ "Đặt lên host h-0abc123def" ──▶ Instance chạy ở host đó │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao cần Placement Control?**

| Lý do | Giải thích |
|-------|------------|
| **BYOL Licensing** | License theo socket/core → cần biết chính xác instance chạy trên server nào để report cho vendor |
| **Affinity** | Đảm bảo instances liên quan luôn chạy trên cùng 1 host (giảm latency) |
| **Compliance/Audit** | Cần biết chính xác hardware nào đang chạy data của bạn |
| **Performance** | Control instances không bị "noisy neighbor" effect |

**Ví dụ BYOL với Windows Server:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BYOL EXAMPLE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dedicated Host (48 cores, 2 sockets):                          │
│  ├── Windows Server #1 (8 cores) ✅                             │
│  ├── Windows Server #2 (8 cores) ✅                             │
│  ├── Windows Server #3 (8 cores) ✅                             │
│  └── Còn trống 24 cores                                         │
│                                                                 │
│  → Bạn report cho Microsoft: "Tôi dùng 24 cores trên 1 host"    │
│  → Bạn CONTROL được việc này vì biết chính xác placement        │
│  → Tiết kiệm license cost so với mua từ AWS                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3 Pricing Options

| Option | Mô tả | Discount |
|--------|-------|----------|
| **On-Demand** | Trả per-hour, không cam kết | 0% |
| **Reservation** | Cam kết 1-3 năm | Lên đến 70% |
| **Savings Plans** | Có thể áp dụng | Lên đến 72% |

#### 5.4 Use Cases

- 📜 **Bring Your Own License (BYOL)** - sử dụng licenses theo socket/core
- 🔒 **Compliance requirements** - PCI DSS, HIPAA yêu cầu dedicated hardware
- 📊 **Licensing visibility** - cần report chính xác số cores/sockets
- 🏛️ **Government/Financial** - quy định về data isolation

> **Nguồn**: [Dedicated Hosts](https://aws.amazon.com/ec2/dedicated-hosts/)

---

### 6. Dedicated Instances

**Instances chạy trên hardware dành riêng cho account của bạn**, nhưng có thể chia sẻ hardware với instances khác trong **cùng account**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              DEDICATED INSTANCES vs DEDICATED HOSTS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DEDICATED INSTANCES                      DEDICATED HOSTS                   │
│  ─────────────────────                    ────────────────                  │
│  • Hardware riêng cho account             • Physical server riêng cho bạn   │
│  • Không control placement                • Control placement instances     │
│  • Không biết socket/core info            • Biết socket/core information    │
│  • Không support BYOL                     • Support BYOL                    │
│  • Phí: +$2/giờ/region + instance price   • Phí: Per-host pricing           │
│                                                                             │
│  ┌───────────────────────────────┐        ┌───────────────────────────────┐ │
│  │ Physical Server (AWS managed) │        │ Physical Server (You control) │ │
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │        │ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │ │
│  │ │You │ │You │ │You │ │    │  │        │ │You │ │You │ │You │ │    │    │ │
│  │ └────┘ └────┘ └────┘ └────┘  │        │ └────┘ └────┘ └────┘ └────┘    │ │
│  │ Chỉ instances trong account   │        │ Bạn decide instances nào chạy │ │
│  └───────────────────────────────┘        └───────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.1 Pricing

- **Dedicated Instance fee**: $2/giờ/region (trả 1 lần cho toàn region, không phải per-instance)
- **Instance price**: Giá On-Demand của instance type

**Ví dụ:**
- 1 m5.large dedicated instance trong 1 giờ ở us-east-1:
  - Dedicated fee: $2.00
  - Instance price: $0.096
  - **Total: $2.096/giờ**

- 10 m5.large dedicated instances trong 1 giờ:
  - Dedicated fee: $2.00 (chỉ trả 1 lần)
  - Instance price: $0.096 × 10 = $0.96
  - **Total: $2.96/giờ**

#### 6.2 Use Cases

- 🔒 **Hardware isolation** - không muốn share với account khác
- 📜 **Compliance** - nhưng không cần BYOL

> **Nguồn**: [Dedicated Instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-instance.html)

---

### 7. On-Demand Capacity Reservations

**Đặt trước capacity trong một AZ cụ thể** để đảm bảo luôn có instances sẵn sàng khi cần.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    CAPACITY RESERVATIONS                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Đảm bảo bạn LUÔN CÓ capacity để launch instances                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                                                                     │     │
│  │  Vấn đề: Khi AWS hết capacity trong một AZ                          │     │
│  │  ───────────────────────────────────────────                        │     │
│  │                                                                     │     │
│  │  ❌ Không có Capacity Reservation:                                  │     │
│  │     Launch request → "InsufficientInstanceCapacity" error           │     │
│  │                                                                     │     │
│  │  ✅ Có Capacity Reservation:                                        │     │
│  │     Launch request → Success (capacity đã được reserved)            │     │
│  │                                                                     │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ⚠️ LƯU Ý: Capacity Reservation KHÔNG tự động có discount!                   │
│     Phải kết hợp với RI hoặc Savings Plans để có discount                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 7.1 Đặc điểm

| Feature | Mô tả |
|---------|-------|
| **No commitment** | Tạo/hủy bất kỳ lúc nào |
| **Immediate availability** | Reservation active ngay lập tức |
| **AZ-specific** | Phải chọn AZ cụ thể |
| **Billing** | Trả On-Demand price cho reserved capacity (dù có sử dụng hay không) |

#### 7.2 Pricing

- **Capacity Reservation fee**: **$0** (không phí riêng)
- **Bạn trả**: On-Demand price cho capacity đã reserve
- **Với RI/Savings Plans**: Discount được apply nếu matching

```
┌─────────────────────────────────────────────────────────────────┐
│                CAPACITY RESERVATION + RI/SP                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Kịch bản: Reserve 5 × m5.large ở us-east-1a                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Option 1: Chỉ Capacity Reservation                       │   │
│  │ → Trả On-Demand price (không discount)                   │   │
│  │ → Đảm bảo capacity                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Option 2: Capacity Reservation + Zonal RI                │   │
│  │ → Discount từ RI + Đảm bảo capacity                      │   │
│  │ → Best of both worlds!                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Option 3: Capacity Reservation + Savings Plans           │   │
│  │ → Discount từ SP + Đảm bảo capacity                      │   │
│  │ → Linh hoạt hơn RI                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.3 Use Cases

- 🚨 **Disaster recovery** - đảm bảo capacity cho failover
- 📅 **Planned events** - product launches, sales events
- 🏢 **Critical workloads** - không thể chấp nhận InsufficientCapacity
- 📜 **Compliance** - yêu cầu capacity guarantee

> **Nguồn**: [On-Demand Capacity Reservations](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-capacity-reservations.html)

---

### 8. Free Tier

AWS cung cấp Free Tier cho người dùng mới:

| Resource | Free Amount | Duration |
|----------|-------------|----------|
| **EC2 t2.micro/t3.micro** | 750 giờ/tháng | 12 tháng đầu |
| **EBS General Purpose (SSD)** | 30 GB/tháng | 12 tháng đầu |
| **EBS Snapshots** | 1 GB/tháng | 12 tháng đầu |
| **Elastic IP** | 1 EIP attached | Miễn phí khi attached |

> [!WARNING]
> Free Tier chỉ áp dụng trong **12 tháng đầu tiên** kể từ khi tạo AWS account. Sau đó sẽ tính phí On-Demand.

> **Chi tiết**: [AWS Free Tier](https://aws.amazon.com/free/)

---

### 9. Per-Second Billing (Tính phí theo giây)

> [!IMPORTANT]
> **Từ tháng 10/2017**, EC2 và EBS chuyển từ per-hour sang **per-second billing**.

| Service | Billing | Minimum |
|---------|---------|---------|
| **Linux EC2** (On-Demand, Reserved, Spot) | Per-second ⏱️ | 1 phút (60 giây) |
| **Windows EC2** | Per-hour ⏰ | 1 giờ |
| **RHEL/SUSE EC2** | Per-hour ⏰ | 1 giờ |
| **EBS Volumes** (provisioned storage) | Per-second | 1 phút |
| **EBS Provisioned IOPS** (io1/io2) | Per-second | - |
| **EBS Snapshots** | Per-hour | - |

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PER-SECOND BILLING EXAMPLE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Linux instance chạy 5 phút 30 giây:                                │
│  → Bạn trả cho: 5 phút 30 giây = 330 giây                           │
│                                                                     │
│  Linux instance chạy 45 giây:                                       │
│  → Bạn trả cho: 1 phút (minimum)                                    │
│                                                                     │
│  Windows instance chạy 5 phút 30 giây:                              │
│  → Bạn trả cho: 1 giờ (per-hour billing)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Lợi ích per-second billing:**
- ✅ CI/CD pipelines - build xong terminate ngay
- ✅ Dev/Test environments - spin up/down nhanh
- ✅ Batch processing - jobs chạy vài phút
- ✅ Auto Scaling - scale nhanh không lo phí thừa

> **Nguồn**: [Per-Second Billing for EC2 and EBS](https://aws.amazon.com/blogs/aws/new-per-second-billing-for-ec2-instances-and-ebs-volumes/)

---

### Tổng hợp: Chọn Pricing Model nào?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRICING MODEL DECISION TREE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Workload có thể bị interrupt?                                              │
│ │                                                                           │
│ ├── Có → SPOT INSTANCES (giảm 90%)                                         │
│ │        • Batch processing, CI/CD, analytics                              │
│ │                                                                           │
│ └── Không ↓                                                                │
│                                                                             │
│  Biết trước nhu cầu 1-3 năm?                                                │
│ │                                                                           │
│ ├── Có → SAVINGS PLANS hoặc RESERVED INSTANCES (giảm 72%)                  │
│ │       │                                                                  │
│ │       ├── Cần flexibility → Savings Plans                               │
│ │       │                                                                  │
│ │       └── Cần bán lại RI → Reserved Instances (Standard)                │
│ │                                                                           │
│ └── Không ↓                                                                │
│                                                                             │
│  Cần hardware riêng?                                                        │
│ │                                                                           │
│ ├── Có + Cần BYOL → DEDICATED HOSTS                                        │
│ │                                                                           │
│ ├── Có + Không cần BYOL → DEDICATED INSTANCES                              │
│ │                                                                           │
│ └── Không → ON-DEMAND                                                      │
│                                                                             │
│  Cần đảm bảo capacity?                                                      │
│ │                                                                           │
│ └── Có → Thêm CAPACITY RESERVATIONS (kết hợp với RI/SP để có discount)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Scenario | Recommended Option |
|----------|-------------------|
| Dev/Test, unpredictable workload | **On-Demand** |
| Production 24/7, ổn định | **Savings Plans** hoặc **Reserved Instances** |
| Batch processing, ML training | **Spot Instances** |
| Baseline + burst | **On-Demand/RI** + **Spot** (Mixed) |
| BYOL (Windows Server, SQL Server) | **Dedicated Hosts** |
| Compliance cần isolated hardware | **Dedicated Hosts** hoặc **Dedicated Instances** |
| Critical workload, cần guarantee capacity | **Capacity Reservations** + **RI/SP** |

> **Nguồn**: [Amazon EC2 Pricing](https://aws.amazon.com/ec2/pricing/)

---

## Placement Groups

**Placement Groups** cho phép kiểm soát cách EC2 instances được đặt trên physical hardware để tối ưu performance hoặc high availability.

### 3 Loại Placement Groups

| Loại | Mô tả | Max Instances | Use Cases |
|------|-------|---------------|----------|
| **Cluster** | Instances đặt **cùng rack, cùng AZ** | Không giới hạn | HPC, Big Data, ML training |
| **Spread** | Mỗi instance trên **hardware riêng biệt** | 7 per AZ | Critical apps, isolated failures |
| **Partition** | Chia thành partitions, mỗi partition trên rack riêng | 7 partitions per AZ | Hadoop, Cassandra, Kafka |

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        PLACEMENT GROUPS                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  1. CLUSTER               2. SPREAD                  3. PARTITION                      │
│  ─────────────            ─────────────              ─────────────                     │
│                                                                                         │
│  ┌───────────────┐        ┌────────────────────┐     ┌────────────────────┐             │
│  │   Same Rack   │        │  Rack1  │  Rack2   │     │  Part1  │  Part2   │             │
│  │  ┌───┐  ┌───┐ │        │  ┌───┐  │  ┌───┐  │     │ (RackA) │ (RackB)  │             │
│  │  │EC2│  │EC2│ │        │  │EC2│  │  │EC2│  │     │  ┌───┐  │  ┌───┐  │             │
│  │  └───┘  └───┘ │        │  └───┘  │  └───┘  │     │  │EC2│  │  │EC2│  │             │
│  │  ┌───┐  ┌───┐ │        │  Rack3  │  Rack4   │     │  │EC2│  │  │EC2│  │             │
│  │  │EC2│  │EC2│ │        │  ┌───┐  │  ┌───┐  │     │  └───┘  │  └───┘  │             │
│  │  └───┘  └───┘ │        │  │EC2│  │  │EC2│  │     └────────────────────┘             │
│  └───────────────┘        │  └───┘  │  └───┘  │                                        │
│                           └────────────────────┘                                       │
│  Low latency              High availability          Distributed                        │
│  High throughput          Isolated failures          Big Data                           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Cluster Placement Group

- Tất cả instances nằm trên **cùng rack trong cùng AZ**
- **Low latency** (< 10 microseconds) và **high throughput** (10-25 Gbps)
- ⚠️ **Risk**: Nếu rack fail → tất cả fail

**Use Cases:**
- HPC (High Performance Computing)
- Big Data jobs cần network nhanh
- ML/AI distributed training

### 2. Spread Placement Group

- Mỗi instance trên **hardware riêng biệt** (khác rack)
- **Max 7 instances per AZ** (cứ nhân với số AZ)
- Giảm risk correlated failures

**Use Cases:**
- Critical applications
- Database replicas
- High availability yêu cầu isolate failures

### 3. Partition Placement Group

- Chia instances thành **partitions** (max 7 per AZ)
- Mỗi partition nằm trên **rack riêng**
- Instances trong cùng partition chia sẻ rack

**Use Cases:**
- **Hadoop** (HDFS), **Cassandra**, **Kafka** - distributed big data
- Cần partition-awareness để đặt replicas khác partition

### Rack là gì?

**Rack** = tủ/khung kim loại trong data center chứa nhiều servers xếp chồng lên nhau:

```
┌────────────────────────────────┐
│         RACK (Tủ máy chủ)      │
│   ┌────────────────────────┐   │
│   │  Server 1 (EC2)        │   │
│   ├────────────────────────┤   │  ← Các servers chia sẻ:
│   │  Server 2 (EC2)        │   │
│   ├────────────────────────┤   │    • Cùng network switch
│   │  Server 3 (EC2)        │   │
│   ├────────────────────────┤   │
│   │  Network Switch        │   │
│   └────────────────────────┘   │
└────────────────────────────────┘
```

> ⚠️ **Single point of failure**: Nếu rack mất điện/switch hỏng → tất cả servers trong rack bị ảnh hưởng

### Cách cấu hình Placement Groups

**Bước 1: Tạo Placement Group**
```
Console: EC2 → Network & Security → Placement Groups → Create
CLI:     aws ec2 create-placement-group --group-name my-group --strategy cluster
```

**Bước 2: Gán vào EC2 Instance**
```
Launch Instance → Advanced Details → Placement group → Chọn group đã tạo
```

**Bước 3: Dùng với Launch Template (cho ASG)**
```
Create Launch Template → Advanced Details → Placement group name
```

> ⚠️ **Instance đang chạy** không thể add vào Placement Group → phải **stop** trước hoặc tạo mới

### Lưu ý quan trọng

| Yếu tố | Chi tiết |
|--------|----------|
| **Tạo khi nào** | Chỉ có thể add instances khi create/modify |
| **Instance types** | Nên dùng **cùng instance type** trong Cluster |
| **Capacity errors** | Cluster có thể gặp `InsufficientCapacity` - launch tất cả cùng lúc để tránh |
| **Launch Template** | Hỗ trợ Placement Groups (Launch Configuration không hỗ trợ) |

> **Nguồn**: [Placement Groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/placement-groups.html)

---

## Cách truy cập EC2

### Quản lý EC2 (Management)

1. **AWS Management Console** - Giao diện web
2. **AWS CLI** - Command line interface
3. **AWS SDKs** - Tích hợp vào code (Python/Boto3, JavaScript, Java, etc.)
4. **CloudFormation** - Infrastructure as Code
5. **AWS Tools for PowerShell**

### Connect to Instance (SSH/Shell vào EC2)

Có 3 cách để connect vào EC2 instance:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│              EC2 Console → Select Instance → Connect                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐        │
│   │   SSH Client      │  │ EC2 Instance      │  │ Session Manager   │        │
│   │   (Manual)        │  │ Connect           │  │                   │        │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘        │
│                                                                              │
│          Tab 1                  Tab 2                  Tab 3                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 1. SSH Client (Truyền thống)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SSH Client - Flow                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Bạn ──── SSH (port 22) ────► EC2 Instance                                  │
│        │                           ▲                                         │
│        │                           │                                         │
│    Private key               Security Group                                  │
│    (your machine)            phải mở port 22                                 │
│                                                                              │
│   Command: ssh -i "key.pem" ec2-user@<public-ip>                             │
│                                                                              │
│   YÊU CẦU:                                                                   │
│   • Key pair (.pem file)                                                     │
│   • Security Group mở port 22                                                │
│   • EC2 có public IP hoặc bạn ở cùng VPC                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 2. EC2 Instance Connect (SSH có AWS quản lý key)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    EC2 Instance Connect - Flow                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Bạn ấn "Connect" trong Console:                                            │
│                                                                              │
│   Step 1: AWS tạo temporary SSH key (valid 60 giây)                          │
│   Step 2: AWS push public key vào ~/.ssh/authorized_keys                     │
│   Step 3: Browser SSH thẳng vào EC2 qua port 22                              │
│                                                                              │
│   ┌─────────────────┐      SSH (port 22)       ┌─────────────────┐           │
│   │  Browser        │ ────────────────────────►│  EC2 Instance   │           │
│   │  (terminal)     │                          │                 │           │
│   └─────────────────┘                          └─────────────────┘           │
│                                                                              │
│   YÊU CẦU:                                                                   │
│   • Port 22 PHẢI mở trong Security Group                                     │
│   • EC2 có public IP                                                         │
│   • Vẫn là SSH, chỉ là AWS quản lý key cho bạn                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 3. Session Manager (KHÔNG dùng SSH - Recommended!)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Session Manager - Flow                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Bạn ấn "Connect" với Session Manager:                                      │
│                                                                              │
│   ┌─────────────────┐           ┌─────────────────┐                          │
│   │  Browser/CLI    │ ────────► │  SSM Service    │                          │
│   └─────────────────┘           └────────┬────────┘                          │
│                                          │                                   │
│                                          ▼                                   │
│   ┌─────────────────┐           ┌─────────────────┐                          │
│   │  EC2 Instance   │ ◄──────── │  SSM Agent      │                          │
│   │  (NO port open) │  polling  │  (trong EC2)    │                          │
│   └─────────────────┘           └─────────────────┘                          │
│                                                                              │
│   KHÔNG cần:                                                                 │
│   ✅ SSH keys                                                                │
│   ✅ Port 22 mở                                                              │
│   ✅ Public IP                                                               │
│   ✅ Bastion host                                                            │
│                                                                              │
│   CẦN:                                                                       │
│   • SSM Agent đang chạy (có sẵn trên Amazon Linux, Windows Server)           │
│   • IAM Role với AmazonSSMManagedInstanceCore policy                         │
│   • Agent có đường đi đến SSM Service (internet hoặc VPC Endpoint)           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### So sánh 3 phương thức

| | SSH Client | EC2 Instance Connect | Session Manager |
|--|------------|---------------------|-----------------|
| **Bản chất** | SSH thủ công | SSH (AWS quản lý key) | SSM (không dùng SSH) |
| **Port 22?** | ✅ Phải mở | ✅ Phải mở | ❌ **Không cần** |
| **SSH Key?** | ✅ Cần .pem file | ❌ AWS tự tạo | ❌ Không cần |
| **Public IP?** | ✅ Cần | ✅ Cần | ❌ **Không cần** |
| **IAM Role?** | ❌ Không cần | ❌ Không cần | ✅ Cần |
| **SSM Agent?** | ❌ Không cần | ❌ Không cần | ✅ Cần |
| **Logging** | Không có | Không có | ✅ **Full session logging** |
| **Private subnet?** | ❌ Khó (cần bastion) | ❌ Khó | ✅ **Hoạt động tốt** |
| **Security** | Phụ thuộc key mgmt | Khá tốt | ✅ **Tốt nhất** |

> [!TIP]
> **Session Manager là cách recommended** vì:
> - Không cần mở port → Attack surface = 0
> - Không cần quản lý SSH keys
> - Full audit logging với CloudTrail/CloudWatch
> - Hoạt động tốt cho private subnet

---

## Các dịch vụ liên quan

### 1. EC2 Auto Scaling

Tự động điều chỉnh số lượng EC2 instances dựa trên demand.

**Lưu ý quan trọng:** Auto Scaling **chỉ thêm/bớt instances** - không tự routing traffic. Cần kết hợp với **ELB** để phân phối requests:

```
                         ┌─────────────────┐
     Users ──────────▶   │  Load Balancer  │
                         └────────┬────────┘
                                  │ distributes traffic
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
         ┌─────────┐         ┌─────────┐         ┌─────────┐
         │ EC2 #1  │         │ EC2 #2  │         │ EC2 #3  │
         └─────────┘         └─────────┘         └─────────┘
                    └─────────────┬─────────────┘
                                  │
                         Auto Scaling Group
                      (manages instance count)
```

| Component | Nhiệm vụ |
|-----------|----------|
| **Auto Scaling** | Thêm/bớt instances dựa trên metrics |
| **ELB** | Routing requests đến các instances healthy |

**Cách hoạt động:**
- Định nghĩa **Auto Scaling Group (ASG)** với min/max/desired capacity
- Sử dụng **scaling policies** để trigger scale out/in dựa trên CloudWatch metrics (CPU, memory, network I/O)
- Tự động thay thế instances bị unhealthy

**Tính năng chính:**
| Feature | Mô tả |
|---------|-------|
| **Dynamic Scaling** | Scale dựa trên metrics real-time |
| **Predictive Scaling** | Dự đoán traffic và scale trước |
| **Scheduled Scaling** | Scale theo lịch định sẵn |
| **Health Checks** | EC2 health checks hoặc ELB health checks |

**Mixed Instances Policy:**
- Kết hợp **On-Demand + Spot Instances** trong cùng ASG
- Đặt base capacity với On-Demand, scale thêm với Spot để tiết kiệm chi phí

**Instance Identification:**
- Instances **không có tên cố định** - được identify bằng Instance ID (`i-0abc123def`)
- Có thể config **Name tag** trong Launch Template (tất cả instances cùng tag, phân biệt bằng ID)
- IP thay đổi mỗi lần launch → **dùng ELB DNS** làm entry point, không dựa vào IP

**Chi phí (Pricing):**

| Thành phần | Chi phí |
|------------|---------|
| Auto Scaling service | **Miễn phí** |
| EC2 instances | Trả theo instances đang chạy |
| ELB | Theo giờ + data processed |
| CloudWatch | Metrics cơ bản miễn phí |

*Chiến lược tiết kiệm:* Base capacity với On-Demand/Reserved, scale thêm với **Spot** (giảm đến 90%).

> **Nguồn**: [Amazon EC2 Auto Scaling Pricing](https://aws.amazon.com/ec2/autoscaling/pricing/)

---

### 2. Elastic Load Balancing (ELB)

Phân phối traffic đến nhiều EC2 instances, containers, hoặc IP addresses.

**Các loại Load Balancer:**

| Loại | Layer | Use Cases |
|------|-------|-----------|
| **Application Load Balancer (ALB)** | Layer 7 (HTTP/HTTPS) | Web applications, microservices, path-based routing |
| **Network Load Balancer (NLB)** | Layer 4 (TCP/UDP) | Ultra-low latency, millions of requests/second |
| **Gateway Load Balancer (GWLB)** | Layer 3 | Deploy và scale virtual appliances (firewalls, IDS/IPS) |
| **Classic Load Balancer** | Layer 4/7 | Legacy, không khuyến khích cho ứng dụng mới |

**Tích hợp với Auto Scaling:**
- Instances trong ASG tự động được **register/deregister** với load balancer
- ELB health checks có thể trigger ASG thay thế unhealthy instances
- Traffic được phân phối đều bằng **least outstanding requests** algorithm

> **Nguồn**: [Use ELB with Auto Scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/autoscaling-load-balancer.html)

---

### 3. Amazon CloudWatch

Dịch vụ monitoring và observability cho AWS resources.

**Metrics cho EC2:**
- **CPU Utilization**, Network In/Out, Disk Read/Write
- **Status Checks**: Instance status và system status
- Custom metrics (memory, disk space) qua CloudWatch Agent

**Metrics cho Auto Scaling:**
- `GroupDesiredCapacity`, `GroupInServiceInstances`
- `GroupPendingInstances`, `GroupTerminatingInstances`
- Predictive scaling metrics

**Tính năng:**
| Feature | Mô tả |
|---------|-------|
| **CloudWatch Alarms** | Trigger actions khi metric vượt ngưỡng |
| **CloudWatch Logs** | Collect và store log files |
| **CloudWatch Dashboards** | Visualize metrics |
| **CloudWatch Events/EventBridge** | React to state changes |

> **Nguồn**: [CloudWatch metrics for EC2 Auto Scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-metrics.html)

---

### 4. AWS Systems Manager

Quản lý EC2 instances và on-premises servers at scale.

**Tính năng chính:**

| Feature | Mô tả |
|---------|-------|
| **Session Manager** | SSH/RDP không cần mở ports, không cần bastion host |
| **Run Command** | Chạy scripts trên nhiều instances cùng lúc |
| **Patch Manager** | Tự động patch OS và applications |
| **Parameter Store** | Lưu trữ configuration data, secrets |
| **State Manager** | Maintain consistent configuration |
| **Inventory** | Collect metadata từ instances |

**Yêu cầu:**
- **SSM Agent** phải được cài đặt trên instance (có sẵn trên Amazon Linux, Ubuntu, Windows AMIs)
- Instance cần **IAM role** với policy `AmazonSSMManagedInstanceCore`

---

### 5. EC2 Image Builder

Tự động tạo, test, và distribute custom AMIs hoặc container images.

**Pipeline workflow:**
1. **Base Image** → Chọn source AMI (Amazon Linux, Windows, Ubuntu, etc.)
2. **Components** → Thêm software, configurations, security hardening
3. **Test** → Chạy automated tests để validate image
4. **Distribute** → Copy AMI đến các regions, share với accounts khác

**Lợi ích:**
- **Automated patching**: Tự động rebuild images khi có security updates
- **Compliance**: Áp dụng CIS Benchmarks, STIG hardening
- **Version control**: Track changes qua semantic versioning
- **Integration**: Tích hợp với Systems Manager Parameter Store

**Pricing:** Chỉ trả tiền cho underlying resources (EC2, EBS, S3) - không có phí riêng cho Image Builder.

> **Nguồn**: [EC2 Image Builder Features](https://aws.amazon.com/image-builder/features/)

---

### 6. Amazon EBS (Elastic Block Store)

Block-level storage volumes cho EC2 instances.

**Volume Types:**

| Type | Use Case | Max IOPS | Max Throughput |
|------|----------|----------|----------------|
| **gp3** (General Purpose SSD) | Most workloads | 16,000 | 1,000 MB/s |
| **gp2** (General Purpose SSD) | Boot volumes, dev/test | 16,000 | 250 MB/s |
| **io2/io2 Block Express** | Critical databases | 256,000 | 4,000 MB/s |
| **st1** (Throughput HDD) | Big data, log processing | 500 | 500 MB/s |
| **sc1** (Cold HDD) | Infrequent access | 250 | 250 MB/s |

**Tính năng:**
- **Snapshots**: Backup incremental, lưu trên S3
- **Encryption**: Encrypt at rest và in transit
- **Multi-Attach**: Attach io1/io2 volume đến nhiều instances (cùng AZ)
- **Elastic Volumes**: Thay đổi size, type, IOPS mà không downtime

---

### 7. Amazon VPC (Virtual Private Cloud)

Network isolation cho EC2 instances.

| Component | Mô tả |
|-----------|-------|
| **Subnets** | Public (có Internet Gateway) hoặc Private |
| **Route Tables** | Điều hướng traffic |
| **Internet Gateway** | Cho phép access Internet |
| **NAT Gateway** | Private instances access Internet (outbound only) |
| **VPC Endpoints** | Truy cập AWS services mà không qua Internet |

---

### 8. AWS Backup

Centralized backup cho EC2 instances và EBS volumes.

- **Backup Plans**: Định nghĩa schedule, retention, lifecycle
- **Cross-region/Cross-account**: Copy backups đến regions/accounts khác
- **Point-in-time recovery**: Restore đến thời điểm cụ thể

---

## EC2 Hibernate

### Hibernate là gì?

**Hibernate** = Lưu toàn bộ RAM vào EBS root volume, sau đó resume lại như chưa từng tắt.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SO SÁNH STOP vs HIBERNATE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STOP (Tắt thường):                                                         │
│  ─────────────────                                                          │
│  EC2 Running → Stop → RAM bị XÓA SẠCH                                       │
│                     → Start lại → Phải khởi động OS từ đầu                  │
│                     → Applications phải start lại                           │
│                     → Boot time: 1-2 phút                                   │
│                                                                             │
│  HIBERNATE (Ngủ đông):                                                      │
│  ────────────────────                                                       │
│  EC2 Running → Hibernate → RAM được LƯU vào EBS                             │
│                          → Resume → RAM được nạp lại từ EBS                 │
│                          → Tiếp tục từ đúng chỗ đang chạy                   │
│                          → Resume time: Vài giây!                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cách hoạt động

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIBERNATE WORKFLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. HIBERNATE                                                   │
│     EC2 (Running)                                               │
│     ├── RAM: 16GB data                                          │
│     ├── App đang chạy                                           │
│     └── [Hibernate] ──────┐                                     │
│                           ▼                                     │
│     ┌─────────────────────────────────────┐                     │
│     │  EBS Root Volume (Encrypted)        │                     │
│     │  ├── OS files                       │                     │
│     │  └── RAM dump (16GB) ← Lưu tại đây! │                     │
│     └─────────────────────────────────────┘                     │
│                                                                 │
│  2. RESUME (Start)                                              │
│     ┌─────────────────────────────────────┐                     │
│     │  EBS Root Volume (Encrypted)        │                     │
│     │  └── RAM dump (16GB) ───────────────┼──┐                  │
│     └─────────────────────────────────────┘  │                  │
│                                              ▼                  │
│     EC2 (Running)                                               │
│     ├── RAM: 16GB ← Nạp lại từ EBS                              │
│     ├── App TIẾP TỤC chạy từ đúng chỗ cũ                        │
│     └── Không cần boot OS lại!                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Yêu cầu (Requirements)

| Yêu cầu | Chi tiết |
|---------|----------|
| **Instance types** | Hỗ trợ: C, I, M, R, T families (không phải tất cả) |
| **RAM size** | Tối đa **150 GB** |
| **Root volume** | Phải là **EBS** (không phải Instance Store) |
| **EBS Encryption** | Root volume **phải được mã hóa** |
| **EBS size** | Root volume phải **đủ lớn** để chứa RAM dump |
| **Thời gian hibernate** | Tối đa **60 ngày** |
| **OS support** | Amazon Linux 2, Ubuntu, Windows |

### Use Cases

| Use Case | Giải thích |
|----------|------------|
| **Long-running processes** | Tạm dừng mà không mất state (ML training, simulations) |
| **Fast boot** | Resume nhanh hơn cold start (vài giây vs vài phút) |
| **Save costs** | Hibernate khi không dùng, không trả tiền compute |
| **Pre-warmed instances** | Cache, connection pools sẵn sàng khi resume |

### Lưu ý quan trọng

```
⚠️ CHÚ Ý:
├── Hibernate KHÔNG hỗ trợ cho Spot Instances (chỉ On-Demand)
├── Khi hibernate, KHÔNG tính tiền EC2 (vẫn tính tiền EBS và EIP)
├── EBS root volume PHẢI được encrypt (bắt buộc!)
└── Hibernate > 60 ngày → AWS sẽ tự động stop instance
```

> 💡 **Exam tip:** Hibernate = Lưu RAM vào EBS → Resume nhanh, giữ nguyên state!

---

## Best Practices

1. **Chọn đúng instance type** - Sử dụng [AWS Compute Optimizer](https://aws.amazon.com/compute-optimizer/) để nhận recommendations
2. **Sử dụng Auto Scaling** - Tự động điều chỉnh capacity theo demand
3. **Tận dụng Spot Instances** - Cho workloads có thể bị interrupt
4. **Right-sizing** - Thường xuyên review và điều chỉnh instance size
5. **Security Groups** - Chỉ mở những ports cần thiết (principle of least privilege)
6. **Multi-AZ deployment** - Triển khai instances trên nhiều Availability Zones để đảm bảo high availability

---

## Tham khảo thêm

- [EC2 User Guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/)
- [EC2 Instance Types Guide](https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-types.html)
- [EC2 Cost and Capacity Optimization](https://aws.amazon.com/ec2/cost-and-capacity/)
- [Getting Started with EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
