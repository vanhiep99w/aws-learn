# AWS Local Zones

## Tổng quan

**AWS Local Zones** là extension của AWS Region, đặt **gần các thành phố lớn** để cung cấp **low latency** cho end users tại những khu vực đó.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS Local Zones Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           AWS REGION (e.g., us-west-2)                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │   │    AZ-1      │  │    AZ-2      │  │    AZ-3      │              │   │
│   │   │ (Oregon DC)  │  │ (Oregon DC)  │  │ (Oregon DC)  │              │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              │ High-bandwidth connection                     │
│                              │                                               │
│   ┌──────────────────────────┼──────────────────────────────────────────┐   │
│   │                          ▼                                           │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │   │ Local Zone   │  │ Local Zone   │  │ Local Zone   │              │   │
│   │   │ Los Angeles  │  │ Boston       │  │ Miami        │              │   │
│   │   │ 🏙️           │  │ 🏙️           │  │ 🏙️           │              │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   │                                                                      │   │
│   │   AWS Data Centers đặt GẦN các thành phố lớn                        │   │
│   │   Latency: < 10ms cho users trong thành phố đó                      │   │
│   │                                                                      │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tại sao gọi là "Local" Zone? (không phải chỉ là "Zone")

> [!NOTE]
> **Câu hỏi hay**: Tại sao không gọi là Availability Zone mà lại gọi là Local Zone?

### Availability Zone vs Local Zone

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    AVAILABILITY ZONE vs LOCAL ZONE                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  AVAILABILITY ZONE (AZ) - Zone "chính thức" TRONG Region                           │
│  ─────────────────────────────────────────────────────────                          │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │  AWS REGION (us-west-2 - Oregon)                                             │   │
│  │                                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                        │   │
│  │  │  us-west-2a  │  │  us-west-2b  │  │  us-west-2c  │                        │   │
│  │  │  (AZ 1)      │  │  (AZ 2)      │  │  (AZ 3)      │                        │   │
│  │  │              │  │              │  │              │                        │   │
│  │  │ FULL AWS     │  │ FULL AWS     │  │ FULL AWS     │                        │   │
│  │  │ SERVICES     │  │ SERVICES     │  │ SERVICES     │                        │   │
│  │  │ (EC2, RDS,   │  │ (EC2, RDS,   │  │ (EC2, RDS,   │                        │   │
│  │  │  S3, Lambda  │  │  S3, Lambda  │  │  S3, Lambda  │                        │   │
│  │  │  ELB, etc.)  │  │  ELB, etc.)  │  │  ELB, etc.)  │                        │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                        │   │
│  │                                                                               │   │
│  │  📍 Vị trí: TẤT CẢ đều ở TRONG Oregon (cùng 1 metro area)                    │   │
│  │  🏛️ Size: DATA CENTER LỚN (full capacity)                                    │   │
│  │  ⚡ Enabled: MẶC ĐỊNH (default)                                              │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  LOCAL ZONE - Zone "mở rộng" RA XA Region, gần thành phố users                      │
│  ─────────────────────────────────────────────────────────────                      │
│                                                                                      │
│  ┌──────────────────┐                                                               │
│  │  AWS REGION      │     1,500km                                                   │
│  │  (Oregon)        │◄──────────────────┐                                           │
│  └──────────────────┘                   │                                           │
│                                         │                                           │
│                            ┌────────────┴────────────┐                              │
│                            │  us-west-2-lax-1a       │                              │
│                            │  (Los Angeles)          │                              │
│                            │                         │                              │
│                            │  LIMITED SERVICES       │                              │
│                            │  (EC2, EBS, VPC, ELB    │                              │
│                            │   RDS limited)          │                              │
│                            └─────────────────────────┘                              │
│                                                                                      │
│  📍 Vị trí: CÁC THÀNH PHỐ XA Region (LA, Boston, Miami...)                         │
│  🏛️ Size: MINI DATA CENTER (limited capacity)                                      │
│  ⚡ Enabled: PHẢI OPT-IN (không tự động)                                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Bảng so sánh AZ vs Local Zone

| | **Availability Zone (AZ)** | **Local Zone** |
|---|---|---|
| **Vị trí** | TRONG Region (cùng metro area) | XA Region (thành phố khác) |
| **Khoảng cách** | < 100km đến nhau | 100 - 2000+ km đến Region |
| **Enabled mặc định?** | ✅ Yes | ❌ No (phải opt-in) |
| **Services** | **FULL** (tất cả AWS services) | **LIMITED** (EC2, EBS, VPC...) |
| **Mục đích** | High Availability trong Region | Low latency cho users xa Region |
| **Naming** | `us-west-2a`, `us-west-2b` | `us-west-2-lax-1a` (có tên city) |

### Tại sao gọi là "Local"?

```
"Local" = GẦN với END USERS (ở local city của họ)

                    Oregon (Region)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   us-west-2a       us-west-2b       us-west-2c
   (AZ trong        (AZ trong        (AZ trong
    Oregon)          Oregon)          Oregon)
    
                         │
                         │ mở rộng ra xa
                         ▼
                         
   Los Angeles       Boston           Miami
   (Local Zone)      (Local Zone)     (Local Zone)
   
   "Local" với       "Local" với      "Local" với
   LA users          Boston users     Miami users
```

> **Tóm lại:**
> - **AZ** = Zone **trong** Region → cho **High Availability**
> - **Local Zone** = Zone **ngoài** Region, gần cities → cho **Low Latency** tới users

## Vị trí vật lý - Hiểu rõ Local Zones

> [!NOTE]
> **Local Zones** = AWS tự xây/thuê **data center nhỏ** đặt **gần thành phố lớn**, do **AWS quản lý hoàn toàn**.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     PHYSICAL LOCATION - LOCAL ZONE Ở ĐÂU?                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                                                                                      │
│   AWS REGION (Oregon)                              Los Angeles City                  │
│   ┌───────────────────┐                           ┌────────────────────────────┐    │
│   │ 🏛️ Main DC        │                           │                            │    │
│   │                   │                           │  👩‍💻 End Users              │    │
│   │ [Full Services]   │     ~1000+ km            │  (content creators,        │    │
│   │                   │◄─────────────────────────│   gamers, etc.)            │    │
│   │                   │     latency: 30-50ms     │                            │    │
│   └───────────────────┘                           │       │                    │    │
│                                                   │       │ < 10ms            │    │
│                                                   │       ▼                    │    │
│                                                   │  ┌─────────────────────┐  │    │
│                                                   │  │ 🔷 LOCAL ZONE       │  │    │
│                                                   │  │   LA (AWS DC)       │  │    │
│                                                   │  │                     │  │    │
│                                                   │  │ [EC2, EBS, VPC...] │  │    │
│                                                   │  └─────────────────────┘  │    │
│                                                   │                            │    │
│                                                   └────────────────────────────┘    │
│                                                                                      │
│   Local Zone = AWS's MINI DATA CENTER đặt trong/gần thành phố                       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## So sánh: Local Zones vs Outposts vs Wavelength

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    3 LOẠI VỊ TRÍ KHÁC NHAU - AI SỞ HỮU DC?                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  1️⃣  AWS OUTPOSTS                                                                   │
│      📍 Vị trí: DATA CENTER CỦA BẠN                                                 │
│      🏢 Ai sở hữu DC: BẠN                                                           │
│      🎯 Use case: Hybrid cloud, data residency                                      │
│      ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  2️⃣  AWS WAVELENGTH                                                                 │
│      📍 Vị trí: DATA CENTER CỦA NHÀ MẠNG (Verizon, KDDI...)                         │
│      🏢 Ai sở hữu DC: TELECOM PROVIDER                                              │
│      🎯 Use case: 5G mobile ultra-low latency                                       │
│      ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  3️⃣  AWS LOCAL ZONES                                                                │
│      📍 Vị trí: MINI DC CỦA AWS gần thành phố lớn                                   │
│      🏢 Ai sở hữu DC: AWS (xây hoặc thuê)                                           │
│      🎯 Use case: Low latency cho users tại thành phố cụ thể                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Bảng so sánh chi tiết

| | **Local Zones** | **Outposts** | **Wavelength** |
|---|---|---|---|
| **DC ở đâu?** | AWS's mini DC gần cities | Your company's DC | Telecom's DC |
| **Ai sở hữu DC?** | 🏛️ **AWS** | 🏭 **Bạn** | 🏢 **Nhà mạng** |
| **Ai quản lý?** | AWS 100% | AWS (hardware) | AWS |
| **Target users** | City users (fixed location) | On-prem users | 5G mobile users |
| **Latency** | < 10ms cho city | Depends on your network | < 10ms cho 5G |
| **Services** | EC2, EBS, VPC, RDS... | Full AWS | EC2, EBS, ECS, EKS |

## Tại sao cần Local Zones?

### Vấn đề: Users xa AWS Region

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          VẤN ĐỀ VÀ GIẢI PHÁP                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  VẤN ĐỀ: User ở Los Angeles, AWS Region ở Oregon                                    │
│                                                                                      │
│  👩‍💻 LA User ───────── 1,500 km ─────────► 🏛️ Oregon Region                         │
│                                                                                      │
│  Latency: 30-50ms (quá chậm cho real-time apps!)                                    │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  GIẢI PHÁP: Dùng Local Zone tại Los Angeles                                         │
│                                                                                      │
│  👩‍💻 LA User ───── 10 km ─────► 🔷 LA Local Zone ◄────── 🏛️ Oregon Region           │
│                                                          (backend services)         │
│  Latency: < 10ms ✅                                                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Use Cases

| Use Case | Mô tả |
|----------|-------|
| **Media & Entertainment** | Video editing, rendering, post-production tại Hollywood |
| **Real-time Gaming** | Game servers gần players |
| **Live Streaming** | Low-latency broadcasts |
| **Machine Learning Inference** | Real-time AI predictions |
| **Virtual Workstations** | Remote desktops, CAD applications |
| **Ad Tech** | Real-time bidding platforms |

### Ví dụ thực tế: Video Production

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               Video Production Studio tại Los Angeles                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🎬 Film Studio (LA)                     🔷 Local Zone LA                   │
│   ┌─────────────────────┐                ┌─────────────────────────┐        │
│   │                     │                │                         │        │
│   │  Video Editor       │◄── < 10ms ────►│  EC2 (GPU instances)   │        │
│   │  workstation        │                │  for rendering          │        │
│   │                     │                │                         │        │
│   │  Cần real-time      │                │  EBS (high performance) │        │
│   │  preview!           │                │  for video files        │        │
│   │                     │                │                         │        │
│   └─────────────────────┘                └───────────┬─────────────┘        │
│                                                      │                       │
│                                                      │ After rendering       │
│                                                      ▼                       │
│                                          ┌─────────────────────────┐        │
│                                          │  🏛️ Oregon Region       │        │
│                                          │  S3 (final storage)     │        │
│                                          │  CloudFront (delivery)  │        │
│                                          └─────────────────────────┘        │
│                                                                              │
│   ✅ Real-time editing với low latency                                      │
│   ✅ Massive storage và delivery từ Region                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## AWS Services trong Local Zones

### Services được hỗ trợ

| Category | Services |
|----------|----------|
| **Compute** | EC2, ECS, EKS |
| **Storage** | EBS |
| **Database** | RDS (một số engines) |
| **Networking** | VPC, Application Load Balancer, Direct Connect |

### Services KHÔNG có trong Local Zones

| Service | Giải pháp |
|---------|-----------|
| **S3** | Dùng S3 từ Parent Region |
| **Lambda** | Dùng Lambda từ Parent Region |
| **DynamoDB** | Dùng từ Parent Region |
| **Most managed services** | Kết nối về Parent Region |

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Local Zones Networking                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                           YOUR VPC                                   │   │
│   │                                                                      │   │
│   │   ┌───────────────────────────┐  ┌────────────────────────────────┐ │   │
│   │   │   Local Zone Subnet       │  │   Regular Subnet (Region)      │ │   │
│   │   │   (in LA Local Zone)      │  │   (in Oregon AZ)               │ │   │
│   │   │   ┌─────────┐             │  │   ┌─────────┐  ┌─────────┐    │ │   │
│   │   │   │   EC2   │             │  │   │   EC2   │  │   RDS   │    │ │   │
│   │   │   │   EBS   │             │  │   │   S3    │  │  Lambda │    │ │   │
│   │   │   └────┬────┘             │  │   └────┬────┘  └─────────┘    │ │   │
│   │   │        │                  │  │        │                       │ │   │
│   │   └────────┼──────────────────┘  └────────┼───────────────────────┘ │   │
│   │            │                              │                         │   │
│   │            ▼                              ▼                         │   │
│   │   ┌────────────────┐            ┌─────────────────┐                │   │
│   │   │Internet Gateway│            │ Internet Gateway │                │   │
│   │   └────────────────┘            └─────────────────┘                │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   KEY POINT:                                                                │
│   • Local Zone subnet là PHẦN MỞ RỘNG của VPC                               │
│   • Cùng VPC, khác subnet                                                   │
│   • Dùng Internet Gateway bình thường (KHÔNG cần Carrier Gateway)          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Danh sách Local Zones

### Một số Local Zones phổ biến

| Region | Local Zones |
|--------|-------------|
| **us-west-2 (Oregon)** | Los Angeles, Las Vegas, Phoenix, Denver... |
| **us-east-1 (Virginia)** | Boston, Miami, Atlanta, Chicago, Dallas... |
| **eu-west-2 (London)** | Hamburg, Copenhagen, Helsinki... |
| **ap-southeast-1 (Singapore)** | Bangkok, Delhi... |

> [!TIP]
> Chạy `aws ec2 describe-availability-zones --filters "Name=zone-type,Values=local-zone"` để xem tất cả Local Zones.

## Hands-on: Deploy App to Local Zone

### Step 1: Opt-in to Local Zone

```bash
# List available Local Zones
aws ec2 describe-availability-zones \
    --filters "Name=zone-type,Values=local-zone" \
    --query "AvailabilityZones[].ZoneName"

# Opt-in (Local Zones are not enabled by default)
aws ec2 modify-availability-zone-group \
    --group-name us-west-2-lax-1 \
    --opt-in-status opted-in
```

### Step 2: Create Subnet in Local Zone

```bash
# Create subnet in Local Zone
aws ec2 create-subnet \
    --vpc-id vpc-xxx \
    --cidr-block 10.0.100.0/24 \
    --availability-zone us-west-2-lax-1a
```

### Step 3: Launch EC2 in Local Zone

```bash
# Launch instance in Local Zone subnet
aws ec2 run-instances \
    --image-id ami-xxx \
    --instance-type t3.medium \
    --subnet-id subnet-local-zone-xxx
```

### So sánh: Tạo resource ở đâu?

```bash
# EC2 trong REGION (AZ thường)
aws ec2 run-instances \
    --subnet-id subnet-in-az-1a        # us-west-2a

# EC2 trong LOCAL ZONE
aws ec2 run-instances \
    --subnet-id subnet-in-local-zone   # us-west-2-lax-1a (Los Angeles)

# Chỉ khác subnet! APIs giống hệt!
```

## Pricing

### Chi phí

| Component | Pricing |
|-----------|---------|
| **EC2 Instances** | ~10-20% cao hơn Region (premium for proximity) |
| **EBS Volumes** | Standard EBS pricing |
| **Data Transfer** | Local Zone → Region: **FREE** (intra-VPC) |
| | Local Zone → Internet: Standard rates |

> [!IMPORTANT]
> **Local Zones có giá cao hơn Region** vì bạn đang trả thêm cho physical proximity với end users.

## Decision Tree: Chọn giải pháp nào?

```
                     Cần low latency cho end users?
                                │
                                ▼
                               YES
                                │
                ┌───────────────┼───────────────┐
                │               │               │
          Users dùng        Users ở         Users trong
          5G mobile?      thành phố lớn?   văn phòng bạn?
                │               │               │
                ▼               ▼               ▼
          AWS WAVELENGTH   AWS LOCAL ZONES   AWS OUTPOSTS
          (Telecom DC)     (AWS mini DC      (Your DC)
                           near city)
```

## Exam Tips (SAA-C03)

> [!IMPORTANT]
> **Điểm cần nhớ cho kỳ thi:**

1. **Local Zones = AWS mini DC gần thành phố lớn**
2. **Extension của Region** - cùng VPC, khác subnet
3. **Phải opt-in** - không enabled by default
4. **Dùng Internet Gateway** (không phải Carrier Gateway như Wavelength)
5. **Giá cao hơn Region** (~10-20% premium)
6. **Limited services**: EC2, EBS, VPC, ELB, RDS (một số)

### Câu hỏi thường gặp trong exam

| Scenario | Answer |
|----------|--------|
| Low latency cho users tại thành phố cụ thể | **AWS Local Zones** |
| Real-time gaming cho desktop/console players | **AWS Local Zones** |
| Video production studio cần low latency | **AWS Local Zones** |
| Virtual desktops cho remote workers | **AWS Local Zones** |
| Ultra-low latency cho 5G mobile | **AWS Wavelength** |
| Hybrid cloud với data residency | **AWS Outposts** |

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AWS Local Zones - Summary                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ✅ WHAT: AWS mini data centers đặt gần các thành phố lớn                   │
│                                                                              │
│  ✅ WHY: Low latency (< 10ms) cho end users tại thành phố cụ thể            │
│                                                                              │
│  ✅ HOW:                                                                     │
│     • AWS xây/thuê DC gần cities (LA, Boston, Miami...)                     │
│     • Extension của VPC - tạo subnet trong Local Zone                       │
│     • Dùng APIs giống hệt Region                                            │
│                                                                              │
│  ✅ USE CASES:                                                               │
│     • Media & Entertainment         • Real-time gaming                      │
│     • Virtual workstations          • Live streaming                        │
│     • ML inference                  • Ad tech                               │
│                                                                              │
│  ✅ vs OUTPOSTS: Outposts ở DC của BẠN, Local Zones ở DC của AWS            │
│  ✅ vs WAVELENGTH: Wavelength cho 5G mobile, Local Zones cho city users     │
│                                                                              │
│  ✅ SERVICES: EC2, EBS, VPC, ELB, RDS (limited)                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tổng kết bộ 3 Edge Computing Solutions

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    AWS EDGE COMPUTING - CHỌN CÁI NÀO?                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                            BẠN CẦN GÌ?                                      │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                     │                                                │
│        ┌────────────────────────────┼────────────────────────────┐                  │
│        │                            │                            │                  │
│        ▼                            ▼                            ▼                  │
│  ┌───────────────┐          ┌───────────────┐          ┌───────────────┐           │
│  │ 🏭 OUTPOSTS   │          │ 📱 WAVELENGTH │          │ 🏙️ LOCAL ZONES│           │
│  │               │          │               │          │               │           │
│  │ Your DC      │          │ Telecom DC    │          │ AWS DC        │           │
│  │ (bạn sở hữu)  │          │ (nhà mạng     │          │ (AWS sở hữu   │           │
│  │               │          │  sở hữu)      │          │  gần cities)  │           │
│  ├───────────────┤          ├───────────────┤          ├───────────────┤           │
│  │ ✅ Hybrid     │          │ ✅ 5G Mobile  │          │ ✅ City users │           │
│  │ ✅ Data       │          │ ✅ AR/VR      │          │ ✅ Media      │           │
│  │    residency  │          │ ✅ Gaming     │          │ ✅ Gaming     │           │
│  │ ✅ On-prem    │          │ ✅ Connected  │          │ ✅ Virtual    │           │
│  │    low latency│          │    vehicles   │          │    desktops   │           │
│  └───────────────┘          └───────────────┘          └───────────────┘           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Tài liệu tham khảo

- [AWS Local Zones Official Documentation](https://docs.aws.amazon.com/local-zones/)
- [AWS Local Zones Locations](https://aws.amazon.com/about-aws/global-infrastructure/localzones/locations/)
- [AWS Local Zones FAQs](https://aws.amazon.com/local-zones/faqs/)
