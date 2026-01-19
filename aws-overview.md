# AWS Overview

## Lịch sử AWS (AWS History)

### Nguồn gốc
Trong những ngày đầu vận hành Amazon.com, đội ngũ Amazon nhận ra việc **provision và quản lý IT infrastructure** rất khó khăn và tốn kém. Điều này khiến các team tài năng bị phân tâm khỏi việc đổi mới sáng tạo.

### Timeline các mốc quan trọng

| Năm | Sự kiện |
|-----|---------|
| **2002** | Amazon bắt đầu cung cấp web services (tiền thân AWS) |
| **2004** | Ra mắt **SQS** (Simple Queue Service) - dịch vụ AWS đầu tiên |
| **Mar 2006** | Ra mắt **Amazon S3** (Simple Storage Service) - giải quyết bài toán lưu trữ dữ liệu |
| **Aug 2006** | Ra mắt **Amazon EC2** (Elastic Compute Cloud) - compute on-demand |
| **2007** | Ra mắt SimpleDB |
| **2008** | Ra mắt CloudFront (CDN), Elastic Block Store (EBS) |
| **2009** | Ra mắt VPC, RDS, Auto Scaling, Elastic Load Balancing |
| **2010** | Ra mắt Route 53, SNS, IAM |
| **2012** | Ra mắt DynamoDB, Redshift |
| **2014** | Ra mắt **Lambda** (Serverless computing) - thay đổi cách nghĩ về compute |
| **2016** | Ra mắt Lightsail, Step Functions |
| **2017** | Ra mắt Fargate, SageMaker |
| **2018** | Ra mắt AWS Outposts (hybrid cloud) |
| **2023-2024** | Tập trung vào **Generative AI**: Bedrock, Q, Trainium, Inferentia |

### Tầm nhìn của AWS
> *"Bất kỳ ai—kể cả một sinh viên trong phòng ký túc xá—cũng có thể truy cập cùng công nghệ mạnh mẽ như những công ty lớn nhất thế giới."*

AWS đã **democratize technology** (dân chủ hóa công nghệ), giúp startup và doanh nghiệp lớn đều có thể tiếp cận hạ tầng IT đẳng cấp thế giới.

---

## AWS Global Infrastructure

AWS xây dựng hạ tầng toàn cầu với các thành phần chính:

### Regions
- Là **khu vực địa lý** độc lập (vd: `ap-southeast-1` = Singapore)
- Mỗi region **hoàn toàn tách biệt** với region khác → fault isolation
- Chọn region dựa trên:
  - **Latency**: gần user nhất
  - **Compliance**: yêu cầu pháp lý về data residency
  - **Pricing**: giá khác nhau giữa các region
  - **Service availability**: không phải service nào cũng có ở mọi region

### Availability Zones (AZ)
- Là **1 hoặc nhiều data center** trong 1 region
- Mỗi region có **tối thiểu 3 AZ**
- Các AZ trong cùng region:
  - Kết nối **low-latency, high-bandwidth** (< 2ms)
  - **Cách ly vật lý**: nguồn điện, cooling, networking riêng
  - Cách nhau **hàng chục km** để tránh thiên tai ảnh hưởng cùng lúc

```
                    AWS Global Infrastructure
    ┌─────────────────────────────────────────────────────────┐
    │                     Region: ap-southeast-1              │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
    │  │   AZ-1a     │  │   AZ-1b     │  │   AZ-1c     │      │
    │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │      │
    │  │ │ DC  DC  │ │  │ │ DC  DC  │ │  │ │ DC  DC  │ │      │
    │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │      │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
    │         └────────────────┼────────────────┘             │
    │                    Low-latency links                    │
    └─────────────────────────────────────────────────────────┘
```

### Tại sao AWS xây tối thiểu 3 AZ?

**AWS xây 3 AZ** ≠ **Bạn phải dùng 3 AZ**

| | AWS (nhà cung cấp) | Bạn (khách hàng) |
|---|---|---|
| **Quyết định** | Xây tối thiểu 3 AZ mỗi region | Chọn deploy vào 1, 2, hoặc 3+ AZ |
| **Lý do** | Đảm bảo infrastructure có HA | Tùy nhu cầu và budget |

**Lý do cần 3 AZ (không phải 2)**:
1. **Quorum (đa số phiếu)**: Distributed systems cần "đa số đồng ý" để hoạt động
   - 3 AZ → 1 fail → còn 2/3 = đa số → hệ thống tiếp tục
   - 2 AZ → 1 fail → còn 1/2 = không đa số → không quyết định được
2. **Redundancy thực sự**: 3 AZ fail 1 → còn 2 (vẫn có dự phòng)

**Nếu bạn chỉ deploy vào 1 AZ**:
- ✅ Rẻ hơn (không tốn tiền replicate, cross-AZ traffic)
- ❌ Rủi ro cao: AZ đó fail → app của bạn **down hoàn toàn**

```
Ví dụ: Deploy EC2 chỉ ở AZ-1a

AZ-1a gặp sự cố (mất điện, lỗi mạng...)
    ↓
App của bạn DOWN
    ↓
AWS vẫn hoạt động (AZ-1b, AZ-1c chạy bình thường)
    ↓
Nhưng bạn không có gì ở đó → không giúp được gì
```

**Khuyến nghị**:
- **Dev/Test**: 1 AZ (tiết kiệm chi phí)
- **Production non-critical**: 2 AZ
- **Production critical**: 3+ AZ

### Local Zones

**Local Zone là gì?**
- "Chi nhánh nhỏ" của Region, đặt **gần population centers** hơn
- Cung cấp **single-digit millisecond latency** (< 10ms)

**Local Zone khác gì Region?**

| | Region | Local Zone |
|---|---|---|
| **Quy mô** | Lớn, nhiều AZ | Nhỏ, 1-2 data centers |
| **Services** | 200+ services đầy đủ | Chỉ ~20 services (EC2, EBS, VPC, ELB...) |
| **Độc lập** | Hoàn toàn độc lập | Thuộc về 1 parent Region |
| **Giá** | Giá chuẩn | **Đắt hơn ~10-20%** |

**Ví dụ**:
```
Region: ap-southeast-1 (Singapore)
    ├── AZ-1a, AZ-1b, AZ-1c  ← đầy đủ 200+ services
    │
    └── Local Zone: Bangkok  ← chỉ EC2, EBS, VPC...
                               (thuộc về Singapore Region)

App cho user Bangkok:
  - Deploy ở Singapore: ~20-30ms latency
  - Deploy ở Local Zone Bangkok: ~5ms latency
```

**Khi nào cần Local Zone?**

| Use case | Yêu cầu latency | Cần Local Zone? |
|----------|-----------------|-----------------|
| Website thông thường | < 100ms | ❌ Region đủ |
| Video streaming | < 50ms | ❌ Dùng CloudFront |
| Real-time gaming | < 10ms | ✅ Cần |
| Video editing/rendering | < 10ms | ✅ Cần |
| AR/VR, Live trading | < 5ms | ✅ Cần |

**Chi phí**:
- EC2, EBS: **đắt hơn Region ~10-20%**
- Data transfer: có phí riêng (Local Zone specific rates)
- Phí enable: miễn phí (chỉ trả khi dùng resources)

→ **Chỉ dùng khi thực sự CẦN low latency**, không dùng để tiết kiệm tiền.

Nguồn: [AWS Local Zones Pricing](https://aws.amazon.com/about-aws/global-infrastructure/localzones/pricing/)

### Wavelength Zones
- Đặt trong **5G networks** của các nhà mạng
- **Ultra-low latency** cho mobile applications
- Use case: AR/VR, connected vehicles, real-time gaming

### Edge Locations

**Edge Location là gì?**
- Là **điểm cache** của AWS đặt khắp thế giới (**600+ điểm**)
- Dùng chủ yếu cho **CloudFront (CDN)** và **Route 53 (DNS)**
- **Không chạy EC2, Lambda** - chỉ cache và serve content

**Cách hoạt động (CloudFront)**:
```
User ở Hà Nội request image.jpg

Lần 1 (Cache miss):
User → Edge Location Hà Nội → Regional Edge Cache → Origin (S3 Singapore)
                 ↓
         Cache lại image.jpg

Lần 2+ (Cache hit):
User → Edge Location Hà Nội → Trả về ngay (không cần đến Origin)
                 ↓
         Response time: ~5-10ms thay vì ~50ms
```

**So sánh với Region/Local Zone**:

| | Region | Local Zone | Edge Location |
|---|---|---|---|
| **Chức năng** | Chạy mọi thứ | Chạy compute gần user | Chỉ cache content |
| **Services** | 200+ | ~20 | CloudFront, Route 53, WAF, Shield |
| **Số lượng** | 33 | 30+ | **600+** |
| **Use case** | Backend, DB | Low-latency compute | Static content, CDN |

**Khi nào dùng Edge Location (CloudFront)?**

| Content type | Dùng CloudFront? | Lý do |
|--------------|------------------|-------|
| Images, CSS, JS | ✅ Nên dùng | Cache tốt, giảm latency |
| Video streaming | ✅ Nên dùng | Giảm buffering |
| API responses (dynamic) | ⚠️ Tùy trường hợp | Cache nếu data ít thay đổi |
| Real-time data | ❌ Không | Data thay đổi liên tục, không cache được |

**Regional Edge Cache**:
- Là layer cache **giữa Edge Location và Origin**
- Giữ content lâu hơn Edge Location
- Giảm requests về Origin server

```
                    Kiến trúc caching của CloudFront
    
    User → Edge Location (POP) → Regional Edge Cache → Origin (S3/EC2)
              (600+)                  (13)              (1)
           Cache ngắn hạn         Cache dài hạn      Source of truth
```

**Chi phí**: Không tính phí riêng cho Edge Location, chỉ tính theo:
- Data transfer out (GB)
- Số requests (HTTP/HTTPS)

Nguồn: [How CloudFront delivers content](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowCloudFrontWorks.html)

### AWS Outposts

**AWS Outposts là gì?**
- AWS infrastructure đặt **tại data center của bạn** (on-premises)
- Chạy **cùng APIs, tools, services** như trên AWS Region
- AWS **quản lý, bảo trì, cập nhật** hardware và software

**Tại sao cần Outposts?**
```
Vấn đề: Một số workloads không thể chạy hoàn toàn trên cloud

1. Data residency: Luật yêu cầu data phải ở trong nước/công ty
2. Low latency: Cần <1ms latency đến hệ thống on-premises
3. Local data processing: Xử lý data tại chỗ trước khi gửi lên cloud
4. Legacy integration: Kết nối với hệ thống cũ không thể migrate
```

**2 loại Outposts**:

| | Outposts Rack | Outposts Server |
|---|---|---|
| **Kích thước** | 42U rack (như tủ server) | 1U hoặc 2U server |
| **Capacity** | Lớn (nhiều EC2, EBS, S3) | Nhỏ (1-2 servers) |
| **Use case** | Data center lớn | Văn phòng nhỏ, retail stores, factories |
| **Services** | EC2, EBS, S3, RDS, EKS, EMR... | EC2, EBS |

**Cách hoạt động**:
```
                    Kết nối Outposts với AWS Region

┌─────────────────────────────────────────────────────────────┐
│                Your Data Center                             │
│  ┌───────────────────────────────────────┐                  │
│  │           AWS Outposts                │                  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐            │                  │
│  │  │ EC2 │  │ EBS │  │ S3  │            │                  │
│  │  └─────┘  └─────┘  └─────┘            │                  │
│  │         VPC Subnet (extension)        │                  │
│  └───────────────────┬───────────────────┘                  │
│                      │ Service Link (encrypted VPN)         │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   AWS Region    │
              │  (Control Plane)│
              │   ap-southeast-1│
              └─────────────────┘
```

**Outposts là extension của VPC**:
- Subnet trên Outposts thuộc về VPC của Region
- EC2 trên Outposts có thể communicate với EC2 trên Region qua private IP
- Quản lý tập trung từ AWS Console/CLI

**Chi phí**:
- **Không mua đứt** - thuê theo **hợp đồng 3 năm**
- 3 options: All Upfront, Partial Upfront, No Upfront
- Bao gồm: delivery, installation, maintenance, patches
- **Thêm phí**: OS licenses, data transfer, AWS services khác
- **Yêu cầu**: AWS Enterprise Support hoặc Enterprise On-Ramp

**Khi nào dùng Outposts?**

| Situation | Dùng Outposts? | Alternative |
|-----------|----------------|-------------|
| Data phải ở trong nước (compliance) | ✅ Có thể | Kiểm tra xem có Region trong nước không |
| Cần <1ms latency đến on-prem systems | ✅ Nên dùng | - |
| Muốn hybrid cloud với cùng APIs | ✅ Nên dùng | - |
| Chỉ cần low latency cho users | ❌ Không | Dùng Local Zone hoặc CloudFront |
| Startup, không có data center | ❌ Không | Dùng Region |

Nguồn: [How AWS Outposts works](https://docs.aws.amazon.com/outposts/latest/network-userguide/how-outposts-works.html)

---

## Global Services vs Regional Services

AWS services được chia thành 3 loại dựa trên phạm vi hoạt động:

### 1. Global Services
- Hoạt động **trên toàn thế giới**, không thuộc region cụ thể
- Tạo 1 lần, dùng được ở mọi region
- Control plane thường ở `us-east-1`

| Service | Mô tả | Ghi chú |
|---------|-------|---------|
| **IAM** | Identity and Access Management | Users, Roles, Policies là global |
| **Route 53** | DNS service | Globally distributed |
| **CloudFront** | CDN | Edge locations toàn cầu |
| **WAF** | Web Application Firewall | Khi dùng với CloudFront |
| **Shield** | DDoS protection | Global |
| **Artifact** | Compliance reports | Global |
| **Organizations** | Multi-account management | Global |

### 2. Regional Services
- Hoạt động **trong 1 region cụ thể**
- Tạo ở region nào, chỉ dùng được ở region đó
- Replicate qua Multi-AZ trong region để HA

| Service | Mô tả | Cần chọn region |
|---------|-------|-----------------|
| **EC2** | Virtual machines | ✅ |
| **RDS** | Managed databases | ✅ |
| **Lambda** | Serverless compute | ✅ |
| **VPC** | Virtual network | ✅ |
| **S3** | Object storage | ✅ (bucket thuộc 1 region) |
| **DynamoDB** | NoSQL database | ✅ |
| **SQS** | Message queue | ✅ |
| **SNS** | Notification service | ✅ |
| **ECS/EKS** | Container services | ✅ |
| **Secrets Manager** | Secrets storage | ✅ |

### 3. Zonal Services
- Hoạt động **trong 1 Availability Zone cụ thể**
- Nếu AZ đó fail → service fail
- Cần tự deploy Multi-AZ để HA

| Service | Mô tả | Ghi chú |
|---------|-------|---------|
| **EC2 instance** | VM chạy trong 1 AZ | Cần Auto Scaling + Multi-AZ |
| **EBS volume** | Block storage | Gắn với 1 AZ, cần snapshot để backup |
| **RDS Single-AZ** | Database 1 AZ | Nên dùng Multi-AZ cho production |

### Tại sao quan trọng?

```
Ví dụ: Bạn tạo EC2 ở Singapore (ap-southeast-1)

→ EC2 đó KHÔNG thấy được ở Tokyo (ap-northeast-1)
→ Nhưng IAM user bạn tạo thì dùng được ở cả 2 regions

IAM User (Global) ──┬──→ ap-southeast-1 (Singapore) → EC2, RDS, S3...
                    │
                    └──→ ap-northeast-1 (Tokyo) → EC2, RDS, S3...
```

### Lưu ý về S3

S3 buckets là **regional** nhưng có **global namespace**:
- Bucket name phải unique **toàn cầu** (không ai khác dùng được tên đó)
- Nhưng data thực sự nằm trong **1 region bạn chọn**
- Có thể bật Cross-Region Replication nếu cần

```
s3://my-unique-bucket-name
        │
        └── Data thực sự ở: ap-southeast-1 (Singapore)
            (không tự động replicate sang region khác)
```

Nguồn: [AWS Fault Isolation Boundaries](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/global-services.html)

---

## Quy mô hiện tại (2024)

| Thành phần | Số lượng |
|------------|----------|
| Services | **200+** |
| Regions | **33** |
| Availability Zones | **105** |
| Local Zones | **30+** |
| Edge Locations | **400+** |
| Khách hàng | Hàng triệu (Netflix, Airbnb, NASA, Samsung...) |

---

## Cách chọn Region

```
                    Quyết định chọn Region
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Compliance?         Latency?            Pricing?
        │                   │                   │
   Data phải ở       User ở đâu?         So sánh giá
   trong nước?       → chọn gần          giữa regions
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    Service availability?
                    (Kiểm tra service cần dùng có ở region đó không)
```

**Ví dụ thực tế**:
- App cho user Việt Nam → chọn `ap-southeast-1` (Singapore) hoặc `ap-east-1` (Hong Kong)
- Yêu cầu data phải ở trong EU → chọn `eu-west-1` (Ireland) hoặc `eu-central-1` (Frankfurt)

---

## Tài liệu tham khảo
- [AWS - Our Origins](https://aws.amazon.com/about-aws/our-origins/)
- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/)
- [AWS Regions and Availability Zones](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions-availability-zones.html)
