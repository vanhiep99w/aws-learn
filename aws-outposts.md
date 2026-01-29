# AWS Outposts

## Tổng quan

**AWS Outposts** là dịch vụ cho phép bạn chạy **AWS infrastructure và services ngay tại data center của bạn** (on-premises). Đây là giải pháp **Hybrid Cloud** thực sự của AWS.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS Outposts Architecture                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────┐          ┌─────────────────────────────────┐  │
│   │   AWS Region        │          │   Your Data Center              │  │
│   │   ┌─────────────┐   │   VPN/   │   ┌─────────────────────────┐   │  │
│   │   │ Parent AZ   │   │  Direct  │   │    AWS Outposts Rack    │   │  │
│   │   │             │◄──┼──Connect─┼──►│                         │   │  │
│   │   │ Control     │   │          │   │  ┌─────┐ ┌─────┐ ┌────┐ │   │  │
│   │   │ Plane       │   │          │   │  │ EC2 │ │ EBS │ │ S3 │ │   │  │
│   │   └─────────────┘   │          │   │  └─────┘ └─────┘ └────┘ │   │  │
│   │                     │          │   │  ┌─────┐ ┌─────┐ ┌────┐ │   │  │
│   │                     │          │   │  │ ECS │ │ RDS │ │EKS │ │   │  │
│   │                     │          │   │  └─────┘ └─────┘ └────┘ │   │  │
│   │                     │          │   └─────────────────────────┘   │  │
│   └─────────────────────┘          └─────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tại sao cần AWS Outposts?

### Use Cases chính

| Use Case | Mô tả |
|----------|-------|
| **Low Latency** | Ứng dụng cần latency cực thấp (< 10ms) với local users/devices |
| **Data Residency** | Dữ liệu phải ở trong quốc gia/khu vực theo quy định pháp luật |
| **Local Data Processing** | Xử lý dữ liệu tại chỗ trước khi gửi lên cloud |
| **Migration** | Bước chuyển tiếp từ on-prem lên cloud |

### So sánh với các giải pháp khác

| Feature | AWS Outposts | AWS Local Zones | AWS Wavelength |
|---------|--------------|-----------------|----------------|
| **Location** | Your data center | AWS-managed facility near cities | Telecom 5G edge |
| **Ownership** | AWS owns & manages | AWS owns & manages | AWS owns & manages |
| **Control** | You control physical security | AWS controls all | AWS controls all |
| **Primary Use** | Hybrid cloud, data residency | Ultra-low latency for cities | 5G mobile apps |
| **Latency** | Depends on your setup | Single-digit ms | Single-digit ms |

## Hai loại Outposts

### 1. Outposts Rack (42U)

```
┌──────────────────────────────────────┐
│         Outposts Rack (42U)          │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │     Compute Servers            │  │
│  │   (EC2 Instances)              │  │
│  ├────────────────────────────────┤  │
│  │     Storage                    │  │
│  │   (EBS, S3 on Outposts)        │  │
│  ├────────────────────────────────┤  │
│  │     Networking                 │  │
│  │   (VPC, ALB, etc.)             │  │
│  ├────────────────────────────────┤  │
│  │     Power & Cooling            │  │
│  │   (Your responsibility)        │  │
│  └────────────────────────────────┘  │
│                                      │
│  Size: Standard 42U rack             │
│  Power: 5-15 kW per rack             │
│  Network: 1-100 Gbps to AWS Region   │
└──────────────────────────────────────┘
```

- **Full rack** hoặc **partial rack** (1U, 2U servers)
- Hỗ trợ **nhiều AWS services** nhất
- Phù hợp cho **enterprise data centers**

### 2. Outposts Servers (1U/2U)

```
┌──────────────────────────────────────┐
│      Outposts Server (1U hoặc 2U)    │
├──────────────────────────────────────┤
│  • Form factor nhỏ gọn               │
│  • Phù hợp không gian hạn chế        │
│  • Chạy EC2 và EBS                   │
│  • Retail stores, branch offices     │
└──────────────────────────────────────┘
```

- **1U hoặc 2U server** nhỏ gọn
- Hỗ trợ ít services hơn (EC2, EBS)
- Phù hợp cho **edge locations** (cửa hàng, chi nhánh)

## AWS Services trên Outposts

### Services được hỗ trợ

| Category | Services |
|----------|----------|
| **Compute** | EC2, ECS, EKS |
| **Storage** | EBS, S3 on Outposts |
| **Database** | RDS, ElastiCache |
| **Networking** | VPC, ALB, Route 53 Resolver |
| **Analytics** | EMR |
| **ML** | SageMaker |

### S3 on Outposts

```
┌─────────────────────────────────────────────────────────────────┐
│                      S3 on Outposts                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────┐     ┌───────────────────────────────┐    │
│  │   S3 on Outposts  │     │   S3 Regional (Standard)      │    │
│  │                   │     │                               │    │
│  │  • Local storage  │     │  • Storage in AWS Region      │    │
│  │  • Access Points  │     │  • Full S3 features           │    │
│  │  • Bucket policy  │     │  • Cross-region replication   │    │
│  └───────────────────┘     └───────────────────────────────┘    │
│                                                                  │
│  Key Differences:                                                │
│  • S3 on Outposts: Data stays LOCAL                             │
│  • Uses Access Points (required) instead of bucket URLs         │
│  • Limited storage capacity (based on Outpost config)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Network Connectivity

### Kết nối đến AWS Region

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Outposts Network Connectivity                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Your Data Center                              AWS Region               │
│   ┌───────────────────┐                    ┌───────────────────┐        │
│   │                   │                    │                   │        │
│   │   ┌───────────┐   │   Service Link     │   ┌───────────┐   │        │
│   │   │ Outposts  │   │═══════════════════►│   │ Control   │   │        │
│   │   │  Rack     │   │  (Encrypted)       │   │ Plane     │   │        │
│   │   │           │   │                    │   └───────────┘   │        │
│   │   │           │   │   Local Gateway    │                   │        │
│   │   │           │◄──┼───────────────────►│   VPC Subnets     │        │
│   │   └───────────┘   │  (Data traffic)    │                   │        │
│   │                   │                    │                   │        │
│   └───────────────────┘                    └───────────────────┘        │
│                                                                          │
│   Connection Options:                                                    │
│   1. AWS Direct Connect (Recommended - dedicated, consistent)           │
│   2. VPN over Internet (Backup option)                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Service Link

- **Encrypted connection** đến AWS Region
- Dùng cho **management và control plane**
- **Bắt buộc** phải có kết nối liên tục

### Local Gateway (LGW)

- **Routing** giữa Outposts và on-premises network
- Tương tự **Internet Gateway** trong VPC
- Cho phép local resources truy cập Outposts

## Tại sao Outposts cần kết nối đến AWS Region?

> [!NOTE]
> Đây là câu hỏi quan trọng: **Nếu Outposts chạy tại data center của tôi, tại sao vẫn cần kết nối đến AWS Region?**

### Control Plane vs Data Plane

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS Outposts - Control vs Data Plane                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Your Data Center                           AWS Region                      │
│   ┌────────────────────────┐                ┌─────────────────────────┐     │
│   │     OUTPOSTS           │                │                         │     │
│   │  ┌──────────────────┐  │   Service Link │  ┌───────────────────┐  │     │
│   │  │   DATA PLANE     │  │◄══════════════►│  │  CONTROL PLANE    │  │     │
│   │  │                  │  │   (Encrypted)  │  │                   │  │     │
│   │  │  • EC2 chạy apps │  │                │  │  • API Gateway    │  │     │
│   │  │  • EBS lưu data  │  │                │  │  • IAM Auth       │  │     │
│   │  │  • S3 storage    │  │                │  │  • CloudWatch     │  │     │
│   │  │  • Network flows │  │                │  │  • Billing        │  │     │
│   │  │                  │  │                │  │  • Provisioning   │  │     │
│   │  └──────────────────┘  │                │  │  • Updates        │  │     │
│   │                        │                │  └───────────────────┘  │     │
│   └────────────────────────┘                └─────────────────────────┘     │
│                                                                              │
│   DATA stays LOCAL ✅                        MANAGEMENT from AWS ✅          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Lý do chính**: AWS quản lý và vận hành Outposts từ xa!

| Phần | Chạy ở đâu | Chức năng |
|------|-----------|-----------|
| **Control Plane** | AWS Region | API, authentication, provisioning, monitoring, updates |
| **Data Plane** | Your DC (Outposts) | Workloads, data, network traffic |

### Kết nối đến AWS Region dùng cho:

| Mục đích | Chi tiết |
|----------|----------|
| **Authentication & Authorization** | IAM validates credentials, kiểm tra permissions |
| **API Calls** | Mọi lệnh `aws ec2`, `aws s3`... đều đi qua Region |
| **Monitoring & Logging** | CloudWatch metrics, CloudTrail logs gửi về Region |
| **Software Updates** | AWS tự động cập nhật firmware, patches |
| **Billing & Metering** | Tracking usage để tính tiền |
| **AWS Services Integration** | Route 53, CloudFormation, Systems Manager... |

### Ví dụ: Tạo EC2 instance trên Outposts

```
   You                  AWS Region              Your Outposts
    │                       │                        │
    │ aws ec2 run-instances │                        │
    │ ─────────────────────►│                        │
    │                       │  IAM check ✓           │
    │                       │  Create command        │
    │                       │───────────────────────►│
    │                       │                        │ Instance created
    │                       │◄───────────────────────│ (runs LOCALLY)
    │       Success         │                        │
    │◄──────────────────────│                        │
    │                       │                        │
    
→ Instance chạy và data lưu LOCAL trên Outposts của bạn!
```

## Quản lý Outposts - Giống hệt AWS Cloud!

> [!IMPORTANT]
> **Điểm mạnh lớn nhất của Outposts**: Bạn dùng **CÙNG Console, CLI, APIs, Tools** như khi làm việc với AWS Cloud!

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Quản lý Outposts - GIỐNG HỆT AWS Cloud                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Bạn dùng:                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│   │  AWS Console    │  │   AWS CLI       │  │   AWS SDK / IaC             │ │
│   │  (Web Portal)   │  │                 │  │   (CDK, Terraform, CF)      │ │
│   └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘ │
│            │                    │                         │                  │
│            └────────────────────┼─────────────────────────┘                  │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌───────────────────────┐                                │
│                    │     AWS Region        │                                │
│                    │     (Control)         │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│              ┌─────────────────┼─────────────────┐                          │
│              ▼                                   ▼                          │
│   ┌──────────────────┐              ┌──────────────────┐                    │
│   │  EC2 trên Cloud  │              │  EC2 trên        │                    │
│   │  (AWS Region)    │              │  OUTPOSTS        │                    │
│   └──────────────────┘              │  (Your DC)       │                    │
│                                     └──────────────────┘                    │
│                                                                              │
│   ✅ CÙNG Console  ✅ CÙNG CLI  ✅ CÙNG APIs  ✅ CÙNG Tools                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### So sánh cách tạo EC2:

```bash
# Tạo EC2 trên Cloud (Region)
aws ec2 run-instances \
  --subnet-id subnet-abc123  # Subnet trong VPC thường

# Tạo EC2 trên Outposts - CHỈ KHÁC SUBNET!
aws ec2 run-instances \
  --subnet-id subnet-xyz789  # Subnet được associate với Outposts
```

Bạn chỉ cần chọn **subnet thuộc Outposts** → Instance tự động chạy trên hardware tại DC của bạn!

### Lợi ích:

- ✅ **Không cần học tool mới** - dùng AWS Console quen thuộc
- ✅ **Code không cần thay đổi** - cùng APIs, SDKs
- ✅ **IaC vẫn hoạt động** - Terraform, CDK, CloudFormation
- ✅ **Team không cần training** - workflow giống hệt

## Pricing Model

### Chi phí bao gồm

| Component | Mô tả |
|-----------|-------|
| **Outposts capacity** | Trả theo 3-year commitment (All Upfront, Partial, No Upfront) |
| **Data transfer** | Data transfer OUT từ Outposts |
| **Direct Connect** | Nếu sử dụng Direct Connect |
| **Power & Cooling** | Bạn tự chi trả |
| **Physical space** | Bạn tự chi trả |

### Không có chi phí thêm cho

- EC2 instances chạy trên Outposts
- EBS volumes trên Outposts  
- S3 storage trên Outposts (đã bao gồm trong capacity)

## So sánh Outposts vs Hybrid Solutions khác

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    Hybrid Cloud Solutions Comparison                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  AWS Outposts   │  │  VMware Cloud   │  │  Azure Stack / Google       │ │
│  │                 │  │  on AWS         │  │  Anthos                     │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤ │
│  │ • Native AWS    │  │ • VMware tools  │  │ • Multi-cloud focus         │ │
│  │ • Same APIs     │  │ • vSphere, NSX  │  │ • K8s-based                 │ │
│  │ • AWS managed   │  │ • Hybrid VMware │  │ • Different APIs            │ │
│  │ • Your DC       │  │ • AWS Region    │  │                             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## High Availability & Disaster Recovery

### HA Considerations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Outposts HA Architecture                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Primary Site                          Secondary Site                   │
│   ┌─────────────────┐                  ┌─────────────────┐              │
│   │  Outposts #1    │                  │  Outposts #2    │              │
│   │  ┌───────────┐  │                  │  ┌───────────┐  │              │
│   │  │ App + DB  │  │  ──Replication─► │  │ Standby   │  │              │
│   │  └───────────┘  │                  │  └───────────┘  │              │
│   └────────┬────────┘                  └────────┬────────┘              │
│            │                                    │                        │
│            └──────────┬─────────────────────────┘                        │
│                       │                                                  │
│                       ▼                                                  │
│               ┌───────────────┐                                          │
│               │  AWS Region   │                                          │
│               │  (Control)    │                                          │
│               └───────────────┘                                          │
│                                                                          │
│   Best Practices:                                                        │
│   • Deploy across multiple Outposts                                      │
│   • Use AWS Region as DR target                                          │
│   • Replicate data to S3 in Region                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Disconnected Operation

Khi mất kết nối với AWS Region:

| Feature | Behavior |
|---------|----------|
| **Running instances** | Tiếp tục chạy bình thường |
| **Local data access** | Vẫn hoạt động |
| **New instance launches** | ❌ Không thể |
| **API calls to AWS** | ❌ Không thể |
| **Authentication** | Cached credentials work temporarily |

## Exam Tips (SAA-C03)

> [!IMPORTANT]
> **Những điểm cần nhớ cho kỳ thi:**

1. **Outposts = AWS infrastructure tại data center của bạn**
2. **Cần kết nối liên tục** đến AWS Region (Direct Connect hoặc VPN)
3. **Use cases chính**: Low latency, data residency, hybrid cloud
4. **2 loại**: Rack (42U, full services) và Server (1U/2U, EC2+EBS only)
5. **S3 on Outposts** dùng Access Points, không dùng bucket URL như S3 thường
6. **Pricing**: 3-year commitment, bạn trả power & cooling

### Câu hỏi thường gặp

| Scenario | Answer |
|----------|--------|
| Cần chạy AWS tại on-prem với latency thấp | **AWS Outposts** |
| Cần data residency trong nước | **AWS Outposts** |
| Cần S3-compatible storage tại on-prem | **S3 on Outposts** |
| Cần hybrid cloud với VMware tools | **VMware Cloud on AWS** |
| Cần ultra-low latency cho mobile 5G | **AWS Wavelength** |
| Cần low latency cho city users | **AWS Local Zones** |

## Tổng kết

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AWS Outposts - Summary                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ WHAT: AWS infrastructure tại data center của bạn                    │
│                                                                          │
│  ✅ WHY:                                                                 │
│     • Low latency requirements                                           │
│     • Data residency compliance                                          │
│     • Hybrid cloud architecture                                          │
│                                                                          │
│  ✅ HOW:                                                                 │
│     • AWS ships & installs hardware                                      │
│     • AWS manages & maintains                                            │
│     • You provide power, cooling, space, network                         │
│                                                                          │
│  ✅ TYPES:                                                               │
│     • Outposts Rack (42U) - Full services                               │
│     • Outposts Server (1U/2U) - EC2 + EBS only                          │
│                                                                          │
│  ✅ SERVICES: EC2, EBS, S3, ECS, EKS, RDS, ElastiCache, ALB...          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tài liệu tham khảo

- [AWS Outposts Official Documentation](https://docs.aws.amazon.com/outposts/)
- [AWS Outposts FAQs](https://aws.amazon.com/outposts/faqs/)
- [AWS Outposts Pricing](https://aws.amazon.com/outposts/pricing/)
