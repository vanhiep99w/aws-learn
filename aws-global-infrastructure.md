# AWS Global Infrastructure

## Table of Contents
- [Overview](#overview)
- [Regions](#regions)
- [Availability Zones (AZs)](#availability-zones-azs)
- [Edge Locations](#edge-locations)
- [Regional Edge Caches](#regional-edge-caches)
- [Local Zones](#local-zones)
- [Wavelength Zones](#wavelength-zones)
- [AWS Outposts](#aws-outposts)
- [Points of Presence (PoPs)](#points-of-presence-pops)
- [Choosing a Region](#choosing-a-region)
- [Summary Comparison](#summary-comparison)
- [Exam Tips](#exam-tips)

---

## Overview

AWS Global Infrastructure là nền tảng vật lý mà AWS sử dụng để cung cấp các dịch vụ đám mây trên toàn thế giới. Nó được thiết kế để đảm bảo:

- **High Availability**: Dịch vụ luôn sẵn sàng
- **Fault Tolerance**: Khả năng chịu lỗi
- **Low Latency**: Độ trễ thấp cho người dùng cuối
- **Scalability**: Khả năng mở rộng theo nhu cầu

---

## Regions

### Region là gì?

**Region** là một vị trí địa lý vật lý chứa nhiều **Availability Zones**. Mỗi Region hoàn toàn độc lập với các Region khác.

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Region                             │
│                   (e.g., ap-southeast-1)                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     AZ-a     │  │     AZ-b     │  │     AZ-c     │       │
│  │              │  │              │  │              │       │
│  │  Data Center │  │  Data Center │  │  Data Center │       │
│  │  Cluster     │  │  Cluster     │  │  Cluster     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                    High-speed                               │
│                Private Network                              │
└─────────────────────────────────────────────────────────────┘
```

### Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Số lượng** | 30+ Regions trên toàn thế giới (2024) |
| **Độc lập** | Mỗi Region hoạt động độc lập, dữ liệu không tự động replicate giữa các Regions |
| **AZ tối thiểu** | Mỗi Region có ít nhất 3 AZs (trừ một số trường hợp đặc biệt) |
| **Naming** | Ví dụ: `us-east-1`, `ap-southeast-1`, `eu-west-1` |

### Các Region phổ biến

| Region Code | Tên | Ghi chú |
|-------------|-----|---------|
| `us-east-1` | N. Virginia | Region lâu đời nhất, nhiều service mới nhất |
| `us-west-2` | Oregon | Phổ biến cho development |
| `eu-west-1` | Ireland | Phổ biến nhất ở EU |
| `ap-southeast-1` | Singapore | Gần Việt Nam nhất |
| `ap-northeast-1` | Tokyo | Lớn nhất ở châu Á |

---

## Availability Zones (AZs)

### AZ là gì?

**Availability Zone** là một hoặc nhiều data center riêng biệt trong một Region, với nguồn điện, mạng và kết nối độc lập.

```
┌───────────────────────────────────────────────────────┐
│                 Availability Zone                     │
│                                                       │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │ Data Center │  │ Data Center │  │ Data Center │   │
│   │      1      │  │      2      │  │      3      │   │
│   └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                       │
│   • Independent power                                 │
│   • Independent cooling                               │
│   • Independent networking                            │
│   • Physically separated (miles apart)                │
└───────────────────────────────────────────────────────┘
```

### Đặc điểm chính

- **Vị trí vật lý riêng biệt**: Các AZ cách nhau đủ xa để tránh thảm họa chung (bão, động đất, lũ lụt)
- **Kết nối tốc độ cao**: Các AZ trong cùng Region kết nối qua mạng riêng với độ trễ thấp (~1-2ms)
- **Naming**: Ví dụ: `us-east-1a`, `us-east-1b`, `us-east-1c`
- **AZ ID vs AZ Name**: AWS randomize AZ names cho mỗi account (us-east-1a của bạn có thể khác us-east-1a của người khác), nhưng AZ ID là cố định

### Best Practice: Multi-AZ Deployment

```
                    ┌─────────────────┐
                    │  Elastic Load   │
                    │   Balancer      │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │   AZ-a     │    │   AZ-b     │    │   AZ-c     │
    │ ┌────────┐ │    │ ┌────────┐ │    │ ┌────────┐ │
    │ │  EC2   │ │    │ │  EC2   │ │    │ │  EC2   │ │
    │ └────────┘ │    │ └────────┘ │    │ └────────┘ │
    │ ┌────────┐ │    │ ┌────────┐ │    │ ┌────────┐ │
    │ │  RDS   │◄┼────┼►│  RDS   │◄┼────┼►│  RDS   │ │
    │ │Primary │ │    │ │Standby │ │    │ │Read    │ │
    │ └────────┘ │    │ └────────┘ │    │ │Replica │ │
    └────────────┘    └────────────┘    └────────────┘
```

---

## Edge Locations

### Edge Location là gì?

**Edge Locations** là các data center nhỏ hơn, được sử dụng chủ yếu cho **caching content** và **DNS resolution**. Chúng nằm gần người dùng cuối để giảm độ trễ.

### Services sử dụng Edge Locations

| Service | Mục đích |
|---------|----------|
| **Amazon CloudFront** | Content Delivery Network (CDN) |
| **Amazon Route 53** | DNS resolution |
| **AWS Global Accelerator** | Network acceleration |
| **AWS WAF** | Web Application Firewall |
| **AWS Shield** | DDoS protection |

### Số lượng và phân bố

- **400+ Edge Locations** trên toàn thế giới
- Nhiều hơn đáng kể so với số Regions
- Phân bố dày đặc ở các khu vực đông dân cư

```
                         User Request
                              │
                              ▼
                    ┌─────────────────┐
                    │  Edge Location  │ ◄── Cache hit? Return immediately
                    │    (nearest)    │
                    └────────┬────────┘
                             │ Cache miss
                             ▼
                    ┌─────────────────┐
                    │ Regional Edge   │ ◄── Check regional cache
                    │     Cache       │
                    └────────┬────────┘
                             │ Cache miss
                             ▼
                    ┌─────────────────┐
                    │     Origin      │ ◄── S3, EC2, ALB, etc.
                    │    (Region)     │
                    └─────────────────┘
```

---

## Regional Edge Caches

### Regional Edge Cache là gì?

**Regional Edge Caches** là một layer trung gian giữa Edge Locations và Origin. Chúng cache nội dung ít được truy cập hơn nhưng chưa hết hạn.

### Đặc điểm

- **Dung lượng lớn hơn** Edge Locations
- **Lưu trữ lâu hơn** cho nội dung ít phổ biến
- **Giảm tải** cho Origin servers
- Nằm trong các **AWS Region**

---

## Local Zones

### Local Zone là gì?

**Local Zones** mở rộng Region đến gần người dùng hơn cho các workload yêu cầu **latency cực thấp** (single-digit milliseconds).

```
┌─────────────────────────────────────────────────────────────┐
│                    Parent Region                             │
│                  (e.g., us-west-2)                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     AZ-a     │  │     AZ-b     │  │     AZ-c     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
    ┌───────────────┐           ┌───────────────┐
    │  Local Zone   │           │  Local Zone   │
    │  Los Angeles  │           │   Boston      │
    │ us-west-2-lax │           │ us-east-1-bos │
    └───────────────┘           └───────────────┘
```

### Use Cases

- **Media & Entertainment**: Video rendering, live streaming
- **Gaming**: Real-time multiplayer gaming
- **Machine Learning**: ML inference at the edge
- **AR/VR**: Augmented/Virtual reality applications
- **Healthcare**: Real-time medical imaging

### Đặc điểm

| Đặc điểm | Mô tả |
|----------|-------|
| **VPC Extension** | Local Zone là extension của VPC trong parent Region |
| **Subset of Services** | Không phải tất cả services đều available |
| **Own Subnets** | Cần tạo subnet riêng cho Local Zone |
| **Naming** | Ví dụ: `us-west-2-lax-1a`, `us-east-1-bos-1a` |

---

## Wavelength Zones

### Wavelength Zone là gì?

**Wavelength Zones** đưa AWS compute và storage services đến **trong mạng 5G** của các nhà mạng viễn thông. Được thiết kế cho **ultra-low latency** mobile applications.

```
┌────────────────────────────────────────────────────────────────┐
│                    5G Mobile Network                          │
│                                                                │
│   📱 ──── 📶 ──── ┌──────────────────┐ ──── ┌───────────┐      │
│   5G            │  Wavelength Zone  │     │  AWS      │      │
│   User          │  (inside carrier  │◄────│  Region   │      │
│                 │   network)        │     │           │      │
│                 └──────────────────┘     └───────────┘      │
│                                                                │
│   Ultra-low latency (single-digit ms)                         │
└────────────────────────────────────────────────────────────────┘
```

### Use Cases

- **Connected Vehicles**: Autonomous driving, V2X communication
- **IoT**: Industrial IoT, smart cities
- **AR/VR**: Mobile AR/VR applications
- **Real-time Gaming**: Mobile gaming with ultra-low latency
- **ML Inference**: Real-time ML at the mobile edge

### Carrier Partners

- Verizon (US)
- Vodafone (UK, Germany)
- KDDI (Japan)
- SK Telecom (South Korea)

---

## AWS Outposts

### AWS Outposts là gì?

**AWS Outposts** mang AWS infrastructure, services, tools đến **on-premises data center** hoặc co-location facility của bạn. Đây là **hybrid cloud** solution.

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud                               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                     AWS Region                      │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│   │  │  AZ-a   │  │  AZ-b   │  │  AZ-c   │             │   │
│   │  └─────────┘  └─────────┘  └─────────┘             │   │
│   └─────────────────────────┬───────────────────────────┘   │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │ Private Connection
                              │ (Direct Connect recommended)
┌─────────────────────────────┼───────────────────────────────┐
│                             ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              AWS Outposts Rack                      │   │
│   │  ┌─────────────────────────────────────────────┐    │   │
│   │  │ Native AWS Services: EC2, EBS, S3, RDS...   │    │   │
│   │  │ Same APIs, tools, and management console    │    │   │
│   │  └─────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│                Your Data Center / On-premises               │
└─────────────────────────────────────────────────────────────┘
```

### Use Cases

- **Data Residency**: Dữ liệu phải ở trong nước/vùng cụ thể
- **Low Latency**: Applications cần gần on-premises systems
- **Local Data Processing**: Xử lý dữ liệu tại chỗ trước khi gửi lên cloud
- **Migration**: Bước đầu trong quá trình cloud migration

### Loại Outposts

| Loại | Mô tả |
|------|-------|
| **Outposts Rack** | Full rack với compute, storage, networking (42U) |
| **Outposts Servers** | 1U/2U servers cho không gian hạn chế |

---

## Points of Presence (PoPs)

**Points of Presence (PoPs)** là thuật ngữ chung chỉ tất cả các điểm hiện diện của AWS bên ngoài Regions:

- Edge Locations
- Regional Edge Caches
- Local Zones
- Wavelength Zones

---

## Choosing a Region

Khi chọn Region để deploy, cân nhắc các yếu tố sau:

### 1. Compliance & Data Governance
- Dữ liệu có phải ở trong nước/vùng cụ thể không?
- Ví dụ: GDPR yêu cầu dữ liệu EU citizen ở EU

### 2. Proximity to Users
- Chọn Region gần người dùng cuối để giảm latency
- Ví dụ: Người dùng Việt Nam → `ap-southeast-1` (Singapore)

### 3. Available Services
- Không phải tất cả services đều available ở mọi Region
- Services mới thường ra mắt ở `us-east-1` trước

### 4. Pricing
- Giá khác nhau giữa các Regions
- Ví dụ: `us-east-1` thường rẻ hơn các Regions khác

```
Decision Tree:

┌─────────────────────────────────────────┐
│ Data residency requirements?            │
└────────────┬────────────────────────────┘
             │
             ▼
     ┌───────────────┐
 Yes │ Choose Region │ No
     │ that complies │──────────────────────┐
     └───────────────┘                      ▼
                               ┌────────────────────────┐
                               │ Where are your users?  │
                               └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │ Services available?    │
                               └───────────┬────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │ Compare pricing        │
                               └────────────────────────┘
```

---

## Summary Comparison

| Component | Số lượng | Purpose | Latency | Services |
|-----------|----------|---------|---------|----------|
| **Regions** | 30+ | Full AWS services | N/A | All services |
| **AZs** | 100+ | HA within Region | 1-2ms within Region | All services |
| **Edge Locations** | 400+ | Caching, DNS | Lowest to users | CloudFront, Route 53, WAF |
| **Local Zones** | 30+ | Low latency compute | Single-digit ms | Subset of services |
| **Wavelength Zones** | 20+ | 5G mobile edge | Ultra-low ms | Limited services |
| **Outposts** | N/A | On-premises | Your network | Subset of services |

---

## Exam Tips

> [!IMPORTANT]
> **Key points for AWS Certification Exams:**

### Regions & AZs
- ✅ Mỗi Region có **ít nhất 3 AZs** (thường là 3-6)
- ✅ AZs trong cùng Region kết nối qua **high-speed private network**
- ✅ Data **không tự động replicate** giữa các Regions
- ✅ **Multi-AZ deployment** là cách để đạt High Availability

### Edge Locations
- ✅ Edge Locations **nhiều hơn Regions** (400+ vs 30+)
- ✅ **CloudFront, Route 53, Global Accelerator** sử dụng Edge Locations
- ✅ Edge Locations dùng cho **caching và DNS**, không phải compute

### Local Zones vs Wavelength Zones
- ✅ **Local Zones**: Mở rộng Region cho latency thấp (media, gaming)
- ✅ **Wavelength Zones**: Trong mạng 5G của carriers (IoT, connected vehicles)

### Outposts
- ✅ **Outposts**: AWS infrastructure trong data center của bạn
- ✅ Dùng cho **data residency** và **hybrid cloud** use cases
- ✅ Same AWS APIs và tools

### Choosing a Region
- ✅ **Compliance** → Ưu tiên cao nhất
- ✅ **Latency** → Chọn gần người dùng
- ✅ **Service availability** → Check xem service có available không
- ✅ **Pricing** → Varies by region

---

## Related Documents

- [Global Applications Architecture](./global-applications-architecture.md)
- [CloudFront](./cloudfront.md)
- [Route 53](./route53.md)
- [VPC](./vpc.md)

---

*Last updated: February 2026*
