# AWS Wavelength

## Tổng quan

**AWS Wavelength** là dịch vụ cho phép bạn chạy AWS compute và storage **ngay tại edge của mạng 5G** của các nhà mạng viễn thông. Mục tiêu: **ultra-low latency** cho mobile và connected devices.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS Wavelength Architecture                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Mobile Device (5G)                                                         │
│        │                                                                     │
│        │  📶 5G Network                                                      │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────┐                               │
│   │     Telecom Provider (Verizon, etc.)    │                               │
│   │   ┌─────────────────────────────────┐   │                               │
│   │   │     WAVELENGTH ZONE             │   │      ┌───────────────────┐    │
│   │   │   ┌───────┐  ┌───────┐         │   │      │   AWS Region      │    │
│   │   │   │  EC2  │  │  EBS  │         │◄──┼─────►│   (Parent)        │    │
│   │   │   └───────┘  └───────┘         │   │      │                   │    │
│   │   │   ┌───────┐  ┌───────┐         │   │      │   Full AWS        │    │
│   │   │   │  ECS  │  │  EKS  │         │   │      │   Services        │    │
│   │   │   └───────┘  └───────┘         │   │      └───────────────────┘    │
│   │   └─────────────────────────────────┘   │                               │
│   └─────────────────────────────────────────┘                               │
│                                                                              │
│   Latency: < 10ms (single-digit milliseconds)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tại sao cần AWS Wavelength?

### Vấn đề với Traditional Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Traditional vs Wavelength Architecture                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   TRADITIONAL (High Latency):                                               │
│   ┌────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐           │
│   │ Mobile │───►│ 5G Tower │───►│ Internet │───►│  AWS Region   │           │
│   │ Device │    │          │    │          │    │  (far away)   │           │
│   └────────┘    └──────────┘    └──────────┘    └───────────────┘           │
│                                                                              │
│   Latency: 50-100ms+ (qua nhiều hops, qua Internet)                         │
│                                                                              │
│   ─────────────────────────────────────────────────────────────────────     │
│                                                                              │
│   WITH WAVELENGTH (Ultra-Low Latency):                                      │
│   ┌────────┐    ┌──────────────────────────────┐                            │
│   │ Mobile │───►│ 5G Tower + Wavelength Zone   │                            │
│   │ Device │    │  ┌─────────────────────────┐ │                            │
│   └────────┘    │  │ EC2, EBS (AWS infra)    │ │                            │
│                 │  └─────────────────────────┘ │                            │
│                 └──────────────────────────────┘                            │
│                                                                              │
│   Latency: < 10ms (traffic KHÔNG rời mạng 5G!)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Insight

> [!IMPORTANT]
> **Wavelength đặt AWS compute NGAY TRONG mạng 5G** của nhà mạng → Traffic không cần đi ra Internet → **Ultra-low latency!**

## "Edge của mạng 5G" nghĩa là gì?

> [!NOTE]
> Đây là câu hỏi quan trọng: **"Edge" ở đây nghĩa là gì? Khác gì với đặt tại data center của mình?**

### Vị trí vật lý thực tế

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     PHYSICAL LOCATION - SERVER Ở ĐÂU?                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   📱 Your Phone                                                                      │
│       │                                                                              │
│       │ sóng 5G                                                                      │
│       ▼                                                                              │
│   📡 Cell Tower (Trạm BTS)                                                          │
│       │                                                                              │
│       │ (kết nối nội bộ nhà mạng)                                                   │
│       ▼                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │ 🏢 TELECOM DATA CENTER (của Verizon, Viettel, VNPT...)                      │   │
│   │                                                                              │   │
│   │   ┌──────────────────────────┐                                              │   │
│   │   │  🔷 WAVELENGTH ZONE      │  ← AWS đặt servers TẠI ĐÂY!                  │   │
│   │   │     (EC2, EBS...)        │     (trong DC của nhà mạng, không phải DC    │   │
│   │   └──────────────────────────┘      của bạn hay của AWS!)                   │   │
│   │                                                                              │   │
│   │   [Core Network Equipment]   [Billing Systems]   [Other Telecom Stuff]      │   │
│   │                                                                              │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   "Edge" = RÌA của mạng = điểm GẦN NHẤT với người dùng trong hệ thống nhà mạng     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### So sánh 3 loại vị trí khác nhau

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        3 LOẠI VỊ TRÍ KHÁC NHAU                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  1️⃣  AWS OUTPOSTS                                                                   │
│      ┌───────────────────────────────────────────────────────────────┐              │
│      │  🏭 YOUR COMPANY'S DATA CENTER                                │              │
│      │                                                                │              │
│      │     ┌─────────────────┐                                       │              │
│      │     │ 🔶 OUTPOSTS     │  ← AWS gửi hardware đến DC CỦA BẠN   │              │
│      │     │   (EC2, EBS...) │                                       │              │
│      │     └─────────────────┘                                       │              │
│      │                                                                │              │
│      │     [Your servers]  [Your storage]  [Your network]            │              │
│      └───────────────────────────────────────────────────────────────┘              │
│      📍 Địa chỉ: VĂN PHÒNG / NHÀ MÁY của công ty bạn                               │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  2️⃣  AWS WAVELENGTH                                                                 │
│      ┌───────────────────────────────────────────────────────────────┐              │
│      │  🏢 TELECOM'S DATA CENTER (Verizon, KDDI...)                  │              │
│      │                                                                │              │
│      │     ┌─────────────────┐                                       │              │
│      │     │ 🔷 WAVELENGTH   │  ← AWS đặt hardware trong DC NHÀ MẠNG│              │
│      │     │   (EC2, EBS...) │                                       │              │
│      │     └─────────────────┘                                       │              │
│      │                                                                │              │
│      │     [5G Core]  [Network Equipment]  [Telecom infrastructure] │              │
│      └───────────────────────────────────────────────────────────────┘              │
│      📍 Địa chỉ: Data center của NHÀ MẠNG VIỄN THÔNG                               │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  3️⃣  AWS REGION (thông thường)                                                      │
│      ┌───────────────────────────────────────────────────────────────┐              │
│      │  🏛️ AWS's OWN DATA CENTER                                     │              │
│      │                                                                │              │
│      │     [EC2] [S3] [RDS] [Lambda] [Full services]                │              │
│      │                                                                │              │
│      └───────────────────────────────────────────────────────────────┘              │
│      📍 Địa chỉ: DC của AWS (Singapore, Tokyo, Virginia...)                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Tại sao Wavelength nhanh hơn cho 5G?

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          ĐƯỜNG ĐI CỦA DATA                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  KHÔNG DÙNG WAVELENGTH (chậm - qua Internet):                                       │
│                                                                                      │
│  📱 Phone → 📡 Tower → 🏢 Telecom DC → 🌐 INTERNET → 🏛️ AWS Region                 │
│                                            ↑                                         │
│                                      (phải đi qua đây = CHẬM!)                      │
│                                                                                      │
│  Latency: 50-100ms+                                                                 │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  DÙNG WAVELENGTH (nhanh - không ra Internet):                                       │
│                                                                                      │
│  📱 Phone → 📡 Tower → 🏢 Telecom DC ──┐                                            │
│                              │          │                                            │
│                              ▼          │                                            │
│                        ┌─────────┐      │                                            │
│                        │WAVELENGTH│◄────┘  (xử lý NGAY TẠI ĐÂY, không đi đâu cả!)  │
│                        │  ZONE   │                                                   │
│                        └─────────┘                                                   │
│                                                                                      │
│  Latency: < 10ms                                                                    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Tóm lại sự khác biệt chính

| | **Outposts** | **Wavelength** |
|---|---|---|
| **Hardware đặt ở đâu?** | 🏭 DC của **CÔNG TY BẠN** | 🏢 DC của **NHÀ MẠNG** |
| **Ai sở hữu building?** | **Bạn** sở hữu/thuê | **Verizon/KDDI/Viettel** sở hữu |
| **Tối ưu cho ai?** | Users/devices **trong văn phòng bạn** | Users dùng **5G mobile** |
| **Traffic đi như thế nào?** | Qua **network nội bộ** công ty | Qua **mạng 5G** của nhà mạng |

> **Nói đơn giản:**
> - **Outposts** = AWS mang server đến **văn phòng của bạn**
> - **Wavelength** = AWS mang server đến **nhà của Verizon/nhà mạng**

## Use Cases

| Use Case | Mô tả | Yêu cầu Latency |
|----------|-------|-----------------|
| **Real-time Gaming** | Mobile games multiplayer, cloud gaming | < 20ms |
| **AR/VR Applications** | Augmented/Virtual Reality experiences | < 20ms |
| **Live Video Streaming** | Interactive live streams, broadcasts | < 50ms |
| **Autonomous Vehicles** | Connected cars, real-time decisions | < 10ms |
| **Smart Factories** | Industrial IoT, robotics | < 10ms |
| **Healthcare** | Remote surgery, real-time diagnostics | < 10ms |
| **ML Inference** | Real-time AI at edge | < 20ms |

### Ví dụ thực tế: Mobile Gaming

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Mobile Gaming với Wavelength                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Player A (NYC)                    Player B (LA)                           │
│      📱                                📱                                    │
│       │                                 │                                    │
│       ▼                                 ▼                                    │
│   ┌─────────────┐                  ┌─────────────┐                          │
│   │ Wavelength  │                  │ Wavelength  │                          │
│   │ Zone NYC    │◄────────────────►│ Zone LA     │                          │
│   │             │   Game State     │             │                          │
│   │ Game Server │   Sync           │ Game Server │         AWS Region       │
│   │             │                  │             │        ┌──────────┐      │
│   └──────┬──────┘                  └──────┬──────┘        │ Backend  │      │
│          │                                │               │ Database │      │
│          └────────────────────────────────┼──────────────►│ Analytics│      │
│                                           │               └──────────┘      │
│                                           │                                  │
│   Local processing = < 10ms latency per player                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Wavelength Zone là gì?

**Wavelength Zone** = AWS infrastructure được đặt trong data center của nhà mạng viễn thông.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Wavelength Zone Details                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Telecom Data Center (e.g., Verizon)                                       │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                                                                       │ │
│   │   ┌─────────────────────────────────────┐                            │ │
│   │   │        WAVELENGTH ZONE              │                            │ │
│   │   │   ┌───────────┐  ┌───────────┐      │                            │ │
│   │   │   │   EC2     │  │   EBS     │      │    ┌───────────────────┐   │ │
│   │   │   │ Instances │  │  Volumes  │      │    │                   │   │ │
│   │   │   └───────────┘  └───────────┘      │    │   5G Network      │   │ │
│   │   │   ┌───────────┐  ┌───────────┐      │◄──►│   Infrastructure  │   │ │
│   │   │   │   ECS     │  │   EKS     │      │    │                   │   │ │
│   │   │   │           │  │           │      │    └───────────────────┘   │ │
│   │   │   └───────────┘  └───────────┘      │                            │ │
│   │   │                                     │                            │ │
│   │   │   Carrier Gateway ─────────────────►│───► AWS Region             │ │
│   │   │                                     │                            │ │
│   │   └─────────────────────────────────────┘                            │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Carrier Partners

| Carrier | Regions | Coverage |
|---------|---------|----------|
| **Verizon** | US | Multiple cities |
| **Vodafone** | Europe | UK, Germany |
| **KDDI** | Japan | Tokyo, Osaka |
| **SK Telecom** | South Korea | Seoul |
| **Bell Canada** | Canada | Toronto, etc. |

## AWS Services trong Wavelength Zone

### Services được hỗ trợ

| Service | Mô tả |
|---------|-------|
| **EC2** | Compute instances (limited instance types) |
| **EBS** | Block storage |
| **ECS** | Container orchestration |
| **EKS** | Kubernetes |
| **VPC** | Subnets trong Wavelength Zone |

### Services KHÔNG có trong Wavelength Zone

| Service | Giải pháp |
|---------|-----------|
| **S3** | Dùng S3 từ Parent Region |
| **RDS** | Dùng RDS từ Parent Region hoặc self-managed DB |
| **Lambda** | Dùng Lambda từ Parent Region |
| **CloudFront** | Không cần - Wavelength đã là edge! |

## Network Architecture

### Carrier Gateway

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Wavelength Networking Components                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                           YOUR VPC                                   │   │
│   │   ┌───────────────────────────┐  ┌────────────────────────────────┐ │   │
│   │   │   Wavelength Subnet       │  │   Regular Subnet (Region)      │ │   │
│   │   │   (in Wavelength Zone)    │  │   (in Availability Zone)       │ │   │
│   │   │   ┌─────────┐             │  │   ┌─────────┐                  │ │   │
│   │   │   │   EC2   │             │  │   │   EC2   │                  │ │   │
│   │   │   └────┬────┘             │  │   └────┬────┘                  │ │   │
│   │   │        │                  │  │        │                       │ │   │
│   │   └────────┼──────────────────┘  └────────┼───────────────────────┘ │   │
│   │            │                              │                         │   │
│   │            ▼                              ▼                         │   │
│   │   ┌────────────────┐            ┌─────────────────┐                │   │
│   │   │ Carrier Gateway│            │ Internet Gateway │                │   │
│   │   │ (for 5G traffic)            │ (for Internet)   │                │   │
│   │   └────────┬───────┘            └────────┬────────┘                │   │
│   └────────────┼─────────────────────────────┼──────────────────────────┘   │
│                │                             │                              │
│                ▼                             ▼                              │
│       5G Mobile Devices                  Internet                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Networking Concepts

| Component | Chức năng |
|-----------|-----------|
| **Wavelength Subnet** | Subnet đặt trong Wavelength Zone |
| **Carrier Gateway** | Gateway để mobile devices truy cập (tương tự Internet Gateway) |
| **Carrier IP** | Public IP được cấp bởi carrier (không phải AWS) |

## So sánh: Wavelength vs Outposts vs Local Zones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Edge Computing Solutions Comparison                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  AWS Wavelength │  │  AWS Outposts   │  │  AWS Local Zones            │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤  │
│  │ 📍 Telecom 5G   │  │ 📍 Your Data    │  │ 📍 AWS facility near cities │  │
│  │    Edge         │  │    Center       │  │                             │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤  │
│  │ 🎯 Mobile 5G    │  │ 🎯 Hybrid cloud │  │ 🎯 City users low latency   │  │
│  │    apps         │  │    Data residency│ │                             │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤  │
│  │ ⚡ < 10ms       │  │ ⚡ Depends on   │  │ ⚡ < 10ms                    │  │
│  │    (5G traffic) │  │    your setup   │  │    (specific cities)        │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤  │
│  │ 💻 EC2, EBS,    │  │ 💻 Full AWS     │  │ 💻 EC2, EBS, ELB, RDS...    │  │
│  │    ECS, EKS     │  │    services     │  │                             │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤  │
│  │ 🏢 AWS manages  │  │ 🏢 AWS manages  │  │ 🏢 AWS manages              │  │
│  │    at Telecom DC│  │    at YOUR DC   │  │    at AWS DC                │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Decision Tree

```
                        Cần low latency?
                              │
                              ▼
              ┌───────────────┴───────────────┐
              │                               │
         Cho mobile                      Cho fixed
         5G devices?                     location users?
              │                               │
              ▼                               ▼
        AWS WAVELENGTH              ┌─────────┴─────────┐
                                    │                   │
                              In your DC?          Near cities?
                                    │                   │
                                    ▼                   ▼
                              AWS OUTPOSTS        AWS LOCAL ZONES
```

## Hands-on: Deploy App to Wavelength

### Step 1: Enable Wavelength Zone

```bash
# Get available Wavelength Zones
aws ec2 describe-availability-zones \
    --filters "Name=zone-type,Values=wavelength-zone"

# Opt-in to Wavelength Zone
aws ec2 modify-availability-zone-group \
    --group-name us-east-1-wl1-nyc-wlz-1 \
    --opt-in-status opted-in
```

### Step 2: Create VPC and Wavelength Subnet

```bash
# Create VPC (or use existing)
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create Wavelength Subnet
aws ec2 create-subnet \
    --vpc-id vpc-xxx \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1-wl1-nyc-wlz-1
```

### Step 3: Create Carrier Gateway

```bash
# Create Carrier Gateway
aws ec2 create-carrier-gateway --vpc-id vpc-xxx

# Update route table for Wavelength subnet
aws ec2 create-route \
    --route-table-id rtb-xxx \
    --destination-cidr-block 0.0.0.0/0 \
    --carrier-gateway-id cagw-xxx
```

### Step 4: Launch EC2 in Wavelength Zone

```bash
# Launch instance
aws ec2 run-instances \
    --image-id ami-xxx \
    --instance-type t3.medium \
    --subnet-id subnet-wavelength-xxx \
    --associate-carrier-ip-address
```

## Pricing

### Chi phí bao gồm

| Component | Pricing |
|-----------|---------|
| **EC2 Instances** | Theo on-demand hoặc reserved pricing |
| **EBS Volumes** | Standard EBS pricing |
| **Data Transfer** | Carrier network → Wavelength Zone: **FREE** |
| | Wavelength Zone → AWS Region: Charges apply |
| | Wavelength Zone → Internet: Charges apply |

> [!TIP]
> **Data từ 5G devices đến Wavelength Zone là FREE!** Đây là lợi thế lớn vì traffic không đi qua Internet.

## Exam Tips (SAA-C03)

> [!IMPORTANT]
> **Điểm cần nhớ cho kỳ thi:**

1. **Wavelength = 5G edge computing** cho mobile apps
2. **Ultra-low latency** vì traffic không rời mạng 5G
3. **Use cases**: Gaming, AR/VR, Connected vehicles, Live streaming
4. **Carrier Gateway** (không phải Internet Gateway) cho 5G traffic
5. **Limited services**: Chỉ EC2, EBS, ECS, EKS (không có S3, RDS, Lambda)

### Câu hỏi thường gặp trong exam

| Scenario | Answer |
|----------|--------|
| Mobile app cần ultra-low latency cho 5G users | **AWS Wavelength** |
| Real-time gaming cho mobile devices | **AWS Wavelength** |
| AR/VR app cần responsive experience | **AWS Wavelength** |
| Connected vehicles, autonomous driving | **AWS Wavelength** |
| Low latency cho on-premises users | **AWS Outposts** |
| Low latency cho city users (fixed location) | **AWS Local Zones** |

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS Wavelength - Summary                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ✅ WHAT: AWS infrastructure trong mạng 5G của nhà mạng                     │
│                                                                              │
│  ✅ WHY: Ultra-low latency (< 10ms) cho mobile/5G applications              │
│                                                                              │
│  ✅ HOW:                                                                     │
│     • Traffic từ 5G devices → Wavelength Zone (không qua Internet)          │
│     • AWS đặt servers trong Telecom data center                             │
│     • Dùng Carrier Gateway thay vì Internet Gateway                         │
│                                                                              │
│  ✅ USE CASES:                                                               │
│     • Mobile gaming                • Connected vehicles                      │
│     • AR/VR applications           • Smart factories                        │
│     • Live streaming               • Healthcare/Telemedicine                │
│                                                                              │
│  ✅ SERVICES: EC2, EBS, ECS, EKS (limited set)                              │
│                                                                              │
│  ✅ PARTNERS: Verizon, Vodafone, KDDI, SK Telecom, Bell Canada              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tài liệu tham khảo

- [AWS Wavelength Official Documentation](https://docs.aws.amazon.com/wavelength/)
- [AWS Wavelength FAQs](https://aws.amazon.com/wavelength/faqs/)
- [AWS Wavelength Partners](https://aws.amazon.com/wavelength/partners/)
